'use client'

import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { useCompletePaymentHoldMutation } from '@/store/api/clientApi'

function PayPalReturnContent() {
  const params = useSearchParams()
  const router = useRouter()
  const holdId = params.get('hold_id') ?? ''
  const token = params.get('token') ?? params.get('orderID') ?? ''
  const cancelled = params.get('paypal') === 'cancelled' || params.get('stub') === 'cancel'
  const [completeHold] = useCompletePaymentHoldMutation()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(cancelled ? 'error' : 'loading')
  const [message, setMessage] = useState(
    cancelled ? 'PayPal authorization was cancelled.' : 'Finalizing your PayPal hold…',
  )

  useEffect(() => {
    if (cancelled || !holdId) {
      if (!holdId && !cancelled) {
        setStatus('error')
        setMessage('Missing hold reference from PayPal return.')
      }
      return
    }
    void completeHold({
      holdId,
      body: { paypal_order_token: token || null },
    })
      .unwrap()
      .then(() => {
        setStatus('ok')
        setMessage('Hold authorized. Your appointment is confirmed — $0 charged today.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(
          String(
            (err as { data?: { detail?: string } })?.data?.detail ||
              'Could not complete PayPal authorization.',
          ),
        )
      })
  }, [cancelled, holdId, token, completeHold])

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        {status === 'loading' ? (
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-600" />
        ) : status === 'ok' ? (
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
        ) : (
          <XCircle className="mx-auto mb-4 h-10 w-10 text-rose-600" />
        )}
        <h1 className="mb-2 font-serif text-2xl text-stone-950">
          {status === 'ok'
            ? 'You are booked'
            : status === 'loading'
              ? 'Almost there'
              : 'Hold not completed'}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-stone-600">{message}</p>
        <div className="space-y-2">
          <PrimaryButton
            title={status === 'ok' ? 'View my bookings' : 'Back to catalog'}
            onClick={() => {
              router.push(status === 'ok' ? '/client/bookings' : '/client')
            }}
          />
          <p className="text-center text-sm text-stone-500">
            <Link href="/client" className="text-amber-700 hover:text-amber-800">
              Continue browsing
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function PayPalReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-amber-600" />
          <p className="text-sm text-stone-600">Loading PayPal return…</p>
        </main>
      }
    >
      <PayPalReturnContent />
    </Suspense>
  )
}
