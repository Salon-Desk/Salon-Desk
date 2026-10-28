"""SMTP email delivery for verification, booking confirmations, and reminders."""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    pass


def _smtp_configured() -> bool:
    settings = get_settings()
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


async def send_email(
    subject: str,
    body: str,
    to_address: str | None = None,
    html_body: str | None = None,
) -> None:
    """
    Send email via shared SMTP_* settings.
    Defaults to NOTIFY_EMAIL when to_address is omitted.
    """
    settings = get_settings()
    if not _smtp_configured():
        raise EmailServiceError(
            "SMTP is not configured (set SMTP_HOST / SMTP_USER / SMTP_PASSWORD)"
        )

    destination = (to_address or settings.notify_email or "").strip()
    if not destination:
        raise EmailServiceError("Notify email missing. Set NOTIFY_EMAIL or pass to_address.")

    message = EmailMessage()
    message["From"] = settings.smtp_from or settings.smtp_user
    message["To"] = destination
    message["Subject"] = subject
    message.set_content(body or "")
    if html_body:
        message.add_alternative(html_body, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=settings.smtp_port == 465,
            start_tls=settings.smtp_port in (587, 2525),
            timeout=15.0,
        )
    except Exception as exc:
        raise EmailServiceError(f"Failed to send email: {exc}") from exc


async def send_email_safe(
    subject: str,
    body: str,
    to_address: str | None = None,
    html_body: str | None = None,
) -> bool:
    """Best-effort send; logs and returns False on failure (never raises)."""
    if not _smtp_configured():
        logger.warning("SMTP not configured — skipped email: %s", subject)
        return False
    try:
        await send_email(subject, body, to_address=to_address, html_body=html_body)
        return True
    except EmailServiceError as exc:
        logger.warning("Email send failed (%s): %s", subject, exc)
        return False


async def send_verification_email(*, to_address: str, first_name: str, token: str) -> bool:
    settings = get_settings()
    link = f"{settings.frontend_base_url.rstrip('/')}/verify-email?token={token}"
    subject = "Verify your SalonDesk email"
    body = (
        f"Hi {first_name},\n\n"
        "Welcome to SalonDesk. Please verify your email to finish setting up your account:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours. If you did not create an account, ignore this message.\n"
    )
    html = (
        f"<p>Hi {first_name},</p>"
        "<p>Welcome to SalonDesk. Please verify your email to finish setting up your account:</p>"
        f'<p><a href="{link}">Verify email</a></p>'
        "<p>This link expires in 24 hours.</p>"
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


async def send_password_reset_email(*, to_address: str, first_name: str, token: str) -> bool:
    settings = get_settings()
    link = f"{settings.frontend_base_url.rstrip('/')}/reset-password?token={token}"
    subject = "Reset your SalonDesk password"
    body = (
        f"Hi {first_name},\n\n"
        "We received a request to reset your SalonDesk password:\n\n"
        f"{link}\n\n"
        "This link expires in 1 hour. If you did not request a reset, ignore this message.\n"
    )
    html = (
        f"<p>Hi {first_name},</p>"
        "<p>We received a request to reset your SalonDesk password:</p>"
        f'<p><a href="{link}">Reset password</a></p>'
        "<p>This link expires in 1 hour.</p>"
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


async def send_booking_confirmation_email(
    *,
    to_address: str,
    client_name: str,
    service_name: str,
    salon_name: str,
    starts_at_label: str,
    hold_amount: str,
    no_show_fee: str,
    free_cancel_deadline: str,
    booking_id: str,
) -> bool:
    subject = f"Booking confirmed — {service_name} at {salon_name}"
    body = (
        f"Hi {client_name},\n\n"
        "Your SalonDesk appointment is confirmed and a PayPal authorization hold is in place.\n\n"
        f"Service: {service_name}\n"
        f"Salon: {salon_name}\n"
        f"When: {starts_at_label}\n"
        f"Hold amount: ${hold_amount} (nothing charged today)\n"
        f"Agreed no-show fee: ${no_show_fee}\n"
        f"Free cancel until: {free_cancel_deadline}\n"
        f"Booking ref: {booking_id}\n\n"
        "Settlement uses the price and policy locked at booking time.\n"
    )
    return await send_email_safe(subject, body, to_address=to_address)


async def send_booking_reminder_email(
    *,
    to_address: str,
    client_name: str,
    service_name: str,
    salon_name: str,
    starts_at_label: str,
    free_cancel_deadline: str,
    booking_id: str,
) -> bool:
    subject = f"Reminder — {service_name} at {salon_name}"
    body = (
        f"Hi {client_name},\n\n"
        "This is a reminder for your upcoming SalonDesk appointment.\n\n"
        f"Service: {service_name}\n"
        f"Salon: {salon_name}\n"
        f"When: {starts_at_label}\n"
        f"Free cancel until: {free_cancel_deadline}\n"
        f"Booking ref: {booking_id}\n\n"
        "See you soon!\n"
    )
    return await send_email_safe(subject, body, to_address=to_address)


async def notify_platform(
    *,
    subject: str,
    body: str,
) -> bool:
    """Notify the shared ops inbox (NOTIFY_EMAIL) and optional secondary recipient."""
    settings = get_settings()
    ok = await send_email_safe(subject, body, to_address=settings.notify_email or None)
    secondary = (settings.yisihak_notify_email or "").strip()
    if secondary and secondary.lower() != (settings.notify_email or "").lower():
        await send_email_safe(subject, body, to_address=secondary)
    return ok


async def send_staff_invite_email(
    *,
    to_address: str,
    first_name: str,
    temp_password: str,
    salon_name: str | None = None,
    role_name: str | None = None,
) -> bool:
    """Send welcome invitation with temporary auto-generated credentials to platform or salon staff."""
    settings = get_settings()
    login_url = f"{settings.frontend_base_url.rstrip('/')}/login"
    role_display = role_name.capitalize() if role_name else "team member"

    if salon_name:
        subject = f"Welcome to {salon_name} on SalonDesk"
        invite_context = f"You have been invited to join <strong>{salon_name}</strong> as a {role_display} on SalonDesk."
        text_context = (
            f"You have been invited to join {salon_name} as a {role_display} on SalonDesk."
        )
    else:
        subject = "Welcome to SalonDesk Platform Staff"
        invite_context = "You have been invited as a platform staff member at SalonDesk."
        text_context = "You have been invited as a platform staff member at SalonDesk."

    body = (
        f"Hi {first_name},\n\n"
        f"{text_context}\n\n"
        f"Your login email: {to_address}\n"
        f"Your temporary password: {temp_password}\n\n"
        f"Please log in at: {login_url}\n\n"
        "We recommend changing your password after signing in.\n"
    )
    html = (
        f"<p>Hi {first_name},</p>"
        f"<p>{invite_context}</p>"
        f"<p><strong>Email:</strong> {to_address}<br/>"
        f"<strong>Temporary Password:</strong> <code>{temp_password}</code></p>"
        f'<p><a href="{login_url}">Log in to SalonDesk</a></p>'
        "<p>We recommend changing your password after signing in.</p>"
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


async def send_staff_password_reset_email(
    *,
    to_address: str,
    first_name: str,
    temp_password: str,
    salon_name: str | None = None,
) -> bool:
    """Send reset password notification with new temporary credentials to platform or salon staff."""
    settings = get_settings()
    login_url = f"{settings.frontend_base_url.rstrip('/')}/login"

    if salon_name:
        subject = f"Your {salon_name} Temporary Password"
        reset_context = (
            f"Your password for <strong>{salon_name}</strong> has been reset by an administrator."
        )
        text_context = (
            f"Your password for {salon_name} on SalonDesk has been reset by an administrator."
        )
    else:
        subject = "Your SalonDesk Temporary Password"
        reset_context = "Your SalonDesk platform staff password has been reset by an administrator."
        text_context = "Your SalonDesk platform staff password has been reset by an administrator."

    body = (
        f"Hi {first_name},\n\n"
        f"{text_context}\n\n"
        f"Your login email: {to_address}\n"
        f"Your new temporary password: {temp_password}\n\n"
        f"Please log in at: {login_url}\n\n"
        "We recommend updating your password once logged in.\n"
    )
    html = (
        f"<p>Hi {first_name},</p>"
        f"<p>{reset_context}</p>"
        f"<p><strong>Email:</strong> {to_address}<br/>"
        f"<strong>New Temporary Password:</strong> <code>{temp_password}</code></p>"
        f'<p><a href="{login_url}">Log in to SalonDesk</a></p>'
        "<p>We recommend updating your password once logged in.</p>"
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)
