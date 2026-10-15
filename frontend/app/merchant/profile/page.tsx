'use client'

import { ProfileEditor } from '@/components/profile/profile-editor'

export default function MerchantProfilePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-1 py-2">
      <ProfileEditor
        title="Team profile"
        description="Update your name and phone for this salon."
      />
    </div>
  )
}
