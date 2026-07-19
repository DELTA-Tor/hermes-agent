"""Konstruktionslehre learning-center adapter for Mikael OS and Jarvis.

The running Crashcamp remains the only owner of progress and source search.
This module adds a bounded loopback adapter plus deterministic course reads so
Jarvis can coach against the same nine PDFs, cards, quizzes and mistakes as the
specialized UI without creating a second learning truth.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


class LearningCenterError(RuntimeError):
    """A safe, user-visible learning adapter failure."""


def _base_url() -> str:
    value = os.environ.get(
        "MIKAELOS_KONSTRUKTIONSLEHRE_BASE", "http://127.0.0.1:13150"
    ).rstrip("/")
    parsed = urlsplit(value)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise LearningCenterError("Crashcamp endpoint must remain loopback HTTP")
    return value


def _course_path() -> Path:
    return Path(
        os.environ.get(
            "MIKAELOS_KONSTRUKTIONSLEHRE_COURSE",
            "/home/ubuntu/Dev/mikael-konstruktionslehre/data/course.json",
        )
    )


def _request_json(path: str, *, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    body = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = Request(_base_url() + path, data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=3.0) as response:
            raw = response.read(2 * 1024 * 1024)
    except HTTPError as exc:
        raise LearningCenterError(f"Crashcamp HTTP {exc.code}") from exc
    except (URLError, OSError, TimeoutError) as exc:
        raise LearningCenterError("Crashcamp is not reachable") from exc
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise LearningCenterError("Crashcamp returned invalid JSON") from exc
    if not isinstance(data, dict):
        raise LearningCenterError("Crashcamp returned an invalid payload")
    return data


def _course() -> Dict[str, Any]:
    path = _course_path()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise LearningCenterError("Konstruktionslehre course data is unavailable") from exc
    required = ("exam", "topics", "flashcards", "quizQuestions", "imageQuestions", "plan")
    if not isinstance(data, dict) or any(not isinstance(data.get(key), (dict if key == "exam" else list)) for key in required):
        raise LearningCenterError("Konstruktionslehre course data has an invalid contract")
    return data


def _progress() -> Dict[str, Any]:
    data = _request_json("/api/progress")
    for key, kind in (
        ("completedLessons", list), ("cardReviews", dict),
        ("quizResults", dict), ("mistakes", list),
    ):
        if not isinstance(data.get(key), kind):
            raise LearningCenterError("Crashcamp progress contract is invalid")
    return data


def health() -> Dict[str, Any]:
    data = _request_json("/api/health")
    counts = data.get("counts") if isinstance(data.get("counts"), dict) else {}
    checks = data.get("checks") if isinstance(data.get("checks"), dict) else {}
    ready = (
        data.get("status") == "ok"
        and checks.get("courseLoaded") is True
        and checks.get("sourceIndexLoaded") is True
        and checks.get("allPdfsPresent") is True
        and checks.get("databaseWritable") is True
        and counts.get("pdfs") == 9
        and int(counts.get("sourcePages") or 0) >= 405
    )
    return {"ready": ready, "status": data.get("status"), "checks": checks, "counts": counts}


def _parse_dt(value: Any) -> Optional[datetime]:
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def get_current_study_block(*, now: Optional[datetime] = None) -> Dict[str, Any]:
    course = _course()
    current = now or datetime.now(timezone.utc)
    current = current if current.tzinfo else current.replace(tzinfo=timezone.utc)
    upcoming = None
    for block in sorted(course["plan"], key=lambda item: str(item.get("start") or "")):
        start = _parse_dt(block.get("start"))
        end = _parse_dt(block.get("end"))
        if not start or not end:
            continue
        if start <= current.astimezone(start.tzinfo) < end:
            return {"state": "active", "block": block, "observedAt": current.isoformat()}
        if start > current.astimezone(start.tzinfo) and upcoming is None:
            upcoming = block
    return {
        "state": "upcoming" if upcoming else "complete",
        "block": upcoming,
        "observedAt": current.isoformat(),
    }


def get_learning_progress() -> Dict[str, Any]:
    progress = _progress()
    course = _course()
    open_mistakes = [item for item in progress["mistakes"] if not item.get("resolved")]
    mastered_quiz = sum(1 for item in progress["quizResults"].values() if float(item.get("score") or 0) >= 1)
    return {
        **progress,
        "courseCounts": {
            "topics": len(course["topics"]),
            "flashcards": len(course["flashcards"]),
            "quizQuestions": len(course["quizQuestions"]),
            "imageQuestions": len(course["imageQuestions"]),
        },
        "openMistakes": len(open_mistakes),
        "masteredQuizQuestions": mastered_quiz,
        "authority": "crashcamp_progress/progress.db",
    }


_CITATION = re.compile(r"^\[(.+), S\. (\d+)\]\s*(.*)$", re.DOTALL)


def search_learning_materials(query: str) -> Dict[str, Any]:
    clean = str(query or "").strip()
    if not clean or len(clean) > 500:
        raise LearningCenterError("query must contain 1 to 500 characters")
    output = str(_request_json("/api/tutor/search", method="POST", payload={"query": clean}).get("output") or "")
    if output.startswith("KEIN TREFFER"):
        return {
            "sufficient": False,
            "query": clean,
            "passages": [],
            "answerRule": "Das ist in den bereitgestellten Unterlagen nicht sicher belegt.",
        }
    passages = []
    for chunk in output.split("\n\n"):
        match = _CITATION.match(chunk.strip())
        if not match:
            continue
        passages.append({
            "file": match.group(1),
            "page": int(match.group(2)),
            "text": match.group(3)[:2400],
        })
    return {
        "sufficient": bool(passages),
        "query": clean,
        "passages": passages,
        "sourceRule": "Only the nine provided Konstruktionslehre PDFs may support an answer.",
    }


def _known_item(item_type: str, item_id: str) -> bool:
    course = _course()
    key = {"lesson": "topics", "card": "flashcards", "quiz": "quizQuestions"}.get(item_type)
    return bool(key and any(str(item.get("id")) == item_id for item in course[key]))


def record_learning_result(item_type: str, item_id: str, score: float) -> Dict[str, Any]:
    kind = str(item_type or "").strip()
    ident = str(item_id or "").strip()
    numeric = float(score)
    if kind not in {"lesson", "card", "quiz"} or not _known_item(kind, ident):
        raise LearningCenterError("unknown course item")
    if numeric < 0 or numeric > 1:
        raise LearningCenterError("score must be between 0 and 1")
    progress = _request_json(
        "/api/progress",
        method="POST",
        payload={"action": "record", "itemType": kind, "itemId": ident, "score": numeric},
    )
    return {
        "recorded": True,
        "itemType": kind,
        "itemId": ident,
        "score": numeric,
        "totalActivities": progress.get("totalActivities"),
        "authority": "crashcamp_progress/progress.db",
    }


def get_due_flashcards(*, limit: int = 10, card_id: str = "", reveal: bool = False) -> Dict[str, Any]:
    course = _course()
    progress = _progress()
    cards = course["flashcards"]
    ident = str(card_id or "").strip()
    if ident:
        card = next((item for item in cards if str(item.get("id")) == ident), None)
        if card is None:
            raise LearningCenterError("unknown flashcard")
        result = {
            "id": card["id"], "topicId": card.get("topicId"), "front": card.get("front"),
            "citation": card.get("citation"),
        }
        if reveal:
            result["back"] = card.get("back")
        return {"card": result, "revealed": bool(reveal)}
    now = datetime.now(timezone.utc)
    reviews = progress["cardReviews"]
    due = []
    for card in cards:
        review = reviews.get(str(card.get("id")))
        due_at = _parse_dt(review.get("dueAt")) if isinstance(review, dict) else None
        if review is None or due_at is None or due_at <= now:
            due.append({
                "id": card.get("id"), "topicId": card.get("topicId"),
                "front": card.get("front"), "citation": card.get("citation"),
                "attempts": int((review or {}).get("attempts") or 0),
            })
    due.sort(key=lambda item: (item["attempts"], str(item["id"])))
    bounded = max(1, min(int(limit), 30))
    return {"dueCount": len(due), "cards": due[:bounded], "answersHidden": True}


def _next_question(course: Dict[str, Any], progress: Dict[str, Any], topic_id: str = "") -> Dict[str, Any]:
    questions = [
        item for item in course["quizQuestions"]
        if not topic_id or str(item.get("topicId")) == topic_id
    ]
    if not questions:
        raise LearningCenterError("no quiz question matches the requested topic")
    results = progress["quizResults"]
    questions.sort(key=lambda item: (
        float((results.get(str(item.get("id"))) or {}).get("score") or -1),
        int((results.get(str(item.get("id"))) or {}).get("attempts") or 0),
        str(item.get("id")),
    ))
    question = questions[0]
    return {
        "id": question.get("id"), "topicId": question.get("topicId"),
        "prompt": question.get("prompt"), "options": question.get("options"),
        "points": question.get("points"), "citation": question.get("citation"),
    }


def start_or_continue_quiz(
    *, topic_id: str = "", question_id: str = "", answer_index: Optional[int] = None
) -> Dict[str, Any]:
    course = _course()
    progress = _progress()
    if answer_index is None:
        return {"state": "question", "question": _next_question(course, progress, topic_id)}
    ident = str(question_id or "").strip()
    question = next((item for item in course["quizQuestions"] if str(item.get("id")) == ident), None)
    if question is None:
        raise LearningCenterError("unknown quiz question")
    options = question.get("options") or []
    index = int(answer_index)
    if index < 0 or index >= len(options):
        raise LearningCenterError("answer_index is out of range")
    correct = index == int(question.get("correctIndex"))
    _request_json(
        "/api/progress", method="POST",
        payload={"action": "record", "itemType": "quiz", "itemId": ident, "score": 1 if correct else 0},
    )
    if not correct:
        citation = question.get("citation") or {}
        _request_json(
            "/api/progress", method="POST",
            payload={
                "action": "mistake", "questionId": ident, "prompt": question.get("prompt"),
                "answer": options[index],
                "correction": f"{options[int(question.get('correctIndex'))]} — {question.get('explanation')}",
                "citationFile": citation.get("file"), "citationPage": citation.get("page"),
            },
        )
    updated = _progress()
    return {
        "state": "answered", "correct": correct,
        "correctAnswer": options[int(question.get("correctIndex"))],
        "explanation": question.get("explanation"), "citation": question.get("citation"),
        "nextQuestion": _next_question(course, updated, topic_id),
    }


def get_mistakes(*, open_only: bool = True, limit: int = 20) -> Dict[str, Any]:
    mistakes = _progress()["mistakes"]
    if open_only:
        mistakes = [item for item in mistakes if not item.get("resolved")]
    bounded = max(1, min(int(limit), 50))
    return {"count": len(mistakes), "mistakes": mistakes[:bounded]}


def overview() -> Dict[str, Any]:
    readiness = health()
    course = _course()
    progress = get_learning_progress()
    due = get_due_flashcards(limit=1)
    return {
        "state": "ready" if readiness["ready"] else "degraded",
        "subject": "Konstruktionslehre",
        "health": readiness,
        "exam": course["exam"],
        "sourceRule": course.get("sourceRule"),
        "counts": progress["courseCounts"],
        "sourcePages": readiness["counts"].get("sourcePages"),
        "pdfs": readiness["counts"].get("pdfs"),
        "totalActivities": progress.get("totalActivities"),
        "openMistakes": progress["openMistakes"],
        "masteredQuizQuestions": progress["masteredQuizQuestions"],
        "dueFlashcards": due["dueCount"],
        "currentStudyBlock": get_current_study_block(),
        "authority": "Crashcamp APIs + crashcamp_progress/progress.db",
    }


def safe_json(callable_, *args, **kwargs) -> str:
    """Return the Hermes tool JSON contract without leaking internals."""
    try:
        return json.dumps({"success": True, "data": callable_(*args, **kwargs)}, ensure_ascii=False)
    except (LearningCenterError, TypeError, ValueError) as exc:
        return json.dumps({"success": False, "error": str(exc)}, ensure_ascii=False)
