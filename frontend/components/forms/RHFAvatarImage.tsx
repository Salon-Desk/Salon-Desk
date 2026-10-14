'use client'

import { RotateCcw, UploadIcon, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlAvatarDropzoneClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import { resolveImageSrc, shouldUnoptimizeImage } from '@/lib/util/remoteImage'

interface RHFAvatarImageProps {
  name: string
  label?: string
}

const RHFAvatarImage = ({ name, label = 'Profile Picture' }: RHFAvatarImageProps) => {
  const { control, setValue } = useFormContext()
  const { controlId, errorId } = formFieldHtmlIds(name)
  const [lastFile, setLastFile] = useState<File | null>(null)

  /** DROP INPUT: only store file — do NOT upload */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) {
        return
      }
      const file = acceptedFiles[0]
      setLastFile(file)
      setValue(name, file) // hold file
    },
    [name, setValue],
  )

  const dropzone = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
  })

  /** REMOVE ONLY CLEARS THE FIELD */
  const handleRemove = () => {
    setLastFile(null)
    setValue(name, null)
  }

  /** RELOAD VALUE FROM LAST FILE */
  const handleRetry = () => {
    if (lastFile) {
      setValue(name, lastFile)
    }
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = field.value as File | string | null

        const isFile = value instanceof File
        const isUrl = typeof value === 'string'

        const preview = (() => {
          if (isFile) {
            return URL.createObjectURL(value)
          }
          if (isUrl) {
            return value
          }
          return null
        })()

        return (
          <FormFieldRoot className="relative flex flex-col items-center gap-3">
            <div
              {...dropzone.getRootProps()}
              id={controlId}
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? errorId : undefined}
              className={formControlAvatarDropzoneClassName}
            >
              <input {...dropzone.getInputProps()} />

              {/* PREVIEW */}
              {preview ? (
                <Image
                  src={resolveImageSrc(preview)}
                  width={138}
                  height={138}
                  alt="avatar"
                  className="size-full object-cover"
                  unoptimized={shouldUnoptimizeImage(preview)}
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <UploadIcon
                    className="size-8 text-muted-foreground sm:size-10 md:size-12"
                    aria-hidden
                  />
                </div>
              )}
            </div>
            {/* DELETE BUTTON */}
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleRemove()
                }}
                className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground sm:right-4 sm:top-3"
              >
                <X size={14} />
              </button>
            )}

            <div className="flex flex-col text-center text-xs sm:text-sm">
              <FormFieldLabel
                htmlFor={controlId}
                label={label}
                isRequired={false}
                showOptionalHint={false}
                className="justify-center text-center font-semibold"
              />
              {fieldState.error?.message ? (
                <FormFieldError
                  id={errorId}
                  message={String(fieldState.error.message)}
                  className="justify-center"
                />
              ) : null}
            </div>

            {/* RETRY IF LAST FILE EXISTS */}
            {lastFile && !value && (
              <button
                onClick={handleRetry}
                type="button"
                className="flex items-center gap-1 text-orange-600 text-sm"
              >
                Retry <RotateCcw size={14} />
              </button>
            )}
          </FormFieldRoot>
        )
      }}
    />
  )
}

export default RHFAvatarImage
