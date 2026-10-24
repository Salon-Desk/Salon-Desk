'use client'

import clsx from 'clsx'
import Image from 'next/image'
import type { ReactNode } from 'react'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'

import { PrimaryButton } from '@/components/button'
import { formControlUploadButtonClassName } from '@/components/forms/form-field-parts'
import { Spinner } from '@/components/ui/spinner'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import { getPublicAbsoluteURL } from '@/lib/utils'

import {
  boxDescriptionClassName,
  boxTitleClassName,
  dropzoneBlockedClassName,
  dropzoneClassName,
  dropzoneDestructiveBorderClassName,
  dropzoneDragActiveClassName,
  dropzoneErrorClassName,
  dropzoneErrorMessageClassName,
  dropzonePrimaryBorderClassName,
  EMPTY_STATE_ICON_PATH,
  emptyStateClassName,
  emptyStateCopyClassName,
} from './constants'

interface UploadDropzoneProps {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T
  isDragActive: boolean
  isZoneBlocked: boolean
  borderVariant: 'primary' | 'destructive'
  hasError: boolean
  errorMessage?: unknown
  errorId: string
  boxTitle?: string
  boxDescription?: string
  icon: ReactNode
  buttonText: string
}

export function UploadDropzone({
  getRootProps,
  getInputProps,
  isDragActive,
  isZoneBlocked,
  borderVariant,
  hasError,
  errorMessage,
  errorId,
  boxTitle,
  boxDescription,
  icon,
  buttonText,
}: UploadDropzoneProps) {
  const emptyStateIconSrc = getPublicAbsoluteURL(EMPTY_STATE_ICON_PATH)

  return (
    <div
      {...getRootProps()}
      aria-invalid={hasError}
      aria-describedby={hasError ? errorId : undefined}
      className={clsx(
        dropzoneClassName,
        isDragActive && dropzoneDragActiveClassName,
        borderVariant === 'primary'
          ? dropzonePrimaryBorderClassName
          : dropzoneDestructiveBorderClassName,
        hasError && dropzoneErrorClassName,
        Boolean(errorMessage) && dropzoneErrorMessageClassName,
        isZoneBlocked && dropzoneBlockedClassName,
      )}
    >
      <input {...getInputProps()} />
      <div className={emptyStateClassName}>
        {isZoneBlocked ? (
          <Spinner className="w-8 h-8" />
        ) : (
          <>
            <Image
              src={emptyStateIconSrc}
              alt="file"
              width={36}
              height={36}
              unoptimized={shouldUnoptimizedImage(emptyStateIconSrc)}
            />
            <div className={emptyStateCopyClassName}>
              {boxTitle && <p className={boxTitleClassName}>{boxTitle}</p>}
              {boxDescription && <p className={boxDescriptionClassName}>{boxDescription}</p>}
            </div>
            <PrimaryButton
              icon={icon}
              title={buttonText}
              size="sm"
              className={formControlUploadButtonClassName}
              isDisabled={isZoneBlocked}
            />
          </>
        )}
      </div>
    </div>
  )
}
