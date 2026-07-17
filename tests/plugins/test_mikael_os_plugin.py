"""Behavior contracts for the private MIKAEL OS dashboard plugin."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]
PLUGIN_PATH = REPO_ROOT / "plugins" / "mikael-os" / "dashboard" / "plugin_api.py"
MANIFEST_PATH = REPO_ROOT / "plugins" / "mikael-os" / "dashboard" / "manifest.json"


@pytest.fixture
def plugin_api(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    exams_path = tmp_path / "exams.json"
    exams_path.write_text(
        json.dumps(
            {
                "exams": [
                    {
                        "fach": "Thermodynamik",
                        "datum": (date.today() + timedelta(days=10)).isoformat(),
                        "deck": "Thermodynamik",
                        "themen": ["Erster Hauptsatz", "Entropie", "Carnot"],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("MIKAELOS_EXAMS", str(exams_path))
    monkeypatch.setenv("MIKAELOS_ANKI_DIR", str(tmp_path / "missing-anki"))
    monkeypatch.setenv("MIKAELOS_BRAIN_SECRET", "0")
    monkeypatch.setenv("MIKAELOS_BRAIN_GATEWAY", "http://127.0.0.1:6")
    monkeypatch.delenv("MIKAELOS_BRAIN_TOKEN", raising=False)
    monkeypatch.delenv("HERMES_GATEWAY_TOKEN", raising=False)

    module_name = f"hermes_dashboard_plugin_mikael_os_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(module_name, PLUGIN_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)

    monkeypatch.setattr(module, "_http_get_json", lambda *_args, **_kwargs: (None, None))
    yield module
    sys.modules.pop(module_name, None)


def test_manifest_health_and_router_contract_are_aligned(plugin_api) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    health = plugin_api.health()
    route_paths = {route.path for route in plugin_api.router.routes}

    assert manifest["version"] == health["version"] == "0.5.0"
    assert health["phase"] == 5
    assert {
        "/cockpit/kpi",
        "/cockpit/jarvis-state",
        "/cockpit/approvals",
        "/firma/overview",
        "/wissen/search",
        "/kommunikation/overview",
        "/agent-sessions/overview",
        "/ziele/overview",
        "/reflexion/overview",
        "/gesundheit/overview",
        "/betrieb/overview",
        "/betrieb/mac/propose",
        "/study/plan",
        "/study/plan/propose",
        "/health",
    } <= route_paths


def test_learning_coach_uses_real_exam_evidence_without_faking_jarvis(plugin_api) -> None:
    exams = plugin_api._read_exams()
    paced = plugin_api._pace_exam(exams["exams"][0], anki_ok=False, anki_decks=[])
    plan = plugin_api.study_plan()
    setup = plugin_api.feynman_setup()
    evaluation = plugin_api.feynman_evaluate(
        concept="Entropie", explanation="Eine Erklärung ohne externen Jarvis."
    )

    assert exams["ok"] is True
    assert paced["dailyGoal"] is None
    assert "synchronisiert" in paced["goalText"]
    assert plan["nextExam"]["fach"] == "Thermodynamik"
    assert setup["concept"] == "Erster Hauptsatz"
    assert setup["jarvis"]["ready"] is False
    assert evaluation["ok"] is False
    assert evaluation["jarvisDependent"] is True
    assert "feedback" not in evaluation


def test_study_plan_default_is_dry_run_and_business_scope_is_refused(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    def forbidden_post(*_args, **_kwargs):
        raise AssertionError("dry-run must not POST")

    monkeypatch.setattr(plugin_api, "_http_post_json", forbidden_post)
    preview = plugin_api.propose_study_plan(
        "Lernplan bis zur Thermodynamik-Klausur erstellen"
    )
    refused = plugin_api.propose_study_plan("Rechnung an Kunde schicken")

    assert preview["ok"] is True
    assert preview["mode"] == "dry_run"
    assert preview["willFire"] is False
    assert preview["intent"]["workspace"] == "studium"
    assert preview["intent"]["requiredGate"] == "studium_propose"
    assert refused["ok"] is False
    assert refused["status"] == "out_of_scope"


def test_every_mac_action_remains_a_typed_deferred_preview(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    def forbidden_side_effect(*_args, **_kwargs):
        raise AssertionError("Mac preview must not execute or POST")

    monkeypatch.setattr(plugin_api, "_http_post_json", forbidden_side_effect)
    monkeypatch.setattr(plugin_api.subprocess, "run", forbidden_side_effect)

    for action in plugin_api._MAC_ACTIONS:
        result = plugin_api.mac_action_propose(action["id"], dry_run=False)
        intent = result["intent"]

        assert result["ok"] is True
        assert result["mode"] == "dry_run"
        assert result["willFire"] is False
        assert result["execution"] == "deferred"
        assert result["requestedLive"] is True
        assert intent["device"] == "mac"
        assert intent["params"] == {}
        assert set(intent) == {
            "device",
            "action",
            "target",
            "params",
            "reason",
            "requiredCapabilities",
            "requiredGate",
            "idempotencyKey",
            "provenance",
        }
