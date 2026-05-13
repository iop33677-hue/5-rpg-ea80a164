import os
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import and initialize standard logging
from app.logging_setup import setup_logging
from app.request_logging_middleware import register_request_logging_middleware
import app.models  # noqa: F401

logger = setup_logging()

app = FastAPI(title="FastAPI Starter API", version="1.0.0", redirect_slashes=False)

# App Attest — auto-injected for Apple apps with backend
try:
    from app.app_attest import AppAttestMiddleware, router as app_attest_router

    app.include_router(app_attest_router)
    app.add_middleware(AppAttestMiddleware)
except ImportError:
    pass

register_request_logging_middleware(app, logger)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Log HTTP exceptions with 5xx status codes."""
    if exc.status_code >= 500:
        extra = {
            "event": "http_exception",
            "request_id": getattr(request.state, "request_id", ""),
            "method": request.method,
            "path": request.url.path,
            "status_code": exc.status_code,
        }
        logger.error("HTTP 5xx response", extra=extra)
    return await http_exception_handler(request, exc)


def _normalize_origin(value: str | None) -> str | None:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None
    parsed = urlsplit(candidate)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return candidate.rstrip("/")


def _allowed_origins_from_env() -> list[str]:
    raw_allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
    parsed_origins: list[str] = []
    seen: set[str] = set()
    for chunk in raw_allowed_origins.split(","):
        origin = _normalize_origin(chunk)
        if origin and origin not in seen:
            seen.add(origin)
            parsed_origins.append(origin)

    if parsed_origins:
        return parsed_origins

    frontend_origin = _normalize_origin(os.getenv("FRONTEND_URL"))
    return [frontend_origin] if frontend_origin else []


# Catch unhandled exceptions INSIDE the CORS middleware so 500 responses
# still carry Access-Control-Allow-Origin headers.
# @app.exception_handler(Exception) cannot be used here because it registers
# on ServerErrorMiddleware, which sits OUTSIDE CORSMiddleware and therefore
# bypasses it — causing the browser to see a CORS error instead of a 500.
@app.middleware("http")
async def _handle_unhandled_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception(
            "Unhandled exception",
            extra={
                "event": "unhandled_exception",
                "request_id": getattr(request.state, "request_id", ""),
                "method": request.method,
                "path": request.url.path,
                "status_code": 500,
            },
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )


# Configure CORS from environment-derived allowed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins_from_env(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handling is done via exception handlers above (sync-compatible)

from app.routers import auth_status, classroom, runtime_uploads, reset, quiz

app.include_router(auth_status.router)
app.include_router(classroom.router)
app.include_router(runtime_uploads.router)
app.include_router(reset.router)
app.include_router(quiz.router)


@app.get("/")
def root():
    return {"message": "FastAPI Starter API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
