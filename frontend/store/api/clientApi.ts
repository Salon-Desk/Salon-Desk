import type {
  ApiBooking,
  ApiConsent,
  CancelBookingRequest,
  ConsentRequest,
  CreateBookingRequest,
  CreateHoldRequest,
  PaymentHold,
  TimeSlot,
} from '@/types/api-booking'
import type { ApiServiceCategory, CatalogOrganization, CatalogService } from '@/types/api-org'

import { baseApi } from '../baseApi'

export interface ClientChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ClientChatRequest {
  message: string
  language?: string
  org_id?: string
  history?: ClientChatMessage[]
}

export interface ClientChatResponse {
  reply: string
  provider?: string
  model?: string
  detected_language?: string
  intent?: string
  recommendations?: Array<{
    service_id: string
    organization_id: string
    name: string
    organization_name: string
    base_price: string | number
    duration_minutes: number
    category_name?: string | null
    description?: string | null
  }>
}

export interface LiveKitTokenRequest {
  language?: string
  participant_name?: string
  metadata?: string
}

export interface LiveKitTokenResponse {
  token: string
  server_url: string
  room_name: string
}

export const clientApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCatalogOrganizations: builder.query<CatalogOrganization[], void>({
      query: () => ({ url: '/api/v1/catalog/organizations', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogCategories: builder.query<ApiServiceCategory[], void>({
      query: () => ({ url: '/api/v1/catalog/categories', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogServices: builder.query<
      CatalogService[],
      { category_id?: string; org_id?: string; q?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/catalog/services',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['catalog'],
    }),

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

    createPaymentHold: builder.mutation<PaymentHold, CreateHoldRequest>({
      query: (data) => ({
        url: '/api/v1/payments/holds',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['payments', 'bookings'],
    }),

    clientConciergeChat: builder.mutation<ClientChatResponse, ClientChatRequest>({
      query: (body) => ({
        url: '/api/v1/chat',
        method: 'POST',
        data: body,
      }),
    }),

    createLiveKitToken: builder.mutation<LiveKitTokenResponse, LiveKitTokenRequest>({
      query: (body) => ({
        url: '/api/v1/livekit/token',
        method: 'POST',
        data: body,
      }),
    }),
  }),
})

export const {
  useGetCatalogOrganizationsQuery,
  useGetCatalogCategoriesQuery,
  useGetCatalogServicesQuery,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingAvailabilityQuery,
  useLazyGetBookingAvailabilityQuery,
  useGetBookingQuery,
  useCreateBookingConsentMutation,
  useCancelBookingMutation,
  useCreatePaymentHoldMutation,
  useClientConciergeChatMutation,
  useCreateLiveKitTokenMutation,
} = clientApi

/** @deprecated Use `clientApi` — kept for existing imports. */
export const catalogApi = clientApi
export const bookingsApi = clientApi
export const paymentsApi = clientApi
