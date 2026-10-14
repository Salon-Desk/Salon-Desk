"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COPIED_FEEDBACK_MS = 2000;

/**
 * Tracks which keyed value was most recently copied so several copy buttons can
 * share one hook and each show its own transient "copied" state.
 */
export function useClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const copy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard permission denied — skip the confirmation state.
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopiedKey(key);
    timeoutRef.current = setTimeout(
      () => setCopiedKey(null),
      COPIED_FEEDBACK_MS,
    );
  }, []);

  return { copiedKey, copy };
}
