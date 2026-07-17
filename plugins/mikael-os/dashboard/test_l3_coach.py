"""L-3 Lern-Coach backend tests — stdlib only, deterministic, zero network needed.

Run:  python3 test_l3_coach.py

Proves the read/propose-only contract:
  * exams.json is read read-only; countdown/pacing is honest (no faked Tagesziel
    when the collection is empty).
  * the Feynman grade is NEVER faked: with no Brain-Gateway token the evaluate
    call returns an honest pending (ok=False, jarvisDependent=True) — it does not
    invent feedback.
  * the Prüfungsplan proposal uses workspace=studium, dry-run previews without a
    gate fire, and money/customer/personnel objectives are refused (out_of_scope).
  * module_learning surfaces the nearest-Klausur countdown row.
The test never writes Anki and never calls /approvals/decide.
"""
import json
import os
import tempfile
from datetime import date, timedelta
from pathlib import Path

# Deterministic env BEFORE importing the module (constants bind env at import).
_TMP = tempfile.mkdtemp(prefix="mos-l3-")
_EXAMS = Path(_TMP) / "exams.json"
_D1 = (date.today() + timedelta(days=10)).isoformat()   # critical (<=7? no, tight/critical)
_D2 = (date.today() + timedelta(days=40)).isoformat()   # ok
_EXAMS.write_text(json.dumps({"exams": [
    {"fach": "Thermodynamik", "datum": _D1, "deck": "Thermodynamik",
     "themen": ["Erster Hauptsatz", "Entropie", "Carnot"]},
    {"fach": "Regelungstechnik", "datum": _D2, "themen": ["PID", "Nyquist"]},
]}), encoding="utf-8")

os.environ["MIKAELOS_EXAMS"] = str(_EXAMS)
os.environ["MIKAELOS_ANKI_DIR"] = str(Path(_TMP) / "no-such-anki")  # empty collection
os.environ["MIKAELOS_BRAIN_SECRET"] = "0"                            # no SOPS render in test
os.environ["MIKAELOS_BRAIN_GATEWAY"] = "http://127.0.0.1:6"          # force unreachable
os.environ.pop("MIKAELOS_BRAIN_TOKEN", None)
os.environ.pop("HERMES_GATEWAY_TOKEN", None)

import plugin_api as p  # noqa: E402

_fail = 0


def check(name, cond):
    global _fail
    print(("ok  " if cond else "FAIL") + " · " + name)
    if not cond:
        _fail += 1


# --- exams.json read-only ----------------------------------------------------
ex = p._read_exams()
check("exams parsed (2 Fächer)", ex["ok"] and len(ex["exams"]) == 2)
check("exams keeps deck + themen", ex["exams"][0]["deck"] == "Thermodynamik"
      and ex["exams"][0]["themen"][0] == "Erster Hauptsatz")

# --- pacing math: honest when Anki empty; ceil when linked -------------------
paced = p._pace_exam(ex["exams"][0], anki_ok=False, anki_decks=[])
check("pace: days ~10", paced["daysLeft"] == 10 and paced["valid"])
check("pace: honest goal when Anki empty",
      "synchronisiert" in paced["goalText"] and paced.get("dailyGoal") is None)
paced_linked = p._pace_exam(ex["exams"][0], anki_ok=True,
                            anki_decks=[{"name": "Thermodynamik", "due": 25}])
check("pace: Tagesziel = ceil(25/10)=3", paced_linked["dailyGoal"] == 3
      and "3 Karten/Tag" in paced_linked["goalText"])
paced_unlinked = p._pace_exam(ex["exams"][1], anki_ok=True, anki_decks=[])
check("pace: honest when no deck linked",
      "Kein Deck verknüpft" in paced_unlinked["goalText"]
      and paced_unlinked.get("dailyGoal") is None)

# --- study_plan (countdown) --------------------------------------------------
sp = p.study_plan()
check("study_plan ready", sp.get("reason") == "ready" and len(sp["rows"]) == 2)
check("study_plan sorted nearest first", sp["nextExam"]["fach"] == "Thermodynamik")
check("study_plan carries methods (7-skill methodik)", len(sp.get("methods") or []) >= 3)
check("study_plan workspace private", sp["workspace"] == "private")

# --- study_plan honest empty when config missing -----------------------------
os.environ_backup = os.environ.get("MIKAELOS_EXAMS")
p.EXAMS_PATH = Path(_TMP) / "does-not-exist.json"
sp_missing = p.study_plan()
check("study_plan honest 'missing'", sp_missing["state"] == "empty"
      and sp_missing["reason"] == "missing")
p.EXAMS_PATH = _EXAMS  # restore

# --- Feynman: NEVER faked ----------------------------------------------------
fs = p.feynman_setup()
check("feynman picks a concept from exams.json", fs["ok"] and bool(fs["concept"]))
check("feynman not ready without token/gateway", fs["jarvis"]["ready"] is False)
fe = p.feynman_evaluate(concept="Entropie", explanation="Irgendwas mit Unordnung.")
check("feynman evaluate honest-pending (not faked)",
      fe["ok"] is False and fe["jarvisDependent"] is True and "feedback" not in fe)
fe_empty = p.feynman_evaluate(concept="x", explanation="   ")
check("feynman rejects empty explanation", fe_empty["ok"] is False
      and fe_empty["reason"] == "no_explanation")

# --- Prüfungsplan propose: studium, dry-run, out-of-scope --------------------
d = p.propose_study_plan("Lernplan bis Thermodynamik-Klausur erstellen", dry_run=True)
check("propose dry-run ok + fires nothing", d["ok"] and d["willFire"] is False
      and d["mode"] == "dry_run")
check("propose workspace=studium", d["intent"]["workspace"] == "studium"
      and d["intent"]["jobType"] == "study_plan")
check("propose gate=studium_propose", d["intent"]["requiredGate"] == "studium_propose")
oos = p.propose_study_plan("rechnung an kunde schicken", dry_run=True)
check("propose refuses money/customer objective", oos["ok"] is False
      and oos["status"] == "out_of_scope")
empty = p.propose_study_plan("", dry_run=True)
check("propose refuses empty objective", empty["ok"] is False)

# --- module_learning carries the nearest-Klausur countdown -------------------
ml = p.module_learning()
check("module_learning has coach + nextExam", ml.get("hasCoach") is True
      and ml.get("nextExam") is not None)
check("module_learning countdown row present",
      any(r.get("icon") == "calendar-clock" for r in ml["rows"]))

print()
print("RESULT:", "ALL PASS" if _fail == 0 else f"{_fail} FAILURE(S)")
raise SystemExit(1 if _fail else 0)
