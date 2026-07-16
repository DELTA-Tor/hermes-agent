# RUNBOOK — WHOOP_INTERNAL_TOKEN ins Nous-Dashboard bringen (Operator, gated)

**Ziel:** Das MIKAEL-OS-Plugin (läuft in-process im `nous-hermes-dashboard.service`)
soll `GET http://127.0.0.1:18090/internal/summary` mit `Authorization: Bearer <token>`
aufrufen dürfen. Bis dahin bleibt das Körper/WHOOP-Modul ehrlich `partial`
(„Verbunden · Detailwerte nicht im Plugin-Kontext").

**Warum dieser Weg:** Das Plugin erbt exakt das Env des Dashboard-Prozesses
(kein eigener Exec, keine eigene Sandbox). Der WHOOP-Dienst selbst
(`jarvis-whoop.service`, :18090) zieht den Token zur Laufzeit direkt aus SOPS —
nur der *Client* braucht ihn als Env-Var. Der Token-**Wert** wird dabei nie in
Unit-Files, Git oder Logs geschrieben; nur der Key-**Name** erscheint hier:
`whoop/WHOOP_INTERNAL_TOKEN` (prüfbar mit `secret list whoop`).

## Schritte (1–3 sind gefahrlos; Schritt 4 ist das Gate)

1. **Env-Datei rendern** — nach dem bestehenden Muster `/srv/stack/compose/*-up.sh`
   (Secrets werden zur Deploy-Zeit in eine 0600-Datei gerendert, nie committed).
   Ablage in `/srv/delta/data/nous-hermes/` — das ist bereits `ReadWritePaths`
   der Dashboard-Unit; **nicht** unter `/home/ubuntu/Dev/...` (`ProtectHome=read-only`):

   ```bash
   umask 077
   printf 'WHOOP_INTERNAL_TOKEN=%s\n' "$(secret get whoop/WHOOP_INTERNAL_TOKEN)" \
     > /srv/delta/data/nous-hermes/.env.runtime
   ```

   Diesen Render-Schritt nicht als Einmal-Handgriff belassen, sondern ins
   versionierte Deploy-Skript des Dashboards aufnehmen, damit er bei jedem
   Deploy reproduziert wird.

2. **systemd-Drop-in anlegen** —
   `~/.config/systemd/user/nous-hermes-dashboard.service.d/95-whoop.conf`:

   ```ini
   [Service]
   EnvironmentFile=-/srv/delta/data/nous-hermes/.env.runtime
   ```

   (Präfix `-` = tolerant, falls die Datei fehlt/nicht gerendert ist — dann
   bleibt das Modul einfach ehrlich `partial`.)

3. **daemon-reload** (verändert keinen laufenden Prozess, kein Gate):

   ```bash
   systemctl --user daemon-reload
   ```

4. **⛔ GATE — Prod-Restart (Operator-Freigabe nötig, CLAUDE.md Regel 1):**

   ```bash
   systemctl --user restart nous-hermes-dashboard.service
   ```

   Erst dieser Restart lädt das Env in den Dashboard-Prozess. Ohne Freigabe
   nicht ausführen.

## Verifikation (danach, alles read-only)

```bash
# 1. Env im Prozess angekommen? (zeigt nur ob der KEY gesetzt ist, nie den Wert)
systemctl --user show nous-hermes-dashboard.service -p EnvironmentFiles
tr '\0' '\n' < /proc/$(systemctl --user show -p MainPID --value nous-hermes-dashboard.service)/environ \
  | grep -c '^WHOOP_INTERNAL_TOKEN='   # erwartet: 1

# 2. Plugin sieht den Token? (boolean, kein Wert)
curl -s http://127.0.0.1:9120/api/plugins/mikael-os/health | python3 -m json.tool \
  | grep whoop_token_present            # erwartet: true

# 3. Modul liefert echte Werte?
curl -s http://127.0.0.1:9120/api/plugins/mikael-os/module/body | python3 -m json.tool \
  | grep -E '"state"|"summary"'         # erwartet: state fresh/stale + "Recovery …%"
```

## Rollback

Drop-in `95-whoop.conf` und `/srv/delta/data/nous-hermes/.env.runtime` löschen,
`daemon-reload`, Restart (wieder Gate). Das Modul fällt automatisch auf den
ehrlichen `partial`-Zustand zurück — kein Code-Change nötig.

## Sicherheitsinvarianten

- Token-Wert NIE in Logs, Git, Unit-Files oder diese Doku — nur SOPS
  (`secret get whoop/WHOOP_INTERNAL_TOKEN`) und die 0600-Runtime-Datei.
- Das Plugin liest den Token per `os.environ` zur Laufzeit (`_whoop_token()` in
  `dashboard/plugin_api.py`) und sendet ihn ausschließlich als Bearer an
  `127.0.0.1:18090` (loopback, nie exponieren).
- Kein Eingriff an `jarvis-whoop.service` nötig — der Dienst bleibt unberührt.
