import { createApi } from '@reduxjs/toolkit/query/react'

import axiosBaseQuery from './api'

export const API_SLICE_TAG_TYPES = [
  'auth',
  'user',
  'catalog',
  'bookings',
  'payments',
  'organizations',
  'admin',
  'dashboard',
] as const

export type ApiSliceTagType = (typeof API_SLICE_TAG_TYPES)[number]

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  refetchOnFocus: false,
  endpoints: () => ({}),
  tagTypes: [...API_SLICE_TAG_TYPES],
})
