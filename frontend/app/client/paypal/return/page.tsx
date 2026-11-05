import { Loader2, Lock } from 'lucide-react'
import { Suspense } from 'react'

import { PayPalReturnView } from '@/app/client/_components/PayPalReturnView'

export default function PayPalReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col bg-[#fbfbfa]">
          <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
            <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-9 text-center shadow-[0_24px_48px_-24px_rgba(28,25,23,0.14)]">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/90 text-amber-600 shadow-2xs">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 font-medium text-amber-900 text-xs shadow-2xs">
                <Lock className="h-3 w-3 text-amber-600" />
                <span>PayPal Hold Verification</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-950 tracking-tight">
                Loading PayPal return…
              </h1>

              <p className="mt-2 text-stone-500 text-xs sm:text-sm">
                Please wait while we connect to your session.
              </p>
            </div>
          </main>
        </div>
      }
    >
      <PayPalReturnView />
    </Suspense>
  )
}
