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
