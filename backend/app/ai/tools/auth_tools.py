"""Authentication tools for voice and chat agents."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.schemas.auth import SignUpRequest
from app.services import auth_service

logger = logging.getLogger("salondesk.ai.auth_tools")


def build_auth_tools(
    session_factory: async_sessionmaker[AsyncSession],
    on_auth_success: Callable[[dict[str, Any]], Any] | None = None,
):
    """Return LiveKit ``@function_tool`` callables for voice/chat login and sign-up."""
    try:
        from livekit.agents import function_tool
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("livekit-agents is required for voice tools") from exc

    @function_tool()
    async def user_login(email: str, password: str) -> str:
        """Authenticate an existing user with their email address and password.
        Use this when a user asks to log in or sign in to their account.
        """
        email_clean = (email or "").strip().lower()
        password_clean = (password or "").strip()
        if not email_clean or not password_clean:
            return json.dumps(
                {
                    "status": "error",
                    "message": "Both email address and password are required to log in.",
                }
            )

        async with session_factory() as session:
            try:
                user = await auth_service.authenticate(session, email_clean, password_clean)
                token = auth_service.issue_token(user)
                first_name = (user.profile.first_name if user.profile else "") or ""
                last_name = (user.profile.last_name if user.profile else "") or ""
                full_name = f"{first_name} {last_name}".strip() or user.email
                user_info = {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                    "first_name": first_name,
                    "last_name": last_name,
                    "name": full_name,
                    "org_id": str(user.org_id) if user.org_id else None,
                }
                payload = {
                    "type": "auth_success",
                    "action": "login",
                    "access_token": token,
                    "user": user_info,
                }
                if on_auth_success:
                    try:
                        res = on_auth_success(payload)
                        if hasattr(res, "__await__"):
                            await res
                    except Exception as exc:
                        logger.warning("on_auth_success callback failed: %s", exc)

                return json.dumps(
                    {
                        "status": "success",
                        "message": f"Login successful for {user.email}! Welcome back {first_name or user.email}.",
                        "user": user_info,
                    }
                )
            except (UnauthorizedError, ForbiddenError) as exc:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Login failed: {exc.message}. Please verify your email and password.",
                    }
                )
            except Exception as exc:
                logger.error("Unexpected error in user_login tool: %s", exc)
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Unable to log in at this moment due to a system issue. Please try again.",
                    }
                )

    @function_tool()
    async def user_signup(
        first_name: str,
        last_name: str,
        email: str,
        password: str,
        phone: str = "",
    ) -> str:
        """Create a new client user account on SalonDesk.
        Use this when a user asks to register, sign up, or create an account.
        """
        first_name_clean = (first_name or "").strip()
        last_name_clean = (last_name or "").strip()
        email_clean = (email or "").strip().lower()
        password_clean = (password or "").strip()
        phone_clean = (phone or "").strip() or None

        if not first_name_clean or not last_name_clean:
            return json.dumps(
                {
                    "status": "error",
                    "message": "First name and last name are required to create an account.",
                }
            )
        if not email_clean or not password_clean:
            return json.dumps(
                {
                    "status": "error",
                    "message": "Email and password are required to create an account.",
                }
            )

        async with session_factory() as session:
            try:
                signup_req = SignUpRequest(
                    first_name=first_name_clean,
                    last_name=last_name_clean,
                    email=email_clean,
                    password=password_clean,
                    phone=phone_clean,
                )
                user = await auth_service.signup_client(session, signup_req)
                await session.commit()
                token = auth_service.issue_token(user)
                user_info = {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                    "first_name": first_name_clean,
                    "last_name": last_name_clean,
                    "name": f"{first_name_clean} {last_name_clean}".strip(),
                    "org_id": None,
                }
                payload = {
                    "type": "auth_success",
                    "action": "signup",
                    "access_token": token,
                    "user": user_info,
                }
                if on_auth_success:
                    try:
                        res = on_auth_success(payload)
                        if hasattr(res, "__await__"):
                            await res
                    except Exception as exc:
                        logger.warning("on_auth_success callback failed: %s", exc)

                return json.dumps(
                    {
                        "status": "success",
                        "message": f"Account created successfully for {first_name_clean}! You are now logged in.",
                        "user": user_info,
                    }
                )
            except ForbiddenError as exc:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Sign-up failed: {exc.message}. If you already have an account, please ask to log in.",
                    }
                )
            except Exception as exc:
                logger.error("Unexpected error in user_signup tool: %s", exc)
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Unable to create account at this moment. Please check your details and try again.",
                    }
                )

    return [user_login, user_signup]
