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
    monkeypatch.setenv("MIKAELOS_BRAIN_GATEWAY", "http://127.0.0.1:6")
    monkeypatch.setenv("MIKAELOS_DELEGATION_LIVE_ROOT", str(tmp_path / "delegation-live"))
    for key in (
        "MIKAELOS_BRAIN_TOKEN",
        "MIKAELOS_PAPERLESS_TOKEN",
        "MIKAELOS_FREESCOUT_PASSWORD",
        "WHOOP_INTERNAL_TOKEN",
        "HERMES_GATEWAY_TOKEN",
    ):
        monkeypatch.delenv(key, raising=False)

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

    assert manifest["version"] == health["version"] == "1.0.0"
    assert health["phase"] == 6
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
        "/life/overview",
        "/betrieb/mac/propose",
        "/study/plan",
        "/study/plan/propose",
        "/learning/intake/analyze",
        "/jarvis/voice/status",
        "/jarvis/voice/healthz",
        "/jarvis/voice/prepare",
        "/jarvis/voice/session",
        "/jarvis/voice/control",
        "/health",
    } <= route_paths


def test_life_atlas_keeps_one_truth_model_and_separates_personal_from_office(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    def module_payload(module_id: str) -> dict:
        payload = {
            "state": "fresh",
            "source": f"source:{module_id}",
            "sourceKind": "file",
            "workspace": "private",
            "permission": "Nur lesen",
            "summary": f"{module_id} live",
            "rows": [],
        }
        if module_id == "kalender":
            payload["rows"] = [{
                "title": "Bestätigter Termin",
                "value": "24.07. 09:00",
                "startsAt": "2026-07-24T09:00:00+02:00",
                "workspace": "private",
            }]
        if module_id == "tasks":
            payload["rows"] = [{
                "title": "Bestätigte Mission",
                "statusLabel": "Läuft",
                "missionId": "mis-test",
            }]
        return payload

    monkeypatch.setattr(
        plugin_api,
        "_build_readers",
        lambda: {
            meta["id"]: (lambda module_id=meta["id"]: module_payload(module_id))
            for meta in plugin_api._MODULE_META
        },
    )
    monkeypatch.setattr(plugin_api, "dashboard_catalog", lambda: [{
        "id": "fsm",
        "label": "FSM-Cockpit",
        "state": "fresh",
        "reachable": True,
        "visibility": "tailnet-only",
        "audiences": ["mikael", "office"],
        "url": "https://delta-ai-01.tailbc3df5.ts.net:18065/",
    }])

    result = plugin_api.life_overview()
    by_id = {area["id"]: area for area in result["areas"]}

    assert len(result["areas"]) == 17
    assert result["identity"]["frontdoor"] == "Mikael OS / Jarvis"
    assert result["authority"]["directTruthWrites"] is False
    assert result["authority"]["publicExposure"] is False
    assert result["authority"]["gates"] == [
        "money",
        "external_customer_send",
        "truth_schema_migration",
    ]
    assert result["evolution"]["store"] == "none in Mikael OS"
    assert by_id["work"]["workspace"] == "company"
    assert by_id["relationships"]["lifecycle"] == "discoverable"
    assert by_id["relationships"]["coverage"] == 0
    assert result["calendarAndTasks"]["calendar"]["rows"][0]["title"] == "Bestätigter Termin"
    assert result["calendarAndTasks"]["tasks"]["rows"][0]["missionId"] == "mis-test"
    assert {item["kind"] for item in result["futureRadar"]["items"]} == {
        "calendar",
        "mission",
    }


def test_personal_gap_modules_never_ship_concept_values(plugin_api) -> None:
    for reader in (
        plugin_api.module_travel,
        plugin_api.module_nutrition,
        plugin_api.module_journal,
    ):
        result = reader()
        assert result["state"] == "unavailable"
        assert result["rows"] == []
        assert result.get("demo") is not True


def test_dashboard_catalog_links_are_existing_tailnet_surfaces_only(plugin_api) -> None:
    assert plugin_api._DASHBOARD_CATALOG
    for item in plugin_api._DASHBOARD_CATALOG:
        assert item["loopback"].startswith("http://127.0.0.1:")
        assert item["url"].startswith(
            "https://delta-ai-01.tailbc3df5.ts.net:"
        )
        assert "funnel" not in item["url"].lower()


def test_pwa_scope_is_private_to_mikael_os_and_never_caches_api_truth(
    plugin_api,
) -> None:
    assert plugin_api._PWA_MANIFEST["start_url"] == "/mikael-os"
    assert plugin_api._PWA_MANIFEST["scope"] == "/mikael-os"
    assert 'url.pathname === "/mikael-os"' in plugin_api._PWA_SW_JS
    assert "req.destination === \"script\"" in plugin_api._PWA_SW_JS
    assert "plugin API JSON" in plugin_api._PWA_SW_JS
    assert "c.put(req, copy)" in plugin_api._PWA_SW_JS
    assert 'k.startsWith("mikael-os-shell-")' in plugin_api._PWA_SW_JS


def test_dashboard_multi_pdf_upload_is_ephemeral_and_uses_shared_adapter(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    staged: list[Path] = []

    def analyze(attachments, **kwargs):
        assert kwargs["tenant_id"] == "uni:tum"
        assert kwargs["module_id"] == "thermodynamik-1"
        assert kwargs["exam_id"] == "thermo-ws26"
        assert kwargs["question"] == "Welche Hauptsätze sind wichtig?"
        assert [item.display_name for item in attachments] == ["eins.pdf", "zwei.pdf"]
        assert [item.path.read_bytes() for item in attachments] == [b"pdf-one", b"pdf-two"]
        staged.extend(item.path for item in attachments)
        return {
            "ok": True,
            "mode": "direct_context",
            "receipt": {"receipt_id": "libundle-test", "will_write": False},
            "direct_context": {
                "answer_ready": True,
                "embedding_requested": False,
                "graph_write_requested": False,
                "durable_write_requested": False,
            },
        }

    monkeypatch.setattr(plugin_api, "analyze_pdf_attachments", analyze)
    app = FastAPI()
    app.include_router(plugin_api.router, prefix="/api/plugins/mikael-os")
    with TestClient(app) as client:
        response = client.post(
            "/api/plugins/mikael-os/learning/intake/analyze",
            files=[
                ("files", ("eins.pdf", b"pdf-one", "application/pdf")),
                ("files", ("zwei.pdf", b"pdf-two", "application/pdf")),
            ],
            data={
                "tenant_id": "uni:tum",
                "module_id": "thermodynamik-1",
                "exam_id": "thermo-ws26",
                "exam_date": "2026-12-18",
                "question": "Welche Hauptsätze sind wichtig?",
            },
        )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["surface"] == "dashboard_upload"
    assert result["receipt"]["will_write"] is False
    assert staged and all(not path.exists() for path in staged)


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


def test_runtime_secrets_are_purpose_scoped_typed_injections(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HERMES_GATEWAY_TOKEN", "broad-token-must-not-be-used")
    assert plugin_api._brain_token() == ""

    monkeypatch.setenv("MIKAELOS_BRAIN_TOKEN", "brain-runtime")
    monkeypatch.setenv("MIKAELOS_PAPERLESS_TOKEN", "paperless-runtime")
    monkeypatch.setenv("MIKAELOS_FREESCOUT_PASSWORD", "freescout-runtime")
    monkeypatch.setenv("WHOOP_INTERNAL_TOKEN", "whoop-runtime")

    assert plugin_api._brain_token() == "brain-runtime"
    assert plugin_api._paperless_token() == "paperless-runtime"
    assert plugin_api._freescout_password() == "freescout-runtime"
    assert plugin_api._whoop_token() == "whoop-runtime"


def test_agent_sessions_projects_bounded_redacted_live_delegation_tail(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = plugin_api.DELEGATION_LIVE_ROOT
    task_dir = root / "deleg_abc12345"
    task_dir.mkdir(parents=True)
    outside = root.parent / "must-not-read.log"
    outside.write_text("12:00:00 assistant | forbidden\n", encoding="utf-8")
    (task_dir / "manifest.json").write_text(
        json.dumps({
            "delegation_id": "deleg_abc12345",
            "started": "2026-07-23 13:00:00",
            "task_count": 1,
            "tasks": [{
                "index": 0,
                "goal": "Hermes Update live prüfen",
                "log": str(outside),
                "status": "running",
            }],
        }),
        encoding="utf-8",
    )
    (task_dir / "task-0.log").write_text(
        "=== Hermes subagent live transcript ===\n"
        "13:00:01 think     | Prüfe den aktuellen Zustand.\n"
        "13:00:02 tool      | -> terminal({redacted})\n"
        "13:00:03 result    | terminal ok 0.2s: live\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(plugin_api, "_read_missions", lambda: [])
    monkeypatch.setattr(plugin_api, "_agent_session_token", lambda: "")

    result = plugin_api.agent_sessions_overview()
    live = result["delegations"]

    assert live["state"] == "fresh"
    assert live["pollAfterSeconds"] == 4
    assert result["controls"]["operatorGates"] == [
        "money", "customer_outbound", "truth_schema",
    ]
    assert live["rows"][0]["state"] == "running"
    task = live["rows"][0]["tasks"][0]
    assert task["goal"] == "Hermes Update live prüfen"
    assert [event["kind"] for event in task["events"]] == ["tool", "result"]
    assert all("forbidden" not in event["text"] for event in task["events"])


def test_mission_projection_exposes_only_product_safe_work_and_evidence(
    plugin_api,
) -> None:
    row = plugin_api._mission_row({
        "mission_id": "mis-test",
        "state": "running",
        "goal": "Mikael OS als Jarvis-Frontdoor abschließen",
        "owner_agent": "jarvis",
        "job_type": "computer-use",
        "plan": ["Implementieren", "Testen", "Live verifizieren"],
        "next_action": "Responsive QA durchführen",
        "expected_result": "Eine stabile PWA",
        "evidence_refs": ["test:smoke-pass"],
        "receipts": ["receipt:deploy-sha"],
        "updated_at": "2026-07-23T18:00:00+00:00",
        "private_reasoning": "must never be projected",
    })

    assert row["missionId"] == "mis-test"
    assert row["goal"] == "Mikael OS als Jarvis-Frontdoor abschließen"
    assert row["plan"] == ["Implementieren", "Testen", "Live verifizieren"]
    assert row["currentStep"] == "Responsive QA durchführen"
    assert row["tool"] == "computer-use"
    assert row["expectedResult"] == "Eine stabile PWA"
    assert row["evidence"] == ["test:smoke-pass", "receipt:deploy-sha"]
    assert "private_reasoning" not in row
    assert "reasoning" not in json.dumps(row).lower()


def test_personal_telegram_and_company_office_signals_never_blend_workspaces(
    plugin_api, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(plugin_api, "_komm_telegram", lambda: {
        "state": "fresh",
        "workspace": "private",
        "source": "operator-bot",
        "rows": [{"title": "Privater Jarvis-Turn"}],
    })
    monkeypatch.setattr(plugin_api, "module_company", lambda: {
        "state": "fresh",
        "workspace": "company_signal",
        "source": "approvals",
        "rows": [{"title": "Firmenvorschlag"}],
        "pending": 1,
    })
    monkeypatch.setattr(plugin_api, "_freescout_signals", lambda: {
        "state": "fresh",
        "workspace": "company_signal",
        "source": "freescout",
        "rows": [{"title": "Büroticket"}],
        "open": 1,
    })

    result = plugin_api.module_kommunikation()
    by_group = {row["group"]: row for row in result["rows"]}

    assert result["workspaces"] == ["private", "company_signal"]
    assert by_group["telegram"]["workspace"] == "private"
    assert by_group["vorschlaege"]["workspace"] == "company_signal"
    assert by_group["freescout"]["workspace"] == "company_signal"
    assert result["readOnly"] is True


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
