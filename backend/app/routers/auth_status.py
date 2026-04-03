from fastapi import APIRouter, Depends

from app.auth import require_auth

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def get_me(user: dict = Depends(require_auth)):
    return {
        "id": user.get("sub"),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
    }
