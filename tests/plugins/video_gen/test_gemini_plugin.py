"""Behavior tests for the Gemini Omni Flash video provider."""

from __future__ import annotations

import base64
import json
import logging
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

import plugins.video_gen.gemini as gemini_plugin


_TEST_KEY = "test-gemini-video-key"
_VIDEO_BYTES = b"\x00\x00\x00\x18ftypmp42test-video"


def _response(data: str | None = None, *, status: int = 200):
    body = {
        "steps": [{
            "type": "model_output",
            "content": ([{
                "type": "video",
                "mime_type": "video/mp4",
                "data": data,
            }] if data else []),
        }],
        "status": "completed",
        "model": gemini_plugin.MODEL_ID,
    }
    response = MagicMock()
    response.status_code = status
    response.json.return_value = body
    response.raise_for_status.return_value = None
    return response


@pytest.fixture(autouse=True)
def _isolation(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.setenv("GEMINI_API_KEY", _TEST_KEY)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    yield


@pytest.fixture
def provider():
    return gemini_plugin.GeminiOmniVideoGenProvider()


def test_metadata_and_conservative_cost(provider):
    assert provider.name == "gemini"
    assert provider.default_model() == "gemini-omni-flash-preview"
    model = provider.list_models()[0]
    assert model["cost_estimate_usd"] == pytest.approx(1.0)
    caps = provider.capabilities()
    assert set(caps["modalities"]) == {"text", "image"}
    assert caps["max_duration"] == 10
    assert caps["supports_audio"] is True


def test_register_exposes_provider_to_plugin_context():
    ctx = MagicMock()

    gemini_plugin.register(ctx)

    registered = ctx.register_video_gen_provider.call_args.args[0]
    assert isinstance(registered, gemini_plugin.GeminiOmniVideoGenProvider)


def test_availability_accepts_google_alias(provider, monkeypatch):
    assert provider.is_available() is True
    monkeypatch.delenv("GEMINI_API_KEY")
    assert provider.is_available() is False
    monkeypatch.setenv("GOOGLE_API_KEY", "alias-key")
    assert provider.is_available() is True


def test_text_to_video_saves_artifact_and_never_puts_key_in_url(provider, tmp_path):
    encoded = base64.b64encode(_VIDEO_BYTES).decode("ascii")
    with patch.object(gemini_plugin.requests, "post", return_value=_response(encoded)) as post:
        result = provider.generate(
            "A cinematic garage door opening at sunrise",
            duration=5,
            aspect_ratio="16:9",
        )

    assert result["success"] is True
    assert result["provider"] == "gemini"
    assert result["modality"] == "text"
    assert result["duration"] == 5
    assert result["cost_estimate_usd"] == pytest.approx(1.0)
    saved = Path(result["video"])
    assert saved.exists()
    assert saved.parent == tmp_path / "cache" / "videos"
    assert saved.read_bytes() == _VIDEO_BYTES

    url = post.call_args.args[0]
    kwargs = post.call_args.kwargs
    assert url == gemini_plugin._INTERACTIONS_URL
    assert _TEST_KEY not in url
    assert kwargs["headers"]["x-goog-api-key"] == _TEST_KEY
    assert _TEST_KEY not in json.dumps(kwargs["json"])
    assert kwargs["json"]["generation_config"]["video_config"]["task"] == "text_to_video"
    assert "approximately 5 seconds" in kwargs["json"]["input"]


def test_image_to_video_uses_inline_image_and_task(provider, tmp_path):
    source = tmp_path / "source.png"
    source.write_bytes(b"png-data")
    encoded = base64.b64encode(_VIDEO_BYTES).decode("ascii")
    with patch.object(gemini_plugin.requests, "post", return_value=_response(encoded)) as post:
        result = provider.generate("Animate this", image_url=str(source), aspect_ratio="9:16")

    assert result["success"] is True
    assert result["modality"] == "image"
    payload = post.call_args.kwargs["json"]
    assert payload["generation_config"]["video_config"]["task"] == "image_to_video"
    assert payload["input"][0]["type"] == "image"
    assert payload["input"][-1] == {"type": "text", "text": "Animate this"}


def test_reference_to_video_clamps_reference_count(provider, tmp_path):
    refs = []
    for index in range(5):
        path = tmp_path / f"ref-{index}.png"
        path.write_bytes(b"png-data")
        refs.append(str(path))
    encoded = base64.b64encode(_VIDEO_BYTES).decode("ascii")
    with patch.object(gemini_plugin.requests, "post", return_value=_response(encoded)) as post:
        result = provider.generate("Use these subjects", reference_image_urls=refs)

    assert result["success"] is True
    assert result["task"] == "reference_to_video"
    image_items = [item for item in post.call_args.kwargs["json"]["input"] if item["type"] == "image"]
    assert len(image_items) == gemini_plugin._MAX_REFERENCE_IMAGES


def test_missing_key_and_unknown_model_fail_closed(provider, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY")
    missing = provider.generate("x")
    assert missing["success"] is False
    assert missing["error_type"] == "missing_credentials"

    monkeypatch.setenv("GEMINI_API_KEY", _TEST_KEY)
    unknown = provider.generate("x", model="future-unpriced-model")
    assert unknown["success"] is False
    assert unknown["error_type"] == "invalid_model"


def test_empty_response_and_http_error_do_not_leak_key(provider, caplog):
    with patch.object(gemini_plugin.requests, "post", return_value=_response(None)):
        empty = provider.generate("x")
    assert empty["success"] is False
    assert empty["error_type"] == "empty_response"

    bad = MagicMock()
    bad.raise_for_status.side_effect = RuntimeError("request failed")
    with caplog.at_level(logging.DEBUG):
        with patch.object(gemini_plugin.requests, "post", return_value=bad):
            failed = provider.generate("x")
    assert failed["success"] is False
    assert failed["error_type"] == "api_error"
    assert _TEST_KEY not in caplog.text
    assert _TEST_KEY not in json.dumps(failed)
