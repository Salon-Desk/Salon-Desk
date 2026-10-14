'use client'

import { Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { type FileRejection, useDropzone } from 'react-dropzone'
import { Controller, useFormContext } from 'react-hook-form'

import {
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import { resolveImageSrc, shouldUnoptimizeImage } from '@/lib/util/remoteImage'

interface RHFUploadImageProps {
  name: string
  label?: string
  size?: number
  defaultValue?: string
  maxSizeMB?: number
  className?: string
}

const RHFUploadImage = ({
  name,
  label = 'Profile Picture',
  size = 160,
  defaultValue,
  maxSizeMB = 5,
  className,
}: RHFUploadImageProps) => {
  const { control, setValue, watch } = useFormContext()
  const { controlId, errorId } = formFieldHtmlIds(name)
  const fieldValue = watch(name)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [prevFieldValue, setPrevFieldValue] = useState(fieldValue)

  if (fieldValue !== prevFieldValue) {
    setPrevFieldValue(fieldValue)

    if (fieldValue instanceof File) {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(URL.createObjectURL(fieldValue))
    } else if (typeof fieldValue === 'string' && fieldValue) {
      setPreviewUrl(fieldValue)
    } else if (!fieldValue) {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
    }
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  /** HANDLE FILE DROP */
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files (wrong type, too large, etc.)
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        if (error.code === 'file-too-large') {
          alert(`File must be smaller than ${maxSizeMB}MB`)
        } else if (error.code === 'file-invalid-type') {
          alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP)')
        }
        return
      }

      if (!acceptedFiles?.length) {
        return
      }

      const file = acceptedFiles[0]

      // Additional size check
      if (file.size > maxSizeBytes) {
        alert(`File must be smaller than ${maxSizeMB}MB`)
        return
      }

      // Create preview URL
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      const newPreviewUrl = URL.createObjectURL(file)
      setPreviewUrl(newPreviewUrl)

      // Set the file value in form
      setValue(name, file, { shouldValidate: true, shouldDirty: true })
    },
    [name, setValue, maxSizeBytes, maxSizeMB, previewUrl],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxSize: maxSizeBytes,
  })

  /** Handle remove image */
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent triggering the dropzone

      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setValue(name, null, { shouldValidate: true, shouldDirty: true })
    },
    [name, setValue, previewUrl],
  )

  /** Clean up preview URL on unmount */
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <Controller
      name={name}
      control={control}
      render={({ fieldState }) => {
        const hasValue = fieldValue || defaultValue
        const displayPreview =
          previewUrl || (typeof defaultValue === 'string' ? defaultValue : null)

        return (
          <FormFieldRoot className="relative w-full">
            {label ? (
              <FormFieldLabel
                htmlFor={controlId}
                label={label}
                isRequired={false}
                showOptionalHint={false}
              />
            ) : null}

            <div
              className="relative mx-auto size-32 sm:size-36 md:size-40"
              style={size !== 160 ? { width: size, height: size } : undefined}
            >
              <div
                {...getRootProps()}
                id={controlId}
                aria-invalid={!!fieldState.error}
                aria-describedby={fieldState.error ? errorId : undefined}
                className={`
									absolute inset-0
									flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-center
									transition-all duration-300
									bg-secondary/30
									${isDragActive ? 'border-primary bg-primary/5' : 'border-primary/20 hover:border-primary/40'}
									${fieldState.error ? 'border-destructive' : ''}
									shadow-md hover:shadow-lg
									${className}
								`}
              >
                <input {...getInputProps()} />

                {displayPreview ? (
                  <>
                    <Image
                      src={resolveImageSrc(displayPreview)}
                      alt="Upload preview"
                      fill
                      style={{ objectFit: 'cover', borderRadius: '0.75rem' }}
                      unoptimized={shouldUnoptimizeImage(displayPreview)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center text-white text-xs font-medium">
                      Click or drag to replace
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-foreground/60">
                    <ImageIcon size={32} className="text-primary/40" />
                    <UploadCloud size={24} className="text-primary/60" />
                    <p className="text-xs font-medium">Drop or click to upload</p>
                    <p className="text-[10px] text-foreground/40">
                      PNG, JPG, WEBP (max {maxSizeMB}MB)
                    </p>
                  </div>
                )}
              </div>

              {/* REMOVE BUTTON - Positioned relative to the container */}
              {hasValue && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-white rounded-full p-1.5 shadow-lg transition-colors duration-200 z-20"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* HELPER TEXT */}
            {!hasValue ? (
              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                Accepted formats: PNG, JPG, WEBP
              </p>
            ) : null}

            {fieldState.error?.message ? (
              <FormFieldError
                id={errorId}
                message={String(fieldState.error.message)}
                className="text-center"
              />
            ) : null}
          </FormFieldRoot>
        )
      }}
    />
  )
}

export default RHFUploadImage
