"""Google Gemini image generation backend (Nano Banana family).

Exposes Google's Gemini image models via the Generative Language API's
``models/<model>:generateContent`` endpoint as an :class:`ImageGenProvider`
implementation:

    gemini-3-pro-image      "Nano Banana Pro" — default; strongest text
                            rendering, reasoning-aware composition
    gemini-2.5-flash-image  "Nano Banana" — faster + cheaper

Both models are natively multimodal: the same endpoint covers
**text-to-image** (prompt only) and **image-to-image / editing** (prompt +
inline source images), so ``generate()`` routes on the presence of
``image_url`` / ``reference_image_urls`` like the other backends.

Output arrives as inline base64 → saved under ``$HERMES_HOME/cache/images/``.

Selection precedence (first hit wins):

1. ``GEMINI_IMAGE_MODEL`` env var (escape hatch for scripts / tests)
2. ``image_gen.gemini.model`` in ``config.yaml``
3. ``image_gen.model`` in ``config.yaml`` (when it's one of our model IDs)
4. :data:`DEFAULT_MODEL` — ``gemini-3-pro-image``

Auth: ``GEMINI_API_KEY`` (or ``GOOGLE_API_KEY`` — same alias pair the rest
of the codebase honors, see ``hermes_cli/auth.py``). The key travels ONLY
in the ``x-goog-api-key`` request header — never in the URL, never logged.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import requests

from agent.image_gen_provider import (
    DEFAULT_ASPECT_RATIO,
    ImageGenProvider,
    error_response,
    normalize_reference_images,
    resolve_aspect_ratio,
    save_b64_image,
    success_response,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Model catalog
# ---------------------------------------------------------------------------
#
# ``api_model`` is the model id sent to the Generative Language API.
# ``cost_estimate_usd`` is a CONSERVATIVE (upper-bound) per-image constant at
# the default output resolution, used for budgeting/telemetry only:
#
#   gemini-3-pro-image      list ≈ $0.134/image (1K/2K output) → 0.15
#   gemini-2.5-flash-image  list ≈ $0.039/image                → 0.05
#
# Prices drift; we round UP so downstream budget lanes never under-count.

_MODELS: Dict[str, Dict[str, Any]] = {
    "gemini-3-pro-image": {
        "display": "Nano Banana Pro (Gemini 3 Pro Image)",
        "api_model": "gemini-3-pro-image",
        "speed": "~10-20s",
        "strengths": "Best text rendering, reasoning-aware composition, up to 14 reference images",
        "price": "~$0.13/image (1K/2K)",
        "cost_estimate_usd": 0.15,
    },
    "gemini-2.5-flash-image": {
        "display": "Nano Banana (Gemini 2.5 Flash Image)",
        "api_model": "gemini-2.5-flash-image",
        "speed": "~5-10s",
        "strengths": "Fast + cheap, solid editing, character consistency",
        "price": "~$0.04/image",
        "cost_estimate_usd": 0.05,
    },
}

# Configurable default — override per-call precedence documented above.
DEFAULT_MODEL = "gemini-3-pro-image"

_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Semantic aspect ratio (image_gen contract) → Gemini imageConfig strings.
_ASPECT_RATIOS = {
    "landscape": "16:9",
    "square": "1:1",
    "portrait": "9:16",
}

# Gemini image models accept multiple input images per request; clamp to a
# conservative cap (Nano Banana Pro documents up to 14 reference images).
_MAX_REFERENCE_IMAGES = 6

_REQUEST_TIMEOUT = 180  # Pro image generations can be slow.


# ---------------------------------------------------------------------------
# Config / auth
# ---------------------------------------------------------------------------


def _resolve_api_key() -> str:
    """Return the Gemini API key from the environment ('' when absent).

    Follows the repo-wide alias pair (``hermes_cli/auth.py``):
    ``GEMINI_API_KEY`` first, then ``GOOGLE_API_KEY``. The value is only
    ever placed into the ``x-goog-api-key`` header — callers MUST NOT log
    it or embed it in URLs.
    """
    for var in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        value = (os.environ.get(var) or "").strip()
        if value:
            return value
    return ""


def _load_gemini_config() -> Dict[str, Any]:
    """Read ``image_gen`` from config.yaml (returns {} on any failure)."""
    try:
        from hermes_cli.config import load_config

        cfg = load_config()
        section = cfg.get("image_gen") if isinstance(cfg, dict) else None
        return section if isinstance(section, dict) else {}
    except Exception as exc:
        logger.debug("Could not load image_gen config: %s", exc)
        return {}


def _resolve_model() -> Tuple[str, Dict[str, Any]]:
    """Decide which model to use and return ``(model_id, meta)``."""
    env_override = os.environ.get("GEMINI_IMAGE_MODEL")
    if env_override and env_override in _MODELS:
        return env_override, _MODELS[env_override]

    cfg = _load_gemini_config()
    gemini_cfg = cfg.get("gemini") if isinstance(cfg.get("gemini"), dict) else {}
    candidate: Optional[str] = None
    if isinstance(gemini_cfg, dict):
        value = gemini_cfg.get("model")
        if isinstance(value, str) and value in _MODELS:
            candidate = value
    if candidate is None:
        top = cfg.get("model")
        if isinstance(top, str) and top in _MODELS:
            candidate = top

    if candidate is not None:
        return candidate, _MODELS[candidate]

    return DEFAULT_MODEL, _MODELS[DEFAULT_MODEL]


# ---------------------------------------------------------------------------
# Source-image loading (for image-to-image / edit)
# ---------------------------------------------------------------------------

_MIME_BY_EXT = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "gif": "image/gif",
}


def _inline_image_part(ref: str) -> Dict[str, Any]:
    """Build a Gemini ``inline_data`` part from a URL / data URI / local path.

    Raises on any network / IO error so the caller can surface a clean
    error_response.
    """
    import base64

    ref = ref.strip()
    lower = ref.lower()

    if lower.startswith("data:"):
        header, _, b64 = ref.partition(",")
        mime = "image/png"
        if "image/" in header:
            sub = header.split("image/", 1)[1].split(";", 1)[0]
            if sub:
                mime = f"image/{sub}"
        return {"inline_data": {"mime_type": mime, "data": b64}}

    if lower.startswith(("http://", "https://")):
        resp = requests.get(ref, timeout=60)
        resp.raise_for_status()
        content_type = (resp.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        mime = content_type if content_type.startswith("image/") else None
        if mime is None:
            ext = ref.split("?", 1)[0].rsplit(".", 1)[-1].lower()
            mime = _MIME_BY_EXT.get(ext, "image/png")
        data = base64.b64encode(resp.content).decode("utf-8")
        return {"inline_data": {"mime_type": mime, "data": data}}

    # Local file path — enforce the shared credential-read guard before
    # reading (same boundary the OpenAI / xAI providers apply).
    from agent.file_safety import raise_if_read_blocked

    path = os.path.expanduser(ref)
    raise_if_read_blocked(path)
    with open(path, "rb") as fh:
        raw = fh.read()
    ext = (os.path.splitext(path)[1].lstrip(".") or "png").lower()
    mime = _MIME_BY_EXT.get(ext, "image/png")
    data = base64.b64encode(raw).decode("utf-8")
    return {"inline_data": {"mime_type": mime, "data": data}}


def _extract_inline_images(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Pull all inline image blobs out of a generateContent response.

    Accepts both camelCase (``inlineData``/``mimeType`` — REST) and
    snake_case (``inline_data``/``mime_type`` — some SDK dumps) key styles.
    Returns a list of ``{"data": <b64>, "mime_type": <mime>}`` dicts.
    """
    images: List[Dict[str, Any]] = []
    candidates = result.get("candidates") or []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        content = candidate.get("content") or {}
        parts = content.get("parts") if isinstance(content, dict) else None
        for part in parts or []:
            if not isinstance(part, dict):
                continue
            blob = part.get("inlineData") or part.get("inline_data")
            if not isinstance(blob, dict):
                continue
            data = blob.get("data")
            if not isinstance(data, str) or not data:
                continue
            mime = blob.get("mimeType") or blob.get("mime_type") or "image/png"
            images.append({"data": data, "mime_type": str(mime)})
    return images


# ---------------------------------------------------------------------------
# Provider
# ---------------------------------------------------------------------------


class GeminiImageGenProvider(ImageGenProvider):
    """Google Gemini ``generateContent`` image backend — Nano Banana family."""

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def display_name(self) -> str:
        return "Google Gemini"

    def is_available(self) -> bool:
        return bool(_resolve_api_key())

    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": model_id,
                "display": meta["display"],
                "speed": meta["speed"],
                "strengths": meta["strengths"],
                "price": meta["price"],
            }
            for model_id, meta in _MODELS.items()
        ]

    def default_model(self) -> Optional[str]:
        return DEFAULT_MODEL

    def get_setup_schema(self) -> Dict[str, Any]:
        return {
            "name": "Google Gemini (Nano Banana)",
            "badge": "paid",
            "tag": (
                "gemini-3-pro-image (Nano Banana Pro) + gemini-2.5-flash-image — "
                "text-to-image & image editing"
            ),
            "env_vars": [
                {
                    "key": "GEMINI_API_KEY",
                    "prompt": "Gemini API key",
                    "url": "https://aistudio.google.com/app/apikey",
                },
            ],
        }

    def capabilities(self) -> Dict[str, Any]:
        return {
            "modalities": ["text", "image"],
            "max_reference_images": _MAX_REFERENCE_IMAGES,
        }

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = DEFAULT_ASPECT_RATIO,
        *,
        image_url: Optional[str] = None,
        reference_image_urls: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        prompt = (prompt or "").strip()
        aspect = resolve_aspect_ratio(aspect_ratio)

        if not prompt:
            return error_response(
                error="Prompt is required and must be a non-empty string",
                error_type="invalid_argument",
                provider="gemini",
                aspect_ratio=aspect,
            )

        api_key = _resolve_api_key()
        if not api_key:
            return error_response(
                error=(
                    "GEMINI_API_KEY not set. Run `hermes tools` → Image "
                    "Generation → Google Gemini to configure, or `hermes "
                    "setup` to add the key."
                ),
                error_type="auth_required",
                provider="gemini",
                aspect_ratio=aspect,
            )

        model_id, meta = _resolve_model()
        api_model = meta["api_model"]

        # Collect source images (primary + references) for image-to-image.
        sources: List[str] = []
        if isinstance(image_url, str) and image_url.strip():
            sources.append(image_url.strip())
        for ref in (normalize_reference_images(reference_image_urls) or []):
            sources.append(ref)
        sources = sources[:_MAX_REFERENCE_IMAGES]
        is_edit = bool(sources)
        modality = "image" if is_edit else "text"

        parts: List[Dict[str, Any]] = [{"text": prompt}]
        if is_edit:
            try:
                for ref in sources:
                    parts.append(_inline_image_part(ref))
            except Exception as exc:
                return error_response(
                    error=f"Could not load source image for editing: {exc}",
                    error_type="io_error",
                    provider="gemini",
                    model=model_id,
                    prompt=prompt,
                    aspect_ratio=aspect,
                )

        payload: Dict[str, Any] = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                # Image models emit interleaved text+image; requesting both
                # modalities is the documented shape for the Nano Banana
                # family (image-only is rejected by some model versions).
                "responseModalities": ["TEXT", "IMAGE"],
                "imageConfig": {
                    "aspectRatio": _ASPECT_RATIOS.get(aspect, "1:1"),
                },
            },
        }

        endpoint_url = f"{_API_BASE}/models/{api_model}:generateContent"
        # SECURITY: the API key goes ONLY into this header — never the URL
        # (URLs land in HTTP logs / proxies) and never a log statement.
        headers = {
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                endpoint_url,
                headers=headers,
                json=payload,
                timeout=_REQUEST_TIMEOUT,
            )
            response.raise_for_status()
        except requests.HTTPError as exc:
            resp = exc.response
            status = resp.status_code if resp is not None else 0
            try:
                err_msg = resp.json().get("error", {}).get("message", resp.text[:300])
            except Exception:
                err_msg = resp.text[:300] if resp is not None else str(exc)
            logger.error("Gemini image gen failed (%d): %s", status, err_msg)
            return error_response(
                error=f"Gemini image generation failed ({status}): {err_msg}",
                error_type="api_error",
                provider="gemini",
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )
        except requests.Timeout:
            return error_response(
                error=f"Gemini image generation timed out ({_REQUEST_TIMEOUT}s)",
                error_type="timeout",
                provider="gemini",
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )
        except requests.ConnectionError as exc:
            return error_response(
                error=f"Gemini connection error: {exc}",
                error_type="connection_error",
                provider="gemini",
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        try:
            result = response.json()
        except Exception as exc:
            return error_response(
                error=f"Gemini returned invalid JSON: {exc}",
                error_type="invalid_response",
                provider="gemini",
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        images = _extract_inline_images(result if isinstance(result, dict) else {})
        if not images:
            # Surface the block reason when present (safety filters etc.).
            detail = ""
            try:
                fb = result.get("promptFeedback") or {}
                if isinstance(fb, dict) and fb.get("blockReason"):
                    detail = f" (blockReason: {fb['blockReason']})"
            except Exception:
                pass
            return error_response(
                error=f"Gemini returned no image data{detail}",
                error_type="empty_response",
                provider="gemini",
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        first = images[0]
        mime_sub = first["mime_type"].split("/", 1)[-1].lower()
        if mime_sub in {"png", "jpeg", "jpg", "webp", "gif"}:
            extension = "jpg" if mime_sub == "jpeg" else mime_sub
        else:
            extension = "png"

        try:
            saved_path = save_b64_image(
                first["data"], prefix=f"gemini_{model_id}", extension=extension
            )
        except Exception as exc:
            return error_response(
                error=f"Could not save image to cache: {exc}",
                error_type="io_error",
                provider="gemini",
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        extra: Dict[str, Any] = {"api_model": api_model}
        usage = result.get("usageMetadata")
        if isinstance(usage, dict) and usage:
            extra["usage"] = usage

        return success_response(
            image=str(saved_path),
            model=model_id,
            prompt=prompt,
            aspect_ratio=aspect,
            provider="gemini",
            modality=modality,
            cost_estimate_usd=meta["cost_estimate_usd"],
            extra=extra,
        )


# ---------------------------------------------------------------------------
# Plugin entry point
# ---------------------------------------------------------------------------


def register(ctx) -> None:
    """Plugin entry point — wire ``GeminiImageGenProvider`` into the registry."""
    ctx.register_image_gen_provider(GeminiImageGenProvider())
