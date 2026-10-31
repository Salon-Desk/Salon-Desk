"""SMTP email delivery for verification, booking confirmations, and reminders."""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import get_settings
from app.services import email_templates

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
            start_tls=settings.smtp_port == 587,
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
    subject, body, html = email_templates.build_verification_email(
        first_name=first_name,
        token=token,
        to_address=to_address,
        frontend_base_url=settings.frontend_base_url,
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


async def send_password_reset_email(*, to_address: str, first_name: str, token: str) -> bool:
    settings = get_settings()
    subject, body, html = email_templates.build_password_reset_email(
        first_name=first_name,
        token=token,
        to_address=to_address,
        frontend_base_url=settings.frontend_base_url,
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
    settings = get_settings()
    subject, body, html = email_templates.build_booking_confirmation_email(
        client_name=client_name,
        service_name=service_name,
        salon_name=salon_name,
        starts_at_label=starts_at_label,
        hold_amount=hold_amount,
        no_show_fee=no_show_fee,
        free_cancel_deadline=free_cancel_deadline,
        booking_id=booking_id,
        to_address=to_address,
        frontend_base_url=settings.frontend_base_url,
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


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
    settings = get_settings()
    subject, body, html = email_templates.build_booking_reminder_email(
        client_name=client_name,
        service_name=service_name,
        salon_name=salon_name,
        starts_at_label=starts_at_label,
        free_cancel_deadline=free_cancel_deadline,
        booking_id=booking_id,
        to_address=to_address,
        frontend_base_url=settings.frontend_base_url,
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


async def send_no_show_fee_captured_email(
    *,
    to_address: str,
    client_name: str,
    service_name: str,
    salon_name: str,
    starts_at_label: str,
    no_show_fee: str,
    booking_id: str,
    paypal_capture_id: str | None = None,
) -> bool:
    settings = get_settings()
    subject, body, html = email_templates.build_no_show_fee_captured_email(
        client_name=client_name,
        service_name=service_name,
        salon_name=salon_name,
        starts_at_label=starts_at_label,
        no_show_fee=no_show_fee,
        booking_id=booking_id,
        to_address=to_address,
        paypal_capture_id=paypal_capture_id,
        frontend_base_url=settings.frontend_base_url,
    )
    return await send_email_safe(subject, body, to_address=to_address, html_body=html)


async def notify_platform(
    *,
    subject: str,
    body: str,
) -> bool:
    """Notify the shared ops inbox (NOTIFY_EMAIL) and optional secondary recipient."""
    settings = get_settings()
    subj, text_body, html = email_templates.build_platform_notification_email(
        subject=subject,
        message=body,
        to_address=settings.notify_email or None,
        frontend_base_url=settings.frontend_base_url,
    )
    ok = await send_email_safe(
        subj, text_body, to_address=settings.notify_email or None, html_body=html
    )
    secondary = (settings.yisihak_notify_email or "").strip()
    if secondary and secondary.lower() != (settings.notify_email or "").lower():
        await send_email_safe(subj, text_body, to_address=secondary, html_body=html)
    return ok
