'use client'

import { Building2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

interface SalonAvatarProps {
  name: string
  picture?: string | null
  className?: string
}

export function SalonAvatar({ name, picture, className }: SalonAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const initials = useMemo(() => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [name])

  const defaultClasses = 'h-20 w-20 sm:h-22 sm:w-22 rounded-2xl'

  if (picture && !imgError) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden border border-slate-200/80 bg-slate-100 shadow-xs',
          className || defaultClasses,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={picture}
          alt={name}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-amber-500 via-amber-600 to-stone-900 font-extrabold text-sm text-white shadow-xs sm:text-base',
        className || defaultClasses,
      )}
    >
      {initials || <Building2 className="h-6 w-6 text-amber-200" />}
    </div>
  )
}
