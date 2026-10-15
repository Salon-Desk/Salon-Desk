import { Scissors, User } from 'lucide-react'

import type { DemoPersona } from '@/components/auth/demo-personas-panel'

export const MERCHANT_DEMO_PERSONAS: DemoPersona[] = [
  {
    email: 'owner@selam.local',
    label: 'Salon Owner (Selam Owner)',
    subtitle: 'owner@selam.local · Selam Hair Studio',
    destination: '/merchant',
    portal: 'merchant',
    icon: (
      <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
        <Scissors className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/70',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    email: 'reception@selam.local',
    label: 'Receptionist (Hanna Reception)',
    subtitle: 'reception@selam.local · Selam Hair Studio',
    destination: '/merchant',
    portal: 'merchant',
    icon: (
      <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
        <User className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
    badgeClass: 'bg-slate-200 text-slate-700',
  },
  {
    email: 'stylist1@selam.local',
    label: 'Stylist (Meron Stylist)',
    subtitle: 'stylist1@selam.local · Selam Hair Studio',
    destination: '/merchant',
    portal: 'merchant',
    icon: (
      <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
        <Scissors className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
    badgeClass: 'bg-slate-200 text-slate-700',
  },
  {
    email: 'stylist2@selam.local',
    label: 'Stylist (Kidist Stylist)',
    subtitle: 'stylist2@selam.local · Selam Hair Studio',
    destination: '/merchant',
    portal: 'merchant',
    icon: (
      <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
        <Scissors className="h-4 w-4" />
      </div>
    ),
    toneClass: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
    badgeClass: 'bg-slate-200 text-slate-700',
  },
]
