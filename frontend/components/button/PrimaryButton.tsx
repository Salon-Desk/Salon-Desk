import { Loader } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PrimaryButtonProps {
  id?: string
  title?: string
  children?: React.ReactNode
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  type?: 'submit' | 'reset' | 'button' // optional, default 'button'
  isLoading?: boolean
  isDisabled?: boolean
  variant?:
    | 'default'
    | 'primary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'danger'
    | 'secondary'
    | 'success'
    | 'dark'
    | 'paypal'
    | 'link'
  size?: 'default' | 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
  fullWidth?: boolean | 'half' | 'full' | 'auto' // Controls width: true/'full' (w-full), false/'auto' (w-auto), 'half' (w-1/2)
  style?: React.CSSProperties
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  id,
  title,
  children,
  icon,
  href,
  onClick,
  className,
  style,
  type = 'button',
  isLoading = false,
  isDisabled = false,
  variant = 'default',
  size = 'default',
  fullWidth = 'half', // default 1/2 width instead of full
}) => {
  // size -> tailwind classes (can be extended)
  const sizeClassesMap: Record<string, string> = {
    default: 'h-16 text-base rounded-[48px] px-6',
    sm: 'h-10 text-sm rounded-md px-3',
    lg: 'h-20 text-lg rounded-[56px] px-8',
    icon: 'h-10 w-10 p-2 rounded-full',
  }
  const sizeClasses = sizeClassesMap[size] ?? sizeClassesMap.default

  // default (primary) visual styles
  const defaultVariantClasses = cn(
    'cursor-pointer bg-primary text-primary-foreground shadow-none',
    'hover:opacity-95 active:opacity-90',
    'transition-all duration-200 ease-in-out',
    'antialiased',
  )

  // outline variant additions — use ! to override shadcn outline hover (muted bg + foreground text)
  const outlineVariantClasses = cn(
    'cursor-pointer border border-primary bg-background text-primary shadow-none',
    'hover:!bg-primary hover:!text-primary-foreground',
    'dark:border-primary dark:bg-background dark:text-primary',
    'dark:hover:!bg-primary dark:hover:!text-primary-foreground',
    '[&_svg]:text-current',
    'transition-colors duration-200 ease-in-out',
    'antialiased',
  )

  // base classes from design system; always include so variants + sizes are predictable
  const baseVariantClass = buttonVariants({ variant, size })

  // width behavior: default 1/2 ('w-1/2'), full ('w-full'), or auto ('w-auto')
  const widthClass =
    fullWidth === true || fullWidth === 'full'
      ? 'w-full'
      : fullWidth === false || fullWidth === 'auto'
        ? 'w-auto'
        : 'w-1/2'

  // build final className for the button element
  const finalClassName = cn(
    baseVariantClass,
    widthClass,
    sizeClasses,
    // append variant-specific classes AFTER buttonVariants so they can override if necessary
    variant === 'default' ? defaultVariantClasses : null,
    variant === 'outline' ? outlineVariantClasses : null,
    // allow consumer overrides last
    className,
  )

  // disabled state
  const disabled = isLoading || isDisabled

  const content = children ? (
    <>
      {children}
      {isLoading && <Loader className="ml-1 h-4 w-4 animate-spin" />}
    </>
  ) : (
    <span className={cn('inline-flex items-center justify-center gap-2')}>
      {icon && icon}
      {title ? <span>{title}</span> : null}
      {isLoading && <Loader className="ml-1 h-4 w-4 animate-spin" />}
    </span>
  )

  const label =
    typeof title === 'string' ? title : typeof children === 'string' ? children : undefined

  if (href && !disabled) {
    return (
      <Link
        id={id}
        href={href}
        className={finalClassName}
        style={style}
        aria-busy={isLoading}
        aria-label={label}
      >
        {content}
      </Link>
    )
  }

  return (
    <Button
      id={id}
      disabled={disabled}
      type={type}
      onClick={onClick}
      className={finalClassName}
      style={style}
      aria-busy={isLoading}
      aria-disabled={disabled}
      aria-label={label}
    >
      {content}
    </Button>
  )
}

export default PrimaryButton
