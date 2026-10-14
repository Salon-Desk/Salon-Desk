export type StateUpdater<T> = T | ((previous: T) => T)

export interface PersistentStore<T> {
  /** Subscribe to local and cross-tab mutations. Returns an unsubscribe fn. */
  subscribe: (onStoreChange: () => void) => () => void
  /** Cached snapshot — stable between mutations so `useSyncExternalStore` is happy. */
  getSnapshot: () => T
  /** Seed snapshot used while server rendering and during hydration. */
  getServerSnapshot: () => T
  set: (updater: StateUpdater<T>) => T
  reset: () => T
}

/**
 * Creates a `localStorage`-backed store that plays well with
 * `useSyncExternalStore`: snapshots are memoised (so repeated reads are
 * referentially stable) and invalidated on write or on a `storage` event from
 * another tab.
 *
 * Storage access is wrapped in try/catch throughout because Safari private
 * mode throws on both read and write.
 */
export function createPersistentStore<T>(storageKey: string, seed: () => T): PersistentStore<T> {
  const listeners = new Set<() => void>()
  let snapshot: T | undefined
  let serverSnapshot: T | undefined

  function notify() {
    for (const listener of listeners) listener()
  }

  function persist(state: T) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Storage unavailable — state stays in memory for this session.
    }
  }

  function read(): T {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw) as T
    } catch {
      // Corrupt or unreadable payload — fall through to a fresh seed.
    }
    const fresh = seed()
    persist(fresh)
    return fresh
  }

  return {
    subscribe(onStoreChange) {
      listeners.add(onStoreChange)

      const onExternalChange = (event: StorageEvent) => {
        if (event.key !== null && event.key !== storageKey) return
        snapshot = undefined
        onStoreChange()
      }
      window.addEventListener('storage', onExternalChange)

      return () => {
        listeners.delete(onStoreChange)
        window.removeEventListener('storage', onExternalChange)
      }
    },

    getSnapshot() {
      if (snapshot === undefined) snapshot = read()
      return snapshot
    },

    getServerSnapshot() {
      if (serverSnapshot === undefined) serverSnapshot = seed()
      return serverSnapshot
    },

    set(updater) {
      const previous = snapshot ?? read()
      const next =
        typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater
      snapshot = next
      persist(next)
      notify()
      return next
    },

    reset() {
      const fresh = seed()
      snapshot = fresh
      persist(fresh)
      notify()
      return fresh
    },
  }
}
