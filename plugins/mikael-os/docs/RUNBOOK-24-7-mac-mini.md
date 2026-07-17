# RUNBOOK — MIKAEL OS als 24/7-Fläche auf dem Mac mini

> **Status: NACH-DEPLOY-Anleitung. Nichts hiervon wird von einem Agenten ausgeführt.**
> Kiosk-/Autostart-Setup ist ein einmaliger, physischer GUI-Vorgang durch den
> Operator am Mac mini. Die Mac-Steuerung im Plugin bleibt ausschließlich
> typisiert + propose-only (siehe §4) — kein Shell-Autopilot.

Dieses Runbook macht MIKAEL OS zur dauerhaft sichtbaren 24/7-Fläche (Dock-App /
Kiosk) auf dem Mac mini und beschreibt, wie die (heute noch deferred) Mac-
Steuerung später real ausführbar wird. Die BETRIEB-Szene im Plugin
(`/mikael-os` → „Betrieb 24/7") zeigt den Live-Zustand: Anzeigemodus, Reconnect,
PWA-Status, Mac-Aktionen und den geteilten Drei-Frontdoor-Kontext.

---

## 0. Voraussetzungen (Ist-Stand, bereits vorhanden)

- Dashboard läuft: `nous-hermes-dashboard.service` (systemd --user), intern `:9120`.
- Tailnet-Serve: `https://delta-ai-01.tailbc3df5.ts.net:9119` → proxy → `:9120`
  (tailnet only, kein Funnel).
- MIKAEL-OS-URL: **`https://delta-ai-01.tailbc3df5.ts.net:9119/mikael-os`**
- Auth: Nous-OAuth-Gate (Access-Cookie ~15 min TTL + stille Refresh-Rotation) —
  ein einmaliger Login im Kiosk-Browser hält die Session über die Cookie-Jar.
- Tailscale.app auf dem Mac mini installiert + im Tailnet angemeldet.

---

## 1. Anzeige-Weg wählen (Kiosk / Dock-App)

Die BETRIEB-Szene erkennt den Anzeigemodus clientseitig und zeigt ihn oben in der
Karte „Anzeige & Verbindung" (Installiert/Kiosk vs. Browser-Tab). Ziel: **nicht**
Browser-Tab, sondern ein installiertes/kioskartiges Fenster.

### Option A — Safari „Zum Dock hinzufügen" (macOS Sonoma+, empfohlen, am einfachsten)
1. Safari öffnen → Ziel-URL `https://delta-ai-01.tailbc3df5.ts.net:9119/mikael-os`.
2. Einmal per OAuth einloggen.
3. Menü **Ablage → Zum Dock hinzufügen …** → Namen „MIKAEL OS" bestätigen.
4. Ergebnis: chromeless Fenster-App im Dock, teilt Safaris Cookie-Jar
   (OAuth-Session + Refresh-Rotation laufen weiter). `display-mode: standalone` →
   die BETRIEB-Karte zeigt „Installiert / Kiosk".

### Option B — Chrome/Edge „Install as app"
1. Chrome/Edge → URL öffnen → einloggen.
2. Menü → **Installieren …** (bzw. `chrome://apps`).
3. Optional echter Vollbild-Kiosk beim Start:
   `open -a "Google Chrome" --args --kiosk --app=https://delta-ai-01.tailbc3df5.ts.net:9119/mikael-os`

### Option C — echter Auto-Start-Kiosk via LaunchAgent (für „läuft nach Neustart von selbst")
`~/Library/LaunchAgents/com.delta.mikaelos-kiosk.plist` (RunAtLoad + KeepAlive),
startet den Browser im `--kiosk --app`-Modus. Zusätzlich Tailscale.app **und** den
Browser unter Systemeinstellungen → Allgemein → Anmeldeobjekte eintragen, damit
beides nach Neustart/Wake automatisch läuft.

---

## 2. Auto-Login / Auto-Unlock (Operator-Entscheid nötig)

- Systemeinstellungen → Benutzer & Gruppen → **Automatische Anmeldung** aktiviert
  den Login ohne Passwort — **kollidiert mit FileVault** (dann ist Auto-Login
  gesperrt). Abwägung Sicherheit vs. Kiosk-Verfügbarkeit → **Operator entscheidet**,
  hier nicht vorentschieden.

## 3. Energiesparen

- Systemeinstellungen → Energie sparen: **Bildschirm-Ruhezustand im Netzbetrieb
  deaktivieren** (Display bleibt an).
- System-Schlaf **nicht** pauschal abschalten ohne Operator-Freigabe
  (Strom-/Sicherheits-Tradeoff auf einem Shared-Host).
- Reconnect nach Wach/Schlaf ist abgedeckt: die Fläche liest bei
  `online` / `focus` / `visibilitychange` alle Read-Modelle sofort neu — der
  aktuelle Zustand erscheint ohne manuelles Neuladen (Karte „Anzeige & Verbindung"
  → Zeile „Reconnect").

---

## 4. PWA / Offline-Shell — was das Plugin kann und was der Host braucht

**Im Plugin bereits enthalten (soweit machbar):**
- Manifest: `GET /api/plugins/mikael-os/pwa/manifest.webmanifest`
- Service-Worker: `GET /api/plugins/mikael-os/pwa/sw.js` (Header
  `Service-Worker-Allowed: /`, cache-first für die App-Shell, nur GET —
  nie ein Write/Propose-Pfad)
- Offline-Shell: `GET /api/plugins/mikael-os/pwa/offline.html`
- Icon: `GET /api/plugins/mikael-os/pwa/icon.svg`
- Die Szene hängt den `<link rel=manifest>` zur Laufzeit selbst in den `<head>`
  und registriert den Service-Worker (Scope `/`). Status sichtbar in der Karte
  „Anzeige & Verbindung" (PWA-Manifest / Service-Worker).

**Was der Host zusätzlich braucht (außerhalb des Plugins, ehrlich deferred):**
- Für ein *vollständig* installierbares PWA (Install-Prompt, garantierter
  Offline-Kaltstart) einen **statischen `<link rel="manifest">` in
  `nous-hermes-agent` `web/index.html`** + ggf. einen root-scoped Service-Worker
  dort. Das ist eine Host-Änderung im Repo `nous-hermes-agent`, kein Plugin-Change.
  Bis dahin genügt Option A/B/C aus §1 (Dock-/Kiosk-Fenster) für den 24/7-Betrieb;
  die Laufzeit-Injektion des Plugins deckt den Rest ab, soweit der Browser sie
  im gemeinsamen SPA-`<head>` zulässt.

---

## 5. Mac-Steuerung aktivieren (heute deferred → so wird sie real)

Die vier Aktionen der Karte „Mac-Steuerung" (Fenster/App fokussieren · Fläche
öffnen · Widgets ordnen · Datei/Ansicht zeigen) sind **typisiert + propose-only**.
Ein Klick baut nur eine **Dry-Run-Vorschau** (Intent + voraussichtliches Gate) —
das Plugin öffnet **nie** ssh/shell/exec und sendet **nie** eine Geräte-Aktion.
Jede Aktion zeigt einen `deferred`-Lock: *„Ausführung über Control-Plane-
Capability folgt".*

Damit eine Aktion real ausführbar wird (Reihenfolge, alle Schritte gated):
1. **Typisierte Capability in delta-ops** anlegen/erweitern
   (`DEVICE_ACTIONS` / `capability_profiles.py`): enge Argument-Whitelist
   `{device, capability, reason}`, feste Capability-ID, kein Modelltext im
   Shell-String. Für `focus_window` existiert bereits die grüne Capability
   `browser_focus`; `open_surface`/`arrange_widgets`/`show_file` brauchen je eine
   **neue** typisierte Zeile (+ ggf. URL-/Layout-/Datei-Whitelist).
2. **PR + Review** im delta-ops-Repo (Branch → PR → squash, nie direkt auf main).
3. **Scoped Proxy / Rev6-ActionApproval** als Execution-Grenze
   (Lease/Fence/Nonce, exakter Intent-Hash, Attestierung, Readback/Receipt) —
   die kanonische Ausführungs-Lane (`JARVIS-UNIVERSAL-JOB-ADR.md`).
4. **Operator-Go**: grüne Capability → autonom über die typisierte Lane; alles
   andere bleibt Pending-Approval-Card (`propose_device_exec`), die der Operator
   `pending → allow` flippt.

Bis 1–4 stehen, bleibt jede Aktion in der UI ein Vorschlag mit `deferred`-Lock —
**kein Shell-Autopilot, kein stiller „erledigt"-Zustand.**

---

## 6. Drei-Frontdoor-Kontext (nur Info, read-only)

Die Karte „Drei Frontdoors" zeigt ehrlich, wie die Job-Wahrheit geteilt ist:
- **Dashboard (MIKAEL OS) = Leser** — liest mission.v2 + Approval-Cards read-only.
- **Telegram (Operator-Bot / Jarvis) = Schreiber** — `jarvis_frontdoor.py` legt/
  bindet dieselbe Mission (`MissionStore.create/transition/bind_task/correlate_channel`).
- **Hermes-App = nicht beobachtet** — im Code nicht als eigener Akteur sichtbar;
  wird ehrlich als solcher ausgewiesen, nicht als symmetrisch angebunden behauptet.
- Sichtbare Lücken (nicht verschwiegen): Approval-Cards ohne `mission_id` (nur
  `task_id`); `channel_correlations` sonst nirgends exponiert; Hermes-App unbeobachtet.

---

## 7. Smoke nach Setup

- Kiosk-Fenster zeigt `/mikael-os`, oben rechts „N Live · M Konzept".
- „Betrieb 24/7" öffnen → Karte „Anzeige & Verbindung" zeigt „Installiert / Kiosk"
  (nicht Browser-Tab), „online", 4 Read-Modelle „erreichbar".
- Mac-Steuerung: ein Klick auf eine Aktion zeigt die Dry-Run-Vorschau + `deferred`-
  Lock; es wird **nichts** ausgeführt.
- Nach kurzem Schlaf/Wach: Zustand aktualisiert sich beim Zurückkehren von selbst.
