import type { CreateHoldRequest, PaymentCapture, PaymentHold } from '@/types/api-booking'

import { apiSlice } from '../apiSlice'

export const paymentsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPaymentHold: builder.mutation<PaymentHold, CreateHoldRequest>({
      query: (data) => ({
        url: '/api/v1/payments/holds',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['payments', 'bookings'],
    }),

    markBookingShow: builder.mutation<PaymentCapture, string>({
      query: (bookingId) => ({
        url: `/api/v1/settlements/${bookingId}/mark-show`,
        method: 'POST',
      }),
      invalidatesTags: ['payments', 'bookings', 'organizations'],
    }),

    markBookingNoShow: builder.mutation<PaymentCapture, string>({
      query: (bookingId) => ({
        url: `/api/v1/settlements/${bookingId}/mark-no-show`,
        method: 'POST',
      }),
      invalidatesTags: ['payments', 'bookings', 'organizations'],
    }),

    getSettlementBooking: builder.query<import('@/types/api-booking').ApiBooking, string>({
      query: (bookingId) => ({
        url: `/api/v1/settlements/${bookingId}`,
        method: 'GET',
      }),
      providesTags: ['bookings'],
    }),
  }),
})

export const {
  useCreatePaymentHoldMutation,
  useMarkBookingShowMutation,
  useMarkBookingNoShowMutation,
  useGetSettlementBookingQuery,
} = paymentsApi
