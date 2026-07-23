"""Behavior contracts for the Mikael OS Jarvis voice-launch route.

The real launcher (/srv/delta/bin/jarvis-voice-launch) reserves 5,50 $ against
the 25-$ monthly cap on EVERY invocation — it must never run from a test. The
subprocess seam ``_voice_launch_exec`` is therefore always replaced here; the
fixture JSON mirrors the launcher's actual output contract (keys ok /
mission_id / session_id / launch_url / expires_at / reservation_usd / error /
readiness, printed as an indent=1 JSON object).
"""

from __future__ import annotations

import importlib.util
import json
import logging
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import pytest


ROOT = Path(__file__).resolve().parents[2]
PLUGIN_ROOT = ROOT / "plugins" / "mikael-os"

# A recognisable secret marker — must never show up in logs or module state.
TOKEN = "SECRET-CAPABILITY-TOKEN-a41f9"
LAUNCH_URL = "https://voice.example.test/session/s-77#capability=" + TOKEN


@pytest.fixture()
def api(monkeypatch):
    """Load a fresh plugin_api module instance (fresh debounce state per test)."""
    monkeypatch.setenv("MIKAELOS_VOICE_LAUNCH_BIN", "/nonexistent/jarvis-voice-launch")
    name = f"mikael_os_dashboard_voice_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(
        name, PLUGIN_ROOT / "dashboard" / "plugin_api.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    yield module
    sys.modules.pop(name, None)


def _launcher_json(**overrides):
    """The launcher's REAL stdout format (json.dumps(..., indent=1))."""
    expires = datetime.now(timezone.utc) + timedelta(seconds=120)
    payload = {
        "ok": True,
        "mission_id": "m-2026-0815",
        "session_id": "s-77",
        "launch_url": LAUNCH_URL,
        "expires_at": expires.isoformat(),
        "reservation_usd": 5.5,
        "error": None,
        "readiness": {"egress_attestation": "ok", "budget": "ok"},
    }
    payload.update(overrides)
    return json.dumps(payload, indent=1, ensure_ascii=False)


def _completed(stdout, returncode=0, stderr=""):
    return subprocess.CompletedProcess(
        args=["jarvis-voice-launch"], returncode=returncode,
        stdout=stdout, stderr=stderr,
    )


def test_success_returns_launch_contract_and_forwards_purpose(api, monkeypatch):
    calls = []

    def fake_exec(purpose):
        calls.append(purpose)
        return _completed(_launcher_json())

    monkeypatch.setattr(api, "_voice_launch_exec", fake_exec)
    result = api.jarvis_voice_launch_route(payload={"purpose": "Dispo-Rückfrage klären"})

    assert calls == ["Dispo-Rückfrage klären"]
    assert result["ok"] is True
    assert result["launch_url"] == LAUNCH_URL
    assert result["reserved_usd"] == 5.5
    assert result["mission_id"] == "m-2026-0815"
    assert result["expires_at"]
    assert 0 < result["ttl_seconds"] <= 120


def test_second_call_within_ttl_debounces_409_with_remaining_ttl(api, monkeypatch):
    monkeypatch.setattr(api, "_voice_launch_exec", lambda _p: _completed(_launcher_json()))
    first = api.jarvis_voice_launch_route(payload={})
    assert first["ok"] is True

    # The mint window is open — a second call must NOT mint again (orphan
    # reservations eat the monthly cap: 4 open mints block the 5th start).
    def must_not_run(_p):  # pragma: no cover - the guard should prevent this
        raise AssertionError("second mint executed despite active token")

    monkeypatch.setattr(api, "_voice_launch_exec", must_not_run)
    with pytest.raises(api.HTTPException) as exc:
        api.jarvis_voice_launch_route(payload={})
    assert exc.value.status_code == 409
    detail = exc.value.detail
    assert detail["status"] == "active"
    assert 0 < detail["remainingSeconds"] <= 120
    # The 409 must never re-transport the one-shot URL/token.
    assert TOKEN not in json.dumps(detail)


def test_prerequisite_error_is_honest_status_not_500_and_keeps_window_closed(api, monkeypatch):
    monkeypatch.setattr(api, "_voice_launch_exec", lambda _p: _completed(_launcher_json(
        ok=False, launch_url=None, session_id=None,
        error="realtime_prerequisite_missing",
        readiness={"egress_attestation": "expired"},
    ), returncode=1))
    result = api.jarvis_voice_launch_route(payload={})

    assert result["ok"] is False
    assert result["status"] == "realtime_prerequisite_missing"
    assert "Egress-Attestation" in result["message"]
    assert result["readiness"] == {"egress_attestation": "expired"}

    # No token was issued → the debounce stays closed: a fixed cause can
    # retry immediately and succeed.
    monkeypatch.setattr(api, "_voice_launch_exec", lambda _p: _completed(_launcher_json()))
    retry = api.jarvis_voice_launch_route(payload={})
    assert retry["ok"] is True


def test_timeout_blocks_full_ttl_because_mint_may_have_happened(api, monkeypatch):
    def timeout_exec(_p):
        raise subprocess.TimeoutExpired(cmd="jarvis-voice-launch", timeout=15)

    monkeypatch.setattr(api, "_voice_launch_exec", timeout_exec)
    result = api.jarvis_voice_launch_route(payload={})
    assert result["ok"] is False
    assert result["status"] == "timeout"
    assert result["retryAfterSeconds"] == 120

    # Cap protection: the reservation MAY exist server-side → 409 until the TTL
    # window has surely passed.
    with pytest.raises(api.HTTPException) as exc:
        api.jarvis_voice_launch_route(payload={})
    assert exc.value.status_code == 409
    assert 0 < exc.value.detail["remainingSeconds"] <= 120


def test_launcher_gibberish_is_launcher_error_without_stdout_echo(api, monkeypatch):
    monkeypatch.setattr(api, "_voice_launch_exec", lambda _p: _completed(
        "Traceback (most recent call last): boom " + TOKEN, returncode=1,
        stderr="ModuleNotFoundError: hermes"))
    result = api.jarvis_voice_launch_route(payload={})
    assert result["ok"] is False
    assert result["status"] == "launcher_error"
    # stdout is the only possible token carrier — it must never be echoed.
    assert TOKEN not in json.dumps(result.get("message", ""))
    assert "ModuleNotFoundError" in result["message"]


def test_token_is_never_logged_and_never_persisted(api, monkeypatch, caplog):
    monkeypatch.setattr(api, "_voice_launch_exec", lambda _p: _completed(_launcher_json()))
    with caplog.at_level(logging.DEBUG):
        result = api.jarvis_voice_launch_route(payload={})
    assert result["ok"] is True
    assert TOKEN in result["launch_url"]  # only carrier: the HTTP response

    assert TOKEN not in caplog.text
    for record in caplog.records:
        assert TOKEN not in record.getMessage()
    # The debounce state keeps expiry + mission reference only — no URL/token.
    state_dump = json.dumps(api._VOICE_ACTIVE, default=str)
    assert TOKEN not in state_dump
    assert "launch_url" not in state_dump


def test_inline_status_is_sanitized_and_reports_native_health_gap(
    api, monkeypatch, tmp_path
):
    policy = tmp_path / "realtime_policy.json"
    policy.write_text(json.dumps({
        "rollout_status": "approved",
        "model": "gpt-realtime-2.1",
        "voice": "marin",
        "reasoning_effort": "low",
        "cost_enforcement": "observe_only",
        "session_reservation_usd": 0.56,
        "max_session_seconds": 3600,
        "max_turns": 0,
        "max_tool_calls": 0,
        "provider_secret": TOKEN,
    }), encoding="utf-8")
    monkeypatch.setattr(api, "_VOICE_POLICY_PATH", policy)

    def fake_http(method, path, **_kwargs):
        assert method == "GET"
        if path == "/":
            return 200, b"voice-web", {}
        assert path == "/healthz"
        return 404, b"", {}

    monkeypatch.setattr(api, "_voice_http_request", fake_http)
    result = api.jarvis_voice_inline_status()

    assert result["ok"] is True
    assert result["state"] == "ready"
    assert result["transport"] == "webrtc"
    assert result["control"] == "hermes-sideband"
    assert result["continuity"] == "mission.v2 + shared outcomes"
    assert result["voiceWeb"] == {
        "reachable": True,
        "rootStatus": 200,
        "nativeHealthzStatus": 404,
        "base": "loopback",
    }
    assert result["policy"]["model"] == "gpt-realtime-2.1"
    assert result["policy"]["reservationUsd"] == 0.56
    assert TOKEN not in json.dumps(result)


def test_inline_voice_backend_is_pinned_to_loopback(monkeypatch):
    monkeypatch.setenv("MIKAELOS_VOICE_WEB_BASE", "https://public.example.test")
    name = f"mikael_os_dashboard_voice_loopback_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(
        name, PLUGIN_ROOT / "dashboard" / "plugin_api.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    try:
        spec.loader.exec_module(module)
        assert module._VOICE_WEB_BASE == "http://127.0.0.1:18086"
    finally:
        sys.modules.pop(name, None)


def test_inline_voice_keeps_capabilities_and_control_tokens_server_side(
    api, monkeypatch, caplog
):
    bootstrap_token = "SECRET-BOOTSTRAP-TOKEN"
    control_token = "SECRET-CONTROL-TOKEN"
    observed = []
    monkeypatch.setattr(api, "jarvis_voice_launch", lambda purpose: {
        "ok": True,
        "launch_url": LAUNCH_URL,
        "expires_at": "2026-08-15T12:02:00+00:00",
        "reserved_usd": 0.56,
        "mission_id": "mis-shared-voice",
        "session_id": "rts-prepared",
        "ttl_seconds": 120,
        "purpose": purpose,
    })

    def fake_http(method, path, *, body=b"", headers=None):
        headers = headers or {}
        observed.append((method, path, body, headers))
        if path == "/bootstrap":
            assert headers["Authorization"] == "Jarvis-Capability " + TOKEN
            return 200, json.dumps({
                "bootstrap_id": "boot-1",
                "bootstrap_token": bootstrap_token,
                "nonce": "nonce-1",
                "model": "gpt-realtime-2.1",
                "max_session_seconds": 3600,
                "max_turns": 0,
            }).encode(), {}
        if path == "/session":
            assert headers["Authorization"] == "Jarvis-Bootstrap " + bootstrap_token
            assert headers["X-Jarvis-Bootstrap-Id"] == "boot-1"
            assert headers["X-Jarvis-Nonce"] == "nonce-1"
            assert body == b"v=0\\r\\ntest-offer"
            return 201, b"v=0\\r\\ntest-answer", {
                "x-jarvis-session-id": "provider-session-1",
                "x-jarvis-control-token": control_token,
            }
        if path == "/control":
            assert headers["Authorization"] == "Jarvis-Control " + control_token
            payload = json.loads(body)
            assert payload["session_id"] == "provider-session-1"
            assert payload["sequence"] in {1, 2}
            assert payload["action"] in {"status", "hangup"}
            return 200, json.dumps({
                "status": "active" if payload["action"] == "status" else "ended",
                "turns": 2,
                "tool_calls": 1,
                "mission_state": "running",
                "visual": {
                    "phase": "prueft",
                    "events": [
                        {
                            "sequence": 1,
                            "kind": "operator_speaking",
                            "at_ms": 100,
                            "sensitive": TOKEN,
                        },
                    ],
                    "transcript": [
                        {"speaker": "operator", "text": "Zeige den Status."},
                        {"speaker": "assistant", "text": "Ich prüfe das."},
                    ],
                    "transcript_draft": "Live",
                    "operator_transcript_draft": "",
                    "last_tool_result": {
                        "tool": "read",
                        "read_kind": "session_inventory",
                        "status": "read",
                        "summary": "Agentenstatus gelesen",
                        "result": {"provider_secret": TOKEN},
                    },
                    "ack_latency_ms": 420,
                    "ack_observation": "output_audio_transcript_delta",
                },
                "provider_secret": TOKEN,
            }).encode(), {}
        raise AssertionError(path)

    monkeypatch.setattr(api, "_voice_http_request", fake_http)
    with caplog.at_level(logging.DEBUG):
        prepared = api.jarvis_voice_inline_prepare("Mikael OS Test")
        answer = api.jarvis_voice_inline_session(
            prepared["inlineId"], "v=0\\r\\ntest-offer")
        status = api.jarvis_voice_inline_control(prepared["inlineId"], "status")
        ended = api.jarvis_voice_inline_control(prepared["inlineId"], "hangup")

    public_dump = json.dumps([prepared, answer, status, ended])
    assert prepared["missionId"] == "mis-shared-voice"
    assert prepared["reservationUsd"] == 0.56
    assert answer["sdp"] == "v=0\\r\\ntest-answer"
    assert status["ok"] is True
    assert status["action"] == "status"
    assert status["status"] == "active"
    assert status["turns"] == 2
    assert status["tool_calls"] == 1
    assert status["mission_state"] == "running"
    assert status["visual"] == {
        "phase": "prueft",
        "events": [{
            "sequence": 1,
            "kind": "operator_speaking",
            "atMs": 100,
            "latencyMs": None,
            "source": None,
        }],
        "transcript": [
            {"speaker": "operator", "text": "Zeige den Status."},
            {"speaker": "assistant", "text": "Ich prüfe das."},
        ],
        "transcriptDraft": "Live",
        "operatorTranscriptDraft": "",
        "lastToolResult": {
            "tool": "read",
            "read_kind": "session_inventory",
            "status": "read",
            "summary": "Agentenstatus gelesen",
        },
        "ackLatencyMs": 420,
        "ackObservation": "output_audio_transcript_delta",
    }
    assert ended["ok"] is True
    for secret in (TOKEN, bootstrap_token, control_token):
        assert secret not in public_dump
        assert secret not in caplog.text
    assert api._VOICE_INLINE["phase"] == "ended"
    assert api._VOICE_INLINE["handle"] is None
    assert api._VOICE_INLINE["control_token"] is None
    assert [path for _method, path, _body, _headers in observed] == [
        "/bootstrap", "/session", "/control", "/control",
    ]


def test_inline_session_rejects_unprepared_handle_without_provider_call(
    api, monkeypatch
):
    monkeypatch.setattr(
        api,
        "_voice_http_request",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("provider must not be called")),
    )
    with pytest.raises(api.HTTPException) as exc:
        api.jarvis_voice_inline_session("unknown", "v=0\\r\\noffer")
    assert exc.value.status_code == 409
    assert exc.value.detail["status"] == "inline_session_invalid"


def test_legacy_voice_bookmark_opens_stable_deck_without_minting(
    api, monkeypatch
):
    monkeypatch.setattr(
        api,
        "jarvis_voice_launch",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("stable bookmark must never mint")),
    )
    response = api.jarvis_voice_launch_go()
    assert response.status_code == 307
    assert response.headers["location"] == "/mikael-os?voice=1"


def test_frontend_webrtc_is_audio_only_and_sideband_owned() -> None:
    source = (PLUGIN_ROOT / "frontend" / "src" / "index.jsx").read_text(
        encoding="utf-8"
    )

    assert ".createDataChannel(" not in source
    assert "Hermes Sideband is the" in source
    assert 'setScene("constellation")' not in source
