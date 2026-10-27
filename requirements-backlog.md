# SalonDesk — Product Requirements Backlog

Reorganized and edited from `comment.md`. Original file is unchanged.

**Reference org (client detail example):** `/client/org/c8d9f634-b91c-49b7-a8e8-8a2443f5e278`

---

## 1. Platform admin

### 1.1 Salons (`/admin/salons`)

- **Salon detail dialog:** Show full salon details in the detail dialog, including PayPal account information, owner profile, and other relevant fields. Use the client org page above as a content reference, but present it as an admin detail view.

- **Suspend / activate:** Before changing a salon to suspended or active, show a confirmation warning in the custom responsive dialog pattern used elsewhere in the app.

### 1.2 Taxonomy (`/admin/taxonomy`)

- **Status field:** Category management is missing the status field; add and wire it through create/update flows.

- **Dashboard metrics:** Replace static copy such as “Taxonomy State”, “Standardized”, “Multi-tenant salon mapping”, “Commission Ready”, “Universal”, and “Rule-compatible categories” with live counts:
  - Total number of **active organizations** using each category
  - Total number of **active services** across the platform (or scoped appropriately per category)

### 1.3 Staff (`/admin/staff`)

- **Self-delete rules:** A platform admin cannot delete themselves. No user can delete their own account. Platform admins may only remove or delete **other** users.

- **Invites:** Remove the password field when inviting platform staff. Auto-generate a simple 8-character password, email it to the invitee, and support **resend invite** and **password reset** from the admin panel.

### 1.4 Change requests (`/admin/requests`)

- Add a **table view** in addition to any existing layout.
- Render request payloads in plain language so non-technical reviewers can understand them (align with merchant settings readability goals in §2.2).

---

## 2. Permissions & access control

- **Platform guard:** Implement permission guards so platform admin vs platform staff only see routes, pages, and actions they are allowed to use.

- **Merchant guard:** Apply the same pattern on the merchant portal.

- **Permission mapper doc:** Add a markdown mapper file listing, per actor role, which permissions apply and which pages/actions they unlock.

---

## 3. Merchant portal

### 3.1 Settings & onboarding (`/merchant/settings`)

- **Readable copy:** Present settings in user-friendly language, not raw or technical fields.

- **Completion indicators:** When PayPal is not connected, geolocation is missing, shifts/timezone are unset, or policies are incomplete, show clear “complete setup” indicators on the **sidebar** and on the relevant **settings tabs**.

- **PayPal (first time):** If no PayPal account exists yet, allow **direct entry/setup** instead of only “request a change” (there is nothing to change).

- **Cancellation policy (first time):** Require the merchant to **enter** the cancellation policy on first setup—no silent default. Do not force a change-request flow when the policy is being set for the first time.

### 3.2 Staff invites

- Match platform admin behavior: no password on invite, auto-generated 8-character password via email, plus **resend** and **password reset** in the merchant admin UI.

### 3.3 Profiles

- **User avatar & handle:** Support a separate profile picture and handle for individual users (owners/staff), similar to organization branding.

### 3.4 Scheduling & staff capabilities

- **Shift templates vs assigned shifts:** Separate shift **templates** from **assigned shifts** per employee.

- **Time off:** Implement employee day-off logic.

- **Weekly assignment:** Support dynamic shift assignment driven by configured weekly days.

- **Service categories per staff member:** Allow multiple service categories per staff member; use those assignments in the booking **employee matching** algorithm.

---

## 4. Client portal & booking

### 4.1 Explore & services (`/client/explore?orgId=…`)

- When browsing a **single organization**, allow selecting **multiple services** in one flow.
- Include **stylist** selection and search/filter for services where appropriate.
- Do not regress multi-org or other explore flows.

### 4.2 Booking flow

- **Stylist list:** Do not offer the **owner** as a selectable stylist on the client booking UI (owners should not appear in the stylist list).

- **Party size / multiple bookings:** Support booking for more than one person (e.g. family); add validation for counts, services, and staff availability.

- **Phone number:** Treat the client phone number as **required** for the merchant’s view of the booking (and enforce on client capture as needed).

### 4.3 No-show & fees

- **Client notification:** When a merchant marks a booking as **no-show**, notify the client automatically (no merchant confirmation step required) so the client can dispute or follow up from their side.

- **Commission on fees:** Always include platform **commission** when calculating or charging no-show fees, cancellation fees, and related payment flows.

---

## 5. Authentication & signup

- **Confirm password:** Add a confirm-password field next to password for **client** and **merchant** signup.

- **Merchant terms:** Add a required checkbox for merchants to agree to terms and conditions (commission, platform responsibilities). Surface the policy text they must acknowledge before signup completes.

---

## 6. Global UX & consistency

- **404 page:** Add a frontend 404 page that matches the current design system.

- **AI assistant naming:** Use one consistent chatbot name and labeling across client, merchant, admin, and voice/text surfaces.

---

## Traceability (original item → section)

| Original # | Topic |
| --- | --- |
| 1 | §1.1 Salon detail dialog |
| 2 | §1.1 Suspend/activate warning |
| 3 | §1.2 Taxonomy status |
| 4 | §1.2 Taxonomy metrics |
| 5 | §1.3 Staff self-delete |
| 6 | §1.3 & §3.2 Staff invites |
| 7 | §2 Platform permission guard |
| 8 | §2 Merchant guard + mapper MD |
| 9 | §6 404 page |
| 10 | §5 Signup confirm + merchant T&C |
| 11 | §3.1 PayPal first-time insert |
| 12 | §3.1 Settings copy + §1.4 Requests table |
| 13 | §3.1 Setup completion indicators |
| 14 | §3.1 Cancellation policy first insert |
| 15 | §3.3 User profile picture/handle |
| 16 | §4.2 Owner excluded from stylists |
| 17 | §3.4 Shift template vs assigned |
| 18 | §3.4 Day off + weekly shift assignment |
| 19 | §3.4 Multiple categories per staff |
| 20 | §6 AI chatbot name |
| 21 | §4.2 Required client phone |
| 22 | §4.1 Multi-service single org explore |
| 23 | §4.2 Multiple bookings / party size |
| 24 | §4.3 No-show client notification |
| 25 | §4.3 Commission on fees |
