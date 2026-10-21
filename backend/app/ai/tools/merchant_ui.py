"""Navigation, dialog, and field-explanation tools for merchant and admin assistants."""

from __future__ import annotations

import json

from .merchant_constants import DIALOG_MAP, FIELD_EXPLANATIONS, PAGE_MAP


def _error(message: str) -> str:
    return json.dumps({"status": "error", "message": message})


def build_merchant_ui_tools(function_tool) -> list:
    """Return tools that navigate pages, open dialogs, and explain fields."""

    @function_tool()
    async def navigate_to_page(
        page_name: str,
    ) -> str:
        """Navigate to a specific page in the merchant/admin console.

        Supported pages: dashboard, calendar, appointments, staff, services, settings,
        profile, commission (admin only), salons (admin only), taxonomy (admin only),
        approvals (admin only), curation (admin only), staff (admin only).
        """
        page_key = page_name.lower().strip()
        target = PAGE_MAP.get(page_key)

        if not target:
            return _error(
                f"Unknown page: {page_name}. Available pages: {', '.join(PAGE_MAP.keys())}"
            )

        return json.dumps(
            {
                "status": "success",
                "action": "navigate",
                "target": target,
                "message": f"Navigating to {page_name}...",
            }
        )

    @function_tool()
    async def open_dialog(
        dialog_name: str,
    ) -> str:
        """Open a specific dialog or modal in the UI.

        Supported dialogs: add_staff, add_service, edit_service, change_paypal,
        request_policy, change_request_history, inspect_booking, settle_booking.
        """
        dialog_key = dialog_name.lower().strip()
        dialog_id = DIALOG_MAP.get(dialog_key)

        if not dialog_id:
            return _error(
                f"Unknown dialog: {dialog_name}. Available dialogs: {', '.join(DIALOG_MAP.keys())}"
            )

        return json.dumps(
            {
                "status": "success",
                "action": "open_dialog",
                "dialog_id": dialog_id,
                "message": f"Opening {dialog_name} dialog...",
            }
        )

    @function_tool()
    async def explain_field(
        field_name: str,
        context: str | None = None,
    ) -> str:
        """Explain the meaning of a form field or API response field.

        Provide the field name and optionally the context (page/form) for more specific explanation.
        """
        field_key = field_name.lower().strip().replace(" ", "_").replace("-", "_")
        explanation = FIELD_EXPLANATIONS.get(field_key)

        if not explanation:
            sample = ", ".join(list(FIELD_EXPLANATIONS.keys())[:5])
            return json.dumps(
                {
                    "status": "warning",
                    "message": (
                        f"No explanation available for field '{field_name}'. Common fields: {sample}"
                    ),
                }
            )

        return json.dumps(
            {
                "status": "success",
                "field": field_name,
                "explanation": explanation,
                "context": context,
            }
        )

    return [navigate_to_page, open_dialog, explain_field]
