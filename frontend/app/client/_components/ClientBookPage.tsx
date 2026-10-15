'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { ClientExperience } from '@/app/client/_components/ClientExperience'
import { SplitBookingAuth } from '@/app/client/_components/SplitBookingAuth'
import { isAuthenticatedSelector, isClientUser, userSelector } from '@/store/authSlice'
import { bookingDraftSelector } from '@/store/bookingDraftSlice'

export function ClientBookPage() {
  const router = useRouter()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const draft = useSelector(bookingDraftSelector)

  const canCheckout = isAuthenticated && isClientUser(user)
  const hasDraft = draft.serviceIds.length > 0 || Boolean(draft.selectedServiceName)

  useEffect(() => {
    if (!canCheckout && !hasDraft) {
      router.replace('/client')
    }
  }, [canCheckout, hasDraft, router])

  if (canCheckout) {
    return <ClientExperience resumeCheckoutFromDraft initialTab="catalog" />
  }

  if (!hasDraft) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] px-4 py-10">
      <SplitBookingAuth
        returnPath="/client/book"
        bookingSummary={
          <div className="space-y-2">
            {draft.selectedServiceName ? (
              <p>
                <span className="font-semibold text-stone-900">Service:</span>{' '}
                {draft.selectedServiceName}
              </p>
            ) : null}
            {draft.startsAt ? (
              <p>
                <span className="font-semibold text-stone-900">Time:</span> {draft.startsAt}
              </p>
            ) : null}
            <p className="text-stone-500">
              After sign-in you will return here to authorize your PayPal hold ($0 charged today).
            </p>
          </div>
        }
      />
    </div>
  )
}
