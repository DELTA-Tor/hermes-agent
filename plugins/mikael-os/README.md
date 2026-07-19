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

## Learning Intake Foundation (code-ready, not live)

`learning_intake/` provides contracts plus a bounded, read-only Direct-Context
CLI for local text PDFs up to 200 pages. It does not mount a route, persist uploads, run OCR,
invoke Vision, write Qdrant/Graph/calendar data or start a scheduler. Existing
L-1 Anki, L-2 review and L-3 coach code remains the future consumer and is not
duplicated.

The manifest covers module/exam identity, date/form/aids, tenant-scoped source
SHA deduplication, PDF-page/PPTX-slide provenance, render assets, extracted
text, evidence-only OCR/Vision confidence and review, learning objectives and
ingestion state. `studium` plus a `uni:` tenant is mandatory; company routing
keys and business authority flags are rejected.

The immediate lane computes the source SHA, extracts at most 200 PDF pages and
20 MiB through local Poppler, and emits stable `sha256:…#page=N` citations.
Up to 300,000 text characters enter direct context at once. Larger documents
are not rejected: they produce a deterministic page map and roughly
100,000-character partitions. Re-run with `--partition N` to load one complete
partition plus bounded page excerpts; `answer_ready` remains false until that
selection is explicit. Blank pages are listed under `needs_vision_pages` for a
later OCR/Vision lane.
The manifest enforces `embedding_requested=false`, `graph_write_requested=false`
and `durable_write_requested=false`, so durable ingestion cannot enter the
answer-critical path.

Durable flow remains: **Drop → Analyse → Confirmation Card → Freigabe**. The
included card is always a dry-run with `will_write=false`; approval and durable
ingestion require a later gated adapter.

```bash
cd plugins/mikael-os
python -m learning_intake.cli validate /path/manifest.json
python -m learning_intake.cli confirmation-card /path/manifest.json
python -m learning_intake.cli analyze-pdf /path/script.pdf \
  --tenant uni:tum --module thermodynamik --exam thermo-2026 \
  --exam-date 2026-09-08 --question "Welche Hauptsätze sind prüfungsrelevant?"
# If the result reports partition_required=true:
python -m learning_intake.cli analyze-pdf /path/script.pdf \
  --tenant uni:tum --module thermodynamik --exam thermo-2026 \
  --exam-date 2026-09-08 --question "Welche Hauptsätze sind prüfungsrelevant?" \
  --partition 1
```

Schemas live under `learning_intake/schemas/`.

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
