import { ShieldCheck, UserCheck } from 'lucide-react'

import type { DemoPersona } from '@/components/auth/demo-personas-panel'

export const ADMIN_DEMO_PERSONAS: DemoPersona[] = [
  {
    email: 'admin@salondesk.local',
    label: 'Platform Admin (Platform Admin)',
    subtitle: 'admin@salondesk.local · Admin Portal',
    destination: '/admin',
    portal: 'admin',
    icon: (
      <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
        <ShieldCheck className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    email: 'staff@salondesk.local',
    label: 'Platform Staff (Platform Staff)',
    subtitle: 'staff@salondesk.local · Admin Portal',
    destination: '/admin',
    portal: 'admin',
    icon: (
      <div className="rounded-lg bg-teal-100 p-2 text-teal-700">
        <UserCheck className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-teal-200 bg-teal-50/50 hover:bg-teal-100/70',
    badgeClass: 'bg-teal-100 text-teal-700',
  },
]
