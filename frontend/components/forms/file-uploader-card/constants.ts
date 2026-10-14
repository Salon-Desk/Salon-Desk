import type { Accept } from 'react-dropzone'

import type { CardSize } from './types'

/** Uploading more than this at once starves the connection and slows every file down. */
export const MAX_CONCURRENT_UPLOADS = 3

/** Space out when each upload starts so the backend is not hit in a burst. */
export const UPLOAD_START_INTERVAL_MS = 600

/** After this many files finish, pause briefly before starting the next wave. */
export const UPLOAD_COOLDOWN_EVERY = 3

export const UPLOAD_COOLDOWN_MS = 1000

/** Extra attempts after a timeout / 429 / 5xx before the row is marked failed. */
export const UPLOAD_RETRY_COUNT = 2

export const UPLOAD_RETRY_BASE_DELAY_MS = 1200

export const DEFAULT_BUTTON_TEXT = 'Upload'

export const DEFAULT_ACCEPT: Accept = {
  'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
}

export const EMPTY_STATE_ICON_PATH = '/svg/uplode.svg'

export const sizeClasses: Record<CardSize, string> = {
  sm: 'col-span-1',
  md: 'col-span-1 sm:col-span-2',
  lg: 'col-span-1 sm:col-span-2 lg:col-span-3',
}

export const fileUploaderRootClassName = 'gap-3 p-3 shadow-[0px_0px_24px_0px_#0000000A] sm:p-5'

export const dropzoneClassName =
  'relative flex min-h-35 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-3 text-center transition-all sm:min-h-45 sm:rounded-2xl sm:px-6 sm:py-4'

export const dropzoneDragActiveClassName = 'scale-[1.01] bg-primary/5'
export const dropzonePrimaryBorderClassName = 'border-primary/40'
export const dropzoneDestructiveBorderClassName = 'border-red-600'
export const dropzoneErrorClassName = 'border-destructive'
export const dropzoneErrorMessageClassName = 'border-[0.3px] border-red-600'
export const dropzoneBlockedClassName = 'pointer-events-none opacity-50'

export const emptyStateClassName = 'flex flex-col items-center gap-3'
export const emptyStateCopyClassName = 'flex flex-col gap-1'
export const boxTitleClassName = 'font-semibold text-sm'
export const boxDescriptionClassName = 'text-xs text-text-color'

export const uploadTaskListClassName = 'flex w-full flex-col gap-1.5'
export const uploadTaskItemClassName = 'flex items-center gap-2 rounded-lg bg-primary/5 px-2 py-1.5'
export const uploadTaskThumbClassName = 'h-7 w-7 shrink-0 rounded object-cover'
export const uploadTaskFileNameClassName =
  'min-w-0 flex-1 truncate text-left text-xs text-text-color'
export const uploadTaskRetryClassName =
  'flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-destructive hover:underline'

export const previewGridClassName = 'w-full min-w-0 mt-3 flex flex-wrap gap-1'
export const previewTileClassName =
  'relative aspect-2/1 w-full min-w-0 max-w-48 overflow-hidden rounded-xl'
export const previewTileRemoveButtonClassName =
  'z-20 cursor-pointer absolute top-1 right-1 bg-destructive text-white p-0.5 rounded-full shadow'

export const UPLOAD_TOAST = {
  success: 'File uploaded successfully',
  failedRetry: 'Failed to upload file. Please try again.',
  failedBatch: 'Failed to upload files. Please try again.',
  invalidType: 'Some files have an invalid file type',
  fileTooLarge: (maxSizeMB: number) => `Some files exceed the max size of ${maxSizeMB}MB`,
  partial: (uploadedCount: number, failedCount: number) =>
    `${uploadedCount} file(s) uploaded, ${failedCount} failed.`,
  batchSuccess: (uploadedCount: number) => `${uploadedCount} file(s) uploaded successfully`,
  failedWithMessage: (message: string) => `Failed to upload file. Please try again.${message}`,
} as const

export const REMOVE_TOAST = {
  success: 'File removed successfully',
  failedRetry: 'Failed to remove file. Please try again.',
  failedWithMessage: (message: string) => `Failed to remove file.${message}`,
} as const
