"""Read-only Mikael OS integration status and typed deferred proposals.

This module deliberately owns no connector, credential, session authority or
data store.  It normalizes existing Mikael OS read models and can build a
strict proposal preview.  It never posts to Hermes, starts or controls a
session, or writes configuration/data.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Mapping

try:
    from fastapi import APIRouter, Body
except Exception:  # pragma: no cover - dashboard runtime provides FastAPI
    class APIRouter:  # type: ignore
        def get(self, *_args: Any, **_kwargs: Any):
            return lambda fn: fn

        def post(self, *_args: Any, **_kwargs: Any):
            return lambda fn: fn

    def Body(default: Any = None, **_kwargs: Any) -> Any:  # type: ignore
        return default


Reader = Callable[[], Dict[str, Any]]
_SESSION_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{5,199}$")
_TURN_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{5,199}$")
_MISSION_ID_RE = re.compile(r"^mis_[0-9]{8}T[0-9]{6}Z_[0-9a-f]{12}$")
_ALLOWED_REQUEST_FIELDS = frozenset(
    {
        "action", "dryRun", "dry_run", "missionId", "mission_id", "backend",
        "sessionId", "session_id", "turnId", "turn_id", "instruction", "reason",
    }
)

_PROPOSALS: Dict[str, Dict[str, Any]] = {
    "whoop_enable_detail_read": {
        "category": "connector_setup",
        "workspace": "private",
        "target": "whoop",
        "requiredGate": "prod_restart",
        "requiredCapability": None,
        "decisionAuthority": "operator",
        "label": "WHOOP-Detailzugriff anbinden",
    },
    "freescout_enable_read": {
        "category": "connector_setup",
        "workspace": "company_signal",
        "target": "freescout",
        "requiredGate": "prod_restart",
        "requiredCapability": None,
        "decisionAuthority": "operator",
        "label": "FreeScout-Lesezugriff anbinden",
    },
    "journal_select_read_source": {
        "category": "source_selection",
        "workspace": "private",
        "target": "journal",
        "requiredGate": None,
        "requiredCapability": None,
        "decisionAuthority": "operator",
        "label": "Privaten Journal-Read-Store auswählen",
    },
    "goals_habits_select_read_source": {
        "category": "source_selection",
        "workspace": "private",
        "target": "goals_habits",
        "requiredGate": None,
        "requiredCapability": None,
        "decisionAuthority": "operator",
        "label": "Ziele-/Habits-Wahrheit auswählen",
    },
    "session_continue": {
        "category": "session_control",
        "workspace": "engineering",
        "target": "agent_session",
        "requiredGate": None,
        "requiredCapability": "delta-orchestrator:agent_session_continue",
        "decisionAuthority": "session_control_policy",
        "label": "Session fortsetzen",
    },
    "session_steer": {
        "category": "session_control",
        "workspace": "engineering",
        "target": "agent_session",
        "requiredGate": None,
        "requiredCapability": "delta-orchestrator:agent_session_steer",
        "decisionAuthority": "session_control_policy",
        "label": "Session steuern",
    },
    "session_interrupt": {
        "category": "session_control",
        "workspace": "engineering",
        "target": "agent_session",
        "requiredGate": None,
        "requiredCapability": "delta-orchestrator:agent_session_interrupt",
        "decisionAuthority": "session_control_policy",
        "label": "Session unterbrechen",
    },
}


def _safe_read(reader: Reader) -> Dict[str, Any]:
    try:
        value = reader()
    except Exception as exc:  # noqa: BLE001 - status must degrade, never break shell
        return {"state": "error", "note": f"Read-Modell fehlgeschlagen: {type(exc).__name__}"}
    return value if isinstance(value, dict) else {"state": "error", "note": "Read-Modell ungültig"}


def _state(value: Mapping[str, Any]) -> str:
    state = str(value.get("state") or "unavailable")
    return state if state in {"fresh", "stale", "empty", "partial", "unavailable", "error"} else "error"


def _proposal_card(action: str) -> Dict[str, Any]:
    spec = _PROPOSALS[action]
    return {
        "action": action,
        "label": spec["label"],
        "category": spec["category"],
        "requiredGate": spec["requiredGate"],
        "requiredCapability": spec["requiredCapability"],
        "decisionAuthority": spec["decisionAuthority"],
        "proposeOnly": True,
        "execution": "deferred",
        "willFire": False,
        "bindingRequired": spec["category"] == "session_control",
    }


def build_readiness(readers: Mapping[str, Reader]) -> Dict[str, Any]:
    """Normalize existing read models without inventing connector data."""

    required = {"whoop", "freescout", "journal", "goals", "sessions", "control_plane"}
    if set(readers) != required or any(not callable(readers[key]) for key in required):
        raise ValueError("readers must provide the exact Mikael OS readiness contract")

    whoop = _safe_read(readers["whoop"])
    freescout = _safe_read(readers["freescout"])
    journal = _safe_read(readers["journal"])
    goals = _safe_read(readers["goals"])
    sessions = _safe_read(readers["sessions"])
    control_plane = _safe_read(readers["control_plane"])

    journal_connected = bool(journal.get("connected"))
    goal_hierarchy = goals.get("goalHierarchy") if isinstance(goals.get("goalHierarchy"), dict) else {}
    habits = goals.get("habits") if isinstance(goals.get("habits"), dict) else {}
    goals_ready = all(
        _state(row) in {"fresh", "stale", "empty"}
        and bool(row.get("sourceKind"))
        and row.get("sourceKind") != "konzept"
        for row in (goal_hierarchy, habits)
    )
    strands = sessions.get("strands") if isinstance(sessions.get("strands"), list) else []
    broker_strands = [row for row in strands if isinstance(row, dict) and row.get("id") in {"codex", "claude"}]
    inventory_ready = {row.get("id") for row in broker_strands} == {"codex", "claude"} and all(
        _state(row) not in {"unavailable", "error", "partial"} for row in broker_strands
    )

    connectors = [
        {
            "id": "whoop",
            "workspace": "private",
            "state": _state(whoop),
            "source": whoop.get("source"),
            "configured": _state(whoop) not in {"unavailable", "error"},
            "readPathReady": _state(whoop) in {"fresh", "stale", "empty"},
            "readOnly": True,
            "proposal": _proposal_card("whoop_enable_detail_read"),
            "note": whoop.get("note"),
        },
        {
            "id": "freescout",
            "workspace": "company_signal",
            "state": _state(freescout),
            "source": freescout.get("source"),
            "configured": _state(freescout) not in {"unavailable", "error", "partial"},
            "readPathReady": _state(freescout) in {"fresh", "stale", "empty"},
            "readOnly": True,
            "proposal": _proposal_card("freescout_enable_read"),
            "note": freescout.get("note"),
        },
        {
            "id": "journal",
            "workspace": "private",
            "state": "partial" if journal_connected else "unavailable",
            "source": "configured private Journal read store" if journal_connected else None,
            "configured": journal_connected,
            "readPathReady": False,
            "readOnly": True,
            "proposal": _proposal_card("journal_select_read_source"),
            "note": journal.get("note"),
        },
        {
            "id": "goals_habits",
            "workspace": "private",
            "state": "fresh" if goals_ready else "unavailable",
            "source": None,
            "configured": goals_ready,
            "readPathReady": goals_ready,
            "readOnly": True,
            "proposal": _proposal_card("goals_habits_select_read_source"),
            "note": goals.get("note"),
        },
        {
            "id": "session_control",
            "workspace": "engineering",
            "state": "fresh" if inventory_ready else "unavailable",
            "source": "session-broker inventory :18087",
            "configured": bool(broker_strands),
            "readPathReady": inventory_ready,
            "readOnly": True,
            "executionAvailable": False,
            "controlPlaneReachable": bool(control_plane.get("reachable")),
            "proposals": [
                _proposal_card("session_continue"),
                _proposal_card("session_steer"),
                _proposal_card("session_interrupt"),
            ],
            "note": "Inventory only; Bind/Continue/Steer/Interrupt are never executed here.",
        },
    ]
    return {
        "schema": "mikael-os.integration-readiness.v1",
        "mode": "read_only",
        "readOnly": True,
        "executed": False,
        "observedAt": datetime.now(timezone.utc).isoformat(),
        "connectors": connectors,
        "summary": {
            "readPathsReady": sum(1 for row in connectors if row.get("readPathReady") is True),
            "total": len(connectors),
            "sessionExecutionAvailable": False,
        },
    }


def typed_proposal(payload: Mapping[str, Any]) -> Dict[str, Any]:
    """Build a deterministic preview; there is intentionally no dispatch seam."""

    if not isinstance(payload, Mapping) or set(payload) - _ALLOWED_REQUEST_FIELDS:
        return {"ok": False, "status": "invalid", "executed": False, "willFire": False}
    action = str(payload.get("action") or "").strip()
    spec = _PROPOSALS.get(action)
    if spec is None:
        return {"ok": False, "status": "invalid", "executed": False, "willFire": False}

    session_id = str(payload.get("sessionId") or payload.get("session_id") or "").strip()
    mission_id = str(payload.get("missionId") or payload.get("mission_id") or "").strip()
    backend = str(payload.get("backend") or "").strip()
    turn_id = str(payload.get("turnId") or payload.get("turn_id") or "").strip()
    instruction = str(payload.get("instruction") or "").strip()
    reason = str(payload.get("reason") or "").strip()
    is_session = spec["category"] == "session_control"
    if is_session and (
        not _MISSION_ID_RE.fullmatch(mission_id)
        or backend not in {"codex", "claude"}
        or not _SESSION_ID_RE.fullmatch(session_id)
    ):
        return {"ok": False, "status": "invalid_binding", "executed": False, "willFire": False}
    if not is_session and (mission_id or backend or session_id or turn_id or instruction or reason):
        return {"ok": False, "status": "invalid_fields", "executed": False, "willFire": False}
    if action in {"session_continue", "session_steer"} and not instruction:
        return {"ok": False, "status": "instruction_required", "executed": False, "willFire": False}
    if action in {"session_steer", "session_interrupt"} and not _TURN_ID_RE.fullmatch(turn_id):
        return {"ok": False, "status": "turn_required", "executed": False, "willFire": False}
    if action == "session_interrupt" and not reason:
        return {"ok": False, "status": "reason_required", "executed": False, "willFire": False}
    if len(instruction) > 2000 or len(reason) > 500:
        return {"ok": False, "status": "text_too_long", "executed": False, "willFire": False}

    params: Dict[str, Any] = {}
    if is_session:
        params.update({"mission_id": mission_id, "backend": backend, "session_id": session_id})
        if instruction:
            params["prompt"] = instruction
        if turn_id:
            params["turn_id"] = turn_id
        if reason:
            params["reason"] = reason
    identity = json.dumps(
        {"action": action, "target": spec["target"], "params": params},
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    idempotency_key = f"mikael-os-preview:{hashlib.sha256(identity).hexdigest()[:24]}"
    if is_session:
        params["idempotency_key"] = idempotency_key
    intent = {
        "action": action,
        "category": spec["category"],
        "workspace": spec["workspace"],
        "target": spec["target"],
        "params": params,
        "requiredGate": spec["requiredGate"],
        "requiredCapability": spec["requiredCapability"],
        "decisionAuthority": spec["decisionAuthority"],
        "authority": "external",
        "idempotencyKey": idempotency_key,
        "authorityAttested": False,
        "bindingVerified": False,
    }
    return {
        "ok": True,
        "status": "preview",
        "mode": "dry_run",
        "requestedLive": payload.get("dryRun", payload.get("dry_run", True)) is False,
        "proposeOnly": True,
        "execution": "deferred",
        "executed": False,
        "willFire": False,
        "intent": intent,
        "note": "Nur typisierte Vorschau; nichts gespeichert, gesendet oder ausgeführt.",
    }


def register_routes(router: APIRouter, readers: Mapping[str, Reader]) -> None:
    """Mount the two bounded routes onto the existing Mikael OS router."""

    @router.get("/integrations/readiness")
    def integration_readiness_route() -> Dict[str, Any]:
        return build_readiness(readers)

    @router.post("/integrations/propose")
    def integration_proposal_route(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
        return typed_proposal(payload if isinstance(payload, dict) else {})


__all__ = ["build_readiness", "register_routes", "typed_proposal"]
