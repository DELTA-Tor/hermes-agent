"""Fast, read-only direct-context extraction for small text PDFs."""

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
DEFAULT_MAX_PAGES = 40
DEFAULT_MAX_TEXT_CHARS = 300_000
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
    max_text_chars: int = DEFAULT_MAX_TEXT_CHARS,
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
    text_chars = sum(len(page) for page in extracted)
    if text_chars > max_text_chars:
        raise DirectContextError(
            f"PDF exceeds direct-context extracted-text limit ({max_text_chars})"
        )
    if not any(page.strip() for page in extracted):
        raise DirectContextError("PDF has no native text; route it to the OCR/Vision lane")
    return path, source_sha, size, extracted


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
    timeout: float = 20.0,
    runner: CommandRunner = _run_command,
) -> dict[str, Any]:
    """Build a cited, SHA-idempotent manifest for the immediate answer lane."""
    path, source_sha, size, pages = extract_pdf_pages(
        source_path,
        max_bytes=max_bytes,
        max_pages=max_pages,
        max_text_chars=max_text_chars,
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

    units = []
    citations = []
    for number, text in enumerate(pages, start=1):
        citation = f"sha256:{source_sha}#page={number}"
        citations.append(citation)
        evidence = []
        if text.strip():
            evidence.append(
                {
                    "kind": "native_text",
                    "producer": "poppler-pdftotext",
                    "content": text,
                    "structured_fields": {"page": number},
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
                "source_sha256": source_sha,
                "render_assets": [],
                "extracted_text": text,
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
            "answer_ready": True,
            "extractor": "poppler-pdftotext",
            "citations": citations,
            "readable_pages": readable_pages,
            "needs_vision_pages": needs_vision_pages,
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
