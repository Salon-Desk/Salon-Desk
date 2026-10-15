'use client'

import { useParams } from 'next/navigation'

import { ClientExperience } from '@/app/client/_components/ClientExperience'

export default function ClientOrgPage() {
  const params = useParams<{ orgId: string }>()
  const orgId = params?.orgId
  if (!orgId) return null
  return <ClientExperience filterOrgId={orgId} />
}
