'use client'

import { Eye, type LucideIcon, SquarePen } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TableActionLinkProps = {
  href: string
  label: string
  icon?: LucideIcon
  className?: string
}

/** Primary circular “view” action used in data grids. */
export function TableActionLink({
  href,
  label,
  icon: Icon = Eye,
  className,
}: TableActionLinkProps) {
  return (
    <Button
      size="icon"
      className={cn(
        'size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
      aria-label={label}
      asChild
    >
      <Link href={href}>
        <Icon className="size-4" />
      </Link>
    </Button>
  )
}

type TableIconButtonProps = {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  className?: string
}

export function TableIconButton({
  label,
  icon: Icon = SquarePen,
  onClick,
  className,
}: TableIconButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        'size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      aria-label={label}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" />
    </Button>
  )
}
