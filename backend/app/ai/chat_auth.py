"""Chat authentication helper for login and sign up via text AI concierge."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm import BaseLLMService, LLMError
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.schemas.ai import ChatMessage
from app.schemas.auth import SignUpRequest
from app.services import auth_service

logger = logging.getLogger("salondesk.ai.chat_auth")

_AUTH_EXTRACT_SYSTEM = """You extract authentication requests from a user chat message and history.
Return ONLY a JSON object (no markdown, no quotes around the json block) with keys:
- "action": "login" | "signup" | "none"
- "email": string or null
- "password": string or null
- "first_name": string or null
- "last_name": string or null
- "phone": string or null

Rules:
- "login": user wants to log in / sign in, or is answering a prompt for login credentials.
- "signup": user wants to sign up / register / create an account, or is answering a prompt for signup details.
- "none": regular salon questions, booking inquiries, or general chat.
"""


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


async def try_handle_chat_auth(
    db: AsyncSession,
    llm: BaseLLMService,
    message: str,
    history: list[ChatMessage],
) -> tuple[bool, str, str | None, dict[str, str | None] | None]:
    """
    Attempt to handle login or signup within chat.
    Returns:
        (handled: bool, reply: str, auth_token: str | None, user_info: dict | None)
    """
    lowered = message.lower()
    auth_keywords = (
        "login",
        "log in",
        "sign in",
        "signin",
        "signup",
        "sign up",
        "register",
        "create account",
        "password",
    )

    # Check if this message or previous assistant message had auth context
    has_auth_context = any(k in lowered for k in auth_keywords)
    if not has_auth_context and history:
        last_turn = history[-1].content.lower()
        has_auth_context = any(k in last_turn for k in auth_keywords)

    if not has_auth_context:
        return False, "", None, None

    prompt_messages = [
        {"role": "system", "content": _AUTH_EXTRACT_SYSTEM},
    ]
    for m in history[-4:]:
        prompt_messages.append({"role": m.role, "content": m.content})
    prompt_messages.append({"role": "user", "content": message})

    try:
        raw = await llm.chat(prompt_messages, temperature=0.0, max_tokens=300)
        parsed = _extract_json(raw)
    except LLMError as exc:
        logger.warning("Auth extraction LLM failed: %s", exc)
        return False, "", None, None

    if not parsed or parsed.get("action") not in ("login", "signup"):
        return False, "", None, None

    action = parsed.get("action")
    email = (parsed.get("email") or "").strip().lower()
    password = (parsed.get("password") or "").strip()
    first_name = (parsed.get("first_name") or "").strip()
    last_name = (parsed.get("last_name") or "").strip()
    phone = (parsed.get("phone") or "").strip() or None

    if action == "login":
        if not email or not password:
            if not email:
                return (
                    True,
                    "Sure — what's the email and password you use for SalonDesk?",
                    None,
                    None,
                )
            return True, f"And the password for {email}?", None, None

        try:
            user = await auth_service.authenticate(db, email, password)
            token = auth_service.issue_token(user)
            u_first = (user.profile.first_name if user.profile else "") or ""
            u_last = (user.profile.last_name if user.profile else "") or ""
            u_name = f"{u_first} {u_last}".strip() or user.email
            user_info = {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                "first_name": u_first,
                "last_name": u_last,
                "name": u_name,
                "org_id": str(user.org_id) if user.org_id else None,
            }
            reply = f"You're in. Welcome back, {u_first or user.email}."
            return True, reply, token, user_info
        except (UnauthorizedError, ForbiddenError) as exc:
            return (
                True,
                f"I couldn't sign you in — {exc.message}. Want to try again?",
                None,
                None,
            )
        except Exception as exc:
            logger.error("Login handling error in chat: %s", exc)
            return True, "I can't sign you in right now. Mind trying again in a moment?", None, None

    elif action == "signup":
        if not first_name or not last_name or not email or not password:
            missing = []
            if not first_name or not last_name:
                missing.append("your first and last name")
            if not email:
                missing.append("your email address")
            if not password:
                missing.append("a secure password")
            return (
                True,
                f"I can set that up — I just need {', '.join(missing)}.",
                None,
                None,
            )

        try:
            signup_req = SignUpRequest(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password=password,
                phone=phone,
            )
            user = await auth_service.signup_client(db, signup_req)
            await db.flush()
            token = auth_service.issue_token(user)
            user_info = {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                "first_name": first_name,
                "last_name": last_name,
                "name": f"{first_name} {last_name}".strip(),
                "org_id": None,
            }
            reply = f"You're all set, {first_name} — you're signed in."
            return True, reply, token, user_info
        except ForbiddenError as exc:
            return (
                True,
                f"I couldn't create that account — {exc.message}. Want to log in instead?",
                None,
                None,
            )
        except Exception as exc:
            logger.error("Signup handling error in chat: %s", exc)
            return (
                True,
                "I couldn't create the account just now. Double-check the details and we can try again.",
                None,
                None,
            )

    return False, "", None, None
