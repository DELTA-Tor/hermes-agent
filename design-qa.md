# Design QA — Mikael OS Voice Command Deck

final result: passed

## Selected reference

- Direction: `1 — Voice Command Deck`
- Reference:
  `/srv/delta/data/reports/mikael-os-qa-20260723/reference-01-voice-command-deck.png`
- Target desktop viewport: `1440 × 1024`
- Target iPhone viewport: `390 × 844`

## Verified implementation

1. The selected direction is implemented in the existing `mikael-os` plugin,
   not in a parallel app.
2. The default responsive tree contains Jarvis Voice, Codex/Claude/Executor
   missions, mission evidence, calendar/tasks, the three current approval gates,
   system health and the source surface catalogue.
3. Empty or unavailable sources render honestly; the new default screen contains
   no fixture metrics.
4. The embedded Realtime route stays in the same PWA, uses WebRTC and
   Hermes-Sideband, and ships no expiring voice-launch link.
5. Keyboard focus styling, dialog focus trap/Escape, live transcript semantics
   and reduced-motion behavior are present in source.
6. The expanded same-screen Life Atlas contains 17 differentiated life areas,
   a 13-surface Tailnet-only Dashboard Observatory, factual future radar and the
   full calendar/task projection at the end of the screen.
7. Constellation and Timeline no longer expose concept fixture events or values;
   missing travel, nutrition and journal sources remain explicit connection gaps.

## Browser matrix

- Google Chrome, desktop `1440 × 1024`: passed.
- Google Chrome, iPhone layout `390 × 844`: passed.
- WebKit 26.5, desktop `1440 × 1024`: passed.
- WebKit 26.5, iPhone layout `390 × 844`: passed.

The physical Safari application could not be automated on the connected Mac
without granting Screen Recording/WebDriver control. WebKit is the engine-level
Safari compatibility check; production Safari remains a post-deploy manual
smoke-test boundary rather than a claimed physical-device run.

## Reference comparison

The selected reference and implementation were compared together at the same
desktop viewport:

- Reference:
  `/srv/delta/data/reports/mikael-os-qa-20260723/reference-01-voice-command-deck.png`
- Chrome implementation:
  `/srv/delta/data/reports/mikael-os-qa-20260723/01-chrome-desktop-1440x1024.png`
- Side-by-side comparison:
  `/srv/delta/data/reports/mikael-os-qa-20260723/03-reference-vs-chrome.png`

The same implementation was then inspected in the content-heavy and responsive
states:

- `/srv/delta/data/reports/mikael-os-qa-20260723/05-chrome-life-atlas-wrapped.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/06-chrome-dashboard-observatory.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/07-chrome-calendar-tasks.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/08-chrome-mobile-390x844.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/09-webkit-desktop-1440x1024.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/10-webkit-mobile-390x844.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/11-chrome-realtime-live.png`
- `/srv/delta/data/reports/mikael-os-qa-20260723/12-chrome-reconnect-confirmation.png`

## QA procedure and fixes

1. Captured the selected reference and Chrome implementation at `1440 × 1024`,
   combined both images, and inspected hierarchy, density, spacing, wrapping,
   navigation and the Jarvis focal point.
2. Opened Life Atlas, Dashboard Observatory and Calendar/Tasks and verified the
   complete long-screen reading order rather than only the hero viewport.
3. Repeated responsive inspection at `390 × 844` in Chrome and WebKit and
   verified that voice, missions, surfaces and life areas remain usable without
   horizontal clipping.
4. Fixed Life Atlas title truncation by allowing a bounded two-line wrap.
5. Removed the automatic Cockpit-to-Constellation idle transition because it
   could unmount and end a live Realtime conversation.
6. Removed the browser-to-provider data channel. WebRTC is audio-only and the
   bounded Hermes Sideband projection is the sole transcript/tool/control
   source, matching the production SDP and authority contract.
7. Verified the Realtime confirmation dialog, keyboard focus handling, live
   transcript region, hangup, error state and explicit reconnect reservation.
8. Reduced the document outline to one host-level `h1`; the plugin title is a
   nested `h2`. Both browser sizes have zero unnamed buttons/links, zero
   duplicate ids and no horizontal overflow.

## Known harness-only signals

The local preview produces `401` responses for `/api/auth/me` and the service
worker script because its synthetic request header is not inherited by the
service worker. These are local authentication-harness artifacts; the UI data
routes and voice controls were authenticated directly. They are not counted as
product defects, and the Tailnet production shell is rechecked after deploy.

## Remaining visual severity

- P0: none.
- P1: none.
- P2: none.
