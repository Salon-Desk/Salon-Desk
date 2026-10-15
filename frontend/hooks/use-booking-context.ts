'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/store'
import {
  appendConciergeMessage,
  bookingDraftSelector,
  type BookingDraftState,
  clearBookingDraft,
  type ConciergeDraftMessage,
  hasPendingBookingDraft,
  pauseBookingForAuth,
  setBookingDraft,
} from '@/store/bookingDraftSlice'

export function useBookingContext() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const draft = useSelector(bookingDraftSelector)
  const pending = useSelector((state: RootState) => hasPendingBookingDraft(state))

  const saveDraft = useCallback(
    (partial: Partial<BookingDraftState>) => {
      dispatch(setBookingDraft(partial))
    },
    [dispatch],
  )

  const pauseForAuth = useCallback(
    (returnPath: string) => {
      dispatch(pauseBookingForAuth({ returnPath, resumeAfterAuth: true }))
    },
    [dispatch],
  )

  const rememberConciergeTurn = useCallback(
    (message: ConciergeDraftMessage) => {
      dispatch(appendConciergeMessage(message))
    },
    [dispatch],
  )

  const resumeAfterAuth = useCallback(() => {
    if (!draft.returnPath) return false
    const target = draft.returnPath
    dispatch(clearBookingDraft())
    router.push(target)
    return true
  }, [dispatch, draft.returnPath, router])

  const discardDraft = useCallback(() => {
    dispatch(clearBookingDraft())
  }, [dispatch])

  return {
    draft,
    pending,
    saveDraft,
    pauseForAuth,
    rememberConciergeTurn,
    resumeAfterAuth,
    discardDraft,
  }
}
