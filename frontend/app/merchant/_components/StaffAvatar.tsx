'use client'

import { UserRound } from 'lucide-react'

import { staffAvatarGradient, staffInitials } from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'

interface StaffAvatarProps {
  name: string
  picture?: string | null
  seed?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASS = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
} as const

export function StaffAvatar({ name, picture, seed, size = 'md', className }: StaffAvatarProps) {
  const initials = staffInitials(name)
  const gradient = staffAvatarGradient(seed || name)

  if (picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={picture}
        alt={name}
        className={cn(
          'shrink-0 rounded-full border border-slate-200 object-cover',
          SIZE_CLASS[size],
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-xs',
        gradient,
        SIZE_CLASS[size],
        className,
      )}
      aria-hidden
    >
      {initials || <UserRound className="h-3.5 w-3.5" />}
    </div>
  )
}
