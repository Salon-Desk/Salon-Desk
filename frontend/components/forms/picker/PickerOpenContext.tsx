"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type PickerOpenContextType = {
  isPickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
};

const PickerOpenContext = createContext<PickerOpenContextType | undefined>(
  undefined,
);

const noopSetPickerOpen = (_open: boolean) => {
  void _open;
};

export function PickerOpenProvider({ children }: { children: ReactNode }) {
  const openCountRef = useRef(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const setPickerOpen = useCallback((open: boolean) => {
    openCountRef.current += open ? 1 : -1;
    openCountRef.current = Math.max(0, openCountRef.current);
    setIsPickerOpen(openCountRef.current > 0);
  }, []);

  return (
    <PickerOpenContext.Provider value={{ isPickerOpen, setPickerOpen }}>
      {children}
    </PickerOpenContext.Provider>
  );
}

/** Sticky-nav coordination; no-ops when no provider is mounted (e.g. dashboard filters). */
export function usePickerOpen(): PickerOpenContextType {
  return (
    useContext(PickerOpenContext) ?? {
      isPickerOpen: false,
      setPickerOpen: noopSetPickerOpen,
    }
  );
}
