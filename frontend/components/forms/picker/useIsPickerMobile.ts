'use client'

import { useMediaQuery } from '@/hooks/use-media-query'

export function useIsPickerMobile(): boolean {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop === false
}
