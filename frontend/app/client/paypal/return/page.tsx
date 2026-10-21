import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

import { PayPalReturnView } from '@/app/client/_components/PayPalReturnView'

export default function PayPalReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-600" />
          <p className="text-stone-600 text-sm">Loading PayPal return…</p>
        </main>
      }
    >
      <PayPalReturnView />
    </Suspense>
  )
}
