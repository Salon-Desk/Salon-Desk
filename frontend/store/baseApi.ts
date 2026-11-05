import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { createApi } from '@reduxjs/toolkit/query/react'
import type { AxiosError } from 'axios'

import axiosInstance from '@/lib/axios'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface AxiosBaseQueryArgs {
  url: string
  method: HttpMethod
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
  timeout?: number
}

export const API_TAG_TYPES = [
  'auth',
  'user',
  'catalog',
  'bookings',
  'payments',
  'organizations',
  'admin',
  'dashboard',
  'curation',
  'disputes',
] as const

export type ApiTagType = (typeof API_TAG_TYPES)[number]

export interface ApiErrorDetail {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string | null
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiErrorDetail
  timestamp: string
}

export type StandardApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export const axiosBaseQuery =
  (): BaseQueryFn<
    AxiosBaseQueryArgs,
    unknown,
    { status?: number; data: unknown; message?: string }
  > =>
  async ({ url, method, data, params, headers, timeout }) => {
    try {
      const isFormData = data instanceof FormData
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        timeout,
        headers: {
          ...headers,
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        },
      })

      // Handle standardized response format
      const responseData = result.data
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        const standardResp = responseData as Record<string, unknown>
        if (standardResp.success === true) {
          // Unwrap standardized success response
          return { data: 'data' in standardResp ? standardResp.data : standardResp }
        } else if (standardResp.success === false && 'error' in standardResp) {
          // Handle standardized error response with 2xx status
          const errorObj = standardResp.error as
            { message?: string; code?: string; details?: unknown } | string
          const message =
            typeof errorObj === 'object' && errorObj !== null
              ? errorObj.message || errorObj.code || 'An error occurred'
              : typeof errorObj === 'string'
                ? errorObj
                : 'An error occurred'
          return {
            error: {
              status: result.status,
              data: responseData,
              message,
            },
          }
        }
      }

      // Return as-is for backward compatibility
      return { data: responseData }
    } catch (axiosError) {
      const err = axiosError as AxiosError<
        | ApiErrorResponse
        | {
            detail?: string | unknown[]
            message?: string
            error?: { message?: string; code?: string; details?: unknown } | string
          }
        | string
      >
      const responseData = err?.response?.data

      // Handle standardized error format
      let message = err.message || 'Network request failed'
      if (responseData && typeof responseData === 'object') {
        const errorRecord = responseData as Record<string, unknown>
        if ('error' in errorRecord && errorRecord.error) {
          const errField = errorRecord.error
          if (typeof errField === 'object' && errField !== null && 'message' in errField) {
            message = String((errField as { message?: unknown }).message || message)
          } else if (typeof errField === 'string') {
            message = errField
          }
        } else if ('detail' in errorRecord && errorRecord.detail) {
          message =
            typeof errorRecord.detail === 'string'
              ? errorRecord.detail
              : JSON.stringify(errorRecord.detail)
        } else if ('message' in errorRecord && typeof errorRecord.message === 'string') {
          message = errorRecord.message
        }
      } else if (typeof responseData === 'string' && responseData.trim().length > 0) {
        message = responseData
      }

      return {
        error: {
          status: err?.response?.status,
          data: responseData ?? err.message,
          message,
        },
      }
    }
  }

/** Single RTK Query API slice for all SalonDesk portals. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  refetchOnFocus: false,
  endpoints: () => ({}),
  tagTypes: [...API_TAG_TYPES],
})

/** @deprecated Use `baseApi` — kept for incremental migration. */
export const apiSlice = baseApi
