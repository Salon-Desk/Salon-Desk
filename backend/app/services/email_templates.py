"""Modern 2026 Reusable Email Templates for SalonDesk.

Features:
- Responsive, mobile-first design with fluid container sizing.
- Dark mode compatibility (@media prefers-color-scheme).
- SalonDesk brand theming (Amber gold #F59E0B, Sky blue #0284C7, Slate #0F172A).
- Bulletproof HTML typography, card layouts, pill badges, and CTA buttons.
- Standardized header with logo mark, wordmark, and "A hold, not a charge" badge.
- Standardized 2026 footer with PayPal hold assurance, links, and security notice.
- Plain text alternative companion for every email template.
"""

from __future__ import annotations

import html
from typing import Literal

BadgeVariant = Literal["primary", "sky", "success", "danger", "neutral"]
CalloutVariant = Literal["amber", "sky", "emerald", "rose"]


def _badge_colors(variant: BadgeVariant) -> tuple[str, str, str]:
    """Return (background, text_color, border_color) for status badges."""
    colors = {
        "primary": ("#FEF3C7", "#92400E", "#FDE68A"),
        "sky": ("#E0F2FE", "#0369A1", "#BAE6FD"),
        "success": ("#DCFCE7", "#15803D", "#BBF7D0"),
        "danger": ("#FEE2E2", "#B91C1C", "#FECACA"),
        "neutral": ("#F1F5F9", "#334155", "#E2E8F0"),
    }
    return colors.get(variant, colors["primary"])


def _callout_colors(variant: CalloutVariant) -> tuple[str, str, str, str]:
    """Return (background, border_left_color, title_color, body_color)."""
    colors = {
        "amber": ("#FFFBEB", "#F59E0B", "#92400E", "#78350F"),
        "sky": ("#F0F9FF", "#0284C7", "#0369A1", "#0C4A6E"),
        "emerald": ("#F0FDF4", "#10B981", "#15803D", "#14532D"),
        "rose": ("#FEF2F2", "#EF4444", "#B91C1C", "#7F1D1D"),
    }
    return colors.get(variant, colors["amber"])


def render_button(
    text: str,
    url: str,
    *,
    variant: Literal["primary", "dark", "outline"] = "dark",
) -> str:
    """Render a bulletproof email button."""
    escaped_text = html.escape(text)
    escaped_url = html.escape(url, quote=True)

    if variant == "primary":
        bg_color = "#D97706"
        text_color = "#FFFFFF"
        border = "1px solid #B45309"
    elif variant == "outline":
        bg_color = "#FFFFFF"
        text_color = "#0F172A"
        border = "1px solid #CBD5E1"
    else:  # dark luxury
        bg_color = "#0F172A"
        text_color = "#FFFFFF"
        border = "1px solid #0F172A"

    return f"""
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 20px 0;">
      <tr>
        <td align="center" style="border-radius: 10px; background-color: {bg_color};">
          <a href="{escaped_url}"
             target="_blank"
             style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: {text_color}; text-decoration: none; border-radius: 10px; border: {border}; letter-spacing: -0.2px;">
            {escaped_text} &rarr;
          </a>
        </td>
      </tr>
    </table>
    """


def render_detail_table(rows: list[tuple[str, str]]) -> str:
    """Render a modern key-value details card with subtle borders and crisp typography."""
    if not rows:
        return ""

    row_html_list: list[str] = []
    total_rows = len(rows)
    for idx, (label, val) in enumerate(rows):
        is_last = idx == total_rows - 1
        border_bottom = "" if is_last else "border-bottom: 1px solid #E2E8F0;"
        row_html_list.append(f"""
          <tr>
            <td class="email-detail-label" style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748B; width: 38%; vertical-align: top; {border_bottom}">
              {html.escape(label)}
            </td>
            <td class="email-detail-value" style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: #0F172A; text-align: right; vertical-align: top; {border_bottom}">
              {html.escape(val)}
            </td>
          </tr>
        """)

    rows_content = "".join(row_html_list)

    return f"""
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-detail-card" style="margin: 22px 0; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; border-collapse: separate; border-spacing: 0; overflow: hidden;">
      {rows_content}
    </table>
    """


def render_callout_box(
    text: str,
    *,
    title: str | None = None,
    variant: CalloutVariant = "amber",
) -> str:
    """Render an informational or security callout box with a colored accent border."""
    bg, border_color, title_color, body_color = _callout_colors(variant)
    title_html = (
        f"<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: {title_color}; margin-bottom: 4px;\">{html.escape(title)}</div>"
        if title
        else ""
    )
    return f"""
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: {bg}; border-left: 4px solid {border_color}; border-radius: 0 10px 10px 0;">
      <tr>
        <td style="padding: 14px 18px;">
          {title_html}
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.5; color: {body_color};">
            {html.escape(text)}
          </div>
        </td>
      </tr>
    </table>
    """


def render_email_shell(
    *,
    title: str,
    preheader: str,
    content_html: str,
    badge_text: str | None = None,
    badge_variant: BadgeVariant = "primary",
    frontend_base_url: str = "http://localhost:3000",
    recipient_email: str | None = None,
    footer_note: str | None = None,
) -> str:
    """
    Wrap content_html in the modern 2026 SalonDesk email shell.
    Includes proper preheader, brand header, card container, and compliant footer.
    """
    base_url = frontend_base_url.rstrip("/")
    logo_img_url = f"{base_url}/icons/icon-192.png"

    # Preheader spacer to prevent email clients from showing footer snippet in inbox preview
    clean_preheader = html.escape(preheader)
    preheader_padding = "&zwnj;&nbsp;" * 35

    # Status badge html
    badge_html = ""
    if badge_text:
        bg, text_color, border_color = _badge_colors(badge_variant)
        badge_html = f"""
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; background-color: {bg}; color: {text_color}; border: 1px solid {border_color}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px;">
            {html.escape(badge_text)}
          </span>
        </div>
        """

    footer_note_html = ""
    if footer_note:
        footer_note_html = f"""
        <p class="email-footer-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.6; color: #64748B; margin: 8px 0 0 0;">
          {html.escape(footer_note)}
        </p>
        """

    recipient_note = (
        f"This email was sent to {html.escape(recipient_email)}."
        if recipient_email
        else "This is an automated transactional message."
    )

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>{html.escape(title)}</title>
  <style type="text/css">
    body {{
      margin: 0;
      padding: 0;
      min-width: 100%;
      background-color: #F8FAFC;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }}
    table {{
      border-collapse: separate;
    }}
    a, a:visited {{
      color: #0284C7;
      text-decoration: underline;
    }}
    a:hover {{
      color: #0369A1;
    }}
    @media only screen and (max-width: 620px) {{
      .email-container {{
        width: 100% !important;
        max-width: 100% !important;
      }}
      .email-card {{
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        padding: 24px 20px !important;
      }}
      .email-header-padding {{
        padding: 24px 16px 18px 16px !important;
      }}
    }}
    @media (prefers-color-scheme: dark) {{
      body, .email-bg {{
        background-color: #0B0F19 !important;
      }}
      .email-card {{
        background-color: #111827 !important;
        border-color: #1F2937 !important;
      }}
      .email-title {{
        color: #F9FAFB !important;
      }}
      .email-text {{
        color: #E2E8F0 !important;
      }}
      .email-detail-card {{
        background-color: #1A2234 !important;
        border-color: #374151 !important;
      }}
      .email-detail-label {{
        color: #94A3B8 !important;
      }}
      .email-detail-value {{
        color: #F1F5F9 !important;
      }}
      .email-footer-text, .email-footer-links {{
        color: #64748B !important;
      }}
      .email-divider {{
        border-color: #1F2937 !important;
      }}
    }}
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #F8FAFC;">

  <!-- Preheader text for inbox snippet preview -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    {clean_preheader} {preheader_padding}
  </div>

  <!-- Outer background container -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color: #F8FAFC; width: 100%; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 0 12px;">

        <!-- Main centered container (600px standard) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto;">

          <!-- BRAND HEADER -->
          <tr>
            <td align="center" class="email-header-padding" style="padding: 36px 12px 24px 12px;">
              <a href="{base_url}" target="_blank" style="text-decoration: none; display: inline-block;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="middle" style="padding-right: 12px;">
                      <!-- High-resolution app mark icon with fallback styling -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 44px; height: 44px; border-radius: 11px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%); text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);">
                            <img src="{logo_img_url}" width="44" height="44" alt="SalonDesk" style="display: block; border: 0; border-radius: 11px; width: 44px; height: 44px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle" align="left">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.1; color: #0F172A;">
                        Salon<span style="color: #0284C7;">Desk</span>
                      </div>
                      <div style="margin-top: 3px;">
                        <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 7px; border-radius: 9999px;">
                          DEPOSITS
                        </span>
                        <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 500; color: #64748B; margin-left: 6px;">
                          A hold, not a charge
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- MAIN CARD BODY -->
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02); overflow: hidden;">
                <tr>
                  <td style="padding: 36px 32px;">
                    {badge_html}
                    {content_html}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 28px 24px 44px 24px; text-align: center;">

              <!-- PayPal Security Reassurance Banner -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding: 12px 18px; background-color: #F1F5F9; border-radius: 10px;">
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #475569; font-weight: 500;">
                      <span style="color: #0284C7; font-weight: 700;">&#10003; PayPal Hold Protection:</span>
                      Appointments are held with authorization holds. Funds remain in your account until service completion.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Quick Links -->
              <p class="email-footer-links" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748B; margin: 0 0 12px 0;">
                <a href="{base_url}/client/bookings" style="color: #64748B; text-decoration: none; font-weight: 600;">My Bookings</a>
                &nbsp;&bull;&nbsp;
                <a href="{base_url}" style="color: #64748B; text-decoration: none; font-weight: 600;">Salon Directory</a>
                &nbsp;&bull;&nbsp;
                <a href="{base_url}/merchant" style="color: #64748B; text-decoration: none; font-weight: 600;">Merchant Portal</a>
              </p>

              <!-- Recipient & Automated Notice -->
              <p class="email-footer-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #94A3B8; margin: 0 0 8px 0;">
                {recipient_note} Please do not reply directly to this email.
              </p>

              {footer_note_html}

              <!-- Copyright -->
              <p class="email-footer-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #94A3B8; margin: 12px 0 0 0;">
                &copy; 2026 SalonDesk Inc. All rights reserved. &bull; Modern deposit &amp; booking management.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
"""


# ---------------------------------------------------------------------------
# Specific High-Level Email Builders (Produce subject, text_body, html_body)
# ---------------------------------------------------------------------------


def build_verification_email(
    *,
    first_name: str,
    token: str,
    to_address: str,
    frontend_base_url: str = "http://localhost:3000",
) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML for email verification."""
    base_url = frontend_base_url.rstrip("/")
    link = f"{base_url}/verify-email?token={token}"
    subject = "Verify your SalonDesk email"
    preheader = f"Hi {first_name}, confirm your email to complete your SalonDesk account setup."

    text_body = (
        f"Hi {first_name},\n\n"
        "Welcome to SalonDesk. Please verify your email to finish setting up your account:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours. If you did not create an account, ignore this message.\n\n"
        "— The SalonDesk Team\n"
        "A hold, not a charge • https://salondesk.local\n"
    )

    content_html = f"""
      <h1 class="email-title" style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
        Verify your email address
      </h1>
      <p class="email-text" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        Hi <strong>{
        html.escape(first_name)
    }</strong>, welcome to SalonDesk! Please confirm your email address to activate your account and start booking appointments or managing your salon.
      </p>

      {render_button("Verify Email Address", link, variant="primary")}

      {
        render_callout_box(
            "This verification link expires in 24 hours. If you did not sign up for a SalonDesk account, no action is needed and you can safely ignore this email.",
            title="Security Note",
            variant="amber",
        )
    }

      <p class="email-text" style="margin: 20px 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748B;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; word-break: break-all; color: #0284C7; background-color: #F1F5F9; padding: 10px 12px; border-radius: 8px;">
        {html.escape(link)}
      </p>
    """

    html_body = render_email_shell(
        title=subject,
        preheader=preheader,
        content_html=content_html,
        badge_text="Verification Required",
        badge_variant="primary",
        frontend_base_url=frontend_base_url,
        recipient_email=to_address,
    )
    return subject, text_body, html_body


def build_password_reset_email(
    *,
    first_name: str,
    token: str,
    to_address: str,
    frontend_base_url: str = "http://localhost:3000",
) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML for password reset."""
    base_url = frontend_base_url.rstrip("/")
    link = f"{base_url}/reset-password?token={token}"
    subject = "Reset your SalonDesk password"
    preheader = (
        f"Hi {first_name}, follow this secure link to reset your SalonDesk account password."
    )

    text_body = (
        f"Hi {first_name},\n\n"
        "We received a request to reset your SalonDesk password:\n\n"
        f"{link}\n\n"
        "This link expires in 1 hour. If you did not request a reset, ignore this message.\n\n"
        "— The SalonDesk Team\n"
    )

    content_html = f"""
      <h1 class="email-title" style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
        Reset your SalonDesk password
      </h1>
      <p class="email-text" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        Hi <strong>{
        html.escape(first_name)
    }</strong>, we received a request to reset the password for your SalonDesk account. Click below to choose a new password.
      </p>

      {render_button("Reset Password", link, variant="dark")}

      {
        render_callout_box(
            "This password reset link expires in 1 hour. If you did not request this change, please ignore this email; your account remains secure.",
            title="Security Advisory",
            variant="sky",
        )
    }

      <p class="email-text" style="margin: 20px 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748B;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; word-break: break-all; color: #0284C7; background-color: #F1F5F9; padding: 10px 12px; border-radius: 8px;">
        {html.escape(link)}
      </p>
    """

    html_body = render_email_shell(
        title=subject,
        preheader=preheader,
        content_html=content_html,
        badge_text="Security Notice",
        badge_variant="sky",
        frontend_base_url=frontend_base_url,
        recipient_email=to_address,
    )
    return subject, text_body, html_body


def build_booking_confirmation_email(
    *,
    client_name: str,
    service_name: str,
    salon_name: str,
    starts_at_label: str,
    hold_amount: str,
    no_show_fee: str,
    free_cancel_deadline: str,
    booking_id: str,
    to_address: str,
    frontend_base_url: str = "http://localhost:3000",
) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML for booking confirmation."""
    base_url = frontend_base_url.rstrip("/")
    portal_link = f"{base_url}/client/bookings"
    subject = f"Booking confirmed — {service_name} at {salon_name}"
    preheader = (
        f"Confirmed: {service_name} at {salon_name} on {starts_at_label}. PayPal hold secured."
    )

    text_body = (
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
        f"View booking: {portal_link}\n"
    )

    detail_rows = [
        ("Service", service_name),
        ("Salon", salon_name),
        ("Scheduled Time", starts_at_label),
        ("Hold Amount", f"${hold_amount} USD (Hold only)"),
        ("Agreed No-Show Fee", f"${no_show_fee} USD"),
        ("Free Cancel Deadline", free_cancel_deadline),
        ("Booking ID", booking_id),
    ]

    content_html = f"""
      <h1 class="email-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
        Appointment Confirmed
      </h1>
      <p class="email-text" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        Hi <strong>{html.escape(client_name)}</strong>, your appointment at <strong>{
        html.escape(salon_name)
    }</strong> is locked in! A PayPal authorization hold is active to protect your appointment.
      </p>

      {render_detail_table(detail_rows)}

      {
        render_callout_box(
            f"A hold, not a charge: ${hold_amount} USD is authorized on your payment method, but zero dollars are captured today. Your hold settles or releases upon appointment completion.",
            title="Deposit Protection Guarantee",
            variant="amber",
        )
    }

      {render_button("View Booking in Portal", portal_link, variant="primary")}

      <p class="email-text" style="margin: 16px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.5; color: #64748B;">
        Need to adjust or cancel? Free cancellation is available until <strong>{
        html.escape(free_cancel_deadline)
    }</strong> in your portal.
      </p>
    """

    html_body = render_email_shell(
        title=subject,
        preheader=preheader,
        content_html=content_html,
        badge_text="Confirmed Booking",
        badge_variant="success",
        frontend_base_url=frontend_base_url,
        recipient_email=to_address,
    )
    return subject, text_body, html_body


def build_booking_reminder_email(
    *,
    client_name: str,
    service_name: str,
    salon_name: str,
    starts_at_label: str,
    free_cancel_deadline: str,
    booking_id: str,
    to_address: str,
    frontend_base_url: str = "http://localhost:3000",
) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML for appointment reminder."""
    base_url = frontend_base_url.rstrip("/")
    portal_link = f"{base_url}/client/bookings"
    subject = f"Reminder — {service_name} at {salon_name}"
    preheader = (
        f"Reminder: Your appointment for {service_name} at {salon_name} is on {starts_at_label}."
    )

    text_body = (
        f"Hi {client_name},\n\n"
        "This is a reminder for your upcoming SalonDesk appointment.\n\n"
        f"Service: {service_name}\n"
        f"Salon: {salon_name}\n"
        f"When: {starts_at_label}\n"
        f"Free cancel until: {free_cancel_deadline}\n"
        f"Booking ref: {booking_id}\n\n"
        f"View details: {portal_link}\n\n"
        "See you soon!\n"
    )

    detail_rows = [
        ("Service", service_name),
        ("Salon", salon_name),
        ("Scheduled Time", starts_at_label),
        ("Free Cancel Until", free_cancel_deadline),
        ("Booking ID", booking_id),
    ]

    content_html = f"""
      <h1 class="email-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
        Upcoming Appointment Reminder
      </h1>
      <p class="email-text" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        Hi <strong>{
        html.escape(client_name)
    }</strong>, just a friendly reminder that your upcoming appointment at <strong>{
        html.escape(salon_name)
    }</strong> is scheduled soon.
      </p>

      {render_detail_table(detail_rows)}

      {
        render_callout_box(
            f"Need to reschedule? You can manage your appointment or cancel without penalty before {free_cancel_deadline}.",
            title="Flexible Policy",
            variant="sky",
        )
    }

      {render_button("Manage Appointment", portal_link, variant="dark")}
    """

    html_body = render_email_shell(
        title=subject,
        preheader=preheader,
        content_html=content_html,
        badge_text="Appointment Reminder",
        badge_variant="primary",
        frontend_base_url=frontend_base_url,
        recipient_email=to_address,
    )
    return subject, text_body, html_body


def build_no_show_fee_captured_email(
    *,
    client_name: str,
    service_name: str,
    salon_name: str,
    starts_at_label: str,
    no_show_fee: str,
    booking_id: str,
    to_address: str,
    paypal_capture_id: str | None = None,
    frontend_base_url: str = "http://localhost:3000",
) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML for no-show fee capture notification."""
    base_url = frontend_base_url.rstrip("/")
    portal_link = f"{base_url}/client/bookings"
    subject = f"No-Show Fee Processed — {service_name} at {salon_name}"
    preheader = f"Notice: No-show fee of ${no_show_fee} USD processed for your missed appointment at {salon_name}."

    text_body = (
        f"Hi {client_name},\n\n"
        f"Your appointment at {salon_name} was marked as a no-show for {starts_at_label}.\n\n"
        f"In accordance with the cancellation policy agreed to at booking time, a no-show fee of "
        f"${no_show_fee} USD has been captured from your authorization hold.\n\n"
        f"• Service: {service_name}\n"
        f"• Salon: {salon_name}\n"
        f"• Scheduled Time: {starts_at_label}\n"
        f"• Captured Fee: ${no_show_fee} USD\n"
        f"• Transaction Ref: {paypal_capture_id or 'Processed'}\n"
        f"• Booking Ref: {booking_id}\n\n"
        "The remainder of your authorization hold has been released ($0 remaining hold).\n\n"
        "You can view your cryptographic receipt or contact the salon in your SalonDesk portal:\n"
        f"{portal_link}\n\n"
        "If you believe this fee was assessed in error, you can dispute it directly from your SalonDesk bookings view.\n"
    )

    detail_rows = [
        ("Service", service_name),
        ("Salon", salon_name),
        ("Scheduled Time", starts_at_label),
        ("Captured Fee", f"${no_show_fee} USD"),
        ("Transaction Ref", paypal_capture_id or "Processed"),
        ("Booking ID", booking_id),
    ]

    content_html = f"""
      <h1 class="email-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
        No-Show Fee Processed
      </h1>
      <p class="email-text" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        Hi <strong>{html.escape(client_name)}</strong>, your appointment at <strong>{
        html.escape(salon_name)
    }</strong> was marked as a missed appointment for {html.escape(starts_at_label)}.
      </p>
      <p class="email-text" style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        In accordance with the cancellation policy agreed to at booking time, a no-show fee of <strong>${
        html.escape(no_show_fee)
    } USD</strong> has been captured from your PayPal authorization hold.
      </p>

      {render_detail_table(detail_rows)}

      {
        render_callout_box(
            "The remainder of your authorization hold has been released ($0 remaining hold). No further charges will be made to your payment method.",
            title="Hold Status: Released",
            variant="rose",
        )
    }

      {render_button("View Booking & Receipt", portal_link, variant="primary")}

      {
        render_callout_box(
            "Dispute Rights: If you believe this fee was assessed in error or had a documented medical/travel emergency, you can file a dispute directly through your SalonDesk bookings view.",
            title="Dispute Resolution",
            variant="sky",
        )
    }
    """

    html_body = render_email_shell(
        title=subject,
        preheader=preheader,
        content_html=content_html,
        badge_text="Policy Enforcement",
        badge_variant="danger",
        frontend_base_url=frontend_base_url,
        recipient_email=to_address,
    )
    return subject, text_body, html_body


def build_platform_notification_email(
    *,
    subject: str,
    message: str,
    to_address: str | None = None,
    frontend_base_url: str = "http://localhost:3000",
) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML for platform ops notification."""
    base_url = frontend_base_url.rstrip("/")
    admin_link = f"{base_url}/admin"
    preheader = f"SalonDesk Operations Alert: {subject}"

    escaped_msg = html.escape(message).replace("\n", "<br/>")

    content_html = f"""
      <h1 class="email-title" style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.4px;">
        Operations Dispatch
      </h1>
      <div class="email-text" style="margin: 16px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6; color: #1E293B; background-color: #F8FAFC; padding: 16px; border: 1px solid #E2E8F0; border-radius: 10px;">
        {escaped_msg}
      </div>

      {render_button("Open Admin Console", admin_link, variant="dark")}
    """

    html_body = render_email_shell(
        title=subject,
        preheader=preheader,
        content_html=content_html,
        badge_text="Ops Alert",
        badge_variant="neutral",
        frontend_base_url=frontend_base_url,
        recipient_email=to_address,
    )
    return subject, message, html_body
