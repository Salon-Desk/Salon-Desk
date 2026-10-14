"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { PORTAL_NAV } from "@/components/layout";

export type RouteMetaResult = {
  title: string;
  description: string;
  showBack: boolean;
};

const ROUTE_META: Array<{
  match: RegExp;
  title: string;
  description: string;
  showBack: boolean;
}> = [
  {
    match: /^\/$/,
    title: "SalonDesk",
    description: "Choose a portal to continue.",
    showBack: false,
  },
  {
    match: /^\/client/,
    title: "Client Experience",
    description: "Discover services and book appointments.",
    showBack: false,
  },
  {
    match: /^\/merchant/,
    title: "Salon Console",
    description: "Manage bookings, staff, and settlements.",
    showBack: false,
  },
  {
    match: /^\/admin/,
    title: "Platform Admin",
    description: "Operate salons, staff, and commissions.",
    showBack: false,
  },
  {
    match: /^\/book/,
    title: "Book a service",
    description: "Reserve your next appointment.",
    showBack: true,
  },
  {
    match: /^\/org/,
    title: "Organization",
    description: "Salon organization details.",
    showBack: true,
  },
];

export const useRouteMeta = (): RouteMetaResult => {
  const pathname = usePathname();

  return useMemo(() => {
    const dynamic = ROUTE_META.find((route) => route.match.test(pathname));
    if (dynamic) {
      return {
        title: dynamic.title,
        description: dynamic.description,
        showBack: dynamic.showBack,
      };
    }

    const match = PORTAL_NAV.find((item) => item.href === pathname);
    if (match) {
      return {
        title: match.label,
        description: match.shortLabel,
        showBack: false,
      };
    }

    return {
      title: "SalonDesk",
      description: "",
      showBack: false,
    };
  }, [pathname]);
};
