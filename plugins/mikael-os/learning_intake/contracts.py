"""Pure validation contracts for learning intake."""

from __future__ import annotations

import hashlib
import re
from copy import deepcopy
from datetime import date
from pathlib import PurePosixPath
from typing import Any, Mapping

SCHEMA_VERSION = "learning-intake.v1"
STATES = {"dropped", "analyzing", "awaiting_confirmation", "approved", "rejected", "failed"}
FORMS = {"written", "oral", "practical", "take_home", "other"}
FORMATS = {"pdf": "page", "pptx": "slide"}
EVIDENCE_KINDS = {"native_text", "ocr", "vision"}
FORBIDDEN_ROUTING_KEYS = {"mandant", "customer_id", "customer_number", "object_address", "fsm_id"}
ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{1,127}$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")


class ContractError(ValueError):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("; ".join(errors))


def dedup_key(tenant_id: str, source_sha256: str) -> str:
    material = f"{tenant_id}\0{source_sha256}".encode()
    return "sha256:" + hashlib.sha256(material).hexdigest()


def _obj(value: Any, path: str, errors: list[str]) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        errors.append(f"{path}: object required")
        return {}
    return value


def _text(obj: Mapping[str, Any], key: str, path: str, errors: list[str]) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{path}.{key}: non-empty string required")
        return ""
    return value.strip()


def _sha(value: str, path: str, errors: list[str]) -> None:
    if value and not SHA_RE.fullmatch(value):
        errors.append(f"{path}: lowercase SHA-256 required")


def validate_manifest(manifest: Mapping[str, Any]) -> dict[str, Any]:
    """Validate and defensively copy a manifest without external I/O."""
    if not isinstance(manifest, Mapping):
        raise ContractError(["root: object required"])
    errors: list[str] = []
    if manifest.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version: must be {SCHEMA_VERSION}")
    if manifest.get("workspace") != "studium":
        errors.append("workspace: must be studium")
    leaked = sorted(FORBIDDEN_ROUTING_KEYS.intersection(manifest))
    if leaked:
        errors.append("root: non-university routing keys forbidden: " + ", ".join(leaked))

    isolation = _obj(manifest.get("isolation"), "isolation", errors)
    tenant = _text(isolation, "tenant_id", "isolation", errors)
    if isolation.get("domain") != "university" or not tenant.startswith("uni:"):
        errors.append("isolation: university domain and uni: tenant required")
    if isolation.get("business_sources_allowed") is not False:
        errors.append("isolation.business_sources_allowed: must be false")
    if isolation.get("business_write_allowed") is not False:
        errors.append("isolation.business_write_allowed: must be false")

    for key in ("module_id", "exam_id"):
        value = _text(manifest, key, "root", errors)
        if value and not ID_RE.fullmatch(value):
            errors.append(f"{key}: invalid identifier")
    exam = _obj(manifest.get("exam"), "exam", errors)
    exam_date = _text(exam, "date", "exam", errors)
    try:
        if exam_date:
            date.fromisoformat(exam_date)
    except ValueError:
        errors.append("exam.date: YYYY-MM-DD required")
    if exam.get("form") not in FORMS:
        errors.append("exam.form: unsupported")
    if not isinstance(exam.get("aids"), list):
        errors.append("exam.aids: array required")

    source = _obj(manifest.get("source"), "source", errors)
    if source.get("scope") != "university":
        errors.append("source.scope: must be university")
    source_format = source.get("format")
    if source_format not in FORMATS:
        errors.append("source.format: pdf or pptx required")
    name = _text(source, "file_name", "source", errors)
    if source_format in FORMATS and name and not name.lower().endswith(f".{source_format}"):
        errors.append("source.file_name: extension does not match format")
    intake_path = _text(source, "intake_path", "source", errors)
    if intake_path and not str(PurePosixPath(intake_path)).startswith("/"):
        errors.append("source.intake_path: absolute intake path required")
    source_sha = _text(source, "sha256", "source", errors)
    _sha(source_sha, "source.sha256", errors)
    if source.get("bytes") is not None and (
        not isinstance(source["bytes"], int) or source["bytes"] < 0
    ):
        errors.append("source.bytes: non-negative integer required")
    if tenant and source_sha and manifest.get("dedup_key") != dedup_key(tenant, source_sha):
        errors.append("dedup_key: tenant-scoped source SHA mismatch")

    units = manifest.get("units")
    refs: set[str] = set()
    if not isinstance(units, list) or not units:
        errors.append("units: non-empty array required")
        units = []
    for index, raw in enumerate(units):
        path = f"units[{index}]"
        unit = _obj(raw, path, errors)
        unit_id = _text(unit, "unit_id", path, errors)
        refs.add(unit_id)
        if unit.get("kind") != FORMATS.get(source_format):
            errors.append(f"{path}.kind: must match PDF page or PPTX slide")
        if not isinstance(unit.get("number"), int) or unit.get("number", 0) < 1:
            errors.append(f"{path}.number: positive 1-based integer required")
        citation = _text(unit, "citation", path, errors)
        anchor = FORMATS.get(source_format)
        expected_citation = f"sha256:{source_sha}#{anchor}={unit.get('number')}"
        if citation and citation != expected_citation:
            errors.append(f"{path}.citation: must be {expected_citation}")
        if unit.get("text_scope") not in {"full", "excerpt"}:
            errors.append(f"{path}.text_scope: full or excerpt required")
        if unit.get("source_sha256") != source_sha:
            errors.append(f"{path}.source_sha256: must match source")
        assets = unit.get("render_assets")
        if not isinstance(assets, list):
            errors.append(f"{path}.render_assets: array required")
            assets = []
        for asset_index, raw_asset in enumerate(assets):
            asset_path = f"{path}.render_assets[{asset_index}]"
            asset = _obj(raw_asset, asset_path, errors)
            _text(asset, "asset_id", asset_path, errors)
            _text(asset, "media_type", asset_path, errors)
            relative = _text(asset, "relative_path", asset_path, errors)
            if relative and PurePosixPath(relative).is_absolute():
                errors.append(f"{asset_path}.relative_path: must be relative")
            _sha(_text(asset, "sha256", asset_path, errors), f"{asset_path}.sha256", errors)
        if not isinstance(unit.get("extracted_text"), str):
            errors.append(f"{path}.extracted_text: string required")
        evidence = unit.get("evidence")
        if not isinstance(evidence, list):
            errors.append(f"{path}.evidence: array required")
            evidence = []
        for evidence_index, raw_evidence in enumerate(evidence):
            evidence_path = f"{path}.evidence[{evidence_index}]"
            item = _obj(raw_evidence, evidence_path, errors)
            kind = item.get("kind")
            if kind not in EVIDENCE_KINDS:
                errors.append(f"{evidence_path}.kind: unsupported")
            _text(item, "producer", evidence_path, errors)
            confidence = item.get("confidence")
            if isinstance(confidence, bool) or not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
                errors.append(f"{evidence_path}.confidence: 0..1 required")
            if not isinstance(item.get("review_required"), bool):
                errors.append(f"{evidence_path}.review_required: boolean required")
            if kind in {"ocr", "vision"} and item.get("authority") != "evidence_only":
                errors.append(f"{evidence_path}.authority: evidence_only required")
            if not isinstance(item.get("structured_fields"), Mapping):
                errors.append(f"{evidence_path}.structured_fields: object required")

    direct_context_raw = manifest.get("direct_context")
    if direct_context_raw is not None:
        direct_context = _obj(direct_context_raw, "direct_context", errors)
        if direct_context.get("mode") != "direct_context":
            errors.append("direct_context.mode: must be direct_context")
        for key in ("embedding_requested", "graph_write_requested", "durable_write_requested"):
            if direct_context.get(key) is not False:
                errors.append(f"direct_context.{key}: must be false")
        if not isinstance(direct_context.get("answer_ready"), bool):
            errors.append("direct_context.answer_ready: boolean required")
        _text(direct_context, "extractor", "direct_context", errors)
        citations = direct_context.get("citations")
        expected_citations = [unit.get("citation") for unit in units]
        if citations != expected_citations:
            errors.append("direct_context.citations: must match units in page order")
        page_numbers = {unit.get("number") for unit in units}
        readable_pages = direct_context.get("readable_pages")
        needs_vision_pages = direct_context.get("needs_vision_pages")
        if not isinstance(readable_pages, list) or not readable_pages:
            errors.append("direct_context.readable_pages: non-empty array required")
            readable_pages = []
        if not isinstance(needs_vision_pages, list):
            errors.append("direct_context.needs_vision_pages: array required")
            needs_vision_pages = []
        if (
            any(not isinstance(number, int) for number in readable_pages + needs_vision_pages)
            or set(readable_pages).intersection(needs_vision_pages)
            or set(readable_pages).union(needs_vision_pages) != page_numbers
        ):
            errors.append("direct_context page lists: must partition manifest pages")
        partition_required = direct_context.get("partition_required")
        if not isinstance(partition_required, bool):
            errors.append("direct_context.partition_required: boolean required")
        partitions = direct_context.get("partitions")
        if not isinstance(partitions, list):
            errors.append("direct_context.partitions: array required")
            partitions = []
        selected_partition = direct_context.get("selected_partition")
        if selected_partition is not None and (
            not isinstance(selected_partition, int)
            or selected_partition < 1
            or selected_partition > len(partitions)
        ):
            errors.append("direct_context.selected_partition: known partition required")
        if partition_required:
            if not partitions:
                errors.append("direct_context.partitions: required for partitioned context")
            if direct_context.get("answer_ready") != (selected_partition is not None):
                errors.append("direct_context.answer_ready: must reflect partition selection")
        elif partitions or selected_partition is not None or direct_context.get("answer_ready") is not True:
            errors.append("direct_context: unpartitioned context must be answer-ready")
        page_map = direct_context.get("page_map")
        if (
            not isinstance(page_map, list)
            or any(not isinstance(item, Mapping) for item in page_map)
            or [item.get("citation") for item in page_map] != citations
        ):
            errors.append("direct_context.page_map: must match citations in page order")
        for key in ("total_text_chars", "context_text_budget", "context_text_chars"):
            if not isinstance(direct_context.get(key), int) or direct_context.get(key, -1) < 0:
                errors.append(f"direct_context.{key}: non-negative integer required")
        if (
            not isinstance(direct_context.get("context_text_budget"), int)
            or direct_context.get("context_text_budget", 0) < 1
        ):
            errors.append("direct_context.context_text_budget: positive integer required")
        if (
            isinstance(direct_context.get("context_text_chars"), int)
            and isinstance(direct_context.get("context_text_budget"), int)
            and direct_context["context_text_chars"] > direct_context["context_text_budget"]
        ):
            errors.append("direct_context.context_text_chars: exceeds context budget")

    objectives = manifest.get("learning_objectives")
    if not isinstance(objectives, list) or not objectives:
        errors.append("learning_objectives: non-empty array required")
        objectives = []
    for index, raw in enumerate(objectives):
        path = f"learning_objectives[{index}]"
        objective = _obj(raw, path, errors)
        _text(objective, "objective_id", path, errors)
        _text(objective, "text", path, errors)
        provenance = objective.get("provenance_refs")
        if not isinstance(provenance, list) or not provenance or any(ref not in refs for ref in provenance):
            errors.append(f"{path}.provenance_refs: known unit references required")

    ingestion = _obj(manifest.get("ingestion"), "ingestion", errors)
    state = ingestion.get("state")
    if state not in STATES:
        errors.append("ingestion.state: unsupported")
    history = ingestion.get("history")
    if not isinstance(history, list) or not history:
        errors.append("ingestion.history: non-empty history required")
    elif not isinstance(history[-1], Mapping) or history[-1].get("state") != state:
        errors.append("ingestion.history: final transition must match state")
    receipt = ingestion.get("approval")
    if state == "approved":
        receipt = _obj(receipt, "ingestion.approval", errors)
        _text(receipt, "approval_id", "ingestion.approval", errors)
        _text(receipt, "approved_at", "ingestion.approval", errors)
    elif receipt is not None:
        errors.append("ingestion.approval: only valid for approved state")

    if errors:
        raise ContractError(errors)
    return deepcopy(dict(manifest))


def confirmation_card(manifest: Mapping[str, Any]) -> dict[str, Any]:
    """Build a dry-run card; this function cannot approve or persist."""
    valid = validate_manifest(manifest)
    evidence = [item for unit in valid["units"] for item in unit["evidence"]]
    return {
        "schema_version": "learning-intake-confirmation.v1",
        "card_type": "learning_intake_confirmation",
        "workspace": "studium",
        "isolation": deepcopy(valid["isolation"]),
        "module_id": valid["module_id"],
        "exam_id": valid["exam_id"],
        "summary": {
            "exam": deepcopy(valid["exam"]),
            "source": {key: valid["source"][key] for key in ("format", "file_name", "sha256")},
            "dedup_key": valid["dedup_key"],
            "units": len(valid["units"]),
            "render_assets": sum(len(unit["render_assets"]) for unit in valid["units"]),
            "learning_objectives": len(valid["learning_objectives"]),
            "evidence_items": len(evidence),
            "review_required_items": sum(bool(item["review_required"]) for item in evidence),
        },
        "proposed_transition": {
            "from": valid["ingestion"]["state"],
            "to": "approved",
            "gate": "studium_learning_intake",
        },
        "dry_run": True,
        "will_write": False,
        "writes": [],
        "note": "Confirmation only; execution requires a separate gated adapter.",
    }
