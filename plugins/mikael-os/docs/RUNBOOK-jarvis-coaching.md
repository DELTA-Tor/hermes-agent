# RUNBOOK — Jarvis-Coaching-Anbindung (L-3 Lern-Coach, Feynman-Bewertung)

> **Stand PR #3:** Die unten beschriebene manuelle Token-Auflösung ist abgelöst
> und darf nicht ausgeführt werden. Das Plugin akzeptiert nur noch die
> zweckgebundene Runtime-Injection `MIKAELOS_BRAIN_TOKEN` aus dem versionierten,
> typisierten Dashboard-Launcher. Kein Plugin-Subprozess und kein Klartext in
> Unit, Drop-in, Prompt oder Log. Der Launcher-/Deploy-Schritt bleibt separat
> gated und ist nicht Teil dieses PRs.

Der **Feynman-Flow** im Lern-Coach lässt eine freie Erklärung **von Jarvis** bewerten
— nie vom Plugin gefaked. Technisch ruft `plugin_api.py` dafür die **Hermes Brain
Gateway** (`POST /v1/chat/completions`, die abo-first Brain-Kette, loopback
`127.0.0.1:18084`). Das ist ein **READ/Coaching-Call**: keine Geschäfts-/Anki-Writes,
keine Mission, kein Gate. Er braucht nur das Gateway-Bearer-Token.

## Zustände (ehrlich)
- **Jarvis bereit** — Gateway erreichbar **und** Token auflösbar → echte Bewertung.
- **Jarvis-Bewertung ausstehend** — Gateway nicht erreichbar **oder** kein Token →
  die Erklärung wird **nicht** bewertet, es wird **nichts** erfunden und **nichts**
  gespeichert. Die UI kennzeichnet das (`jarvisDependent`).

## Token-Auflösung (zur Laufzeit, nie auf Disk / nie geloggt)
`plugin_api._brain_token()` versucht in dieser Reihenfolge:
1. Env `MIKAELOS_BRAIN_TOKEN`
2. Env `HERMES_GATEWAY_TOKEN` (derselbe Name, den der Gateway-Dienst nutzt)
3. SOPS-Render `secret get hermes/GATEWAY_TOKEN` (der sanktionierte Secret-Pfad;
   deaktivierbar mit `MIKAELOS_BRAIN_SECRET=0`)

Der Wert wird nur prozess-intern gecacht. Er landet nie in Logs, Configs oder Antworten.

## Anbindung fest verdrahten (optional, Operator-Schritt — Prod-Restart-Gate)
Wenn der SOPS-Pfad im Dashboard-Prozess nicht verfügbar ist, kann das Token als
EnvironmentFile-Drop-in gesetzt werden (analog zu `RUNBOOK-whoop-token.md`):

```
# ~/.config/systemd/user/nous-hermes-dashboard.service.d/brain-token.conf
[Service]
Environment=HERMES_GATEWAY_TOKEN=<wert aus: secret get hermes/GATEWAY_TOKEN>
```
danach `systemctl --user daemon-reload && systemctl --user restart nous-hermes-dashboard`
(**Prod-Restart = Operator-Gate**). Das Token NIE in die Unit selbst schreiben.

## Env-Overrides
- `MIKAELOS_BRAIN_GATEWAY` (default `http://127.0.0.1:18084`)
- `MIKAELOS_BRAIN_MODEL` (default `jarvis`)
- `MIKAELOS_BRAIN_TIMEOUT` (default `45` s — eine LLM-Runde dauert länger als ein Read)
- `MIKAELOS_BRAIN_SECRET=0` — SOPS-Render abschalten (nur Env-Token nutzen)

## Grenzen (hart)
- Nur `/v1/chat/completions` (Coaching). Keine Mission, kein `/actions`, kein
  `/approvals/decide` aus diesem Pfad.
- Die Anki-Collection wird **nie** geschrieben. Die echte Karten-Bewertung/Persistenz
  bleibt Anki/AnkiDroid vorbehalten — MIKAEL OS liest nur (mode=ro).
