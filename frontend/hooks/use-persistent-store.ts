"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PersistentStore, StateUpdater } from "@/lib/store";

export interface PersistentStoreHandle<T> {
  state: T;
  setState: (updater: StateUpdater<T>) => T;
  resetState: () => T;
}

/**
 * Subscribes a component to a `createPersistentStore` instance.
 *
 * `useSyncExternalStore` is used rather than `useState` + an effect so the
 * server renders the seed data and the client swaps in the persisted snapshot
 * after hydration, instead of mismatching during it.
 */
export function usePersistentStore<T>(
  store: PersistentStore<T>,
): PersistentStoreHandle<T> {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const setState = useCallback(
    (updater: StateUpdater<T>) => store.set(updater),
    [store],
  );
  const resetState = useCallback(() => store.reset(), [store]);

  return { state, setState, resetState };
}
