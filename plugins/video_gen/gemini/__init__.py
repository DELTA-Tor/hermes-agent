"""Google Gemini Omni Flash video generation backend.

The provider implements Hermes' existing :class:`VideoGenProvider` surface
through Google's Interactions API.  It deliberately keeps the unified Hermes
scope narrow: text-to-video, image-to-video, and reference-to-video.  Stateful
video editing stays out of this provider because the common ``video_generate``
tool does not expose an edit operation.

Authentication uses ``GEMINI_API_KEY`` with ``GOOGLE_API_KEY`` as the same
repo-wide alias used by the Gemini image provider.  The credential is sent
only in the ``x-goog-api-key`` header.
"""

from __future__ import annotations

import base64
import logging
import mimetypes
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

from agent.video_gen_provider import (
    DEFAULT_ASPECT_RATIO,
    DEFAULT_RESOLUTION,
    VideoGenProvider,
    error_response,
    save_b64_video,
    success_response,
)

logger = logging.getLogger(__name__)

MODEL_ID = "gemini-omni-flash-preview"
_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
_SUPPORTED_ASPECT_RATIOS = ("16:9", "9:16")
_SUPPORTED_RESOLUTIONS = ("720p",)
_MAX_REFERENCE_IMAGES = 3
_REQUEST_TIMEOUT_SECONDS = 900

# Google bills about $0.10 per generated second.  The API may return between
# 3 and 10 seconds and does not currently expose a documented exact-duration
# request field, so budget consumers must reserve the worst case.
MAX_COST_ESTIMATE_USD = 1.00


def _resolve_api_key() -> str:
    for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        value = (os.environ.get(name) or "").strip()
        if value:
            return value
    return ""


def _load_source_image(ref: str) -> Dict[str, str]:
    """Return an Interactions API image item for a URL, data URI, or path."""
    ref = ref.strip()
    lower = ref.lower()

    if lower.startswith("data:"):
        header, separator, data = ref.partition(",")
        if not separator or not data:
            raise ValueError("image data URI is malformed")
        mime_type = header.split(";", 1)[0].split(":", 1)[-1] or "image/png"
        return {"type": "image", "data": data, "mime_type": mime_type}

    if lower.startswith(("http://", "https://")):
        response = requests.get(ref, timeout=60)
        response.raise_for_status()
        mime_type = (response.headers.get("Content-Type") or "").split(";", 1)[0]
        if not mime_type.startswith("image/"):
            guessed, _ = mimetypes.guess_type(ref.split("?", 1)[0])
            mime_type = guessed if guessed and guessed.startswith("image/") else "image/png"
        return {
            "type": "image",
            "data": base64.b64encode(response.content).decode("ascii"),
            "mime_type": mime_type,
        }

    from agent.file_safety import raise_if_read_blocked

    path = Path(os.path.expanduser(ref))
    raise_if_read_blocked(str(path))
    raw = path.read_bytes()
    mime_type, _ = mimetypes.guess_type(path.name)
    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/png"
    return {
        "type": "image",
        "data": base64.b64encode(raw).decode("ascii"),
        "mime_type": mime_type,
    }


def _extract_video_data(payload: Dict[str, Any]) -> tuple[str, str]:
    """Return ``(base64_data, mime_type)`` from a REST interaction response."""
    for step in payload.get("steps") or []:
        if not isinstance(step, dict):
            continue
        for item in step.get("content") or []:
            if not isinstance(item, dict) or item.get("type") != "video":
                continue
            data = item.get("data")
            if isinstance(data, str) and data:
                return data, str(item.get("mime_type") or "video/mp4")
    return "", ""


class GeminiOmniVideoGenProvider(VideoGenProvider):
    """Gemini Omni Flash via ``v1beta/interactions``."""

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def display_name(self) -> str:
        return "Google Gemini Omni Flash"

    def is_available(self) -> bool:
        return bool(_resolve_api_key())

    def list_models(self) -> List[Dict[str, Any]]:
        return [{
            "id": MODEL_ID,
            "display": "Gemini Omni Flash (Preview)",
            "speed": "fast preview",
            "strengths": "Video coherence, native audio, multimodal references, conversational refinement",
            "price": "~$0.10/s; $1.00 worst-case reservation",
            "modalities": ["text", "image"],
            "cost_estimate_usd": MAX_COST_ESTIMATE_USD,
        }]

    def default_model(self) -> Optional[str]:
        return MODEL_ID

    def get_setup_schema(self) -> Dict[str, Any]:
        return {
            "name": "Google Gemini Omni Flash",
            "badge": "paid preview",
            "tag": "Fast 3-10s 720p video generation with native audio",
            "env_vars": [{
                "key": "GEMINI_API_KEY",
                "prompt": "Gemini API key",
                "url": "https://aistudio.google.com/apikey",
            }],
        }

    def capabilities(self) -> Dict[str, Any]:
        return {
            "modalities": ["text", "image"],
            "aspect_ratios": list(_SUPPORTED_ASPECT_RATIOS),
            "resolutions": list(_SUPPORTED_RESOLUTIONS),
            "max_duration": 10,
            "min_duration": 3,
            "supports_audio": True,
            "supports_negative_prompt": False,
            "max_reference_images": _MAX_REFERENCE_IMAGES,
        }

    def generate(
        self,
        prompt: str,
        *,
        model: Optional[str] = None,
        image_url: Optional[str] = None,
        reference_image_urls: Optional[List[str]] = None,
        duration: Optional[int] = None,
        aspect_ratio: str = DEFAULT_ASPECT_RATIO,
        resolution: str = DEFAULT_RESOLUTION,
        negative_prompt: Optional[str] = None,
        audio: Optional[bool] = None,
        seed: Optional[int] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        del negative_prompt, audio, seed, kwargs

        clean_prompt = (prompt or "").strip()
        if not clean_prompt:
            return error_response(
                error="prompt is required",
                error_type="invalid_request",
                provider=self.name,
            )

        key = _resolve_api_key()
        if not key:
            return error_response(
                error="GEMINI_API_KEY or GOOGLE_API_KEY is not set",
                error_type="missing_credentials",
                provider=self.name,
                model=MODEL_ID,
                prompt=clean_prompt,
            )

        model_id = model or MODEL_ID
        if model_id != MODEL_ID:
            return error_response(
                error=f"unsupported Gemini video model: {model_id}",
                error_type="invalid_model",
                provider=self.name,
                model=str(model_id),
                prompt=clean_prompt,
            )

        aspect = aspect_ratio if aspect_ratio in _SUPPORTED_ASPECT_RATIOS else DEFAULT_ASPECT_RATIO
        requested_duration = max(3, min(10, int(duration))) if duration else 0
        if requested_duration:
            clean_prompt = f"{clean_prompt}\nTarget duration: approximately {requested_duration} seconds."

        refs: List[str] = []
        if isinstance(image_url, str) and image_url.strip():
            refs.append(image_url.strip())
        refs.extend(
            ref.strip()
            for ref in (reference_image_urls or [])
            if isinstance(ref, str) and ref.strip()
        )
        refs = refs[:_MAX_REFERENCE_IMAGES]

        try:
            image_items = [_load_source_image(ref) for ref in refs]
        except Exception as exc:  # noqa: BLE001 - normalize network/file errors
            return error_response(
                error=f"could not load source image: {exc}",
                error_type="io_error",
                provider=self.name,
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        task = "reference_to_video" if len(image_items) > 1 else (
            "image_to_video" if image_items else "text_to_video"
        )
        interaction_input: Any = clean_prompt
        if image_items:
            interaction_input = [*image_items, {"type": "text", "text": clean_prompt}]

        request_payload = {
            "model": model_id,
            "input": interaction_input,
            "response_format": {"type": "video", "aspect_ratio": aspect},
            "generation_config": {"video_config": {"task": task}},
            "background": False,
            "store": False,
            "stream": False,
        }

        try:
            response = requests.post(
                _INTERACTIONS_URL,
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json=request_payload,
                timeout=_REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:  # noqa: BLE001 - keep provider errors serializable
            logger.debug("Gemini Omni video generation failed", exc_info=True)
            return error_response(
                error=f"Gemini Omni video generation failed: {exc}",
                error_type="api_error",
                provider=self.name,
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        data, mime_type = _extract_video_data(payload if isinstance(payload, dict) else {})
        if not data:
            return error_response(
                error="Gemini Omni returned no inline video data",
                error_type="empty_response",
                provider=self.name,
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        extension = "webm" if mime_type == "video/webm" else "mp4"
        try:
            saved = save_b64_video(data, prefix="gemini_omni", extension=extension)
        except Exception as exc:  # noqa: BLE001
            return error_response(
                error=f"could not save Gemini Omni video: {exc}",
                error_type="io_error",
                provider=self.name,
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect,
            )

        modality = "image" if image_items else "text"
        return success_response(
            video=str(saved),
            model=model_id,
            prompt=prompt,
            modality=modality,
            aspect_ratio=aspect,
            duration=requested_duration,
            provider=self.name,
            extra={
                "resolution": "720p",
                "native_audio": True,
                "task": task,
                "cost_estimate_usd": MAX_COST_ESTIMATE_USD,
                "preview_model": True,
            },
        )


def register(ctx) -> None:
    ctx.register_video_gen_provider(GeminiOmniVideoGenProvider())
