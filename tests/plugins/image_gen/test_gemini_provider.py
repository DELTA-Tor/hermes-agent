"""Tests for the bundled Google Gemini image_gen plugin (Nano Banana family).

Covers (all HTTP mocked — no real spend):

* the ``ImageGenProvider`` ABC surface (name, models, schema, availability)
* generate() success path: endpoint/header shape, cache save, response shape
* ``cost_estimate_usd`` presence on every success response
* the API key never appearing in the URL or in log output
* prompt-keyword provider routing (nano banana/gemini → gemini,
  gpt/dalle → openai, default gemini)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

import plugins.image_gen.gemini as gemini_plugin


_TEST_KEY = "test-gemini-key-XYZZY-123"

# 1×1 transparent PNG — valid bytes for save_b64_image()
_PNG_HEX = (
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000d49444154789c6300010000000500010d0a2db40000000049454e44"
    "ae426082"
)


def _b64_png() -> str:
    import base64

    return base64.b64encode(bytes.fromhex(_PNG_HEX)).decode()


def _fake_response(*, images=None, block_reason=None, status=200):
    """Build a fake ``requests`` response for models:generateContent."""
    parts = []
    for b64 in images or []:
        parts.append({"inlineData": {"mimeType": "image/png", "data": b64}})
    body = {
        "candidates": [{"content": {"parts": parts}}] if parts else [],
        "usageMetadata": {"totalTokenCount": 1290},
    }
    if block_reason:
        body["promptFeedback"] = {"blockReason": block_reason}
    resp = MagicMock()
    resp.status_code = status
    resp.json.return_value = body
    resp.raise_for_status.return_value = None
    return resp


@pytest.fixture(autouse=True)
def _tmp_hermes_home(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path))
    monkeypatch.delenv("GEMINI_IMAGE_MODEL", raising=False)
    yield tmp_path


@pytest.fixture
def provider(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", _TEST_KEY)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    return gemini_plugin.GeminiImageGenProvider()


# ── Metadata ────────────────────────────────────────────────────────────────


class TestMetadata:
    def test_name(self, provider):
        assert provider.name == "gemini"

    def test_display_name(self, provider):
        assert provider.display_name == "Google Gemini"

    def test_default_model_is_nano_banana_pro(self, provider):
        assert provider.default_model() == "gemini-3-pro-image"
        assert gemini_plugin.DEFAULT_MODEL == "gemini-3-pro-image"

    def test_list_models(self, provider):
        ids = [m["id"] for m in provider.list_models()]
        assert ids == ["gemini-3-pro-image", "gemini-2.5-flash-image"]
        for entry in provider.list_models():
            for field in ("id", "display", "speed", "strengths", "price"):
                assert entry[field]

    def test_every_catalog_model_declares_cost_estimate(self):
        for model_id, meta in gemini_plugin._MODELS.items():
            assert isinstance(meta["cost_estimate_usd"], float), model_id
            assert meta["cost_estimate_usd"] > 0

    def test_setup_schema_advertises_gemini_key(self, provider):
        schema = provider.get_setup_schema()
        assert schema["name"] == "Google Gemini (Nano Banana)"
        assert schema["badge"] == "paid"
        env_keys = {entry["key"] for entry in schema["env_vars"]}
        assert "GEMINI_API_KEY" in env_keys

    def test_capabilities_text_and_image(self, provider):
        caps = provider.capabilities()
        assert caps["modalities"] == ["text", "image"]
        assert caps["max_reference_images"] >= 1


# ── Availability ────────────────────────────────────────────────────────────


class TestAvailability:
    def test_no_key_unavailable(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        assert gemini_plugin.GeminiImageGenProvider().is_available() is False

    def test_gemini_key_available(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "k")
        assert gemini_plugin.GeminiImageGenProvider().is_available() is True

    def test_google_key_alias_available(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.setenv("GOOGLE_API_KEY", "k")
        assert gemini_plugin.GeminiImageGenProvider().is_available() is True


# ── Model resolution ────────────────────────────────────────────────────────


class TestModelResolution:
    def test_default(self):
        model_id, meta = gemini_plugin._resolve_model()
        assert model_id == "gemini-3-pro-image"
        assert meta["api_model"] == "gemini-3-pro-image"

    def test_env_override(self, monkeypatch):
        monkeypatch.setenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
        model_id, _ = gemini_plugin._resolve_model()
        assert model_id == "gemini-2.5-flash-image"

    def test_env_unknown_falls_back(self, monkeypatch):
        monkeypatch.setenv("GEMINI_IMAGE_MODEL", "bogus-model")
        model_id, _ = gemini_plugin._resolve_model()
        assert model_id == gemini_plugin.DEFAULT_MODEL


# ── generate() ──────────────────────────────────────────────────────────────


class TestGenerate:
    def test_empty_prompt_rejected(self, provider):
        result = provider.generate("", aspect_ratio="square")
        assert result["success"] is False
        assert result["error_type"] == "invalid_argument"

    def test_missing_api_key(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        result = gemini_plugin.GeminiImageGenProvider().generate("a cat")
        assert result["success"] is False
        assert result["error_type"] == "auth_required"

    def test_success_saves_to_cache_and_estimates_cost(self, provider, tmp_path):
        png_bytes = bytes.fromhex(_PNG_HEX)
        with patch.object(
            gemini_plugin.requests, "post",
            return_value=_fake_response(images=[_b64_png()]),
        ) as mock_post:
            result = provider.generate("a garage door at dusk", aspect_ratio="landscape")

        assert result["success"] is True
        assert result["provider"] == "gemini"
        assert result["model"] == "gemini-3-pro-image"
        assert result["aspect_ratio"] == "landscape"
        assert result["modality"] == "text"
        # cost_estimate_usd: conservative catalog constant, always present.
        assert result["cost_estimate_usd"] == pytest.approx(0.15)

        saved = Path(result["image"])
        assert saved.exists()
        assert saved.parent == tmp_path / "cache" / "images"
        assert saved.read_bytes() == png_bytes

        # Endpoint + payload shape.
        url = mock_post.call_args.args[0] if mock_post.call_args.args else mock_post.call_args.kwargs["url"]
        assert url.endswith("/models/gemini-3-pro-image:generateContent")
        payload = mock_post.call_args.kwargs["json"]
        assert payload["contents"][0]["parts"][0]["text"] == "a garage door at dusk"
        gc = payload["generationConfig"]
        assert "IMAGE" in gc["responseModalities"]
        assert gc["imageConfig"]["aspectRatio"] == "16:9"

    def test_api_key_only_in_header_never_in_url(self, provider):
        with patch.object(
            gemini_plugin.requests, "post",
            return_value=_fake_response(images=[_b64_png()]),
        ) as mock_post:
            provider.generate("a cat")

        url = mock_post.call_args.args[0] if mock_post.call_args.args else mock_post.call_args.kwargs["url"]
        headers = mock_post.call_args.kwargs["headers"]
        assert headers["x-goog-api-key"] == _TEST_KEY
        assert _TEST_KEY not in url
        assert _TEST_KEY not in json.dumps(mock_post.call_args.kwargs["json"])

    def test_api_key_never_logged(self, provider, caplog):
        with caplog.at_level(logging.DEBUG):
            with patch.object(
                gemini_plugin.requests, "post",
                return_value=_fake_response(images=[_b64_png()]),
            ):
                result = provider.generate("a cat")
        assert result["success"] is True
        assert _TEST_KEY not in caplog.text

    def test_api_key_never_logged_on_http_error(self, provider, caplog):
        import requests as _requests

        err_resp = MagicMock()
        err_resp.status_code = 400
        err_resp.json.return_value = {"error": {"message": "bad request"}}
        err_resp.text = "bad request"
        bad = MagicMock()
        bad.raise_for_status.side_effect = _requests.HTTPError(response=err_resp)
        with caplog.at_level(logging.DEBUG):
            with patch.object(gemini_plugin.requests, "post", return_value=bad):
                result = provider.generate("a cat")
        assert result["success"] is False
        assert result["error_type"] == "api_error"
        assert _TEST_KEY not in caplog.text
        assert _TEST_KEY not in json.dumps(result)

    def test_empty_response(self, provider):
        with patch.object(
            gemini_plugin.requests, "post", return_value=_fake_response(images=[]),
        ):
            result = provider.generate("a cat")
        assert result["success"] is False
        assert result["error_type"] == "empty_response"

    def test_block_reason_surfaced(self, provider):
        with patch.object(
            gemini_plugin.requests, "post",
            return_value=_fake_response(images=[], block_reason="SAFETY"),
        ):
            result = provider.generate("a cat")
        assert result["success"] is False
        assert "SAFETY" in result["error"]

    def test_image_to_image_sends_inline_source(self, provider, tmp_path):
        src = tmp_path / "source.png"
        src.write_bytes(bytes.fromhex(_PNG_HEX))
        with patch.object(
            gemini_plugin.requests, "post",
            return_value=_fake_response(images=[_b64_png()]),
        ) as mock_post:
            result = provider.generate(
                "make it blue", aspect_ratio="square", image_url=str(src),
            )
        assert result["success"] is True
        assert result["modality"] == "image"
        assert result["cost_estimate_usd"] == pytest.approx(0.15)
        parts = mock_post.call_args.kwargs["json"]["contents"][0]["parts"]
        assert parts[0]["text"] == "make it blue"
        assert parts[1]["inline_data"]["mime_type"] == "image/png"
        assert parts[1]["inline_data"]["data"]  # non-empty b64

    def test_flash_model_cost_estimate(self, provider, monkeypatch):
        monkeypatch.setenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
        with patch.object(
            gemini_plugin.requests, "post",
            return_value=_fake_response(images=[_b64_png()]),
        ) as mock_post:
            result = provider.generate("a cat")
        assert result["success"] is True
        assert result["model"] == "gemini-2.5-flash-image"
        assert result["cost_estimate_usd"] == pytest.approx(0.05)
        url = mock_post.call_args.args[0] if mock_post.call_args.args else mock_post.call_args.kwargs["url"]
        assert url.endswith("/models/gemini-2.5-flash-image:generateContent")

    def test_ignores_unknown_kwargs(self, provider):
        with patch.object(
            gemini_plugin.requests, "post",
            return_value=_fake_response(images=[_b64_png()]),
        ):
            result = provider.generate("a cat", future_flag=True, whatever=1)
        assert result["success"] is True


# ── Prompt-keyword provider routing ─────────────────────────────────────────


class _FakeProvider:
    """Minimal ImageGenProvider stand-in for registry routing tests."""

    def __init__(self, name, available=True):
        self._name = name
        self._available = available

    @property
    def name(self):
        return self._name

    def is_available(self):
        return self._available

    def generate(self, prompt, aspect_ratio="landscape", **kwargs):
        return {
            "success": True,
            "image": "/tmp/fake.png",
            "model": f"{self._name}-model",
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "modality": "text",
            "provider": self._name,
            "cost_estimate_usd": 0.01,
        }


@pytest.fixture
def _routing_registry(monkeypatch):
    """Isolated registry with fake gemini + openai providers registered."""
    import agent.image_gen_registry as reg

    monkeypatch.setattr(reg, "_providers", {}, raising=True)
    fakes = {
        "gemini": _FakeProvider("gemini"),
        "openai": _FakeProvider("openai"),
    }
    for fake in fakes.values():
        reg._providers[fake.name] = fake
    return reg, fakes


class TestPromptRouting:
    @pytest.mark.parametrize("prompt,expected", [
        ("draw this with nano banana please", "gemini"),
        ("Nano-Banana style logo", "gemini"),
        ("use gemini to render a garage door", "gemini"),
        ("a logo, use gpt for this", "openai"),
        ("dalle style painting", "openai"),
        ("dall-e rendition of a cat", "openai"),
        ("just a plain garage door", "gemini"),  # default
    ])
    def test_keyword_routing(self, _routing_registry, prompt, expected):
        reg, fakes = _routing_registry
        chosen = reg.select_provider_for_prompt(prompt)
        assert chosen is fakes[expected]

    def test_gpt_substring_does_not_misroute(self, _routing_registry):
        # 'gpt' must match as a word — not inside e.g. 'egyptian'.
        reg, fakes = _routing_registry
        chosen = reg.select_provider_for_prompt("an egyptian pyramid at dawn")
        assert chosen is fakes["gemini"]  # default, not openai

    def test_no_default_when_disallowed(self, _routing_registry):
        reg, fakes = _routing_registry
        assert reg.select_provider_for_prompt(
            "a plain prompt", allow_default=False
        ) is None
        # Explicit keywords still route even when the default leg is off.
        assert reg.select_provider_for_prompt(
            "nano banana it", allow_default=False
        ) is fakes["gemini"]

    def test_unavailable_provider_returns_none(self, monkeypatch):
        import agent.image_gen_registry as reg

        monkeypatch.setattr(reg, "_providers", {}, raising=True)
        reg._providers["gemini"] = _FakeProvider("gemini", available=False)
        assert reg.select_provider_for_prompt("nano banana art") is None

    def test_unregistered_provider_returns_none(self, monkeypatch):
        import agent.image_gen_registry as reg

        monkeypatch.setattr(reg, "_providers", {}, raising=True)
        assert reg.select_provider_for_prompt("use gpt") is None

    def test_tool_dispatch_uses_prompt_routing(self, monkeypatch):
        """_dispatch_to_prompt_routed_provider wires routing into the tool."""
        import agent.image_gen_registry as reg
        import tools.image_generation_tool as image_tool

        monkeypatch.setattr(reg, "_providers", {}, raising=True)
        fake = _FakeProvider("gemini")
        reg._providers["gemini"] = fake
        monkeypatch.setattr(
            image_tool, "_read_configured_image_model", lambda: None
        )
        monkeypatch.setattr(
            "hermes_cli.plugins._ensure_plugins_discovered", lambda **kw: None
        )

        raw = image_tool._dispatch_to_prompt_routed_provider(
            "nano banana: a garage door", "landscape"
        )
        assert raw is not None
        payload = json.loads(raw)
        assert payload["success"] is True
        assert payload["provider"] == "gemini"
        assert "cost_estimate_usd" in payload

    def test_tool_dispatch_respects_pinned_model(self, monkeypatch):
        """A pinned image_gen.model suppresses the default-gemini leg."""
        import agent.image_gen_registry as reg
        import tools.image_generation_tool as image_tool

        monkeypatch.setattr(reg, "_providers", {}, raising=True)
        reg._providers["gemini"] = _FakeProvider("gemini")
        monkeypatch.setattr(
            image_tool, "_read_configured_image_model",
            lambda: "fal-ai/flux-2/klein/9b",
        )
        monkeypatch.setattr(
            "hermes_cli.plugins._ensure_plugins_discovered", lambda **kw: None
        )

        # No explicit keyword → falls through to the legacy chain.
        assert image_tool._dispatch_to_prompt_routed_provider(
            "a plain garage door", "landscape"
        ) is None
        # Explicit keyword still wins over the pinned model.
        raw = image_tool._dispatch_to_prompt_routed_provider(
            "render with nano banana", "landscape"
        )
        assert raw is not None
        assert json.loads(raw)["provider"] == "gemini"


# ── cost_estimate_usd contract across providers ─────────────────────────────


class TestCostEstimateContract:
    def test_success_response_includes_cost_when_given(self):
        from agent.image_gen_provider import success_response

        resp = success_response(
            image="/tmp/x.png", model="m", prompt="p",
            aspect_ratio="square", provider="test",
            cost_estimate_usd=0.15,
        )
        assert resp["cost_estimate_usd"] == pytest.approx(0.15)

    def test_success_response_omits_cost_when_absent(self):
        from agent.image_gen_provider import success_response

        resp = success_response(
            image="/tmp/x.png", model="m", prompt="p",
            aspect_ratio="square", provider="test",
        )
        assert "cost_estimate_usd" not in resp

    def test_openai_provider_reports_cost_estimate(self, monkeypatch, tmp_path):
        from types import SimpleNamespace

        import plugins.image_gen.openai as openai_plugin

        monkeypatch.setenv("HERMES_HOME", str(tmp_path))
        monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
        fake_client = MagicMock()
        fake_client.images.generate.return_value = SimpleNamespace(
            data=[SimpleNamespace(b64_json=_b64_png(), url=None, revised_prompt=None)]
        )
        fake_openai = MagicMock()
        fake_openai.OpenAI.return_value = fake_client
        with patch.dict("sys.modules", {"openai": fake_openai}):
            result = openai_plugin.OpenAIImageGenProvider().generate("a cat")
        assert result["success"] is True
        # Default tier is medium → conservative 0.07 constant.
        assert result["cost_estimate_usd"] == pytest.approx(0.07)

    def test_openai_catalog_declares_costs_for_all_tiers(self):
        import plugins.image_gen.openai as openai_plugin

        for tier, meta in openai_plugin._MODELS.items():
            assert meta["cost_estimate_usd"] > 0, tier

    def test_fal_plugin_stamps_cost_estimate(self, monkeypatch):
        import tools.image_generation_tool as image_tool
        from plugins.image_gen.fal import FalImageGenProvider

        monkeypatch.setattr(
            image_tool, "image_generate_tool",
            lambda **kw: json.dumps(
                {"success": True, "image": "https://x/y.png", "modality": "text"}
            ),
        )
        monkeypatch.setattr(
            image_tool, "_resolve_fal_model",
            lambda: ("fal-ai/flux-2/klein/9b",
                     image_tool.FAL_MODELS["fal-ai/flux-2/klein/9b"]),
        )
        result = FalImageGenProvider().generate("a cat")
        assert result["success"] is True
        assert result["cost_estimate_usd"] == pytest.approx(0.02)

    def test_fal_plugin_no_cost_on_error(self, monkeypatch):
        import tools.image_generation_tool as image_tool
        from plugins.image_gen.fal import FalImageGenProvider

        monkeypatch.setattr(
            image_tool, "image_generate_tool",
            lambda **kw: json.dumps(
                {"success": False, "image": None, "error": "boom",
                 "error_type": "api_error"}
            ),
        )
        result = FalImageGenProvider().generate("a cat")
        assert result["success"] is False
        assert "cost_estimate_usd" not in result

    def test_xai_krea_openrouter_catalogs_declare_costs(self):
        import plugins.image_gen.krea as krea_plugin
        import plugins.image_gen.openrouter as or_plugin
        import plugins.image_gen.xai as xai_plugin

        for meta in xai_plugin._MODELS.values():
            assert meta["cost_estimate_usd"] > 0
        for meta in krea_plugin._MODELS.values():
            assert meta["cost_estimate_usd"] > 0
        assert or_plugin._COST_ESTIMATES_USD
        for value in or_plugin._COST_ESTIMATES_USD.values():
            assert value > 0
