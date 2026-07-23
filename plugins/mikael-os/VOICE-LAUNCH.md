# Jarvis Realtime im MIKAEL OS

## Zielbild

MIKAEL OS ist die eine persönliche Jarvis-Frontdoor. Realtime läuft direkt im
Voice Command Deck derselben PWA; es gibt weder einen ablaufenden Link im
Browser noch einen zweiten Voice-Tab.

Text, Telegram und Voice referenzieren dieselbe `mission.v2`-Mission und die
gemeinsamen Outcome-/Memory-Projektionen. Hermes bleibt Gate- und Tool-Spine.

## Ablauf

1. Das Dashboard liest `GET /jarvis/voice/status`. Die Antwort enthält nur
   sanitisierte Readiness- und Policy-Felder.
2. Mikael klickt bewusst auf Start. Erst wird die Mikrofon-Berechtigung
   geprüft; anschließend zeigt das UI den exakten Reservierungsbetrag der
   aktiven Policy.
3. `POST /jarvis/voice/prepare` nutzt den bestehenden
   `/srv/delta/bin/jarvis-voice-launch`-Pfad und tauscht die einmalige
   Capability sofort serverseitig an voice-web `/bootstrap`.
4. Der Browser erhält nur einen opaken lokalen Handle. Capability,
   Bootstrap-Token, Nonce und Control-Token bleiben im Dashboard-Prozess.
5. Der Browser erzeugt WebRTC-SDP. `POST /jarvis/voice/session` leitet genau
   diesen SDP-Austausch über Loopback weiter und gibt nur SDP-Antwort sowie
   sanitisierte Sitzungsdaten zurück.
6. Audio und Realtime-Ereignisse laufen über WebRTC. Tool- und
   Business-Logik laufen im Hermes-Sideband. Im UI erscheinen nur Ziel, Plan,
   Schritt, Tool, Ergebnis und Evidenz — keine Modellgedanken.
7. `POST /jarvis/voice/control` serialisiert Status und Hangup. Ein
   unterbrochener Zustand wird sichtbar; ein neuer kostenwirksamer Versuch
   braucht erneut den bewussten Start.

Der alte Bookmark `/jarvis/launch/go` mintet nicht mehr. Er leitet stabil auf
`/mikael-os?voice=1` und öffnet dort den eingebetteten Bestätigungsdialog.

## Sicherheits- und Authority-Grenzen

- Kein Provider-Secret und kein voice-web-Control-Token erreicht den Browser.
- Kein Token wird geloggt, persistiert oder in eine URL geschrieben.
- Provider-/Budgetnutzung beginnt nur nach dem expliziten Start.
- Tool-Aufrufe laufen ausschließlich über Hermes-Sideband und dessen Gates.
- Mikaels private Lane darf interne Authority nutzen; Firmenoberflächen bleiben
  mandantengebunden. Geld, externer Kundenversand/bindende Zusagen und
  Truth-Schemaänderungen bleiben gegatet.
- Es gibt keine direkten `fsm.db`-Writes und keine öffentliche Exposition.

## Fehler und Reconnect

- Mikrofon verweigert: keine Reservierung.
- Bootstrap-/Session-Fehler: keine automatische Provider-Wiederholung.
- WebRTC kurz getrennt: fünf Sekunden Grace-Window.
- Danach: sichtbarer Fehler, bestmöglicher Hangup/Reconcile und erneute
  Bestätigung vor einem neuen Versuch.
- Text in derselben PWA sowie Telegram bleiben als Fallback verfügbar.

## Tests

`tests/plugins/test_mikael_os_voice_launch.py` mockt Launcher, Bootstrap,
SDP und Sideband vollständig. Die Tests prüfen Debounce, Fehlerzustände,
serverseitige Tokenhaltung, sanitisierte Antworten, ungültige Handles und
sequenzielles Control. Ein Test ruft niemals den echten Provider auf.

`plugins/mikael-os/frontend/test/smoke.mjs` lädt das gebaute Plugin gegen den
Host-SDK-Vertrag und verifiziert den Voice Command Deck als Default-Screen.

## Offizielle OpenAI-Grundlagen

- <https://developers.openai.com/api/docs/guides/realtime-webrtc>
- <https://developers.openai.com/api/docs/guides/realtime-server-controls>
- <https://developers.openai.com/api/docs/guides/realtime-conversations>
- <https://developers.openai.com/api/docs/models/gpt-realtime-2.1>
