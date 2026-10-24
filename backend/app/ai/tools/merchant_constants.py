"""Page, dialog, and field-copy constants for merchant and admin assistant tools."""

PAGE_MAP: dict[str, str] = {
    "dashboard": "/merchant",
    "calendar": "/merchant/calendar",
    "appointments": "/merchant/appointments",
    "staff": "/merchant/staff",
    "services": "/merchant/services",
    "settings": "/merchant/settings",
    "profile": "/merchant/profile",
    "commission": "/admin/commission",
    "salons": "/admin/salons",
    "taxonomy": "/admin/taxonomy",
    "approvals": "/admin/requests",
    "curation": "/admin/curation",
    "admin_staff": "/admin/staff",
}

DIALOG_MAP: dict[str, str] = {
    "add_staff": "add_staff_modal",
    "add_service": "add_service_modal",
    "edit_service": "edit_service_modal",
    "change_paypal": "paypal_change_request_modal",
    "request_policy": "policy_change_request_modal",
    "change_request_history": "change_request_history_drawer",
    "inspect_booking": "booking_inspector_drawer",
    "settle_booking": "booking_settlement_drawer",
}

FIELD_EXPLANATIONS: dict[str, str] = {
    "agreed_hold_amount": "The total amount of the PayPal authorization hold for this booking. This is the service price and is not charged upfront.",
    "free_cancel_deadline_at": "The deadline for free cancellation. If cancelled before this time, 100% of the hold is voided. After this, late cancel fees apply.",
    "agreed_late_cancel_fee": "The penalty fee that will be captured if the client cancels after the free cancellation deadline.",
    "status": "Current booking status: PENDING (awaiting hold), CONFIRMED (hold authorized), COMPLETED (show captured), NO_SHOW (penalty captured), CANCELLED (voided).",
    "base_price": "The standard price for this service. This is the amount that will be held on the client's PayPal account.",
    "duration_minutes": "How long the service takes in minutes. Used for calendar scheduling and capacity planning.",
    "simultaneous_capacity": "Maximum number of clients that can be booked for this service at the same time.",
    "physical_address": "The physical location of the salon. Displayed to clients and used for nearby recommendations.",
    "timezone": "The salon's timezone. Critical for accurate calendar display and hold timing.",
    "paypal_merchant_id": "The PayPal merchant account ID where client captures settle. Must be approved by platform admin.",
    "currency": "The currency used for all transactions (e.g., USD). Must match the PayPal merchant account currency.",
    "commission_type": "How platform commission is calculated: percentage (of capture), flat (fixed amount), or hybrid (both).",
    "commission_rate": "The percentage or flat rate value for commission calculation.",
    "role": "User role: ORG_OWNER (full access), RECEPTION (front desk), STYLIST (service delivery), PLATFORM_ADMIN (platform operator).",
}
