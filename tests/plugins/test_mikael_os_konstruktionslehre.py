"""Behavior contracts for the Mikael OS Konstruktionslehre integration."""

from __future__ import annotations

import importlib.util
import json
import sys
import types
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest


ROOT = Path(__file__).resolve().parents[2]
PLUGIN_ROOT = ROOT / "plugins" / "mikael-os"


@pytest.fixture()
def adapter(tmp_path, monkeypatch):
    name = f"konstruktionslehre_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(name, PLUGIN_ROOT / "konstruktionslehre.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    course = {
        "sourceRule": "nine PDFs only",
        "exam": {"title": "Konstruktionslehre", "datetime": "2026-07-21T18:00:00+02:00"},
        "topics": [{"id": "topic-1", "title": "Lager"}],
        "flashcards": [{
            "id": "card-1", "topicId": "topic-1", "front": "Was ist ein Loslager?",
            "back": "Es erlaubt axiale Verschiebung.",
            "citation": {"file": "SS21.pdf", "page": 4},
        }],
        "quizQuestions": [{
            "id": "quiz-1", "topicId": "topic-1", "prompt": "Welche Lagerung?",
            "options": ["Fest/Fest", "Fest/Los"], "correctIndex": 1,
            "explanation": "Wärmedehnung braucht Verschiebung.", "points": 2,
            "citation": {"file": "SS21.pdf", "page": 4},
        }],
        "imageQuestions": [{"id": "image-1"}],
        "plan": [{
            "id": "block-1", "start": "2026-07-19T18:00:00+02:00",
            "end": "2026-07-19T19:00:00+02:00", "title": "Lager lernen",
        }],
    }
    course_path = tmp_path / "course.json"
    course_path.write_text(json.dumps(course), encoding="utf-8")
    monkeypatch.setenv("MIKAELOS_KONSTRUKTIONSLEHRE_COURSE", str(course_path))
    yield module
    sys.modules.pop(name, None)


def _progress():
    return {
        "completedLessons": [], "cardReviews": {}, "quizResults": {},
        "mistakes": [], "totalActivities": 0,
    }


def test_overview_binds_all_course_surfaces_to_one_progress_truth(adapter, monkeypatch):
    def fake_request(path, **_kwargs):
        if path == "/api/health":
            return {
                "status": "ok",
                "checks": {
                    "courseLoaded": True, "sourceIndexLoaded": True,
                    "allPdfsPresent": True, "databaseWritable": True,
                },
                "counts": {"pdfs": 9, "sourcePages": 405},
            }
        if path == "/api/progress":
            return _progress()
        raise AssertionError(path)

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    monkeypatch.setattr(
        adapter, "get_current_study_block",
        lambda: {"state": "active", "block": {"id": "block-1"}},
    )
    result = adapter.overview()

    assert result["state"] == "ready"
    assert result["pdfs"] == 9
    assert result["sourcePages"] == 405
    assert result["counts"] == {
        "topics": 1, "flashcards": 1, "quizQuestions": 1, "imageQuestions": 1,
    }
    assert result["authority"] == "Crashcamp APIs + crashcamp_progress/progress.db"


def test_search_returns_file_page_evidence_and_honest_no_hit(adapter, monkeypatch):
    monkeypatch.setattr(
        adapter, "_request_json",
        lambda *_args, **_kwargs: {
            "output": "[SS21.pdf, S. 4] Fest- und Loslager gleichen Wärmedehnung aus."
        },
    )
    hit = adapter.search_learning_materials("Fest Loslager Wärmedehnung")
    assert hit["sufficient"] is True
    assert hit["passages"][0]["file"] == "SS21.pdf"
    assert hit["passages"][0]["page"] == 4

    monkeypatch.setattr(
        adapter, "_request_json",
        lambda *_args, **_kwargs: {"output": "KEIN TREFFER: nicht belegt"},
    )
    miss = adapter.search_learning_materials("fachfremd")
    assert miss["sufficient"] is False
    assert "nicht sicher belegt" in miss["answerRule"]


def test_cards_hide_answers_until_explicit_reveal(adapter, monkeypatch):
    monkeypatch.setattr(adapter, "_request_json", lambda *_args, **_kwargs: _progress())
    due = adapter.get_due_flashcards()
    assert due["dueCount"] == 1
    assert "back" not in due["cards"][0]

    hidden = adapter.get_due_flashcards(card_id="card-1", reveal=False)
    revealed = adapter.get_due_flashcards(card_id="card-1", reveal=True)
    assert "back" not in hidden["card"]
    assert revealed["card"]["back"] == "Es erlaubt axiale Verschiebung."


def test_quiz_grades_and_writes_result_and_mistake_through_crashcamp(adapter, monkeypatch):
    calls = []

    def fake_request(path, *, method="GET", payload=None):
        calls.append((path, method, payload))
        return _progress()

    monkeypatch.setattr(adapter, "_request_json", fake_request)
    result = adapter.start_or_continue_quiz(question_id="quiz-1", answer_index=0)

    assert result["correct"] is False
    assert result["correctAnswer"] == "Fest/Los"
    assert any(call[2] and call[2].get("action") == "record" for call in calls)
    assert any(call[2] and call[2].get("action") == "mistake" for call in calls)


def test_current_block_uses_tested_course_plan(adapter):
    current = datetime(2026, 7, 19, 16, 30, tzinfo=timezone.utc)
    result = adapter.get_current_study_block(now=current)
    assert result["state"] == "active"
    assert result["block"]["id"] == "block-1"


def test_plugin_registers_complete_learning_toolset(monkeypatch):
    parent = "hermes_plugins"
    if parent not in sys.modules:
        namespace = types.ModuleType(parent)
        namespace.__path__ = []
        sys.modules[parent] = namespace
    name = f"{parent}.mikael_os_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(
        name, PLUGIN_ROOT / "__init__.py", submodule_search_locations=[str(PLUGIN_ROOT)]
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)

    registered = []
    hooks = []

    class Context:
        def register_tool(self, **kwargs):
            registered.append(kwargs)

        def register_hook(self, event, callback):
            hooks.append((event, callback))

    module.register(Context())
    assert {item["name"] for item in registered} == {
        "search_learning_materials", "get_learning_progress",
        "record_learning_result", "get_due_flashcards",
        "start_or_continue_quiz", "get_mistakes", "get_current_study_block",
    }
    assert {item["toolset"] for item in registered} == {"mikael_learning"}
    assert len({id(item["check_fn"]) for item in registered}) == 1
    assert [event for event, _callback in hooks] == ["pre_llm_call"]
    guardrail = hooks[0][1](user_message="Erkläre die Fest-Los-Lagerung")
    assert "search_learning_materials" in guardrail["context"]
    assert "genau eine Active-Recall-Frage" in guardrail["context"]
    assert hooks[0][1](user_message="Wie ist das Wetter?") is None
    sys.modules.pop(name, None)


def test_learning_center_is_fresh_when_crashcamp_is_ready(monkeypatch):
    name = f"mikael_os_dashboard_kl_test_{uuid4().hex}"
    spec = importlib.util.spec_from_file_location(
        name, PLUGIN_ROOT / "dashboard" / "plugin_api.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "_module_learning_anki", lambda: {
        "state": "empty", "source": "anki", "summary": "Anki leer", "rows": [],
    })
    monkeypatch.setattr(module, "konstruktionslehre_overview", lambda: {
        "state": "ready", "counts": {"flashcards": 76, "quizQuestions": 61},
        "pdfs": 9, "sourcePages": 405, "dueFlashcards": 12,
        "openMistakes": 2, "authority": "crashcamp_progress/progress.db",
    })

    result = module.module_learning()
    assert result["state"] == "fresh"
    assert result["hasKonstruktionslehre"] is True
    assert result["due"] == 12
    assert result["rows"][0]["title"] == "Konstruktionslehre · Crashcamp"
    sys.modules.pop(name, None)
