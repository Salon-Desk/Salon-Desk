"""Tests for authentication schemas and seeded demo email validation."""

from __future__ import annotations

import pytest

from app.schemas.auth import SignInRequest, SignUpRequest


@pytest.mark.parametrize(
    "email",
    [
        "admin@salondesk.local",
        "staff@salondesk.local",
        "owner@selam.local",
        "reception@selam.local",
        "stylist1@selam.local",
        "stylist2@selam.local",
        "client@example.com",
        "client2@example.com",
    ],
)
def test_seeded_demo_emails_accepted_by_sign_in_request(email: str) -> None:
    req = SignInRequest(email=email, password="Password123!")
    assert req.email == email


def test_seeded_demo_email_accepted_by_sign_up_request() -> None:
    req = SignUpRequest(
        email="owner@selam.local",
        password="Password123!",
        first_name="Selam",
        last_name="Owner",
    )
    assert req.email == "owner@selam.local"
