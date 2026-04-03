from fastapi import APIRouter

router = APIRouter(prefix="/app-attest", tags=["app-attest"])


class AppAttestMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        await self.app(scope, receive, send)
