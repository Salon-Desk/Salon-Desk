export type MerchantTab =
  | "dashboard"
  | "calendar"
  | "appointments"
  | "staff"
  | "services"
  | "settings";

export const MERCHANT_TAB_GROUPS = [
  "Salon Operations",
  "Salon Configuration",
] as const;

export const MERCHANT_TAB_TITLES: Record<MerchantTab, string> = {
  dashboard: "Salon Overview & Financial KPIs",
  calendar: "Visual Appointment Schedule & Timeline",
  appointments: "Bookings & Cryptographic Audit Ledger",
  staff: "Salon Staff & Stylist Management",
  services: "Service Catalog & Deposit Policies",
  settings: "PayPal Account & Cancellation Settings",
};
