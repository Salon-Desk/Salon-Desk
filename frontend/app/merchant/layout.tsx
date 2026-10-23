'use client'

import { type ReactNode, Suspense } from 'react'

import { MerchantLayoutInner } from './_components/MerchantLayoutInner'
import { MerchantProvider } from './_context/merchant-context'

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <MerchantProvider>
      <Suspense fallback={null}>
        <MerchantLayoutInner>{children}</MerchantLayoutInner>
      </Suspense>
    </MerchantProvider>
  )
}
