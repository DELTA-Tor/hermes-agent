"""MIKAEL OS dashboard backend — M0-M5 projections and gated proposals.

Mounted at ``/api/plugins/mikael-os/`` by the Nous Hermes dashboard
(``getattr(mod, "router")`` is included with that prefix — see
``hermes_cli/web_server.py::_mount_plugin_api_routes``). The router runs
*inside* the dashboard FastAPI process (user ``ubuntu``); FastAPI runs each
sync endpoint in a threadpool, so the blocking file/HTTP/subprocess reads
below are safe.

Runtime scope — READ BY DEFAULT, PROPOSE THROUGH EXISTING GATES
---------------------------------------------------------------
This module contains no direct ``INSERT``/``UPDATE``/``DELETE`` against a
business truth. Most routes only read. Two explicit proposal routes can hand an
intent to the existing Control-Plane ``/actions`` seam only after a deliberate
``dryRun:false`` request; they never approve or execute it. Mac actions remain
typed, deferred previews even when a live click is requested. FSM writes always
stay behind Cockpit :18065. The Personal OS projects over authoritative truth;
it never becomes a second store.

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
from urllib.parse import quote
from urllib.request import Request, urlopen

try:
    from fastapi import APIRouter
    from fastapi import HTTPException
    from fastapi import Body
    from fastapi.responses import Response  # PWA static files (manifest/sw/shell)
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

    class Response:  # type: ignore
        def __init__(self, content="", media_type="text/plain", headers=None, **_kw):
            self.content = content
            self.media_type = media_type
            self.headers = headers or {}


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

# Lernplan — L-3: Klausur-Countdown/Pacing config + the Jarvis coaching read-path.
# ``exams.json`` is a small, READ-ONLY study config (one entry per Fach with a
# date + Themen + optional Anki deck name to link the due-count). It lives in the
# established study data dir NEXT TO the collection — never inside the plugin
# code tree, and the plugin only ever reads it (no write, no schema owned here).
EXAMS_PATH = Path(os.environ.get(
    "MIKAELOS_EXAMS", "/srv/delta/data/study/exams.json"))
# The Feynman coaching evaluation is genuinely LLM-graded — never faked. The only
# honest way to grade a free explanation is to ask Jarvis. We route to the Hermes
# **Brain Gateway** (OpenAI-compatible ``/v1/chat/completions``, the abo-first
# Brain chain, loopback :18084). This is a READ/coaching call — no business write,
# no mission, no gate. It needs the gateway Bearer token; following the WHOOP
# pattern the token is resolved at call time (env first, then the sanctioned SOPS
# ``secret get`` path) and NEVER logged/persisted. Absent token/gateway -> the
# surface is HONEST that the Jarvis grade is pending; it never invents feedback.
BRAIN_GATEWAY_BASE = os.environ.get("MIKAELOS_BRAIN_GATEWAY", "http://127.0.0.1:18084")
BRAIN_MODEL = os.environ.get("MIKAELOS_BRAIN_MODEL", "jarvis")
BRAIN_TIMEOUT = float(os.environ.get("MIKAELOS_BRAIN_TIMEOUT", "45"))
_BRAIN_TOKEN_REF = os.environ.get("MIKAELOS_BRAIN_TOKEN_REF", "hermes/GATEWAY_TOKEN")
_BRAIN_TOKEN_CACHE: Optional[str] = None

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

# ---------------------------------------------------------------------------
# FIRMA / Rise-L — read-only company-signal projections (workspace
# ``company_signal``, technically isolated from private/engineering). fsm.db and
# belege.db are opened STRICTLY ``mode=ro`` (URI) — every write on fsm.db goes
# through the Cockpit :18065 single-writer, NEVER here. Reports are curated
# daily snapshots (already aggregated); Paperless is read via its REST API only.
# Nothing here fabricates a value: a missing source degrades to honest
# empty/unavailable, and the Delta/Wensauer mandant is only shown where the data
# actually carries it (belege/wartungsvertrag) — the FSM ``auftrag.firma`` column
# is factually NULL today, so auftrag/dispo cards say "Mandant unbekannt" rather
# than guessing "Delta".
FSM_DB = Path(os.environ.get("MIKAELOS_FSM_DB", "/srv/delta/data/fsm/fsm.db"))
BELEGE_DB = Path(os.environ.get("MIKAELOS_BELEGE_DB", "/srv/delta/data/belege/belege.db"))
REPORTS_DIR = Path(os.environ.get("MIKAELOS_REPORTS_DIR", "/srv/delta/data/reports"))
BILLING_RADAR_JSON = Path(os.environ.get(
    "MIKAELOS_BILLING_RADAR", str(REPORTS_DIR / "billing-radar-latest.json")))
BILLING_KPI_JSON = Path(os.environ.get(
    "MIKAELOS_BILLING_KPI", str(REPORTS_DIR / "billing-kpi-latest.json")))
WARTUNGS_RADAR_JSON = Path(os.environ.get(
    "MIKAELOS_WARTUNGS_RADAR", str(REPORTS_DIR / "wartungs-radar-latest.json")))
PAPERLESS_BASE = os.environ.get("MIKAELOS_PAPERLESS_BASE", "http://127.0.0.1:18075")
_PAPERLESS_TOKEN_REF = os.environ.get("MIKAELOS_PAPERLESS_TOKEN_REF", "paperless/API_TOKEN")
_PAPERLESS_TOKEN_CACHE: Optional[str] = None
# Cockpit deep-link base (the "im FSM öffnen" target). Navigation only — the
# plugin never renders an editable Cockpit control, it only links out.
COCKPIT_BASE = os.environ.get(
    "MIKAELOS_COCKPIT_BASE", "https://delta-ai-01.tailbc3df5.ts.net:18065").rstrip("/")
# The restic offsite backup unit (systemd --user), for the RUNTIME "Backups ok" row.
RESTIC_UNIT = os.environ.get("MIKAELOS_RESTIC_UNIT", "rise-l-backup.service")

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
    "study": 24 * 3600,          # exams.json wird selten editiert — großzügig
    # FIRMA / company_signal read-only projections:
    "firma_auftraege": 3600,     # fsm.db updated_ts is near-live
    "firma_billing": 26 * 3600,  # billing-kpi snapshot regenerates ~07:30 daily
    "firma_dispo": 12 * 3600,    # tages_dispo is sparse; generous
    "firma_wartung": 26 * 3600,  # wartungs-radar snapshot regenerates ~01:30 daily
    "firma_dokumente": 6 * 3600, # Paperless intake is continuous
    "firma_runtime": 3600,       # systemd/backup health
    # M3 area projections:
    "kommunikation": 6 * 3600,   # bot-outbox / directives / freescout signals
    "sessions": 300,             # broker inventory is a point-in-time snapshot
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
def _http_get_json(url: str, *, token: str = "", auth_scheme: str = "Bearer") -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"{auth_scheme} {token}"
    try:
        req = Request(url, headers=headers, method="GET")
        with urlopen(req, timeout=HTTP_TIMEOUT) as resp:  # noqa: S310 - fixed loopback base
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except HTTPError as exc:
        return exc.code, None
    except (URLError, OSError, ValueError, TimeoutError):
        return None, None


def _http_post_json(url: str, body: Dict[str, Any], *, token: str = "",
                    timeout: Optional[float] = None) -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    """POST a JSON body to a fixed loopback URL. Used by the ONE gated propose seam
    (no token) and the Brain-Gateway coaching call (Bearer token, longer timeout —
    an LLM round is slower than a control-plane read). Returns (status, json)."""
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        req = Request(url, data=data, headers=headers, method="POST")
        with urlopen(req, timeout=(timeout or HTTP_TIMEOUT)) as resp:  # noqa: S310 - fixed loopback base
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
        # no per-user collection file exists. Never a fake "3 fällig". The Klausur-
        # countdown is date-only, so it still shows here (honest before any sync).
        exam_row, next_exam = _nearest_exam_bits()
        return _prov(
            state="empty", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary="Noch nicht synchronisiert — Anki-Sync bereit",
            stale_after=STALE["learning"],
            note=("Anki-Collection noch nicht synchronisiert. Der Anki-Sync-Server "
                  "ist bereit — sobald das erste Gerät synchronisiert, erscheinen "
                  "hier fällige Karten, Retention und Streak (read-only, Anki bleibt "
                  "das Lern-Wahrheitssystem). Klausur-Countdown läuft unabhängig davon."),
            rows=([exam_row] if exam_row else []),
            extra={"anki": {"collection": None, "syncReady": True},
                   "nextExam": next_exam, "hasCoach": True},
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

    # L-3: surface the nearest Klausur countdown right in the Lernplan lens (violet).
    exam_row, next_exam = _nearest_exam_bits()
    if exam_row:
        rows.insert(0, exam_row)

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
            "nextExam": next_exam,
            "hasCoach": True,
        },
    )


# ---------------------------------------------------------------------------
# Lernplan (L-2) — READ-ONLY Review/Drill session projection.
#
# A drill/preview surface over the SAME Anki-Sync collection module_learning
# reads. It NEVER writes and NEVER opens AnkiConnect: the actual review grading
# + persistence happens in Anki / AnkiDroid, not here. This endpoint only
#   (1) reads the due queue (learning + review-due + a little new) read-only,
#   (2) reads each card's note text (front/back) for the drill, and
#   (3) computes an FSRS interval PREVIEW for the four ratings, honestly graded:
#         * py-fsrs importable       -> authoritative preview  ("py-fsrs")
#         * else read cards.data      -> current interval only  ("anki-cards.data")
#         * else                      -> no preview             ("unavailable")
# Nothing is ever fabricated: a state we cannot read is reported as such.
# ---------------------------------------------------------------------------
_REVIEW_LIMIT_DEFAULT = int(os.environ.get("MIKAELOS_REVIEW_LIMIT", "20"))
_REVIEW_LIMIT_MAX = 50
# The four Anki/FSRS ratings, in button order, with UI accent + German label.
_REVIEW_RATINGS = [
    ("again", 1, "Nochmal", "red", "rotate-ccw"),
    ("hard", 2, "Schwer", "amber", "hourglass"),
    ("good", 3, "Gut", "emerald", "circle-check-big"),
    ("easy", 4, "Einfach", "cyan", "fast-forward"),
]


def _fsrs_importable() -> bool:
    """True iff py-fsrs is available in THIS process' venv. Cheap, cached-ish."""
    try:
        import fsrs  # noqa: F401
        from fsrs import Scheduler, Card, Rating  # noqa: F401
        return True
    except Exception:  # noqa: BLE001
        return False


def _fmt_interval_seconds(sec: float) -> str:
    """Compact German interval label from a seconds delta (Berliner Kürzel)."""
    sec = max(0.0, float(sec))
    if sec < 3600:
        return f"{max(1, round(sec / 60))} min"
    if sec < 86400:
        return f"{round(sec / 3600)} Std"
    days = sec / 86400
    if days < 45:
        return f"{max(1, round(days))} T"
    if days < 365:
        return f"{max(1, round(days / 30))} Mon"
    return f"{days / 365:.1f} J".replace(".0", "")


def _fmt_ivl_days(ivl: Any) -> Optional[str]:
    """Anki ``cards.ivl``: positive = days, negative = seconds (learning). None if 0/unknown."""
    try:
        n = int(ivl)
    except (TypeError, ValueError):
        return None
    if n == 0:
        return None
    if n < 0:
        return _fmt_interval_seconds(-n)
    return _fmt_interval_seconds(n * 86400)


def _card_memory(data_json: Any) -> Tuple[Optional[float], Optional[float]]:
    """FSRS (stability, difficulty) from ``cards.data`` JSON, if present. Anki
    stores the memory state under short keys ``s``/``d`` (also seen as
    ``stability``/``difficulty``). Returns (None, None) for SM-2 / new cards."""
    if not data_json:
        return None, None
    try:
        obj = json.loads(data_json) if isinstance(data_json, str) else data_json
    except (ValueError, TypeError):
        return None, None
    if not isinstance(obj, dict):
        return None, None

    def _num(*keys: str) -> Optional[float]:
        for k in keys:
            v = obj.get(k)
            if isinstance(v, (int, float)):
                return float(v)
        return None

    return _num("s", "stability"), _num("d", "difficulty")


def _fsrs_preview(stability: Optional[float], difficulty: Optional[float],
                  is_review: bool, now: datetime) -> Optional[Dict[str, str]]:
    """Authoritative next-interval preview for the four ratings via py-fsrs.

    Reconstructs a fresh card each rating (so nothing is mutated/persisted),
    applies the rating and reads the resulting due delta. Returns None on ANY
    incompatibility so the caller degrades honestly — never a guessed number."""
    try:
        from fsrs import Scheduler, Card, Rating
    except Exception:  # noqa: BLE001
        return None
    try:
        sched = Scheduler()
    except Exception:  # noqa: BLE001
        return None
    ratings = {"again": Rating.Again, "hard": Rating.Hard,
               "good": Rating.Good, "easy": Rating.Easy}
    out: Dict[str, str] = {}
    for name, rating in ratings.items():
        try:
            card = Card()
            if is_review and stability and difficulty:
                try:
                    card.stability = float(stability)
                    card.difficulty = float(difficulty)
                    from fsrs import State  # optional across versions
                    card.state = State.Review
                except Exception:  # noqa: BLE001
                    pass
            try:
                res = sched.review_card(card, rating, review_datetime=now)
            except TypeError:
                res = sched.review_card(card, rating)
            c2 = res[0] if isinstance(res, tuple) else res
            due = getattr(c2, "due", None)
            if due is None:
                return None
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
            out[name] = _fmt_interval_seconds((due - now).total_seconds())
        except Exception:  # noqa: BLE001
            return None
    return out


def _split_note(flds: Any) -> Tuple[str, str]:
    """Anki note fields → (front, back). Fields are 0x1f-separated; field[0] is
    the front, the rest joined the back. HTML/media are stripped to plain text."""
    text = str(flds or "")
    parts = text.split("\x1f") if text else [""]
    front = _strip_html(parts[0]) if parts else ""
    back = _strip_html(" · ".join(p for p in parts[1:] if p.strip())) if len(parts) > 1 else ""
    return front, back


_TAG_RE = None


def _strip_html(s: str) -> str:
    """Very small HTML→text: drop tags, unescape a few entities, collapse space.
    Read-only cosmetic normalisation for the drill card; never alters source."""
    import re
    import html as _html
    global _TAG_RE
    if _TAG_RE is None:
        _TAG_RE = re.compile(r"<[^>]+>")
    txt = _TAG_RE.sub(" ", str(s or ""))
    txt = _html.unescape(txt)
    return " ".join(txt.split())


def _review_deck_name(decks_json: Any, did: int) -> str:
    """Best-effort deck name for a card's ``did`` from the col.decks blob."""
    if not decks_json:
        return "Deck"
    try:
        obj = json.loads(decks_json)
        meta = obj.get(str(did)) if isinstance(obj, dict) else None
        name = str(meta.get("name")).strip() if isinstance(meta, dict) else ""
        return name or "Deck"
    except (ValueError, TypeError, AttributeError):
        return "Deck"


def _read_review_session(path: Path, limit: int) -> Dict[str, Any]:
    """Read due cards + note text + FSRS interval preview, all read-only (mode=ro).

    Returns ``{ok, reason, cards, previewSource, fsrsAvailable, ...}``. ``ok`` is
    False with a ``reason`` (``open`` | ``schema`` | ``read``) on failure. Never
    writes; on any doubt the preview degrades rather than inventing a number."""
    out: Dict[str, Any] = {
        "ok": False, "reason": None, "error": None, "cards": [],
        "previewSource": "unavailable", "fsrsAvailable": _fsrs_importable(),
        "totalDue": 0,
    }
    try:
        con = sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1.5)
    except sqlite3.Error as exc:
        out["reason"], out["error"] = "open", type(exc).__name__
        return out
    try:
        tables = {r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
        if not {"col", "cards", "revlog", "notes"} <= tables:
            out["reason"] = "schema"
            out["error"] = "col/cards/revlog/notes fehlt"
            return out
        col_row = con.execute("SELECT crt, ver, decks FROM col LIMIT 1").fetchone()
        if not col_row:
            out["reason"], out["error"] = "schema", "col-Tabelle leer"
            return out
        crt = int(col_row[0] or 0)
        ver = int(col_row[1] or 0)
        decks_json = col_row[2]
        if ver not in _ANKI_KNOWN_VERS:
            out["reason"], out["error"] = "schema", f"ver={ver} unbekannt"
            return out
        today = _anki_today_number(crt)
        now = _now()
        # Due queue: learning (queue 1/3) first, then review-due (queue 2, due<=today)
        # by due ascending, then a little new (queue 0) to round out a short drill.
        rows = con.execute(
            "SELECT c.id, c.nid, c.did, c.queue, c.due, c.ivl, c.reps, c.lapses, "
            "c.data, n.flds FROM cards c JOIN notes n ON n.id = c.nid "
            "WHERE (c.queue IN (1, 3)) "
            "   OR (c.queue = 2 AND c.due <= ?) "
            "   OR (c.queue = 0) "
            "ORDER BY CASE c.queue WHEN 1 THEN 0 WHEN 3 THEN 0 WHEN 2 THEN 1 ELSE 2 END, "
            "c.due ASC LIMIT ?",
            (today, max(1, min(limit, _REVIEW_LIMIT_MAX))),
        ).fetchall()
        total_due = int(con.execute(
            "SELECT COUNT(*) FROM cards WHERE (queue = 2 AND due <= ?) OR queue IN (1, 3)",
            (today,),
        ).fetchone()[0] or 0)
        out["totalDue"] = total_due

        source = "unavailable"
        cards: List[Dict[str, Any]] = []
        for (cid, _nid, did, queue, _due, ivl, reps, lapses, data_json, flds) in rows:
            front, back = _split_note(flds)
            stability, difficulty = _card_memory(data_json)
            is_review = int(queue) == 2
            preview = _fsrs_preview(stability, difficulty, is_review, now) if out["fsrsAvailable"] else None
            if preview:
                source = "py-fsrs"
            elif source != "py-fsrs":
                # Tier-2: read the stored interval from cards.data / ivl column.
                source = "anki-cards.data" if (_fmt_ivl_days(ivl) or stability) else source
            cards.append({
                "id": int(cid),
                "deck": _review_deck_name(decks_json, int(did or 0)),
                "front": front or "(kein Fragetext)",
                "back": back or "(kein Antworttext)",
                "reps": int(reps or 0),
                "lapses": int(lapses or 0),
                "intervalCurrent": _fmt_ivl_days(ivl),
                "isNew": int(queue) == 0,
                "preview": preview,  # dict of four intervals, or None
            })
        out["cards"] = cards
        out["previewSource"] = "py-fsrs" if source == "py-fsrs" else (
            "anki-cards.data" if source == "anki-cards.data" else "unavailable")
    except sqlite3.Error as exc:
        out["reason"], out["error"] = "read", type(exc).__name__
        return out
    finally:
        con.close()
    out["ok"] = True
    return out


def review_session(limit: int = _REVIEW_LIMIT_DEFAULT) -> Dict[str, Any]:
    """READ-ONLY drill/preview session over the Anki-Sync collection.

    Honest in every state — empty (not synced / no due), unavailable (schema),
    or ready with cards + an FSRS interval preview whose authority is declared
    (previewSource). The grade + persistence NEVER happen here; Anki/AnkiDroid
    stay the single spaced-repetition truth. This function never writes."""
    ratings_meta = [
        {"key": k, "value": v, "label": lab, "accent": ac, "icon": ic}
        for (k, v, lab, ac, ic) in _REVIEW_RATINGS
    ]
    honest = ("Vorschau/Drill — Bewertung & Speicherung passieren in Anki / "
              "AnkiDroid, nicht hier. MIKAEL OS liest die Collection nur (mode=ro).")
    path = _find_anki_collection()
    if path is None:
        return _prov(
            state="empty", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary="Noch nicht synchronisiert — Anki-Sync bereit",
            stale_after=STALE["learning"],
            note=("Anki-Collection noch nicht synchronisiert. Sobald das erste "
                  "Gerät synchronisiert, erscheinen hier fällige Karten für den "
                  "Drill. " + honest),
            extra={"reason": "no_collection", "cards": [], "ratings": ratings_meta,
                   "previewSource": "unavailable", "fsrsAvailable": _fsrs_importable(),
                   "honest": honest, "due": 0, "totalDue": 0},
        )
    try:
        observed = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    except OSError:
        observed = None

    sess = _read_review_session(path, limit)
    if not sess["ok"]:
        summary = ("Anki-Schema unbekannt" if sess["reason"] == "schema"
                   else "Anki-Collection nicht lesbar")
        return _prov(
            state="unavailable", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary=summary, observed_at=observed, stale_after=STALE["learning"],
            note=(f"{summary} ({sess['reason']}: {sess['error']}). Read-only — "
                  "nichts wird verändert. " + honest),
            extra={"reason": sess["reason"], "cards": [], "ratings": ratings_meta,
                   "previewSource": "unavailable",
                   "fsrsAvailable": sess["fsrsAvailable"], "honest": honest},
        )

    # Reuse the L-1 counts for the retention/streak rail (real numbers or None).
    stats = _read_anki(path)
    ret = stats.get("retention") if stats.get("ok") else None
    ret_pct = f"{round(ret * 100)} %" if isinstance(ret, (int, float)) else None
    streak = int(stats.get("streak") or 0) if stats.get("ok") else 0
    learned = int(stats.get("learned_today") or 0) if stats.get("ok") else 0

    cards = sess["cards"]
    if not cards:
        reason = "no_cards" if (stats.get("ok") and stats.get("total_cards", 0) == 0) else "no_due"
        summary = ("Collection synchronisiert — noch keine Karten"
                   if reason == "no_cards" else "Keine fälligen Karten — alles gelernt")
        return _prov(
            state="empty", source=ANKI_SOURCE, source_kind="file",
            workspace="private", permission=_ANKI_PERM,
            summary=summary, observed_at=observed, stale_after=STALE["learning"],
            note=("Nichts zu üben gerade. " + honest),
            extra={"reason": reason, "cards": [], "ratings": ratings_meta,
                   "previewSource": sess["previewSource"],
                   "fsrsAvailable": sess["fsrsAvailable"], "honest": honest,
                   "due": 0, "totalDue": sess["totalDue"],
                   "retention": ret, "retentionPct": ret_pct,
                   "streak": streak, "learnedToday": learned},
        )

    preview_src = sess["previewSource"]
    preview_note = {
        "py-fsrs": "Intervall-Vorschau via py-fsrs (Standardparameter). Anki bleibt maßgeblich.",
        "anki-cards.data": ("Kein py-fsrs im Plugin-Kontext — nur das gespeicherte "
                            "Intervall aus cards.data wird gezeigt, keine Rating-Vorschau."),
        "unavailable": "Intervall-Vorschau nicht verfügbar (weder py-fsrs noch cards.data lesbar).",
    }.get(preview_src, "")
    state = _freshness_state(observed, STALE["learning"])
    return _prov(
        state=state, source=ANKI_SOURCE, source_kind="file",
        workspace="private", permission=_ANKI_PERM,
        summary=f"{len(cards)} Karten im Drill · {sess['totalDue']} fällig",
        observed_at=observed, stale_after=STALE["learning"],
        note=(honest + " " + preview_note),
        extra={
            "reason": "ready", "cards": cards, "ratings": ratings_meta,
            "previewSource": preview_src, "previewNote": preview_note,
            "fsrsAvailable": sess["fsrsAvailable"], "honest": honest,
            "due": len(cards), "totalDue": sess["totalDue"],
            "retention": ret, "retentionPct": ret_pct,
            "streak": streak, "learnedToday": learned,
            "anki": {"collection": str(path), "schemaOk": True},
        },
    )


# ===========================================================================
# L-3 — Lern-Coach. Three read/propose-only building blocks over the SAME Anki
# collection + a small read-only exams.json, plus a genuine Jarvis coaching call:
#   (1) Klausur-Countdown + Pacing  — exams.json × Anki-Fälligkeiten, honest when
#       the collection is empty (no faked "Tagesziel"); READ-ONLY.
#   (2) Feynman-Flow                — pick a concept, the user explains, the
#       explanation is graded BY JARVIS (Brain-Gateway :18084, READ/coaching).
#       Never faked: no token/gateway -> honest "Bewertung ausstehend".
#   (3) Prüfungsplan als Mission    — a study plan proposal through the EXACT
#       Phase-3 propose-only /actions seam (dry-run default), workspace=studium,
#       never money/customer/personnel. Never /approvals/decide.
# The methodology of the seven lern-* skills (Priming, Active-Recall, Feynman,
# Elaboration, Prüfungssim, Spaced-Repetition, Coach) is mirrored in the coach's
# own prompt/copy — see LERN_METHODS + FEYNMAN_SYSTEM. Nothing here writes Anki
# or business truth; the Anki collection stays the single SR-truth.
# ===========================================================================
STUDY_SOURCE = "exams.json × anki-sync (read-only)"
_STUDY_PERM = "Nur lesen (exams.json + Anki collection.anki2, mode=ro)"

# The seven lern-* methods distilled into the coach's own words. Mirrors
# /srv/delta/claude-harness/ki03-claude/skills/lern-{priming,active-recall,
# feynman,elaboration,pruefungssim,spaced-repetition,coach}. Shown as the coach's
# "Methodik"-Leiste so the surface teaches the method, not just the numbers.
LERN_METHODS = [
    {"key": "priming", "icon": "lightbulb", "title": "Priming",
     "line": "Erst aus dem Kopf: Was weißt du schon, was vermutest du? Öffnet Neugier-Lücken vor dem Stoff."},
    {"key": "active-recall", "icon": "brain", "title": "Active Recall",
     "line": "Closed-Book abrufen statt wiederlesen (Testing-Effekt). Unsicheres wird zur Karte."},
    {"key": "feynman", "icon": "message-square", "title": "Feynman",
     "line": "Erklär es einfach, ohne Fachvokabular. Wo du stockst, sitzt die echte Lücke."},
    {"key": "elaboration", "icon": "waypoints", "title": "Elaboration",
     "line": "Warum/Wie bis zum Grund, mit Vorwissen verknüpfen, Kontrastpaare bilden (Interleaving)."},
    {"key": "spaced", "icon": "clock", "title": "Spaced Repetition",
     "line": "Wachsende Intervalle, ≥3 Abrufe pro Thema vor der Klausur — Anki bleibt die Wahrheit."},
]

# The Feynman coach prompt — mirrors lern-feynman: the student explains freely,
# the coach probes gaps (no fachvokabular escape), then gives structured feedback
# with an honest Prüfungsreife estimate. Grading is Jarvis' job, never the plugin's.
FEYNMAN_SYSTEM = (
    "Du bist Jarvis, ein strenger, wohlwollender Lern-Coach nach der Feynman-Methode. "
    "Der Lernende erklärt dir ein Konzept in eigenen Worten. Deine Aufgabe: "
    "(1) prüfe die Erklärung fachlich; (2) benenne konkret die Lücken/Fehler — vor allem, "
    "wo auf Fachvokabular ausgewichen wird oder die Kausalkette abreißt; "
    "(3) stelle GENAU EINE gezielte Nachfrage, die die größte Lücke schließt; "
    "(4) gib eine ehrliche Prüfungsreife-Einschätzung in Prozent mit einem Satz Begründung. "
    "Antworte kurz und strukturiert auf Deutsch mit den Abschnitten "
    "„Verstanden“, „Lücken“, „Nachfrage“ und „Prüfungsreife“. "
    "Erfinde nichts. Ist die Erklärung zu dünn, sag das offen."
)


def _read_exams() -> Dict[str, Any]:
    """Read exams.json read-only. Returns ``{ok, reason, exams, observed}``. Each
    exam: ``{fach, datum(YYYY-MM-DD), themen[], deck?}``. Never writes; on any
    problem it degrades honestly (missing/malformed/empty) rather than inventing."""
    out: Dict[str, Any] = {"ok": False, "reason": None, "error": None,
                           "exams": [], "observed": None, "path": str(EXAMS_PATH)}
    try:
        raw = EXAMS_PATH.read_bytes()
    except FileNotFoundError:
        out["reason"] = "missing"
        return out
    except OSError as exc:
        out["reason"], out["error"] = "read", type(exc).__name__
        return out
    try:
        out["observed"] = datetime.fromtimestamp(EXAMS_PATH.stat().st_mtime, tz=timezone.utc)
    except OSError:
        out["observed"] = None
    try:
        data = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        out["reason"] = "malformed"
        return out
    items = data.get("exams") if isinstance(data, dict) else data
    if not isinstance(items, list):
        out["reason"] = "malformed"
        return out
    exams: List[Dict[str, Any]] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        fach = str(it.get("fach") or it.get("subject") or "").strip()
        datum = str(it.get("datum") or it.get("date") or "").strip()
        if not fach or not datum:
            continue
        raw_themen = it.get("themen") or it.get("topics") or []
        themen = ([str(t).strip() for t in raw_themen if str(t).strip()]
                  if isinstance(raw_themen, list) else [])
        deck = str(it.get("deck") or "").strip() or None
        exams.append({"fach": fach, "datum": datum, "themen": themen, "deck": deck})
    out["exams"] = exams
    out["ok"] = True
    if not exams:
        out["reason"] = "empty"
    return out


def _berlin_today():
    """Today's date in Berlin (CLAUDE.md: immer Berliner Zeit) for day-count math."""
    now = _now()
    if _BERLIN is not None:
        now = now.astimezone(_BERLIN)
    return now.date()


def _days_human(days: int) -> str:
    if days > 1:
        return f"in {days} Tagen"
    if days == 1:
        return "morgen"
    if days == 0:
        return "heute"
    if days == -1:
        return "gestern"
    return f"vor {abs(days)} Tagen"


def _match_deck_due(deck_name: Optional[str], anki_decks: List[Dict[str, Any]]) -> Optional[int]:
    """Best-effort due count for an exam's linked Anki deck (case-insensitive
    exact/prefix/substring). None = not linked or not found in the collection."""
    if not deck_name or not anki_decks:
        return None
    low = deck_name.lower()
    for d in anki_decks:
        nm = str(d.get("name") or "").lower()
        if nm == low or nm.startswith(low) or low in nm:
            return int(d.get("due") or 0)
    return None


def _pace_exam(exam: Dict[str, Any], anki_ok: bool,
               anki_decks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """One exam -> countdown + honest pacing. Tagesziel = offene Karten ÷ Tage bis
    Klausur, but ONLY when the deck is linked and the collection is readable;
    otherwise the goal text says exactly why it can't be computed (never a fake)."""
    from datetime import date
    try:
        ed = date.fromisoformat(exam["datum"])
    except (ValueError, TypeError):
        return {"fach": exam["fach"], "datum": exam.get("datum"), "valid": False,
                "note": "Datum nicht lesbar (erwartet JJJJ-MM-TT)."}
    days = (ed - _berlin_today()).days
    themen = exam.get("themen") or []
    deck = exam.get("deck")
    deck_due = _match_deck_due(deck, anki_decks) if anki_ok else None
    daily: Optional[int] = None
    if deck_due is not None and days > 0:
        daily = max(1, -(-deck_due // days))  # ceil division
    if days < 0:
        tier, tlabel = "past", "vorbei"
    elif days == 0:
        tier, tlabel = "today", "heute"
    elif days <= 7:
        tier, tlabel = "critical", "kritisch"
    elif days <= 14:
        tier, tlabel = "tight", "eng"
    else:
        tier, tlabel = "ok", "geplant"
    # Honest Tagesziel text — names the exact reason when a number isn't possible.
    if not anki_ok:
        goal_text = "Anki noch nicht synchronisiert — Tagesziel folgt"
    elif deck is None:
        goal_text = "Kein Deck verknüpft (setze „deck“ in exams.json)"
    elif deck_due is None:
        goal_text = f"Deck „{deck}“ nicht in der Collection gefunden"
    elif days < 0:
        goal_text = f"{deck_due} Karten offen · Klausur vorbei"
    elif days == 0:
        goal_text = f"{deck_due} Karten offen — heute Klausur"
    elif daily:
        goal_text = f"{daily} Karten/Tag ({deck_due} offen ÷ {days} T)"
    else:
        goal_text = "Alles gelernt"
    feynman_hint = None
    if themen and days > 0 and tier in ("critical", "tight"):
        feynman_hint = f"{len(themen)} Themen · Feynman-Runden jetzt einplanen (≥3 Abrufe/Thema)"
    return {
        "fach": exam["fach"], "datum": exam["datum"], "valid": True,
        "daysLeft": days, "daysHuman": _days_human(days), "tier": tier, "tierLabel": tlabel,
        "themen": themen, "themenCount": len(themen),
        "deck": deck, "deckDue": deck_due, "dailyGoal": daily, "goalText": goal_text,
        "feynmanHint": feynman_hint,
    }


def _nearest_exam_bits() -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """A compact 'nächste Klausur' lens row + a nextExam dict, or (None, None).
    Read-only and independent of Anki, so the Lernplan lens shows the countdown
    even before the first Anki sync (honest date math, no due numbers needed)."""
    ex = _read_exams()
    if not ex.get("ok") or not ex.get("exams"):
        return None, None
    paced = [_pace_exam(e, False, []) for e in ex["exams"]]
    up = sorted([p for p in paced if p.get("valid") and p.get("daysLeft", -1) >= 0],
                key=lambda p: p["daysLeft"])
    if not up:
        return None, None
    p = up[0]
    acc = {"today": "red", "critical": "red", "tight": "amber"}.get(p["tier"], "violet")
    row = {"icon": "calendar-clock", "accent": acc,
           "title": "Nächste Klausur · " + p["fach"],
           "sub": p["daysHuman"] + " · " + str(p["themenCount"]) + " Themen",
           "value": ("heute" if p["daysLeft"] == 0 else str(p["daysLeft"]) + " T")}
    return row, {"fach": p["fach"], "daysLeft": p["daysLeft"], "datum": p["datum"], "tier": p["tier"]}


def study_plan() -> Dict[str, Any]:
    """READ-ONLY Klausur-Countdown + Pacing over exams.json × Anki-Fälligkeiten.
    Honest in every state (missing/malformed/empty config, empty collection).
    Also carries the LERN_METHODS strip + live Jarvis-coaching reachability so the
    coach surface can be honest about what is Jarvis-dependent."""
    ex = _read_exams()
    path = _find_anki_collection()
    anki = _read_anki(path) if path is not None else {"ok": False, "decks": [], "due_today": 0}
    anki_ok = bool(anki.get("ok"))
    anki_decks = anki.get("decks") or []
    due_total = int(anki.get("due_today") or 0) if anki_ok else 0
    base_extra = {"methods": LERN_METHODS, "ankiOk": anki_ok, "dueTotal": due_total,
                  "jarvis": _brain_status()}

    if ex["reason"] == "missing":
        return _prov(
            state="empty", source=STUDY_SOURCE, source_kind="file",
            workspace="private", permission=_STUDY_PERM,
            summary="Keine Klausurtermine hinterlegt", stale_after=STALE["study"],
            note=("Noch keine exams.json — lege Klausurtermine unter "
                  f"{EXAMS_PATH} an (je Fach: Datum · Themen · optional Anki-Deck). "
                  "Read-only: das Plugin schreibt diese Datei nie."),
            extra={"exams": [], "reason": "missing", **base_extra})
    if not ex["ok"] or ex["reason"] == "malformed":
        return _prov(
            state="unavailable", source=STUDY_SOURCE, source_kind="file",
            workspace="private", permission=_STUDY_PERM,
            summary="exams.json nicht lesbar", observed_at=ex.get("observed"),
            stale_after=STALE["study"],
            note=(f"exams.json vorhanden, aber nicht verwertbar ({ex.get('reason')}). "
                  "Read-only — nichts wird verändert."),
            extra={"exams": [], "reason": ex.get("reason") or "malformed", **base_extra})
    if ex["reason"] == "empty":
        return _prov(
            state="empty", source=STUDY_SOURCE, source_kind="file",
            workspace="private", permission=_STUDY_PERM,
            summary="exams.json leer — noch keine Fächer", observed_at=ex.get("observed"),
            stale_after=STALE["study"],
            note="exams.json ist da, enthält aber keine gültigen Fach-Einträge.",
            extra={"exams": [], "reason": "empty", **base_extra})

    paced = [_pace_exam(e, anki_ok, anki_decks) for e in ex["exams"]]
    upcoming = sorted([p for p in paced if p.get("valid") and p.get("daysLeft", -1) >= 0],
                      key=lambda p: p["daysLeft"])
    rows: List[Dict[str, Any]] = []
    for p in (upcoming or paced):
        if not p.get("valid"):
            rows.append({"icon": "triangle-alert", "accent": "amber", "title": p["fach"],
                         "sub": p.get("note", "Datum ungültig"), "value": "—"})
            continue
        acc = {"today": "red", "critical": "red", "tight": "amber",
               "ok": "violet", "past": "neutral"}.get(p["tier"], "violet")
        rows.append({
            "icon": "calendar-clock", "accent": acc, "title": p["fach"],
            "sub": p["daysHuman"] + " · " + p["goalText"],
            "status": ("running" if p["tier"] in ("today", "critical") else None),
            "statusLabel": (p["tierLabel"] if p["tier"] in ("today", "critical", "tight") else None),
            "value": ("heute" if p["daysLeft"] == 0 else str(p["daysLeft"]) + " T"),
        })
    observed = ex.get("observed")
    nearest = upcoming[0] if upcoming else None
    n_up = len(upcoming)
    summary = (f"{n_up} Klausur{'en' if n_up != 1 else ''} · nächste: "
               f"{nearest['fach']} {nearest['daysHuman']}") if nearest else (
        f"{len(paced)} Termine (alle vorbei)")
    return _prov(
        state=(_freshness_state(observed, STALE["study"]) if observed else "fresh"),
        source=STUDY_SOURCE, source_kind="file", workspace="private", permission=_STUDY_PERM,
        summary=summary, observed_at=observed, stale_after=STALE["study"], rows=rows,
        note=("Klausur-Countdown + Pacing aus exams.json (read-only) × Anki-Fälligkeiten "
              "(mode=ro). Tagesziel = offene Karten ÷ Tage bis Klausur; ehrlich als "
              "„folgt/nicht verknüpft“, wenn die Collection leer oder das Deck nicht "
              "gebunden ist. Anki bleibt das Spaced-Repetition-Wahrheitssystem — hier "
              "wird nichts geschrieben."),
        extra={"exams": paced, "reason": "ready", "count": n_up,
                "nextExam": ({"fach": nearest["fach"], "daysLeft": nearest["daysLeft"],
                              "datum": nearest["datum"]} if nearest else None),
                **base_extra})


# --- Jarvis coaching read-path (Brain-Gateway) ------------------------------
def _brain_token() -> str:
    """Resolve the Brain-Gateway Bearer token: env first, then the sanctioned SOPS
    ``secret get`` render (cached in-process). NEVER logged or written to disk.
    Empty string = no token available -> the caller reports an honest pending."""
    global _BRAIN_TOKEN_CACHE
    if _BRAIN_TOKEN_CACHE:
        return _BRAIN_TOKEN_CACHE
    tok = (os.environ.get("MIKAELOS_BRAIN_TOKEN")
           or os.environ.get("HERMES_GATEWAY_TOKEN") or "").strip()
    if not tok and os.environ.get("MIKAELOS_BRAIN_SECRET", "1") != "0":
        try:
            proc = subprocess.run(
                ["secret", "get", _BRAIN_TOKEN_REF],
                capture_output=True, text=True, timeout=6)
            if proc.returncode == 0:
                tok = (proc.stdout or "").strip()
        except (OSError, subprocess.SubprocessError):
            tok = tok
    if tok:
        _BRAIN_TOKEN_CACHE = tok
    return tok


def _brain_status() -> Dict[str, Any]:
    """Honest reachability of the Jarvis coaching path. ``ready`` iff the gateway
    answers AND a token is resolvable — only then can a Feynman answer be graded."""
    code, _ = _http_get_json(f"{BRAIN_GATEWAY_BASE}/healthz")
    reachable = code == 200
    has_token = bool(_brain_token())
    if reachable and has_token:
        note = "Jarvis-Coaching bereit (Brain-Gateway erreichbar · Token vorhanden)."
    elif not reachable:
        note = "Brain-Gateway :18084 nicht erreichbar — Jarvis-Bewertung ausstehend."
    else:
        note = ("Kein Gateway-Token im Dashboard-Prozess — Jarvis-Bewertung ausstehend "
                "(Operator: HERMES_GATEWAY_TOKEN env oder SOPS hermes/GATEWAY_TOKEN, "
                "siehe docs/RUNBOOK-jarvis-coaching.md).")
    return {"base": BRAIN_GATEWAY_BASE, "reachable": bool(reachable),
            "hasToken": has_token, "ready": bool(reachable and has_token), "note": note}


def _feynman_pick(concept: str, subject: str) -> Dict[str, Any]:
    """Choose a concept to explain: explicit wins; else the front of a due Anki
    card (read-only); else a Thema from exams.json; else none (user must type)."""
    concept = (concept or "").strip()
    subject = (subject or "").strip()
    if concept:
        return {"concept": concept, "subject": subject, "conceptSource": "eigenes"}
    path = _find_anki_collection()
    if path is not None:
        sess = _read_review_session(path, 1)
        cards = sess.get("cards") or []
        if cards and cards[0].get("front"):
            return {"concept": cards[0]["front"], "subject": cards[0].get("deck") or subject,
                    "conceptSource": "anki-karte"}
    ex = _read_exams()
    for e in ex.get("exams", []):
        if subject and e["fach"].lower() != subject.lower():
            continue
        if e.get("themen"):
            return {"concept": e["themen"][0], "subject": e["fach"], "conceptSource": "exams.json"}
    # No subject match with themen — fall back to the first exam theme if any.
    for e in ex.get("exams", []):
        if e.get("themen"):
            return {"concept": e["themen"][0], "subject": e["fach"], "conceptSource": "exams.json"}
    return {"concept": "", "subject": subject, "conceptSource": "none"}


def feynman_setup(concept: str = "", subject: str = "") -> Dict[str, Any]:
    """Prepare a Feynman round (concept + prompt + Jarvis reachability). No LLM
    call yet — this only stages the round and is honest about Jarvis readiness."""
    pick = _feynman_pick(concept, subject)
    status = _brain_status()
    return {
        "ok": bool(pick["concept"]),
        "concept": pick["concept"], "subject": pick["subject"],
        "conceptSource": pick["conceptSource"], "jarvis": status,
        "prompt": (("Erklär mir „" + pick["concept"] + "“ — einfach, ohne Fachvokabular, "
                    "als würdest du es einer interessierten Laiin erklären.")
                   if pick["concept"] else ""),
        "method": {"key": "feynman",
                   "hint": ("Frei erklären, ohne Fachjargon; wo du stockst, sitzt die Lücke. "
                            "Danach bewertet Jarvis — nicht das Plugin.")},
        "priming": "Priming: Was weißt du schon über dieses Konzept, bevor du erklärst?",
        "note": ("Konzept aus Anki-Karte / exams.json (read-only)."
                 if pick["conceptSource"] != "none"
                 else "Kein Konzept gefunden — gib selbst eines ein."),
    }


def feynman_evaluate(concept: str = "", explanation: str = "") -> Dict[str, Any]:
    """Grade a free explanation BY JARVIS (Brain-Gateway). READ/coaching only —
    no business write, no Anki write, nothing persisted. Never fakes a grade: if
    the gateway is unreachable or no token is present, it says so honestly."""
    concept = (concept or "").strip()
    explanation = (explanation or "").strip()
    if not explanation:
        return {"ok": False, "reason": "no_explanation", "jarvisDependent": True,
                "note": "Keine Erklärung eingegeben."}
    if len(explanation) > 6000:
        explanation = explanation[:6000]
    status = _brain_status()
    if not status["reachable"]:
        return {"ok": False, "reason": "gateway_unreachable", "jarvisDependent": True,
                "jarvis": status, "note": status["note"]}
    token = _brain_token()
    if not token:
        return {"ok": False, "reason": "auth_pending", "jarvisDependent": True, "jarvis": status,
                "note": ("Jarvis-Bewertung ausstehend — kein Brain-Gateway-Token im "
                         "Dashboard-Prozess. Deine Erklärung wird NICHT bewertet und nichts "
                         "gespeichert. (Operator: HERMES_GATEWAY_TOKEN env oder SOPS "
                         "hermes/GATEWAY_TOKEN, siehe docs/RUNBOOK-jarvis-coaching.md.)")}
    user = ((f"Konzept: {concept}\n\n" if concept else "") + "Meine Erklärung:\n" + explanation)
    payload = {"model": BRAIN_MODEL, "temperature": 0.3, "max_tokens": 700,
               "messages": [{"role": "system", "content": FEYNMAN_SYSTEM},
                            {"role": "user", "content": user}]}
    code, resp = _http_post_json(f"{BRAIN_GATEWAY_BASE}/v1/chat/completions",
                                 payload, token=token, timeout=BRAIN_TIMEOUT)
    if code != 200 or not isinstance(resp, dict):
        return {"ok": False, "reason": "gateway_error", "jarvisDependent": True,
                "jarvis": status, "code": code,
                "note": "Brain-Gateway-Antwort nicht lesbar — es wurde keine Bewertung erfunden."}
    try:
        content = str(resp["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, TypeError):
        content = ""
    hermes = resp.get("hermes") if isinstance(resp.get("hermes"), dict) else {}
    return {
        "ok": bool(content), "jarvisDependent": True,
        "source": "hermes-brain-gateway (/v1/chat/completions)",
        "model": resp.get("model") or BRAIN_MODEL,
        "routeClass": hermes.get("route_class"),
        "feedback": content or "(leere Antwort von Jarvis)",
        "concept": concept, "jarvis": status,
        "note": ("Bewertung von Jarvis (Brain-Kette, abo-first). READ/Coaching — kein "
                 "Business-Write, keine Anki-Änderung, nichts gespeichert."),
    }


# --- Prüfungsplan als Mission (studium workspace, gated propose-only) --------
# Uses the SAME /actions seam Phase 3 uses, but workspace=studium (privat/Lernen).
# Never money/customer/personnel (the same out-of-scope guard applies), never
# /approvals/decide. dry_run=True is the safe default preview (fires nothing).
STUDY_PROPOSE_WORKSPACE = "studium"
STUDY_PROPOSE_JOB_TYPE = "study_plan"
STUDY_PROPOSE_CAPS = ["notes_write", "propose_only"]


def build_study_intent(objective: str) -> Dict[str, Any]:
    """The exact study-plan intent this surface would propose. Pure/deterministic."""
    objective = objective.strip()
    return {
        "objective": objective,
        "mandant": None,                       # private study — no company mandant
        "workspace": STUDY_PROPOSE_WORKSPACE,
        "workspaceType": STUDY_PROPOSE_WORKSPACE,
        "jobType": STUDY_PROPOSE_JOB_TYPE,
        "requiredCapabilities": list(STUDY_PROPOSE_CAPS),
        "requiredGate": "studium_propose",
        "idempotencyKey": _idempotency_key(objective, STUDY_PROPOSE_WORKSPACE, STUDY_PROPOSE_JOB_TYPE),
        "provenance": {"plugin": "mikael-os", "surface": "lernplan-coach",
                       "proposeOnly": True, "createdUtc": _iso(_now())},
    }


def propose_study_plan(objective: str, dry_run: bool = True) -> Dict[str, Any]:
    """Propose a study/exam plan through the gated /actions seam. dry_run=True
    (default) previews WITHOUT any network call. dry_run=False hands the intent to
    :18083/actions (gated); it never self-approves and never touches money/firma."""
    objective = (objective or "").strip()
    if not objective:
        return {"ok": False, "status": "invalid", "note": "Kein Ziel angegeben."}
    if len(objective) > 600:
        return {"ok": False, "status": "invalid", "note": "Ziel zu lang (max. 600 Zeichen)."}
    scope = _scope_reason(objective)  # blocks money/customer/personnel terms
    if scope:
        return {"ok": False, "status": "out_of_scope", "note": scope}
    intent = build_study_intent(objective)
    gate = {"gateClass": "studium_propose", "expectedOutcome": "require_approval",
            "human": "Voraussichtlich: Freigabe nötig · Studium/Privat-Lernplan (propose-only).",
            "note": "Das Plugin führt nichts aus — dein Gate entscheidet."}
    plan = {"objective": objective, "workspaceLabel": "Studium (privat)",
            "jobType": intent["jobType"], "capabilities": intent["requiredCapabilities"],
            "requiredGate": intent["requiredGate"], "gateHuman": gate["human"]}
    if dry_run:
        return {"ok": True, "mode": "dry_run", "status": "vorschau", "willFire": False,
                "proposeOnly": True, "intent": intent, "plan": plan, "predictedGate": gate,
                "controlPlane": control_plane_status(),
                "note": ("Nur Vorschau — es wurde NICHTS an das Gate gesendet. Privates "
                         "Studium/Lernen, kein Geld/Firma. Dein Gate entscheidet.")}
    cp = control_plane_status()
    if not cp["reachable"]:
        return {"ok": False, "mode": "live", "status": "auth_pending", "lifecycle": "auth_pending",
                "intent": intent, "controlPlane": cp, "note": cp["authNote"]}
    packet = {"text": objective, "source": "mikael-os",
              "idempotency_key": intent["idempotencyKey"],
              "workspace_type": STUDY_PROPOSE_WORKSPACE, "provenance": intent["provenance"]}
    code, resp = _http_post_json(f"{CONTROL_PLANE_BASE}/actions", packet)
    if code is None or not isinstance(resp, dict):
        return {"ok": False, "mode": "live", "status": "error", "lifecycle": "error",
                "intent": intent, "controlPlane": cp,
                "note": "Antwort der Control-Plane nicht lesbar."}
    action_status = str(resp.get("status") or "error")
    lifecycle = _ACTION_STATUS_LIFECYCLE.get(action_status, "error")
    card = resp.get("card") if isinstance(resp.get("card"), dict) else None
    card_id = str(card.get("id")) if card and card.get("id") else None
    return {"ok": lifecycle not in {"error"}, "mode": "live", "status": action_status,
            "lifecycle": lifecycle, "intent": intent, "cardId": card_id, "gate": resp.get("gate"),
            "controlPlane": cp,
            "note": ("An das Gate übergeben — wartet auf deine Freigabe."
                     if lifecycle == "waiting_approval" else
                     (resp.get("summary") or "Ergebnis von der Control-Plane."))}


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


# ===========================================================================
# M1 — Cockpit read-only aggregates (glanceable KPI strip · Jarvis-Live state ·
# Approval-Center). Everything here is ADDITIVE and READ-ONLY. Every field
# carries the _prov envelope or an honest Strich/unavailable — NOTHING is
# invented: no fake KPI number (missing => value=None => „—", never a fake 0),
# no fabricated Jarvis reply, no invented proactive hint. Proactive hints are
# DERIVED ONLY from real provider states; where a hint implies an in-scope
# engineering action it is surfaced as a propose-only suggestion (dry-run
# default, the existing gated /actions/propose seam) — never auto-fired, and
# never for money/customer/personnel (out-of-scope guard applies).
# ===========================================================================
def _kpi(key: str, label: str, *, value: Any, unit: Optional[str], state: str,
         source: str, source_kind: str, workspace: str, permission: str,
         summary: str, observed_at: Optional[datetime] = None,
         stale_after: Optional[int] = None, note: Optional[str] = None,
         extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """One glanceable KPI + a _prov envelope. ``value=None`` is the honest Strich
    (rendered „—"): a real reading is missing/partial/unavailable, never faked."""
    payload: Dict[str, Any] = {
        "key": key, "label": label,
        "value": value,           # None => honest „—"; a scalar/str only when real
        "unit": unit,
        "state": state,           # fresh|stale|partial|empty|unavailable|error
        "source": source, "sourceKind": source_kind,
        "workspace": workspace, "permission": permission,
        "observedAt": _iso(observed_at), "staleAfterSeconds": stale_after,
        "summary": summary,
    }
    if note:
        payload["note"] = note
    if extra:
        payload.update(extra)
    return payload


def _recovery_kpi_bits(body: Dict[str, Any]) -> Tuple[Optional[str], Optional[datetime], str]:
    """Extract the measured Recovery % from a module_body() payload — the real
    value only (statusLabel == „Gemessen"), else (None, observed, state)."""
    state = str(body.get("state") or "")
    observed = _parse_iso(body.get("observedAt"))
    if state in ("fresh", "stale"):
        for r in body.get("rows") or []:
            if r.get("title") == "Recovery" and str(r.get("statusLabel")) == "Gemessen":
                v = str(r.get("value") or "").strip()
                if v.endswith("%") and v[:-1].strip() not in ("", "—"):
                    return v[:-1].strip(), observed, state
    return None, observed, state


def kpi_recovery() -> Dict[str, Any]:
    """KPI 1 — WHOOP Recovery. Honest Strich unless a real value is measured."""
    body = module_body()
    val, observed, bstate = _recovery_kpi_bits(body)
    if val is not None:
        return _kpi("recovery", "Recovery", value=val, unit="%",
                    state=_freshness_state(observed, STALE["body"]) if observed else "fresh",
                    source="WHOOP · /internal/summary", source_kind="http",
                    workspace="private", permission="Nur lesen (privat)",
                    summary=f"Recovery {val}%", observed_at=observed, stale_after=STALE["body"])
    # No measured value: pass the module's honest state through as a Strich.
    kpi_state = bstate if bstate in ("partial", "unavailable", "empty", "error") else "partial"
    return _kpi("recovery", "Recovery", value=None, unit="%", state=kpi_state,
                source=str(body.get("source") or "WHOOP-Connector :18090"), source_kind="http",
                workspace="private", permission="Nur lesen (privat)",
                summary=str(body.get("summary") or "Kein Recovery-Wert"),
                stale_after=STALE["body"],
                note=str(body.get("note") or "Recovery nicht im Plugin-Kontext lesbar (WHOOP-Token = gated)."))


def kpi_next_exam() -> Dict[str, Any]:
    """KPI 2 — nächste Klausur (Tage). Real countdown or honest empty/unavailable."""
    row, nxt = _nearest_exam_bits()
    ex = _read_exams()
    observed = ex.get("observed")
    if nxt:
        days = int(nxt["daysLeft"])
        return _kpi("next_exam", "Nächste Klausur", value=days, unit="Tage",
                    state=_freshness_state(observed, STALE["study"]) if observed else "fresh",
                    source=STUDY_SOURCE, source_kind="file", workspace="private",
                    permission=_STUDY_PERM,
                    summary=(f"{nxt['fach']} · " + ("heute" if days == 0 else f"in {days} T")),
                    observed_at=observed, stale_after=STALE["study"],
                    extra={"fach": nxt["fach"], "datum": nxt.get("datum")})
    reason = ex.get("reason")
    if reason in ("malformed", "read") or not ex.get("ok"):
        return _kpi("next_exam", "Nächste Klausur", value=None, unit="Tage",
                    state="unavailable", source=STUDY_SOURCE, source_kind="file",
                    workspace="private", permission=_STUDY_PERM,
                    summary="exams.json nicht lesbar", observed_at=observed,
                    stale_after=STALE["study"], note="exams.json fehlt/defekt — kein Countdown.")
    return _kpi("next_exam", "Nächste Klausur", value=None, unit="Tage", state="empty",
                source=STUDY_SOURCE, source_kind="file", workspace="private",
                permission=_STUDY_PERM, summary="Keine anstehende Klausur",
                observed_at=observed, stale_after=STALE["study"],
                note="Keine zukünftigen Klausurtermine in exams.json.")


def kpi_open_gates() -> Dict[str, Any]:
    """KPI 3 — offene Approval-Cards (Freigaben). Real count or honest unavailable."""
    m = module_company()
    state = str(m.get("state") or "")
    observed = _parse_iso(m.get("observedAt"))
    if state == "unavailable":
        return _kpi("open_gates", "Offene Freigaben", value=None, unit=None,
                    state="unavailable", source="/srv/hermes/approvals", source_kind="file",
                    workspace="company_signal", permission="Nur lesen",
                    summary="Approval-Speicher nicht lesbar", stale_after=STALE["company"],
                    note=str(m.get("note") or "Approvals-Verzeichnis nicht erreichbar."))
    pending = int(m.get("pending") or 0)
    return _kpi("open_gates", "Offene Freigaben", value=pending, unit=None,
                state="fresh" if state == "empty" else state,
                source="/srv/hermes/approvals (Approval-Cards)", source_kind="file",
                workspace="company_signal", permission="Nur lesen",
                summary=("Keine offenen Freigaben" if pending == 0 else f"{pending} Freigaben offen"),
                observed_at=observed, stale_after=STALE["company"],
                extra={"readOnly": True})


def kpi_running_jobs() -> Dict[str, Any]:
    """KPI 4 — laufende Jobs, CROSS-WORKSPACE (all mission.v2, not just engineering).
    A read of the missions dir: 0 running is an honest fact; an unreadable dir is
    an honest unavailable (Strich), never conflated with 'zero'."""
    if not MISSIONS_DIR.exists():
        return _kpi("running_jobs", "Laufende Jobs", value=None, unit=None,
                    state="unavailable", source="mission.v2 · /srv/hermes/missions",
                    source_kind="file", workspace="engineering", permission="Nur lesen",
                    summary="Missions-Verzeichnis nicht lesbar",
                    note="Kein Read-Pfad auf /srv/hermes/missions.")
    missions = _read_missions()
    running = [m for m in missions if str(m.get("state")) == "running"]
    observed = max((_parse_iso(m.get("updated_at")) for m in missions),
                   default=None,
                   key=lambda d: d or datetime.min.replace(tzinfo=timezone.utc))
    return _kpi("running_jobs", "Laufende Jobs", value=len(running), unit=None,
                state="fresh" if not missions else (
                    _freshness_state(observed, STALE["tasks"]) if observed else "fresh"),
                source="mission.v2 (alle Workspaces) · /srv/hermes/missions", source_kind="file",
                workspace="engineering", permission="Nur lesen",
                summary=("Keine laufenden Jobs" if not running else f"{len(running)} laufen"),
                observed_at=observed, stale_after=STALE["tasks"],
                extra={"total": len(missions)})


def cockpit_kpi() -> Dict[str, Any]:
    """The 4 glanceable KPIs, each with its own _prov envelope + honest Strich.
    Thin aggregate over existing readers — no new data source, no fabrication."""
    kpis = [kpi_recovery(), kpi_next_exam(), kpi_open_gates(), kpi_running_jobs()]
    return {
        "kpis": kpis,
        "observedAt": _iso(_now()),
        "note": ("Vier glanceable KPIs aus bestehenden Read-Providern. value=null "
                 "bedeutet ehrlich „—“ (Messwert fehlt/gated/unavailable) — nie eine "
                 "erfundene Zahl."),
    }


# --- Jarvis-Live: honest state summary + state-derived proactive hints -------
# There is no dedicated conversational „Jarvis turn" endpoint that is grounded in
# THIS plugin's state; the honest path (see BACKEND recce) is a state summary +
# hints derived ONLY from real provider states, plus an honest chat-connectivity
# flag reporting the REAL reachability of the one proven chat backend (Brain-
# Gateway :18084). We never synthesize a chat reply here and never claim open
# business-data chat (jarvis_rag.py's own stated boundary) is connected.
_RECOVERY_DEEPWORK_MIN = int(os.environ.get("MIKAELOS_RECOVERY_DEEPWORK_MIN", "66"))
_RECOVERY_REST_MAX = int(os.environ.get("MIKAELOS_RECOVERY_REST_MAX", "34"))
_EXAM_FOCUS_DAYS = int(os.environ.get("MIKAELOS_EXAM_FOCUS_DAYS", "7"))


def _jarvis_hints(body: Dict[str, Any], company: Dict[str, Any],
                  risel: Dict[str, Any], missions: List[Dict[str, Any]],
                  next_exam: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Proactive hints DERIVED ONLY from real provider states. Every hint names
    its source; none is invented. A hint that implies an in-scope engineering
    follow-up carries a propose-only suggestion (dry-run default, gated seam)."""
    hints: List[Dict[str, Any]] = []

    # (1) WHOOP recovery — advisory only (health signal, no control-plane action).
    rec, _obs, _st = _recovery_kpi_bits(body)
    if rec is not None:
        try:
            rv = float(rec.replace(",", "."))
        except ValueError:
            rv = None
        if rv is not None and rv >= _RECOVERY_DEEPWORK_MIN:
            hints.append({"id": "recovery_high", "severity": "info", "icon": "battery-full",
                          "title": f"Recovery {rec}% — Deep-Work-Fenster",
                          "detail": "Hohe Erholung gemessen — guter Tag für fokussierte, harte Arbeit.",
                          "source": "WHOOP · /internal/summary", "workspace": "private"})
        elif rv is not None and rv <= _RECOVERY_REST_MAX:
            hints.append({"id": "recovery_low", "severity": "attention", "icon": "battery-low",
                          "title": f"Recovery {rec}% — leichter Tag",
                          "detail": "Niedrige Erholung gemessen — heute eher regenerativ planen.",
                          "source": "WHOOP · /internal/summary", "workspace": "private"})

    # (2) Nächste Klausur — advisory study focus (real countdown).
    if next_exam and int(next_exam.get("daysLeft", 999)) <= _EXAM_FOCUS_DAYS:
        d = int(next_exam["daysLeft"])
        hints.append({"id": "exam_soon", "severity": "attention", "icon": "calendar-clock",
                      "title": (f"Klausur {next_exam['fach']} " + ("heute" if d == 0 else f"in {d} T")),
                      "detail": "Klausur steht kurz bevor — Lernfokus einplanen.",
                      "source": STUDY_SOURCE, "workspace": "private"})

    # (3) Offene Freigaben — operator-only decision; the plugin NEVER decides.
    pending = int(company.get("pending") or 0)
    if pending > 0:
        hints.append({"id": "gates_pending", "severity": "attention", "icon": "shield-check",
                      "title": f"{pending} Freigabe(n) warten",
                      "detail": ("Approval-Cards offen — nur der Operator entscheidet "
                                 "(/approvals/decide); dieses Cockpit liest sie nur."),
                      "source": "/srv/hermes/approvals", "workspace": "company_signal"})

    # (4) Rise-L gestörte Dienste — restart ist ein Gate; hier NUR Hinweis, kein Propose.
    svc = risel.get("services") if isinstance(risel.get("services"), dict) else None
    failed = int((svc or {}).get("failed") or 0)
    if failed > 0:
        hints.append({"id": "risel_failed", "severity": "attention", "icon": "server-off",
                      "title": f"{failed} Dienst(e) gestört",
                      "detail": ("systemd --user meldet gestörte Dienste — prüfen. "
                                 "Neustart ist ein Prod-Restart-Gate (Operator)."),
                      "source": "systemd --user", "workspace": "engineering"})

    # (5) Blockierte Engineering-Mission -> in-scope Propose-Vorschlag (dry-run default).
    for m in missions:
        if str(m.get("workspace_type") or "") != "engineering":
            continue
        if str(m.get("state")) not in ("blocked", "reconcile_required"):
            continue
        goal = str(m.get("goal") or m.get("expected_result") or "Mission").strip()[:80]
        objective = f"Blockierte Engineering-Mission prüfen: {goal}"
        if _scope_reason(objective):   # never money/customer/personnel
            continue
        hints.append({
            "id": "mission_blocked", "severity": "attention", "icon": "octagon-alert",
            "title": f"Mission blockiert: {goal}",
            "detail": "Engineering-Mission hängt — Follow-up als propose-only Vorschlag (dry-run).",
            "source": "mission.v2 · /srv/hermes/missions", "workspace": "engineering",
            "propose": {"route": "/actions/propose", "objective": objective,
                        "dryRun": True, "proposeOnly": True,
                        "note": "Vorschlag — nichts wird ausgeführt; das Gate entscheidet."},
        })
        break  # one is enough for a hint strip

    return hints


def cockpit_jarvis_state() -> Dict[str, Any]:
    """Honest Jarvis-Live: a state summary + proactive hints derived ONLY from
    real provider states, plus an honest chat-connectivity flag. No synthesized
    reply, no invented hint, no false 'connected'."""
    body = module_body()
    company = module_company()
    risel = module_risel()
    missions = _read_missions() if MISSIONS_DIR.exists() else []
    _row, next_exam = _nearest_exam_bits()
    chat = _brain_status()   # REAL reachability of the one proven chat backend

    running = sum(1 for m in missions if str(m.get("state")) == "running")
    pending = int(company.get("pending") or 0)
    svc = risel.get("services") if isinstance(risel.get("services"), dict) else None
    failed = int((svc or {}).get("failed") or 0)

    hints = _jarvis_hints(body, company, risel, missions, next_exam)

    return {
        "observedAt": _iso(_now()),
        # Honest chat flag: connected iff a REAL chat backend answers AND a token
        # is present. Otherwise connected=false with the honest reason — the UI
        # shows „Jarvis-Chat nicht verbunden", never a fake conversation.
        "chat": {
            "connected": bool(chat.get("ready")),
            "backend": chat.get("base"),
            "reachable": bool(chat.get("reachable")),
            "hasToken": bool(chat.get("hasToken")),
            "mode": "coaching_reachable" if chat.get("ready") else "not_connected",
            "note": chat.get("note"),
            "scope": ("Doktrin/Coaching-Chat über Brain-Gateway erreichbar. Offener "
                      "Geschäftsdaten-Chat (FSM/Paperless/Qdrant) ist NICHT verbunden "
                      "(eigener Datenklassen-Vertrag nötig)."),
        },
        "state": {
            "runningJobs": running,
            "openGates": pending,
            "failedServices": failed,
            "nextExam": next_exam,
            "recovery": _recovery_kpi_bits(body)[0],
        },
        "hints": hints,
        "note": ("Zustands-Zusammenfassung + proaktive Hinweise ausschließlich aus "
                 "realen Provider-States abgeleitet. Kein erfundener Hinweis, keine "
                 "synthetische Chat-Antwort. Handlungs-Hinweise sind propose-only "
                 "(dry-run default) — das Plugin führt nichts aus."),
    }


# --- Approval-Center read (offene Freigaben inkl. Intent-Hash) ---------------
def cockpit_approvals(include_decided: bool = False) -> Dict[str, Any]:
    """READ-ONLY Approval-Center: offene Approval-Cards inkl. Intent-Hash
    (``intent_sha256``) + idempotency_key aus /srv/hermes/approvals. Liest nur;
    entscheidet nie (kein /approvals/decide). Honest empty/unavailable."""
    if not APPROVALS_DIR.exists():
        return _prov(
            state="unavailable", source="/srv/hermes/approvals", source_kind="file",
            workspace="company_signal", permission="Nur lesen",
            summary="Approval-Speicher nicht lesbar", stale_after=STALE["company"],
            note="Approvals-Verzeichnis nicht erreichbar.",
            extra={"readOnly": True, "cards": [], "pending": 0})
    cards: List[Dict[str, Any]] = []
    newest: Optional[datetime] = None
    for path in sorted(glob.glob(str(APPROVALS_DIR / "appr_*.json"))):
        try:
            c = json.loads(Path(path).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        status = str(c.get("status") or "").lower() or "pending"
        is_pending = status in ("pending", "")
        if not include_decided and not is_pending:
            continue
        dt = _parse_iso(c.get("created_utc"))
        if is_pending and dt and (newest is None or dt > newest):
            newest = dt
        cards.append({
            "id": c.get("id"),
            "text": str(c.get("text") or c.get("action") or "Approval")[:200],
            "action": c.get("action"),
            "gateClass": c.get("gate_class"),
            "gateReason": c.get("gate_reason"),
            "status": status,
            "lifecycle": _CARD_STATUS_LIFECYCLE.get(status, "waiting_approval"),
            "createdUtc": c.get("created_utc"),
            "mandant": c.get("mandant"),
            "targetSystem": c.get("target_system"),
            # Intent-Hash + Idempotenz — der Nachweis, welche Absicht gegatet ist.
            "intentSha256": c.get("intent_sha256"),
            "idempotencyKey": c.get("idempotency_key"),
            "payloadSha256": c.get("payload_sha256"),
        })
    pending_n = sum(1 for c in cards if c["lifecycle"] == "waiting_approval")
    if not cards:
        return _prov(
            state="empty", source="/srv/hermes/approvals", source_kind="file",
            workspace="company_signal", permission="Nur lesen",
            summary="Keine offenen Approval-Cards", stale_after=STALE["company"],
            extra={"readOnly": True, "cards": [], "pending": 0})
    cards.sort(key=lambda c: str(c.get("createdUtc") or ""), reverse=True)
    return _prov(
        state=_freshness_state(newest, STALE["company"]) if newest else "fresh",
        source="/srv/hermes/approvals (Approval-Cards)", source_kind="file",
        workspace="company_signal", permission="Nur lesen (entscheidet nie)",
        summary=f"{pending_n} Approval-Card(s) offen",
        observed_at=newest, stale_after=STALE["company"],
        note=("Read-only Approval-Center inkl. Intent-Hash. Freigabe/Ablehnung "
              "läuft ausschließlich über den Operator (/approvals/decide) — dieses "
              "Plugin liest nur."),
        extra={"readOnly": True, "cards": cards, "pending": pending_n})


# ===========================================================================
# FIRMA / Rise-L — six READ-ONLY company-signal projections (Aufträge · Billing
# · Dispo · Wartung · Dokumente · Runtime), bundled under GET /firma/overview.
# workspace="company_signal", technically isolated from private/engineering.
# fsm.db + belege.db are opened STRICTLY mode=ro (any write goes through Cockpit
# :18065 single-writer, NEVER here); Paperless is read via REST only. Every card
# carries the _prov envelope + an "im FSM öffnen" deep-link (navigation only) and
# degrades to honest empty/unavailable — no value is ever fabricated.
# ===========================================================================
_FIRMA_PERM = "Nur lesen (company_signal, mode=ro · Writes nur via Cockpit :18065)"


def _open_ro(path: Path) -> Optional["sqlite3.Connection"]:
    """Open a SQLite DB STRICTLY read-only (URI mode=ro). Returns None if the
    file is absent or unreadable. mode=ro guarantees the connection can never
    write — a write attempt raises sqlite3.OperationalError (readonly database)."""
    if not path.exists():
        return None
    try:
        return sqlite3.connect(f"file:{path}?mode=ro", uri=True, timeout=1.5)
    except sqlite3.Error:
        return None


def _load_report(path: Path) -> Optional[Dict[str, Any]]:
    """Read a curated daily report snapshot (JSON). None if absent/unreadable."""
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return doc if isinstance(doc, dict) else None


def _fsm_link(path: str, label: str = "Im FSM öffnen") -> Dict[str, str]:
    """Build a Cockpit deep-link (navigation only; no editable control)."""
    p = path if path.startswith("/") else "/" + path
    return {"url": f"{COCKPIT_BASE}{p}", "label": label, "navigationOnly": True}


def _paperless_token() -> str:
    """Resolve the Paperless API token: env first, then the sanctioned SOPS
    ``secret get`` render (cached in-process). NEVER logged or written to disk.
    Empty string => the Dokumente card stays an honest partial (reachable but no
    live count)."""
    global _PAPERLESS_TOKEN_CACHE
    if _PAPERLESS_TOKEN_CACHE:
        return _PAPERLESS_TOKEN_CACHE
    tok = (os.environ.get("MIKAELOS_PAPERLESS_TOKEN") or "").strip()
    if not tok and os.environ.get("MIKAELOS_PAPERLESS_SECRET", "1") != "0":
        try:
            proc = subprocess.run(
                ["secret", "get", _PAPERLESS_TOKEN_REF],
                capture_output=True, text=True, timeout=6)
            if proc.returncode == 0:
                tok = (proc.stdout or "").strip()
        except (OSError, subprocess.SubprocessError):
            tok = tok
    if tok:
        _PAPERLESS_TOKEN_CACHE = tok
    return tok


def _epoch_dt(value: Any) -> Optional[datetime]:
    """UTC datetime from a unix-epoch int/float (fsm.db *_ts columns). None if invalid."""
    try:
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError, OverflowError):
        return None


def _eur(value: Any) -> str:
    """German-formatted euro amount (e.g. 138.979 €). '—' if not a number."""
    if not isinstance(value, (int, float)):
        return "—"
    s = f"{value:,.0f}".replace(",", ".")
    return f"{s} €"


# --- (1) AUFTRÄGE — fsm.db · auftrag (mode=ro) -----------------------------
# offen  ≈ neu + eingeplant + wartet_material   laufend ≈ unterwegs + pruefen
# "heute fällig" is NOT derivable — the auftrag table has NO due-date column —
# so that metric is honestly absent (never a guessed value). Mandant is NOT
# shown: auftrag.firma is factually NULL for all rows today.
_AUFTRAG_OFFEN = {"neu", "eingeplant", "wartet_material"}
_AUFTRAG_LAUFEND = {"unterwegs", "pruefen"}


def firma_auftraege() -> Dict[str, Any]:
    con = _open_ro(FSM_DB)
    if con is None:
        return _prov(
            state="unavailable", source="fsm.db · auftrag (mode=ro)", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Auftrags-DB nicht lesbar", stale_after=STALE["firma_auftraege"],
            note="fsm.db nicht vorhanden/lesbar (read-only).",
            extra={"readOnly": True, "deepLink": _fsm_link("/auftraege")})
    try:
        dist = dict(con.execute("SELECT status, COUNT(*) FROM auftrag GROUP BY status").fetchall())
        firma_nonnull = con.execute(
            "SELECT COUNT(*) FROM auftrag WHERE firma IS NOT NULL AND firma <> ''").fetchone()[0]
        latest_ts = con.execute("SELECT MAX(updated_ts) FROM auftrag").fetchone()[0]
    except sqlite3.Error as exc:
        con.close()
        return _prov(
            state="error", source="fsm.db · auftrag (mode=ro)", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Auftrags-Lesefehler", stale_after=STALE["firma_auftraege"],
            note=f"SQL-Fehler: {type(exc).__name__}",
            extra={"readOnly": True, "deepLink": _fsm_link("/auftraege")})
    finally:
        con.close()
    total = sum(int(v) for v in dist.values())
    if total == 0:
        return _prov(
            state="empty", source="fsm.db · auftrag (mode=ro)", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Keine Aufträge erfasst", stale_after=STALE["firma_auftraege"],
            extra={"readOnly": True, "deepLink": _fsm_link("/auftraege")})
    offen = sum(int(dist.get(s, 0)) for s in _AUFTRAG_OFFEN)
    laufend = sum(int(dist.get(s, 0)) for s in _AUFTRAG_LAUFEND)
    abrechnungsbereit = int(dist.get("abrechnungsbereit", 0))
    observed = _epoch_dt(latest_ts)
    rows = [
        {"icon": "inbox", "accent": "amber", "title": "Offen",
         "sub": "neu · eingeplant · wartet Material", "value": str(offen)},
        {"icon": "truck", "accent": "cyan", "title": "Laufend",
         "sub": "unterwegs · in Prüfung", "value": str(laufend)},
        {"icon": "receipt-euro", "accent": "emerald", "title": "Abrechnungsbereit",
         "sub": "wartet auf Rechnung", "value": str(abrechnungsbereit)},
    ]
    # Mandant honesty: the auftrag table cannot attribute Delta/Wensauer today.
    mandant_note = ("Mandant (Delta/Wensauer) im FSM-Kern nicht gepflegt "
                    f"(auftrag.firma = NULL für {total - firma_nonnull}/{total}) — "
                    "hier bewusst NICHT geraten."
                    if firma_nonnull < total else None)
    return _prov(
        state=_freshness_state(observed, STALE["firma_auftraege"]),
        source="fsm.db · auftrag (mode=ro)", source_kind="file",
        workspace="company_signal", permission=_FIRMA_PERM,
        summary=f"{offen} offen · {laufend} laufend · {abrechnungsbereit} abrechnungsbereit",
        observed_at=observed, stale_after=STALE["firma_auftraege"], rows=rows,
        note=("„Heute fällig“ ist nicht ableitbar — die Auftragstabelle hat kein "
              "Fälligkeitsfeld; daher ehrlich weggelassen statt geraten."
              + (f" {mandant_note}" if mandant_note else "")),
        extra={"readOnly": True, "deepLink": _fsm_link("/auftraege"),
               "byStatus": {k: int(v) for k, v in dist.items()},
               "mandantResolvable": firma_nonnull > 0,
               "heuteFaelligVerfuegbar": False})


# --- (2) BILLING-RADAR — curated snapshots + fsm.db doc-check --------------
# Truth-source = the daily billing-kpi / billing-radar snapshots (already
# aggregated). "Kandidaten ohne Pflichtbericht" is read live from fsm.db
# auftrag_doc_status (status='fehlt'). Mandant breakdown only where the snapshot
# actually carries it (aging.je_mandant).
def firma_billing() -> Dict[str, Any]:
    kpi = _load_report(BILLING_KPI_JSON)
    radar = _load_report(BILLING_RADAR_JSON)
    if kpi is None and radar is None:
        return _prov(
            state="unavailable", source="billing-kpi-latest.json + billing-radar-latest.json",
            source_kind="file", workspace="company_signal", permission=_FIRMA_PERM,
            summary="Billing-Reports nicht lesbar", stale_after=STALE["firma_billing"],
            note="Weder billing-kpi- noch billing-radar-Snapshot vorhanden.",
            extra={"readOnly": True, "deepLink": _fsm_link("/abrechnung")})
    kpi = kpi or {}
    radar = radar or {}
    by_status = kpi.get("by_status") if isinstance(kpi.get("by_status"), dict) else {}
    sum_by_status = (kpi.get("sum_estimated_brutto_eur_by_status")
                     if isinstance(kpi.get("sum_estimated_brutto_eur_by_status"), dict) else {})
    pending_n = int(by_status.get("pending", 0) or 0)
    pending_eur = sum_by_status.get("pending")
    radar_n = radar.get("n_cases")
    radar_eur = radar.get("total_estimated_brutto_eur")
    observed = _parse_iso(kpi.get("generated_utc") or radar.get("generated_utc"))

    # Live "Kandidaten ohne Pflichtbericht" from fsm.db (read-only).
    doc_missing: Optional[Dict[str, int]] = None
    doc_auftraege: Optional[int] = None
    con = _open_ro(FSM_DB)
    if con is not None:
        try:
            doc_missing = {
                str(k): int(v) for k, v in con.execute(
                    "SELECT doc_typ, COUNT(*) FROM auftrag_doc_status "
                    "WHERE status='fehlt' GROUP BY doc_typ").fetchall()}
            doc_auftraege = con.execute(
                "SELECT COUNT(DISTINCT auftrag_id) FROM auftrag_doc_status "
                "WHERE status='fehlt'").fetchone()[0]
        except sqlite3.Error:
            doc_missing, doc_auftraege = None, None
        finally:
            con.close()

    rows: List[Dict[str, Any]] = []
    if pending_n or pending_eur is not None:
        rows.append({"icon": "file-clock", "accent": "amber", "title": "Offene Approval-Cards",
                     "sub": "Billing-Radar · wartet auf Freigabe",
                     "value": f"{pending_n} · {_eur(pending_eur)}"})
    if isinstance(radar_n, (int, float)):
        rows.append({"icon": "radar", "accent": "cyan", "title": "Radar-Fälle",
                     "sub": "Abrechnungs-Kandidaten gesamt",
                     "value": f"{int(radar_n)} · {_eur(radar_eur)}"})
    if doc_auftraege is not None:
        total_missing = sum(doc_missing.values()) if doc_missing else 0
        rows.append({"icon": "file-x", "accent": "amber" if total_missing else "emerald",
                     "title": "Kandidaten ohne Pflichtbericht",
                     "sub": "Arbeitsbericht/Prüfbericht/Lieferschein fehlt",
                     "value": str(doc_auftraege)})

    if not rows:
        return _prov(
            state="empty", source="billing-kpi + billing-radar snapshots", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Keine Billing-Signale", stale_after=STALE["firma_billing"],
            extra={"readOnly": True, "deepLink": _fsm_link("/abrechnung")})

    # Mandant breakdown from the KPI aging block (the snapshot that carries it).
    aging = kpi.get("aging") if isinstance(kpi.get("aging"), dict) else {}
    je_mandant = aging.get("je_mandant") if isinstance(aging.get("je_mandant"), dict) else None

    return _prov(
        state=_freshness_state(observed, STALE["firma_billing"]),
        source="billing-kpi-latest.json + billing-radar-latest.json + fsm.db doc-check (ro)",
        source_kind="file", workspace="company_signal", permission=_FIRMA_PERM,
        summary=(f"{pending_n} Card(s) offen · {_eur(pending_eur)}"
                 + (f" · {int(radar_n)} Radar-Fälle" if isinstance(radar_n, (int, float)) else "")),
        observed_at=observed, stale_after=STALE["firma_billing"], rows=rows,
        note=("Kandidat ohne Pflichtbericht = Flag, kein stiller Durchlauf. Snapshots "
              "07:30 UTC; Mandant-Aufschlüsselung nur aus dem KPI-Aging (belege-getrieben)."),
        extra={"readOnly": True, "deepLink": _fsm_link("/abrechnung"),
               "cardsTotal": kpi.get("cards_total"),
               "byStatus": {k: int(v) for k, v in by_status.items()} if by_status else None,
               "pendingEur": pending_eur, "radarCases": radar_n, "radarEur": radar_eur,
               "docMissingByType": doc_missing, "docMissingAuftraege": doc_auftraege,
               "agingJeMandant": je_mandant, "digestLine": kpi.get("digest_line")})


# --- (3) DISPO — fsm.db · tages_dispo (mode=ro) ----------------------------
# auto_dispatch is OFF by operating doctrine (Dry-Run/Freigabe pending). There is
# NO live flag for it in the DB, so it is surfaced as a TEXT fact, not read from
# data. "Heute geplant" is honest-empty when no row matches today's Berlin date.
def _berlin_today_str() -> str:
    now = datetime.now(_BERLIN) if _BERLIN is not None else _now()
    return now.date().isoformat()


def firma_dispo() -> Dict[str, Any]:
    con = _open_ro(FSM_DB)
    if con is None:
        return _prov(
            state="unavailable", source="fsm.db · tages_dispo (mode=ro)", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Dispo-DB nicht lesbar", stale_after=STALE["firma_dispo"],
            note="fsm.db nicht vorhanden/lesbar (read-only).",
            extra={"readOnly": True, "deepLink": _fsm_link("/dispo?karte=1"),
                   "autoDispatch": "aus"})
    today = _berlin_today_str()
    try:
        today_rows = con.execute(
            "SELECT firma, fahrer, status, auftrag_ids FROM tages_dispo "
            "WHERE tag = ? ORDER BY fahrer", (today,)).fetchall()
        upcoming = con.execute(
            "SELECT COUNT(*) FROM tages_dispo WHERE tag > ?", (today,)).fetchone()[0]
        latest_ts = con.execute("SELECT MAX(created_ts) FROM tages_dispo").fetchone()[0]
    except sqlite3.Error as exc:
        con.close()
        return _prov(
            state="error", source="fsm.db · tages_dispo (mode=ro)", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Dispo-Lesefehler", stale_after=STALE["firma_dispo"],
            note=f"SQL-Fehler: {type(exc).__name__}",
            extra={"readOnly": True, "deepLink": _fsm_link("/dispo?karte=1"),
                   "autoDispatch": "aus"})
    finally:
        con.close()
    observed = _epoch_dt(latest_ts)
    deep = _fsm_link(f"/dispo?tag={today}")
    auto_note = ("auto_dispatch ist AUS (Dry-Run/Operator-Go ausstehend) — "
                 "Betriebs-Doktrin, kein DB-Flag; daher als Text-Fakt.")
    if not today_rows:
        return _prov(
            state="empty", source="fsm.db · tages_dispo (mode=ro)", source_kind="file",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary=f"Keine Dispo für heute ({today})",
            observed_at=observed, stale_after=STALE["firma_dispo"],
            note=(f"Für heute ist keine Tages-Dispo hinterlegt. "
                  + (f"{upcoming} Tag(e) künftig geplant. " if upcoming else "")
                  + auto_note),
            extra={"readOnly": True, "deepLink": deep, "autoDispatch": "aus",
                   "today": today, "upcomingDays": int(upcoming)})
    rows: List[Dict[str, Any]] = []
    for firma, fahrer, status, auftrag_ids in today_rows:
        try:
            n_auftraege = len(json.loads(auftrag_ids)) if auftrag_ids else 0
        except (ValueError, TypeError):
            n_auftraege = 0
        rows.append({
            "icon": "route", "accent": "cyan" if status in ("confirmed", "unterwegs") else "amber",
            "title": str(fahrer or "—"),
            "sub": f"{firma or 'Mandant unbekannt'} · {status or '—'}",
            "value": f"{n_auftraege} Auftr." if n_auftraege else "—"})
    return _prov(
        state=_freshness_state(observed, STALE["firma_dispo"]),
        source="fsm.db · tages_dispo (mode=ro)", source_kind="file",
        workspace="company_signal", permission=_FIRMA_PERM,
        summary=f"{len(today_rows)} Fahrer heute geplant ({today})",
        observed_at=observed, stale_after=STALE["firma_dispo"], rows=rows,
        note=auto_note, extra={"readOnly": True, "deepLink": deep,
                               "autoDispatch": "aus", "today": today,
                               "upcomingDays": int(upcoming)})


# --- (4) WARTUNG — wartungs-radar snapshot + wartungsvertrag mandant-split --
def firma_wartung() -> Dict[str, Any]:
    radar = _load_report(WARTUNGS_RADAR_JSON)
    # Mandant-clean contract split from fsm.db (wartungsvertrag carries mandant).
    mandant_split: Optional[Dict[str, Dict[str, Any]]] = None
    con = _open_ro(FSM_DB)
    if con is not None:
        try:
            mandant_split = {}
            for mandant, n, betrag in con.execute(
                "SELECT mandant, COUNT(*), COALESCE(SUM(betrag_netto),0) FROM wartungsvertrag "
                "WHERE aktiv=1 GROUP BY mandant").fetchall():
                mandant_split[str(mandant or "unbekannt")] = {
                    "aktiveVertraege": int(n), "betragNetto": float(betrag or 0)}
        except sqlite3.Error:
            mandant_split = None
        finally:
            con.close()

    if radar is None and mandant_split is None:
        return _prov(
            state="unavailable", source="wartungs-radar-latest.json + fsm.db · wartungsvertrag",
            source_kind="file", workspace="company_signal", permission=_FIRMA_PERM,
            summary="Wartungs-Quellen nicht lesbar", stale_after=STALE["firma_wartung"],
            note="Weder Wartungs-Radar-Snapshot noch wartungsvertrag lesbar.",
            extra={"readOnly": True, "deepLink": _fsm_link("/wartung-plan")})
    radar = radar or {}
    n_faellig = radar.get("n_faellig")
    n_termin = radar.get("n_termin")
    n_angebot = radar.get("n_angebot_entwurf")
    eur_gesamt = radar.get("eur_potenzial_gesamt")
    observed = _parse_iso(radar.get("generated_utc"))

    rows: List[Dict[str, Any]] = []
    if isinstance(n_faellig, (int, float)):
        rows.append({"icon": "calendar-clock", "accent": "amber" if n_faellig else "emerald",
                     "title": "Fällig", "sub": "Wartung überfällig/jetzt fällig",
                     "value": str(int(n_faellig))})
    if isinstance(n_termin, (int, float)):
        rows.append({"icon": "calendar-check", "accent": "cyan", "title": "Termin-Vorschläge",
                     "sub": "im Vorlauf-Fenster", "value": str(int(n_termin))})
    if isinstance(n_angebot, (int, float)):
        rows.append({"icon": "file-plus", "accent": "violet", "title": "Angebots-Entwürfe",
                     "sub": "Mangel-Signale erkannt", "value": str(int(n_angebot))})
    if mandant_split:
        for mandant in ("Delta", "Wensauer"):
            info = mandant_split.get(mandant)
            if info:
                rows.append({"icon": "building-2", "accent": "neutral",
                             "title": f"Verträge {mandant}", "sub": "aktive Wartungsverträge",
                             "value": str(info["aktiveVertraege"])})

    if not rows:
        return _prov(
            state="empty", source="wartungs-radar-latest.json + fsm.db · wartungsvertrag",
            source_kind="file", workspace="company_signal", permission=_FIRMA_PERM,
            summary="Keine Wartungs-Signale", stale_after=STALE["firma_wartung"],
            extra={"readOnly": True, "deepLink": _fsm_link("/wartung-plan")})
    return _prov(
        state=_freshness_state(observed, STALE["firma_wartung"]) if observed else "partial",
        source="wartungs-radar-latest.json + fsm.db · wartungsvertrag (ro)", source_kind="file",
        workspace="company_signal", permission=_FIRMA_PERM,
        summary=(f"{int(n_faellig)} fällig · {int(n_termin)} Termine · {_eur(eur_gesamt)} Potenzial"
                 if isinstance(n_faellig, (int, float)) and isinstance(n_termin, (int, float))
                 else "Wartungs-Signale"),
        observed_at=observed, stale_after=STALE["firma_wartung"], rows=rows,
        note="Radar-Snapshot ~01:30 UTC; Mandant-Split aus wartungsvertrag (Delta/Wensauer sauber gepflegt).",
        extra={"readOnly": True, "deepLink": _fsm_link("/wartung-plan"),
               "nFaellig": n_faellig, "nTermin": n_termin, "nAngebotEntwurf": n_angebot,
               "eurPotenzialGesamt": eur_gesamt, "mandantSplit": mandant_split})


# --- (5) DOKUMENTE — Paperless :18075 REST (read-only) ---------------------
# Reachability is probed unauthenticated; the live document count needs the API
# token (env or SOPS). No token => honest 'partial' (reachable, no count) — never
# a fabricated number. No direct DB access — the REST API is the clean read path.
def firma_dokumente() -> Dict[str, Any]:
    deep = {"url": f"{PAPERLESS_BASE}/documents/", "label": "In Paperless öffnen",
            "navigationOnly": True, "externalSystem": "paperless"}
    # Unauthenticated reachability: /api/ answers 200/302/401/403 when the
    # service is up; only a connection failure (code None) is truly unavailable.
    code, _ = _http_get_json(f"{PAPERLESS_BASE}/api/")
    if code is None:
        return _prov(
            state="unavailable", source=f"Paperless {PAPERLESS_BASE}", source_kind="http",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Paperless nicht erreichbar", stale_after=STALE["firma_dokumente"],
            note="GET /api/ nicht erreichbar.",
            extra={"readOnly": True, "deepLink": deep})
    token = _paperless_token()
    if not token:
        return _prov(
            state="partial", source=f"Paperless {PAPERLESS_BASE} (/api/)", source_kind="http",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Paperless erreichbar · Zähler braucht Token",
            stale_after=STALE["firma_dokumente"],
            note=("Dokument-Zähler nur mit API-Token (env MIKAELOS_PAPERLESS_TOKEN "
                  "oder SOPS paperless/API_TOKEN) — kein Token im Plugin-Kontext, "
                  "daher ehrlich ohne Zahl."),
            rows=[{"icon": "folder-check", "accent": "cyan", "title": "Paperless online",
                   "sub": "OCR-/Beleg-Truth :18075", "value": "OK"}],
            extra={"readOnly": True, "deepLink": deep})
    # Authenticated: total document count + newest 'added' as freshness.
    total_code, total_body = _http_get_json(
        f"{PAPERLESS_BASE}/api/documents/?page_size=1", token=token, auth_scheme="Token")
    recent_code, recent_body = _http_get_json(
        f"{PAPERLESS_BASE}/api/documents/?ordering=-added&page_size=1", token=token, auth_scheme="Token")
    if total_code != 200 or not isinstance(total_body, dict):
        return _prov(
            state="partial", source=f"Paperless {PAPERLESS_BASE}", source_kind="http",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Paperless erreichbar · Zähler nicht lesbar",
            stale_after=STALE["firma_dokumente"],
            note=f"GET /api/documents/ lieferte {total_code}.",
            extra={"readOnly": True, "deepLink": deep})
    count = total_body.get("count")
    observed: Optional[datetime] = None
    if isinstance(recent_body, dict):
        results = recent_body.get("results")
        if isinstance(results, list) and results and isinstance(results[0], dict):
            observed = _parse_iso(results[0].get("added"))
    rows = [{"icon": "folder-check", "accent": "cyan", "title": "Dokumente gesamt",
             "sub": "Paperless OCR-/Beleg-Truth",
             "value": (f"{int(count):,}".replace(",", ".") if isinstance(count, int) else "—")}]
    if observed is not None:
        rows.append({"icon": "clock", "accent": "amber", "title": "Zuletzt hinzugefügt",
                     "sub": "Eingang", "value": observed.strftime("%d.%m. %H:%M")})
    return _prov(
        state=_freshness_state(observed, STALE["firma_dokumente"]) if observed else "fresh",
        source=f"Paperless {PAPERLESS_BASE} · /api/documents/", source_kind="http",
        workspace="company_signal", permission=_FIRMA_PERM,
        summary=(f"{int(count):,}".replace(",", ".") + " Dokumente"
                 if isinstance(count, int) else "Paperless online"),
        observed_at=observed, stale_after=STALE["firma_dokumente"], rows=rows,
        note="Read-only über Paperless-REST; kein direkter DB-Zugriff.",
        extra={"readOnly": True, "deepLink": deep, "count": count})


# --- (6) RUNTIME — systemd --user health + restic backup + open gates ------
# Reuses the existing read paths: _systemd_counts() (services), the restic unit
# state, and the SAME approvals reader as module_company() for "offene Gates".
def _unit_active(unit: str) -> Optional[Dict[str, Any]]:
    """Read one systemd --user unit's ActiveState/SubState + last-run result. None
    if systemctl is unreachable. Read-only ``show`` — never start/stop."""
    try:
        out = subprocess.run(
            ["systemctl", "--user", "show", unit,
             "--property=ActiveState,SubState,Result,ExecMainExitTimestamp",
             "--no-pager"],
            capture_output=True, text=True, timeout=4)
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    props: Dict[str, str] = {}
    for line in out.stdout.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            props[k] = v
    return props


def firma_runtime() -> Dict[str, Any]:
    counts = _systemd_counts()
    backup = _unit_active(RESTIC_UNIT)
    # Open gates: SAME approvals dir as module_company (do not duplicate the reader).
    open_gates: Optional[int] = None
    if APPROVALS_DIR.exists():
        open_gates = 0
        for path in glob.glob(str(APPROVALS_DIR / "appr_*.json")):
            try:
                c = json.loads(Path(path).read_text(encoding="utf-8"))
            except (OSError, ValueError):
                continue
            if str(c.get("status") or "").lower() in ("pending", ""):
                open_gates += 1

    if counts is None and backup is None and open_gates is None:
        return _prov(
            state="unavailable", source="systemd --user + restic + approvals", source_kind="subprocess",
            workspace="company_signal", permission=_FIRMA_PERM,
            summary="Runtime-Status nicht lesbar", stale_after=STALE["firma_runtime"],
            note="Weder systemctl --user noch approvals erreichbar.",
            extra={"readOnly": True, "deepLink": _fsm_link("/auftraege")})
    rows: List[Dict[str, Any]] = []
    if counts is not None:
        ok = counts["failed"] == 0
        rows.append({"icon": "server", "accent": "emerald" if ok else "amber",
                     "title": "Dienste online", "sub": f"{counts['active']} aktiv · {counts['total']} gesamt",
                     "status": "verified" if ok else "waiting",
                     "statusLabel": "Stabil" if ok else f"{counts['failed']} gestört",
                     "value": "OK" if ok else str(counts["failed"])})
    if backup is not None:
        result = backup.get("Result", "")
        backup_ok = result in ("success", "")
        rows.append({"icon": "database-backup", "accent": "emerald" if backup_ok else "amber",
                     "title": "Backup (restic offsite)",
                     "sub": RESTIC_UNIT + f" · {backup.get('ActiveState', '?')}",
                     "value": "OK" if backup_ok else (result or "—")})
    if open_gates is not None:
        rows.append({"icon": "shield-check", "accent": "amber" if open_gates else "emerald",
                     "title": "Offene Gates", "sub": "Approval-Cards · Operator entscheidet",
                     "value": str(open_gates)})
    failed = counts["failed"] if counts else 0
    state = "partial" if (failed or backup is None or counts is None) else "fresh"
    return _prov(
        state=state, source="systemd --user + restic + /srv/hermes/approvals", source_kind="subprocess",
        workspace="company_signal", permission=_FIRMA_PERM,
        summary=((f"{counts['active']} Dienste aktiv" if counts else "Dienste unbekannt")
                 + (f" · {failed} gestört" if failed else "")
                 + (f" · {open_gates} Gate(s) offen" if open_gates else "")),
        stale_after=STALE["firma_runtime"], rows=rows,
        note=("Backup-Frische aus dem restic-Unit-Result; „Offene Gates“ nutzt denselben "
              "Approvals-Lesepfad wie Firma-Signale — Entscheidung bleibt Operator-only."),
        extra={"readOnly": True, "deepLink": _fsm_link("/auftraege"),
               "services": counts, "backup": backup, "openGates": open_gates})


# Bundle registry — id -> (title, reader). GET /firma/overview reads all six.
_FIRMA_MODULES: List[Dict[str, Any]] = [
    {"id": "auftraege", "title": "Aufträge", "icon": "clipboard-list", "reader": firma_auftraege},
    {"id": "billing", "title": "Billing-Radar", "icon": "radar", "reader": firma_billing},
    {"id": "dispo", "title": "Dispo", "icon": "route", "reader": firma_dispo},
    {"id": "wartung", "title": "Wartung", "icon": "wrench", "reader": firma_wartung},
    {"id": "dokumente", "title": "Dokumente", "icon": "folder-check", "reader": firma_dokumente},
    {"id": "runtime", "title": "Runtime", "icon": "server", "reader": firma_runtime},
]


def firma_overview() -> Dict[str, Any]:
    """All six company-signal cards, each with its own _prov envelope + deep-link.
    A single card raising never breaks the bundle (honest per-card error)."""
    cards: List[Dict[str, Any]] = []
    for meta in _FIRMA_MODULES:
        try:
            payload = meta["reader"]()
        except Exception as exc:  # noqa: BLE001 - one card must never break the bundle
            payload = _prov(
                state="error", source="unbekannt", source_kind="konzept",
                workspace="company_signal", permission=_FIRMA_PERM,
                summary="Lesefehler", note=f"Read-Fehler: {type(exc).__name__}",
                extra={"readOnly": True})
        cards.append({"id": meta["id"], "title": meta["title"], "icon": meta["icon"],
                      "workspace": "company_signal", "readOnly": True, **payload})
    return {
        "workspace": "company_signal",
        "readOnly": True,
        "cards": cards,
        "observedAt": _iso(_now()),
        "note": ("Firma-Karten sind reine read-only Projektion (fsm.db/belege.db mode=ro, "
                 "Paperless nur lesen). Writes laufen ausschließlich über Cockpit :18065."),
    }


# ===========================================================================
# M3 — three additive READ-ONLY area projections: wissen · kommunikation ·
# sessions. Each carries a _prov envelope, the honest workspace, and degrades to
# empty/partial/unavailable — never a fabricated value. No writes anywhere:
# search is a GET; kommunikation is signals-only (no compose/send — G7-gated);
# sessions expose only broker inventory + mission.v2 (steer/continue stay gated).
# ===========================================================================

# --- M3/wissen — federated read-only search over unified-search :18055 ------
UNIFIED_SEARCH_BASE = os.environ.get("MIKAELOS_UNIFIED_SEARCH", "http://127.0.0.1:18055")
# Workspace per backend from a FIXED, source-verified map — NEVER inferred from a
# result's content. 'history' (agent session corpus) genuinely mixes private tax
# work and company bookkeeping and has no clean split field, so it is tagged an
# honest third state 'gemischt' with a visible warning — never silently shown as
# private nor as company_signal (hard workspace-boundary rule).
_WISSEN_WORKSPACE = {
    "gbrain": "engineering",
    "qdrant": "company_signal",
    "docs": "company_signal",
    "paperless": "company_signal",
    "techniker": "company_signal",
    "history": "gemischt",
}
_WISSEN_WS_LABEL = {
    "engineering": "Engineering",
    "company_signal": "Firma",
    "gemischt": "Gemischt (privat+Firma)",
    "private": "Privat",
}
_WISSEN_PERM = "Nur lesen (föderierte Suche · Workspace-Grenze je Treffer sichtbar)"


def wissen_search(q: str = "", src: str = "") -> Dict[str, Any]:
    """READ-ONLY federated search projection over unified-search :18055.

    Every row is workspace-tagged from the fixed source-verified map above (never
    inferred from content). 'history' rows carry workspace='gemischt' + a visible
    warning; that corpus is not cleanly separable, so it is never silently shown
    as private nor as company_signal. Degrades honestly:
      empty query -> partial · service down -> unavailable · count 0 -> empty ·
      partial backend errors -> keep the successful subset + note which failed.
    """
    query = (q or "").strip()
    now = _now()
    base_extra: Dict[str, Any] = {
        "readOnly": True, "query": query,
        "workspaces": ["engineering", "company_signal", "gemischt"],
    }
    if not query:
        return _prov(
            state="partial", source="unified-search :18055", source_kind="http",
            workspace="mixed", permission=_WISSEN_PERM,
            summary="Keine Suchanfrage", observed_at=now, stale_after=None,
            note="Bitte einen Suchbegriff eingeben.", extra=base_extra)
    # Health probe distinguishes 'service down' from 'reachable but 0 hits'.
    _hc, health = _http_get_json(f"{UNIFIED_SEARCH_BASE}/health")
    params = f"q={quote(query)}"
    if (src or "").strip():
        params += f"&src={quote(src.strip())}"
    scode, data = _http_get_json(f"{UNIFIED_SEARCH_BASE}/search?{params}")
    if scode is None or not isinstance(data, dict):
        return _prov(
            state="unavailable", source="unified-search :18055", source_kind="http",
            workspace="mixed", permission=_WISSEN_PERM,
            summary="Unified-Search nicht erreichbar", observed_at=now, stale_after=None,
            note="GET /search auf 127.0.0.1:18055 fehlgeschlagen.", extra=base_extra)
    results = data.get("results") if isinstance(data.get("results"), list) else []
    errors = data.get("errors") if isinstance(data.get("errors"), list) else []
    rows: List[Dict[str, Any]] = []
    history_present = False
    for r in results:
        if not isinstance(r, dict):
            continue
        quelle = str(r.get("quelle") or "").strip() or "?"
        ws = _WISSEN_WORKSPACE.get(quelle, "company_signal")
        if quelle == "history":
            history_present = True
        rows.append({
            "titel": str(r.get("titel") or "").strip() or "—",
            "typ": r.get("typ"),
            "quelle": quelle,
            "workspace": ws,
            "workspaceLabel": _WISSEN_WS_LABEL.get(ws, ws),
            "snippet": r.get("snippet"),
            "datum": r.get("datum"),
            "link": r.get("link"),            # may be null (e.g. techniker rows)
            "objektId": r.get("objekt_id"),
            "paperlessId": r.get("paperless_id"),
            "readOnly": True,
        })
    err_note = ("Teil-Backends nicht erreichbar: " + "; ".join(str(e) for e in errors)
                if errors else None)
    extra = {
        **base_extra,
        "count": len(rows),
        "errors": errors,
        "backendsHealthy": (health.get("backends") if isinstance(health, dict) else None),
        "historyNote": ("„Sessions/history“ mischt privat+Firma und ist nicht sauber "
                        "trennbar — als „gemischt“ markiert, nie still als privat/Firma."
                        if history_present else None),
    }
    if not rows:
        return _prov(
            state="empty", source="unified-search :18055", source_kind="http",
            workspace="mixed", permission=_WISSEN_PERM,
            summary=f"Keine Treffer für „{query}“", observed_at=now, stale_after=None,
            note=err_note, extra=extra)
    return _prov(
        state=("partial" if errors else "fresh"),
        source="unified-search :18055 (gbrain+qdrant+docs+paperless+history+techniker)",
        source_kind="http", workspace="mixed", permission=_WISSEN_PERM,
        summary=f"{len(rows)} Treffer für „{query}“",
        observed_at=now, stale_after=None, rows=rows, note=err_note, extra=extra)


# --- M3/kommunikation — signals only (Telegram · Vorschläge · FreeScout) -----
# READ-ONLY. No compose, no send — outbound mail/telegram is G7-gated and lives
# nowhere in this surface. Three structurally separated row-groups; Telegram is
# Mikael's single personal channel (workspace private), Vorschläge+FreeScout are
# company_signal. Counts are never blended across the workspace boundary.
BOT_OUTBOX_SENT = Path(os.environ.get(
    "MIKAELOS_BOT_OUTBOX", "/srv/delta/data/bot/outbox/sent"))
BOT_DIRECTIVES = Path(os.environ.get(
    "MIKAELOS_BOT_DIRECTIVES", "/srv/delta/data/bot/directives/verarbeitet"))
FREESCOUT_DB_HOST = os.environ.get("MIKAELOS_FREESCOUT_HOST", "127.0.0.1")
FREESCOUT_DB_PORT = int(os.environ.get("MIKAELOS_FREESCOUT_PORT", "3306"))
FREESCOUT_DB_NAME = os.environ.get("MIKAELOS_FREESCOUT_DB", "freescout")
FREESCOUT_DB_USER = os.environ.get("MIKAELOS_FREESCOUT_USER", "freescout")
_FREESCOUT_SECRET_REF = os.environ.get("MIKAELOS_FREESCOUT_SECRET_REF", "freescout/DB_PASSWORD")
_KOMM_PERM = "Nur lesen (nur Signale · Versand G7-gated, hier nicht möglich)"


def _parse_directive(path: Path) -> Optional[Dict[str, str]]:
    """Minimal read of a processed Telegram directive markdown (both directions)."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None
    meta: Dict[str, str] = {}
    for ln in lines:
        s = ln.strip()
        if s.startswith("- id:"):
            meta["id"] = s[len("- id:"):].strip()
        elif s.startswith("- received:"):
            meta["received"] = s[len("- received:"):].strip()
        elif s.startswith("- status:"):
            meta["status"] = s[len("- status:"):].strip()
    for i, ln in enumerate(lines):
        if ln.strip() == "## Anweisung":
            for nxt in lines[i + 1:]:
                if nxt.strip():
                    meta["anweisung"] = nxt.strip()
                    break
            break
    return meta


def _komm_telegram() -> Dict[str, Any]:
    """Telegram Operator-Bot signals: outbox/sent (outbound) + directives (inbound).
    Personal channel -> workspace 'private'. No 'unread' count is invented (Telegram
    gives us no read-receipt). Signals only — never a send."""
    base = {"workspace": "private",
            "source": "bot outbox/sent + directives/verarbeitet",
            "readOnly": True, "rows": []}
    if not BOT_OUTBOX_SENT.exists() and not BOT_DIRECTIVES.exists():
        return {**base, "state": "unavailable", "note": "Bot-Outbox/Directives nicht lesbar."}
    rows: List[Dict[str, Any]] = []
    newest: Optional[datetime] = None
    for p in sorted(glob.glob(str(BOT_OUTBOX_SENT / "*.outbox.json")), reverse=True)[:6]:
        try:
            doc = json.loads(Path(p).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        dt = _parse_iso(doc.get("created_at"))
        if dt and (newest is None or dt > newest):
            newest = dt
        first = next((ln for ln in str(doc.get("body") or "").splitlines() if ln.strip()), "")
        rows.append({
            "icon": "send", "accent": "cyan",
            "title": (first[:80] or str(doc.get("event") or "Nachricht")),
            "sub": f"ausgehend · {doc.get('kind') or doc.get('event') or 'bot'}",
            "direction": "out", "datum": _iso(dt), "workspace": "private", "readOnly": True,
        })
    for p in sorted(glob.glob(str(BOT_DIRECTIVES / "*.md")), reverse=True)[:6]:
        meta = _parse_directive(Path(p))
        if not meta:
            continue
        dt = _parse_iso(meta.get("received"))
        if dt and (newest is None or dt > newest):
            newest = dt
        rows.append({
            "icon": "message-square", "accent": "amber",
            "title": (meta.get("anweisung") or "Directive")[:80],
            "sub": f"eingehend · {meta.get('status') or 'directive'}",
            "direction": "in", "datum": _iso(dt), "workspace": "private", "readOnly": True,
        })
    rows.sort(key=lambda r: r.get("datum") or "", reverse=True)
    if not rows:
        return {**base, "state": "empty", "note": "Keine Telegram-Signale."}
    return {**base, "state": _freshness_state(newest, STALE["kommunikation"]), "rows": rows[:8],
            "note": ("Telegram = Mikaels persönlicher Kanal (privat). Kein „ungelesen“-Zähler "
                     "— Telegram liefert keine Lesebestätigung; nicht erfunden.")}


def _freescout_password() -> str:
    """FreeScout DB password: env first, else sanctioned SOPS ``secret get``.
    Never logged. Empty => the FreeScout block stays an honest partial."""
    tok = (os.environ.get("MIKAELOS_FREESCOUT_PASSWORD") or "").strip()
    if not tok and os.environ.get("MIKAELOS_FREESCOUT_SECRET", "1") != "0":
        try:
            proc = subprocess.run(
                ["secret", "get", _FREESCOUT_SECRET_REF],
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=6,
            )
            if proc.returncode == 0:
                tok = (proc.stdout or "").strip()
        except (OSError, subprocess.SubprocessError):
            pass
    return tok


def _freescout_signals() -> Dict[str, Any]:
    """FreeScout Büro-Tickets, read-only aggregate via MariaDB (SET SESSION
    TRANSACTION READ ONLY). Counts + last N open conversations per mailbox. No
    'Priorität' field is shown — the FreeScout core schema has none (never faked).
    Honest degrade: no driver -> unavailable · no secret -> partial · DB down ->
    unavailable."""
    base = {"workspace": "company_signal", "source": "freescout (MariaDB ro)",
            "readOnly": True, "rows": [], "byMailbox": {}, "open": 0}
    try:
        import pymysql  # dashboard runtime has it; other contexts may not
    except Exception:
        return {**base, "state": "unavailable",
                "note": "MySQL-Treiber (pymysql) im Kontext nicht verfügbar."}
    pw = _freescout_password()
    if not pw:
        return {**base, "state": "partial",
                "note": "FreeScout-DB-Passwort (SOPS freescout/DB_PASSWORD) nicht verfügbar."}
    try:
        con = pymysql.connect(host=FREESCOUT_DB_HOST, port=FREESCOUT_DB_PORT,
                              user=FREESCOUT_DB_USER, password=pw,
                              database=FREESCOUT_DB_NAME, connect_timeout=3)
    except Exception as exc:  # noqa: BLE001
        return {**base, "state": "unavailable",
                "note": f"MariaDB freescout nicht erreichbar: {type(exc).__name__}"}
    try:
        cur = con.cursor()
        cur.execute("SET SESSION TRANSACTION READ ONLY")
        cur.execute("SELECT m.name, COUNT(*) FROM conversations c "
                    "JOIN mailboxes m ON m.id = c.mailbox_id "
                    "WHERE c.status = 1 GROUP BY m.name")
        by_mb = {str(n): int(c) for (n, c) in cur.fetchall()}
        cur.execute("SELECT c.subject, m.name, c.last_reply_at, c.user_id, c.number "
                    "FROM conversations c JOIN mailboxes m ON m.id = c.mailbox_id "
                    "WHERE c.status = 1 ORDER BY c.last_reply_at DESC LIMIT 6")
        recent = cur.fetchall()
    except Exception as exc:  # noqa: BLE001
        return {**base, "state": "error", "note": f"FreeScout-Lesefehler: {type(exc).__name__}"}
    finally:
        try:
            con.close()
        except Exception:  # noqa: BLE001
            pass
    open_total = sum(by_mb.values())
    rows: List[Dict[str, Any]] = []
    for (subject, mbname, last_reply, user_id, number) in recent:
        lr = last_reply
        if isinstance(lr, datetime) and lr.tzinfo is None:
            lr = lr.replace(tzinfo=timezone.utc)
        rows.append({
            "icon": "inbox", "accent": "cyan",
            "title": str(subject or f"#{number}")[:70],
            "sub": f"{mbname} · {'zugewiesen' if user_id else 'nicht zugewiesen'}",
            "wartetSeit": _iso(lr if isinstance(lr, datetime) else None),
            "workspace": "company_signal", "readOnly": True,
        })
    return {**base, "state": ("fresh" if open_total else "empty"),
            "rows": rows, "byMailbox": by_mb, "open": open_total,
            "note": "FreeScout hat kein Prioritäts-Feld — keine „Priorität“-Anzeige (nicht erfunden)."}


def module_kommunikation() -> Dict[str, Any]:
    """READ-ONLY communication signals: Telegram (private) + Vorschläge/Approvals
    (company_signal, reuses module_company — no second store) + FreeScout Büro-
    Tickets (company_signal). Structurally separated row-groups; the workspace
    boundary is visible per row and counts are never blended. Signals only —
    sending is G7-gated and structurally absent here."""
    tg = _komm_telegram()
    company = module_company()  # reuse the existing approvals reader, no duplication
    vorschlaege = {
        "state": company.get("state"), "workspace": "company_signal",
        "source": company.get("source"), "rows": company.get("rows") or [],
        "pending": company.get("pending", 0), "readOnly": True,
        "note": company.get("note"),
    }
    fs = _freescout_signals()
    subs = [tg, vorschlaege, fs]
    has_data = any(sub.get("rows") for sub in subs)
    all_unavail = all(sub.get("state") == "unavailable" for sub in subs)
    any_degraded = any(sub.get("state") in ("unavailable", "partial", "error") for sub in subs)
    if all_unavail:
        state = "unavailable"
    elif has_data:
        state = "partial" if any_degraded else "fresh"
    else:
        state = "empty"
    rows: List[Dict[str, Any]] = []
    for r in (tg.get("rows") or [])[:3]:
        rows.append({**r, "group": "telegram", "workspace": "private"})
    for r in (vorschlaege.get("rows") or [])[:3]:
        rows.append({**r, "group": "vorschlaege", "workspace": "company_signal"})
    for r in (fs.get("rows") or [])[:3]:
        rows.append({**r, "group": "freescout", "workspace": "company_signal"})
    summary = (f"{len(tg.get('rows') or [])} Telegram · "
               f"{vorschlaege.get('pending', 0)} Vorschläge · "
               f"{fs.get('open', 0)} FreeScout offen")
    return _prov(
        state=state,
        source="bot-outbox+directives · /srv/hermes/approvals · freescout (MariaDB ro)",
        source_kind="mixed", workspace="company_signal", permission=_KOMM_PERM,
        summary=summary, observed_at=_now(), stale_after=STALE["kommunikation"], rows=rows,
        note=("Nur Signale — Versand (Mail/Telegram) ist G7-gated und hier nicht möglich. "
              "Telegram=privat, Vorschläge+FreeScout=Firma; Grenze je Zeile sichtbar."),
        extra={"readOnly": True, "telegram": tg, "vorschlaege": vorschlaege, "freescout": fs,
               "workspaces": ["private", "company_signal"]})


# --- M3/sessions — 3 work-strands + mission.v2 job_projection (steer gated) --
# READ-ONLY projection: Jarvis strand from mission.v2, Codex/Claude strands from
# the Hermes agent-session broker :18087 (jarvis-ui actor, ONLY inventory). All
# mutating ops (steer/continue/interrupt/bind) are gated and structurally absent.
AGENT_BROKER_BASE = os.environ.get("MIKAELOS_AGENT_BROKER", "http://127.0.0.1:18087")
AGENT_TOKEN_PATH = Path(os.environ.get(
    "MIKAELOS_AGENT_TOKEN_PATH", "/run/user/1000/hermes-agent-sessions/jarvis-ui.token"))
AGENT_ACTOR = os.environ.get("MIKAELOS_AGENT_ACTOR", "jarvis-ui")
_BROKER_CWD_ROOTS = ["/srv/delta", "/srv/hermes", "/home/ubuntu/Dev"]


def _agent_session_token() -> str:
    """Broker Bearer token: env first, else the 0600 jarvis-ui token file (read at
    call time, same pattern as _whoop_token). Never logged. Empty => strand stays
    an honest partial/unavailable."""
    tok = (os.environ.get("MIKAELOS_AGENT_TOKEN") or "").strip()
    if tok:
        return tok
    try:
        return AGENT_TOKEN_PATH.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


def _broker_get(path: str, token: str) -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}",
               "X-Hermes-Actor": AGENT_ACTOR}
    try:
        req = Request(f"{AGENT_BROKER_BASE}{path}", headers=headers, method="GET")
        with urlopen(req, timeout=HTTP_TIMEOUT) as resp:  # noqa: S310 - fixed loopback base
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read().decode("utf-8"))
        except Exception:  # noqa: BLE001
            return exc.code, None
    except (URLError, OSError, ValueError, TimeoutError):
        return None, None


def _session_row(s: Dict[str, Any]) -> Dict[str, Any]:
    started_ms = s.get("started_at")
    started_iso = None
    if isinstance(started_ms, (int, float)):
        dt = _epoch_dt(started_ms / 1000.0)
        started_iso = _iso(dt)
    status = str(s.get("status") or "unknown")
    return {
        "icon": "terminal", "accent": ("emerald" if status == "running" else "cyan"),
        "sessionId": s.get("session_id"),
        "name": str(s.get("name") or "—")[:80],
        "cwd": s.get("cwd"),
        "status": status,
        "turnId": s.get("turn_id"),
        "controlMode": s.get("control_mode"),
        "startedAt": started_iso,
        "startedMs": started_ms if isinstance(started_ms, (int, float)) else None,
        # Mutating controls are gated and never performed here:
        "steerAvailable": False,
        "readOnly": True,
    }


def _broker_strand(backend: str, token: str) -> Dict[str, Any]:
    """Live agent sessions for one backend, merged over the allowed cwd roots.
    inventory carries NO mission-binding/authority field, so this strand never
    claims 'authority_attested' — that is honestly unavailable at this scope."""
    if not token:
        return {"state": "partial", "sessions": [],
                "note": "Broker-Token (jarvis-ui) nicht lesbar — Sessions nicht abrufbar."}
    seen: Dict[str, Dict[str, Any]] = {}
    reachable = False
    for root in _BROKER_CWD_ROOTS:
        code, data = _broker_get(
            f"/v1/agent-sessions/inventory?backend={backend}&cwd={quote(root)}&limit=50", token)
        if code is None:
            continue
        reachable = True
        if code != 200 or not isinstance(data, dict):
            continue
        for s in (data.get("sessions") or []):
            if isinstance(s, dict) and s.get("session_id"):
                seen[str(s["session_id"])] = s
    if not reachable:
        return {"state": "unavailable", "sessions": [],
                "note": "Session-Broker :18087 nicht erreichbar."}
    sessions = [_session_row(s) for s in seen.values()]
    sessions.sort(key=lambda r: r.get("startedMs") or 0, reverse=True)
    return {"state": ("fresh" if sessions else "empty"), "sessions": sessions,
            "note": ("Bindung/Autorität (attested) ist auf Inventory-Ebene nicht enthalten "
                     "— hier bewusst nicht behauptet." if sessions else
                     "Keine aktiven Sessions für diesen Strang.")}


def agent_sessions_overview() -> Dict[str, Any]:
    """READ-ONLY 3-strand session overview + mission.v2 job list.
      Jarvis  = mission.v2 (engineering workspace) — the honest Jarvis strand.
      Codex   = broker inventory (backend=codex).
      Claude  = broker inventory (backend=claude).
    Steuern/Continue/Steer/Bind bleiben gated (propose-only) und sind hier nicht
    ausführbar. Per-strand honest empty/partial/unavailable; a dead broker never
    breaks the bundle."""
    missions = _read_missions()
    eng = [m for m in missions if str(m.get("workspace_type") or "") == "engineering"]
    eng_sorted = sorted(eng, key=lambda m: str(m.get("updated_at") or ""), reverse=True)
    _JAR_META = {"id": "jarvis", "title": "Jarvis (Frontdoor)", "icon": "sparkles",
                 "workspace": "engineering", "permission": "Nur lesen",
                 "source": "mission.v2 · /srv/hermes/missions", "sourceKind": "file",
                 "readOnly": True}
    if eng_sorted:
        observed = max((_parse_iso(m.get("updated_at")) for m in eng),
                       default=None,
                       key=lambda d: d or datetime.min.replace(tzinfo=timezone.utc))
        cur = eng_sorted[0]
        jarvis = {**_JAR_META,
                  "state": _freshness_state(observed, STALE["engineering"]),
                  "observedAt": _iso(observed), "staleAfterSeconds": STALE["engineering"],
                  "currentMission": {
                      "goal": str(cur.get("goal") or cur.get("expected_result") or "Mission")[:120],
                      "state": cur.get("state"), "updatedAt": cur.get("updated_at")},
                  "rows": [{k: v for k, v in _mission_row(m).items() if k != "updatedAt"}
                           for m in eng_sorted[:6]]}
    else:
        jarvis = {**_JAR_META, "state": "empty", "observedAt": _iso(_now()),
                  "staleAfterSeconds": STALE["engineering"], "currentMission": None,
                  "rows": [], "note": "Keine Engineering-Missionen (mission.v2)."}

    token = _agent_session_token()
    now = _now()
    _CODEX_META = {"id": "codex", "title": "Codex (Bauer)", "icon": "terminal",
                   "workspace": "engineering",
                   "permission": "Nur lesen (steuern gated)",
                   "source": "session-broker :18087 (jarvis-ui, inventory)",
                   "sourceKind": "http", "observedAt": _iso(now),
                   "staleAfterSeconds": STALE["sessions"], "readOnly": True}
    _CLAUDE_META = {**_CODEX_META, "id": "claude",
                    "title": "Claude (Steuerung/Review)", "icon": "bot"}
    codex = {**_CODEX_META, **_broker_strand("codex", token)}
    claude = {**_CLAUDE_META, **_broker_strand("claude", token)}

    missions_rows = [{k: v for k, v in _mission_row(m).items() if k != "updatedAt"}
                     for m in eng_sorted]
    return {
        "workspace": "engineering", "readOnly": True,
        "strands": [jarvis, codex, claude],
        "missions": missions_rows,
        "observedAt": _iso(now),
        "controls": {"steer": "gated", "continue": "gated", "bind": "gated",
                     "note": "Nur über den propose-Weg (/actions, dry-run default) — "
                             "hier nicht ausführbar."},
        "note": ("Read-only Projektion: mission.v2 (Job-Wahrheit) + Session-Broker :18087 "
                 "(jarvis-ui, nur inventory). Steuern/Continue/Steer/Bind bleiben gated und "
                 "sind hier nicht verfügbar."),
    }


# --- Approval detail — full raw field projection (read-only, no decide) -----
# Extends the schema-poor list (/cockpit/approvals) with EVERY raw field of one
# card: intent/idempotency/payload/preconditions hashes, expected_effect,
# affected_objects, risks, evidence, proposed_execution, mandant, expires_at. A
# field absent in the raw JSON is emitted explicitly null/[], never omitted, so
# the UI shows an honest "nicht verfügbar" instead of a blank. The category is a
# heuristic derived from gate_class+gate_reason+text and is flagged inferred.
_FIRMA_CATEGORY_RULES = [
    ("geld", "euro", ["book_invoice", "invoice", "rechnung", "sevdesk", "zahlung",
                      "mahnung", "buchung", "geld", "betrag"]),
    ("kunde", "user-round", ["kunde", "kunden", "mail", "versand", "angebot", "customer"]),
    ("personal", "users", ["personal", "gehalt", "lohn", "mitarbeiter", "hr"]),
    ("restart", "power", ["restart", "neustart", "reboot", "deploy", "prod-restart"]),
    ("daten", "database", ["destructive_data", "delete", "löschen", "loeschen",
                           "schema", "migration", "drop"]),
    ("gerät", "cpu", ["device", "uptime", "command", "exec", "host"]),
]


def _firma_category(gate_class: str, gate_reason: str, text: str) -> Dict[str, Any]:
    hay = f"{gate_class} {gate_reason} {text}".lower()
    for label, icon, terms in _FIRMA_CATEGORY_RULES:
        if any(t in hay for t in terms):
            return {"label": label, "icon": icon, "inferred": True}
    return {"label": "sonstiges", "icon": "shield-question", "inferred": True}


def firma_approval_detail(card_id: str) -> Dict[str, Any]:
    """Full read-only detail of ONE approval card. Never decides; the plugin has
    no /approvals/decide path. Emits every raw field (null/[] when absent)."""
    cid = (card_id or "").strip()
    if not cid or "/" in cid or ".." in cid:
        return {"ok": False, "found": False, "error": "invalid_id",
                "note": "Keine gültige Card-ID.",
                "_prov": {"workspace": "company_signal", "readOnly": True,
                          "permission": _FIRMA_PERM, "source": "/srv/hermes/approvals",
                          "observedAt": _iso(_now())}}
    path = APPROVALS_DIR / f"{cid}.json"
    try:
        card = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"ok": True, "found": False, "id": cid,
                "note": "Approval-Card nicht gefunden oder nicht lesbar.",
                "_prov": {"workspace": "company_signal", "readOnly": True,
                          "permission": _FIRMA_PERM, "source": "/srv/hermes/approvals",
                          "sourceKind": "file", "observedAt": _iso(_now())}}
    status = str(card.get("status") or "").lower() or "pending"
    gate_class = str(card.get("gate_class") or "")
    gate_reason = str(card.get("gate_reason") or "")
    text = str(card.get("text") or card.get("action") or "")
    proposed = card.get("proposed_execution") if isinstance(card.get("proposed_execution"), dict) else None
    # Generic structured fields: prefer proposed_execution, else route summary.
    structured: Optional[Dict[str, Any]] = None
    if proposed:
        structured = {k: proposed.get(k) for k in
                      ("command", "device", "target", "execution_path_policy") if k in proposed}
    elif isinstance(card.get("route"), dict):
        r = card["route"]
        structured = {k: r.get(k) for k in ("agent", "domain", "tool", "sensitivity") if r.get(k)} or None

    def _lst(key: str) -> List[Any]:
        v = card.get(key)
        return v if isinstance(v, list) else []

    return {
        "ok": True,
        "found": True,
        "id": card.get("id") or cid,
        "status": status,
        "lifecycle": _CARD_STATUS_LIFECYCLE.get(status, "waiting_approval"),
        "gateClass": card.get("gate_class"),
        "gateReason": card.get("gate_reason"),
        "category": _firma_category(gate_class, gate_reason, text),  # heuristic, inferred=True
        "text": text or None,
        "action": card.get("action"),
        "source": card.get("source"),
        "createdUtc": card.get("created_utc"),
        "expiresAt": card.get("expires_at"),
        "mandant": card.get("mandant"),
        "targetSystem": card.get("target_system"),
        # decidedBy/decidedUtc = WHO decided (present only AFTER a decision) — this
        # is NOT the authorization field; the authority is always the Operator.
        "decidedBy": card.get("decided_by"),
        "decidedUtc": card.get("decided_utc"),
        # Proof hashes — the audit of exactly which intent/payload is gated.
        "intentSha256": card.get("intent_sha256"),
        "idempotencyKey": card.get("idempotency_key"),
        "payloadSha256": card.get("payload_sha256"),
        "preconditionsSha256": card.get("preconditions_sha256"),
        # Rich (new-schema) fields — explicit null/[] when the card is old-schema.
        "expectedEffect": card.get("expected_effect"),
        "affectedObjects": _lst("affected_objects"),
        "risks": _lst("risks"),
        "evidence": _lst("evidence"),
        "structuredFields": structured,   # null when the card carries no fields
        "proposedExecution": proposed,
        # The decision path is a STATIC honest hint — the plugin never links or
        # calls a decide endpoint; the Operator decides (Telegram Operator-Bot).
        "decisionAuthority": "operator",
        "decisionPath": "operator_telegram_bot",
        "decisionNote": ("Entscheidung (genehmigen/ablehnen) nur durch dich (Operator) "
                         "über das Approval-Center / den Operator-Bot. Dieses Plugin "
                         "liest nur — es ruft nie /approvals/decide."),
        "_prov": {
            "state": _freshness_state(_parse_iso(card.get("created_utc")), STALE["company"]),
            "source": "/srv/hermes/approvals", "sourceKind": "file",
            "workspace": "company_signal", "permission": "Nur lesen (entscheidet nie)",
            "readOnly": True, "observedAt": _iso(_now()),
            "staleAfterSeconds": STALE["company"],
        },
    }


# ===========================================================================
# M4 — three additive READ-ONLY area projections: ziele · reflexion ·
# gesundheit. Each carries a _prov envelope, an honest workspace, and degrades
# to empty/partial/unavailable — never a fabricated value. No writes anywhere.
# No new store/DB is introduced:
#   * ziele      = views over mission.v2 + task_priority_policy.yaml (no task DB).
#                  Goal-hierarchy (year/quarter/week) and habits have NO source
#                  in the stack -> honest empty (never illustrative numbers). The
#                  'systems' board groups real missions by STATUS bucket, NOT by
#                  an invented priority quadrant (that ranking is control-plane-
#                  internal, not exposed as a read endpoint).
#   * reflexion  = journal read-only IF a store exists; today none does, so it is
#                  honestly empty/connect. mission.v2/approvals are NEVER used as
#                  a substitute — those are engineering/company_signal, not privat.
#   * gesundheit = the full WHOOP :18090 area (recovery card + 7-day trend), plus
#                  Training/Ernährung as honest unavailable (no connector), never
#                  faked. Honest partial when the internal token is absent.
# ===========================================================================

# Optional private journal store — none exists in the stack today. Env-overridable
# so a future real store can be pointed at without a code change; until then the
# reflexion area is honestly empty (never faked, never substituted by
# mission.v2/approvals). The plugin would only ever READ this (no write/schema).
JOURNAL_DIR = Path(os.environ.get("MIKAELOS_JOURNAL_DIR", "/srv/delta/data/journal"))

# STALE windows for the M4 areas.
STALE["ziele"] = 3600          # mission activity is near-live
STALE["reflexion"] = 24 * 3600  # journal is sparse/human-driven
STALE["gesundheit"] = 6 * 3600  # WHOOP recovery is a morning reading

# Mission STATUS bucket -> German lane label for the 'systems' board. These are
# STATUS buckets (from _MISSION_STATUS), deliberately NOT priority quadrants.
_ZIELE_BUCKETS = [
    ("running", "Läuft"),
    ("waiting", "Wartet · Review · Freigabe"),
    ("error", "Blockiert"),
    ("verified", "Fertig"),
]


def goals_overview() -> Dict[str, Any]:
    """READ-ONLY 'Ziele & Systeme'.

    Real today: mission.v2 jobs grouped by STATUS bucket + the task-priority
    policy provenance (version, sha, WIP-limit, display lanes). Honestly empty:
    goal-hierarchy and habits (no source exists). No new task/todo DB is created.
    """
    missions = _read_missions()
    policy = read_task_policy()

    # --- policy provenance (real, from read_task_policy) --------------------
    policy_block: Dict[str, Any] = (
        {
            "ok": True,
            "version": policy.get("version"),
            "policySha256": policy.get("policy_sha256"),
            "wipLimitNow": policy.get("wip_limit_now"),
            "displayLanes": policy.get("display_lanes"),
        }
        if policy.get("ok")
        else {"ok": False}
    )

    # --- goal hierarchy: NO source (mission.v2 has no year/quarter/week) -----
    goal_hierarchy = _prov(
        state="empty", source="konzept", source_kind="konzept",
        workspace="private", permission="—",
        summary="Keine Ziel-Hierarchie-Quelle",
        note=("mission.v2 kennt keine Jahres-/Quartals-/Wochenziel-Felder, und es "
              "gibt keine andere Ziel-Hierarchie-Quelle im Stack. Kein Prozentwert "
              "wird erfunden — ehrlicher Leerzustand."),
    )

    # --- habits: NO source (no habit/streak tracker exists) -----------------
    habits = _prov(
        state="empty", source="konzept", source_kind="konzept",
        workspace="private", permission="—",
        summary="Keine Habit-Quelle",
        note=("Kein Habit-/Gewohnheits-/Streak-Tracker im Stack vorhanden. "
              "Keine erfundenen Streaks."),
    )

    # --- systems: real missions grouped by STATUS bucket (not priority) -----
    if not missions:
        systems = _prov(
            state="empty", source="mission.v2 · /srv/hermes/missions", source_kind="file",
            workspace="private", permission="Nur lesen",
            summary="Keine offenen Missionen", stale_after=STALE["ziele"],
            note="Derzeit keine mission.v2-Missionen als Systeme/laufende Jobs.",
            extra={"lanes": [], "counts": {b: 0 for b, _ in _ZIELE_BUCKETS}},
        )
    else:
        by_bucket: Dict[str, List[Dict[str, Any]]] = {b: [] for b, _ in _ZIELE_BUCKETS}
        for proj in missions:
            row = _mission_row(proj)
            bucket = str(row.get("status") or "waiting")
            by_bucket.setdefault(bucket, []).append(row)
        for rows in by_bucket.values():
            rows.sort(key=lambda r: str(r.get("updatedAt") or ""), reverse=True)
        observed = max(
            (_parse_iso(m.get("updated_at")) for m in missions), default=None,
            key=lambda d: d or datetime.min.replace(tzinfo=timezone.utc),
        )
        wip = policy.get("wip_limit_now") if policy.get("ok") else None
        lanes = []
        for bucket, label in _ZIELE_BUCKETS:
            rows = by_bucket.get(bucket, [])
            lanes.append({
                "id": bucket,
                "label": label,
                "count": len(rows),
                "wipLimit": wip if bucket == "running" else None,
                "rows": [{k: v for k, v in r.items() if k != "updatedAt"} for r in rows[:8]],
            })
        n_run = len(by_bucket.get("running", []))
        systems = _prov(
            state=_freshness_state(observed, STALE["ziele"]),
            source="mission.v2 (job_projection) · /srv/hermes/missions", source_kind="file",
            workspace="private", permission="Nur lesen (Writes via Gates)",
            summary=f"{len(missions)} Systeme · {n_run} laufen",
            observed_at=observed, stale_after=STALE["ziele"],
            rows=[],
            note=("Spalten sind STATUS-Buckets (Läuft/Wartet/Blockiert/Fertig), NICHT "
                  "Prioritäts-Quadranten — die feinkörnige Reihung (task_priority_preview) "
                  "ist control-plane-eigen und nicht als Read-Endpunkt exponiert."),
            extra={"lanes": lanes, "counts": {b: len(by_bucket.get(b, [])) for b, _ in _ZIELE_BUCKETS}},
        )

    return {
        "workspace": "private",
        "permission": "Nur lesen",
        "observedAt": _iso(_now()),
        "policy": policy_block,
        "goalHierarchy": goal_hierarchy,
        "habits": habits,
        "systems": systems,
        "note": ("Ziele & Systeme = reine read-only Projektion auf mission.v2 + "
                 "task_priority_policy.yaml. Keine neue Task-/Todo-DB. Ziel-Hierarchie "
                 "und Habits haben keine Quelle → ehrlich leer."),
    }


def _reflexion_section(kind_label: str, note: str) -> Dict[str, Any]:
    """One honestly-empty reflexion panel (journal/decisions/insights).

    A store may be pointed at via MIKAELOS_JOURNAL_DIR; today none exists, so the
    state is empty (nothing captured / not connected) — never a substitute source.
    """
    connected = JOURNAL_DIR.exists()
    return _prov(
        state="empty",
        source=(f"Journal-Store {JOURNAL_DIR}" if connected else "konzept"),
        source_kind=("file" if connected else "konzept"),
        workspace="private", permission="Nur lesen",
        summary=f"{kind_label}: kein Eintrag" if connected else f"{kind_label}: keine Quelle angebunden",
        stale_after=STALE["reflexion"],
        rows=[],
        note=note,
        extra={"connected": connected, "store": str(JOURNAL_DIR)},
    )


def reflexion_overview() -> Dict[str, Any]:
    """READ-ONLY 'Reflexion' — journal / Entscheidungen / Lernerkenntnisse.

    No journal store exists in the stack today, so all three panels are honestly
    empty (or 'connect' once MIKAELOS_JOURNAL_DIR is set). mission.v2/approvals are
    NEVER surfaced here as a fake decision log — that would cross the private
    boundary into engineering/company_signal.
    """
    connected = JOURNAL_DIR.exists()
    substitution_note = ("Kein Ersatz aus mission.v2/Approvals — das wären "
                         "engineering/company_signal-Objekte, nicht privat.")
    return {
        "workspace": "private",
        "permission": "Nur lesen",
        "observedAt": _iso(_now()),
        "connected": connected,
        "sections": {
            "journal": _reflexion_section(
                "Journal",
                "Journal ist strikt privat und noch ohne Read-Store. Andockpunkt offen "
                "(Operator-Entscheidung). " + substitution_note),
            "decisions": _reflexion_section(
                "Entscheidungsprotokoll",
                "Kein Entscheidungs-Store (Entscheidung/Datum/Warum/Reversibel) angebunden. "
                + substitution_note),
            "insights": _reflexion_section(
                "Lernerkenntnisse",
                "Kein Erkenntnis-/Insight-Store angebunden. " + substitution_note),
        },
        "note": ("Reflexion = strikt privat, nur lesen, kein Compose/Versand. Kein "
                 "Journal-Store vorhanden → ehrlicher Leer-/Connect-Zustand statt "
                 "erfundener Einträge. Setze MIKAELOS_JOURNAL_DIR, um einen echten "
                 "read-only Store anzubinden."),
    }


def body_trend(days: int = 7) -> Dict[str, Any]:
    """READ-ONLY 7-day WHOOP recovery trend via /internal/data?kind=recovery.

    Honest partial when the internal token is absent (never a fabricated line),
    unavailable when the connector is down/disconnected, real day-series otherwise.
    Missing days stay gaps — no interpolated point is invented.
    """
    try:
        days = max(1, min(int(days or 7), 30))
    except (TypeError, ValueError):
        days = 7
    status_code, health = _http_get_json(f"{WHOOP_BASE}/healthz")
    if status_code is None or not isinstance(health, dict):
        return _prov(
            state="unavailable", source="WHOOP-Connector :18090", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="WHOOP-Connector nicht erreichbar", stale_after=STALE["gesundheit"],
            note="GET /healthz auf 127.0.0.1:18090 fehlgeschlagen.",
        )
    if not bool(health.get("connected")):
        return _prov(
            state="unavailable", source="WHOOP-Connector :18090", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="WHOOP nicht verbunden", stale_after=STALE["gesundheit"],
            note="Kein WHOOP-OAuth-Token hinterlegt (connected=false).",
        )
    token = _whoop_token()
    if not token:
        return _prov(
            state="partial", source="WHOOP-Connector :18090 (/healthz)", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="Verbunden · Trend nur mit internem Token",
            stale_after=STALE["gesundheit"],
            note=("7-Tage-Recovery-Trend über /internal/data?kind=recovery; der "
                  "Plugin-Kontext hält kein WHOOP_INTERNAL_TOKEN (gated Operator-Schritt, "
                  "docs/RUNBOOK-whoop-token.md). Keine erfundene Trendlinie."),
            extra={"series": [], "scopes": health.get("scopes")},
        )
    code, data = _http_get_json(
        f"{WHOOP_BASE}/internal/data?kind=recovery&days={days}&limit={days}", token=token)
    result = data.get("result") if isinstance(data, dict) else None
    inner = result.get("data") if isinstance(result, dict) else None
    records = inner.get("records") if isinstance(inner, dict) else None
    if code != 200 or not isinstance(records, list):
        return _prov(
            state="unavailable", source="WHOOP · /internal/data?kind=recovery", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="Trend-Endpunkt nicht lesbar", stale_after=STALE["gesundheit"],
            note="/internal/data lieferte keine lesbaren Recovery-Records.",
        )
    series: List[Dict[str, Any]] = []
    for rec in records:
        if not isinstance(rec, dict):
            continue
        score = rec.get("score") if isinstance(rec.get("score"), dict) else {}
        val = score.get("recovery_score")
        series.append({
            "date": rec.get("created_at") or rec.get("updated_at"),
            "recoveryScore": val if isinstance(val, (int, float)) and not isinstance(val, bool) else None,
        })
    series.sort(key=lambda r: str(r.get("date") or ""))
    observed = _parse_iso(records[0].get("created_at")) if records and isinstance(records[0], dict) else None
    if not series:
        return _prov(
            state="empty", source="WHOOP · /internal/data?kind=recovery", source_kind="http",
            workspace="private", permission="Nur lesen (privat)",
            summary="Keine Recovery-Tage im Fenster", stale_after=STALE["gesundheit"],
            note=f"Keine Recovery-Records in den letzten {days} Tagen.",
            extra={"series": [], "days": days},
        )
    return _prov(
        state=_freshness_state(observed, STALE["gesundheit"]),
        source="WHOOP · /internal/data?kind=recovery", source_kind="http",
        workspace="private", permission="Nur lesen (privat)",
        summary=f"{len(series)}-Tage-Recovery-Trend",
        observed_at=observed, stale_after=STALE["gesundheit"],
        rows=[],
        extra={"series": series, "days": days, "scopes": health.get("scopes")},
    )


def _gesundheit_unavailable(title: str, connector: str, icon: str) -> Dict[str, Any]:
    """An honestly-unavailable side card (Training/Ernährung): no connector exists,
    so no value is shown — never a faked number."""
    return _prov(
        state="unavailable", source="konzept", source_kind="konzept",
        workspace="private", permission="—",
        summary=f"{title}: kein Connector",
        stale_after=STALE["gesundheit"],
        rows=[],
        note=(f"{connector} ist nicht angebunden (keine Secrets, kein Connector). "
              f"WHOOP liefert dies nicht — keine erfundenen Werte."),
        extra={"icon": icon},
    )


def gesundheit_overview() -> Dict[str, Any]:
    """READ-ONLY 'Gesundheit' area — full WHOOP surface.

    body = recovery/sleep/HRV/RHR/strain (honest partial without token); trend =
    7-day recovery series; training/ernaehrung = honest unavailable (no connector).
    Reuses module_body() so the two WHOOP cards stay consistent. No writes.
    """
    return {
        "workspace": "private",
        "permission": "Nur lesen (privat)",
        "observedAt": _iso(_now()),
        "cards": {
            "body": module_body(),
            "trend": body_trend(days=7),
            "training": _gesundheit_unavailable(
                "Training", "TrainingPeaks (geplante nächste Einheit)", "dumbbell"),
            "nutrition": _gesundheit_unavailable(
                "Ernährung", "MyFitnessPal (Protein/Wasser/Koffein)", "utensils"),
        },
        "note": ("Gesundheit = privat, nur lesen. WHOOP-Connector :18090 ist die einzige "
                 "reale Quelle; ohne WHOOP_INTERNAL_TOKEN ehrlich partial. Training und "
                 "Ernährung sind mangels Connector ehrlich 'nicht verfügbar' — nie erfunden."),
    }


# ===========================================================================
# M5 — BETRIEB (24/7 · Anzeige / Mac-Steuerung / Drei-Frontdoor).
#
# Additive, READ-ONLY peer scene. Three honest blocks:
#   1. displayMode  — the runtime display mode (Kiosk/PWA-standalone/Browser-Tab)
#      is CLIENT-detected (matchMedia display-mode, navigator.standalone, onLine,
#      visibilityState); the backend cannot know it, so it says so and only ships
#      the PWA endpoint metadata + an honest note about the host-side limit.
#   2. macControl   — four TYPED, PROPOSE-ONLY Mac actions. The plugin NEVER opens
#      ssh/shell/exec and NEVER executes on the Mac. Each action builds a
#      deterministic typed intent (pure, no free-text shell) and — even on a live
#      click — only returns a dry-run preview + honest "Ausführung folgt/deferred"
#      (needs a Control-Plane capability + scoped proxy, Operator/gated). There is
#      NO code path here that reaches the device.
#   3. frontdoors   — the honest three-frontdoor shared context (Dashboard=reader,
#      Telegram=writer, Hermes-App=not observed in code) over the ONE shared job
#      truth (mission.v2) + Approval-Cards, with the real gaps named, not hidden.
# ===========================================================================

# The four typed Mac actions. `params` is deliberately empty/whitelisted — never
# free-text shell. Every one is PROPOSE-ONLY and its execution is DEFERRED: it
# needs a typed DEVICE_ACTIONS capability (delta-ops) + Operator-go before it can
# ever run through the gated scoped proxy. `greenCapability` names the existing
# typed delta-ops capability this action maps toward (honest: "capability exists,
# but this surface is not wired to fire it") — or None where none is typed yet.
_MAC_ACTIONS = [
    {
        "id": "focus_window", "action": "focus_window", "icon": "app-window",
        "label": "Fenster / App fokussieren",
        "target": "cockpit-browser",
        "reason": "Cockpit-Browserfenster in den Vordergrund holen",
        "greenCapability": "delta-ops:device_action · browser_focus",
        "detail": ("Zielt auf die bestehende grüne, typisierte Capability "
                   "browser_focus (osascript, kein Modelltext im Shell-String). "
                   "Diese Fläche ist NICHT verdrahtet, sie auszulösen."),
    },
    {
        "id": "open_surface", "action": "open_surface", "icon": "monitor",
        "label": "Definierte Fläche öffnen",
        "target": "cockpit:/abrechnung",
        "reason": "Cockpit-Abrechnungsfläche auf dem Mac öffnen",
        "greenCapability": None,
        "detail": ("Kein typisiertes Äquivalent + URL-Whitelist vorhanden — "
                   "braucht eine neue grüne DEVICE_ACTIONS-Zeile (delta-ops PR)."),
    },
    {
        "id": "arrange_widgets", "action": "arrange_widgets", "icon": "layout-grid",
        "label": "Widgets ordnen",
        "target": "layout:fokus",
        "reason": "Fenster-/Widget-Layout auf ein definiertes Preset bringen",
        "greenCapability": None,
        "detail": ("Kein Capability-Äquivalent — müsste als typisiertes Layout-"
                   "Preset neu definiert werden (kein Freitext-Layout-Kommando)."),
    },
    {
        "id": "show_file", "action": "show_file", "icon": "file-text",
        "label": "Datei / Ansicht zeigen",
        "target": "file:letzter-beleg",
        "reason": "Zuletzt verarbeiteten Beleg auf dem Mac anzeigen",
        "greenCapability": "delta-ops:device_file_read (nur Lesepfad, kein aktives Zeigen)",
        "detail": ("Lesen einer Datei existiert als Allowlist; ein aktiver Anzeige-/"
                   "UI-Akt auf dem Mac ist NICHT typisiert — deferred."),
    },
]
_MAC_ACTION_BY_ID = {a["id"]: a for a in _MAC_ACTIONS}
_MAC_PROPOSE_ROUTE = "/api/plugins/mikael-os/betrieb/mac/propose"


def _mac_intent(action_def: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic, pure (no I/O) typed device intent for one Mac action.

    Whitelisted shape only — `params` is empty; there is NO free-text/shell field.
    The idempotency key is a stable sha256 over device|action|target."""
    device = "mac"
    action = action_def["action"]
    target = action_def["target"]
    key = hashlib.sha256(f"{device}|{action}|{target}".encode("utf-8")).hexdigest()
    is_green = bool(action_def.get("greenCapability")
                    and "device_action" in str(action_def.get("greenCapability")))
    required_cap = "delta-ops:device_action" if is_green else "delta-ops:propose_device_exec"
    required_gate = "device_green" if is_green else "device_propose"
    return {
        "device": device,
        "action": action,
        "target": target,
        "params": {},                       # whitelisted / empty — NEVER free shell
        "reason": action_def.get("reason") or "",
        "requiredCapabilities": [required_cap],
        "requiredGate": required_gate,
        "idempotencyKey": key,
        "provenance": {
            "plugin": "mikael-os",
            "surface": "betrieb-mac",
            "proposeOnly": True,
            "createdUtc": _iso(_now()),
        },
    }


def _mac_predicted_gate(action_def: Dict[str, Any]) -> Dict[str, Any]:
    """The gate this typed device intent is EXPECTED to hit. Prediction only — the
    real decision is made server-side by the gated lane, never by this plugin.
    Every action is execution-DEFERRED here: no capability is wired to this
    surface, so the honest expected outcome is a pending Approval-Card."""
    green = action_def.get("greenCapability")
    return {
        "gateClass": "device_green" if (green and "device_action" in str(green)) else "device_propose",
        "expectedOutcome": "require_approval",
        "execution": "deferred",
        "human": ("Ausführung über Control-Plane-Capability folgt — diese Fläche "
                  "schlägt nur vor (typisiert), sie führt nichts aus."),
        "note": ("Das Plugin öffnet keine ssh/shell/exec. Echte Ausführung braucht "
                 "eine typisierte DEVICE_ACTIONS-Capability + scoped Proxy "
                 "(Operator/gated) — hier bewusst deferred."),
    }


def mac_action_propose(action_id: str, dry_run: bool = True) -> Dict[str, Any]:
    """PROPOSE-ONLY typed Mac action. Builds a dry-run preview of the typed device
    intent and returns it. It has NO execution path: the plugin never opens
    ssh/shell/exec, never posts a device action to the control-plane, and even a
    live click (dryRun=false) returns the SAME honest deferred preview — execution
    is a separate gated lane (scoped proxy) that this surface cannot reach."""
    action_def = _MAC_ACTION_BY_ID.get((action_id or "").strip())
    if not action_def:
        return {"ok": False, "status": "invalid",
                "note": "Unbekannte Mac-Aktion (nur typisierte, gewhitelistete Aktionen)."}
    intent = _mac_intent(action_def)
    gate = _mac_predicted_gate(action_def)
    # Honest reachability probe ONLY (read-only GET /healthz) so the card can say
    # whether the gated lane is up — this never sends the device action anywhere.
    cp = control_plane_status()
    plan = {
        "objective": action_def["label"],
        "device": "mac",
        "target": intent["target"],
        "workspaceLabel": "Mac-Steuerung (privat)",
        "capabilities": intent["requiredCapabilities"],
        "requiredGate": intent["requiredGate"],
        "gateHuman": gate["human"],
        "greenCapability": action_def.get("greenCapability"),
        "capabilityDetail": action_def.get("detail"),
    }
    return {
        "ok": True,
        "mode": "dry_run",                    # ALWAYS dry-run — no live device path
        "status": "vorschau",
        "willFire": False,
        "proposeOnly": True,
        "execution": "deferred",
        "requestedLive": bool(dry_run is False),  # honest: even if asked live -> deferred
        "intent": intent,
        "plan": plan,
        "predictedGate": gate,
        "controlPlane": cp,
        "note": ("Nur Vorschau — es wurde NICHTS ausgeführt und NICHTS an ein Gerät "
                 "gesendet. Mac-Steuerung ist ausschließlich typisiert + propose-only; "
                 "die Ausführung folgt über eine Control-Plane-Capability + scoped Proxy "
                 "(Operator/gated). Kein Shell-Autopilot."),
    }


def _read_approval_cards() -> Tuple[List[Dict[str, Any]], bool]:
    """Read Approval-Cards raw (id/status/text/source/route/task_id/gate). Returns
    (cards, dir_present). Read-only; never decides."""
    if not APPROVALS_DIR.exists():
        return [], False
    out: List[Dict[str, Any]] = []
    for path in sorted(glob.glob(str(APPROVALS_DIR / "appr_*.json"))):
        try:
            c = json.loads(Path(path).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        out.append(c)
    return out, True


def betrieb_overview() -> Dict[str, Any]:
    """READ-ONLY 'Betrieb' bundle: display-mode metadata (client-detected), the
    four typed propose-only Mac actions, and the honest three-frontdoor shared
    context over mission.v2 + Approval-Cards. No writes, no device access."""
    now = _now()

    # --- (1) Display-Mode: honestly client-detected -------------------------
    display_mode = {
        "detected": None,                 # backend cannot know — the client fills this
        "detectionSide": "client",
        "modes": [
            {"id": "standalone", "label": "Installiert / Kiosk",
             "hint": "display-mode: standalone (Dock-App / Kiosk-Fenster)"},
            {"id": "fullscreen", "label": "Vollbild-Kiosk",
             "hint": "display-mode: fullscreen"},
            {"id": "browser", "label": "Browser-Tab",
             "hint": "normaler Tab (kein installiertes Fenster)"},
        ],
        "pwa": {
            "manifest": "/api/plugins/mikael-os/pwa/manifest.webmanifest",
            "serviceWorker": "/api/plugins/mikael-os/pwa/sw.js",
            "offlineShell": "/api/plugins/mikael-os/pwa/offline.html",
            "swScope": "/",
            "installableFromPlugin": False,
            "note": ("Das Plugin liefert Manifest + minimalen Service-Worker/Offline-"
                     "Shell und hängt den Manifest-Link zur Laufzeit selbst in den "
                     "<head> (soweit im Plugin machbar). Ein vollständig installierbares "
                     "PWA/echter Kiosk-Offline-Betrieb braucht zusätzlich einen "
                     "Host-<link rel=manifest> + root-scoped Service-Worker in "
                     "nous-hermes-agent (index.html) — außerhalb des Plugins, im Runbook "
                     "dokumentiert."),
        },
        "note": ("Anzeigemodus wird clientseitig erkannt (matchMedia display-mode, "
                 "navigator.standalone, onLine, visibilityState) — der Server kennt ihn "
                 "nicht und rät ihn nicht."),
        "_prov": {"state": "partial", "workspace": "private", "readOnly": True,
                  "source": "client-detection + Plugin-PWA-Endpunkte",
                  "sourceKind": "konzept", "observedAt": _iso(now)},
    }

    # --- (2) Reconnect: read-model reachability probe -----------------------
    cp = control_plane_status()
    whoop_code, _wh = _http_get_json(f"{WHOOP_BASE}/healthz")
    sources = [
        {"id": "controlPlane", "label": "Control-Plane :18083", "reachable": bool(cp.get("reachable"))},
        {"id": "whoop", "label": "WHOOP-Connector :18090", "reachable": whoop_code == 200},
        {"id": "missions", "label": "mission.v2 · /srv/hermes/missions", "reachable": MISSIONS_DIR.exists()},
        {"id": "approvals", "label": "Approval-Cards · /srv/hermes/approvals", "reachable": APPROVALS_DIR.exists()},
    ]
    reconnect = {
        "strategy": ["online", "focus", "visibilitychange"],
        "sources": sources,
        "reachableCount": sum(1 for s in sources if s["reachable"]),
        "total": len(sources),
        "note": ("Bei Reconnect (online/focus/visibilitychange) liest die Fläche alle "
                 "Read-Modelle sofort neu; der Zustand erscheint ohne manuelles Neuladen. "
                 "visibilitychange deckt den Kiosk-Fall ab (Fenster verliert nie den Fokus)."),
        "_prov": {"state": "fresh", "workspace": "private", "readOnly": True,
                  "source": "Reachability-Probe (read-only)", "sourceKind": "http",
                  "observedAt": _iso(now)},
    }

    # --- (3) Mac-Steuerung: four typed propose-only actions -----------------
    mac_actions_out = []
    for a in _MAC_ACTIONS:
        intent = _mac_intent(a)
        gate = _mac_predicted_gate(a)
        mac_actions_out.append({
            "id": a["id"], "action": a["action"], "target": a["target"],
            "label": a["label"], "icon": a["icon"], "reason": a["reason"],
            "requiredCapabilities": intent["requiredCapabilities"],
            "requiredGate": intent["requiredGate"],
            "idempotencyKey": intent["idempotencyKey"],
            "greenCapability": a.get("greenCapability"),
            "capabilityDetail": a.get("detail"),
            "execution": "deferred",
            "predictedGate": gate,
        })
    mac_control = {
        "proposeRoute": _MAC_PROPOSE_ROUTE,
        "proposeOnly": True,
        "actions": mac_actions_out,
        "controlPlane": cp,
        "safety": ("Das Plugin führt NIE selbst etwas auf dem Mac aus, ruft KEIN "
                   "Shell/exec, öffnet KEINE ssh-/Geräte-Verbindung. Jede Aktion ist "
                   "eine typisierte Vorschlagskarte (dry-run). Ausführung folgt über "
                   "Control-Plane-Capability + scoped Proxy (Operator/gated)."),
        "_prov": {"state": "fresh", "workspace": "private", "readOnly": True,
                  "source": "typisierte Mac-Aktionen (propose-only)",
                  "sourceKind": "konzept", "observedAt": _iso(now)},
    }

    # --- (4) Drei-Frontdoor: honest shared context --------------------------
    missions = _read_missions()
    cards, appr_present = _read_approval_cards()
    pending = [c for c in cards if str(c.get("status") or "").lower() in ("pending", "")]
    # channel_correlations per mission (if the projection carries it — else empty).
    correlated = 0
    mission_sample: List[Dict[str, Any]] = []
    for proj in missions:
        cc = proj.get("channel_correlations")
        cc_list = cc if isinstance(cc, list) else []
        if cc_list:
            correlated += 1
        if len(mission_sample) < 6:
            mission_sample.append({
                "goal": str(proj.get("goal") or proj.get("expected_result") or "Mission")[:80],
                "state": proj.get("state"),
                "owner": proj.get("owner_agent") or proj.get("assigned_agent"),
                "channelCorrelations": cc_list,
                "approvalRef": proj.get("approval_ref"),
            })
    # honest linkage gap: approval_ref set on a mission but no matching card id.
    card_ids = {str(c.get("id")) for c in cards if c.get("id")}
    unlinked_refs = 0
    for proj in missions:
        ref = proj.get("approval_ref")
        if ref and str(ref) not in card_ids:
            unlinked_refs += 1
    channels = [
        {"id": "dashboard", "label": "Dashboard (MIKAEL OS)", "role": "reader", "icon": "monitor",
         "observed": True,
         "detail": ("Liest mission.v2 + Approval-Cards read-only (dashboard/plugin_api.py). "
                    "Schreibt keine Job-Wahrheit.")},
        {"id": "telegram", "label": "Telegram (Operator-Bot / Jarvis)", "role": "writer", "icon": "send",
         "observed": True,
         "detail": ("Echter Writer: bot/executor/jarvis_frontdoor.py ruft "
                    "MissionStore.create()/transition()/bind_task()/correlate_channel() — "
                    "legt/bindet dieselbe Mission.")},
        {"id": "hermes_app", "label": "Hermes-App", "role": "unknown", "icon": "help-circle",
         "observed": False,
         "detail": ("Im gelesenen Code nicht als eigener Consumer/Writer beobachtet — "
                    "hier ehrlich als 'nicht beobachtet' ausgewiesen, nicht als "
                    "symmetrisch angebunden behauptet.")},
    ]
    gaps = [
        {"id": "approval_mission_link",
         "text": ("Approval-Cards tragen kein mission_id (nur task_id) — "
                  "job_projection.approval_ref wird nicht gegen die Card gematcht."),
         "count": unlinked_refs},
        {"id": "channel_correlations_hidden",
         "text": ("channel_correlations wird von mission.v2 geführt, ist aber sonst "
                  "nirgends exponiert — hier erstmals sichtbar gemacht."),
         "count": correlated},
        {"id": "hermes_app_unobserved",
         "text": "Hermes-App taucht im Code als eigener Akteur nicht auf.",
         "count": None},
    ]
    frontdoors = {
        "channels": channels,
        "shared": {
            "missions": len(missions),
            "approvalsPending": len(pending),
            "approvalsTotal": len(cards),
            "missionsWithCorrelation": correlated,
            "note": ("Eine Mission ist eine Mission — die Job-Wahrheit (mission.v2) ist "
                     "über Dashboard (Leser) und Telegram (Schreiber) faktisch geteilt, "
                     "keine zweite Wahrheit."),
        },
        "gaps": gaps,
        "missionsSample": mission_sample,
        "meta": {"dashboard": "reader", "telegram": "writer (jarvis_frontdoor.py)",
                 "hermes_app": "unknown/not observed in code"},
        "_prov": {
            "state": ("fresh" if (missions or appr_present) else "empty"),
            "workspace": "engineering", "readOnly": True,
            "source": "mission.v2 · /srv/hermes/missions + /srv/hermes/approvals",
            "sourceKind": "file", "observedAt": _iso(now)},
    }

    return {
        "workspace": "private",
        "permission": "Nur lesen · Mac-Steuerung propose-only",
        "observedAt": _iso(now),
        "displayMode": display_mode,
        "reconnect": reconnect,
        "macControl": mac_control,
        "frontdoors": frontdoors,
        "note": ("Betrieb = 24/7-Fläche: Anzeigemodus (clientseitig erkannt), typisierte "
                 "propose-only Mac-Steuerung (kein Shell/keine Ausführung) und der ehrlich "
                 "geteilte Drei-Frontdoor-Kontext (Dashboard=Leser, Telegram=Schreiber, "
                 "Hermes-App=nicht beobachtet). Nur lesen; Ausführung bleibt gated."),
    }


# --- PWA static payloads (served by the plugin; installable/offline as far as a
# --- plugin can go — the honest limit is documented in the runbook). ---------
_PWA_MANIFEST = {
    "id": "/mikael-os",
    "name": "MIKAEL OS",
    "short_name": "MIKAEL OS",
    "description": "Mikaels persönliches 24/7-Command-Center (read-only Projektionen).",
    "start_url": "/mikael-os",
    "scope": "/",
    "display": "standalone",
    "orientation": "any",
    "background_color": "#0b1020",
    "theme_color": "#0b1020",
    "icons": [
        {"src": "/api/plugins/mikael-os/pwa/icon.svg", "sizes": "any",
         "type": "image/svg+xml", "purpose": "any maskable"},
    ],
}

_PWA_SW_JS = """/* MIKAEL OS — minimal offline shell service worker (plugin-served).
 * Read-only app-shell caching so a returning Kiosk/Dock window shows the shell
 * immediately after reconnect. It caches ONLY GET responses and never touches
 * any write/propose route. Honest scope: the plugin ships this as far as a
 * plugin can; a fully installable PWA still needs the host <link rel=manifest>. */
const CACHE = "mikael-os-shell-v1";
const OFFLINE = "/api/plugins/mikael-os/pwa/offline.html";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // never cache/replay writes or propose POSTs
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && (req.url.indexOf("/mikael-os") !== -1 || req.destination === "script" || req.destination === "style")) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match(OFFLINE) : Response.error()))
    )
  );
});
"""

_PWA_OFFLINE_HTML = """<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MIKAEL OS — offline</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:#0b1020; color:#e8ecff; font:16px/1.5 system-ui,-apple-system,sans-serif; }
  .card { max-width:30rem; padding:2rem; text-align:center; }
  h1 { font-size:1.3rem; margin:0 0 .5rem; }
  p { opacity:.8; margin:.4rem 0; }
  .dot { width:.6rem;height:.6rem;border-radius:50%;background:#f5a623;display:inline-block;margin-right:.4rem; }
  @media (prefers-reduced-motion: no-preference) { .dot { animation: pulse 2s ease-in-out infinite; } }
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
</style></head>
<body><div class="card">
  <h1><span class="dot"></span>Offline</h1>
  <p>MIKAEL OS ist gerade nicht erreichbar.</p>
  <p>Sobald die Verbindung zurück ist, lädt der aktuelle Zustand automatisch neu — es wird nichts Erfundenes angezeigt.</p>
</div></body></html>
"""

_PWA_ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#0b1020"/>
<circle cx="256" cy="256" r="150" fill="none" stroke="#5b8cff" stroke-width="20" opacity="0.35"/>
<circle cx="256" cy="256" r="88" fill="#5b8cff"/>
<circle cx="256" cy="256" r="40" fill="#0b1020"/>
</svg>
"""


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


@router.get("/cockpit/kpi")
def cockpit_kpi_route() -> Dict[str, Any]:
    """READ-ONLY glanceable KPI strip: Recovery · nächste Klausur · offene
    Freigaben · laufende Jobs. Each carries a _prov envelope; a missing reading
    is an honest „—" (value=null), never a fabricated number. No writes."""
    return cockpit_kpi()


@router.get("/cockpit/jarvis-state")
def cockpit_jarvis_state_route() -> Dict[str, Any]:
    """READ-ONLY Jarvis-Live: state summary + proactive hints derived ONLY from
    real provider states, plus an honest chat-connectivity flag (real Brain-
    Gateway reachability). No synthesized reply, no invented hint. Action-shaped
    hints are propose-only (dry-run default); nothing is executed here."""
    return cockpit_jarvis_state()


@router.get("/cockpit/approvals")
def cockpit_approvals_route(includeDecided: bool = False) -> Dict[str, Any]:
    """READ-ONLY Approval-Center: offene Approval-Cards inkl. Intent-Hash
    (intent_sha256) + idempotency_key. Liest nur — nie /approvals/decide."""
    return cockpit_approvals(include_decided=bool(includeDecided))


@router.get("/firma/overview")
def firma_overview_route() -> Dict[str, Any]:
    """READ-ONLY company-signal bundle: six FIRMA/Rise-L cards (Aufträge · Billing
    · Dispo · Wartung · Dokumente · Runtime). Each carries a _prov envelope,
    workspace=company_signal, an "im FSM öffnen" deep-link (navigation only) and
    degrades to honest empty/unavailable. fsm.db/belege.db are read mode=ro only;
    every write goes through Cockpit :18065. No decide, no controls."""
    return firma_overview()


@router.get("/firma/approvals/detail")
def firma_approval_detail_route(id: str = "") -> Dict[str, Any]:
    """READ-ONLY full detail of ONE approval card (intent/payload/preconditions
    hashes, expected_effect, affected_objects, risks, evidence, inferred category,
    status). Emits absent fields as explicit null/[]. Never calls /approvals/decide
    — the decision is Operator-only; this only shows the gated path."""
    return firma_approval_detail(card_id=id)


@router.get("/wissen/search")
def wissen_search_route(q: str = "", src: str = "") -> Dict[str, Any]:
    """READ-ONLY föderierte Suche über unified-search :18055. Jeder Treffer trägt
    Herkunft (quelle) + Workspace-Grenze (workspace: engineering|company_signal|
    gemischt) aus einer fixen, quell-verifizierten Map — nie aus dem Inhalt geraten.
    'history' ist ehrlich 'gemischt' (privat+Firma nicht trennbar). Ehrlich
    partial (leere Query) / unavailable (Dienst weg) / empty (0 Treffer)."""
    return wissen_search(q=q, src=src)


@router.get("/kommunikation/overview")
def kommunikation_overview_route() -> Dict[str, Any]:
    """READ-ONLY Kommunikations-Signale: Telegram (privat) · Vorschläge/Approvals
    (Firma) · FreeScout-Tickets (Firma). NUR lesen — kein Compose/Versand (G7-
    gated, hier strukturell nicht vorhanden). Workspace-Grenze je Zeile sichtbar,
    Zähler nie geblendet. Ehrlich empty/partial/unavailable je Kanal."""
    return module_kommunikation()


@router.get("/agent-sessions/overview")
def agent_sessions_overview_route() -> Dict[str, Any]:
    """READ-ONLY 3 Arbeitsstränge (Jarvis=mission.v2 · Codex/Claude=Session-Broker
    :18087 inventory) + mission.v2 Job-Liste. Steuern/Continue/Steer/Bind bleiben
    gated (propose-only) und sind hier nicht ausführbar. Ehrlich empty/partial/
    unavailable je Strang; toter Broker bricht das Bundle nie."""
    return agent_sessions_overview()


@router.get("/ziele/overview")
def ziele_overview_route() -> Dict[str, Any]:
    """READ-ONLY 'Ziele & Systeme': views on mission.v2 + task_priority_policy.yaml.
    No new task/todo DB. Real: policy provenance (version/sha/WIP/lanes) + missions
    grouped by STATUS bucket (nicht Prioritäts-Quadrant). Ehrlich empty:
    Ziel-Hierarchie (Jahr/Quartal/Woche) + Habits (keine Quelle im Stack)."""
    return goals_overview()


@router.get("/reflexion/overview")
def reflexion_overview_route() -> Dict[str, Any]:
    """READ-ONLY 'Reflexion' (strikt privat): Journal · Entscheidungen ·
    Lernerkenntnisse. Kein Journal-Store im Stack → ehrlich empty/connect
    (MIKAELOS_JOURNAL_DIR anbindbar). Kein Ersatz aus mission.v2/Approvals
    (Workspace-Grenze). Nur lesen, kein Compose/Versand."""
    return reflexion_overview()


@router.get("/gesundheit/overview")
def gesundheit_overview_route() -> Dict[str, Any]:
    """READ-ONLY 'Gesundheit': voller WHOOP :18090 Bereich (Recovery-Karte +
    7-Tage-Trend) + Training/Ernährung ehrlich 'kein Connector'. Ohne
    WHOOP_INTERNAL_TOKEN ehrlich partial (nie erfundene Werte). Nur lesen (privat)."""
    return gesundheit_overview()


@router.get("/betrieb/overview")
def betrieb_overview_route() -> Dict[str, Any]:
    """READ-ONLY 'Betrieb' (24/7): Anzeigemodus (clientseitig erkannt) + PWA-
    Endpunkte, vier TYPISIERTE propose-only Mac-Aktionen (kein Shell/exec/ssh,
    Ausführung deferred) und der ehrlich geteilte Drei-Frontdoor-Kontext
    (Dashboard=Leser · Telegram=Schreiber · Hermes-App=nicht beobachtet) über
    mission.v2 + Approval-Cards. Nur lesen; Ausführung bleibt gated."""
    return betrieb_overview()


@router.post("/betrieb/mac/propose")
def betrieb_mac_propose_route(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    """PROPOSE-ONLY typisierte Mac-Aktion. Body: ``{action, dryRun}``. Baut eine
    Dry-Run-Vorschau des typisierten Geräte-Intents und gibt sie zurück. KEIN
    Ausführungspfad: das Plugin öffnet nie ssh/shell/exec, sendet nie eine
    Geräte-Aktion an die Control-Plane, und selbst ein Live-Klick (dryRun:false)
    liefert dieselbe ehrliche deferred-Vorschau — Ausführung ist eine separate
    gated Lane (scoped Proxy), die diese Fläche nicht erreicht."""
    if not isinstance(payload, dict):
        payload = {}
    action_id = str(payload.get("action") or payload.get("id") or "").strip()
    dry_run = payload.get("dryRun", payload.get("dry_run", True))
    return mac_action_propose(action_id, dry_run=bool(dry_run))


@router.get("/pwa/manifest.webmanifest")
def pwa_manifest_route() -> Response:
    """PWA web app manifest (plugin-served). Enables Dock/Kiosk install as far as
    a plugin can — the honest host-side limit is documented in the runbook."""
    return Response(content=json.dumps(_PWA_MANIFEST, ensure_ascii=False),
                    media_type="application/manifest+json",
                    headers={"Cache-Control": "no-cache"})


@router.get("/pwa/sw.js")
def pwa_sw_route() -> Response:
    """Minimal offline-shell service worker (plugin-served). Service-Worker-Allowed
    widens the scope to '/' so a returning Kiosk window can show the shell after
    reconnect. Caches GET only — never a write/propose route."""
    return Response(content=_PWA_SW_JS, media_type="application/javascript",
                    headers={"Service-Worker-Allowed": "/", "Cache-Control": "no-cache"})


@router.get("/pwa/offline.html")
def pwa_offline_route() -> Response:
    """Minimal offline app-shell (plugin-served). Honest: reconnect reloads the
    real state; nothing fabricated is shown."""
    return Response(content=_PWA_OFFLINE_HTML, media_type="text/html; charset=utf-8")


@router.get("/pwa/icon.svg")
def pwa_icon_route() -> Response:
    """PWA/tab icon (SVG, plugin-served)."""
    return Response(content=_PWA_ICON_SVG, media_type="image/svg+xml",
                    headers={"Cache-Control": "max-age=86400"})


@router.get("/review/session")
def review_session_route(limit: int = _REVIEW_LIMIT_DEFAULT) -> Dict[str, Any]:
    """READ-ONLY Anki drill/preview session (L-2). No writes, no AnkiConnect —
    grading + persistence stay in Anki/AnkiDroid. Returns due cards + FSRS
    interval preview (authority declared via ``previewSource``)."""
    try:
        n = int(limit)
    except (TypeError, ValueError):
        n = _REVIEW_LIMIT_DEFAULT
    return review_session(max(1, min(n, _REVIEW_LIMIT_MAX)))


@router.get("/study/plan")
def study_plan_route() -> Dict[str, Any]:
    """READ-ONLY Klausur-Countdown + Pacing (exams.json × Anki). No writes."""
    return study_plan()


@router.get("/study/feynman")
def study_feynman_route(concept: str = "", subject: str = "") -> Dict[str, Any]:
    """Stage a Feynman round (concept + prompt + Jarvis reachability). No LLM call,
    no write — just picks a concept read-only and reports if Jarvis can grade."""
    return feynman_setup(concept=concept, subject=subject)


@router.post("/study/feynman/evaluate")
def study_feynman_eval_route(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    """Grade a Feynman explanation BY JARVIS (Brain-Gateway, READ/coaching). Body:
    ``{concept, explanation}``. Never fakes a grade; honest pending if Jarvis is
    unreachable / no token. Writes nothing (no Anki, no business)."""
    if not isinstance(payload, dict):
        payload = {}
    return feynman_evaluate(concept=str(payload.get("concept") or ""),
                            explanation=str(payload.get("explanation") or ""))


@router.post("/study/plan/propose")
def study_plan_propose_route(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    """Propose a study plan as a mission. Body: ``{objective, dryRun}``. ``dryRun``
    defaults to **True** (safe preview, fires nothing). Only an explicit
    ``dryRun:false`` hands it to the gated :18083/actions seam (workspace=studium,
    never money/customer/personnel). The gate decides; the plugin never executes."""
    if not isinstance(payload, dict):
        payload = {}
    objective = str(payload.get("objective") or "").strip()
    dry_run = payload.get("dryRun", payload.get("dry_run", True))
    return propose_study_plan(objective, dry_run=bool(dry_run))


@router.get("/health")
def health() -> Dict[str, Any]:
    """Liveness + which read paths resolved right now (diagnostic)."""
    return {
        "status": "ok",
        "plugin": "mikael-os",
        "version": "0.5.0",
        "phase": 5,
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
            "exams_json": str(EXAMS_PATH),
            "exams_readable": EXAMS_PATH.exists(),
            "brain_gateway": BRAIN_GATEWAY_BASE,
        },
        "firma": {
            "workspace": "company_signal",
            "readOnly": True,
            "fsm_db": str(FSM_DB), "fsm_db_readable": FSM_DB.exists(),
            "belege_db": str(BELEGE_DB), "belege_db_readable": BELEGE_DB.exists(),
            "billing_kpi": str(BILLING_KPI_JSON), "billing_kpi_readable": BILLING_KPI_JSON.exists(),
            "billing_radar": str(BILLING_RADAR_JSON), "billing_radar_readable": BILLING_RADAR_JSON.exists(),
            "wartungs_radar": str(WARTUNGS_RADAR_JSON), "wartungs_radar_readable": WARTUNGS_RADAR_JSON.exists(),
            "paperless_base": PAPERLESS_BASE,
            "cockpit_deeplink_base": COCKPIT_BASE,
            "sqliteMode": "ro",
            "overview": "GET /firma/overview (6 Karten, read-only)",
            "approvalDetail": "GET /firma/approvals/detail?id=<card> (read-only, kein decide)",
        },
        "m4": {
            "ziele": "GET /ziele/overview (mission.v2 + task_priority_policy, keine neue DB)",
            "reflexion": "GET /reflexion/overview (journal read-only oder ehrlich empty)",
            "gesundheit": "GET /gesundheit/overview (WHOOP :18090, ehrlich partial ohne Token)",
            "journal_dir": str(JOURNAL_DIR),
            "journal_dir_present": JOURNAL_DIR.exists(),
        },
        "coach": {
            "countdown": "GET /study/plan (exams.json × Anki, read-only)",
            "feynman": "POST /study/feynman/evaluate (graded by Jarvis Brain-Gateway; never faked)",
            "planPropose": "POST /study/plan/propose (studium workspace, dry-run default, gated)",
            "ankiWrites": False,
            "jarvis": _brain_status(),
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
