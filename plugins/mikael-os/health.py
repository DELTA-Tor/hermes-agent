"""Private WHOOP health adapter for Mikael OS and Jarvis.

The running jarvis-whoop connector (loopback ``127.0.0.1:18090``) stays the
only owner of WHOOP OAuth tokens and upstream API calls. This module is a
bounded read-only client for its ``/internal/*`` surface. It never calls
``api.prod.whoop.com`` directly (the single-use refresh rotation lives in the
connector and a second client would break the connection) and never writes
WHOOP payloads to FSM, company databases, Qdrant or session-independent files.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen


_MAX_DAYS = 30  # Tool bound; the connector itself allows up to 90.
_CONNECTOR_LIMIT = 25  # Hard per-request record limit of the connector.
_NOTE = (
    "Rohwerte aus WHOOP; keine Diagnose. Medizinisch auffällige Werte "
    "ärztlich abklären."
)
_AUTHORITY = "jarvis-whoop connector (loopback /internal/*)"


class HealthConnectorError(RuntimeError):
    """A safe, user-visible health adapter failure (never carries secrets)."""


def _base_url() -> str:
    value = os.environ.get("MIKAELOS_WHOOP_BASE", "http://127.0.0.1:18090").rstrip("/")
    parsed = urlsplit(value)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise HealthConnectorError("WHOOP connector endpoint must remain loopback HTTP")
    return value


def _internal_token() -> str:
    """Resolve the connector bearer token without ever exposing its value."""
    value = ""
    try:
        from hermes_cli.config import get_env_value

        value = str(get_env_value("WHOOP_INTERNAL_TOKEN") or "").strip()
    except Exception:
        value = ""
    if not value:
        value = str(os.environ.get("WHOOP_INTERNAL_TOKEN") or "").strip()
    if not value:
        raise HealthConnectorError("WHOOP internal token is not configured")
    return value


def _request_json(
    path: str,
    params: Optional[Dict[str, Any]] = None,
    *,
    authorized: bool = True,
    require_ok: bool = True,
) -> Dict[str, Any]:
    query = f"?{urlencode(dict(params))}" if params else ""
    headers = {"Accept": "application/json"}
    if authorized:
        headers["Authorization"] = f"Bearer {_internal_token()}"
    request = Request(_base_url() + path + query, headers=headers, method="GET")
    try:
        with urlopen(request, timeout=5.0) as response:
            raw = response.read(2 * 1024 * 1024)
    except HTTPError as exc:
        # Never read or forward the error body: keep credentials and provider
        # details out of model-visible errors and logs.
        raise HealthConnectorError(f"WHOOP connector HTTP {exc.code}") from exc
    except (URLError, OSError, TimeoutError) as exc:
        raise HealthConnectorError("WHOOP connector is not reachable") from exc
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise HealthConnectorError("WHOOP connector returned invalid JSON") from exc
    if not isinstance(data, dict):
        raise HealthConnectorError("WHOOP connector returned an invalid payload")
    if require_ok and data.get("ok") is not True:
        detail = str(data.get("error") or "unknown error")[:200]
        raise HealthConnectorError(f"WHOOP connector rejected the request: {detail}")
    return data


def health() -> Dict[str, Any]:
    """Unauthenticated connector health probe (``GET /healthz``)."""
    data = _request_json("/healthz", authorized=False, require_ok=False)
    scopes = data.get("scopes") if isinstance(data.get("scopes"), list) else []
    ready = data.get("ok") is True and data.get("connected") is True
    return {
        "ready": ready,
        "ok": data.get("ok") is True,
        "connected": data.get("connected") is True,
        "token_fresh": data.get("token_fresh") is True,
        "scopes": scopes,
    }


def connector_ready() -> bool:
    """Silent check_fn predicate: True only for ok+connected. Never raises."""
    try:
        return health()["ready"] is True
    except Exception:
        return False


def _bounded_days(days: Any) -> int:
    if isinstance(days, bool) or not isinstance(days, int):
        raise HealthConnectorError(f"days must be an integer between 1 and {_MAX_DAYS}")
    if not 1 <= days <= _MAX_DAYS:
        raise HealthConnectorError(f"days must be between 1 and {_MAX_DAYS}")
    return days


def _num(value: Any) -> Optional[float]:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return round(float(value), 2)


def _date_of(value: Any) -> Optional[str]:
    text = str(value or "")
    return text[:10] if len(text) >= 10 else None


def _parse_dt(value: Any) -> Optional[datetime]:
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _score(record: Dict[str, Any]) -> Dict[str, Any]:
    score = record.get("score")
    return score if isinstance(score, dict) else {}


def _stat(values: List[Optional[float]]) -> Optional[Dict[str, Any]]:
    clean = [value for value in values if value is not None]
    if not clean:
        return None
    return {
        "avg": round(sum(clean) / len(clean), 2),
        "min": round(min(clean), 2),
        "max": round(max(clean), 2),
        "n": len(clean),
    }


def _summary(days: int) -> Dict[str, Any]:
    value = _request_json("/internal/summary", {"days": days})
    summary = value.get("summary")
    if not isinstance(summary, dict):
        raise HealthConnectorError("WHOOP connector returned an invalid summary payload")
    return summary


def _records(kind: str, days: int) -> List[Dict[str, Any]]:
    value = _request_json(
        "/internal/data", {"kind": kind, "days": days, "limit": _CONNECTOR_LIMIT}
    )
    result = value.get("result")
    data = result.get("data") if isinstance(result, dict) else None
    records = data.get("records") if isinstance(data, dict) else None
    if not isinstance(records, list):
        raise HealthConnectorError("WHOOP connector returned an invalid data payload")
    return [record for record in records if isinstance(record, dict)]


def _recovery_zone(score: Optional[float]) -> Optional[str]:
    """WHOOP's own display zones — a UI convention, not a medical rating."""
    if score is None:
        return None
    if score >= 67:
        return "grün"
    if score >= 34:
        return "gelb"
    return "rot"


def get_health_status() -> Dict[str, Any]:
    """Connector health plus a small data-availability probe."""
    readiness = health()
    result: Dict[str, Any] = {
        "ready": readiness["ready"],
        "connected": readiness["connected"],
        "token_fresh": readiness["token_fresh"],
        "scopes": readiness["scopes"],
        "authority": _AUTHORITY,
        "note": _NOTE,
    }
    try:
        counts = _summary(7).get("counts")
        result["data_availability"] = {
            "window_days": 7,
            **(counts if isinstance(counts, dict) else {}),
        }
    except HealthConnectorError as exc:
        result["data_availability"] = {"window_days": 7, "error": str(exc)}
    return result


def get_recovery_trend(*, days: int = 7) -> Dict[str, Any]:
    """Daily recovery score, HRV and resting heart rate with short stats."""
    bounded = _bounded_days(days)
    records = _records("recovery", bounded)
    daily = []
    for record in records:
        score = _score(record)
        daily.append({
            "date": _date_of(record.get("created_at")),
            "recovery_score": _num(score.get("recovery_score")),
            "hrv_rmssd_milli": _num(score.get("hrv_rmssd_milli")),
            "resting_heart_rate": _num(score.get("resting_heart_rate")),
        })
    daily.sort(key=lambda item: str(item.get("date") or ""))
    stats = {
        "recovery_score": _stat([item["recovery_score"] for item in daily]),
        "hrv_rmssd_milli": _stat([item["hrv_rmssd_milli"] for item in daily]),
        "resting_heart_rate": _stat([item["resting_heart_rate"] for item in daily]),
    }
    latest = daily[-1] if daily else None
    reading = None
    if latest and latest["recovery_score"] is not None and stats["recovery_score"]:
        reading = (
            f"Letzter Recovery-Score {latest['recovery_score']} "
            f"({_recovery_zone(latest['recovery_score'])}); "
            f"{bounded}-Tage-Mittel {stats['recovery_score']['avg']}."
        )
    return {
        "days": bounded,
        "daily": daily,
        "stats": stats,
        "reading": reading,
        "window_truncated": len(records) >= _CONNECTOR_LIMIT,
        "authority": _AUTHORITY,
        "note": _NOTE,
    }


def get_sleep_trend(*, days: int = 7) -> Dict[str, Any]:
    """Sleep duration, performance and consistency per night with stats."""
    bounded = _bounded_days(days)
    records = _records("sleep", bounded)
    nights = []
    naps = 0
    for record in records:
        if record.get("nap") is True:
            naps += 1
            continue
        score = _score(record)
        stages = score.get("stage_summary")
        stages = stages if isinstance(stages, dict) else {}
        asleep_milli = sum(
            value for value in (
                stages.get("total_light_sleep_time_milli"),
                stages.get("total_slow_wave_sleep_time_milli"),
                stages.get("total_rem_sleep_time_milli"),
            )
            if isinstance(value, (int, float)) and not isinstance(value, bool)
        )
        nights.append({
            "date": _date_of(record.get("end")),
            "duration_hours": round(asleep_milli / 3_600_000, 2) if asleep_milli else None,
            "sleep_performance_percentage": _num(score.get("sleep_performance_percentage")),
            "sleep_consistency_percentage": _num(score.get("sleep_consistency_percentage")),
            "sleep_efficiency_percentage": _num(score.get("sleep_efficiency_percentage")),
        })
    nights.sort(key=lambda item: str(item.get("date") or ""))
    stats = {
        "duration_hours": _stat([item["duration_hours"] for item in nights]),
        "sleep_performance_percentage": _stat(
            [item["sleep_performance_percentage"] for item in nights]
        ),
        "sleep_consistency_percentage": _stat(
            [item["sleep_consistency_percentage"] for item in nights]
        ),
    }
    latest = nights[-1] if nights else None
    reading = None
    if latest and latest["duration_hours"] is not None and stats["duration_hours"]:
        reading = (
            f"Letzte Nacht {latest['duration_hours']} h Schlaf; "
            f"{bounded}-Tage-Mittel {stats['duration_hours']['avg']} h."
        )
    return {
        "days": bounded,
        "nights": nights,
        "naps_excluded": naps,
        "stats": stats,
        "reading": reading,
        "window_truncated": len(records) >= _CONNECTOR_LIMIT,
        "authority": _AUTHORITY,
        "note": _NOTE,
    }


def get_strain_overview(*, days: int = 7) -> Dict[str, Any]:
    """Daily strain from cycles plus the workouts of the window."""
    bounded = _bounded_days(days)
    cycles = _records("cycles", bounded)
    workouts = _records("workout", bounded)
    daily = []
    for record in cycles:
        score = _score(record)
        daily.append({
            "date": _date_of(record.get("start")),
            "strain": _num(score.get("strain")),
            "kilojoule": _num(score.get("kilojoule")),
            "average_heart_rate": _num(score.get("average_heart_rate")),
            "max_heart_rate": _num(score.get("max_heart_rate")),
        })
    daily.sort(key=lambda item: str(item.get("date") or ""))
    sessions = []
    for record in workouts:
        score = _score(record)
        start = _parse_dt(record.get("start"))
        end = _parse_dt(record.get("end"))
        duration = round((end - start).total_seconds() / 60, 1) if start and end else None
        sessions.append({
            "date": _date_of(record.get("start")),
            "sport": record.get("sport_name") or record.get("sport_id"),
            "duration_minutes": duration,
            "strain": _num(score.get("strain")),
            "average_heart_rate": _num(score.get("average_heart_rate")),
            "kilojoule": _num(score.get("kilojoule")),
        })
    sessions.sort(key=lambda item: str(item.get("date") or ""))
    stats = {
        "day_strain": _stat([item["strain"] for item in daily]),
        "workouts": len(sessions),
    }
    reading = None
    if stats["day_strain"]:
        reading = (
            f"{bounded}-Tage-Mittel Tages-Strain {stats['day_strain']['avg']} "
            f"(max {stats['day_strain']['max']}); {len(sessions)} Workouts im Fenster."
        )
    return {
        "days": bounded,
        "daily": daily,
        "workouts": sessions,
        "stats": stats,
        "reading": reading,
        "window_truncated": len(cycles) >= _CONNECTOR_LIMIT or len(workouts) >= _CONNECTOR_LIMIT,
        "authority": _AUTHORITY,
        "note": _NOTE,
    }


def get_today_readiness() -> Dict[str, Any]:
    """Compact current core values for "Wie fit bin ich heute?"."""
    window = 1
    summary = _summary(window)
    latest = summary.get("latest_recovery")
    if not isinstance(latest, dict):
        window = 2
        summary = _summary(window)
        latest = summary.get("latest_recovery")
        latest = latest if isinstance(latest, dict) else {}
    score = latest.get("score") if isinstance(latest.get("score"), dict) else {}
    averages = summary.get("averages")
    averages = averages if isinstance(averages, dict) else {}
    recovery = _num(score.get("recovery_score"))
    zone = _recovery_zone(recovery)
    as_of = _date_of(latest.get("created_at"))
    reading = None
    if recovery is not None:
        reading = f"Recovery {recovery} ({zone}), Stand {as_of or 'unbekannt'}."
    return {
        "observed_at": _berlin_now().isoformat(),
        "as_of": as_of,
        "window_days": window,
        "recovery_score": recovery,
        "zone": zone,
        "hrv_rmssd_milli": _num(score.get("hrv_rmssd_milli")),
        "resting_heart_rate": _num(score.get("resting_heart_rate")),
        "day_strain": _num(averages.get("day_strain")),
        "sleep_performance_percentage": _num(averages.get("sleep_performance_percentage")),
        "reading": reading,
        "authority": _AUTHORITY,
        "note": _NOTE,
    }


def _berlin_now() -> datetime:
    try:
        from zoneinfo import ZoneInfo

        return datetime.now(ZoneInfo("Europe/Berlin"))
    except Exception:
        return datetime.now(timezone.utc)


def safe_json(callable_, *args, **kwargs) -> str:
    """Return the Hermes tool JSON contract without leaking internals."""
    try:
        return json.dumps({"success": True, "data": callable_(*args, **kwargs)}, ensure_ascii=False)
    except (HealthConnectorError, TypeError, ValueError) as exc:
        return json.dumps({"success": False, "error": str(exc)}, ensure_ascii=False)
