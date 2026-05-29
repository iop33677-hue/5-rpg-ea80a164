"""Local ASGI entry point for backend preview servers.

The production Vercel wrapper lives in ``api/index.py`` and the application
implementation lives in ``app/main.py``.  Some local/preview runners start
Uvicorn from the backend root as ``main:app``, so this module re-exports the
same FastAPI app without duplicating any application logic.
"""

from app.main import app

__all__ = ["app"]
