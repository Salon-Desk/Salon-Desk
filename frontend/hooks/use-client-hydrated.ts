'use client'

import { useEffect, useState } from 'react'

/** False on server + first client paint; true after mount (avoids auth hydration mismatch). */
export function useClientHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}
