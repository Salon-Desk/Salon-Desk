import { Suspense } from 'react'

import { OrganizationDetailPage } from '@/app/client/_components/OrganizationDetailPage'

type ClientOrgPageProps = {
  params: Promise<{ orgId: string }>
}

async function OrgContent({ params }: ClientOrgPageProps) {
  const { orgId } = await params
  return <OrganizationDetailPage orgId={orgId} />
}

export default function ClientOrgPage({ params }: ClientOrgPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-stone-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-xs text-stone-500">Loading salon profile…</p>
        </div>
      }
    >
      <OrgContent params={params} />
    </Suspense>
  )
}
