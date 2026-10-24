'use client'

import { type ReactNode, useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface AgreementCheckProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  invalid?: boolean
  children: ReactNode
}

export function AgreementCheck({
  checked,
  onCheckedChange,
  invalid,
  children,
}: AgreementCheckProps) {
  const id = useId()
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('button, a')) return
        onCheckedChange(!checked)
      }}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors select-none',
        checked
          ? 'border-emerald-300 bg-emerald-50/60'
          : invalid
            ? 'border-rose-300 bg-rose-50/50'
            : 'border-stone-200 bg-white hover:border-stone-300',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        aria-invalid={invalid || undefined}
        className="mt-0.5 size-5 cursor-pointer rounded-md border-stone-300 bg-white data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
      />
      <div className="text-sm leading-relaxed text-stone-700">{children}</div>
    </div>
  )
}
