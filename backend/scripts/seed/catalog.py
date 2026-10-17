"""Organization catalog built from collected Ethiopia and United States listings."""

from .collected import build_organizations

ORGANIZATION_DEFINITIONS = build_organizations()
