"""Contracts for the learning intake foundation."""

from __future__ import annotations

import json
import subprocess
import sys
from copy import deepcopy
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
PLUGIN = ROOT / "plugins" / "mikael-os"
sys.path.insert(0, str(PLUGIN))

from learning_intake.contracts import (  # noqa: E402
    ContractError,
    confirmation_card,
    dedup_key,
    validate_manifest,
)
from learning_intake.direct_context import (  # noqa: E402
    DirectContextError,
    build_pdf_manifest,
    extract_pdf_pages,
)

SOURCE_SHA = "a" * 64


def manifest(source_format: str = "pdf") -> dict:
    kind = "page" if source_format == "pdf" else "slide"
    tenant = "uni:tum"
    return {
        "schema_version": "learning-intake.v1",
        "workspace": "studium",
        "isolation": {
            "domain": "university",
            "tenant_id": tenant,
            "business_sources_allowed": False,
            "business_write_allowed": False,
        },
        "module_id": "thermodynamik-1",
        "exam_id": "thermodynamik-ws26",
        "exam": {
            "date": "2026-12-18",
            "form": "written",
            "aids": [{"label": "Formelsammlung", "status": "allowed"}],
        },
        "source": {
            "scope": "university",
            "format": source_format,
            "file_name": f"hauptsaetze.{source_format}",
            "intake_path": f"/study-intake/hauptsaetze.{source_format}",
            "sha256": SOURCE_SHA,
            "bytes": 1234,
        },
        "dedup_key": dedup_key(tenant, SOURCE_SHA),
        "units": [{
            "unit_id": f"{kind}:1",
            "kind": kind,
            "number": 1,
            "citation": f"sha256:{SOURCE_SHA}#{kind}=1",
            "text_scope": "full",
            "source_sha256": SOURCE_SHA,
            "render_assets": [{
                "asset_id": "render:1",
                "media_type": "image/png",
                "relative_path": "renders/1.png",
                "sha256": "b" * 64,
            }],
            "extracted_text": "Energieerhaltung",
            "evidence": [{
                "kind": "ocr",
                "producer": "fixture",
                "content": "Energieerhaltung",
                "structured_fields": {"heading": "Hauptsatz"},
                "confidence": 0.91,
                "review_required": True,
                "authority": "evidence_only",
            }],
        }],
        "learning_objectives": [{
            "objective_id": "lo-1",
            "text": "Hauptsatz anwenden",
            "provenance_refs": [f"{kind}:1"],
        }],
        "ingestion": {
            "state": "awaiting_confirmation",
            "history": [
                {"state": "dropped", "at": "2026-07-18T16:00:00Z", "actor": "intake"},
                {"state": "awaiting_confirmation", "at": "2026-07-18T16:00:01Z", "actor": "validator"},
            ],
        },
    }


@pytest.mark.parametrize("source_format", ["pdf", "pptx"])
def test_pdf_and_pptx_keep_page_or_slide_provenance(source_format: str) -> None:
    value = manifest(source_format)
    assert validate_manifest(value) == value


def test_confirmation_card_is_read_only_and_review_aware() -> None:
    card = confirmation_card(manifest())
    assert card["workspace"] == "studium"
    assert card["dry_run"] is True
    assert card["will_write"] is False
    assert card["writes"] == []
    assert card["summary"]["review_required_items"] == 1


@pytest.mark.parametrize("key", ["mandant", "customer_id", "object_address"])
def test_university_manifest_rejects_company_routing_keys(key: str) -> None:
    value = manifest()
    value[key] = "not-allowed"
    with pytest.raises(ContractError, match="routing keys"):
        validate_manifest(value)


def test_source_must_be_explicitly_university_scoped() -> None:
    value = manifest()
    value["source"]["scope"] = "company"
    with pytest.raises(ContractError, match="source.scope"):
        validate_manifest(value)


def test_dedup_is_tenant_scoped_and_provenance_sha_must_match() -> None:
    value = manifest()
    value["dedup_key"] = dedup_key("uni:other", SOURCE_SHA)
    value["units"][0]["source_sha256"] = "c" * 64
    with pytest.raises(ContractError) as raised:
        validate_manifest(value)
    assert "dedup_key" in str(raised.value)
    assert "source_sha256" in str(raised.value)


def test_ocr_and_vision_are_evidence_with_confidence_and_review() -> None:
    value = manifest()
    item = deepcopy(value["units"][0]["evidence"][0])
    item.update(kind="vision", authority="canonical", confidence=2)
    item.pop("review_required")
    value["units"][0]["evidence"] = [item]
    with pytest.raises(ContractError) as raised:
        validate_manifest(value)
    assert "evidence_only" in str(raised.value)
    assert "confidence" in str(raised.value)
    assert "review_required" in str(raised.value)


def test_approved_state_requires_an_approval_receipt() -> None:
    value = manifest()
    value["ingestion"]["state"] = "approved"
    value["ingestion"]["history"].append({"state": "approved"})
    with pytest.raises(ContractError, match="approval_id"):
        validate_manifest(value)


def test_cli_prints_card_without_changing_input(tmp_path: Path) -> None:
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(manifest()), encoding="utf-8")
    before = path.read_bytes()
    completed = subprocess.run(
        [sys.executable, "-m", "learning_intake.cli", "confirmation-card", str(path)],
        cwd=PLUGIN,
        text=True,
        capture_output=True,
        check=False,
    )
    assert completed.returncode == 0, completed.stderr
    result = json.loads(completed.stdout)
    assert result["card"]["will_write"] is False
    assert path.read_bytes() == before


def _poppler_runner(commands: list[list[str]]):
    def run(command: list[str], _timeout: float) -> subprocess.CompletedProcess[str]:
        commands.append(command)
        if command[0] == "pdfinfo":
            return subprocess.CompletedProcess(command, 0, "Pages:          2\n", "")
        if command[0] == "pdftotext":
            return subprocess.CompletedProcess(
                command,
                0,
                "Erster Hauptsatz\n\f\nCarnot-Wirkungsgrad\n\f",
                "",
            )
        raise AssertionError(f"unexpected command: {command}")

    return run


def test_direct_context_pdf_is_sha_idempotent_cited_and_write_free(tmp_path: Path) -> None:
    first = tmp_path / "skript-a.pdf"
    second = tmp_path / "skript-b.pdf"
    first.write_bytes(b"%PDF-1.4\nsame-content")
    second.write_bytes(first.read_bytes())
    commands: list[list[str]] = []
    runner = _poppler_runner(commands)
    kwargs = {
        "tenant_id": "uni:tum",
        "module_id": "thermodynamik-1",
        "exam_id": "thermodynamik-ws26",
        "exam_date": "2026-12-18",
        "question": "Erkläre die Hauptsätze.",
        "observed_at": "2026-07-19T00:00:00Z",
        "runner": runner,
    }

    manifest_a = build_pdf_manifest(first, **kwargs)
    manifest_b = build_pdf_manifest(second, **kwargs)

    assert manifest_a["source"]["sha256"] == manifest_b["source"]["sha256"]
    assert manifest_a["dedup_key"] == manifest_b["dedup_key"]
    assert manifest_a["units"][0]["citation"].endswith("#page=1")
    assert manifest_a["units"][1]["citation"].endswith("#page=2")
    assert manifest_a["learning_objectives"][0]["provenance_refs"] == ["page:1", "page:2"]
    direct = manifest_a["direct_context"]
    assert direct["mode"] == "direct_context"
    assert direct["embedding_requested"] is False
    assert direct["graph_write_requested"] is False
    assert direct["durable_write_requested"] is False
    assert direct["answer_ready"] is True
    assert direct["extractor"] == "poppler-pdftotext"
    assert direct["citations"] == [unit["citation"] for unit in manifest_a["units"]]
    assert direct["readable_pages"] == [1, 2]
    assert direct["needs_vision_pages"] == []
    assert direct["partition_required"] is False
    assert direct["selected_partition"] is None
    assert direct["partitions"] == []
    assert [item["page"] for item in direct["page_map"]] == [1, 2]
    assert all(unit["text_scope"] == "full" for unit in manifest_a["units"])
    assert {command[0] for command in commands} == {"pdfinfo", "pdftotext"}


def test_direct_context_marks_blank_pages_for_deferred_vision(tmp_path: Path) -> None:
    source = tmp_path / "mixed.pdf"
    source.write_bytes(b"%PDF-1.4\nmixed")

    def runner(command: list[str], _timeout: float) -> subprocess.CompletedProcess[str]:
        if command[0] == "pdfinfo":
            return subprocess.CompletedProcess(command, 0, "Pages: 2\n", "")
        return subprocess.CompletedProcess(command, 0, "Textseite\f\f", "")

    result = build_pdf_manifest(
        source,
        tenant_id="uni:tum",
        module_id="mechanik",
        exam_id="mechanik-2026",
        exam_date="2026-08-25",
        question="Was ist prüfungsrelevant?",
        observed_at="2026-07-19T00:00:00Z",
        runner=runner,
    )

    assert result["direct_context"]["readable_pages"] == [1]
    assert result["direct_context"]["needs_vision_pages"] == [2]
    assert result["units"][1]["evidence"] == []


def test_large_pdf_returns_deterministic_page_map_before_partition_selection(
    tmp_path: Path,
) -> None:
    source = tmp_path / "large-script.pdf"
    source.write_bytes(b"%PDF-1.4\nlarge")
    runner = _poppler_runner([])

    result = build_pdf_manifest(
        source,
        tenant_id="uni:tum",
        module_id="mechanik",
        exam_id="mechanik-2026",
        exam_date="2026-08-25",
        question="Was ist prüfungsrelevant?",
        observed_at="2026-07-19T00:00:00Z",
        max_text_chars=20,
        partition_text_chars=20,
        page_excerpt_chars=5,
        runner=runner,
    )

    direct = result["direct_context"]
    assert direct["partition_required"] is True
    assert direct["answer_ready"] is False
    assert direct["selected_partition"] is None
    assert [(part["start_page"], part["end_page"]) for part in direct["partitions"]] == [
        (1, 1),
        (2, 2),
    ]
    assert [item["citation"] for item in direct["page_map"]] == direct["citations"]
    assert all(unit["text_scope"] == "excerpt" for unit in result["units"])
    assert direct["context_text_chars"] <= direct["context_text_budget"]
    assert direct["embedding_requested"] is False
    assert direct["graph_write_requested"] is False
    assert direct["durable_write_requested"] is False


def test_selected_partition_loads_full_pages_and_keeps_other_pages_bounded(
    tmp_path: Path,
) -> None:
    source = tmp_path / "large-script.pdf"
    source.write_bytes(b"%PDF-1.4\nlarge")

    result = build_pdf_manifest(
        source,
        tenant_id="uni:tum",
        module_id="mechanik",
        exam_id="mechanik-2026",
        exam_date="2026-08-25",
        question="Was ist prüfungsrelevant?",
        observed_at="2026-07-19T00:00:00Z",
        max_text_chars=20,
        partition_text_chars=20,
        page_excerpt_chars=5,
        selected_partition=1,
        runner=_poppler_runner([]),
    )

    direct = result["direct_context"]
    assert direct["answer_ready"] is True
    assert direct["selected_partition"] == 1
    assert result["units"][0]["text_scope"] == "full"
    assert result["units"][1]["text_scope"] == "excerpt"
    assert direct["context_text_chars"] <= direct["context_text_budget"]


def test_direct_context_rejects_large_or_image_only_pdf(tmp_path: Path) -> None:
    source = tmp_path / "scan.pdf"
    source.write_bytes(b"%PDF-1.4\nscan")
    with pytest.raises(DirectContextError, match="byte limit"):
        extract_pdf_pages(source, max_bytes=1, runner=_poppler_runner([]))

    def blank_runner(command: list[str], _timeout: float) -> subprocess.CompletedProcess[str]:
        if command[0] == "pdfinfo":
            return subprocess.CompletedProcess(command, 0, "Pages: 1\n", "")
        return subprocess.CompletedProcess(command, 0, "\f", "")

    with pytest.raises(DirectContextError, match="OCR/Vision"):
        extract_pdf_pages(source, runner=blank_runner)


def test_direct_context_accepts_two_hundred_page_text_pdf(tmp_path: Path) -> None:
    source = tmp_path / "two-hundred-pages.pdf"
    source.write_bytes(b"%PDF-1.4\n200-pages")

    def runner(command: list[str], _timeout: float) -> subprocess.CompletedProcess[str]:
        if command[0] == "pdfinfo":
            return subprocess.CompletedProcess(command, 0, "Pages: 200\n", "")
        return subprocess.CompletedProcess(command, 0, "\f".join(["Lernstoff"] * 200) + "\f", "")

    _path, _sha, _size, pages = extract_pdf_pages(source, runner=runner)

    assert len(pages) == 200
    assert pages[0] == "Lernstoff"
    assert pages[-1] == "Lernstoff"
