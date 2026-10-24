import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import type { ApiResponse } from '@/types/api'

const isApiFunctionWithMethodData = <T>(
  data: T | { body: T; method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' },
): data is { body: T; method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' } => {
  return typeof data === 'object' && data !== null && 'method' in data
}

/** Function types for API calls */
type ApiFunction<T, R = unknown, E = unknown> = (data: T) => Promise<ApiResponse<R, E>>
type ApiFunctionWithMethod<T, R = unknown, E = unknown> = (data: {
  body: T
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
}) => Promise<ApiResponse<R, E>>

const useFormSubmitHandler = <T, R = unknown, E = unknown>(
  apiFunction: ApiFunction<T, R, E> | ApiFunctionWithMethod<T, R, E>,
  onSuccess: (response: ApiResponse<R, E>) => void,
  successMessage?: string,
  isSuccessToastVisible: boolean = true,
  onError?: (error: E) => void,
) => {
  const handleSubmit = async (
    data: T | { body: T; method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' },
  ): Promise<ApiResponse<R, E>> => {
    try {
      let response: ApiResponse<R, E>

      if (isApiFunctionWithMethodData(data)) {
        response = await (apiFunction as ApiFunctionWithMethod<T, R, E>)(
          data as { body: T; method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' },
        )
      } else {
        response = await (apiFunction as ApiFunction<T, R, E>)(data)
      }

      if (response.error) {
        if (onError) {
          onError(response.error)
        }

        const errorMessage = getErrorMessage(response.error)

        if (errorMessage.toLowerCase().includes('deactivated')) {
          return response
        }

        toast.error(errorMessage, toastColor.error)
      } else {
        if (isSuccessToastVisible) {
          const successMsg =
            (
              response.data as {
                data?: { message?: string; detail?: string }
                message?: string
                detail?: string
              }
            )?.data?.message ||
            (response.data as { message?: string })?.message ||
            (response.data as { detail?: string })?.detail ||
            successMessage ||
            'Action completed successfully'

          toast.success(successMsg, toastColor.success)
        }
        onSuccess(response)
      }

      return response
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error)

      if (onError) {
        onError(error as E)
      }

      toast.error(errorMessage, toastColor.error)

      return { error: error as E } as ApiResponse<R, E>
    }
  }

  return handleSubmit
}

export default useFormSubmitHandler

type FastApiDetailItem = {
  loc?: Array<string | number>
  msg?: string
  message?: string
}

const formatFastApiDetail = (detail: unknown): string | null => {
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item
        const row = item as FastApiDetailItem
        return row.msg || row.message || null
      })
      .filter((msg): msg is string => Boolean(msg))
    if (messages.length) {
      return messages.join('\n')
    }
  }

  return null
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (typeof error !== 'object' || error === null) {
    return 'Something went wrong'
  }

  const err = error as {
    data?: {
      detail?: unknown
      message?: string
      error?: string
      data?: {
        errors?: Record<string, unknown>
        error_messages?: string[]
        error?: string
        message?: string
        detail?: unknown
      }
    }
    message?: string | unknown
    error?: string
    status?: number
  }

  const nested = err.data?.data
  if (nested) {
    if (Array.isArray(nested.error_messages) && nested.error_messages.length) {
      return nested.error_messages.join('\n')
    }

    if (nested.errors && typeof nested.errors === 'object') {
      const normalizedErrors: Record<string, unknown[]> = {}
      for (const [field, messages] of Object.entries(nested.errors)) {
        const normalizedField = field.replace(/[._]/g, ' ')
        const messagesArray = Array.isArray(messages) ? messages : [messages]
        normalizedErrors[normalizedField] = messagesArray
      }
      const joined = Object.values(normalizedErrors)
        .flat()
        .filter((msg): msg is string => typeof msg === 'string')
        .join('\n')
      if (joined) return joined
    }

    const nestedDetail = formatFastApiDetail(nested.detail)
    if (nestedDetail) return nestedDetail

    if (nested.message) return nested.message
    if (nested.error) return nested.error
  }

  const detail = formatFastApiDetail(err.data?.detail)
  if (detail) return detail

  if (typeof err.message === 'string' && err.message.trim()) {
    // axiosBaseQuery may put FastAPI detail into message
    const fromMessage = formatFastApiDetail(err.message)
    if (fromMessage) return fromMessage
    return err.message
  }

  if (err.data?.message) return err.data.message
  if (err.data?.error) return err.data.error
  if (err.error) return err.error

  return 'Something went wrong'
}
