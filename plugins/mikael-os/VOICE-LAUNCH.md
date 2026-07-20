# Jarvis Voice-Launch (MIKAEL OS)

## Zweck

Ein-Klick-Einstieg in eine Jarvis-Realtime-Sprachsession direkt aus dem
MIKAEL-OS-Dashboard (Desktop-Cockpit: Jarvis-Panel · Mobile: Jarvis-Tab).
Es wird **nichts neu gebaut** — das Plugin ruft nur den bestehenden,
getesteten Mint-Pfad auf:

```
/srv/delta/bin/jarvis-voice-launch "<Zweck>"
  → RealtimeMissionControl → POST 127.0.0.1:18086/internal/launch
```

## Ablauf

1. Button „🎙️ Jarvis starten“ → Bestätigungsdialog mit expliziter
   Budget-Wirkung („reserviert 5,50 $ vom Monatsbudget, Link 120 s gültig“).
2. `POST /api/plugins/mikael-os/jarvis/launch` startet den Launcher als
   Subprozess (Timeout 15 s), parst dessen JSON und antwortet mit
   `{launch_url, expires_at, reserved_usd, mission_id, session_id, ttl_seconds}`.
3. Frontend öffnet die Launch-URL per `window.open(_blank, noopener)`.
   Popup-Blocker-Fallback: klickbarer Anchor (`target=_blank rel=noopener`)
   mit ablaufendem TTL-Countdown im Dialog. **Kein iframe** — voice-web
   sendet `X-Frame-Options: DENY` + `frame-ancestors 'none'`.

## Budget-Wirkung und Leitplanken

- Jeder erfolgreiche Mint reserviert **5,50 $** gegen die
  **25-$-Monatskappe** — vier offene Reservierungen blockieren den fünften
  Start. Deshalb: **In-Memory-Debounce** — solange ein gemintetes Token nicht
  abgelaufen ist, antwortet ein zweiter Aufruf `409` mit Rest-TTL statt neu
  zu minten. Ein Subprozess-Timeout sperrt konservativ die volle TTL (der
  interne POST kann kurz vor dem Kill durchgegangen sein).
- Das Capability-Token (HMAC, TTL ~120 s, Einmal-Bootstrap, als
  `#capability=`-Fragment in der URL) existiert **nur in der einen
  HTTP-Antwort**: nie geloggt, nie persistiert; der Debounce-Zustand hält nur
  Ablaufzeitpunkt + Mission-Referenz.
- Launcher-Fehler (z. B. `realtime_prerequisite_missing`, wenn die
  Egress-Attestation abgelaufen ist) kommen als verständlicher
  `ok:false`-Status ans UI — nie als blindes 500. In diesen Fällen wurde
  nichts reserviert, der Debounce bleibt zu.

## Betriebshinweis (Deploy-Voraussetzung, NICHT Teil dieses PR)

Die Dashboard-Unit läuft mit `ProtectSystem=strict`. Der Launcher legt über
`MissionStore.create` Missionen unter `/srv/hermes/missions` an — ohne
Schreibrecht scheitert jeder Start. Deploy-Voraussetzung ist daher ein
systemd-**Drop-in** für `nous-hermes-dashboard.service`:

```ini
[Service]
ReadWritePaths=/srv/hermes/missions
```

Das Drop-in legt der Operator beim (gated) Deploy an; es gehört bewusst
nicht in diesen PR.

## Tests

`tests/plugins/test_mikael_os_voice_launch.py` — Subprozess strikt gemockt
(jeder echte Launcher-Aufruf reserviert 5,50 $!): Erfolg + Purpose-Durchleitung,
Debounce-409 mit Rest-TTL, Prerequisite-Status ohne Sperr-Fenster,
Timeout-Sperre, Launcher-Gibberish ohne stdout-Echo, Token nie in Log/State.
Frontend: `plugins/mikael-os/frontend/test/smoke.mjs` gegen das gebaute Bundle.
