import { Scissors, User } from 'lucide-react'
import type { ReactNode } from 'react'

import type { DemoPersona } from '@/components/auth/demo-personas-panel'

function merchantPersona(
  email: string,
  role: string,
  name: string,
  salon: string,
  icon: ReactNode,
  tone: 'owner' | 'staff',
): DemoPersona {
  const owner = tone === 'owner'
  return {
    email,
    label: `${role} (${name})`,
    subtitle: `${email} · ${salon}`,
    destination: '/merchant',
    portal: 'merchant',
    icon,
    toneClass: owner
      ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/70'
      : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
    badgeClass: owner ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700',
  }
}

const ownerIcon = (
  <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
    <Scissors className="h-4 w-4" />
  </div>
)

const receptionIcon = (
  <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
    <User className="h-4 w-4" />
  </div>
)

const stylistIcon = (
  <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
    <Scissors className="h-4 w-4" />
  </div>
)

/** Staff and owners taken from `backend/scripts/seed` organization rows (first seeded org). */
export const MERCHANT_DEMO_PERSONAS: DemoPersona[] = [
  merchantPersona(
    'owner@1kblessingsbeautysalonbarbershop.local',
    'Salon Owner',
    'Ava Carter',
    '1K Blessings Beauty Salon & Barbershop',
    ownerIcon,
    'owner',
  ),
  merchantPersona(
    'reception@1kblessingsbeautysalonbarbershop.local',
    'Reception',
    'Noah Nguyen',
    '1K Blessings Beauty Salon & Barbershop',
    receptionIcon,
    'staff',
  ),
  merchantPersona(
    'stylist1@1kblessingsbeautysalonbarbershop.local',
    'Stylist',
    'Mia Brooks',
    '1K Blessings Beauty Salon & Barbershop',
    stylistIcon,
    'staff',
  ),
  merchantPersona(
    'stylist2@1kblessingsbeautysalonbarbershop.local',
    'Stylist',
    'Liam Patel',
    '1K Blessings Beauty Salon & Barbershop',
    stylistIcon,
    'staff',
  ),
  merchantPersona(
    'owner@h2salonbrooklyn.local',
    'Salon Owner',
    'Sofia Reed',
    'H2 Salon Brooklyn',
    ownerIcon,
    'owner',
  ),
  merchantPersona(
    'owner@balayagemehairsalon.local',
    'Salon Owner',
    'Ava Carter',
    'Balayage Me Hair Salon',
    ownerIcon,
    'owner',
  ),
]
