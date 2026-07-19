"""Fast, read-only direct-context extraction for bounded text PDFs."""

from __future__ import annotations

import hashlib
import re
import subprocess
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .contracts import dedup_key, validate_manifest

DEFAULT_MAX_BYTES = 20 * 1024 * 1024
DEFAULT_MAX_PAGES = 200
DEFAULT_MAX_TEXT_CHARS = 300_000
DEFAULT_PARTITION_TEXT_CHARS = 100_000
DEFAULT_PAGE_EXCERPT_CHARS = 500
_PAGES_RE = re.compile(r"^Pages:\s*(\d+)\s*$", re.MULTILINE)


class DirectContextError(ValueError):
    """A PDF cannot enter the bounded direct-context lane."""


CommandRunner = Callable[[list[str], float], subprocess.CompletedProcess[str]]


def _run_command(command: list[str], timeout: float) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            command,
            capture_output=True,
            check=False,
            text=True,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise DirectContextError(f"required extractor is unavailable: {command[0]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise DirectContextError(f"PDF extraction timed out in {command[0]}") from exc


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _page_count(path: Path, runner: CommandRunner, timeout: float) -> int:
    completed = runner(["pdfinfo", str(path)], timeout)
    if completed.returncode != 0:
        raise DirectContextError("pdfinfo could not read the PDF")
    match = _PAGES_RE.search(completed.stdout or "")
    if not match:
        raise DirectContextError("pdfinfo did not report a page count")
    return int(match.group(1))


def _split_pages(text: str, page_count: int) -> list[str]:
    pages = text.replace("\r\n", "\n").replace("\r", "\n").split("\f")
    if len(pages) == page_count + 1 and not pages[-1].strip():
        pages.pop()
    if len(pages) < page_count:
        pages.extend([""] * (page_count - len(pages)))
    elif len(pages) > page_count:
        pages = pages[: page_count - 1] + ["\f".join(pages[page_count - 1 :])]
    return [page.rstrip() for page in pages]


def extract_pdf_pages(
    source_path: str | Path,
    *,
    max_bytes: int = DEFAULT_MAX_BYTES,
    max_pages: int = DEFAULT_MAX_PAGES,
    timeout: float = 20.0,
    runner: CommandRunner = _run_command,
) -> tuple[Path, str, int, list[str]]:
    """Extract bounded page text without network, embeddings, graph, or writes."""
    path = Path(source_path).expanduser().resolve(strict=True)
    if not path.is_file() or path.suffix.lower() != ".pdf":
        raise DirectContextError("source must be a readable PDF file")
    size = path.stat().st_size
    if size <= 0:
        raise DirectContextError("PDF is empty")
    if size > max_bytes:
        raise DirectContextError(f"PDF exceeds direct-context byte limit ({max_bytes})")

    source_sha = _sha256(path)
    pages = _page_count(path, runner, timeout)
    if pages < 1:
        raise DirectContextError("PDF has no pages")
    if pages > max_pages:
        raise DirectContextError(f"PDF exceeds direct-context page limit ({max_pages})")

    completed = runner(
        ["pdftotext", "-layout", "-enc", "UTF-8", str(path), "-"],
        timeout,
    )
    if completed.returncode != 0:
        raise DirectContextError("pdftotext could not extract the PDF")
    extracted = _split_pages(completed.stdout or "", pages)
    if not any(page.strip() for page in extracted):
        raise DirectContextError("PDF has no native text; route it to the OCR/Vision lane")
    return path, source_sha, size, extracted


def _partition_pages(pages: list[str], limit: int, source_sha: str) -> list[dict[str, Any]]:
    if limit < 1:
        raise DirectContextError("partition text budget must be positive")
    partitions: list[dict[str, Any]] = []
    current_pages: list[int] = []
    current_chars = 0

    def flush() -> None:
        nonlocal current_pages, current_chars
        if not current_pages:
            return
        number = len(partitions) + 1
        partitions.append(
            {
                "partition": number,
                "start_page": current_pages[0],
                "end_page": current_pages[-1],
                "text_chars": current_chars,
                "citations": [
                    f"sha256:{source_sha}#page={page_number}"
                    for page_number in current_pages
                ],
            }
        )
        current_pages = []
        current_chars = 0

    for page_number, text in enumerate(pages, start=1):
        page_chars = len(text)
        if current_pages and current_chars + page_chars > limit:
            flush()
        current_pages.append(page_number)
        current_chars += page_chars
        if page_chars >= limit:
            flush()
    flush()
    return partitions


def build_pdf_manifest(
    source_path: str | Path,
    *,
    tenant_id: str,
    module_id: str,
    exam_id: str,
    exam_date: str,
    question: str,
    exam_form: str = "written",
    observed_at: str | None = None,
    max_bytes: int = DEFAULT_MAX_BYTES,
    max_pages: int = DEFAULT_MAX_PAGES,
    max_text_chars: int = DEFAULT_MAX_TEXT_CHARS,
    partition_text_chars: int = DEFAULT_PARTITION_TEXT_CHARS,
    page_excerpt_chars: int = DEFAULT_PAGE_EXCERPT_CHARS,
    selected_partition: int | None = None,
    timeout: float = 20.0,
    runner: CommandRunner = _run_command,
) -> dict[str, Any]:
    """Build a cited, SHA-idempotent manifest for the immediate answer lane."""
    if max_text_chars < 1:
        raise DirectContextError("context text budget must be positive")
    if page_excerpt_chars < 0:
        raise DirectContextError("page excerpt budget must not be negative")
    path, source_sha, size, pages = extract_pdf_pages(
        source_path,
        max_bytes=max_bytes,
        max_pages=max_pages,
        timeout=timeout,
        runner=runner,
    )
    question = question.strip()
    if not question:
        raise DirectContextError("question must not be empty")
    timestamp = observed_at or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    readable_pages = [number for number, text in enumerate(pages, start=1) if text.strip()]
    needs_vision_pages = [number for number, text in enumerate(pages, start=1) if not text.strip()]
    objective_hash = hashlib.sha256(question.encode("utf-8")).hexdigest()[:16]
    total_text_chars = sum(len(page) for page in pages)
    partition_required = total_text_chars > max_text_chars
    partitions = _partition_pages(pages, partition_text_chars, source_sha) if partition_required else []
    if selected_partition is not None and not partition_required:
        raise DirectContextError("selected partition is only valid when partitioning is required")
    if selected_partition is not None and not 1 <= selected_partition <= len(partitions):
        raise DirectContextError("selected partition is outside the deterministic page map")
    selected_pages: set[int] = set()
    if selected_partition is not None:
        selected = partitions[selected_partition - 1]
        if selected["text_chars"] > max_text_chars:
            raise DirectContextError(
                "selected partition exceeds the safe context budget; route that page to OCR/Vision chunking"
            )
        selected_pages = set(range(selected["start_page"], selected["end_page"] + 1))
    remaining_context_chars = max_text_chars - sum(
        len(text) for number, text in enumerate(pages, start=1) if number in selected_pages
    )

    units = []
    citations = []
    page_map = []
    for number, text in enumerate(pages, start=1):
        citation = f"sha256:{source_sha}#page={number}"
        citations.append(citation)
        use_full_text = not partition_required or number in selected_pages
        if use_full_text:
            context_text = text
        else:
            excerpt_chars = min(page_excerpt_chars, max(remaining_context_chars, 0))
            context_text = text[:excerpt_chars]
            remaining_context_chars -= len(context_text)
        text_scope = "full" if use_full_text else "excerpt"
        page_map.append(
            {
                "page": number,
                "citation": citation,
                "text_chars": len(text),
                "excerpt": text[:page_excerpt_chars],
            }
        )
        evidence = []
        if context_text.strip():
            evidence.append(
                {
                    "kind": "native_text",
                    "producer": "poppler-pdftotext",
                    "content": context_text,
                    "structured_fields": {
                        "page": number,
                        "text_scope": text_scope,
                        "full_text_chars": len(text),
                    },
                    "confidence": 1.0,
                    "review_required": False,
                    "authority": "evidence_only",
                }
            )
        units.append(
            {
                "unit_id": f"page:{number}",
                "kind": "page",
                "number": number,
                "citation": citation,
                "text_scope": text_scope,
                "source_sha256": source_sha,
                "render_assets": [],
                "extracted_text": context_text,
                "evidence": evidence,
            }
        )

    manifest = {
        "schema_version": "learning-intake.v1",
        "workspace": "studium",
        "isolation": {
            "domain": "university",
            "tenant_id": tenant_id,
            "business_sources_allowed": False,
            "business_write_allowed": False,
        },
        "module_id": module_id,
        "exam_id": exam_id,
        "exam": {"date": exam_date, "form": exam_form, "aids": []},
        "source": {
            "scope": "university",
            "format": "pdf",
            "file_name": path.name,
            "intake_path": str(path),
            "sha256": source_sha,
            "bytes": size,
        },
        "dedup_key": dedup_key(tenant_id, source_sha),
        "direct_context": {
            "mode": "direct_context",
            "embedding_requested": False,
            "graph_write_requested": False,
            "durable_write_requested": False,
            "answer_ready": not partition_required or selected_partition is not None,
            "extractor": "poppler-pdftotext",
            "citations": citations,
            "readable_pages": readable_pages,
            "needs_vision_pages": needs_vision_pages,
            "partition_required": partition_required,
            "selected_partition": selected_partition,
            "partitions": partitions,
            "page_map": page_map,
            "total_text_chars": total_text_chars,
            "context_text_budget": max_text_chars,
            "context_text_chars": sum(len(unit["extracted_text"]) for unit in units),
        },
        "units": units,
        "learning_objectives": [
            {
                "objective_id": f"question-{objective_hash}",
                "text": question,
                "provenance_refs": [f"page:{number}" for number in readable_pages],
            }
        ],
        "ingestion": {
            "state": "analyzing",
            "history": [
                {"state": "analyzing", "at": timestamp, "actor": "direct-context-intake"}
            ],
        },
    }
    return validate_manifest(manifest)
