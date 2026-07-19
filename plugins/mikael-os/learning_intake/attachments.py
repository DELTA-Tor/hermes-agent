"""Shared multi-PDF direct-context adapter for dashboard and gateways.

The adapter consumes local PDF paths. Dashboard uploads may materialize their
request bodies in an ephemeral directory first; messaging gateways already
provide bounded cache paths. This module never persists an upload, calls a
provider, or writes Qdrant, Neo4j, Anki, missions, or business data.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence

from .contracts import validate_manifest
from .direct_context import (
    DEFAULT_MAX_BYTES,
    DEFAULT_MAX_TEXT_CHARS,
    CommandRunner,
    DirectContextError,
    _run_command,
    build_pdf_manifest,
)

MAX_ATTACHMENT_COUNT = 8
MAX_TOTAL_BYTES = 80 * 1024 * 1024
DEFAULT_BUNDLE_MAX_TEXT_CHARS = 1_000_000
_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9ÄÖÜäöüß._ -]+")


@dataclass(frozen=True)
class PdfAttachment:
    """One already-local PDF supplied by a trusted surface adapter."""

    path: Path
    display_name: str
    media_type: str = "application/pdf"
    selected_partition: int | None = None


def _safe_pdf_name(value: str) -> str:
    name = Path(str(value or "")).name.strip()
    name = _SAFE_NAME_RE.sub("_", name)[:180]
    if not name or not name.lower().endswith(".pdf"):
        raise DirectContextError("attachment must have a .pdf file name")
    return name


def _file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _receipt_id(prefix: str, material: Mapping[str, Any]) -> str:
    encoded = json.dumps(
        material,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return prefix + hashlib.sha256(encoded).hexdigest()[:24]


def gateway_pdf_attachments(
    media_paths: Sequence[str | Path],
    *,
    media_types: Sequence[str] | None = None,
    display_names: Sequence[str] | None = None,
    selected_partitions: Sequence[int | None] | None = None,
) -> list[PdfAttachment]:
    """Adapt cached gateway documents (including Telegram) to this lane.

    Gateways download inbound documents before the agent turn and expose local
    cache paths. This function only validates and describes those paths; it
    neither downloads nor copies them and therefore adds no persistence layer.
    """

    if not media_paths:
        raise DirectContextError("at least one PDF attachment is required")
    if len(media_paths) > MAX_ATTACHMENT_COUNT:
        raise DirectContextError(
            f"too many PDF attachments (maximum {MAX_ATTACHMENT_COUNT})"
        )
    result: list[PdfAttachment] = []
    for index, raw_path in enumerate(media_paths):
        path = Path(raw_path).expanduser().resolve(strict=True)
        media_type = (
            str(media_types[index]).split(";", 1)[0].strip().lower()
            if media_types and index < len(media_types)
            else ""
        )
        display = (
            str(display_names[index])
            if display_names and index < len(display_names)
            else path.name
        )
        safe_name = _safe_pdf_name(display)
        if media_type and media_type not in {"application/pdf", "application/octet-stream"}:
            raise DirectContextError("attachment media type must be application/pdf")
        selected = (
            selected_partitions[index]
            if selected_partitions and index < len(selected_partitions)
            else None
        )
        result.append(
            PdfAttachment(
                path=path,
                display_name=safe_name,
                media_type=media_type or "application/pdf",
                selected_partition=selected,
            )
        )
    return result


def analyze_pdf_attachments(
    attachments: Sequence[PdfAttachment],
    *,
    tenant_id: str,
    module_id: str,
    exam_id: str,
    exam_date: str,
    question: str,
    exam_form: str = "written",
    observed_at: str | None = None,
    max_bytes: int = DEFAULT_MAX_BYTES,
    max_total_bytes: int = MAX_TOTAL_BYTES,
    max_context_chars: int = DEFAULT_BUNDLE_MAX_TEXT_CHARS,
    runner: CommandRunner = _run_command,
) -> dict[str, Any]:
    """Analyze a bounded PDF set into one deterministic direct-context receipt."""

    if not attachments:
        raise DirectContextError("at least one PDF attachment is required")
    if len(attachments) > MAX_ATTACHMENT_COUNT:
        raise DirectContextError(
            f"too many PDF attachments (maximum {MAX_ATTACHMENT_COUNT})"
        )
    if max_context_chars < 1:
        raise DirectContextError("bundle context budget must be positive")
    question = str(question or "").strip()
    if not question:
        raise DirectContextError("question must not be empty")

    inspected: list[dict[str, Any]] = []
    total_bytes = 0
    selected_by_sha: dict[str, int | None] = {}
    for attachment in attachments:
        path = Path(attachment.path).expanduser().resolve(strict=True)
        if not path.is_file():
            raise DirectContextError("attachment must be a readable PDF file")
        name = _safe_pdf_name(attachment.display_name)
        if path.suffix.lower() != ".pdf":
            raise DirectContextError("attachment cache path must end in .pdf")
        size = path.stat().st_size
        if size <= 0:
            raise DirectContextError("PDF is empty")
        if size > max_bytes:
            raise DirectContextError(f"PDF exceeds direct-context byte limit ({max_bytes})")
        total_bytes += size
        if total_bytes > max_total_bytes:
            raise DirectContextError(
                f"PDF bundle exceeds direct-context byte limit ({max_total_bytes})"
            )
        sha = _file_sha256(path)
        if sha in selected_by_sha and selected_by_sha[sha] != attachment.selected_partition:
            raise DirectContextError("duplicate PDF requested with conflicting partitions")
        selected_by_sha.setdefault(sha, attachment.selected_partition)
        inspected.append(
            {
                "path": path,
                "name": name,
                "bytes": size,
                "sha256": sha,
                "selected_partition": attachment.selected_partition,
            }
        )

    unique_shas = list(dict.fromkeys(item["sha256"] for item in inspected))
    per_document_budget = min(
        DEFAULT_MAX_TEXT_CHARS,
        max(1, max_context_chars // len(unique_shas)),
    )
    timestamp = observed_at or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    manifests_by_sha: dict[str, dict[str, Any]] = {}
    receipt_by_sha: dict[str, dict[str, Any]] = {}
    for item in inspected:
        sha = item["sha256"]
        if sha in manifests_by_sha:
            continue
        manifest = build_pdf_manifest(
            item["path"],
            tenant_id=tenant_id,
            module_id=module_id,
            exam_id=exam_id,
            exam_date=exam_date,
            question=question,
            exam_form=exam_form,
            observed_at=timestamp,
            max_bytes=max_bytes,
            max_text_chars=per_document_budget,
            selected_partition=item["selected_partition"],
            runner=runner,
        )
        # Uploaded/cache paths are ephemeral implementation details. Preserve
        # the user's display name and expose a stable virtual source path only.
        manifest["source"]["file_name"] = item["name"]
        manifest["source"]["intake_path"] = f"/direct-context/{sha}/{item['name']}"
        manifest = validate_manifest(manifest)
        manifests_by_sha[sha] = manifest
        receipt_by_sha[sha] = {
            "schema_version": "learning-intake-document-receipt.v1",
            "receipt_id": _receipt_id(
                "lidoc-",
                {"tenant_id": tenant_id, "source_sha256": sha},
            ),
            "source_sha256": sha,
            "dedup_key": manifest["dedup_key"],
            "will_write": False,
            "persisted": False,
        }

    occurrences: list[dict[str, Any]] = []
    first_index_by_sha: dict[str, int] = {}
    for index, item in enumerate(inspected):
        sha = item["sha256"]
        first = first_index_by_sha.setdefault(sha, index)
        occurrences.append(
            {
                **receipt_by_sha[sha],
                "input_index": index,
                "file_name": item["name"],
                "bytes": item["bytes"],
                "duplicate": first != index,
                "duplicate_of_input": first if first != index else None,
            }
        )

    manifests = [manifests_by_sha[sha] for sha in unique_shas]
    citations = [
        citation
        for manifest in manifests
        for citation in manifest["direct_context"]["citations"]
    ]
    context_sections: list[str] = []
    needs_vision: list[dict[str, Any]] = []
    for manifest in manifests:
        source = manifest["source"]
        for page in manifest["direct_context"]["needs_vision_pages"]:
            needs_vision.append(
                {
                    "file_name": source["file_name"],
                    "source_sha256": source["sha256"],
                    "page": page,
                    "citation": f"sha256:{source['sha256']}#page={page}",
                }
            )
        page_blocks = [
            f"[{unit['citation']}]\n{unit['extracted_text']}"
            for unit in manifest["units"]
            if unit["extracted_text"].strip()
        ]
        context_sections.append(
            f"## {source['file_name']}\n" + "\n\n".join(page_blocks)
        )
    context_text = "\n\n".join(context_sections)
    context_truncated = len(context_text) > max_context_chars
    if context_truncated:
        context_text = context_text[:max_context_chars]
    answer_ready = not context_truncated and all(
        manifest["direct_context"]["answer_ready"] for manifest in manifests
    )
    bundle_material = {
        "tenant_id": tenant_id,
        "module_id": module_id,
        "exam_id": exam_id,
        "exam_date": exam_date,
        "question": question,
        "source_sha256": sorted(unique_shas),
        "selected_partitions": {
            sha: selected_by_sha[sha] for sha in sorted(unique_shas)
        },
    }
    receipt_id = _receipt_id("libundle-", bundle_material)
    return {
        "schema_version": "learning-intake-bundle.v1",
        "ok": True,
        "mode": "direct_context",
        "workspace": "studium",
        "isolation": {
            "domain": "university",
            "tenant_id": tenant_id,
            "business_sources_allowed": False,
            "business_write_allowed": False,
        },
        "receipt": {
            "schema_version": "learning-intake-bundle-receipt.v1",
            "receipt_id": receipt_id,
            "idempotent": True,
            "persisted": False,
            "will_write": False,
            "writes": [],
        },
        "attachments": occurrences,
        "documents": manifests,
        "direct_context": {
            "answer_ready": answer_ready,
            "embedding_requested": False,
            "graph_write_requested": False,
            "durable_write_requested": False,
            "document_count": len(manifests),
            "input_count": len(inspected),
            "duplicate_count": len(inspected) - len(manifests),
            "total_bytes": total_bytes,
            "context_text_budget": max_context_chars,
            "context_text_chars": len(context_text),
            "context_text": context_text,
            "context_truncated": context_truncated,
            "citations": citations,
            "needs_vision": needs_vision,
            "partition_required": not answer_ready,
        },
        "observed_at": timestamp,
    }
