'use client'
import { X } from 'lucide-react'
import Image from 'next/image'
import type React from 'react'

import { resolveImageSrc } from '@/lib/util/remoteImage'
import { cn, getPublicAbsoluteURL } from '@/lib/utils'

import PrimaryButton from '../button/PrimaryButton'
import CustomResponsiveDialog from './CustomResponsiveDialog'

interface DeleteConfirmationDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  description?: string
  cancelLabel?: string
  confirmLabel?: string
  deletingLabel?: string
  maxHeight?: string // optional prop to control height
  icon?: string
  /** Default red destructive; use `primary` for enable / positive confirmations. */
  confirmTone?: 'destructive' | 'primary'
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  title = 'Delete Confirmation',
  description = 'Are you sure you want to delete this item?',
  open,
  setOpen,
  onConfirm,
  isLoading = false,
  cancelLabel,
  confirmLabel,
  deletingLabel,
  maxHeight = 'max-h-fit',
  icon = getPublicAbsoluteURL('/svg/delete.svg'),
  confirmTone = 'destructive',
}) => {
  const confirmClassName =
    confirmTone === 'primary'
      ? 'bg-primary hover:bg-primary/90 min-w-35 h-12 text-primary-foreground shadow-none rounded-full'
      : 'bg-error hover:bg-destructive min-w-35 h-12 text-white shadow-none rounded-full'

  const handleClose = () => setOpen(false)

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={setOpen}
      hideFooterBorder={true}
      classNameContent={cn(
        'bg-white sm:max-w-[400px] lg:max-w-[480px] xl:max-w-[520px] rounded-[24px] overflow-hidden p-0',
        maxHeight,
      )}
      classNameBody="p-0"
      header={
        <div className="flex flex-row justify-end p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full border border-border text-foreground hover:text-primary hover:border-primary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      }
      footer={
        <div className="w-full flex flex-row gap-3 justify-center items-center pb-8 px-6 border-none">
          <PrimaryButton
            variant="outline"
            className="text-sm font-medium min-w-35 h-12 bg-white text-primary hover:text-primary hover:bg-white hover:border-primary "
            title={cancelLabel || 'Cancel'}
            type="button"
            onClick={handleClose}
            size="default"
            fullWidth={false}
          />
          <PrimaryButton
            variant="default"
            className={cn(confirmClassName, '')}
            title={
              isLoading && deletingLabel
                ? deletingLabel || `${confirmLabel}...`
                : confirmLabel || 'Delete'
            }
            type="button"
            size="default"
            onClick={onConfirm}
            isDisabled={isLoading}
            isLoading={isLoading}
            fullWidth={false}
          />
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 px-6 pb-6">
        <div className="flex justify-center items-center w-20 h-20 rounded-full bg-gray-50 mb-2">
          <Image
            width={48}
            height={48}
            src={resolveImageSrc(icon)}
            alt="confirmation icon"
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground font-bold text-xl leading-tight">{title}</h3>
          <div className="text-text-color font-normal text-base leading-relaxed whitespace-pre-line">
            {description}
          </div>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}

export default DeleteConfirmationDialog
