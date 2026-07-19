# Konstruktionslehre in Mikael OS und Jarvis

## Betriebsmodell

Diese Integration ersetzt keine bewährte Lernfunktion. Sie verbindet die
bestehende Crashcamp-Anwendung mit dem bestehenden Mikael-OS-Learning-Center
und der Hermes/Jarvis-Werkzeugschicht.

- Crashcamp auf `127.0.0.1:13150` bleibt die spezialisierte Oberfläche und der
  getestete direkte Realtime-Fallback.
- `crashcamp_progress/progress.db` bleibt die einzige Wahrheit für
  Konstruktionslehre-Fortschritt, Quizresultate und Fehler.
- Der vorhandene Crashcamp-FTS-Index bleibt die einzige PDF-Suche für die neun
  FOM-Unterlagen. Es wird kein zweiter Vektor- oder Volltextindex angelegt.
- Anki bleibt die allgemeine Spaced-Repetition-Wahrheit von Mikael OS. Die
  Konstruktionslehre-Karten werden nicht nach Anki kopiert.
- Jarvis/Hermes stellt Dialog, Werkzeugwahl und nach erfolgreicher Abnahme die
  zentrale Realtime-Schicht. Die direkte Crashcamp-Realtime-Verbindung wird
  erst nach einem mindestens gleichwertigen Abnahmetest entfernt.

## Jarvis-Werkzeuge

Der Plugin-Toolset `mikael_learning` enthält:

- `search_learning_materials`
- `get_learning_progress`
- `record_learning_result`
- `get_due_flashcards`
- `start_or_continue_quiz`
- `get_mistakes`
- `get_current_study_block`

Neue Plugin-Toolsets werden von Hermes standardmäßig für die Plattformen
aktiviert, bis ein Operator sie ausdrücklich deaktiviert. Ein
`pre_llm_call`-Kontext weist Jarvis bei erkannten Konstruktionslehre-Turns auf
den verbindlichen Quellensuchlauf, Datei-/Seitenangabe, die ehrliche
Nichtbelegt-Antwort und genau eine Active-Recall-Frage an. Die Werkzeuge
registrieren sich nur als
verfügbar, wenn Crashcamp alle neun PDFs, mindestens 405 Quellseiten und eine
schreibbare Fortschrittsdatenbank meldet.

## Dashboard-API

Das vorhandene Learning Center projiziert Crashcamp als eigenen
Konstruktionslehre-Eintrag. Die vollständigen Funktionen sind über dieselben
Plugin-Routen erreichbar:

- `GET /api/plugins/mikael-os/learning/konstruktionslehre/overview`
- `POST /api/plugins/mikael-os/learning/konstruktionslehre/search`
- `GET|POST /api/plugins/mikael-os/learning/konstruktionslehre/progress`
- `GET /api/plugins/mikael-os/learning/konstruktionslehre/cards`
- `POST /api/plugins/mikael-os/learning/konstruktionslehre/quiz`
- `GET /api/plugins/mikael-os/learning/konstruktionslehre/mistakes`
- `GET /api/plugins/mikael-os/learning/konstruktionslehre/current-block`

## Konfiguration

Die sicheren Defaults sind:

```text
MIKAELOS_KONSTRUKTIONSLEHRE_BASE=http://127.0.0.1:13150
MIKAELOS_KONSTRUKTIONSLEHRE_COURSE=/home/ubuntu/Dev/mikael-konstruktionslehre/data/course.json
```

Der Adapter akzeptiert ausschließlich unverschlüsseltes HTTP zu Loopback. Er
liest keine API-Schlüssel und gibt keine Umgebungswerte aus.

## Produktions-Cutover

Der Code-Cutover besteht aus drei getrennten, gegateten Schritten:

1. Den geprüften PR per Squash-Merge promoten.
2. Den gepinnten `hermes-agent`-Stand aktualisieren und nur die betroffenen
   Nous-Hermes-Dashboard-/Gateway-Units neu starten.
3. Einen budgetierten Realtime-Abnahmelauf durchführen: deutscher Voice-Turn,
   Unterbrechung, nachweislicher `search_learning_materials`-Aufruf vor der
   Antwort, Datei/Seite und genau eine Active-Recall-Frage.

Die direkte Crashcamp-Realtime-Schicht bleibt bis zum erfolgreichen dritten
Schritt aktiv. Kein Schritt darf ohne die konkrete Operator-Freigabe ausgeführt
werden.

## Verifikation

Vor Promotion:

- Plugin-, Dashboard- und Hermes-Plugin-Tests über `scripts/run_tests.sh`
- Frontend-Produktions-Build und Smoke-Test
- Crashcamp-Lint, TypeScript-/Produktions-Build, Kursvalidierung und Docker-Build
- Live-Leseproben für Health, PDF-Suche, Nichttreffer, Karten, Quizfrage,
  Learning-Center-Projektion und Listener-Grenzen
- keine Live-Schreibprobe gegen Fortschritt; Schreibpfade werden isoliert mit
  gemockter Crashcamp-API geprüft

Nach gegatetem Deploy:

- exakte Deploy-SHA und Pin belegen
- Listener, Health und Logs der betroffenen Units prüfen
- alle sieben Werkzeuge im Runtime-Toolset nachweisen
- Text-E2E und genau einen budgetierten Realtime-E2E durchführen
- Fortschritt vor und nach einem separat freigegebenen Neustart vergleichen

## Rollback und Daten

Ein Code-Rollback pinnt `hermes-agent` auf den vorherigen SHA zurück und startet
nur die betroffenen Units nach separater Freigabe neu. Crashcamp, dessen Docker-
Volume und der direkte Realtime-Fallback werden dabei nicht verändert. Ein
Datenrollback ist für diese Integration nicht nötig, weil sie keine Migration
und keine zweite Fortschrittsdatenbank anlegt.
