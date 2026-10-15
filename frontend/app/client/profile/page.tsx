'use client'

import { ProfileEditor } from '@/components/profile/profile-editor'

export default function ClientProfilePage() {
  return (
    <main className="min-h-screen bg-[#fbfbfa] px-4 py-10">
      <ProfileEditor title="Client profile" />
    </main>
  )
}
