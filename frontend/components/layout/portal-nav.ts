import {
  Building2,
  type LucideIcon,
  Scissors,
  ShoppingBag,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export type PortalId = "client" | "merchant" | "admin";

export interface PortalNavItem {
  id: PortalId;
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const PORTAL_NAV: readonly PortalNavItem[] = [
  {
    id: "client",
    href: ROUTES.client,
    label: "Client Experience",
    shortLabel: "Client Discovery",
    icon: ShoppingBag,
  },
  {
    id: "merchant",
    href: ROUTES.merchant,
    label: "Salon Console",
    shortLabel: "Salon Console",
    icon: Scissors,
  },
  {
    id: "admin",
    href: ROUTES.admin,
    label: "Platform Admin",
    shortLabel: "Platform Admin",
    icon: Building2,
  },
];
