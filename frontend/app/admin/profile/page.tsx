'use client'

import { ProfileEditor } from '@/components/profile/profile-editor'

export default function AdminProfilePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-1 py-2">
      <ProfileEditor title="Admin profile" description="Platform staff contact details." />
    </div>
  )
}
