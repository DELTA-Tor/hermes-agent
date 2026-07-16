# MIKAEL OS — Personal OS dashboard plugin

Mikael's private, full-screen **Personal Operating Surface**, delivered as a
dedicated **Nous Hermes dashboard plugin** (route `/mikael-os`). It is *not* part
of FSM and *not* a second task database — it is a separate, replaceable surface
that will later project over existing truth.

Primary visual direction: **Command Constellation** (see
`docs/references/mikael-os-v3-command-constellation.png`). Secondary Living
Timeline view and the Spatial-Core focus-lens behavior come in later phases.

## Phase status

**Phase 0 — clean foundation (this commit).** Goal: prove a dashboard-plugin
route can render a full-screen private surface without modifying FSM or the host,
and pin the visual references to the branch.

- Full-screen Command Constellation *shell* rendered as semantic React/DOM:
  top bar + identity, workspace switcher (Privat / Engineering / Firma-Signale),
  orbit module nodes, Jarvis core, focus lens (Engineering/Codex), universal
  command bar, and the Bereit→…→Verifiziert state rail.
- The Jarvis orb and photographic depth are **CSS/SVG placeholders** and marked
  `aria-hidden` — WebGL (Three.js / R3F) is Phase 1.
- **All values are concept data / fixtures**, badged "Konzeptdaten" in the UI and
  stamped `demo: true` + a `data_authority` note in every API payload. Nothing
  here is live truth.

Later: Phase 1 faithful shell + WebGL/atmosphere and interactions; Phase 2 real
read models; Phase 3 proposals/receipts; Phase 4 Living Timeline + iPhone/PWA.

## Data authority (why there is no `tasks.db` here)

Personal OS is **one navigable surface over federated truth**, never a copy of
every source into a new store. When real data lands (Phase 2), each module
projects over its authoritative system and exposes provenance / freshness /
permissions:

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
│   ├── plugin_api.py         # read-only Phase-0 stub → /api/plugins/mikael-os/ (concept data only)
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
