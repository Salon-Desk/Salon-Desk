import { Suspense } from 'react'

import { ClientExperience } from '@/app/client/_components/ClientExperience'

type ClientOrgPageProps = {
  params: Promise<{ orgId: string }>
}

async function OrgCatalog({ params }: ClientOrgPageProps) {
  const { orgId } = await params
  return <ClientExperience filterOrgId={orgId} />
}

export default function ClientOrgPage({ params }: ClientOrgPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
          Loading salon…
        </div>
      }
    >
      <OrgCatalog params={params} />
    </Suspense>
  )
}
