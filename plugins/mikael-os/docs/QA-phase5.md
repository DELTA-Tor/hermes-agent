# MIKAEL OS — Phase 5 QA (iPhone-Politur · A11Y · Perf · Zustände · Tests)

Stand: 2026-07-16 · Worktree `wt-mikael-os` / `feat/mikael-os`, nur `plugins/mikael-os/**`.
Baut auf dem Desktop-Stand (Phase 4 Living Timeline) auf — Desktop-Komposition
unverändert. Alle Änderungen additiv.

## Was in Phase 5 geändert wurde

### iPhone (<=430px) — lebendes Personal OS statt Kartenraster
- **Home = JARVIS-Präsenz oben** (`MobileJarvisHero`): kompakter Orb + „Guten
  Abend, Mikael" + ehrlicher Live-Status + Mic. Tippen springt auf den Jarvis-Tab.
- **Kuratierte „Jetzt wichtig"-Zone** (dichter, Konzept-gebadged) + **Live-Signale-
  Strip** (`MobileLiveSignals`): horizontale Rail NUR echter Read-Model-Module mit
  Metrik + Zustands-Punkt; leer → ehrliches „Keine Live-Signale"-Chip (nie erfunden).
- **Jarvis-Surface faithful zu `ios-v2-04-jarvis.png`**: Name+Datum-Kopf, Orb,
  „Ich höre zu", Waveform + Beispiel-Query „Wie ist meine Recovery?", „Halten zum
  Sprechen", Quick-Actions (Wetter/Recovery/Deep Work), ehrlicher „Sprachdemo ·
  schreibt nichts"-Hinweis. State-Zeile ist `role=status aria-live=polite`.
- **Persistenter Orb-Zugang von jedem Screen**: der mittlere Jarvis-Tab ist ein
  erhöhter, leuchtender Orb (Tab-Bar unmountet nie) — plus Command-Dock-Mic auf
  Inhalts-Screens. Voice/Conversation damit von überall erreichbar.
- **Vertikale Verdichtung**: Domain-Karten (min-height 132→118px, engeres Padding),
  „Jetzt wichtig"-Kopf, Grid-Kopf „Deine Module".
- **Bottom-Sheet strukturierter**: native Detents (46/76/100vh) + Safe-Areas +
  Grabber bleiben; **neu: gated Phase-3-Aktionen** („Als Codex-Task",
  „Termin vorschlagen") sichtbar aber `disabled`+`aria-disabled`, „GATE"-Pill,
  Tooltip „Noch nicht verbunden — läuft in Phase 3 über Gates (propose-only)".
  Keine Gate-Umgehung.
- **Einheitlich über alle Screens**: fünf Tabs (Home/Timeline/Jarvis/Module/Profil),
  Datum via `TODAY`, Zeit HH:MM, Zustands-Begriffe aus `STATE_META`.

### A11Y
- **Tastatur (Desktop)**: Ctrl/⌘-K → Command-Input, 1–9 → Modul-Fokus, ⭠/⭢ zyklen,
  Esc schließt Fokus/Sheet. Alle interaktiven Elemente fokussierbar.
- **`:focus-visible`**: EIN konsistenter, hoher-Kontrast-Ring (2px cyan-bright +
  4px Halo) für a/button/input/[tabindex] in `.mos`.
- **Landmarks**: genau ein `main` (Desktop-Shell + Mobile-`main`), `nav[aria-label]`
  Tab-Bar, `role=status aria-live=polite` (`LiveAnnouncer`) spiegelt Jarvis-State +
  Load-Status für Screenreader (Info nie nur über Farbe/Bewegung).
- **Icons**: dekorativ → `aria-hidden`, mit Label → `role=img`. 61 hidden + 1
  labelled = 62, kein Icon ohne eine der beiden Auszeichnungen.
- **Kontrast**: `--mos-text-faint` #8695ab→#9aacc2 (AA auch auf getöntem Glas);
  cyan/amber/emerald/violet auf #0a111d alle ≥ 6.9:1 (AA/AAA, s.u.).
- **prefers-reduced-motion**: global `.mos *` animation/transition:none + explizite
  Regeln für neue Pulse (`mos__mhero-orb-ring`, `mos__mtab-orb-core`). Verifiziert:
  0 laufende Animationen unter reduce.
- **Touch-Ziele** ≥ 44×44 (Tabs, Dock-Orb/-Send, iconbtn, Sheet-Grabber — 0 unter
  44px gemessen; `mdock-send` 38→44, `iconbtn` 40→44, `sheet-grab`-Padding ≥44).
- **iOS Safe-Areas** (`env(safe-area-inset-*)`) an Top-Bar, Tabs, Sheet-Foot,
  Scroll-Gutter; Landscape/short-viewport-Fallback (`max-height:560px`) lässt die
  Jarvis-Bühne scrollen statt zu clippen; narrow-`<=380px`-Verdichtung.

### Perf
- rAF-Orb pausiert bei `visibilitychange:hidden` und rendert unter reduce genau
  einen statischen Frame (Phase-1-Verhalten, unverändert).
- `will-change` NUR auf tatsächlich animierte Layer (`orb-canvas`, `mote`,
  die zwei Orb-Ringe) und unter reduce wieder auf `auto` zurückgesetzt — keine
  dauerhaft teuren Blur-/Particle-Kosten.
- Neue Deko ist transform/opacity-only (GPU-freundlich): Hero-Ring-Pulse,
  Tab-Orb-Pulse. Keine zusätzlichen dauerhaften Backdrop-Blur-Flächen im Ruhezustand
  über die bestehenden Glas-Tiers hinaus.
- Keine zusätzlichen Re-render-Trigger: neue Werte via `useMemo` (greeting/announce),
  Callbacks via `useCallback` (`goJarvis`). Orb bleibt eine stabile Komponente.

### Zustände — sichtbar + im UI abgedeckt (nichts fake-live)
Jeder Zustand hat eigene Farbe **und** Text **und** Icon/Form (nie Farbe allein):

| Zustand        | Wo sichtbar                                   | Auszeichnung (Pip/Chip)         |
|----------------|-----------------------------------------------|---------------------------------|
| loading        | Top-Bar „Lädt", Node-Pip vor Fetch            | muted, Spinner-Icon             |
| fresh (live)   | Modul-Pip, Live-Signale-Punkt, Header „N Live"| verified/cyan, „Live" + Alter   |
| stale          | Modul-Pip „Veraltet vor X"                    | amber                           |
| partial        | Modul-Pip „Teilweise" (WHOOP ohne Token)      | blue                            |
| empty          | Lens/Sheet-Empty-Body, Pip „Leer"             | muted, inbox-Icon               |
| unavailable    | Pip „Nicht erreichbar", Empty-Body unplug     | red                             |
| error          | Pip „Fehler", Empty-Body unplug               | red                             |
| gated          | Pip „Gated · nur lesen", Sheet-Gate-Aktionen  | slate-blue, lock-Icon           |
| offline        | Header „Quellen offline · Konzept"            | muted                           |
| konzept (demo) | Konzept-Pill überall wo keine Live-Quelle     | cyan, flask-Icon                |

`phase5-states.png` zeigt die volle Matrix (Module-Tab, `?overview=states`):
Konzept / Veraltet / Teilweise / Nicht erreichbar / Fehler / Leer / Live / Gated
in einem Frame. Freshness/Provenance (Quelle + Stand + Berechtigung) an Lens,
Sheet-Footer und Signal-Chips.

## Phase 5.1 — Harte-Kritik-Punch-Liste (Fixes nach Surface)

Zweite Runde nach adversarialer Foto-Kritik gegen die Nordstern-Referenzen
(`image-cache …/4.png` Command Constellation + `ios-v2-0{1..4}`). Nur
`index.jsx` / `styles.css` / `icons.js`; Layout-Struktur, Interaktionen, Datenmodell
und Bundle-Format unverändert; 0 Writes; Phase-3-Aktionen bleiben gated/„noch nicht
verbunden".

**desk-constellation** (Orb⇄Karte-Kollision behoben)
- Orb-Zentrum von `top:22%`→`33%` gesenkt + Kugel verkleinert (`clamp(150…190px)`,
  Canvas-Overflow `-26%/152%`→`-20%/140%`); geteilte Geometrie-Konstante `CORE_POS`
  speist Core-Anker + Connector-Ursprung. Die Karte „AUFGABEN & ZIELE" liegt nicht
  mehr auf der Orb-Kontur; Lens (`top:40%`→`46%`) hat echten Tiefen-Puffer.
- Handoff-Pills: `core-row gap 18px`→`clamp(30…60px)` → klarer Freiraum beidseitig.
- Orbit-Ringe sichtbar: Opacity 0.55→0.8 (aktiv 0.95), Ellipsen vergrößert +Glow,
  offset-path an neue Ellipsengröße angepasst → Systemknoten statt generisches Widget.
- Atmosphäre: `background-position 60% 55%`→`50% 50%`, Veil-Deckkraft/Radien
  gesenkt → Fototiefe über die GANZE Fläche statt nur am rechten Rand.
- Modul-Ring-Reihenfolge = im Uhrzeigersinn ab oben (Tab-/Fokusfolge = Sichtposition,
  WCAG 2.4.3). Drag-Griff dauerhaft sichtbar (`opacity 0→0.4`).

**desk-timeline**
- EIN „Jetzt": Top-Bar-Uhr szenen-abhängig — Timeline zeigt `TIMELINE_NOW.time`
  (16:42) wie der Marker, Konstellation behält Nacht-Referenzzeit. Kein Widerspruch.
- WHOOP: die 4 toten „—"-Kacheln entfallen; ehrlicher Kompakt-Zustand (kleinerer Ring
  „Verbunden/WHOOP" + eine Notiz „Detailwerte nur über autorisierten Connector").
  Nie erfundene Zahlen; Grid rendert nur bei echten Live-Werten.
- Fake-Fortschrittsbalken (hart `58%`) entfernt — es gibt kein Completion-Signal.
- Top-3-Titel: `nowrap+ellipsis`→2-Zeilen-Clamp + `title`-Tooltip (kein Wortabschnitt).
- Composer bleibt auf der Timeline-Szene sichtbar (`.mos--timeline .mos__shell{height:100vh}`
  → Timeline-Spalte schrumpft, Command-Bar + State-Rail unten sichtbar).

**ios-home**
- JARVIS-Hero-Banner UND Live-Signale-Rail entfernt (dritter redundanter Orb +
  doppelte Modul-Metriken, halbe Karten unter dem Fold). Home = „Jetzt wichtig" +
  Modul-Grid + Dock — wie Referenz. Karten behalten ehrliche StatePips.
- `mos__mdock-send` 38→44px (`--mos-touch`). Farbcodierte msig-Punkte entfallen mit
  der Rail (waren color-only).

**ios-jarvis**
- Toter Deko-Mic-Button IM Orb entfernt (kein Handler, saß auf dem Wellen-Hotspot).
- „JARVIS"-Wordmark nur noch im Desktop-Core (per `Orb({label})`); mobile Kugel
  label-frei → Welle kreuzt keinen Text. Ein Sprech-CTA („Halten zum Sprechen").

**ios-timeline**
- Persistenter Tab-Orb inline statt erhöhtem FAB (`margin-top:-20px`→0, 52→34px) →
  kein Overlap mehr auf der letzten Karte.
- Global-Top-Bar auf dem Timeline-Tab unterdrückt → EIN kompakter „Living Timeline"-
  Kopf (kein Doppel-Header, keine zweite Uhr).
- Kategorie-Färbung: ganze Kartenfläche getönt (nicht nur 3px-Kante). Perioden-Labels
  (Morgen/Mittag) auf dem Phone ausgeblendet (Desktop behält sie).

**ios-sheet**
- `LENS_MAX_ROWS`-Cap jetzt auch im Sheet + „+N weitere"-Zeile (war ungedeckelt).
- Titel-Clamp-Bug behoben: `white-space:normal` im Sheet-Override → 2-Zeilen-Clamp
  greift statt einzeiligem Wortabschnitt.

**a11y**
- Tap-Ziele ≥44: `iconbtn` 40→44, `mdock-send` 38→44, `sheet-grab` ~25→≥44 (Padding).
- `<h1>` (sr-only) in Desktop- und Mobile-Shell → Heading-Struktur.
- Bottom-Sheet ist modal: `role=dialog` + `aria-modal` + Fokus-Move beim Öffnen +
  Fokus-Restore beim Schließen (Escape schließt via Shell-Keydown).
- Nicht-verdrahtete Chrome-Buttons (Lens-Tools/-Header, Modul hinzufügen,
  Schnellzugriffe) tragen ehrlichen `title`-Hinweis „Noch nicht verbunden — Phase 3".

**perf**
- Node-Drag: Commit auf 1×/rAF gedrosselt (statt jedem rohen pointermove).
- Globaler Keydown-Handler liest State aus Refs → deps stabil, keine Listener-
  Neuregistrierung pro Drag-Frame (vorher `modules` in deps).
- Bottom-Sheet-Drag: Höhe in Ref gespiegelt → 4 Fenster-Listener nur 1× registriert
  (vorher pro Frame ab-/angemeldet).
- Orb-rAF auf ~30fps gedrosselt (halbiert die teuren `shadowBlur`-Kosten).
- `will-change` auf `.mos__atmosphere` unter `prefers-reduced-motion` auf `auto`.
- Base64-Atmosphäre bleibt im CSS: der 2-Datei-Contract (IIFE + eine CSS) verlangt
  Selbstenthaltung; ein separates Bild-Asset würde den Contract brechen (bewusst so).

## Testergebnisse (Zahlen)

| Test                          | Kommando                                  | Ergebnis |
|-------------------------------|-------------------------------------------|----------|
| Build                         | `npm run build`                           | ✓ 3 Module, ~118 ms |
| Smoke (SSR-Render)            | `node test/smoke.mjs`                     | PASS — registriert, 32 527 chars, 59 lucide-SVG, 11/11 Key-Strings |
| Interakt. Phase 1/2           | `demo/interact.py`                        | ALL INTERACTIONS OK |
| Interakt. Phase 4             | `demo/interact_phase4.py`                 | ALL PHASE-4 INTERACTIONS OK (Scene-Switch, Sheet-Detents, Tabs) |
| **A11Y/Keyboard Phase 5**     | `demo/interact_phase5.py`                 | **ALL PHASE-5 A11Y CHECKS OK — 18/18** |
| Reduced-motion                | (emul. reduce)                            | 0 laufende Animationen, 0 Errors |
| Offline-Pfad                  | `?offline=1`                              | Header „Quellen offline · Konzept", 0 Errors |
| Console/Page-Errors (Shots)   | alle 6 Phase-5-Captures                   | 0 Errors |

### Keyboard-Protokoll (Desktop 1440×1024)
```
tab stops: Konstellation -> Timeline -> Privatsphäre & Berechtigungen -> Privat -> Engineering -> Firma-Signale
[ok] Tab reaches >=5 focusable stops (8)
[ok] every tab stop is an interactive element
[ok] :focus-visible produces a visible ring (outline/box-shadow)
[ok] Ctrl-K focuses the command input
[ok] digit key 3 focuses a module (lens: 'Lernplan')
[ok] ArrowRight cycles focus (Lernplan -> Rise-L Prozesse)
[ok] Escape resets focus to home lens
```

### aria-/Screenreader-Protokoll
```
B1 Desktop: 1 main · polite status-region · 61 hidden + 1 labelled = 62 icons ·
            0 unnamed buttons · status trägt 'Jarvis: Bereit. 4 Module live.'
B2 Mobile:  nav[aria-label] · genau 1 main · polite status-region ·
            aria-current=page am aktiven Tab · Jarvis-State = aria-live status ·
            0 Touch-Ziele < 44px
```

### Kontrast (WCAG, Text auf Canvas #0a111d)
```
faint #9aacc2  8.15   dim #b3c1d4 10.35   cyan #38bdf8 8.82
amber #fbbf24 11.32   emerald #34d399 9.83  violet #a78bfa 6.95   (alle ≥ AA 4.5)
```

## Bundle-/Render-Check
| Datei                  | roh       | gzip     | Δ vs. Phase 4 (roh) |
|------------------------|-----------|----------|---------------------|
| `dashboard/dist/index.js`  | 102 300 B | 25 280 B | +1,6 KB vs. Phase 5 |
| `dashboard/dist/style.css` | 136 840 B | 58 560 B | +2,3 KB vs. Phase 5 (inkl. inline-Atmosphäre-PNG) |

Zwei-Datei-Contract (IIFE + CSS) unverändert; React extern aus dem SDK-Global;
`window.__HERMES_PLUGINS__.register("mikael-os", …)` unverändert. Nicht minifiziert
(greppbar, gewollt) — der Host liefert die minifizierte Auslieferung.

## Viewport-Matrix
| Viewport            | Shell        | Screenshot                     |
|---------------------|--------------|--------------------------------|
| 1440×1024 (Desktop) | Konstellation| `phase5-desktop-constellation.png` |
| 430×1500 (tall)     | Module/States| `phase5-states.png`            |
| 390×844 (iPhone)    | iOS          | `phase5-ios-home/-timeline/-sheet/-jarvis.png` |
| 360×780 (schmal)    | iOS          | `phase5-ios-home-small.png`    |
| ≤430 & ≤560 h (Landscape) | iOS    | Fallback verifiziert (Jarvis-Bühne scrollt) |

## Screenshots (alle nach Phase 5.1 neu erzeugt, 0 Console/Page-Errors)
- `docs/shots/phase5-desktop-constellation.png` (1440×1024, Orb-Geometrie-Fix)
- `docs/shots/phase5-desktop-constellation-wide.png` (1728×1117)
- `docs/shots/phase5-desktop-timeline.png` (1440×900, Uhr/WHOOP/Composer-Fix)
- `docs/shots/phase5-ios-home.png` (390×844)
- `docs/shots/phase5-ios-home-small.png` (360×780)
- `docs/shots/phase5-ios-timeline.png` (390×844)
- `docs/shots/phase5-ios-sheet.png` (390×844)
- `docs/shots/phase5-ios-jarvis.png` (390×844)
- `docs/shots/phase5-states.png` (430×1500, Zustands-Matrix)
- Harness: `demo/shoot_phase5.py {desktop|ios|states|all}` (Playwright
  `/home/ubuntu/.claude/jobs/9f372059/tmp/pw/bin/python`).

## Doktrin-Konformität
- 0 Writes im Plugin. Phase-3-Aktionen sichtbar aber gated/propose-only/„noch nicht
  verbunden", keine Gate-Umgehung.
- Read-Models + Freshness/Provenance + Fixture-Fallback beibehalten. Kalender/
  Lernplan/Ernährung/Journal ehrlich Konzept; WHOOP ohne Token ehrlich „Verbunden/
  keine Werte"; Live-Signale nur echte Read-Model-Module.
- lucide-Icons (kein Emoji/ASCII). `calendar-plus` verbatim aus lucide-static 0.469
  ergänzt. Harness (`demo/`, gitignored) nicht Teil des Bundles.
