"""Unit tests for seed helpers and handle generation."""

from scripts.seed.helpers import build_user, reset_allocated_handles

from app.models.enums import UserRole


def test_build_user_handles_and_deduplication():
    reset_allocated_handles()

    # Explicit handle
    admin = build_user(
        email="admin@salondesk.local",
        role=UserRole.PLATFORM_ADMIN,
        first_name="Admin",
        last_name="User",
        handle="admin",
    )
    assert admin.profile.handle == "admin"

    # Multi-tenant users sharing email prefix 'owner' across different domains
    owner1 = build_user(
        email="owner@selam.local",
        role=UserRole.ORG_OWNER,
        first_name="Selam",
        last_name="Haile",
    )
    assert owner1.profile.handle == "owner_selam"

    owner2 = build_user(
        email="owner@lovelybeautyspa.local",
        role=UserRole.ORG_OWNER,
        first_name="Sara",
        last_name="Mekonnen",
    )
    assert owner2.profile.handle == "owner_lovelybeautyspa"

    # Stylists with same prefix
    stylist1_org1 = build_user(
        email="stylist1@selam.local",
        role=UserRole.STYLIST,
        first_name="Aster",
        last_name="Bekele",
    )
    stylist1_org2 = build_user(
        email="stylist1@lovelybeautyspa.local",
        role=UserRole.STYLIST,
        first_name="Helen",
        last_name="Tesfaye",
    )
    assert stylist1_org1.profile.handle == "stylist1_selam"
    assert stylist1_org2.profile.handle == "stylist1_lovelybeautyspa"

    # Guaranteed deduplication when email matches an existing handle
    owner1_dup = build_user(
        email="owner@selam.local",
        role=UserRole.ORG_OWNER,
        first_name="Selam",
        last_name="Duplicate",
    )
    assert owner1_dup.profile.handle == "owner_selam_1"
