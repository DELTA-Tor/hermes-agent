"""MIKAEL OS dashboard-plugin backend — Phase 2 (real read models).

Mounted at ``/api/plugins/mikael-os/`` by the Nous Hermes dashboard
(``getattr(mod, "router")`` is included with that prefix — see
``hermes_cli/web_server.py::_mount_plugin_api_routes``). The router runs
*inside* the dashboard FastAPI process (user ``ubuntu``); FastAPI runs each
sync endpoint in a threadpool, so the blocking file/HTTP/subprocess reads
below are safe.

Phase 2 scope — READ ONLY, ZERO WRITES
--------------------------------------
This module **only reads**. It contains no ``INSERT``/``UPDATE``/``DELETE`` and
issues no write call to any system. Writes remain a Phase-3 concern and will go
through the existing proposal / capability gates (and FSM writes always through
Cockpit :18065). The Personal OS *projects* over authoritative truth; it never
becomes a second store.

Data authority = the **hermes-control-plane** (``/srv/hermes``). We deliberately
avoid any hard cross-repo Python import (that would break in the Nous runtime).
Each module resolves the *cleanest available read path*, in this priority order,
and always degrades gracefully to concept fixtures so the shell can never break:

  (a) HTTP read API  — **Körper / WHOOP** via the private connector
      ``http://127.0.0.1:18090`` (``/healthz`` unauthenticated for connection +
      scopes; ``/internal/summary`` only when an internal token is present in
      this process' environment).
  (b) shared projection files (opened read-only) —
        * ``/srv/hermes/missions/*.jsonl`` — every event line carries the full
          ``mission.v2`` ``projection`` object; the last line of a file is the
          current snapshot. Powers **Engineering / Codex** and **Aufgaben & Ziele**.
        * ``/srv/hermes/registry/task_priority_policy.yaml`` — GTD display lanes
          (Jetzt/Heute/Geplant/Warten/Später), WIP-3, version + content SHA
          (policy provenance for the Aufgaben module).
        * ``/srv/hermes/schedule_state.json`` — routine last-fired timestamps
          (freshness for **Rise-L Prozesse**).
        * ``/srv/hermes/approvals/appr_*.json`` — pending Approval-Cards
          (read-only **Firma-Signale** projection; company-signal workspace).
  (c) read-only subprocess of an existing bin — ``systemctl --user`` for the
      live systemd-unit health behind **Rise-L Prozesse**.

Modules with no authoritative source yet (Kalender, Reisen, Ernährung, Journal,
Lernplan, Heute/Kalender-Tagesplan) stay on concept fixtures, flagged
``demo: true`` + ``source: "konzept"`` with an honest ``note`` naming the gap.

Freshness + provenance contract
-------------------------------
Every module payload carries ``observedAt``, ``staleAfterSeconds``, ``source``,
``sourceKind`` and a per-module ``state`` from the honest set
``fresh | stale | unavailable | empty | partial | error`` (fixtures report
``fresh`` with ``demo: true`` so the UI keeps the "Konzept" pill). Nothing is
ever faked live: an unreachable/stale source is reported as such, never
back-filled with invented values.

Mandant/workspace boundary: private health/journal data is never mixed into
company signals; the company module is a read-only projection only.
"""

from __future__ import annotations

import glob
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

try:
    from fastapi import APIRouter
    from fastapi import HTTPException
except Exception:  # pragma: no cover - allow import/unit use without FastAPI
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int = 404, detail: str = "") -> None:
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    class APIRouter:  # type: ignore
        def get(self, *_args, **_kwargs):
            return lambda fn: fn

        def post(self, *_args, **_kwargs):
            return lambda fn: fn


router = APIRouter()

# ---------------------------------------------------------------------------
# Read-path configuration (all env-overridable; all read-only).
# ---------------------------------------------------------------------------
HERMES_ROOT = Path(os.environ.get("MIKAELOS_HERMES_ROOT", "/srv/hermes"))
MISSIONS_DIR = Path(os.environ.get("MIKAELOS_MISSIONS_DIR", str(HERMES_ROOT / "missions")))
POLICY_PATH = Path(os.environ.get("MIKAELOS_TASK_POLICY", str(HERMES_ROOT / "registry" / "task_priority_policy.yaml")))
SCHEDULE_STATE = Path(os.environ.get("MIKAELOS_SCHEDULE_STATE", str(HERMES_ROOT / "schedule_state.json")))
APPROVALS_DIR = Path(os.environ.get("MIKAELOS_APPROVALS_DIR", str(HERMES_ROOT / "approvals")))
WHOOP_BASE = os.environ.get("MIKAELOS_WHOOP_BASE", "http://127.0.0.1:18090")
WHOOP_TOKEN = os.environ.get("WHOOP_INTERNAL_TOKEN", "").strip()
HTTP_TIMEOUT = float(os.environ.get("MIKAELOS_HTTP_TIMEOUT", "2.5"))

# How long a module's reading stays "fresh" before we call it stale.
STALE = {
    "body": 6 * 3600,       # WHOOP recovery is a morning reading
    "engineering": 3600,    # mission activity
    "tasks": 3600,
    "risel": 3600,
    "company": 24 * 3600,   # approval cards linger until decided
}

# ---------------------------------------------------------------------------
# Small time/state helpers.
# ---------------------------------------------------------------------------
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.astimezone(timezone.utc).isoformat() if dt else None


def _parse_iso(value: Any) -> Optional[datetime]:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _age_seconds(observed: Optional[datetime]) -> Optional[float]:
    if observed is None:
        return None
    return (_now() - observed).total_seconds()


def _freshness_state(observed: Optional[datetime], stale_after: int, *, empty: bool = False) -> str:
    """Derive fresh/stale/empty from an observation timestamp."""
    if empty:
        return "empty"
    age = _age_seconds(observed)
    if age is None:
        return "partial"
    return "stale" if age > stale_after else "fresh"


# ---------------------------------------------------------------------------
# Provenance envelope. Every module summary shares this shape so the frontend
# renders one consistent freshness/provenance chrome.
# ---------------------------------------------------------------------------
def _prov(
    *,
    state: str,
    source: str,
    source_kind: str,
    workspace: str,
    permission: str,
    summary: str,
    observed_at: Optional[datetime] = None,
    stale_after: Optional[int] = None,
    demo: bool = False,
    rows: Optional[List[Dict[str, Any]]] = None,
    note: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "state": state,
        "demo": demo,
        "source": source,
        "sourceKind": source_kind,        # http | file | subprocess | konzept
        "workspace": workspace,           # private | engineering | company_signal
        "permission": permission,
        "observedAt": _iso(observed_at),
        "staleAfterSeconds": stale_after,
        "summary": summary,
        "rows": rows or [],
    }
    if note:
        payload["note"] = note
    if extra:
        payload.update(extra)
    return payload


# ---------------------------------------------------------------------------
# (b) mission.v2 projections — read the last event line of every mission file
#     and take its ``projection`` snapshot. Never imports mission.py.
# ---------------------------------------------------------------------------
# mission.v2 state -> (UI status bucket, German label). Mirrors the intent of
# hermes.mission.job_projection's state map without importing it.
_MISSION_STATUS = {
    "proposed": ("waiting", "Vorgeschlagen"),
    "planned": ("waiting", "Geplant"),
    "running": ("running", "Läuft"),
    "waiting": ("waiting", "Wartet"),
    "review": ("waiting", "In Review"),
    "approval": ("waiting", "Freigabe nötig"),
    "blocked": ("error", "Blockiert"),
    "reconcile_required": ("error", "Abgleich nötig"),
    "done": ("verified", "Fertig"),
    "failed": ("error", "Fehlgeschlagen"),
    "cancelled": ("waiting", "Abgebrochen"),
}
_MISSION_ACCENT = {"running": "emerald", "waiting": "amber", "verified": "cyan", "error": "amber"}
_ACTIVE_STATES = {"proposed", "planned", "running", "waiting", "review", "approval"}


def _read_missions() -> List[Dict[str, Any]]:
    """Current mission.v2 snapshots (one per mission file). Read-only."""
    out: List[Dict[str, Any]] = []
    for path in sorted(glob.glob(str(MISSIONS_DIR / "mis_*.jsonl"))):
        try:
            last = ""
            with open(path, "r", encoding="utf-8") as fh:
                for line in fh:
                    if line.strip():
                        last = line
            if not last:
                continue
            event = json.loads(last)
            proj = event.get("projection")
            if isinstance(proj, dict) and proj.get("contract_version") == "mission.v2":
                out.append(proj)
        except (OSError, ValueError):
            continue
    return out


def _mission_row(proj: Dict[str, Any]) -> Dict[str, Any]:
    state = str(proj.get("state") or "")
    bucket, label = _MISSION_STATUS.get(state, ("waiting", state or "—"))
    goal = str(proj.get("goal") or proj.get("expected_result") or "Mission").strip()
    owner = str(proj.get("owner_agent") or proj.get("assigned_agent") or "").strip()
    job_type = str(proj.get("job_type") or "").strip()
    receipts = proj.get("receipts")
    n_receipts = len(receipts) if isinstance(receipts, list) else 0
    sub_bits = [b for b in (owner, job_type) if b]
    value = f"{n_receipts} Beleg" if n_receipts else "—"
    return {
        "icon": "rocket" if bucket == "running" else ("circle-check-big" if bucket == "verified" else "lock"),
        "accent": _MISSION_ACCENT.get(bucket, "cyan"),
        "title": goal[:80],
        "sub": " · ".join(sub_bits) or "Mission",
        "status": bucket,
        "statusLabel": label,
        "value": value,
        "updatedAt": proj.get("updated_at"),
    }


def module_engineering(missions: List[Dict[str, Any]]) -> Dict[str, Any]:
    eng = [m for m in missions if str(m.get("workspace_type") or "") == "engineering"]
    if not eng:
        return _prov(
            state="empty", source="mission.v2 · /srv/hermes/missions", source_kind="file",
            workspace="engineering", permission="Nur lesen",
            summary="Keine Engineering-Missionen", stale_after=STALE["engineering"],
            note="Keine offenen mission.v2-Missionen im Engineering-Workspace.",
        )
    rows = [_mission_row(m) for m in eng]
    rows.sort(key=lambda r: str(r.get("updatedAt") or ""), reverse=True)
    observed = max((_parse_iso(m.get("updated_at")) for m in eng), default=None, key=lambda d: d or datetime.min.replace(tzinfo=timezone.utc))
    n_run = sum(1 for m in eng if str(m.get("state")) == "running")
    return _prov(
        state=_freshness_state(observed, STALE["engineering"]),
        source="mission.v2 (job_projection) · /srv/hermes/missions", source_kind="file",
        workspace="engineering", permission="Nur lesen (Writes via Gates, Phase 3)",
        summary=f"{len(eng)} Missionen · {n_run} laufen",
        observed_at=observed, stale_after=STALE["engineering"],
        rows=[{k: v for k, v in r.items() if k != "updatedAt"} for r in rows[:6]],
        extra={"count": len(eng), "running": n_run},
    )


def module_tasks(missions: List[Dict[str, Any]], policy: Dict[str, Any]) -> Dict[str, Any]:
    if not missions:
        return _prov(
            state="empty", source="mission.v2 · /srv/hermes/missions", source_kind="file",
            workspace="private", permission="Nur lesen",
            summary="Keine offenen Jobs", stale_after=STALE["tasks"],
            note="Universal-Jobs = mission.v2; derzeit keine offenen Missionen.",
        )
    active = [m for m in missions if str(m.get("state")) in _ACTIVE_STATES]
    rows = [_mission_row(m) for m in active]
    rows.sort(key=lambda r: str(r.get("updatedAt") or ""), reverse=True)
    observed = max((_parse_iso(m.get("updated_at")) for m in missions), default=None, key=lambda d: d or datetime.min.replace(tzinfo=timezone.utc))
    n_review = sum(1 for m in missions if str(m.get("state")) in {"review", "approval"})
    lanes = policy.get("display_lanes") if isinstance(policy, dict) else None
    note = None
    if policy.get("ok"):
        note = (
            "Bahnen/Ordnung aus jarvis-task-priority.v1 (Policy gelesen). "
            "Die feinkörnige Reihung (task_priority_preview) ist control-plane-eigen "
            "und noch nicht als Read-Endpunkt exponiert — hier: echte Jobs + Zustände."
        )
    return _prov(
        state=_freshness_state(observed, STALE["tasks"]),
        source="mission.v2 + task_priority_policy.yaml", source_kind="file",
        workspace="private", permission="Nur lesen (Writes via Gates, Phase 3)",
        summary=f"{len(active)} aktiv · {n_review} in Review",
        observed_at=observed, stale_after=STALE["tasks"],
        rows=[{k: v for k, v in r.items() if k != "updatedAt"} for r in rows[:6]],
        note=note,
        extra={
            "count": len(missions), "active": len(active),
            "policy": {
                "version": policy.get("version"),
                "policySha256": policy.get("policy_sha256"),
                "wipLimitNow": policy.get("wip_limit_now"),
                "lanes": lanes,
            } if policy.get("ok") else {"available": False},
        },
    )


def read_task_policy() -> Dict[str, Any]:
    """Read the GTD priority policy YAML for lane labels + version + content SHA.

    Reads the file and computes the same sha256(raw bytes) the control-plane uses
    for ``policy_sha256`` — a file read + hash, not an import of the engine.
    """
    try:
        raw = POLICY_PATH.read_bytes()
    except OSError:
        return {"ok": False}
    sha = hashlib.sha256(raw).hexdigest()
    doc: Dict[str, Any] = {}
    try:
        import yaml  # available in the dashboard runtime; optional here
        loaded = yaml.safe_load(raw.decode("utf-8"))
        if isinstance(loaded, dict):
            doc = loaded
    except Exception:
        doc = {}
    return {
        "ok": True,
        "version": doc.get("version"),
        "policy_sha256": sha,
        "display_lanes": doc.get("display_lanes"),
        "wip_limit_now": doc.get("wip_limit_now"),
    }


# ---------------------------------------------------------------------------
# (a) WHOOP — private health connector at :18090. /healthz is unauthenticated
#     (connection + scopes); recovery/HRV detail needs the internal token, which
#     is only used if present in this process' environment (never harvested).
# ---------------------------------------------------------------------------
def _http_get_json(url: str, *, token: str = "") -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        req = Request(url, headers=headers, method="GET")
        with urlopen(req, timeout=HTTP_TIMEOUT) as resp:  # noqa: S310 - fixed loopback base
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except HTTPError as exc:
        return exc.code, None
    except (URLError, OSError, ValueError, TimeoutError):
        return None, None


def module_body() -> Dict[str, Any]:
    status_code, health = _http_get_json(f"{WHOOP_BASE}/healthz")
    if status_code is None or not isinstance(health, dict):
        return _prov(
            state="unavailable", source="WHOOP-Connector :18090", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="WHOOP-Connector nicht erreichbar", stale_after=STALE["body"],
            note="GET /healthz auf 127.0.0.1:18090 fehlgeschlagen.",
        )
    connected = bool(health.get("connected"))
    token_fresh = bool(health.get("token_fresh"))
    if not connected:
        return _prov(
            state="unavailable", source="WHOOP-Connector :18090", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="WHOOP nicht verbunden", stale_after=STALE["body"],
            note="Kein WHOOP-OAuth-Token hinterlegt (connected=false).",
        )

    # Try the authorized detail endpoint only when a token is available to us.
    summary_obj: Optional[Dict[str, Any]] = None
    if WHOOP_TOKEN:
        code, data = _http_get_json(f"{WHOOP_BASE}/internal/summary?days=1", token=WHOOP_TOKEN)
        if code == 200 and isinstance(data, dict):
            summary_obj = data.get("summary") if isinstance(data.get("summary"), dict) else None

    if not summary_obj:
        # Connection is real, values are not reachable from the plugin context.
        return _prov(
            state="partial", source="WHOOP-Connector :18090 (/healthz)", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="Verbunden · Detailwerte nicht im Plugin-Kontext",
            observed_at=None, stale_after=STALE["body"],
            rows=[
                {"icon": "heart-pulse", "accent": "emerald", "title": "WHOOP verbunden",
                 "sub": "read:recovery · read:sleep · read:cycles", "status": "verified",
                 "statusLabel": "Verbunden", "value": "OK"},
                {"icon": "shield-check", "accent": "amber" if not token_fresh else "cyan",
                 "title": "Zugriffstoken", "sub": "OAuth-Refresh im Connector",
                 "value": "frisch" if token_fresh else "erneuert bei Abruf"},
            ],
            note=("Recovery/HRV/Schlaf nur über autorisierten Endpunkt "
                  "/internal/summary; der Plugin-Kontext hält kein WHOOP_INTERNAL_TOKEN. "
                  "Setze WHOOP_INTERNAL_TOKEN im Dashboard-Dienst, um Werte zu projizieren."),
            extra={"scopes": health.get("scopes"), "tokenFresh": token_fresh},
        )

    # Real values.
    avg = summary_obj.get("averages") if isinstance(summary_obj.get("averages"), dict) else {}
    latest = summary_obj.get("latest_recovery") if isinstance(summary_obj.get("latest_recovery"), dict) else {}
    observed = _parse_iso((latest or {}).get("created_at") or (latest or {}).get("updated_at"))
    rec = avg.get("recovery_score")
    hrv = avg.get("hrv_rmssd_milli")
    rhr = avg.get("resting_heart_rate")
    strain = avg.get("day_strain")
    sleep = avg.get("sleep_performance_percentage")

    def _fmt(v: Any, suffix: str = "") -> str:
        return f"{v}{suffix}" if isinstance(v, (int, float)) else "—"

    return _prov(
        state=_freshness_state(observed, STALE["body"]),
        source="WHOOP · /internal/summary", source_kind="http",
        workspace="private", permission="Nur lesen (privat)",
        summary=f"Recovery {_fmt(rec, '%')}" + (f" · Stand {observed.strftime('%H:%M')}" if observed else ""),
        observed_at=observed, stale_after=STALE["body"],
        rows=[
            {"icon": "heart-pulse", "accent": "emerald", "title": "Recovery",
             "sub": "Tagesmittel", "status": "verified", "statusLabel": "Gemessen", "value": _fmt(rec, "%")},
            {"icon": "moon", "accent": "cyan", "title": "Schlafleistung",
             "sub": "Schlafqualität", "value": _fmt(sleep, "%")},
            {"icon": "activity", "accent": "amber", "title": "HRV · Ruhepuls · Strain",
             "sub": f"HRV {_fmt(hrv)} ms · RHR {_fmt(rhr)} bpm", "value": _fmt(strain)},
        ],
        extra={"scopes": health.get("scopes"), "tokenFresh": token_fresh},
    )


# ---------------------------------------------------------------------------
# (c) Rise-L — systemd --user health (subprocess of an existing read-only bin)
#     + (b) schedule_state.json for routine freshness.
# ---------------------------------------------------------------------------
def _systemd_counts() -> Optional[Dict[str, int]]:
    try:
        out = subprocess.run(
            ["systemctl", "--user", "list-units", "--type=service", "--all",
             "--no-legend", "--plain", "--no-pager"],
            capture_output=True, text=True, timeout=HTTP_TIMEOUT,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    active = failed = total = 0
    for line in out.stdout.splitlines():
        parts = line.split()
        if len(parts) < 4:
            continue
        total += 1
        sub = parts[3]
        if sub == "running":
            active += 1
        elif parts[2] == "failed" or sub == "failed":
            failed += 1
    return {"active": active, "failed": failed, "total": total}


def _latest_routine() -> Tuple[Optional[str], Optional[datetime], int]:
    try:
        doc = json.loads(SCHEDULE_STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None, None, 0
    routines = doc.get("routines") if isinstance(doc, dict) else None
    if not isinstance(routines, dict):
        return None, None, 0
    latest_name: Optional[str] = None
    latest_dt: Optional[datetime] = None
    fired = 0
    for name, meta in routines.items():
        if not isinstance(meta, dict) or not meta.get("last_fired_utc"):
            continue
        fired += 1
        dt = _parse_iso(meta.get("last_fired_utc"))
        if dt and (latest_dt is None or dt > latest_dt):
            latest_dt, latest_name = dt, name
    return latest_name, latest_dt, fired


def module_risel() -> Dict[str, Any]:
    counts = _systemd_counts()
    name, observed, fired = _latest_routine()
    if counts is None and observed is None:
        return _prov(
            state="unavailable", source="systemd --user + schedule_state.json", source_kind="subprocess",
            workspace="engineering", permission="Nur lesen",
            summary="Rise-L-Status nicht lesbar", stale_after=STALE["risel"],
            note="Weder systemctl --user noch schedule_state.json erreichbar.",
        )
    rows: List[Dict[str, Any]] = []
    if counts is not None:
        ok = counts["failed"] == 0
        rows.append({
            "icon": "server", "accent": "emerald" if ok else "amber",
            "title": "Dienste online", "sub": f"{counts['active']} aktiv · {counts['total']} gesamt",
            "status": "verified" if ok else "waiting",
            "statusLabel": "Stabil" if ok else f"{counts['failed']} gestört",
            "value": "OK" if ok else str(counts["failed"]),
        })
    if fired:
        rows.append({
            "icon": "activity", "accent": "cyan", "title": "Routinen",
            "sub": f"{fired} geplante Lanes", "value": str(fired),
        })
    if name and observed:
        rows.append({
            "icon": "clock", "accent": "amber", "title": "Letzter Lauf",
            "sub": name, "value": observed.strftime("%H:%M"),
        })
    active = counts["active"] if counts else 0
    failed = counts["failed"] if counts else 0
    state = "fresh"
    if observed is not None:
        state = _freshness_state(observed, STALE["risel"])
    if failed:
        state = "partial"
    return _prov(
        state=state, source="systemd --user + schedule_state.json", source_kind="subprocess",
        workspace="engineering", permission="Nur lesen",
        summary=f"{active} Dienste aktiv" + (f" · {failed} gestört" if failed else ""),
        observed_at=observed, stale_after=STALE["risel"], rows=rows,
        extra={"services": counts, "routinesFired": fired},
    )


# ---------------------------------------------------------------------------
# (b) Firma-Signale — read-only projection of pending Approval-Cards.
#     Company-signal workspace; never mixed with private data.
# ---------------------------------------------------------------------------
def module_company() -> Dict[str, Any]:
    files = sorted(glob.glob(str(APPROVALS_DIR / "appr_*.json")))
    if not files:
        # Directory unreadable vs. genuinely empty — report each honestly.
        if not APPROVALS_DIR.exists():
            return _prov(
                state="unavailable", source="/srv/hermes/approvals", source_kind="file",
                workspace="company_signal", permission="Nur lesen",
                summary="Approval-Speicher nicht lesbar", stale_after=STALE["company"],
                note="Approvals-Verzeichnis nicht erreichbar.",
                extra={"readOnly": True},
            )
        return _prov(
            state="empty", source="/srv/hermes/approvals", source_kind="file",
            workspace="company_signal", permission="Nur lesen",
            summary="Keine offenen Approval-Cards", stale_after=STALE["company"],
            extra={"readOnly": True},
        )
    pending: List[Dict[str, Any]] = []
    newest: Optional[datetime] = None
    for path in files:
        try:
            card = json.loads(Path(path).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if str(card.get("status") or "").lower() not in {"pending", ""}:
            continue
        pending.append(card)
        dt = _parse_iso(card.get("created_utc"))
        if dt and (newest is None or dt > newest):
            newest = dt
    if not pending:
        return _prov(
            state="empty", source="/srv/hermes/approvals", source_kind="file",
            workspace="company_signal", permission="Nur lesen",
            summary="Keine offenen Approval-Cards", stale_after=STALE["company"],
            extra={"readOnly": True},
        )
    rows: List[Dict[str, Any]] = []
    for card in sorted(pending, key=lambda c: str(c.get("created_utc") or ""), reverse=True)[:5]:
        rows.append({
            "icon": "shield-check", "accent": "amber",
            "title": str(card.get("text") or card.get("action") or "Approval")[:70],
            "sub": str(card.get("gate_class") or "gate"),
            "status": "waiting", "statusLabel": "Freigabe offen", "value": "—",
        })
    return _prov(
        state=_freshness_state(newest, STALE["company"]),
        source="/srv/hermes/approvals (Approval-Cards)", source_kind="file",
        workspace="company_signal", permission="Nur lesen",
        summary=f"{len(pending)} Approval-Cards offen",
        observed_at=newest, stale_after=STALE["company"], rows=rows,
        extra={"readOnly": True, "pending": len(pending)},
    )


# ---------------------------------------------------------------------------
# Concept fixtures — modules with no authoritative source yet. demo:true so the
# UI keeps the "Konzept" pill; each names its gap honestly.
# ---------------------------------------------------------------------------
def _fixture(module_id: str, *, workspace: str, summary: str, rows: List[Dict[str, Any]], note: str) -> Dict[str, Any]:
    return _prov(
        state="fresh", demo=True, source="konzept", source_kind="konzept",
        workspace=workspace, permission="—", summary=summary, rows=rows, note=note,
    )


def module_today() -> Dict[str, Any]:
    return _fixture(
        "today", workspace="private", summary="9 Ereignisse (Konzept)",
        rows=[
            {"icon": "sun", "accent": "cyan", "title": "Morning Light & Bewegung", "sub": "20 Min · Tagesstart", "value": "07:30"},
            {"icon": "brain", "accent": "emerald", "title": "Strategy Deep Work", "sub": "90 Min · Fokus", "value": "09:00"},
            {"icon": "target", "accent": "violet", "title": "Leadership Sync", "sub": "45 Min · Team", "value": "12:30"},
        ],
        note="Kein Kalender-Projektions-Endpunkt in der Control-Plane gefunden — Tagesplan bleibt Konzept.",
    )


def module_kalender() -> Dict[str, Any]:
    return _fixture(
        "kalender", workspace="private", summary="Nächster · 10:30 (Konzept)",
        rows=[
            {"icon": "target", "accent": "cyan", "title": "Leadership Sync", "sub": "Team-Update", "value": "10:30"},
            {"icon": "brain", "accent": "emerald", "title": "Strategie Review", "sub": "Q2 Planung", "value": "14:00"},
        ],
        note="Keine Kalender-Read-API erreichbar — Fixture bis Quelle steht.",
    )


def module_learning() -> Dict[str, Any]:
    return _fixture(
        "learning", workspace="private", summary="3 Lektionen fällig (Konzept)",
        rows=[
            {"icon": "book-open", "accent": "violet", "title": "Deep Work Playbook", "sub": "Fortschritt", "status": "running", "statusLabel": "Läuft", "value": "68 %"},
            {"icon": "graduation-cap", "accent": "cyan", "title": "Nächste Lektion", "sub": "Heute · 20 Min", "value": "—"},
        ],
        note="Lern-Skills-Fortschritt noch nicht als Read-Modell exponiert.",
    )


def module_travel() -> Dict[str, Any]:
    return _fixture(
        "travel", workspace="private", summary="Rom · 18. Jun (Konzept)",
        rows=[
            {"icon": "plane", "accent": "cyan", "title": "Rom · Städtereise", "sub": "Abflug 18. Jun · 08:20", "value": "3 T"},
            {"icon": "map", "accent": "emerald", "title": "Hotel bestätigt", "sub": "Trastevere", "status": "verified", "statusLabel": "Verifiziert", "value": "OK"},
        ],
        note="Keine Reise-Datenquelle angebunden.",
    )


def module_nutrition() -> Dict[str, Any]:
    return _fixture(
        "nutrition", workspace="private", summary="2.105 kcal (Konzept)",
        rows=[
            {"icon": "utensils", "accent": "emerald", "title": "Protein", "sub": "Ziel 160 g", "status": "running", "statusLabel": "Läuft", "value": "142 g"},
            {"icon": "leaf", "accent": "cyan", "title": "Wasser", "sub": "Ziel 3 L", "value": "2,1 L"},
        ],
        note="Ernährungs-Log noch nicht angebunden (privat).",
    )


def module_journal() -> Dict[str, Any]:
    return _fixture(
        "journal", workspace="private", summary="1 Eintrag heute (Konzept)",
        rows=[
            {"icon": "notebook-pen", "accent": "cyan", "title": "Wie fühlt sich Fokus heute an?", "sub": "Sprach- oder Text-Eintrag", "value": "—"},
            {"icon": "audio-lines", "accent": "violet", "title": "Voice-Memo", "sub": "Heute 06:40", "value": "0:48"},
        ],
        note="Journal ist privat und noch ohne Read-Modell.",
    )


# ---------------------------------------------------------------------------
# Module registry — static metadata + which reader (if any) hydrates it.
# ---------------------------------------------------------------------------
_MODULE_META = [
    {"id": "today", "title": "Heute", "icon": "sun", "accent": "cyan", "workspace": "private"},
    {"id": "tasks", "title": "Aufgaben & Ziele", "icon": "target", "accent": "emerald", "workspace": "private"},
    {"id": "learning", "title": "Lernplan", "icon": "graduation-cap", "accent": "violet", "workspace": "private"},
    {"id": "risel", "title": "Rise-L Prozesse", "icon": "server", "accent": "amber", "workspace": "engineering"},
    {"id": "travel", "title": "Reisen", "icon": "plane", "accent": "cyan", "workspace": "private"},
    {"id": "nutrition", "title": "Ernährung", "icon": "leaf", "accent": "emerald", "workspace": "private"},
    {"id": "company", "title": "Firma-Signale", "icon": "building-2", "accent": "neutral", "workspace": "company_signal", "readOnly": True},
    {"id": "kalender", "title": "Kalender", "icon": "calendar-days", "accent": "cyan", "workspace": "private"},
    {"id": "body", "title": "Körper / WHOOP", "icon": "heart-pulse", "accent": "emerald", "workspace": "private"},
    {"id": "journal", "title": "Journal", "icon": "notebook-pen", "accent": "cyan", "workspace": "private"},
    {"id": "engineering", "title": "Engineering / Codex", "icon": "code-xml", "accent": "cyan", "workspace": "engineering"},
]


def _build_readers() -> Dict[str, Callable[[], Dict[str, Any]]]:
    """Bind each module id to a zero-arg reader, sharing one mission read."""
    missions = _read_missions()
    policy = read_task_policy()
    return {
        "today": module_today,
        "tasks": lambda: module_tasks(missions, policy),
        "learning": module_learning,
        "risel": module_risel,
        "travel": module_travel,
        "nutrition": module_nutrition,
        "company": module_company,
        "kalender": module_kalender,
        "body": module_body,
        "journal": module_journal,
        "engineering": lambda: module_engineering(missions),
    }


def _safe_read(reader: Callable[[], Dict[str, Any]], meta: Dict[str, Any]) -> Dict[str, Any]:
    try:
        payload = reader()
    except Exception as exc:  # noqa: BLE001 - a module must never break the shell
        payload = _prov(
            state="error", source="unbekannt", source_kind="konzept",
            workspace=str(meta.get("workspace") or "private"), permission="—",
            summary="Lesefehler", note=f"Read-Fehler: {type(exc).__name__}",
        )
    merged = {**meta, **payload}
    return merged


# ---------------------------------------------------------------------------
# HTTP surface. GET only. Zero writes.
# ---------------------------------------------------------------------------
@router.get("/health")
def health() -> Dict[str, Any]:
    """Liveness + which read paths resolved right now (diagnostic)."""
    return {
        "status": "ok",
        "plugin": "mikael-os",
        "version": "0.2.0",
        "phase": 2,
        "readPaths": {
            "missions_dir": str(MISSIONS_DIR),
            "missions_readable": MISSIONS_DIR.exists(),
            "task_policy": str(POLICY_PATH),
            "schedule_state": str(SCHEDULE_STATE),
            "approvals_dir": str(APPROVALS_DIR),
            "whoop_base": WHOOP_BASE,
            "whoop_token_present": bool(WHOOP_TOKEN),
        },
        "observedAt": _iso(_now()),
    }


@router.get("/overview")
def overview() -> Dict[str, Any]:
    """Command Constellation snapshot: identity + all module summaries.

    Each module carries its own state / source / observedAt so the shell renders
    honest freshness per node. Fixture modules keep ``demo: true``.
    """
    readers = _build_readers()
    modules = [_safe_read(readers[m["id"]], m) for m in _MODULE_META]
    live = [m for m in modules if not m.get("demo")]
    return {
        "identity": {"name": "Mikael", "context": "Privates System"},
        "workspaces": ["private", "engineering", "company_signal"],
        "active_workspace": "private",
        "jarvis_state": "ready",
        "modules": modules,
        "focus_default": "engineering",
        "observedAt": _iso(_now()),
        "liveModules": [m["id"] for m in live],
        "phase": 2,
    }


@router.get("/module/{module_id}")
def module(module_id: str) -> Dict[str, Any]:
    """Full detail (lens rows + provenance) for one module."""
    meta = next((m for m in _MODULE_META if m["id"] == module_id), None)
    if meta is None:
        raise HTTPException(status_code=404, detail="unknown module")
    readers = _build_readers()
    return _safe_read(readers[module_id], meta)
