import type {
  ApiBooking,
  ApiConsent,
  CancelBookingRequest,
  ConsentRequest,
  CreateBookingRequest,
  TimeSlot,
} from '@/types/api-booking'

import { apiSlice } from '../apiSlice'

export const bookingsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createBooking: builder.mutation<ApiBooking, CreateBookingRequest>({
      query: (data) => ({
        url: '/api/v1/bookings/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['bookings'],
    }),

    getMyBookings: builder.query<ApiBooking[], void>({
      query: () => ({ url: '/api/v1/bookings/me', method: 'GET' }),
      providesTags: ['bookings'],
    }),

    getBookingAvailability: builder.query<
      TimeSlot[],
      { service_id: string; day: string; slot_minutes?: number }
    >({
      query: ({ service_id, day, slot_minutes }) => ({
        url: '/api/v1/bookings/availability',
        method: 'GET',
        params: { service_id, day, slot_minutes },
      }),
    }),

    getBooking: builder.query<ApiBooking, string>({
      query: (bookingId) => ({
        url: `/api/v1/bookings/${bookingId}`,
        method: 'GET',
      }),
      providesTags: ['bookings'],
    }),

    createBookingConsent: builder.mutation<ApiConsent, { bookingId: string; body: ConsentRequest }>(
      {
        query: ({ bookingId, body }) => ({
          url: `/api/v1/bookings/${bookingId}/consent`,
          method: 'POST',
          data: body,
        }),
        invalidatesTags: ['bookings'],
      },
    ),

    cancelBooking: builder.mutation<ApiBooking, { bookingId: string; body?: CancelBookingRequest }>(
      {
        query: ({ bookingId, body }) => ({
          url: `/api/v1/bookings/${bookingId}/cancel`,
          method: 'POST',
          data: body ?? {},
        }),
        invalidatesTags: ['bookings'],
      },
    ),
  }),
})

export const {
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingAvailabilityQuery,
  useLazyGetBookingAvailabilityQuery,
  useGetBookingQuery,
  useCreateBookingConsentMutation,
  useCancelBookingMutation,
} = bookingsApi
