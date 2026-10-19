'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useGetMyBookingsQuery } from '@/store/api/clientApi'
import { isAuthenticatedSelector, isClientUser, userSelector } from '@/store/authSlice'

import { ClientSalonFeedbackSection } from './ClientSalonFeedbackSection'

/** Salon review blocks for orgs where the client has completed visits. */
export function ClientMyBookingsReviews() {
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const canLoad = isAuthenticated && isClientUser(user)

  const { data: bookingsData } = useGetMyBookingsQuery(undefined, { skip: !canLoad })

  const orgIds = useMemo(() => {
    const ids = new Set<string>()
    for (const b of bookingsData?.items ?? []) {
      if (String(b.status).toUpperCase() === 'COMPLETED' && b.org_id) {
        ids.add(b.org_id)
      }
    }
    return [...ids]
  }, [bookingsData?.items])

  if (orgIds.length === 0) return null

  return (
    <div className="mb-10 space-y-2">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-stone-950">Salon reviews</h2>
        <p className="mt-1 text-sm text-stone-500">
          Share feedback after completed visits. Each review is submitted once per appointment and
          published after platform moderation.
        </p>
      </div>
      {orgIds.map((orgId) => (
        <ClientSalonFeedbackSection key={orgId} orgId={orgId} />
      ))}
    </div>
  )
}
