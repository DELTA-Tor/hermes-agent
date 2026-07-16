"""MIKAEL OS dashboard-plugin backend — Phase 0 (read-only concept stub).

Mounted at ``/api/plugins/mikael-os/`` by the Nous Hermes dashboard
(``getattr(mod, "router")`` is included with that prefix — see
``hermes_cli/web_server.py``).

Phase 0 scope
-------------
This endpoint set is **read-only** and returns **concept / demo data only**.
It deliberately does NOT touch ``fsm.db``, ``mission.v2``, the job projection,
WHOOP, calendar or any live source — that is Phase 2 ("real read models"). Every
payload carries ``"demo": true`` and a ``"data_authority"`` note so no caller can
mistake these fixtures for live truth. There are no write endpoints; the
Personal OS never writes business truth (FSM writes always go through Cockpit
:18065 with agent identity, and remain out of scope here).

The fixtures below mirror the frontend's concept shell (see
``frontend/src/index.jsx``) so the two stay legible together during review.
"""

from __future__ import annotations

from typing import Any, Dict

try:
    from fastapi import APIRouter
except Exception:  # pragma: no cover - allow import/unit use without FastAPI
    class APIRouter:  # type: ignore
        def get(self, *_args, **_kwargs):
            return lambda fn: fn

        def post(self, *_args, **_kwargs):
            return lambda fn: fn


router = APIRouter()

# Phase-0 provenance stamp attached to every payload. When Phase 2 wires the
# real read models, these markers flip to genuine source/freshness/permission
# metadata per module — the shape stays, the authority changes.
_DEMO_NOTE = (
    "MIKAEL OS Phase 0 — concept data only. Not live truth. Real read models "
    "(mission.v2 / job_projection / task_priority_preview, WHOOP, calendar, "
    "Rise-L, company signals) arrive in Phase 2."
)


def _envelope(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Wrap a fixture payload with unmistakable demo provenance."""
    return {
        "demo": True,
        "phase": 0,
        "data_authority": _DEMO_NOTE,
        **payload,
    }


# Concept module registry — shape aligns with the eventual PersonalOSModule
# contract (id / workspace / title / accent / summary). DEMO ONLY.
_MODULES = [
    {"id": "today", "workspace": "private", "title": "Heute", "icon": "sun", "accent": "cyan", "summary": "9 Ereignisse"},
    {"id": "calendar", "workspace": "private", "title": "Kalender", "icon": "calendar-days", "accent": "cyan", "summary": "Nächster · 10:30"},
    {"id": "body", "workspace": "private", "title": "Körper / WHOOP", "icon": "heart-pulse", "accent": "emerald", "summary": "Recovery 82% · Stand 06:12"},
    {"id": "journal", "workspace": "private", "title": "Journal", "icon": "notebook-pen", "accent": "cyan", "summary": "1 Eintrag heute"},
    {"id": "tasks", "workspace": "private", "title": "Aufgaben & Ziele", "icon": "target", "accent": "emerald", "summary": "7 aktiv · 3 heute"},
    {"id": "learning", "workspace": "private", "title": "Lernplan", "icon": "graduation-cap", "accent": "violet", "summary": "3 Lektionen fällig"},
    {"id": "risel", "workspace": "engineering", "title": "Rise-L Prozesse", "icon": "server", "accent": "amber", "summary": "5 Workflows aktiv"},
    {"id": "travel", "workspace": "private", "title": "Reisen", "icon": "plane", "accent": "cyan", "summary": "Rom · 18. Jun"},
    {"id": "nutrition", "workspace": "private", "title": "Ernährung", "icon": "leaf", "accent": "emerald", "summary": "Heute · 2.105 kcal"},
    {"id": "company", "workspace": "company_signal", "title": "Firma-Signale", "icon": "building-2", "accent": "neutral", "summary": "Approval-Cards", "read_only": True},
]

_FOCUS_LENS = {
    "id": "engineering",
    "title": "Engineering / Codex",
    "icon": "code-xml",
    "accent": "cyan",
    "source": "GitHub",
    "freshness": "vor 7 Min",
    "permission": "Lesen & Schreiben",
    "missions": [
        {"title": "Feature: KI Fokus-Modus", "sub": "Sprint 42 · Frontend", "status": "running", "progress": 68},
        {"title": "API: Permissions Service", "sub": "Backend · Sicherheit", "status": "waiting", "progress": None},
        {"title": "Refactor: Workspace Core", "sub": "Architektur", "status": "verified", "progress": 100},
        {"title": "Test Suite: E2E Stabilität", "sub": "Qualitätssicherung", "status": "running", "progress": 24},
    ],
}


@router.get("/health")
def health() -> Dict[str, Any]:
    """Liveness probe for the Phase-0 surface."""
    return _envelope({"status": "ok", "plugin": "mikael-os", "version": "0.1.0"})


@router.get("/overview")
def overview() -> Dict[str, Any]:
    """Concept snapshot backing the Command Constellation shell (DEMO)."""
    return _envelope(
        {
            "identity": {"name": "Mikael", "context": "Privates System"},
            "workspaces": ["private", "engineering", "company_signal"],
            "active_workspace": "private",
            "jarvis_state": "ready",
            "modules": _MODULES,
            "focus_lens": _FOCUS_LENS,
        }
    )
