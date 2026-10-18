import enum


class UserRole(str, enum.Enum):
    CLIENT = "client"
    ORG_OWNER = "org_owner"
    RECEPTION = "reception"
    STYLIST = "stylist"
    PLATFORM_ADMIN = "platform_admin"
    PLATFORM_STAFF = "platform_staff"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class OrganizationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"


class OrgAccountStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class OrgCancellationPolicyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ServiceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class ChangeRequestType(str, enum.Enum):
    PAYPAL_ACCOUNT = "PAYPAL_ACCOUNT"
    CANCELLATION_POLICY = "CANCELLATION_POLICY"


class ChangeRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PaymentHoldStatus(str, enum.Enum):
    AUTHORIZED = "AUTHORIZED"
    CAPTURED = "CAPTURED"
    PARTIALLY_CAPTURED = "PARTIALLY_CAPTURED"
    VOIDED = "VOIDED"
    EXPIRED = "EXPIRED"


class PaymentCaptureType(str, enum.Enum):
    FULL = "FULL"
    NO_SHOW_FEE = "NO_SHOW_FEE"
    PARTIAL = "PARTIAL"


class PlatformCommissionType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"
    HYBRID = "hybrid"


class KnowledgeEntityType(str, enum.Enum):
    """What a knowledge_chunk indexes for semantic search."""

    SERVICE = "service"
    ORGANIZATION = "organization"
    CATEGORY = "category"
    POLICY = "policy"
    PLATFORM = "platform"
    # How-to / support docs for merchant console and platform admin (not booking catalog)
    ORG_GUIDE = "org_guide"
    ADMIN_GUIDE = "admin_guide"
