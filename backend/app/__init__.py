"""Salon Desk backend application package."""

import email_validator

# Allow RFC 6762 .local domains for seeded demo & local development accounts
if "local" in email_validator.SPECIAL_USE_DOMAIN_NAMES:
    email_validator.SPECIAL_USE_DOMAIN_NAMES.remove("local")
