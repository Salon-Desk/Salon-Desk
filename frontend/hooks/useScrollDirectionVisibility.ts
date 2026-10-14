"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Scroll offset before direction-based hide/show applies. */
  threshold?: number;
  /** Minimum px change to detect scroll direction (reduces jitter). */
  minDelta?: number;
  /** Called when user scrolls down past threshold (nav hides). */
  onHide?: () => void;
};

/**
 * Hide chrome on scroll down, show on scroll up. Always visible at or above `threshold`.
 */
export function useScrollDirectionVisibility(options: Options = {}) {
  const { threshold = 80, minDelta = 6, onHide } = options;
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > threshold);

      if (currentY <= threshold) {
        setVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < minDelta) {
        return;
      }

      if (delta > 0) {
        setVisible(false);
        onHideRef.current?.();
      } else {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, minDelta]);

  return { scrolled, visible };
}
