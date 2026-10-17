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
import type {
  ApiServiceCategory,
  CatalogHero,
  CatalogOrganization,
  CatalogService,
  CatalogServicesPage,
  CatalogServicesQueryParams,
} from '@/types/api-org'
import type { User } from '@/types/user'

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
  auth_token?: string | null
  user?: User | null
  recommendations?: Array<{
    service_id: string
    organization_id: string
    name: string
    organization_name: string
    organization_picture?: string | null
    image_url?: string | null
    base_price: string | number
    duration_minutes: number
    category_name?: string | null
    description?: string | null
    physical_address?: string | null
    distance_km?: number | null
  }>
  organizations?: Array<{
    id: string
    name: string
    description?: string | null
    picture?: string | null
    physical_address?: string | null
    rating?: number
    service_count?: number
    distance_km?: number | null
  }>
  confirmed_booking?: {
    id: string
    service_name: string
    organization_name?: string | null
    starts_at: string
    formatted_time?: string | null
    total_price: string | number
    status: string
  } | null
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
    getCatalogHero: builder.query<CatalogHero, void>({
      query: () => ({ url: '/api/v1/catalog/hero', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogOrganizations: builder.query<CatalogOrganization[], void>({
      query: () => ({ url: '/api/v1/catalog/organizations', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogCategories: builder.query<ApiServiceCategory[], void>({
      query: () => ({ url: '/api/v1/catalog/categories', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogServices: builder.query<CatalogServicesPage, CatalogServicesQueryParams | void>({
      query: (params) => {
        const {
          page = 1,
          page_size = 6,
          category_id,
          org_id,
          q,
          sort = 'name',
          lat,
          lng,
          max_distance_km,
        } = params || {}
        return {
          url: '/api/v1/catalog/services',
          method: 'GET',
          params: {
            page,
            page_size,
            sort,
            ...(category_id ? { category_id } : {}),
            ...(org_id ? { org_id } : {}),
            ...(q ? { q } : {}),
            ...(lat !== undefined ? { lat } : {}),
            ...(lng !== undefined ? { lng } : {}),
            ...(max_distance_km !== undefined ? { max_distance_km } : {}),
          },
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { page: _page, ...filters } = queryArgs || {}
        return `${endpointName}(${JSON.stringify(filters)})`
      },
      merge: (currentCache, newItems, { arg }) => {
        const page = arg?.page ?? 1
        if (!currentCache || page <= 1) {
          return newItems
        }
        const seen = new Set(currentCache.items.map((item) => item.id))
        const appended = newItems.items.filter((item) => !seen.has(item.id))
        return {
          ...newItems,
          items: [...currentCache.items, ...appended],
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page
      },
      providesTags: ['catalog'],
    }),

    getCatalogService: builder.query<CatalogService, string>({
      query: (serviceId) => ({
        url: `/api/v1/catalog/services/${serviceId}`,
        method: 'GET',
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
  useGetCatalogHeroQuery,
  useGetCatalogOrganizationsQuery,
  useGetCatalogCategoriesQuery,
  useGetCatalogServicesQuery,
  useGetCatalogServiceQuery,
  useLazyGetCatalogServiceQuery,
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
