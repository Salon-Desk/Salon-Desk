import { useSyncExternalStore } from 'react'

function subscribe(query: string, onStoreChange: () => void) {
  const media = matchMedia(query)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => matchMedia(query).matches,
    () => false,
  )
}
