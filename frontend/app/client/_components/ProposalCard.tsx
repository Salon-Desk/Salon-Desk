'use client'

import { Clock, Lock, User } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import type { ConciergeMessage } from '@/hooks/use-ai-concierge'
import { INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import type { SalonService, StaffMember } from '@/types'

export interface ProposalCardProps {
  message: ConciergeMessage
  onAuthorize: (opts: { service: SalonService; stylist?: StaffMember; slot?: string }) => void
}

export function ProposalCard({ message, onAuthorize }: ProposalCardProps) {
  const service = message.proposedService
  if (!service) return null

  const stylist = message.proposedStylist || INITIAL_STAFF[0]
  const slot = message.proposedSlot || DEFAULT_TIME_SLOT

  return (
    <div className="mt-2.5 w-full rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-4 text-stone-900 shadow-xs">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="font-bold text-sm text-stone-900 truncate">{service.name}</h4>
        <span className="font-mono tabular-nums tracking-tight font-extrabold text-sm text-amber-950 shrink-0">
          ${service.price}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-stone-700 bg-white/90 border border-stone-200/70 rounded-lg px-3 py-2 shadow-xs">
        <span className="flex items-center gap-1.5 text-stone-800 font-medium">
          <User className="h-3.5 w-3.5 text-amber-600" />
          {stylist.name}
        </span>
        <span className="flex items-center gap-1.5 text-stone-800 font-medium">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          {slot}
        </span>
      </div>

      <PrimaryButton
        variant="dark"
        fullWidth
        onClick={() =>
          onAuthorize({
            service,
            stylist,
            slot,
          })
        }
        className="w-full h-9 rounded-lg bg-stone-950 hover:bg-stone-800 text-white font-semibold text-xs shadow-none border-0 cursor-pointer"
        icon={<Lock className="h-3.5 w-3.5 mr-1" />}
        title="Hold with PayPal ($0 today) →"
      />

      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-stone-500 px-0.5">
        <span>${service.holdDeposit} hold authorization</span>
        <span className="text-emerald-700 font-semibold">Free 24h cancel</span>
      </div>
    </div>
  )
}
