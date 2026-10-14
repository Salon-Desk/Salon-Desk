'use client'

import { Minus, Plus } from 'lucide-react'
import Image from 'next/image'

import { resolveImageSrc } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'

type CounterRowProps = {
  label: string
  description: string
  icon: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  className?: string
}

export function CounterRow({
  label,
  description,
  icon,
  value,
  onChange,
  min = 0,
  max = 100,
  className,
}: CounterRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-3 sm:px-4 sm:py-3.5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Image
          src={resolveImageSrc(icon)}
          alt={label}
          width={40}
          height={40}
          className="size-8 md:size-9 lg:size-10"
        />

        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground sm:text-sm md:font-semibold lg:text-[15px] lg:font-bold">
            {label}
          </p>
          <p className="truncate text-[10px] font-normal text-muted-foreground sm:text-[11px] md:text-xs lg:text-[13px]">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-1 sm:gap-2">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          className="rounded-full bg-muted p-1 transition-colors hover:border hover:border-primary"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="size-3 sm:size-3.5 lg:size-4" />
        </button>

        <span className="min-w-[20px] text-center text-xs font-semibold sm:text-sm md:text-base">
          {value}
        </span>

        <button
          type="button"
          onClick={() => value < max && onChange(value + 1)}
          className="rounded-full bg-primary p-1 text-white transition-colors hover:border hover:border-primary"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="size-3 sm:size-3.5 lg:size-4" />
        </button>
      </div>
    </div>
  )
}
