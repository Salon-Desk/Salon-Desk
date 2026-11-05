"""Unit tests for modern 2026 SalonDesk email templates."""

from app.services import email_templates


def test_render_button() -> str:
    btn = email_templates.render_button(
        "Verify Account", "https://salondesk.local/verify", variant="primary"
    )
    assert "https://salondesk.local/verify" in btn
    assert "Verify Account" in btn
    assert "#D97706" in btn


def test_render_detail_table() -> None:
    rows = [
        ("Service", "Silk Press"),
        ("Salon", "Luxe Cuts"),
        ("Amount", "$85.00 USD"),
    ]
    table = email_templates.render_detail_table(rows)
    assert "Silk Press" in table
    assert "Luxe Cuts" in table
    assert "$85.00 USD" in table
    assert "Service" in table
    assert "email-detail-card" in table


def test_render_callout_box() -> None:
    callout = email_templates.render_callout_box(
        "A hold, not a charge.",
        title="Deposit Protection",
        variant="amber",
    )
    assert "Deposit Protection" in callout
    assert "A hold, not a charge." in callout
    assert "#F59E0B" in callout


def test_build_verification_email() -> None:
    subject, text, html = email_templates.build_verification_email(
        first_name="Hana",
        token="tok_12345",
        to_address="hana@example.com",
        frontend_base_url="https://app.salondesk.local",
    )
    assert "Verify your SalonDesk email" in subject
    assert "https://app.salondesk.local/verify-email?token=tok_12345" in text
    assert "Hana" in text

    # HTML assertions
    assert "<!DOCTYPE html" in html
    assert "Salon" in html
    assert "Desk" in html
    assert "DEPOSITS" in html
    assert "A hold, not a charge" in html
    assert "2026 SalonDesk Inc." in html
    assert "https://app.salondesk.local/verify-email?token=tok_12345" in html
    assert "hana@example.com" in html


def test_build_password_reset_email() -> None:
    subject, text, html = email_templates.build_password_reset_email(
        first_name="Alex",
        token="reset_999",
        to_address="alex@example.com",
        frontend_base_url="https://app.salondesk.local",
    )
    assert "Reset your SalonDesk password" in subject
    assert "https://app.salondesk.local/reset-password?token=reset_999" in text
    assert "Reset Password" in html
    assert "expires in 1 hour" in html
    assert "2026 SalonDesk Inc." in html


def test_build_booking_confirmation_email() -> None:
    subject, text, html = email_templates.build_booking_confirmation_email(
        client_name="Hana",
        service_name="Balayage",
        salon_name="Crown & Glory",
        starts_at_label="Saturday, Nov 15, 2:00 PM",
        hold_amount="45.00",
        no_show_fee="30.00",
        free_cancel_deadline="Nov 14, 2:00 PM",
        booking_id="bk_777",
        to_address="hana@example.com",
        frontend_base_url="https://app.salondesk.local",
    )
    assert "Booking confirmed — Balayage at Crown & Glory" in subject
    assert "$45.00" in text
    assert "$30.00" in text
    assert "bk_777" in text

    # HTML assertions
    assert "Confirmed Booking" in html
    assert "Balayage" in html
    assert "Crown &amp; Glory" in html or "Crown & Glory" in html
    assert "PayPal Hold Protection" in html
    assert "View Booking in Portal" in html
    assert "2026 SalonDesk Inc." in html


def test_build_booking_reminder_email() -> None:
    subject, text, html = email_templates.build_booking_reminder_email(
        client_name="Hana",
        service_name="Balayage",
        salon_name="Crown & Glory",
        starts_at_label="Tomorrow at 2:00 PM",
        free_cancel_deadline="Today at 6:00 PM",
        booking_id="bk_777",
        to_address="hana@example.com",
    )
    assert "Reminder — Balayage at Crown & Glory" in subject
    assert "Appointment Reminder" in html
    assert "Tomorrow at 2:00 PM" in html
    assert "Manage Appointment" in html


def test_build_no_show_fee_captured_email() -> None:
    subject, text, html = email_templates.build_no_show_fee_captured_email(
        client_name="Hana",
        service_name="Braids",
        salon_name="Selam Hair",
        starts_at_label="Oct 31, 3:00 PM",
        no_show_fee="35.00",
        booking_id="bk_888",
        to_address="hana@example.com",
        paypal_capture_id="CAP-12345",
    )
    assert "No-Show Fee Processed" in subject
    assert "$35.00 USD" in text
    assert "remainder of your authorization hold has been released" in text
    assert "Policy Enforcement" in html
    assert "CAP-12345" in html
    assert "Dispute Resolution" in html


def test_build_platform_notification_email() -> None:
    subject, text, html = email_templates.build_platform_notification_email(
        subject="High Volume Hold Authorized",
        message="Hold authorization ID: AUTH-100\nAmount: $250.00",
        to_address="admin@salondesk.local",
    )
    assert subject == "High Volume Hold Authorized"
    assert "AUTH-100" in text
    assert "Ops Alert" in html
    assert "Open Admin Console" in html
