import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

import {
  ClientCheckoutContainer,
  type ClientCheckoutContainerProps,
} from '@/app/client/_components/ClientCheckoutContainer'

export default function ClientCheckoutRoute(props: ClientCheckoutContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#fbfbfa]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-xs text-stone-500">Opening checkout…</p>
        </div>
      }
    >
      <ClientCheckoutContainer {...props} />
    </Suspense>
  )
}
