"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/** True for phone-sized viewports only (below Tailwind `md`), not tablet. */
export function useIsPickerPhone(): boolean {
  const isPhone = useMediaQuery("(max-width: 767px)");
  return isPhone === true;
}
