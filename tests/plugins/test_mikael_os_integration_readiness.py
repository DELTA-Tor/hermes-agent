"""Behavior contracts for Mikael OS connector and proposal readiness."""

from __future__ import annotations

import importlib.util
from pathlib import Path
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[2]
READINESS_PATH = ROOT / "plugins" / "mikael-os" / "dashboard" / "integration_readiness.py"
PLUGIN_PATH = ROOT / "plugins" / "mikael-os" / "dashboard" / "plugin_api.py"


def _load(path: Path, prefix: str):
    name = f"{prefix}_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_readiness_normalizes_real_states_without_fake_data() -> None:
    module = _load(READINESS_PATH, "mikael_readiness")
    readers = {
        "whoop": lambda: {
            "state": "partial", "source": "WHOOP /healthz", "note": "detail token absent"
        },
        "freescout": lambda: {
            "state": "empty", "source": "FreeScout MariaDB ro", "rows": [], "open": 0
        },
        "journal": lambda: {"connected": False, "note": "no source"},
        "goals": lambda: {
            "goalHierarchy": {"state": "empty", "sourceKind": "konzept"},
            "habits": {"state": "empty", "sourceKind": "konzept"},
            "note": "no truth source",
        },
        "sessions": lambda: {
            "strands": [
                {"id": "codex", "state": "empty"},
                {"id": "claude", "state": "fresh"},
            ]
        },
        "control_plane": lambda: {"reachable": True},
    }

    report = module.build_readiness(readers)
    by_id = {row["id"]: row for row in report["connectors"]}

    assert report["readOnly"] is True and report["executed"] is False
    assert by_id["whoop"]["state"] == "partial"
    assert by_id["whoop"]["readPathReady"] is False
    assert by_id["freescout"]["readPathReady"] is True
    assert by_id["journal"]["state"] == "unavailable"
    assert by_id["goals_habits"]["readPathReady"] is False
    assert by_id["goals_habits"]["configured"] is False
    assert by_id["session_control"]["readPathReady"] is True
    assert by_id["session_control"]["executionAvailable"] is False
    assert all(card["willFire"] is False for card in by_id["session_control"]["proposals"])


def test_every_typed_proposal_stays_deferred_even_when_live_is_requested() -> None:
    module = _load(READINESS_PATH, "mikael_proposals")
    binding = {
        "missionId": "mis_20260719T120000Z_abcdefabcdef",
        "backend": "codex",
        "sessionId": "sess_123456",
    }
    requests = [
        {"action": "whoop_enable_detail_read", "dryRun": False},
        {"action": "freescout_enable_read", "dryRun": False},
        {"action": "journal_select_read_source", "dryRun": False},
        {"action": "goals_habits_select_read_source", "dryRun": False},
        {
            "action": "session_continue", **binding,
            "instruction": "Prüfe den aktuellen Status.", "dryRun": False,
        },
        {
            "action": "session_steer",
            **binding,
            "turnId": "turn_123456",
            "instruction": "Prüfe nur den aktuellen Teststatus.",
            "dryRun": False,
        },
        {
            "action": "session_interrupt",
            **binding,
            "turnId": "turn_123456",
            "reason": "Operator möchte zuerst reviewen.",
            "dryRun": False,
        },
    ]

    for request in requests:
        result = module.typed_proposal(request)
        assert result["ok"] is True
        assert result["requestedLive"] is True
        assert result["execution"] == "deferred"
        assert result["executed"] is False
        assert result["willFire"] is False
        assert result["intent"]["authority"] == "external"
        assert result["intent"]["authorityAttested"] is False
        assert result["intent"]["bindingVerified"] is False
        assert result["intent"]["idempotencyKey"].startswith("mikael-os-preview:")


def test_proposals_reject_untyped_fields_and_incomplete_session_control() -> None:
    module = _load(READINESS_PATH, "mikael_invalid")

    assert module.typed_proposal(
        {"action": "whoop_enable_detail_read", "secret": "must-not-be-accepted"}
    )["ok"] is False
    assert module.typed_proposal({"action": "session_continue"})["status"] == "invalid_binding"
    assert module.typed_proposal(
        {
            "action": "session_steer",
            "missionId": "mis_20260719T120000Z_abcdefabcdef",
            "backend": "codex",
            "sessionId": "sess_123456",
        }
    )["status"] == "instruction_required"
    assert module.typed_proposal(
        {
            "action": "session_interrupt",
            "missionId": "mis_20260719T120000Z_abcdefabcdef",
            "backend": "codex",
            "sessionId": "sess_123456",
        }
    )["status"] == "turn_required"
    assert module.typed_proposal(
        {
            "action": "session_interrupt",
            "missionId": "mis_20260719T120000Z_abcdefabcdef",
            "backend": "codex",
            "sessionId": "sess_123456",
            "turnId": "turn_123456",
        }
    )["status"] == "reason_required"


def test_session_readiness_requires_both_broker_inventories() -> None:
    module = _load(READINESS_PATH, "mikael_inventory")
    readers = {
        "whoop": lambda: {"state": "unavailable"},
        "freescout": lambda: {"state": "unavailable"},
        "journal": lambda: {"connected": False},
        "goals": lambda: {},
        "sessions": lambda: {"strands": [{"id": "codex", "state": "fresh"}]},
        "control_plane": lambda: {"reachable": True},
    }

    report = module.build_readiness(readers)
    session = next(row for row in report["connectors"] if row["id"] == "session_control")

    assert session["configured"] is True
    assert session["readPathReady"] is False
    assert session["executionAvailable"] is False


def test_plugin_mounts_readiness_routes_without_enabling_session_execution(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setenv("MIKAELOS_EXAMS", str(tmp_path / "missing-exams.json"))
    monkeypatch.setenv("MIKAELOS_ANKI_DIR", str(tmp_path / "missing-anki"))
    for key in (
        "MIKAELOS_BRAIN_TOKEN",
        "MIKAELOS_PAPERLESS_TOKEN",
        "MIKAELOS_FREESCOUT_PASSWORD",
        "WHOOP_INTERNAL_TOKEN",
        "HERMES_GATEWAY_TOKEN",
    ):
        monkeypatch.delenv(key, raising=False)

    plugin = _load(PLUGIN_PATH, "mikael_plugin")
    routes = {route.path: route.endpoint for route in plugin.router.routes}

    assert "/integrations/readiness" in routes
    assert "/integrations/propose" in routes
    preview = routes["/integrations/propose"](
        {
            "action": "session_continue",
            "missionId": "mis_20260719T120000Z_abcdefabcdef",
            "backend": "codex",
            "sessionId": "sess_123456",
            "instruction": "Nur Status prüfen.",
            "dryRun": False,
        }
    )
    assert preview["requestedLive"] is True
    assert preview["executed"] is False
    assert preview["willFire"] is False
