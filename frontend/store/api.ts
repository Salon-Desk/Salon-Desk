import type { BaseQueryFn } from '@reduxjs/toolkit/query'
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

const axiosBaseQuery =
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
      return { data: result.data }
    } catch (axiosError) {
      const err = axiosError as AxiosError<{ detail?: string; message?: string }>
      const responseData = err?.response?.data
      const message =
        responseData && typeof responseData === 'object' && 'detail' in responseData
          ? responseData.detail
          : err.message
      return {
        error: {
          status: err?.response?.status,
          data: responseData || err.message,
          message,
        },
      }
    }
  }

export default axiosBaseQuery
