"use client";

import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const searchFieldTriggerClassName =
  "box-border flex h-[52px] w-full max-w-full min-w-0 items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 cursor-pointer text-left sm:h-[56px] sm:gap-3 sm:px-4 sm:py-3.5";

export const SearchFieldTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & {
    icon: LucideIcon;
    hasValue: boolean;
    children: React.ReactNode;
  }
>(function SearchFieldTrigger(
  { icon: Icon, hasValue, children, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(searchFieldTriggerClassName, className)}
      {...props}
    >
      <Icon className="size-4 shrink-0 text-orange-400 sm:size-5" />
      <span
        className={cn(
          "w-full min-w-0 truncate text-xs sm:text-sm",
          hasValue ? "text-gray-700" : "text-gray-400",
        )}
      >
        {children}
      </span>
    </button>
  );
});

SearchFieldTrigger.displayName = "SearchFieldTrigger";
