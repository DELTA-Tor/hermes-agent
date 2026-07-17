# MIKAEL OS — Personal OS dashboard plugin

Mikael's private, full-screen **Personal Operating Surface**, delivered as a
dedicated **Nous Hermes dashboard plugin** (route `/mikael-os`). It is *not* part
of FSM and *not* a second task database — it is a separate, replaceable
orchestration surface over existing truth.

Primary visual direction: **Command Constellation** (see
`docs/references/mikael-os-v3-command-constellation.png`), complemented by the
Living Timeline, a cockpit view and focused area scenes.

## Current status

**M0–M5 are implemented in this draft branch, but not deployed.** The plugin
contains the cockpit, Command Constellation, Living Timeline, dedicated area
scenes and a mobile layout. Its adapter is mounted at
`/api/plugins/mikael-os/`. Every projection reports an honest state
(`loading·fresh·stale·unavailable·empty·partial·error`) plus source,
observation time, freshness threshold, permission and workspace. Missing
sources remain visibly empty or conceptual; they are never replaced with
invented live values.

| Area | Current evidence path | Draft status |
| --- | --- | --- |
| Heute / Kalender | `calendar-evidence.db` opened read-only | live projection; private and company Dispo remain separate |
| Learning | Anki collection opened read-only + `exams.json` | L1–L3 read/coach flows; study-plan submission is propose/gate only |
| Jarvis / Approvals | Brain-Gateway reachability + Approval-Card files | state, hints and card details; no decision endpoint |
| Firma / Rise-L | FSM and belege read-only projections, billing/radar files, Paperless and service health | six read-only cards with deep links to the owning system |
| Wissen / Kommunikation / Sessions | unified-search, Telegram/FreeScout signals, mission and session-broker projections | read-only, workspace-labelled and source-attributed |
| Gesundheit | WHOOP connector | partial until the operator supplies the internal token |
| Ziele / Reflexion | mission policy plus optional private journal directory | real mission view; hierarchy, habits and journal stay honestly empty without a source |
| Betrieb 24/7 | client display state, PWA shell, mission/approval context | four Mac actions are typed previews only; execution remains deliberately unwired |

The remaining operational gaps are explicit: this branch is not merged or
deployed; the PWA host link and Mac-mini startup path are runbook steps; Hermes
App shared context is not observed; Mac actions never execute; and external
writes still require the existing Control-Plane proposal and Operator gate.
FSM writes remain exclusively behind Cockpit `:18065`.

## Data authority (why there is no `tasks.db` here)

Personal OS is **one navigable surface over federated truth**, never a copy of
every source into a new store. Each connected module projects over its
authoritative system and exposes provenance, freshness and permissions:

- Personal jobs, goals, reminders, Codex/Claude work → existing **`mission.v2`**
  plus **`job_projection()`** / **`task_priority_preview`** and universal job
  intake. **No `tasks.db`, no second Kanban truth, no second priority field.**
- WHOOP, calendar, Rise-L, company signals → their own read-only projections.
- FSM / company data → **read-only** projection for personal relevance and
  Approval Cards. All FSM writes still go through **Cockpit `:18065`** with agent
  identity/token. **No direct `fsm.db` access from this plugin.**
- Money, customer commitments, personnel, prod restarts, destructive ops and
  schema migrations remain **gated**.

## Layout

```
plugins/mikael-os/
├── dashboard/
│   ├── manifest.json        # host discovery (name, tab /mikael-os, entry, css, api)
│   ├── plugin_api.py         # read/propose adapter → /api/plugins/mikael-os/
│   └── dist/
│       ├── index.js          # built IIFE plugin bundle (committed)
│       └── style.css         # extracted stylesheet (committed)
├── frontend/                 # build source for dist/ (see below)
├── docs/references/          # the 5 V3 concept references
└── README.md
```

## Build

The frontend is a Vite **library build** that emits the exact bundle contract the
host expects — the same shape as the checked-in `kanban` / `hermes-achievements`
bundles:

- React, hooks and UI primitives are read from `window.__HERMES_PLUGIN_SDK__` at
  runtime; **nothing is bundled** (no React, no lucide runtime). Lucide icon
  geometry is inlined as verbatim path data (the achievements-plugin pattern),
  since the host SDK exposes no lucide component surface.
- The bundle registers via
  `window.__HERMES_PLUGINS__.register("mikael-os", MikaelOS)`.

```bash
cd frontend
npm install
npm run build          # → ../dashboard/dist/{index.js,style.css}
node test/smoke.mjs    # headless: loads the bundle against a mock SDK, asserts it
                       #   registers and renders (no host required)
```

`dist/` is committed so the plugin works without a build step at deploy time,
mirroring the other in-repo dashboard plugins.
