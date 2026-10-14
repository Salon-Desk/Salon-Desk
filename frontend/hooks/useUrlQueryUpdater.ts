'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/** Values: set string/number to write; `null`/`undefined`/empty string removes the key */
export type UrlQueryPatch = Record<string, string | number | null | undefined>

/**
 * Applies shallow query-string updates with `router.replace` so filters survive reload/share.
 */
export function useUrlQueryUpdater() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const patchQuery = useCallback(
    (patch: UrlQueryPatch) => {
      const next = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === '') {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }

      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return { pathname, searchParams, patchQuery }
}
