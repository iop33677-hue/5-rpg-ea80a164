"""Runtime upload endpoints (Appifex scaffold).

Two-step upload flow:
1) Client requests upload contract from generated backend.
2) Generated backend requests presigned URL from Appifex signing endpoint.
3) Client uploads directly to R2 with returned URL.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/runtime-uploads", tags=["runtime-uploads"])


class RuntimeUploadRequest(BaseModel):
    filename: str
    content_type: str
    category: str = "uploads"


class RuntimeUploadResponse(BaseModel):
    upload_url: str
    method: str = "PUT"
    object_key: str
    original_filename: str
    public_url: str | None = None
    headers: dict[str, str] = Field(default_factory=dict)


def _sanitize_segment(value: str, fallback: str) -> str:
    cleaned = "".join(c if c.isalnum() or c in {"-", "_", "."} else "-" for c in value)
    cleaned = cleaned.strip(".-_")
    return cleaned or fallback


def _build_runtime_key(filename: str, category: str = "uploads") -> tuple[str, str]:
    prefix = os.environ.get("APPIFEX_RUNTIME_UPLOAD_PREFIX", "").strip().strip("/")
    if not prefix:
        raise HTTPException(
            status_code=500,
            detail="Runtime upload prefix not configured",
        )

    original_name = Path(filename or "upload").name or "upload"
    suffix = Path(original_name).suffix
    cat = _sanitize_segment(category, "uploads")
    key_name = f"{uuid.uuid4()}{suffix}"

    return f"{prefix}/{cat}/{key_name}", original_name


def call_signing_service(
    signing_url: str,
    request_body: dict[str, Any],
    headers: dict[str, str],
) -> httpx.Response:
    """Call Appifex signing service and normalize transport/upstream errors."""
    try:
        response = httpx.post(
            signing_url, json=request_body, headers=headers, timeout=12.0
        )
        response.raise_for_status()
        return response
    except httpx.HTTPStatusError as exc:
        content_type = (exc.response.headers.get("content-type") or "").lower()
        if "application/json" not in content_type:
            raise HTTPException(
                status_code=502,
                detail="upload signing service returned invalid response",
            ) from exc

        try:
            error_payload = exc.response.json()
        except ValueError as parse_error:
            raise HTTPException(
                status_code=502,
                detail="upload signing service returned invalid response",
            ) from parse_error

        detail = (
            error_payload.get("detail")
            if isinstance(error_payload, dict)
            else "failed to create upload URL"
        )
        raise HTTPException(
            status_code=exc.response.status_code, detail=detail
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail="upload signing service unavailable"
        ) from exc


def parse_upload_contract_response(
    response: httpx.Response,
) -> tuple[str, str | None, dict[str, str]]:
    """Parse signer response. Trust platform for public_url."""
    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="upload signing service returned invalid response",
        ) from exc

    upload_url = data.get("upload_url") or data.get("url")
    if not isinstance(upload_url, str) or not upload_url:
        raise HTTPException(status_code=502, detail="invalid upload contract response")

    response_headers = (
        data.get("headers") if isinstance(data.get("headers"), dict) else {}
    )

    public_url = data.get("public_url")
    return upload_url, public_url, response_headers


@router.post("/presign", response_model=RuntimeUploadResponse)
def create_runtime_upload_url(payload: RuntimeUploadRequest) -> RuntimeUploadResponse:
    """Request runtime upload contract from Appifex signing endpoint."""

    signing_url = os.environ.get("APPIFEX_RUNTIME_UPLOAD_SIGNING_URL", "").strip()
    if not signing_url:
        raise HTTPException(
            status_code=500,
            detail="Runtime upload signing URL is not configured",
        )

    object_key, original_filename = _build_runtime_key(
        payload.filename, payload.category
    )

    request_body: dict[str, Any] = {
        "object_key": object_key,
        "content_type": payload.content_type,
        "original_filename": original_filename,
    }

    gateway_key = os.environ.get("APPIFEX_GATEWAY_API_KEY", "").strip()
    headers: dict[str, str] = {}
    if gateway_key:
        headers["x-appifex-key"] = gateway_key

    response = call_signing_service(signing_url, request_body, headers)
    upload_url, public_url, response_headers = parse_upload_contract_response(response)

    return RuntimeUploadResponse(
        upload_url=upload_url,
        object_key=object_key,
        original_filename=original_filename,
        public_url=public_url,
        headers=response_headers,
    )
