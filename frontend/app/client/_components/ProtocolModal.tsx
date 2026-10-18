'use client'

import { Clock, Lock, Sparkles } from 'lucide-react'
import Image from 'next/image'

import { Modal } from '@/components/ui'
import { protocolForService, serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { SalonService } from '@/types'

interface ProtocolModalProps {
  service: SalonService
  onClose: () => void
  onBook: (service: SalonService) => void
}

export function ProtocolModal({ service, onClose, onBook }: ProtocolModalProps) {
  const protocol = protocolForService(service)
  const coverSrc = service.imageUrl || serviceImage(service.id)

  return (
    <Modal
      onClose={onClose}
      size="md"
      title={service.name}
      description={
        [service.organizationName, service.category].filter(Boolean).join(' · ') || service.category
      }
      footer={
        <button
          type="button"
          onClick={() => onBook(service)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 py-3 text-xs font-semibold text-white transition-colors hover:bg-amber-600 sm:text-sm"
        >
          <Lock className="h-3.5 w-3.5" />
          Book with {formatUsd(0)} today
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
        </button>
      }
    >
      <div className="relative mb-5 aspect-[16/8] overflow-hidden rounded-2xl bg-stone-100">
        <Image
          src={coverSrc}
          alt=""
          fill
          unoptimized={shouldUnoptimizeImage(coverSrc)}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 32rem"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-950">
            {formatUsd(service.price)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/65 px-2.5 py-1 text-[11px] font-medium text-white">
            <Clock className="h-3 w-3 text-amber-300" />
            {formatDuration(service.durationMin)}
          </span>
        </div>
      </div>

      <p className="mb-5 text-xs leading-relaxed text-stone-600">{service.description}</p>

      <div className="mb-5 rounded-2xl bg-stone-50/90 p-4">
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Visit outline
        </h4>
        <ol className="space-y-2.5">
          {protocol.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-2.5 text-xs text-stone-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-800">
                {index + 1}
              </span>
              <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-6 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-xl border border-stone-100 px-3.5 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Products
          </p>
          <p className="leading-relaxed text-stone-600">{protocol.products}</p>
        </div>
        <div className="rounded-xl border border-stone-100 px-3.5 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Best for
          </p>
          <p className="leading-relaxed text-stone-600">{protocol.idealFor}</p>
        </div>
      </div>
    </Modal>
  )
}
