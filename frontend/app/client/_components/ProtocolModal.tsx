'use client'

import { Clock, Lock, Sparkles } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { protocolForService, serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import type { SalonService } from '@/types'

interface ProtocolModalProps {
  service: SalonService
  onClose: () => void
  onBook: (service: SalonService) => void
}

export function ProtocolModal({ service, onClose, onBook }: ProtocolModalProps) {
  const protocol = protocolForService(service)
  const coverSrc = service.imageUrl || serviceImage(service.id)
  const subtitle =
    [service.organizationName, service.category].filter(Boolean).join(' · ') || service.category

  return (
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div>
          <h3 className="font-bold text-base text-stone-900">{service.name}</h3>
          {subtitle && <p className="mt-0.5 text-stone-500 text-xs">{subtitle}</p>}
        </div>
      }
      footer={
        <PrimaryButton
          type="button"
          variant="dark"
          size="sm"
          onClick={() => onBook(service)}
          className="h-11 w-full rounded-full bg-stone-950 font-semibold text-white text-xs sm:text-sm transition-all hover:bg-amber-600 active:scale-[0.99] border-0 shadow-none cursor-pointer"
          fullWidth
        >
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Book with {formatUsd(0)} today</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          </span>
        </PrimaryButton>
      }
    >
      <div className="relative mb-5 aspect-[16/8] overflow-hidden rounded-2xl bg-stone-100">
        <Image
          src={coverSrc}
          alt=""
          fill
          unoptimized={shouldUnoptimizedImage(coverSrc)}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 32rem"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 font-semibold text-[11px] text-stone-950">
            {formatUsd(service.price)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/65 px-2.5 py-1 font-medium text-[11px] text-white">
            <Clock className="h-3 w-3 text-amber-300" />
            {formatDuration(service.durationMin)}
          </span>
        </div>
      </div>

      <p className="mb-5 text-stone-600 text-xs leading-relaxed">{service.description}</p>

      <div className="mb-5 rounded-2xl bg-stone-50/90 p-4">
        <h4 className="mb-3 font-bold text-[10px] text-stone-400 uppercase tracking-wider">
          Visit outline
        </h4>
        <ol className="space-y-2.5">
          {protocol.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-2.5 text-stone-700 text-xs">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-[10px] text-amber-800">
                {index + 1}
              </span>
              <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-6 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-xl border border-stone-100 px-3.5 py-3">
          <p className="mb-1 font-bold text-[10px] text-stone-400 uppercase tracking-wider">
            Products
          </p>
          <p className="text-stone-600 leading-relaxed">{protocol.products}</p>
        </div>
        <div className="rounded-xl border border-stone-100 px-3.5 py-3">
          <p className="mb-1 font-bold text-[10px] text-stone-400 uppercase tracking-wider">
            Best for
          </p>
          <p className="text-stone-600 leading-relaxed">{protocol.idealFor}</p>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
