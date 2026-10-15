import { User } from 'lucide-react'

import type { DemoPersona } from '@/components/auth/demo-personas-panel'

export const CLIENT_DEMO_PERSONAS: DemoPersona[] = [
  {
    email: 'client@example.com',
    label: 'Client Demo (Ada Client)',
    subtitle: 'client@example.com · Client App',
    destination: '/client',
    portal: 'client',
    icon: (
      <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
        <User className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-sky-200 bg-sky-50/50 hover:bg-sky-100/70',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
  {
    email: 'client2@example.com',
    label: 'Client Demo (Baye Client)',
    subtitle: 'client2@example.com · Client App',
    destination: '/client',
    portal: 'client',
    icon: (
      <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
        <User className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-sky-200 bg-sky-50/50 hover:bg-sky-100/70',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
]
