# MIKAEL OS — Phase 3 QA: Propose → Approval-Card → Receipt lifecycle

Phase 3 adds exactly **one** write-adjacent capability to the plugin: *propose an
engineering / Codex task*. It is **propose-only** and **gate-led** — the plugin
never writes, never executes, and never approves. Everything else stays read-only.

## What was built

**Backend — `dashboard/plugin_api.py`** (still read-only except the one propose seam)
- `POST /actions/propose` `{objective, dryRun}` — `dryRun` **defaults to True**.
  - `dryRun:true` → `build_intent()` + `predict_gate()` return the exact intent
    (`objective, mandant, workspace/workspaceType, jobType, requiredCapabilities,
    requiredGate, idempotencyKey, provenance`) + a **plan preview** + the
    **expected** gate, firing **no** network call.
  - `dryRun:false` → hands the intent to the existing gated seam
    `POST http://127.0.0.1:18083/actions` (`route.resolve → gate/queue → dispatch`)
    and maps the response (`approval_required`/`proposed` → `waiting_approval`,
    `executed` → `executed`, …). The **control-plane** decides ALLOW / DENY /
    REQUIRE_APPROVAL and mints the server-side Approval-Card — not the plugin.
- `GET /actions/receipt` `{cardId|objective}` — read-only lookup over the Phase-2
  read models (`/srv/hermes/approvals/appr_*.json` + `mission.v2`), mapping card
  status → lifecycle. Never writes, never decides.
- Deterministic `idempotencyKey = "mos-" + sha256(workspace|jobType|objective)[:16]`.
- Scope guard: money/customer/personnel objectives are refused (`out_of_scope`) —
  this surface is engineering-only.

**Frontend — `frontend/src/index.jsx` + `styles.css` + `icons.js`**
- The previously-disabled "Als Codex-Task" action becomes a **lifecycle**:
  `Entwurf → Dry-Run-Vorschau → [Nutzer klickt „An Gate senden"] → Wartet auf
  Freigabe → (Receipt) Freigegeben / Ausgeführt / Verifiziert` — or `Abgelehnt /
  Fehler / Auth-ausstehend`.
- Entry points: command-bar chip **"Codex-Aufgabe vorschlagen"**, the **Engineering
  focus-lens** tool, and the mobile **bottom-sheet** action.
- Tone semantics (always **text + icon**, never colour alone): proposed/preview =
  **amber**, approved = **cyan**, executed/verified = **emerald**, denied/error =
  **red**, auth_pending = **gated slate-blue**.
- Other actions (**Kalender-Vorschlag**, **FSM-Vorschlag**) stay visibly
  **"noch nicht verbunden"** (disabled + hint).
- Honest labelling throughout: *"Propose-only — das Plugin führt nicht aus. Dein
  Gate entscheidet."*

## `:18083` auth finding

The Hermes controller (`/srv/hermes/hermes/controller.py`) **binds `127.0.0.1`
only** and authorizes purely on `ip_address(...).is_loopback` — there is **no
token/header scheme**. The plugin router runs inside the dashboard process on the
same host, so a loopback POST is the intended, sufficient authorization. The
plugin treats **reachability of `GET /healthz`** as the connection check; if it is
unreachable it reports an honest **`auth_pending`** ("Freigabe-Anbindung: Auth
ausstehend") instead of faking a queued action. No secret is read or logged.

## Safety guarantees (verified)

1. **Dry-run default, fires nothing.** `propose_intent(dry_run=True)` builds the
   intent with **zero** network POSTs (backend test hard-fails if `_http_post_json`
   is ever called on that path).
2. **The plugin never self-approves.** `/approvals/decide` (the operator's
   execution-granting path) is **never called**. The only occurrence of that
   string in the whole plugin is a self-describing health note; no request target
   is ever built from it.
3. **Live submit goes only through the gated seam.** The one backend POST targets
   `CONTROL_PLANE_BASE + "/actions"`; the frontend only ever addresses its own
   same-origin plugin routes (`/api/plugins/mikael-os/actions/{propose,receipt}`).
   It never addresses `:18083` directly.
4. **Receipt-led, no optimistic fiction.** "Ausgeführt/Verifiziert" is shown only
   after a real receipt (`/actions/receipt` reading a decided card). A failed read
   keeps the honest `waiting_approval` state — it never fabricates a receipt.
5. **In build/test, no real action fired.** All tests exercise the dry-run path +
   a **mocked** live path (backend monkeypatch; frontend harness `authedFetch`
   mock). No real `/actions` POST and no Approval-Card were created.

### grep proof — `/approvals/decide` is never called
```
$ grep -rnE "[\"'`][^\"'`]*approvals/decide" frontend/src dashboard/plugin_api.py
dashboard/plugin_api.py: "note": "Plugin proposes via gated /actions only; never calls /approvals/decide."
```
The single quoted match is the health-endpoint **note asserting the property** —
not a request URL. Every other mention is a `#`/`//` comment. No `fetch`/`urlopen`
in the plugin ever constructs that path.

### The ONLY POST targets in code
- Frontend: `PROPOSE_API = "/api/plugins/mikael-os" + "/actions/propose"` and
  `RECEIPT_API = "…/actions/receipt"` (same-origin plugin routes).
- Backend: `_http_post_json(f"{CONTROL_PLANE_BASE}/actions", packet)` (the gated
  seam) — nowhere else.

## Tests + results

| Test | What it proves | Result |
|------|----------------|--------|
| `npm run build` | bundle compiles (IIFE + register unchanged) | **green** |
| `node test/smoke.mjs` | bundle registers `mikael-os`, renders, 61 lucide icons | **PASS** |
| `demo/test_plugin_api_phase3.py` | dry-run fires no POST · live hits only `/actions` · unreachable → `auth_pending` · receipt read-only | **PASS** |
| `demo/interact_phase3.py` (Playwright) | dry-run preview → send → waiting → approved (cyan) → executed reachable; **no `:18083`, no `/approvals/decide`, only propose-route POSTs** | **PASS** |
| `demo/interact_phase5.py` | Phase-5 a11y/keyboard still green (no regression) | **PASS** |
| `demo/interact.py` | Phase-1 interactions still green (no regression) | **PASS** |

## Audit-Fixes — Visual / a11y round (no doctrine change)

All fixes are frontend-only (`index.jsx` + screenshots); the propose-only backend
(`plugin_api.py`) was **not touched** — still dry-run-default, single gated POST to
`/actions`, never `/approvals/decide` (re-verified above).

- **Dialog name carries the live state** (was frozen "Codex-Aufgabe vorschlagen").
  `aria-label` and the visible sub-line are now `… · <phase>` (Entwurf / Vorschlag-
  Vorschau / Wartet auf Freigabe / Freigegeben / Abgelehnt …), and the header badge
  glyph tracks the lifecycle icon — so screen readers announce the real dialog
  identity in every phase (WCAG 4.1.2 Name/Role/Value, 2.4.6).
- **Status pill in every phase** (was only from `waiting_approval` onward). The
  coloured `role="status"` `aria-live="polite"` pill now renders for `compose` and
  `preview` too, so the flow Entwurf → Vorschau → Wartet-auf-Freigabe → Receipt is
  marked equally strongly for sighted users and AT (WCAG 4.1.3 Status Messages) —
  fixing the optical break between the propose and lifecycle shots.
- **`shield-check` reserved for done/reachable/approved.** The "Braucht Freigabe"
  cell now uses `clock` (pending), the honest propose-only banner uses `lock` (gated
  boundary), and the Approval-Card reference uses the phase glyph (so a check-mark
  appears there only when the phase is actually `approved`) — a check no longer
  falsely reads as "erledigt" while a proposal is still open.
- **iOS reference shot uses the shared Engineering example** ("Refactor: Deploy-
  Check als eigenes Modul extrahieren") instead of the leaked "Körper / WHOOP"
  module title, so workspace label and objective agree.

## Screenshots
- `docs/shots/phase3-desktop-compose.png` — the **Entwurf** phase (textarea, `lock`
  scope note, "Entwurf" status pill).
- `docs/shots/phase3-desktop-propose.png` — Dry-Run preview (objective, workspace,
  gate prediction, capabilities, "Gate-Anbindung bereit", propose-only banner,
  amber "Vorschlag-Vorschau" pill).
- `docs/shots/phase3-desktop-lifecycle.png` — "Wartet auf Freigabe" (amber, `clock`)
  with the real Approval-Card id; sub-line reads "Engineering · Wartet auf Freigabe".
- `docs/shots/phase3-desktop-receipt.png` — receipt-led terminal **Freigegeben**
  (cyan) with the Approval-Card id (`shield-check` legitimately, phase = approved).
- `docs/shots/phase3-desktop-denied.png` — terminal **Abgelehnt** (red, `ban`) with
  the honest "Kein Gate umgangen — dieser Zustand kommt direkt von deinem Gate" hint.
- `docs/shots/phase3-ios-propose.png` — the same Engineering dry-run preview as a
  mobile bottom-sheet.

## Scope / boundaries honoured
- Under `plugins/mikael-os/**` only. Nothing committed/pushed/deployed. No changes
  to `/srv/hermes`, FSM, or the host (read-only inspection only).
- Bundle format (IIFE + `register("mikael-os", …)`) unchanged. Phase-2
  reads/provenance/fixtures intact. lucide icons only. Demo harness gitignored.
