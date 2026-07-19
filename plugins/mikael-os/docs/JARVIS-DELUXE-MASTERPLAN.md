# JARVIS DELUXE — MIKAEL OS Masterplan

> **Status: AKTIV** · Operator-Oberdoktrin 17.07.2026 · Owner: Claude (Bau) + Operator (Gates)
> Dieser Plan ist der dauerhafte, sichtbare Arbeitsstrang **über** der Learning-Welt.
> Memory: `jarvis-deluxe-oberdoktrin.md`. Zugehörige Referenzen: `design-referenz-welle3`,
> `learning-stack-mikael-os`, `leanfsm-jarvis-intake-design`, `jarvis-reach-not-authority`.

## Nordstern
MIKAEL OS ist Mikaels **persönlicher 24/7-Startpunkt** auf dem Mac mini — ein visuell
außergewöhnliches, schnelles, räumlich klares **Command Center** („Jarvis Deluxe"), nicht
eine FSM-Unterseite und keine generische SaaS-Startseite. Es **orchestriert** Tag,
Entscheidungen, Gesundheit, Lernen und Systeme, **ohne eine zweite Geschäftswahrheit zu
erfinden**. FSM/sevDesk/Paperless/Kalender/WHOOP behalten ihre je eigene Wahrheit; MIKAEL OS
ist die **persönliche Orchestrierungs- und Erlebnis-Schicht** darüber.

## Harte Architekturregeln (gelten für jede Fläche)
1. **Read-Projektionen** tragen immer `source · observedAt · staleAfterSeconds · permission · workspace`.
2. **Writes ausschließlich** über bestehende propose-/Gate-Wege: Phase-3 `propose` (dry_run=True
   default) → gated `POST /actions` (:18083) → `/approvals/decide` (**operator-only**, nie aus dem Plugin).
3. **Workspaces strikt getrennt** — technisch + sichtbar: `private` · `company_signal` · `engineering`.
4. **Kein zweites Backend**: keine neue Task-/Business-/SR-DB nur weil ein Dashboard gebaut wird.
   Kein n8n-Gehirn. Anki bleibt SR-Wahrheit, mission.v2 bleibt Job-Wahrheit, fsm.db bleibt Auftrags-Wahrheit.
5. **Gated bleibt gated**: Geld · Kundenzusagen · Personal · destruktive Aktionen · Prod-Restart · externer
   Versand · Schema-Migrationen → Operator-Approval. Jarvis darf maximal *fähig* sein (lesen/erklären/
   bauen/Werkzeuge/kontrollieren/erinnern/proaktiv), aber **Authority bleibt getrennt**.
6. **Mac-mini-Steuerung nur typisiert**: Fenster/App fokussieren, definierte Fläche öffnen, Widgets
   ordnen, Datei/Ansicht zeigen. **Kein freier Shell-Autopilot.**
7. **Drei Frontdoors, ein Gehirn**: Dashboard (primär) + Telegram + Hermes-App teilen denselben
   Gesprächs-/Aktions-/Approval-Kontext — nicht drei getrennte Gehirne.
8. Kein Deploy/Restart/Merge/Versand/Schema-Write ohne Gate. Lokale Builds/Screenshots/Tests/Draft-PR autonom.

## Bereichs-Matrix (12 Bereiche — Learning ist 1 davon)

| # | Bereich | Datenquelle | Truth Owner | Zustand | Kern-Interaktionen | Gates | Desktop / Mobile |
|---|---------|-------------|-------------|---------|--------------------|-------|------------------|
| 1 | **HEUTE** | calendar-evidence.db (:ro), mission.v2 | Kalender/Mission | **LIVE** (privat) + company_signal getrennt | Fokusblöcke, Tagesziele, Engpässe ansehen; Block planen (propose) | Termin-Write gated | beide |
| 2 | **JARVIS LIVE** | Control-Plane :18083 (/voice,/rag,/actions) | Hermes/Nous | **NEU** (Chat da, Bereich fehlt) | Echtzeit-Chat, Voice (später), proaktive Hinweise, „erklär den Zustand", Karten öffnen/verschieben/filtern/fokussieren | Aktionen über /actions gated | beide, Desktop-first |
| 3 | **ENTSCHEIDUNGEN & APPROVALS** | /srv/hermes/approvals, mission.v2 | Hermes-Gate | **LIVE** (company_signal) → dediziertes Center NEU | Approval-Cards sehen, Intent-Hash prüfen; entscheiden = operator | Geld/Kunde/Personal/Restart | beide |
| 4 | **FIRMA / Rise-L** | fsm.db/Cockpit :18065, billing/dispo/wartung, Paperless :18075, systemd+schedule_state | FSM/sevDesk/Paperless | **TEILS** (risel+company live, FSM-Projektion NEU) | read-only Projektion + **Deep-Links** ins Fachsystem; „was läuft gerade?" | nur lesen, Deep-Link | beide |
| 5 | **KALENDER & PLANUNG** | calendar-evidence.db (:ro), FSM-Dispo (company_signal) | Kalender/FSM | **LIVE** privat, Dispo read-only | Woche/Monat, Fokuszeit; privat vs. company_signal getrennt | Dispo-Write gated | beide |
| 6 | **LEARNING** | Anki collection (:ro), exams.json, py-fsrs | Anki (SR) | **LIVE** L-1…L-3 (L-4 geparkt) | Due-Signale, Review/Drill-Vorschau, Lern-Coach, Prüfungsplan (propose) | Plan-Mission gated | beide |
| 7 | **GESUNDHEIT** | WHOOP-Connector :18090 | WHOOP | **PARTIAL** (Token-Gate offen) | Recovery/Schlaf/Strain/Training/Ernährung; ehrlich partial | Token-Setup operator | beide |
| 8 | **ZIELE & SYSTEME** | mission.v2 + task_priority_policy.yaml | Mission | **TEILS** (tasks live, Ausbau NEU) | Jahr/Quartal/Gewohnheiten/Rhythmen als **Views** (keine neue DB) | Write via Gate | beide |
| 9 | **WISSEN & SUCHE** | unified-search :18055 (gbrain+Qdrant+Paperless), Sessions | jeweilige Quelle | **NEU** | Suche mit Herkunft + Workspace-Grenzen; Notizen/Sessions/Docs | nur lesen | beide |
| 10 | **REFLEXION** | Journal-Quelle (zu wählen), Entscheidungs-Log | privat | **NEU** (heute Konzept) | Journal, Entscheidungen, Lernerkenntnisse, Führung | privat, kein Versand | beide |
| 11 | **KOMMUNIKATION** | Telegram (Operator-Bot), Hermes-Outbox, FreeScout :18070 | jeweilige Quelle | **NEU** | Inbox-Signale read-only; **kein** unkontrollierter Versand | Versand gated (G7) | beide |
| 12 | **SESSION- / AGENTEN-STEUERUNG** | mission.v2 job_projection, session_broker | Hermes/Mission | **TEILS** (engineering live) | 3 aktive Arbeitsstränge + Agenten sehen/öffnen/verfolgen | Steer gated | beide, Desktop-first |

## Bestand vs. Lücke (17.07.)
**Wiederverwenden (steht):** Spatial-Constellation-Shell (Jarvis-Orb, orbitale Module, Fokus-Linse,
Command-Bar, Status-Maschine BEREIT/HÖRT-ZU/DENKT/VORSCHLAG/AUSFÜHRUNG/VERIFIZIERT), Workspace-Switch,
`_prov`-Envelope, Phase-3-Lifecycle, 8 Module mit echten Quellen (today, kalender, tasks, learning,
risel, company, body, engineering). → Die „Jarvis Deluxe"-Ästhetik ist im Kern **schon da**.
**Echt fehlend:** JARVIS-LIVE (First-Class), FIRMA/Rise-L Deep-Projektionen+Deep-Links, WISSEN&SUCHE,
KOMMUNIKATION, ZIELE&SYSTEME-Ausbau, REFLEXION-Wiring, Approval-Center, 24/7-Mac-mini-Anzeigeweg
(PWA/Kiosk/Autostart — kein voreiliger zweiter App-Stack), typisierte Mac-mini-Capabilities,
Drei-Frontdoor-Shared-Context.

## Implementierungsreihenfolge
- **M0 — Master-Design** *(jetzt)*: 3 ImageGen-Master-Startflächen-Varianten (verschiedene
  Info-Architektur-Thesen) → kritischer Vergleich → eine wählen/synthetisieren. Danach pro Bereich
  eigenes Mockup.
- **M1 — Premium-Shell + JARVIS LIVE + HEUTE** *(erste vertikale Scheibe)*: die gewählte Master-Fläche
  real bauen; Jarvis-Live als First-Class-Bereich (Echtzeit-Chat, kontext-Aktionen, „erklär den Zustand");
  Heute mit strikter privat/company_signal-Trennung. Learning sauber eingehängt.
- **M2 — FIRMA/Rise-L + ENTSCHEIDUNGEN**: read-only FSM/Billing/Dispo/Wartung/Doku-Projektion + Deep-Links;
  dediziertes Approval-Center (Intent-Hash, gated).
- **M3 — WISSEN&SUCHE + KOMMUNIKATION + SESSION-STEUERUNG**: unified-search-Projektion; Inbox-Signale
  read-only; 3-Arbeitsstränge-Sicht.
- **M4 — ZIELE&SYSTEME + REFLEXION + GESUNDHEIT-Vervollständigung**: Views auf mission.v2; Journal-Wiring;
  WHOOP-Token-Gate.
- **M5 — 24/7-Betrieb**: bester Mac-mini-Anzeigeweg (PWA/Kiosk/Autostart, Reconnect→Zustand sofort);
  typisierte Mac-mini-Steuer-Capabilities; Drei-Frontdoor-Shared-Context verdrahten.

## ImageGen-Arbeitsweise
Pro Bereich eigener spezifischer Prompt + sichtbarer Zustandsentwurf (nicht 1 Bild für alle). Bestehende
V3-Design-Sprache (dunkle cinematische Konstellation, Jarvis-Orb, glasige Module, violet/blau, deutsche
Copy) weiterentwickeln — nicht neu erfinden. **Verboten:** Text-/Logo-Bilder als Produktionsasset,
Platzhalter-Kunst, generische Diagramm-Kartenwüste. Jede gebaute Fläche gegen ihr gewähltes Mockup bei
festen Viewports vergleichen (Navigation, Dialog, Module, Drag/Focus, Reconnect, Empty/Error/Stale/Approval real).

## QA-Kontrakt je gebauter Fläche
200-Antwort · Hit-Log schreibt · Empty/Error/Stale/Approval-Zustände real · Reconnect zeigt sofort
aktuellen Zustand · Screenshot gegen Mockup bei festem Viewport · Tests grün · nur `plugins/mikael-os/**`
· 0 Business-Writes · kein Deploy/Merge ohne Gate.
