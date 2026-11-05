# Permissions & Access Control Mapper (RBAC)

This document maps all actor roles across **SalonDesk**, detailing the fine-grained permissions, accessible routes, and UI/API actions unlocked by each role.

---

## 1. Actor Roles Overview

| Role Key | Name & Description | Portal | Primary Scope |
| --- | --- | --- | --- |
| `platform_admin` | **Platform Super Administrator** | Platform (`/admin`) | Unrestricted access across platform configuration, partner salons, change requests, financial commission rates, billing invoices, taxonomy, staff accounts, and moderation. |
| `platform_staff` | **Platform Support & Moderation Agent** | Platform (`/admin`) | Operational agent for salon directory viewing, change request reviews, client feedback moderation, and service category taxonomy. Restricted from financial settings, invoice issuance, and platform staff management. |
| `org_owner` | **Salon Merchant Owner** | Merchant (`/merchant`) | Complete administrative authority over their salon organization: staff roster, services, pricing, business hours, PayPal payout destinations, cancellation policies, and invoice settlements. |
| `reception` | **Front Desk & Operations** | Merchant (`/merchant`) | Day-to-day front desk operations: appointment calendar, walk-in scheduling, booking management, hold settlements, viewing service menus and staff shifts. Restricted from sensitive financial settings, billing, and roster edits. |
| `stylist` | **Service Specialist / Stylist** | Merchant (`/merchant`) | Individual practitioner: personal calendar schedule, appointed client bookings, and personal profile. Restricted from salon-wide dashboard metrics, staff configuration, services pricing, billing, and salon settings. |
| `client` | **Client / Guest** | Client (`/catalog`, `/bookings`) | Public booking discovery, service selection, checkout holds, appointments view, cancellations, and feedback submission. |

---

## 2. Permission Matrix

### 2.1 Platform Permissions

| Permission Key | Description | `platform_admin` | `platform_staff` |
| --- | --- | :---: | :---: |
| `platform:dashboard:view` | View platform-wide KPIs, metrics, and activity stream | Yes | Yes |
| `platform:salons:view` | Search, filter, and inspect partner salon profiles & directory | Yes | Yes |
| `platform:salons:manage` | Approve new salon applications or suspend partner salons | Yes | No |
| `platform:requests:view` | Browse and view submitted salon change requests (PayPal, policies) | Yes | Yes |
| `platform:requests:review` | Review, approve, or reject salon change requests | Yes | Yes |
| `platform:reviews:moderate` | Moderate client feedback, reviews, and ratings | Yes | Yes |
| `platform:commission:view` | Inspect platform commission rates and fee structures | Yes | No |
| `platform:commission:manage`| Create or update platform commission rules and percentages | Yes | No |
| `platform:billing:view` | View generated commission invoices and settlement ledger | Yes | No |
| `platform:billing:manage` | Generate, issue, or void platform commission invoices | Yes | No |
| `platform:taxonomy:view` | View global service categories and categorization metrics | Yes | Yes |
| `platform:taxonomy:manage` | Create, update, activate, or archive service categories | Yes | Yes |
| `platform:curation:view` | Inspect curated salon collections and promoted services | Yes | Yes |
| `platform:curation:manage` | Add or update featured salons and marketing highlights | Yes | Yes |
| `platform:staff:view` | View platform administrative staff directory | Yes | No |
| `platform:staff:manage` | Invite staff, resend invitations, reset passwords, or remove staff | Yes | No |

---

### 2.2 Merchant Permissions

| Permission Key | Description | `org_owner` | `reception` | `stylist` |
| --- | --- | :---: | :---: | :---: |
| `merchant:dashboard:view` | View salon operational dashboard, revenue stats, and hold KPIs | Yes | Yes | No |
| `merchant:calendar:view` | View appointment calendar and service schedule | Yes | Yes | Yes (Self) |
| `merchant:calendar:manage` | Drag-and-drop reschedule, block time, or assign slots | Yes | Yes | No |
| `merchant:appointments:view` | Browse booking list, client consent records, and hold statuses | Yes | Yes | Yes (Self) |
| `merchant:appointments:manage`| Mark client show / no-show, capture holds, or void authorization | Yes | Yes | No |
| `merchant:staff:view` | View salon personnel roster, contact details, and shift schedules | Yes | Yes | No |
| `merchant:staff:manage` | Add staff members, edit details, assign shifts, or delete members | Yes | No | No |
| `merchant:services:view` | View salon service catalog, pricing, and duration | Yes | Yes | No |
| `merchant:services:manage` | Add services, edit pricing/duration, or deactivate services | Yes | No | No |
| `merchant:billing:view` | View platform invoices, commission breakdown, and PayPal account | Yes | No | No |
| `merchant:settings:view` | View salon details, operating hours, PayPal, cancellation policies | Yes | No | No |
| `merchant:settings:manage` | Request changes to PayPal account or amendment to policies | Yes | No | No |
| `merchant:profile:manage` | Update own account profile, name, avatar, and contact details | Yes | Yes | Yes |

---

## 3. Route & Page Access Control

### 3.1 Platform Portal (`/admin/*`)

| Route | Required Permission | Allowed Roles | In-Page Action Controls |
| --- | --- | --- | --- |
| `/admin` | `platform:dashboard:view` | `platform_admin`, `platform_staff` | Full dashboard overview. |
| `/admin/salons` | `platform:salons:view` | `platform_admin`, `platform_staff` | • View and filter directory.<br/>• **Approve / Suspend actions:** only enabled for `platform_admin` (`platform:salons:manage`). |
| `/admin/requests` | `platform:requests:view` | `platform_admin`, `platform_staff` | • Plain-language change diff viewing.<br/>• Review decision actions enabled for both roles. |
| `/admin/reviews` | `platform:reviews:moderate` | `platform_admin`, `platform_staff` | Moderate, approve, or hide client feedback. |
| `/admin/commission` | `platform:commission:manage` | `platform_admin` | Hidden from sidebar and blocked with `<PermissionAccessDenied />` for `platform_staff`. |
| `/admin/billing` | `platform:billing:view` | `platform_admin` | Hidden from sidebar and blocked with `<PermissionAccessDenied />` for `platform_staff`. |
| `/admin/taxonomy` | `platform:taxonomy:view` | `platform_admin`, `platform_staff` | Create, edit, and toggle active/archived status for categories. |
| `/admin/curation` | `platform:curation:view` | `platform_admin`, `platform_staff` | Manage highlighted and curated platform collections. |
| `/admin/staff` | `platform:staff:view` | `platform_admin` | Hidden from sidebar and blocked with `<PermissionAccessDenied />` for `platform_staff`. Self-delete protected. |

---

### 3.2 Merchant Portal (`/merchant/*`)

| Route | Required Permission | Allowed Roles | In-Page Action Controls |
| --- | --- | --- | --- |
| `/merchant` | `merchant:dashboard:view` | `org_owner`, `reception` | Blocked for `stylist` (redirects/defaults to `/merchant/calendar`). |
| `/merchant/calendar` | `merchant:calendar:view` | `org_owner`, `reception`, `stylist` | • `org_owner` & `reception`: full salon calendar.<br/>• `stylist`: filtered to own appointments. |
| `/merchant/appointments` | `merchant:appointments:view` | `org_owner`, `reception`, `stylist` | • Settlement actions (show / no-show / void) available to `org_owner` & `reception`. |
| `/merchant/staff` | `merchant:staff:view` | `org_owner`, `reception` | • "Add team member" & edit/delete actions: visible only to `org_owner` (`merchant:staff:manage`).<br/>• `reception` has read-only view of roster and shifts. |
| `/merchant/services` | `merchant:services:view` | `org_owner`, `reception` | • "Add new service", Edit, and Deactivate: visible only to `org_owner` (`merchant:services:manage`).<br/>• `reception` has read-only catalog access. |
| `/merchant/billing` | `merchant:billing:view` | `org_owner` | Hidden from sidebar and blocked for `reception` and `stylist`. |
| `/merchant/settings/*` | `merchant:settings:view` | `org_owner` | Hidden from sidebar and blocked for `reception` and `stylist`. |
| `/merchant/profile` | `merchant:profile:manage` | `org_owner`, `reception`, `stylist` | Manage personal profile information. |

---

## 4. Guard Architecture & Enforcement

### 4.1 Backend FastAPI Guards (`backend/app/api/deps/permissions.py`)

- **`PlatformAdminOnly`**: Enforces `user.role == "platform_admin"`. Unauthorized requests reject with `HTTP 403 Forbidden` (`{"detail": "Platform admin access required"}`).
  - Applied to:
    - `/api/v1/admin/users/*` (Staff invitations, resend invite, reset password, removal)
    - `/api/v1/admin/commissions` (Rule creation and updates)
    - `/api/v1/admin/invoices/*` (Invoice generation, issuance, voiding)
    - `/api/v1/admin/organizations/{org_id}/approve` & `suspend`
- **`PlatformStaffOrAdmin`**: Enforces `user.role in ("platform_admin", "platform_staff")`.
  - Applied to:
    - `/api/v1/admin/dashboard`
    - `/api/v1/admin/organizations` (read-only listing and detail)
    - `/api/v1/admin/change-requests/*`
    - `/api/v1/admin/service-categories/*`
    - `/api/v1/admin/reviews/*`
- **`OrgOwner`**: Enforces `user.role == "org_owner"`.
  - Applied to:
    - `/api/v1/organizations/{org_id}/employees` (Create, update, delete staff)
    - `/api/v1/organizations/{org_id}/services` (Create, update, delete services)
    - `/api/v1/organizations/{org_id}/commissions` & `invoices` (Finance and billing records)
    - `/api/v1/organizations/{org_id}/change-requests` (Submit change requests)
- **`OrgMember`**: Enforces membership in the organization (`org_owner`, `reception`, `stylist`).
  - Scopes access to organizational entities. Stylists access only their own booking records.

### 4.2 Frontend Guards (`frontend/lib/permissions/permissions.ts`)

- **Route Access Validator**: `canAccessAdminRoute(role, pathname)` and `canAccessMerchantRoute(role, pathname)`.
- **Sidebar Filtering**: Filters out unauthorized tabs from `ConsoleSidebarNav` so users only see menu options they can access.
- **Unauthorized Catch-all Screen**: `<PermissionAccessDenied />` displays a clear shield/lock indicator, active role badge, and quick action to return to their role's default landing page.
- **In-Page Action Controls**: Action buttons (`Add`, `Approve`, `Suspend`, `Edit`, `Delete`) are conditionally rendered based on `hasPlatformPermission(role, permission)` or `hasMerchantPermission(role, permission)`.
