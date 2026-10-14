'use client'

import { Ban, X } from 'lucide-react'
import Image from 'next/image'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type React from 'react'

import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { resolveImageSrc } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'

function resolvePublicAssetUrl(src: string): string {
  return resolveImageSrc(src)
}

/** Primary card blue — same shell as payment confirmation */
export const CANCEL_CONFIRMATION_CARD_BLUE = '#2E3A8C'

export interface CancelConfirmationDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  /**
   * Primary action after the user acknowledges cancellation (e.g. `router.push('/bookings')`).
   */
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  description?: string
  confirmLabel?: string
  /** Optional top illustration. If omitted, a built-in cancel icon is shown. */
  heroImageSrc?: string
  heroImageAlt?: string
  /** Blurred backdrop inside the card — file under `public/` (e.g. `images/bgg.png`). */
  backgroundImageSrc?: string
  className?: string
}

function CancelPaymentHeroFallback() {
  return (
    <div
      className="relative z-10 mx-auto flex w-full max-w-[300px] items-end justify-center gap-2 px-4 pb-1 pt-8"
      aria-hidden
    >
      <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-950/35 ring-[3px] ring-white/35">
        <Ban className="h-7 w-7 text-white" strokeWidth={3} aria-hidden />
      </div>
    </div>
  )
}

const CancelConfirmationDialog: React.FC<CancelConfirmationDialogProps> = ({
  title = 'Payment cancelled',
  description = 'You cancelled this payment. Nothing was charged. You can complete checkout again whenever you are ready.',
  open,
  setOpen,
  onConfirm,
  isLoading = false,
  confirmLabel = 'Got it',
  heroImageSrc,
  heroImageAlt = 'Payment cancelled',
  backgroundImageSrc = 'images/bgg.png',
  className,
}) => {
  const blurredBgUrl = resolvePublicAssetUrl(backgroundImageSrc)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay
          className="bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${blurredBgUrl.replace(/"/g, '\\"')}")`,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none',
            'max-w-[min(100vw-1.5rem,420px)] sm:max-w-[420px]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            className,
          )}
        >
          <div
            className="relative flex flex-col overflow-hidden rounded-[1.75rem] shadow-2xl shadow-black/30"
            style={{ backgroundColor: CANCEL_CONFIRMATION_CARD_BLUE }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 isolate overflow-hidden rounded-[1.75rem]"
            >
              <div
                className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-125 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url("${blurredBgUrl.replace(/"/g, '\\"')}")`,
                  filter: 'blur(28px)',
                  WebkitFilter: 'blur(28px)',
                }}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[#2E3A8C]/55"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-b from-[#2E3A8C]/25 via-transparent to-black/25"
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Close"
            >
              <X className="size-5" strokeWidth={2} />
            </button>

            {heroImageSrc ? (
              <div className="relative z-10 flex justify-center px-6 pt-10">
                <div className="relative h-40 w-full max-w-[280px]">
                  <Image
                    src={resolveImageSrc(heroImageSrc)}
                    alt={heroImageAlt}
                    fill
                    className="object-contain object-bottom drop-shadow-lg"
                    sizes="280px"
                    priority
                  />
                </div>
              </div>
            ) : (
              <CancelPaymentHeroFallback />
            )}

            <div className="relative z-10 mx-5 mt-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-6 shadow-inner backdrop-blur-md">
              <h2 className="text-center text-xl font-bold tracking-tight text-white">{title}</h2>
              <p className="mt-3 text-center text-sm font-normal leading-relaxed text-white/95">
                {description}
              </p>
            </div>

            <div className="relative z-10 flex justify-center px-6 pb-8 pt-5">
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={cn(
                  'w-full max-w-[280px] rounded-full bg-white py-4 text-center text-base font-bold transition',
                  'hover:bg-white/95 active:scale-[0.99]',
                  'disabled:pointer-events-none disabled:opacity-60',
                )}
                style={{ color: CANCEL_CONFIRMATION_CARD_BLUE }}
              >
                {isLoading ? 'Please wait…' : confirmLabel}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export default CancelConfirmationDialog
