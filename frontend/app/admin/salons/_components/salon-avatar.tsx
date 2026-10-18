'use client'

import { Building2 } from 'lucide-react'
import { useMemo, useState } from 'react'

interface SalonAvatarProps {
  name: string
  picture?: string | null
}

export function SalonAvatar({ name, picture }: SalonAvatarProps) {
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

  if (picture && !imgError) {
    return (
      <div className="relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs">
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
    <div className="flex h-20 w-20 sm:h-22 sm:w-22 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-stone-900 font-extrabold text-sm sm:text-base text-white shadow-xs">
      {initials || <Building2 className="h-6 w-6 text-amber-200" />}
    </div>
  )
}
