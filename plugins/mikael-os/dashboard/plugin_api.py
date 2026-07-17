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
  (d) read-only SQLite (URI ``mode=ro``) —
      ``/srv/delta/data/calendar-evidence/calendar.db``: the calendar-evidence
      projection (Google-Calendar-API read-only mirror, 30-min timer, atomic
      replace, ``authority: DERIVED_EVIDENCE_ONLY``). Powers **Kalender** and
      **Heute**. Two calendars live in that DB and are kept STRICTLY label-
      separated, never blended:
        * ``mikael@deltator.de`` — the only honest PRIVATE calendar source
          (workspace ``private``).
        * ``deltatortechnik@gmail.com`` — the company dispo calendar. It is
          surfaced ONLY as an explicitly labelled, read-only **Firma-Signal**
          block; a dispo entry is never presented as a private appointment,
          and private entries never feed any company projection.

Modules with no authoritative source yet (Reisen, Ernährung, Journal,
Lernplan) stay on concept fixtures, flagged
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
import sqlite3
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

try:
    from fastapi import APIRouter
    from fastapi import HTTPException
    from fastapi import Body
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

    def Body(default=None, **_kwargs):  # type: ignore
        return default


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
HTTP_TIMEOUT = float(os.environ.get("MIKAELOS_HTTP_TIMEOUT", "2.5"))

# Lernplan — L-1: Anki-Sync-Server collection, opened STRICTLY read-only (mode=ro).
# The Rust anki-sync-server keeps one collection per user under a per-user
# subfolder (created on first sync), file ``collection.anki2`` (legacy scheduler)
# or ``collection.anki21`` (v2/v3 scheduler). MIKAEL OS reads this as a learning
# SIGNAL only — Anki stays the single spaced-repetition truth; we NEVER write and
# never open AnkiConnect (archived). No second SR store is ever created here.
ANKI_COLLECTION_DIR = Path(os.environ.get(
    "MIKAELOS_ANKI_DIR", "/srv/delta/data/study/anki-collection"))
ANKI_SOURCE = "anki-sync (collection.anki2 read-only)"
# Known Anki schema (col.ver) values we understand. Anki 2.1.x (legacy sched) = 11;
# the v2/v3 backend reports 11 in the .anki2 export too and adds side tables — we
# also accept 18 (some rust-exported collections). Anything else = honest
# "Schema unbekannt" rather than a guess. Table presence is the real guard.
_ANKI_KNOWN_VERS = {11, 18}

# Kalender/Heute — calendar-evidence projection (read-only SQLite; built every
# 30 min by calendar-evidence-index.timer via a real Google-Calendar-API
# read-only OAuth read, atomic replace, authority DERIVED_EVIDENCE_ONLY).
CALENDAR_DB = Path(os.environ.get(
    "MIKAELOS_CALENDAR_DB", "/srv/delta/data/calendar-evidence/calendar.db"))
# The two calendars in that DB — separated by calendar_id, NEVER blended:
CAL_PRIVATE = os.environ.get("MIKAELOS_CAL_PRIVATE", "mikael@deltator.de")          # workspace: private
CAL_FIRMA = os.environ.get("MIKAELOS_CAL_FIRMA", "deltatortechnik@gmail.com")       # firma_signal, read-only
CAL_SOURCE_LABEL = "calendar-evidence · calendar.db (Google read-only, 30-min-Mirror)"
CAL_HORIZON_DAYS = int(os.environ.get("MIKAELOS_CAL_HORIZON_DAYS", "14"))

try:  # Berlin local time for day windows (CLAUDE.md: immer Berliner Zeit)
    from zoneinfo import ZoneInfo
    _BERLIN: Optional[Any] = ZoneInfo("Europe/Berlin")
except Exception:  # pragma: no cover - zoneinfo is stdlib on 3.9+
    _BERLIN = None


def _whoop_token() -> str:
    """WHOOP internal token, read from THIS process' environment at call time.

    The dashboard service does not carry it yet — wiring it in is an operator
    step (EnvironmentFile drop-in + service restart = Prod-Restart-Gate), see
    ``docs/RUNBOOK-whoop-token.md``. As soon as the env var is present the
    detail path below activates automatically; until then the module stays an
    honest ``partial``. The value is never logged or written anywhere.
    """
    return os.environ.get("WHOOP_INTERNAL_TOKEN", "").strip()

# ---------------------------------------------------------------------------
# Phase 3 — the ONE propose capability. The plugin never writes and never
# executes; it builds a validated *intent* and, only on an explicit user click
# (dry_run=False), hands it to the EXISTING gated seam:
#     POST http://127.0.0.1:18083/actions
# The control-plane runs route.resolve → gate/queue seam → dispatch and decides
# ALLOW / DENY / REQUIRE_APPROVAL itself, minting a server-side Approval-Card when
# needed. The plugin NEVER calls /approvals/decide (that is the operator's
# execution-granting path) — there is no self-approve here, structurally.
#
# Auth to :18083: the controller binds 127.0.0.1 and gates purely on
# ``ip_address(...).is_loopback`` — there is NO token/header scheme. This plugin
# router runs inside the dashboard process on the same host, so a loopback POST
# is the intended, sufficient authorization. We treat *reachability of GET
# /healthz* as the connection check; if it is unreachable we report an honest
# ``auth_pending`` rather than faking a queued action.
CONTROL_PLANE_BASE = os.environ.get("MIKAELOS_CONTROL_PLANE", "http://127.0.0.1:18083")
# The single action kind this surface may propose: an engineering / Codex job.
# Private/engineering workspace only — never money, customer, or personnel.
PROPOSE_WORKSPACE = "engineering"
PROPOSE_JOB_TYPE = "engineering_task"
PROPOSE_CAPS = ["repo_read", "code_write", "propose_only"]
# Objectives that clearly belong to a gated business lane (money/customer/
# personnel) are refused here — this surface is engineering-only by design.
_OUT_OF_SCOPE_TERMS = (
    "rechnung", "sevdesk", "kunde", "kunden", "mahnung", "gehalt", "lohn",
    "personal", "zahlung", "überweis", "ueberweis", "angebot", "invoice",
    "buchung", "auftrag anlegen", "auftrag neu",
)

# How long a module's reading stays "fresh" before we call it stale.
STALE = {
    "body": 6 * 3600,       # WHOOP recovery is a morning reading
    "engineering": 3600,    # mission activity
    "tasks": 3600,
    "risel": 3600,
    "company": 24 * 3600,   # approval cards linger until decided
    "calendar": 2 * 3600,   # 30-min mirror timer + generous slack
    "learning": 14 * 24 * 3600,  # Anki-Sync ist gelegentlich (Gerät-getrieben) — großzügig
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


def _http_post_json(url: str, body: Dict[str, Any]) -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    """POST a JSON body to a fixed loopback URL. Read-side helper for the ONE
    gated propose seam (never used during dry-run). Returns (status, json)."""
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    try:
        req = Request(url, data=data, headers=headers, method="POST")
        with urlopen(req, timeout=HTTP_TIMEOUT) as resp:  # noqa: S310 - fixed loopback base
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw.strip() else {})
    except HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8"))
        except Exception:  # noqa: BLE001
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
    # _whoop_token() reads the env at call time: the moment the operator wires
    # WHOOP_INTERNAL_TOKEN into the dashboard service (gated step, see
    # docs/RUNBOOK-whoop-token.md) this path activates without a code change.
    summary_obj: Optional[Dict[str, Any]] = None
    token = _whoop_token()
    if token:
        code, data = _http_get_json(f"{WHOOP_BASE}/internal/summary?days=1", token=token)
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
                  "Anbindung = gated Operator-Schritt (EnvironmentFile-Drop-in + "
                  "Dienst-Restart): docs/RUNBOOK-whoop-token.md."),
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
# (d) Kalender / Heute — calendar-evidence projection, read-only SQLite.
#
# The DB holds two calendars, split by ``calendar_id`` and rendered as two
# strictly label-separated blocks:
#   * CAL_PRIVATE (mikael@deltator.de)      → the private calendar (workspace
#     ``private``). The ONLY honest private source on Rise-L.
#   * CAL_FIRMA  (deltatortechnik@gmail.com) → the company dispo calendar,
#     shown ONLY as an explicitly labelled, read-only Firma-Signal block.
#     A dispo entry is never presented as a private appointment; private
#     entries never appear in any company projection. Hermes routine state
#     (schedule_state.json) is deliberately NOT mixed in here — automation
#     runs are engineering heartbeat, not appointments (see module_risel).
#
# Evidence doctrine: this is a DERIVED_EVIDENCE_ONLY mirror — a projection to
# read, never a truth store; this module reads (mode=ro), it never writes.
# ---------------------------------------------------------------------------
def _berlin_now() -> datetime:
    return datetime.now(_BERLIN) if _BERLIN is not None else _now()


def _cal_query_window(lo: str, hi: str, limit: int) -> Dict[str, Any]:
    """Read both calendars in the string window [lo, hi) — read-only.

    ``starts_at`` is either a date-only string (all-day) or an ISO datetime with
    the Berlin local offset, so lexicographic bounds on local-date/-datetime
    strings match chronological order. Returns
    ``{"ok", "error", "fetched": {cal_id: iso}, "private": [...], "firma": [...]}``.
    """
    result: Dict[str, Any] = {"ok": False, "error": None, "fetched": {}, "private": [], "firma": []}
    if not CALENDAR_DB.exists():
        result["error"] = f"{CALENDAR_DB} nicht vorhanden"
        return result
    try:
        con = sqlite3.connect(f"file:{CALENDAR_DB}?mode=ro", uri=True, timeout=1.5)
        try:
            for cal_id, fetched_at in con.execute("SELECT calendar_id, fetched_at FROM sources"):
                result["fetched"][str(cal_id)] = fetched_at
            for cal_id, key in ((CAL_PRIVATE, "private"), (CAL_FIRMA, "firma")):
                cur = con.execute(
                    "SELECT summary, starts_at, ends_at, location FROM events "
                    "WHERE calendar_id = ? AND (status IS NULL OR status <> 'cancelled') "
                    "AND starts_at >= ? AND starts_at < ? ORDER BY starts_at LIMIT ?",
                    (cal_id, lo, hi, limit),
                )
                result[key] = [
                    {"summary": (r[0] or "(ohne Titel)").strip() or "(ohne Titel)",
                     "starts_at": str(r[1] or ""), "ends_at": r[2], "location": r[3]}
                    for r in cur
                ]
        finally:
            con.close()
    except (sqlite3.Error, OSError) as exc:
        result["error"] = f"calendar.db nicht lesbar ({type(exc).__name__})"
        return result
    result["ok"] = True
    return result


def _cal_event_value(starts_at: str, today_str: str) -> str:
    """Compact time label: 'HH:MM' today, 'dd.mm. HH:MM' later, 'ganztägig'/date for all-day."""
    if len(starts_at) == 10:  # date-only = all-day
        return "ganztägig" if starts_at == today_str else f"{starts_at[8:10]}.{starts_at[5:7]}."
    dt = _parse_iso(starts_at)
    if dt is None:
        return "—"
    local = dt.astimezone(_BERLIN) if _BERLIN is not None else dt
    hhmm = local.strftime("%H:%M")
    return hhmm if local.date().isoformat() == today_str else f"{local.strftime('%d.%m.')} {hhmm}"


def _cal_row(ev: Dict[str, Any], today_str: str, *, firma: bool) -> Dict[str, Any]:
    """One lens row. The workspace is carried ON the row both as a human label
    (``sub``) and as a STRUCTURAL field (``workspace`` + ``readOnly`` for the
    Firma-Block, module_company-Präzedenz), so the two calendars can never be
    blended — neither visually nor maschinenlesbar, whatever the ordering."""
    if firma:
        sub = "Firma-Signal · Dispo (nur lesen)"
        icon, accent = "building-2", "neutral"
    else:
        loc = str(ev.get("location") or "").strip()
        sub = "Privat" + (f" · {loc[:40]}" if loc else "")
        icon, accent = "calendar-days", "cyan"
    row = {
        "icon": icon, "accent": accent,
        "title": str(ev.get("summary") or "")[:70],
        "sub": sub,
        "value": _cal_event_value(str(ev.get("starts_at") or ""), today_str),
        # Structural workspace marking per row (nicht nur sub-Text):
        "workspace": "company_signal" if firma else "private",
    }
    if firma:
        row["readOnly"] = True  # Analogon zu module_company extra={"readOnly": True}
    return row


def _cal_unavailable(summary: str, note: str) -> Dict[str, Any]:
    return _prov(
        state="unavailable", source=CAL_SOURCE_LABEL, source_kind="file",
        workspace="private", permission="Nur lesen (Evidence, mode=ro)",
        summary=summary, stale_after=STALE["calendar"], note=note,
        extra={
            "calendars": {"private": CAL_PRIVATE, "firmaSignal": CAL_FIRMA},
            # Contract stability: even without data the module declares its
            # mixed nature honestly — no company rows shown, block stays ro.
            "hasCompanyData": False,
            "companyDataReadOnly": True,
        },
    )


def _cal_module(*, window: str) -> Dict[str, Any]:
    """Shared builder for Kalender (upcoming) and Heute (today's window)."""
    now_local = _berlin_now()
    today_str = now_local.date().isoformat()
    if window == "today":
        lo = today_str
        hi = (now_local.date() + timedelta(days=1)).isoformat()
        limit = 6
    else:  # upcoming: from now to +CAL_HORIZON_DAYS
        lo = now_local.isoformat(timespec="seconds")
        hi = (now_local.date() + timedelta(days=CAL_HORIZON_DAYS + 1)).isoformat()
        limit = 4
    data = _cal_query_window(lo, hi, limit)
    if not data["ok"]:
        return _cal_unavailable(
            "Kalender-Projektion nicht lesbar",
            f"{data['error']} — calendar-evidence-index.timer prüfen. "
            "Keine Ersatzdaten: Modul zeigt lieber nichts als Erfundenes.",
        )
    observed = _parse_iso(data["fetched"].get(CAL_PRIVATE)) or _parse_iso(data["fetched"].get(CAL_FIRMA))
    priv, firma = data["private"], data["firma"]
    if CAL_PRIVATE not in data["fetched"]:
        # DB exists but carries no private mirror — stay honest, never promote
        # the company calendar into the private slot.
        return _cal_unavailable(
            "Keine private Kalender-Projektion",
            "calendar.db enthält keine Quelle für den privaten Kalender "
            f"({CAL_PRIVATE}) — Anbindung = eigener gated Schritt "
            "(calendar-evidence-Lane). Firma-Dispo wird hier bewusst nicht "
            "als Ersatz angezeigt.",
        )
    # Private block first, Firma-Signal block after — each row self-labelled.
    n_priv, n_firma = (4, 3) if window == "today" else (3, 2)
    rows = [_cal_row(e, today_str, firma=False) for e in priv[:n_priv]]
    rows += [_cal_row(e, today_str, firma=True) for e in firma[:n_firma]]
    empty = not rows
    state = _freshness_state(observed, STALE["calendar"], empty=empty)
    if window == "today":
        summary = (f"{len(priv)} privat · {len(firma)} Dispo (Firma-Signal)"
                   if not empty else "Heute keine Termine")
        note = ("Heute aus calendar-evidence (read-only): Block „Privat“ = "
                f"{CAL_PRIVATE}, Block „Firma-Signal“ = Dispo-Kalender "
                f"{CAL_FIRMA} — strikt getrennt, nie vermischt. "
                "Hermes-Routinen sind bewusst NICHT enthalten (kein Termin).")
        # Deliberately NO blended count: privat und Dispo werden getrennt
        # gezählt, damit keine Kachel-Zahl je als „rein privat" lesbar ist.
        extra: Dict[str, Any] = {}
    else:
        nxt = _cal_event_value(str(priv[0]["starts_at"]), today_str) if priv else None
        summary = (f"Nächster privat · {nxt}" if nxt else
                   f"Keine privaten Termine ({CAL_HORIZON_DAYS} T)")
        if firma:
            summary += f" · {len(firma)}+ Dispo"
        note = ("Privater Kalender = calendar-evidence-Projektion von "
                f"{CAL_PRIVATE} (Google read-only, 30-min-Mirror, atomarer "
                "Replace). Firma-Dispo erscheint nur als gekennzeichnetes "
                "read-only Firma-Signal, nie als privater Termin.")
        extra = {"nextTime": nxt}
    extra.update({
        # module_company-Präzedenz, maschinenlesbar: dieses private Modul
        # trägt einen read-only company_signal-Block (Dispo). hasCompanyData
        # ist per-Payload ehrlich (False, wenn gerade keine Dispo-Zeile da).
        "hasCompanyData": bool(firma),
        "companyDataReadOnly": True,
        # Entkoppelte Zählung statt geblendeter Summe (Kachel-Metrik):
        "privateCount": len(priv),
        "firmaCount": len(firma),
        "calendars": {"private": CAL_PRIVATE, "firmaSignal": CAL_FIRMA},
        "workspaceSplit": {"private": len(priv), "firma_signal": len(firma)},
        "fetchedAt": {
            "private": data["fetched"].get(CAL_PRIVATE),
            "firmaSignal": data["fetched"].get(CAL_FIRMA),
        },
        "authority": "DERIVED_EVIDENCE_ONLY",
    })
    return _prov(
        state=state, source=CAL_SOURCE_LABEL, source_kind="file",
        workspace="private", permission="Nur lesen (Evidence, mode=ro)",
        summary=summary, observed_at=observed, stale_after=STALE["calendar"],
        rows=rows, note=note, extra=extra,
    )


def module_today() -> Dict[str, Any]:
    return _cal_module(window="today")


def module_kalender() -> Dict[str, Any]:
    return _cal_module(window="upcoming")


# ---------------------------------------------------------------------------
# Concept fixtures — modules with no authoritative source yet. demo:true so the
# UI keeps the "Konzept" pill; each names its gap honestly.
# ---------------------------------------------------------------------------
def _fixture(module_id: str, *, workspace: str, summary: str, rows: List[Dict[str, Any]], note: str) -> Dict[str, Any]:
    return _prov(
        state="fresh", demo=True, source="konzept", source_kind="konzept",
        workspace=workspace, permission="—", summary=summary, rows=rows, note=note,
    )


# ---------------------------------------------------------------------------
# Lernplan (L-1) — read-only Anki-Sync-Server collection projection.
#   * Collection file is discovered by glob (per-user subfolder appears on first
#     sync); until then the module is honestly ``empty`` ("noch nicht
#     synchronisiert"), never faked.
#   * Opened URI ``mode=ro`` — zero writes, never AnkiConnect.
#   * Schema is verified (col+cards+revlog tables, col.ver known) before any
#     count; an unknown/foreign schema yields ``unavailable`` ("Schema
#     unbekannt"), never a crash and never invented numbers.
# ---------------------------------------------------------------------------
_ANKI_PERM = "Nur lesen (Anki collection.anki2, mode=ro)"


def _find_anki_collection() -> Optional[Path]:
    """Newest real ``*collection*.anki2*`` under the sync dir, sidecars excluded.

    A per-user subfolder is created on first sync, so we glob recursively. WAL/SHM
    /journal sidecars are dropped; ``.anki21`` (newer scheduler) is preferred over
    ``.anki2``, then most-recently-modified wins. Returns ``None`` when nothing
    is synced yet (the honest current state)."""
    try:
        matches = glob.glob(str(ANKI_COLLECTION_DIR / "**" / "*collection*.anki2*"), recursive=True)
    except OSError:
        return None
    files = [
        m for m in matches
        if os.path.isfile(m) and not m.endswith(("-wal", "-shm", "-journal"))
    ]
    if not files:
        return None

    def _key(p: str) -> Tuple[int, float]:
        try:
            mtime = os.path.getmtime(p)
        except OSError:
            mtime = 0.0
        return (1 if p.endswith(".anki21") else 0, mtime)

    files.sort(key=_key, reverse=True)
    return Path(files[0])


def _anki_today_number(crt: int) -> int:
    """Anki 'today' as an integer day count since collection creation (``crt``,
    epoch seconds). Defensive/approximate (ignores the configurable rollover hour
    — fine for a due-count signal); never negative."""
    if crt <= 0:
        return 0
    now = int(_now().timestamp())
    return max(0, (now - crt) // 86400)


def _anki_streak(con: "sqlite3.Connection", crt: int, today: int) -> int:
    """Consecutive study-day streak from the revlog. A day counts if any review
    row falls in it; the streak is anchored to today (or yesterday, if today's
    reviews aren't in yet) and walked backwards while days stay contiguous."""
    days = set()
    try:
        for (d,) in con.execute(
            "SELECT DISTINCT CAST((id/1000 - ?) / 86400 AS INTEGER) FROM revlog", (crt,)
        ):
            if d is not None:
                days.add(int(d))
    except sqlite3.Error:
        return 0
    if not days:
        return 0
    if today in days:
        start = today
    elif (today - 1) in days:
        start = today - 1
    else:
        return 0
    streak = 0
    d = start
    while d in days:
        streak += 1
        d -= 1
    return streak


def _anki_decks(con: "sqlite3.Connection", decks_json: Any, tables: set, today: int) -> List[Dict[str, Any]]:
    """Deck names + per-deck due counts. Deck metadata lives either in the legacy
    ``col.decks`` JSON blob or (newer schema) a ``decks`` table; try both. The
    'Default' deck is dropped when it carries nothing meaningful."""
    named: List[Tuple[str, str]] = []
    if decks_json:
        try:
            obj = json.loads(decks_json)
            if isinstance(obj, dict):
                for did, meta in obj.items():
                    name = str(meta.get("name") or "").strip() if isinstance(meta, dict) else ""
                    if name and name.lower() != "default":
                        named.append((str(did), name))
        except (ValueError, TypeError):
            pass
    if not named and "decks" in tables:
        try:
            for did, name in con.execute("SELECT id, name FROM decks"):
                nm = str(name or "").strip()
                if nm and nm.lower() != "default":
                    named.append((str(did), nm))
        except sqlite3.Error:
            pass
    out: List[Dict[str, Any]] = []
    for did, name in named[:6]:
        try:
            cnt = con.execute(
                "SELECT COUNT(*) FROM cards WHERE did = ? AND "
                "((queue = 2 AND due <= ?) OR queue IN (1, 3))",
                (int(did), today),
            ).fetchone()[0]
        except (sqlite3.Error, ValueError):
            cnt = 0
        out.append({"id": did, "name": name, "due": int(cnt or 0)})
    return out


def _read_anki(path: Path) -> Dict[str, Any]:
    """Read the collection read-only and return a plain dict of counts. ``ok`` is
    False with a ``reason`` (``open`` | ``schema`` | ``read``) on any failure —
    the caller maps that to an honest state; nothing is ever fabricated."""
    out: Dict[str, Any] = {
        "ok": False, "reason": None, "error": None, "ver": None,
        "due_today": 0, "total_cards": 0, "learned_today": 0,
        "streak": 0, "retention": None, "decks": [],
    }
    try:
        con = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1.5)
    except sqlite3.Error as exc:
        out["reason"], out["error"] = "open", type(exc).__name__
        return out
    try:
        tables = {r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
        if not {"col", "cards", "revlog"} <= tables:
            out["reason"], out["error"] = "schema", "col/cards/revlog fehlt"
            return out
        col_row = con.execute("SELECT crt, ver, decks FROM col LIMIT 1").fetchone()
        if not col_row:
            out["reason"], out["error"] = "schema", "col-Tabelle leer"
            return out
        crt = int(col_row[0] or 0)
        ver = int(col_row[1] or 0)
        decks_json = col_row[2]
        out["ver"] = ver
        if ver not in _ANKI_KNOWN_VERS:
            out["reason"], out["error"] = "schema", f"ver={ver} unbekannt"
            return out

        today = _anki_today_number(crt)
        out["due_today"] = int(con.execute(
            "SELECT COUNT(*) FROM cards WHERE (queue = 2 AND due <= ?) OR queue IN (1, 3)",
            (today,),
        ).fetchone()[0] or 0)
        out["total_cards"] = int(con.execute(
            "SELECT COUNT(*) FROM cards").fetchone()[0] or 0)

        day_start_ms = (crt + today * 86400) * 1000
        out["learned_today"] = int(con.execute(
            "SELECT COUNT(*) FROM revlog WHERE id >= ?", (day_start_ms,)
        ).fetchone()[0] or 0)

        out["streak"] = _anki_streak(con, crt, today)

        # True-ish retention over the trailing 30 anki-days: share of review-type
        # (type=1) answers that were not "Again" (ease > 1).
        cutoff_ms = (crt + max(0, today - 30) * 86400) * 1000
        rrow = con.execute(
            "SELECT COUNT(*), SUM(CASE WHEN ease > 1 THEN 1 ELSE 0 END) "
            "FROM revlog WHERE type = 1 AND id >= ?", (cutoff_ms,)
        ).fetchone()
        total_rev = int(rrow[0] or 0)
        passed = int(rrow[1] or 0)
        out["retention"] = (passed / total_rev) if total_rev else None

        out["decks"] = _anki_decks(con, decks_json, tables, today)
    except sqlite3.Error as exc:
        out["reason"], out["error"] = "read", type(exc).__name__
        return out
    finally:
        con.close()
    out["ok"] = True
    return out


def module_learning() -> Dict[str, Any]:
    path = _find_anki_collection()
    if path is None:
        # Honest current state: sync server is up but no device has synced yet, so
        # no per-user collection file exists. Never a fake "3 fällig".
        return _prov(
            state="empty", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary="Noch nicht synchronisiert — Anki-Sync bereit",
            stale_after=STALE["learning"],
            note=("Anki-Collection noch nicht synchronisiert. Der Anki-Sync-Server "
                  "ist bereit — sobald das erste Gerät synchronisiert, erscheinen "
                  "hier fällige Karten, Retention und Streak (read-only, Anki bleibt "
                  "das Lern-Wahrheitssystem)."),
            extra={"anki": {"collection": None, "syncReady": True}},
        )

    try:
        observed = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    except OSError:
        observed = None

    data = _read_anki(path)
    if not data["ok"]:
        if data["reason"] == "schema":
            return _prov(
                state="unavailable", source=ANKI_SOURCE, source_kind="file",
                workspace="private", permission=_ANKI_PERM,
                summary="Anki-Schema unbekannt",
                observed_at=observed, stale_after=STALE["learning"],
                note=("Schema unbekannt — die gefundene Collection passt nicht zum "
                      f"erwarteten Anki-Format ({data['error']}). Keine Zahlen "
                      "geraten; Datei prüfen."),
                extra={"anki": {"collection": str(path), "schemaOk": False,
                                "ver": data["ver"]}},
            )
        return _prov(
            state="unavailable", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary="Anki-Collection nicht lesbar",
            observed_at=observed, stale_after=STALE["learning"],
            note=(f"Collection gefunden, aber nicht lesbar ({data['reason']}: "
                  f"{data['error']}). Read-only — nichts wird verändert."),
            extra={"anki": {"collection": str(path), "schemaOk": False}},
        )

    if data["total_cards"] == 0:
        return _prov(
            state="empty", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary="Collection synchronisiert — noch keine Karten",
            observed_at=observed, stale_after=STALE["learning"],
            note=("Anki-Collection ist da, enthält aber noch keine Karten. "
                  "Sobald Decks/Karten synchronisiert sind, erscheinen fällige "
                  "Karten, Retention und Streak."),
            extra={"anki": {"collection": str(path), "schemaOk": True,
                            "totalCards": 0}},
        )

    due = data["due_today"]
    streak = data["streak"]
    ret = data["retention"]
    ret_pct = f"{round(ret * 100)} %" if ret is not None else "—"

    rows: List[Dict[str, Any]] = [
        {"icon": "graduation-cap", "accent": "violet", "title": "Fällig heute",
         "sub": f"{data['total_cards']} Karten gesamt",
         "status": ("running" if due > 0 else "verified"),
         "statusLabel": ("Zu lernen" if due > 0 else "Alles gelernt"),
         "value": str(due)},
        {"icon": "target", "accent": "cyan", "title": "Retention (30 T)",
         "sub": "Review-Antworten ohne „Nochmal“", "value": ret_pct},
        {"icon": "flame", "accent": "violet", "title": "Streak",
         "sub": f"{data['learned_today']} heute gelernt",
         "value": f"{streak} T"},
    ]
    for d in data["decks"]:
        rows.append({
            "icon": "book-open", "accent": "violet", "title": d["name"],
            "sub": "Deck", "value": (f"{d['due']} fällig" if d["due"] else "—"),
        })

    summary = f"{due} fällig · {ret_pct} Retention · {streak} T Streak"
    state = _freshness_state(observed, STALE["learning"])
    return _prov(
        state=state, source=ANKI_SOURCE, source_kind="file",
        workspace="private", permission=_ANKI_PERM,
        summary=summary, observed_at=observed, stale_after=STALE["learning"],
        rows=rows,
        note=("Read-only-Projektion der Anki-Sync-Collection (mode=ro). Anki bleibt "
              "das alleinige Spaced-Repetition-Wahrheitssystem — MIKAEL OS liest nur, "
              "kein AnkiConnect, keine zweite SR-DB."),
        extra={
            "anki": {"collection": str(path), "schemaOk": True, "ver": data["ver"]},
            "due": due,
            "count": due,               # generic tile metric (deriveMetric)
            "retention": ret,
            "retentionPct": ret_pct,
            "streak": streak,
            "learnedToday": data["learned_today"],
            "totalCards": data["total_cards"],
            "decks": data["decks"],
        },
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
    # today/kalender: privates Modul MIT gekennzeichnetem read-only
    # company_signal-Block (Dispo) — Meta-Flag = Design-Wahrheit; der Reader
    # überschreibt hasCompanyData pro Payload ehrlich (module_company-Präzedenz).
    {"id": "today", "title": "Heute", "icon": "sun", "accent": "cyan", "workspace": "private",
     "hasCompanyData": True, "companyDataReadOnly": True},
    {"id": "tasks", "title": "Aufgaben & Ziele", "icon": "target", "accent": "amber", "workspace": "private"},
    {"id": "learning", "title": "Lernplan", "icon": "graduation-cap", "accent": "violet", "workspace": "private"},
    {"id": "risel", "title": "Rise-L Prozesse", "icon": "server", "accent": "blue", "workspace": "engineering"},
    {"id": "travel", "title": "Reisen", "icon": "plane", "accent": "cyan", "workspace": "private"},
    {"id": "nutrition", "title": "Ernährung", "icon": "leaf", "accent": "emerald", "workspace": "private"},
    {"id": "company", "title": "Firma-Signale", "icon": "building-2", "accent": "neutral", "workspace": "company_signal", "readOnly": True},
    {"id": "kalender", "title": "Kalender", "icon": "calendar-days", "accent": "cyan", "workspace": "private",
     "hasCompanyData": True, "companyDataReadOnly": True},
    {"id": "body", "title": "Körper / WHOOP", "icon": "heart-pulse", "accent": "emerald", "workspace": "private"},
    {"id": "journal", "title": "Journal", "icon": "notebook-pen", "accent": "neutral", "workspace": "private"},
    {"id": "engineering", "title": "Engineering / Codex", "icon": "code-xml", "accent": "violet", "workspace": "engineering"},
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


# ===========================================================================
# Phase 3 — propose lifecycle (the ONLY write-adjacent path). Everything below
# is propose-only: it builds/validates an intent, previews it (dry-run, no
# network), and on an explicit live submit hands it to the gated :18083/actions
# seam. It NEVER calls /approvals/decide and NEVER self-approves.
# ===========================================================================
def _idempotency_key(objective: str, workspace: str, job_type: str) -> str:
    """Deterministic key: the same objective proposes the same job, so a repeat
    click can be de-duplicated by the control-plane instead of double-queued."""
    raw = f"{workspace}|{job_type}|{objective.strip()}".encode("utf-8")
    return "mos-" + hashlib.sha256(raw).hexdigest()[:16]


def build_intent(objective: str) -> Dict[str, Any]:
    """The exact intent this surface would propose. Pure/deterministic — no I/O."""
    objective = objective.strip()
    return {
        "objective": objective,
        "mandant": None,                     # engineering/private — no company mandant
        "workspace": PROPOSE_WORKSPACE,
        "workspaceType": PROPOSE_WORKSPACE,
        "jobType": PROPOSE_JOB_TYPE,
        "requiredCapabilities": list(PROPOSE_CAPS),
        "requiredGate": "engineering_propose",
        "idempotencyKey": _idempotency_key(objective, PROPOSE_WORKSPACE, PROPOSE_JOB_TYPE),
        "provenance": {
            "plugin": "mikael-os",
            "surface": "engineering-lens",
            "proposeOnly": True,
            "createdUtc": _iso(_now()),
        },
    }


def predict_gate(intent: Dict[str, Any]) -> Dict[str, Any]:
    """The gate this intent is EXPECTED to hit. A prediction only — the real
    ALLOW/DENY/REQUIRE_APPROVAL decision is made server-side by the control-plane
    when (and only when) the user submits live."""
    return {
        "gateClass": intent.get("requiredGate", "engineering_propose"),
        "expectedOutcome": "require_approval",
        "human": "Voraussichtlich: Freigabe nötig · Engineering-Vorschlag (propose-only).",
        "note": "Das Plugin führt nichts aus — dein Gate entscheidet.",
    }


def _scope_reason(objective: str) -> Optional[str]:
    low = objective.lower()
    hit = next((t for t in _OUT_OF_SCOPE_TERMS if t in low), None)
    if hit:
        return (f"Außerhalb Engineering-Scope (Treffer: „{hit}“). Geld/Kunde/Personal "
                f"laufen über die gegateten Fach-Lanes, nicht über diese Fläche.")
    return None


def control_plane_status() -> Dict[str, Any]:
    """Honest reachability/auth probe for :18083. No token scheme exists — the
    controller authorizes by loopback only — so 'reachable' IS the auth check."""
    code, body = _http_get_json(f"{CONTROL_PLANE_BASE}/healthz")
    reachable = code == 200 and isinstance(body, dict)
    return {
        "base": CONTROL_PLANE_BASE,
        "reachable": bool(reachable),
        "auth": "loopback" if reachable else "auth_pending",
        "authNote": ("Controller bindet 127.0.0.1 und autorisiert per Loopback — "
                     "kein Token nötig." if reachable else
                     "Control-Plane :18083 nicht erreichbar — Freigabe-Anbindung ausstehend."),
    }


# Map a control-plane /actions response status onto the UI lifecycle vocabulary.
_ACTION_STATUS_LIFECYCLE = {
    "approval_required": "waiting_approval",
    "proposed": "waiting_approval",   # propose-only draft; its write is gated downstream
    "queued": "waiting_approval",
    "read": "answered",
    "answered": "answered",
    "executed": "executed",
    "unrouted": "error",
    "error": "error",
    "blocked": "denied",
}


def propose_intent(objective: str, dry_run: bool = True) -> Dict[str, Any]:
    """Build+validate the intent. dry_run=True (default) previews it WITHOUT any
    network call. dry_run=False hands it to the gated :18083/actions seam and maps
    the response onto the lifecycle — it never grants execution itself."""
    objective = (objective or "").strip()
    if not objective:
        return {"ok": False, "status": "invalid", "note": "Kein Ziel angegeben."}
    if len(objective) > 600:
        return {"ok": False, "status": "invalid", "note": "Ziel zu lang (max. 600 Zeichen)."}
    scope = _scope_reason(objective)
    if scope:
        return {"ok": False, "status": "out_of_scope", "note": scope}

    intent = build_intent(objective)
    gate = predict_gate(intent)
    plan = {
        "objective": objective,
        "workspaceLabel": "Engineering",
        "jobType": intent["jobType"],
        "capabilities": intent["requiredCapabilities"],
        "requiredGate": intent["requiredGate"],
        "gateHuman": gate["human"],
    }

    if dry_run:
        cp = control_plane_status()
        return {
            "ok": True,
            "mode": "dry_run",
            "status": "vorschau",
            "willFire": False,
            "proposeOnly": True,
            "intent": intent,
            "plan": plan,
            "predictedGate": gate,
            "controlPlane": cp,
            "note": ("Nur Vorschau — es wurde NICHTS an das Gate gesendet. "
                     "Das Plugin führt nicht aus; dein Gate entscheidet."),
        }

    # ---- Live submit (explicit user click) -> the ONE gated POST. ----------
    cp = control_plane_status()
    if not cp["reachable"]:
        return {
            "ok": False, "mode": "live", "status": "auth_pending",
            "lifecycle": "auth_pending", "intent": intent, "controlPlane": cp,
            "note": cp["authNote"],
        }
    packet = {
        "text": objective,                       # the controller routes on text
        "source": "mikael-os",
        "idempotency_key": intent["idempotencyKey"],
        "workspace_type": PROPOSE_WORKSPACE,
        "provenance": intent["provenance"],
    }
    code, resp = _http_post_json(f"{CONTROL_PLANE_BASE}/actions", packet)
    if code is None or not isinstance(resp, dict):
        return {
            "ok": False, "mode": "live", "status": "error", "lifecycle": "error",
            "intent": intent, "controlPlane": cp,
            "note": "Antwort der Control-Plane nicht lesbar.",
        }
    action_status = str(resp.get("status") or "error")
    lifecycle = _ACTION_STATUS_LIFECYCLE.get(action_status, "error")
    card = resp.get("card") if isinstance(resp.get("card"), dict) else None
    card_id = str(card.get("id")) if card and card.get("id") else None
    return {
        "ok": lifecycle not in {"error"},
        "mode": "live",
        "status": action_status,
        "lifecycle": lifecycle,
        "intent": intent,
        "cardId": card_id,
        "gate": resp.get("gate"),
        "controlPlane": cp,
        "raw": {k: resp.get(k) for k in ("status", "gate", "summary") if k in resp},
        "note": ("An das Gate übergeben — wartet auf deine Freigabe."
                 if lifecycle == "waiting_approval" else
                 ("Von der Control-Plane beantwortet." if lifecycle == "answered" else
                  resp.get("summary") or "Ergebnis von der Control-Plane.")),
    }


# Card status (as stored in /srv/hermes/approvals) -> UI lifecycle. Read-only.
_CARD_STATUS_LIFECYCLE = {
    "pending": "waiting_approval",
    "": "waiting_approval",
    "approved": "approved",
    "allow": "approved",
    "allowed": "approved",
    "executed": "executed",
    "done": "executed",
    "denied": "denied",
    "deny": "denied",
    "rejected": "denied",
    "error": "error",
    "failed": "error",
}


def receipt_status(card_id: str = "", key: str = "", objective: str = "") -> Dict[str, Any]:
    """Read-only receipt/status lookup over the Phase-2 read models
    (Approval-Cards + mission.v2). Never writes, never decides. Matches a card by
    id, or by objective text (the controller stores the objective as the card
    ``text``). Returns the current lifecycle so the UI follows real receipts."""
    card: Optional[Dict[str, Any]] = None
    if card_id:
        p = APPROVALS_DIR / f"{card_id}.json"
        try:
            card = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            card = None
    if card is None and objective:
        newest_dt: Optional[datetime] = None
        for path in sorted(glob.glob(str(APPROVALS_DIR / "appr_*.json"))):
            try:
                c = json.loads(Path(path).read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue
            if str(c.get("text") or "").strip() != objective.strip():
                continue
            dt = _parse_iso(c.get("created_utc"))
            if newest_dt is None or (dt and dt > newest_dt):
                newest_dt, card = dt, c
    if card is None:
        return {
            "ok": True, "found": False, "lifecycle": "waiting_approval",
            "note": "Noch keine Freigabe-Entscheidung gefunden (Card offen oder nicht angelegt).",
        }
    cstatus = str(card.get("status") or "").lower()
    lifecycle = _CARD_STATUS_LIFECYCLE.get(cstatus, "waiting_approval")
    return {
        "ok": True,
        "found": True,
        "cardId": card.get("id"),
        "cardStatus": cstatus or "pending",
        "lifecycle": lifecycle,
        "gateClass": card.get("gate_class"),
        "decidedBy": card.get("decided_by"),
        "decidedUtc": card.get("decided_utc"),
        "note": {
            "waiting_approval": "Approval-Card offen — wartet auf Operator-Freigabe.",
            "approved": "Freigegeben — Ausführung folgt server-seitig.",
            "executed": "Ausgeführt (server-seitiges Receipt).",
            "denied": "Abgelehnt.",
            "error": "Fehler bei der Ausführung.",
        }.get(lifecycle, "Status gelesen."),
    }


# ---------------------------------------------------------------------------
# HTTP surface. GET reads are zero-write. The single POST route is propose-only:
# dry-run previews with no network; a live submit hands the intent to the gated
# :18083/actions seam. Neither path ever calls /approvals/decide.
# ---------------------------------------------------------------------------
@router.post("/actions/propose")
def actions_propose(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    """Propose an engineering/Codex job. Body: ``{objective, dryRun}``.

    ``dryRun`` defaults to **True** — the safe preview that fires nothing. Only an
    explicit ``dryRun:false`` (a deliberate user click in the UI) hands the intent
    to the gated control-plane. The gate decides; the plugin never executes.
    """
    if not isinstance(payload, dict):
        payload = {}
    objective = str(payload.get("objective") or "").strip()
    dry_run = payload.get("dryRun", payload.get("dry_run", True))
    return propose_intent(objective, dry_run=bool(dry_run))


@router.get("/actions/receipt")
def actions_receipt(cardId: str = "", key: str = "", objective: str = "") -> Dict[str, Any]:
    """Read-only receipt/status lookup (Approval-Cards + mission.v2). No writes."""
    return receipt_status(card_id=cardId, key=key, objective=objective)


@router.get("/health")
def health() -> Dict[str, Any]:
    """Liveness + which read paths resolved right now (diagnostic)."""
    return {
        "status": "ok",
        "plugin": "mikael-os",
        "version": "0.3.0",
        "phase": 3,
        "readPaths": {
            "missions_dir": str(MISSIONS_DIR),
            "missions_readable": MISSIONS_DIR.exists(),
            "task_policy": str(POLICY_PATH),
            "schedule_state": str(SCHEDULE_STATE),
            "approvals_dir": str(APPROVALS_DIR),
            "whoop_base": WHOOP_BASE,
            "whoop_token_present": bool(_whoop_token()),
            "calendar_db": str(CALENDAR_DB),
            "calendar_db_readable": CALENDAR_DB.exists(),
        },
        "propose": {
            "capability": "engineering_task (propose-only)",
            "controlPlane": CONTROL_PLANE_BASE,
            "selfApprove": False,
            "note": "Plugin proposes via gated /actions only; never calls /approvals/decide.",
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
