"""Mikael OS learning tools for the Hermes/Jarvis agent."""

from __future__ import annotations

from .konstruktionslehre import (
    get_current_study_block,
    get_due_flashcards,
    get_learning_progress,
    get_mistakes,
    health,
    record_learning_result,
    safe_json,
    search_learning_materials,
    start_or_continue_quiz,
)


_KONSTRUKTIONSLEHRE_MARKERS = (
    "konstruktionslehre",
    "konstruktion",
    "festlager",
    "loslager",
    "passfeder",
    "welle",
    "wellen",
    "lagerung",
    "morphologisch",
    "anforderungsliste",
    "funktionsstruktur",
    "wirkprinzip",
    "fom-prüfung",
)


def _learning_turn_context(*, user_message: str = "", **_kwargs):
    """Inject the source and recall contract only for course-related turns."""
    normalized = str(user_message or "").casefold()
    if not any(marker in normalized for marker in _KONSTRUKTIONSLEHRE_MARKERS):
        return None
    return {"context": (
        "Konstruktionslehre-Tutorvertrag: Rufe vor jeder fachlichen Antwort "
        "search_learning_materials mit der konkreten Frage auf. Verwende nur "
        "die dort gelieferten Passagen und nenne Datei plus Seite. Wenn sufficient "
        "false ist, antworte exakt: 'Das ist in den bereitgestellten Unterlagen "
        "nicht sicher belegt.' Stelle nach jeder fachlichen Erklärung genau eine "
        "Active-Recall-Frage. Fortschritt, Quiz und Fehler ausschließlich über "
        "die mikael_learning-Werkzeuge lesen oder schreiben."
    )}


def _learning_ready() -> bool:
    """One shared readiness probe so Hermes can TTL-cache it for all tools."""
    return health().get("ready") is True


def _schema(name, description, properties=None, required=None):
    return {
        "name": name,
        "description": description,
        "parameters": {
            "type": "object",
            "properties": properties or {},
            "required": required or [],
            "additionalProperties": False,
        },
    }


_TOOLS = (
    ("search_learning_materials", _schema(
        "search_learning_materials",
        "Search the nine Konstruktionslehre PDFs before every factual answer.",
        {"query": {"type": "string", "minLength": 1, "maxLength": 500}}, ["query"]),
     lambda args, **_kw: safe_json(search_learning_materials, args.get("query", ""))),
    ("get_learning_progress", _schema(
        "get_learning_progress", "Read canonical Konstruktionslehre progress and mistakes."),
     lambda _args, **_kw: safe_json(get_learning_progress)),
    ("record_learning_result", _schema(
        "record_learning_result", "Record one validated lesson, card or quiz result in Crashcamp.",
        {
            "item_type": {"type": "string", "enum": ["lesson", "card", "quiz"]},
            "item_id": {"type": "string", "minLength": 1},
            "score": {"type": "number", "minimum": 0, "maximum": 1},
        }, ["item_type", "item_id", "score"]),
     lambda args, **_kw: safe_json(record_learning_result, args.get("item_type"), args.get("item_id"), args.get("score"))),
    ("get_due_flashcards", _schema(
        "get_due_flashcards", "Get due cards or reveal one selected card answer.",
        {
            "limit": {"type": "integer", "minimum": 1, "maximum": 30},
            "card_id": {"type": "string"}, "reveal": {"type": "boolean"},
        }),
     lambda args, **_kw: safe_json(get_due_flashcards, limit=args.get("limit", 10), card_id=args.get("card_id", ""), reveal=args.get("reveal", False))),
    ("start_or_continue_quiz", _schema(
        "start_or_continue_quiz", "Start a quiz or grade an answer and persist the result.",
        {
            "topic_id": {"type": "string"}, "question_id": {"type": "string"},
            "answer_index": {"type": ["integer", "null"], "minimum": 0},
        }),
     lambda args, **_kw: safe_json(start_or_continue_quiz, topic_id=args.get("topic_id", ""), question_id=args.get("question_id", ""), answer_index=args.get("answer_index"))),
    ("get_mistakes", _schema(
        "get_mistakes", "Read the canonical Konstruktionslehre error book.",
        {"open_only": {"type": "boolean"}, "limit": {"type": "integer", "minimum": 1, "maximum": 50}}),
     lambda args, **_kw: safe_json(get_mistakes, open_only=args.get("open_only", True), limit=args.get("limit", 20))),
    ("get_current_study_block", _schema(
        "get_current_study_block", "Read the active or next Konstruktionslehre study block."),
     lambda _args, **_kw: safe_json(get_current_study_block)),
)


def register(ctx) -> None:
    """Register the bounded Konstruktionslehre toolset."""
    for name, schema, handler in _TOOLS:
        ctx.register_tool(
            name=name,
            toolset="mikael_learning",
            schema=schema,
            handler=handler,
            check_fn=_learning_ready,
            emoji="🎓",
        )
    ctx.register_hook("pre_llm_call", _learning_turn_context)
