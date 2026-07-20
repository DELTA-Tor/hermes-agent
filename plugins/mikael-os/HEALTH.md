# Mikael Health (WHOOP) in Mikael OS und Jarvis

## Zweck

Privates, read-only Gesundheits-Toolset `mikael_health` für Jarvis. Datenquelle
ist ausschließlich der laufende jarvis-whoop-Connector auf
`127.0.0.1:18090` (`/internal/*`, Bearer `WHOOP_INTERNAL_TOKEN`). Der Adapter
ruft nie `api.prod.whoop.com` direkt auf — die Single-Use-Refresh-Rotation
lebt allein im Connector, ein zweiter Client würde die Verbindung zerstören.
Grenzen der internen API: `limit<=25`, `days<=90`; die Tools begrenzen
zusätzlich auf `days<=30`.

## Werkzeuge

- `get_health_status` — Connector-Health plus Datenverfügbarkeit (7-Tage-Fenster)
- `get_recovery_trend(days<=30)` — Recovery-Score, HRV, Ruhepuls je Tag + Kurzstatistik
- `get_sleep_trend(days<=30)` — Schlafdauer, Performance, Konsistenz je Nacht (Naps ausgenommen)
- `get_strain_overview(days<=30)` — Tages-Strain plus Workouts des Fensters
- `get_today_readiness` — heutige Kernwerte kompakt („Wie fit bin ich heute?")

Alle Werkzeuge sind read-only und liefern Rohzahlen mit knapper Einordnung
(WHOOP-Zonen grün/gelb/rot), aber keine Diagnosen. Ein
`pre_llm_call`-Kontext verpflichtet Jarvis bei Gesundheits- und
Ernährungs-Turns darauf, Werte immer erst per Tool zu holen (nie zu schätzen),
Essenspläne nur als propose-only-Vorschläge zu machen (easy plus
anspruchsvollere Gerichte, effektiv vs. lecker gekennzeichnet) und bei
medizinisch auffälligen Werten auf einen Arzt zu verweisen.

## Aktivierung (Operator-Gate)

Der Toolset ist bewusst default-off (`_DEFAULT_OFF_TOOLSETS`). Die Werkzeuge
registrieren sich außerdem nur, wenn `GET /healthz` des Connectors
`ok:true` und `connected:true` liefert (silent `check_fn`-Gate). Aktiviert
wird `mikael_health` ausschließlich über einen expliziten
`platform_toolsets`-Eintrag der freigegebenen Jarvis-Plattform — dieser
Schritt ist Teil des gegateten Produktions-Cutovers und braucht die konkrete
Operator-Freigabe.

## Privat-Doktrin

WHOOP-Daten sind privat (Mandant PRIVATE). Sie werden nie in Firmen-Kontexte
getragen: kein Write und kein Kontext-Transfer nach FSM, Qdrant, sevDesk,
Neo4j oder andere DELTA-/Wensauer-Datenbestände. Der Adapter loggt keine
Werte und gibt niemals Token oder Header aus; Fehlermeldungen sind bewusst
knapp und secret-frei.

## Konfiguration

```text
MIKAELOS_WHOOP_BASE=http://127.0.0.1:18090   # nur Loopback-HTTP erlaubt
WHOOP_INTERNAL_TOKEN=<über SOPS-Env-Injektion, nie im Klartext>
```

Das Token kommt nach bestehendem Muster über die Umgebung bzw.
`~/.hermes/.env` (`hermes_cli.config.get_env_value`); SOPS bleibt der einzige
Secret-Store.
