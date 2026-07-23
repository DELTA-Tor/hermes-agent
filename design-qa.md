# Design QA — Mikael OS Front Door

final result: passed

## Compared states

- Reference state: Mikael OS Cockpit at 1440 × 1000.
- Implemented state: the same Cockpit after submitting a Jarvis command, with
  the persistent Hermes chat opened in place at 1440 × 1000 and 390 × 844.
- Combined comparison:
  `/srv/delta/output/playwright/mikael-frontdoor-implementation-20260723/.playwright-cli/page-2026-07-23T13-57-53-569Z.png`

## Checks

1. The browser remains on `/mikael-os`; no new tab, new window, or `/chat`
   navigation occurs.
2. The chat layer uses the existing dark Mikael OS / Hermes palette and keeps a
   single clear exit labelled `Zurück`.
3. Desktop keeps the terminal and model/session rail readable without
   horizontal clipping.
4. At 390 × 844 the chat layer covers the old dashboard chrome, the header and
   exit stay visible, and the terminal remains within the viewport.
5. Keyboard focus moves into the chat after opening; the return control remains
   a labelled button.

## Remaining polish

- P3: The underlying Hermes chat is intentionally terminal-dense. A later
  conversational renderer can make messages calmer without changing the
  persistent-session bridge proven here.
- Live Realtime voice still uses the existing separately gated launcher and was
  not visually claimed as consolidated by this change.
