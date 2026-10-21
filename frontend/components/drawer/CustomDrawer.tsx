'use client'

import { X } from 'lucide-react'
import * as React from 'react'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

export interface CustomDrawerProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  direction?: 'top' | 'bottom' | 'left' | 'right'
  title?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  contentClassName?: string
  classNameContent?: string
  bodyClassName?: string
  classNameBody?: string
  footerClassName?: string
  classNameFooter?: string
  headerClassName?: string
  classNameHeader?: string
  showCloseButton?: boolean
  hideCloseButton?: boolean
  classNameCloseBtn?: string
}

export const CustomDrawer: React.FC<CustomDrawerProps> = ({
  open,
  onOpenChange,
  direction = 'right',
  title,
  description,
  header,
  footer,
  children,
  contentClassName,
  classNameContent,
  bodyClassName,
  classNameBody,
  footerClassName,
  classNameFooter,
  headerClassName,
  classNameHeader,
  showCloseButton = true,
  hideCloseButton = false,
  classNameCloseBtn,
}) => {
  const shouldShowClose = showCloseButton && !hideCloseButton
  const hasHeader = Boolean(header || title)

  const effectiveContentClass = classNameContent || contentClassName
  const effectiveBodyClass = classNameBody || bodyClassName
  const effectiveFooterClass = classNameFooter || footerClassName
  const effectiveHeaderClass = classNameHeader || headerClassName

  const headerContent = header ?? (
    <div className="space-y-1">
      {typeof title === 'string' ? (
        <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight">{title}</h3>
      ) : (
        title
      )}
      {description && (
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{description}</p>
      )}
    </div>
  )

  const accessibleTitle =
    typeof title === 'string' ? title : typeof header === 'string' ? header : 'Drawer'

  const accessibleDescription =
    typeof description === 'string' ? description : 'Drawer details and actions'

  const closeButton = shouldShowClose ? (
    <button
      type="button"
      onClick={() => onOpenChange?.(false)}
      className={cn(
        'absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer',
        classNameCloseBtn,
      )}
      aria-label="Close drawer"
    >
      <X className="h-4.5 w-4.5" />
    </button>
  ) : null

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
      <DrawerContent
        className={cn(
          direction === 'right' && [
            'fixed inset-y-0 right-0 z-50 h-full max-h-screen',
            'w-full sm:w-[320px] md:w-[420px] lg:w-[520px] xl:w-[640px]',
            'sm:max-w-none rounded-none sm:rounded-l-2xl border-l border-border/60 bg-background shadow-2xl',
            'flex flex-col overflow-hidden p-0 gap-0',
          ],
          direction === 'bottom' && [
            'fixed bottom-0 inset-x-0 z-50 max-h-[90dvh]',
            'rounded-t-2xl border-t border-border/60 bg-background shadow-2xl',
            'flex flex-col overflow-hidden p-0 gap-0',
          ],
          effectiveContentClass,
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {closeButton}

        {hasHeader ? (
          <DrawerHeader
            className={cn(
              'flex-none flex flex-col gap-1.5 text-left px-6 py-5 border-b border-border/50',
              shouldShowClose && 'pr-14',
              effectiveHeaderClass,
            )}
          >
            {headerContent}
            <DrawerTitle className="sr-only">{accessibleTitle}</DrawerTitle>
            <DrawerDescription className="sr-only">{accessibleDescription}</DrawerDescription>
          </DrawerHeader>
        ) : (
          <>
            <DrawerTitle className="sr-only">{accessibleTitle}</DrawerTitle>
            <DrawerDescription className="sr-only">{accessibleDescription}</DrawerDescription>
          </>
        )}

        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto px-6 py-5 scrollbar-thin',
            effectiveBodyClass,
          )}
        >
          {children}
        </div>

        {footer && (
          <DrawerFooter
            className={cn(
              'flex-none m-0 px-6 py-4 border-t border-border/50 bg-background/95 backdrop-blur-xs',
              'pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
              effectiveFooterClass,
            )}
          >
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export default CustomDrawer
