"""Behavior contracts for the private Mikael OS WHOOP health toolset."""

from __future__ import annotations

import importlib.util
import json
import logging
import sys
import types
from pathlib import Path
from urllib.error import HTTPError, URLError
from uuid import uuid4

import pytest


ROOT = Path(__file__).resolve().parents[2]
PLUGIN_ROOT = ROOT / "plugins" / "mikael-os"

TOKEN_SENTINEL = f"test-whoop-internal-token-{uuid4().hex}"

HEALTHZ_OK = {
    "ok": True, "connected": True, "token_fresh": False,
    "scopes": [
        "offline", "read:body_measurement", "read:cycles", "read:profile",
        "read:recovery", "read:sleep", "read:workout",
    ],
}

RECOVERY_RECORDS = [
    {
        "created_at": "2026-07-19T06:10:00Z",
        "score": {"recovery_score": 78, "hrv_rmssd_milli": 92.4, "resting_heart_rate": 47},
    },
    {
        "created_at": "2026-07-18T06:05:00Z",
        "score": {"recovery_score": 55, "hrv_rmssd_milli": 71.0, "resting_heart_rate": 52},
    },
]


@pytest.fixture()
def adapter(monkeypatch):
    name = f"mikael_health_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(name, PLUGIN_ROOT / "health.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    monkeypatch.setenv("WHOOP_INTERNAL_TOKEN", TOKEN_SENTINEL)
    monkeypatch.delenv("MIKAELOS_WHOOP_BASE", raising=False)
    yield module
    sys.modules.pop(name, None)


def _load_plugin_package():
    parent = "hermes_plugins"
    if parent not in sys.modules:
        namespace = types.ModuleType(parent)
        namespace.__path__ = []
        sys.modules[parent] = namespace
    name = f"{parent}.mikael_os_health_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(
        name, PLUGIN_ROOT / "__init__.py", submodule_search_locations=[str(PLUGIN_ROOT)]
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return name, module


class _FakeResponse:
    def __init__(self, payload):
        self._raw = json.dumps(payload).encode("utf-8")

    def read(self, *_args):
        return self._raw

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def test_loopback_only_and_bearer_header_without_leaks(adapter, caplog):
    requests = []

    def fake_urlopen(request, timeout=None):
        requests.append(request)
        return _FakeResponse({
            "ok": True,
            "result": {"kind": "recovery", "days": 7, "data": {"records": RECOVERY_RECORDS}},
        })

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(adapter, "urlopen", fake_urlopen)
        with caplog.at_level(logging.DEBUG):
            result = adapter.get_recovery_trend(days=7)

    assert requests[0].get_header("Authorization") == f"Bearer {TOKEN_SENTINEL}"
    assert "kind=recovery" in requests[0].full_url
    assert "limit=25" in requests[0].full_url
    # The bearer value must never surface in results or logs.
    assert TOKEN_SENTINEL not in json.dumps(result)
    assert TOKEN_SENTINEL not in caplog.text

    assert [item["date"] for item in result["daily"]] == ["2026-07-18", "2026-07-19"]
    assert result["stats"]["recovery_score"]["avg"] == 66.5
    assert result["stats"]["hrv_rmssd_milli"]["n"] == 2
    assert "78" in result["reading"] and "grün" in result["reading"]
    assert result["window_truncated"] is False
    assert "keine Diagnose" in result["note"]


def test_non_loopback_or_https_endpoints_are_rejected(adapter, monkeypatch):
    monkeypatch.setenv("MIKAELOS_WHOOP_BASE", "http://api.prod.whoop.com")
    with pytest.raises(adapter.HealthConnectorError):
        adapter.health()
    monkeypatch.setenv("MIKAELOS_WHOOP_BASE", "https://127.0.0.1:18090")
    with pytest.raises(adapter.HealthConnectorError):
        adapter.health()


def test_missing_internal_token_fails_closed_before_any_request(adapter, monkeypatch):
    import hermes_cli.config as hermes_config

    monkeypatch.setattr(hermes_config, "get_env_value", lambda _key: None)
    monkeypatch.delenv("WHOOP_INTERNAL_TOKEN", raising=False)
    monkeypatch.setattr(
        adapter, "urlopen",
        lambda *_a, **_k: pytest.fail("no HTTP call may happen without a token"),
    )
    with pytest.raises(adapter.HealthConnectorError, match="not configured"):
        adapter.get_recovery_trend(days=7)


def test_connector_errors_stay_bounded_and_secret_free(adapter, monkeypatch, caplog):
    def fail_urlopen(_request, timeout=None):
        raise HTTPError("http://127.0.0.1:18090/internal/data", 503, "boom", None, None)

    monkeypatch.setattr(adapter, "urlopen", fail_urlopen)
    with caplog.at_level(logging.DEBUG):
        payload = adapter.safe_json(adapter.get_recovery_trend)
    result = json.loads(payload)
    assert result["success"] is False
    assert result["error"] == "WHOOP connector HTTP 503"
    assert TOKEN_SENTINEL not in payload
    assert TOKEN_SENTINEL not in caplog.text


def test_health_gate_requires_ok_and_connected(adapter, monkeypatch, caplog):
    monkeypatch.setattr(adapter, "_request_json", lambda *_a, **_k: HEALTHZ_OK)
    assert adapter.connector_ready() is True

    monkeypatch.setattr(
        adapter, "_request_json",
        lambda *_a, **_k: {**HEALTHZ_OK, "connected": False},
    )
    assert adapter.connector_ready() is False

    def down(*_args, **_kwargs):
        raise URLError("connection refused")

    monkeypatch.setattr(adapter, "urlopen", down)
    with caplog.at_level(logging.DEBUG):
        assert adapter.connector_ready() is False
    assert [r for r in caplog.records if r.levelno >= logging.WARNING] == []


def test_health_status_reports_connector_and_data_availability(adapter, monkeypatch):
    def fake_request(path, params=None, **_kwargs):
        if path == "/healthz":
            return HEALTHZ_OK
        if path == "/internal/summary":
            assert params == {"days": 7}
            return {"ok": True, "summary": {
                "days": 7,
                "counts": {"recoveries": 7, "cycles": 7, "sleeps": 6, "workouts": 3},
            }}
        raise AssertionError(path)

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    result = adapter.get_health_status()
    assert result["ready"] is True
    assert result["connected"] is True
    assert result["token_fresh"] is False
    assert "read:recovery" in result["scopes"]
    assert result["data_availability"] == {
        "window_days": 7, "recoveries": 7, "cycles": 7, "sleeps": 6, "workouts": 3,
    }


def test_health_status_survives_summary_failure(adapter, monkeypatch):
    def fake_request(path, params=None, **_kwargs):
        if path == "/healthz":
            return HEALTHZ_OK
        raise adapter.HealthConnectorError("WHOOP connector is not reachable")

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    result = adapter.get_health_status()
    assert result["ready"] is True
    assert result["data_availability"]["error"] == "WHOOP connector is not reachable"


def test_trend_tools_reject_out_of_range_days(adapter, monkeypatch):
    monkeypatch.setattr(
        adapter, "_request_json",
        lambda *_a, **_k: pytest.fail("out-of-range days must not reach the connector"),
    )
    for tool in (adapter.get_recovery_trend, adapter.get_sleep_trend, adapter.get_strain_overview):
        for days in (0, 31, "7", True, None):
            with pytest.raises(adapter.HealthConnectorError):
                tool(days=days)


def test_sleep_trend_excludes_naps_and_computes_hours(adapter, monkeypatch):
    records = [
        {
            "end": "2026-07-19T05:30:00Z", "nap": False,
            "score": {
                "stage_summary": {
                    "total_light_sleep_time_milli": 14_400_000,
                    "total_slow_wave_sleep_time_milli": 5_400_000,
                    "total_rem_sleep_time_milli": 7_200_000,
                },
                "sleep_performance_percentage": 88,
                "sleep_consistency_percentage": 70,
                "sleep_efficiency_percentage": 91,
            },
        },
        {"end": "2026-07-19T14:00:00Z", "nap": True, "score": {}},
    ]
    monkeypatch.setattr(
        adapter, "_request_json",
        lambda *_a, **_k: {"ok": True, "result": {"data": {"records": records}}},
    )
    result = adapter.get_sleep_trend(days=7)
    assert result["naps_excluded"] == 1
    assert len(result["nights"]) == 1
    night = result["nights"][0]
    assert night["date"] == "2026-07-19"
    assert night["duration_hours"] == 7.5
    assert result["stats"]["sleep_performance_percentage"]["avg"] == 88
    assert "7.5" in result["reading"]


def test_strain_overview_combines_cycles_and_workouts(adapter, monkeypatch):
    def fake_request(path, params=None, **_kwargs):
        assert path == "/internal/data"
        if params["kind"] == "cycles":
            return {"ok": True, "result": {"data": {"records": [
                {"start": "2026-07-19T00:30:00Z", "score": {
                    "strain": 15.1, "kilojoule": 9000, "average_heart_rate": 71,
                    "max_heart_rate": 168,
                }},
                {"start": "2026-07-18T00:30:00Z", "score": {"strain": 12.3}},
            ]}}}
        if params["kind"] == "workout":
            return {"ok": True, "result": {"data": {"records": [
                {
                    "start": "2026-07-19T17:00:00Z", "end": "2026-07-19T18:00:00Z",
                    "sport_name": "weightlifting",
                    "score": {"strain": 8.2, "average_heart_rate": 121, "kilojoule": 1500},
                },
            ]}}}
        raise AssertionError(params)

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    result = adapter.get_strain_overview(days=7)
    assert [item["date"] for item in result["daily"]] == ["2026-07-18", "2026-07-19"]
    assert result["stats"]["day_strain"]["avg"] == 13.7
    assert result["stats"]["workouts"] == 1
    workout = result["workouts"][0]
    assert workout["sport"] == "weightlifting"
    assert workout["duration_minutes"] == 60.0
    assert "13.7" in result["reading"]


def test_today_readiness_is_compact_and_diagnosis_free(adapter, monkeypatch):
    def fake_request(path, params=None, **_kwargs):
        assert path == "/internal/summary"
        assert params == {"days": 1}
        return {"ok": True, "summary": {
            "latest_recovery": {
                "created_at": "2026-07-20T05:58:00Z",
                "score": {
                    "recovery_score": 78, "hrv_rmssd_milli": 92.4,
                    "resting_heart_rate": 47,
                },
            },
            "averages": {"day_strain": 9.8, "sleep_performance_percentage": 85},
        }}

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    result = adapter.get_today_readiness()
    assert result["recovery_score"] == 78
    assert result["zone"] == "grün"
    assert result["as_of"] == "2026-07-20"
    assert result["day_strain"] == 9.8
    assert result["sleep_performance_percentage"] == 85
    assert "keine Diagnose" in result["note"]


def test_today_readiness_widens_window_when_today_is_unscored(adapter, monkeypatch):
    calls = []

    def fake_request(path, params=None, **_kwargs):
        calls.append(params["days"])
        if params["days"] == 1:
            return {"ok": True, "summary": {"latest_recovery": None, "averages": {}}}
        return {"ok": True, "summary": {
            "latest_recovery": {
                "created_at": "2026-07-19T06:10:00Z", "score": {"recovery_score": 41},
            },
            "averages": {"day_strain": 6.1},
        }}

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    result = adapter.get_today_readiness()
    assert calls == [1, 2]
    assert result["window_days"] == 2
    assert result["zone"] == "gelb"
    assert result["as_of"] == "2026-07-19"


def test_plugin_registers_gated_health_toolset(monkeypatch):
    monkeypatch.setenv("WHOOP_INTERNAL_TOKEN", TOKEN_SENTINEL)
    name, module = _load_plugin_package()
    try:
        registered = []
        hooks = []

        class Context:
            def register_tool(self, **kwargs):
                registered.append(kwargs)

            def register_hook(self, event, callback):
                hooks.append((event, callback))

        module.register(Context())
        health_tools = [item for item in registered if item["toolset"] == "mikael_health"]
        assert {item["name"] for item in health_tools} == {
            "get_health_status", "get_recovery_trend", "get_sleep_trend",
            "get_strain_overview", "get_today_readiness",
        }
        assert len({id(item["check_fn"]) for item in health_tools}) == 1

        health_module = module.health
        assert isinstance(health_module, types.ModuleType)
        check_fn = health_tools[0]["check_fn"]

        # Connector reachable, ok and connected: toolset becomes available.
        with pytest.MonkeyPatch.context() as mp:
            mp.setattr(health_module, "_request_json", lambda *_a, **_k: HEALTHZ_OK)
            assert check_fn() is True

        # Connector down: check_fn fails closed, silently.
        def down(*_args, **_kwargs):
            raise URLError("connection refused")

        with pytest.MonkeyPatch.context() as mp:
            mp.setattr(health_module, "urlopen", down)
            assert check_fn() is False

        # Health hook fires on health/nutrition turns only.
        health_hook = hooks[-1][1]
        context = health_hook(user_message="Wie fit bin ich heute?")
        assert "get_today_readiness" in context["context"]
        assert "propose-only" in context["context"]
        assert "Arzt" in context["context"]
        assert "FSM" in context["context"]
        nutrition = health_hook(user_message="Mach mir einen Essensplan für die Woche")
        assert "effektiv vs. lecker" in nutrition["context"]
        assert health_hook(user_message="Wie ist das Wetter?") is None
        assert health_hook(user_message="Erkläre die Fest-Los-Lagerung") is None
    finally:
        sys.modules.pop(name, None)
        sys.modules.pop(f"{name}.health", None)
        sys.modules.pop(f"{name}.konstruktionslehre", None)


def test_private_health_toolset_is_default_off_and_allowlist_gated(monkeypatch):
    from hermes_cli import tools_config

    assert "mikael_health" in tools_config._DEFAULT_OFF_TOOLSETS

    monkeypatch.setattr(
        tools_config, "_get_plugin_toolset_keys", lambda: {"mikael_health"}
    )
    restricted = tools_config._get_platform_tools(
        {"platform_toolsets": {"api_server": ["web", "terminal"]}},
        "api_server",
    )
    enabled = tools_config._get_platform_tools(
        {"platform_toolsets": {
            "api_server": ["web", "terminal", "mikael_health"],
        }},
        "api_server",
    )

    assert "mikael_health" not in restricted
    assert "mikael_health" in enabled
