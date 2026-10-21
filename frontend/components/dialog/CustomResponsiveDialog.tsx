'use client'

import { X } from 'lucide-react'
import type React from 'react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export interface CustomResponsiveDialogProps {
  open: boolean
  setOpen: (value: boolean) => void
  children?: React.ReactNode
  header?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  classNameContent?: string
  classNameBody?: string
  classNameHeader?: string
  classNameFooter?: string
  classNameCloseBtn?: string
  hideFooterBorder?: boolean
  hideHeaderBorder?: boolean
  showCloseButton?: boolean
  hideCloseButton?: boolean
}

export interface CustomResponsiveDialogHandle {
  scrollToTop: () => void
}

const CustomResponsiveDialog = forwardRef<
  CustomResponsiveDialogHandle,
  CustomResponsiveDialogProps
>(
  (
    {
      open,
      setOpen,
      children,
      header,
      title,
      description,
      footer,
      classNameContent,
      classNameBody,
      classNameHeader,
      classNameFooter,
      classNameCloseBtn,
      hideFooterBorder = false,
      hideHeaderBorder = false,
      showCloseButton = true,
      hideCloseButton = false,
    },
    ref,
  ) => {
    const bodyRef = useRef<HTMLDivElement | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    useImperativeHandle(ref, () => ({
      scrollToTop() {
        bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      },
    }))

    const isDesktop = useMediaQuery('(min-width: 768px)')

    // Avoid SSR drawer → desktop dialog flash while matchMedia hydrates.
    if (!mounted) {
      return null
    }

    const shouldShowClose = showCloseButton && !hideCloseButton
    const hasHeader = Boolean(header || title)
    const hasFooter = Boolean(footer)

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
      typeof title === 'string' ? title : typeof header === 'string' ? header : 'Dialog'

    const accessibleDescription =
      typeof description === 'string' ? description : 'Dialog details and actions'

    // Desktop Dialog Content
    const contentClasses = cn(
      'w-full max-w-xl sm:max-w-xl rounded-2xl border border-border/60 bg-background shadow-2xl',
      'p-0 gap-0 flex flex-col overflow-hidden',
      'max-h-[90dvh]',
      classNameContent,
    )

    // Mobile Drawer Content
    const drawerContentClasses = cn(
      'rounded-t-2xl flex flex-col overflow-hidden max-h-[90dvh] bg-background p-0 gap-0',
      classNameContent,
    )

    // Shared Header
    const headerClasses = cn(
      'flex-none flex flex-col gap-1.5 text-left',
      'px-5 sm:px-6',
      // Balanced vertical padding: on mobile, accounts for drawer drag handle; on desktop, clean top spacing
      'pt-4 pb-3 sm:pt-6 sm:pb-3.5',
      // Ensure content doesn't collide with the absolute close button
      shouldShowClose && 'pr-12 sm:pr-14',
      !hideHeaderBorder && undefined,
      classNameHeader,
    )

    // Shared Body
    const bodyClasses = cn(
      'flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin',
      'px-5 sm:px-6',
      // Balanced top spacing: tighter if header exists to avoid double-gap; full if no header
      hasHeader ? 'pt-1.5 sm:pt-2' : shouldShowClose ? 'pt-6 pr-12 sm:pr-14' : 'pt-5 sm:pt-6',
      // Balanced bottom spacing: tighter if footer divider exists; full if no footer
      hasFooter ? 'pb-3.5 sm:pb-4' : 'pb-5 sm:pb-6',
      classNameBody,
    )

    // Drawer Body (constrains max-height comfortably on small screens)
    const drawerBodyClasses = cn('max-h-[75dvh]', bodyClasses)

    // Footer - fixes negative margins (-mx-4 -mb-4) from standard DialogFooter
    const footerClasses = cn(
      'flex-none m-0 rounded-none bg-background',
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:items-center',
      'px-5 sm:px-6 pt-3.5 pb-4 sm:pb-5',
      hideFooterBorder ? 'border-t-0' : 'border-t border-border/50',
      classNameFooter,
    )

    // Drawer Footer - adds safe area bottom inset padding
    const drawerFooterClasses = cn(
      footerClasses,
      'pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
      classNameFooter,
    )

    const closeBtnClasses = cn(
      'absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-50',
      'flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full',
      'text-muted-foreground hover:text-foreground hover:bg-muted/80',
      'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'cursor-pointer',
      classNameCloseBtn,
    )

    const CloseButton = shouldShowClose ? (
      <button
        type="button"
        onClick={() => setOpen(false)}
        className={closeBtnClasses}
        aria-label="Close dialog"
      >
        <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </button>
    ) : null

    if (isDesktop) {
      return (
        <Dialog open={open} onOpenChange={setOpen} modal>
          <DialogContent className={contentClasses} showCloseButton={false}>
            {CloseButton}

            {hasHeader ? (
              <DialogHeader className={headerClasses}>
                {headerContent}
                <DialogTitle className="sr-only">{accessibleTitle}</DialogTitle>
                <DialogDescription className="sr-only">{accessibleDescription}</DialogDescription>
              </DialogHeader>
            ) : (
              <>
                <DialogTitle className="sr-only">{accessibleTitle}</DialogTitle>
                <DialogDescription className="sr-only">{accessibleDescription}</DialogDescription>
              </>
            )}

            <div ref={bodyRef} className={bodyClasses}>
              {children}
            </div>

            {hasFooter && <DialogFooter className={footerClasses}>{footer}</DialogFooter>}
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Drawer open={open} onOpenChange={setOpen} modal>
        <DrawerContent
          className={drawerContentClasses}
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          {CloseButton}

          {hasHeader ? (
            <DrawerHeader className={headerClasses}>
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

          <div ref={bodyRef} className={drawerBodyClasses}>
            {children}
          </div>

          {hasFooter && <DrawerFooter className={drawerFooterClasses}>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    )
  },
)

CustomResponsiveDialog.displayName = 'CustomResponsiveDialog'

export { CustomResponsiveDialog }
export default CustomResponsiveDialog
