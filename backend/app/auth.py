"""Neon Auth authentication for FastAPI.

CANONICAL SCAFFOLD - Do not modify without updating related guardrails/skills.

This scaffold validates **opaque Neon Auth session tokens** by looking them up
in the project's Postgres database (`neon_auth.session` joined to `neon_auth.user`).

Why session tokens?
- Neon Auth's `/sign-in/email` and `/sign-up/email` responses include an opaque
  session token in the JSON body.
- In cross-origin preview environments, cookie-based flows ("credentials: include")
  can be unreliable and may trigger upstream 500s.
- Validating the session token server-side avoids cookies entirely and fixes
  the common backend error: `Invalid token: Not enough segments`.

NOTE ON USER PROVISIONING:
Many generated apps keep an `app.models.User` row keyed by the Neon user ID.
The first authenticated request may arrive before that row exists, so this
scaffold opportunistically creates the User row during auth when possible.
"""

from __future__ import annotations

import logging
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

# Clock skew tolerance (used for session expiry validation)
CLOCK_SKEW_SECONDS = 60


def _get_db_optional() -> Generator[Session | None, None, None]:
    """Return a DB session if configured; otherwise None."""

    try:
        yield from get_db()
    except RuntimeError:
        yield None


def _try_import_user_model():
    """Try to import the app's User model.

    Supports common project layouts:
    - app/models.py (module): `from app.models import User`
    - app/models/user.py (package): `from app.models.user import User`
    """

    try:
        from app.models import User  # type: ignore

        return User
    except Exception:
        pass

    try:
        from app.models.user import User  # type: ignore

        return User
    except Exception:
        return None


def _set_payload_app_user_id(payload: dict[str, Any], user_obj: Any) -> None:
    """Add the local app user ID to the payload for convenience."""

    user_id = getattr(user_obj, "id", None)
    if user_id is not None:
        payload["app_user_id"] = user_id


def _ensure_app_user_exists(*, db: Session, payload: dict[str, Any]) -> None:
    """Best-effort get-or-create of a local `User` row for this Neon Auth user."""

    neon_user_id = payload.get("sub")
    if not isinstance(neon_user_id, str) or not neon_user_id:
        return

    user_model = _try_import_user_model()
    if user_model is None:
        return

    table = getattr(user_model, "__table__", None)
    if table is None:
        return

    column_names = {c.name for c in table.columns}

    # Find the ID field - could be neon_user_id, auth_user_id, external_id, user_id
    id_field: str | None = None
    for field_name in ["neon_user_id", "auth_user_id", "external_id", "user_id"]:
        if field_name in column_names:
            id_field = field_name
            break

    if not id_field:
        return

    existing = (
        db.query(user_model)
        .filter(getattr(user_model, id_field) == neon_user_id)
        .first()
    )
    if existing is not None:
        _set_payload_app_user_id(payload, existing)
        return

    create_kwargs: dict[str, Any] = {id_field: neon_user_id}

    # Email handling
    email = payload.get("email")
    if "email" in column_names:
        email_column = table.columns["email"]
        is_email_nullable = email_column.nullable

        if isinstance(email, str) and email:
            create_kwargs["email"] = email
        elif not is_email_nullable:
            # Use placeholder if email is required but not in token
            user_suffix = neon_user_id[-12:] if len(neon_user_id) > 12 else neon_user_id
            create_kwargs["email"] = f"user_{user_suffix}@placeholder.local"

    # Name handling
    if "name" in column_names:
        name = payload.get("name") or payload.get("full_name")
        if isinstance(name, str) and name:
            create_kwargs["name"] = name
        else:
            create_kwargs["name"] = "User"

    try:
        new_user = user_model(**create_kwargs)
        db.add(new_user)
        db.commit()
        try:
            db.refresh(new_user)
        except Exception:
            pass
        _set_payload_app_user_id(payload, new_user)

    except IntegrityError:
        # Likely a concurrent request created the row
        db.rollback()
        existing = (
            db.query(user_model)
            .filter(getattr(user_model, id_field) == neon_user_id)
            .first()
        )
        if existing is not None:
            _set_payload_app_user_id(payload, existing)

    except Exception:
        db.rollback()
        logger.exception(
            "Failed to provision local User for Neon user %s", neon_user_id
        )


def _verify_neon_session_token(*, db: Session, token: str) -> dict[str, Any] | None:
    """Validate an opaque Neon Auth session token via database lookup.

    Args:
        db: SQLAlchemy DB session connected to the project's Neon Postgres.
        token: Opaque session token from Neon Auth sign-in/sign-up response.

    Returns:
        A payload dict with user data, or None if invalid.
    """

    if not token:
        return None

    # Some clients may accidentally forward the full cookie value
    # ("<token>.<signature>"). We only store the base token in the DB.
    # Only strip for single-dot tokens (cookie signatures), not JWTs (2 dots).
    candidate_tokens = [token]
    if token.count(".") == 1:
        candidate_tokens.append(token.split(".", 1)[0])

    now = datetime.now(UTC)
    skew = timedelta(seconds=CLOCK_SKEW_SECONDS)

    for candidate in candidate_tokens:
        try:
            row = (
                db.execute(
                    text(
                        """
                        SELECT
                            s."userId" AS user_id,
                            s."expiresAt" AS expires_at,
                            u.email AS email,
                            u.name AS name,
                            u.role AS role,
                            u."emailVerified" AS email_verified,
                            u.banned AS banned
                        FROM neon_auth.session s
                        JOIN neon_auth."user" u ON u.id = s."userId"
                        WHERE s.token = :token
                        LIMIT 1
                        """
                    ),
                    {"token": candidate},
                )
                .mappings()
                .first()
            )
        except Exception:
            logger.exception("Failed to query neon_auth tables for session token")
            # Treat as invalid token to avoid leaking internal details.
            return None

        if not row:
            continue

        expires_at = row.get("expires_at")
        if isinstance(expires_at, datetime):
            # Allow small clock skew.
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=UTC)
            if expires_at < (now - skew):
                return None

        if row.get("banned"):
            # Block banned users (matches Neon Auth admin semantics).
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is banned",
            )

        user_id = row.get("user_id")
        if not user_id:
            return None

        # Build payload with user data.
        payload: dict[str, Any] = {
            "sub": str(user_id),
            "id": str(user_id),
            "email": row.get("email"),
            "name": row.get("name"),
            "role": row.get("role"),
            "emailVerified": row.get("email_verified"),
            "session_token": candidate,
            "auth_type": "session_token",
        }
        return payload

    return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session | None = Depends(_get_db_optional),
) -> dict[str, Any]:
    """Verify Neon Auth session token and return an auth payload.

    Validates the opaque session token via database lookup (neon_auth.session → neon_auth.user).

    Raises:
        HTTPException: 401/403 when token is invalid/expired/banned.
    """

    if credentials is None or not (credentials.credentials or "").strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = credentials.credentials.strip()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cannot validate session token (database not configured)",
        )

    payload = _verify_neon_session_token(db=db, token=token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )

    # Ensure subject claim exists
    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    # Best-effort create local user row
    _ensure_app_user_exists(db=db, payload=payload)

    return payload


def require_auth(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Require authentication - convenience wrapper for router dependencies."""

    return user
