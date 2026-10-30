import type {
  ApiBooking,
  ApiConsent,
  AvailabilityResponse,
  CancelBookingRequest,
  ClientChatRequest,
  ClientChatResponse,
  CompleteHoldRequest,
  ConsentRequest,
  CreateBookingRequest,
  CreateHoldRequest,
  LiveKitTokenRequest,
  LiveKitTokenResponse,
  PaymentHold,
} from '@/types/api-booking'
import type {
  CatalogStaffMember,
  ClientFeedbackItem,
  CreateClientFeedbackBody,
} from '@/types/api-feedback'
import {
  type ApiPage,
  type ApiServiceCategory,
  type CatalogCuration,
  type CatalogHero,
  type CatalogOrganization,
  type CatalogService,
  type CatalogServicesPage,
  type CatalogServicesQueryParams,
  normalizePaginated,
} from '@/types/api-org'

import { baseApi } from '../baseApi'

export const clientApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCatalogHero: builder.query<CatalogHero, void>({
      query: () => ({ url: '/api/v1/catalog/hero', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogCuration: builder.query<CatalogCuration, void>({
      query: () => ({ url: '/api/v1/catalog/curation', method: 'GET' }),
      providesTags: ['catalog'],
    }),

    getCatalogOrganizations: builder.query<
      ApiPage<CatalogOrganization>,
      {
        page?: number
        page_size?: number
        q?: string
        sort?: string
        lat?: number
        lng?: number
        max_distance_km?: number
      } | void
    >({
      query: (params) => ({
        url: '/api/v1/catalog/organizations',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<CatalogOrganization> | CatalogOrganization[]) =>
        normalizePaginated(res),
      providesTags: ['catalog'],
    }),

    getCatalogOrganization: builder.query<CatalogOrganization, string>({
      query: (orgId) => ({
        url: `/api/v1/catalog/organizations/${orgId}`,
        method: 'GET',
      }),
      providesTags: ['catalog'],
    }),

    getCatalogCategories: builder.query<
      ApiPage<ApiServiceCategory>,
      { page?: number; page_size?: number; q?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/catalog/categories',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiServiceCategory> | ApiServiceCategory[]) =>
        normalizePaginated(res),
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
          min_price,
          max_price,
          min_rating,
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
            ...(min_price !== undefined ? { min_price } : {}),
            ...(max_price !== undefined ? { max_price } : {}),
            ...(min_rating !== undefined ? { min_rating } : {}),
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

    getCatalogOrgStaff: builder.query<
      ApiPage<CatalogStaffMember>,
      | string
      | {
          orgId: string
          page?: number
          page_size?: number
        }
    >({
      query: (arg) => {
        const orgId = typeof arg === 'string' ? arg : arg.orgId
        const params =
          typeof arg === 'string'
            ? undefined
            : {
                ...(arg.page !== undefined ? { page: arg.page } : {}),
                ...(arg.page_size !== undefined ? { page_size: arg.page_size } : {}),
              }
        return {
          url: `/api/v1/catalog/organizations/${orgId}/staff`,
          method: 'GET',
          params,
        }
      },
      transformResponse: (res: ApiPage<CatalogStaffMember> | CatalogStaffMember[]) =>
        normalizePaginated(res),
      providesTags: (_result, _err, arg) => {
        const orgId = typeof arg === 'string' ? arg : arg.orgId
        return [{ type: 'catalog', id: `staff-${orgId}` }]
      },
    }),

    getCatalogOrgFeedback: builder.query<
      ApiPage<ClientFeedbackItem>,
      { orgId: string; stylistId?: string; page_size?: number }
    >({
      query: ({ orgId, stylistId, page_size = 12 }) => ({
        url: `/api/v1/catalog/organizations/${orgId}/feedback`,
        method: 'GET',
        params: {
          page_size,
          ...(stylistId ? { stylist_id: stylistId } : {}),
        },
      }),
      transformResponse: (res: ApiPage<ClientFeedbackItem> | ClientFeedbackItem[]) =>
        normalizePaginated(res),
      providesTags: (_result, _err, arg) => [{ type: 'catalog', id: `feedback-${arg.orgId}` }],
    }),

    getMyFeedback: builder.query<ClientFeedbackItem[], void>({
      query: () => ({ url: '/api/v1/feedback/me', method: 'GET' }),
      providesTags: ['bookings'],
    }),

    submitClientFeedback: builder.mutation<ClientFeedbackItem, CreateClientFeedbackBody>({
      query: (body) => ({
        url: '/api/v1/feedback',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['bookings', 'catalog'],
    }),

    getCatalogCancellationPolicy: builder.query<
      {
        org_id: string
        name: string
        free_cancel_hours: number
        no_show_fee_percent: number
        late_cancel_fee_percent?: number | null
        data: Record<string, unknown>
      },
      string
    >({
      query: (orgId) => ({
        url: `/api/v1/catalog/organizations/${orgId}/cancellation-policy`,
        method: 'GET',
      }),
      providesTags: ['catalog'],
    }),

    createBooking: builder.mutation<ApiBooking, CreateBookingRequest>({
      query: (data) => ({
        // Prefer no trailing slash — some proxies 307 `/bookings/` → `/bookings` and drop POST.
        url: '/api/v1/bookings',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['bookings'],
    }),

    getMyBookings: builder.query<
      ApiPage<ApiBooking>,
      { page?: number; page_size?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/bookings/me',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiBooking> | ApiBooking[]) => normalizePaginated(res),
      providesTags: ['bookings'],
    }),

    getBookingAvailability: builder.query<
      AvailabilityResponse,
      {
        service_id: string
        day: string
        slot_minutes?: number
        stylist_id?: string | null
        duration_minutes?: number | null
      }
    >({
      query: ({ service_id, day, slot_minutes, stylist_id, duration_minutes }) => ({
        url: '/api/v1/bookings/availability',
        method: 'GET',
        params: {
          service_id,
          day,
          ...(slot_minutes ? { slot_minutes } : {}),
          ...(stylist_id ? { stylist_id } : {}),
          ...(duration_minutes ? { duration_minutes } : {}),
        },
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

    rescheduleBooking: builder.mutation<
      ApiBooking,
      { bookingId: string; body: { starts_at: string; stylist_id?: string | null } }
    >({
      query: ({ bookingId, body }) => ({
        url: `/api/v1/bookings/${bookingId}/reschedule`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['bookings'],
    }),

    createPaymentHold: builder.mutation<PaymentHold, CreateHoldRequest>({
      query: (data) => ({
        url: '/api/v1/payments/holds',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['payments', 'bookings'],
    }),

    completePaymentHold: builder.mutation<
      PaymentHold,
      { holdId: string; body?: CompleteHoldRequest }
    >({
      query: ({ holdId, body }) => ({
        url: `/api/v1/payments/holds/${holdId}/complete`,
        method: 'POST',
        data: body ?? {},
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
  useGetCatalogCurationQuery,
  useGetCatalogOrganizationsQuery,
  useGetCatalogOrganizationQuery,
  useGetCatalogCategoriesQuery,
  useGetCatalogServicesQuery,
  useGetCatalogServiceQuery,
  useLazyGetCatalogServiceQuery,
  useGetCatalogCancellationPolicyQuery,
  useGetCatalogOrgStaffQuery,
  useGetCatalogOrgFeedbackQuery,
  useGetMyFeedbackQuery,
  useSubmitClientFeedbackMutation,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingAvailabilityQuery,
  useLazyGetBookingAvailabilityQuery,
  useGetBookingQuery,
  useCreateBookingConsentMutation,
  useCancelBookingMutation,
  useRescheduleBookingMutation,
  useCreatePaymentHoldMutation,
  useCompletePaymentHoldMutation,
  useClientConciergeChatMutation,
  useCreateLiveKitTokenMutation,
} = clientApi

/** @deprecated Use `clientApi` — kept for existing imports. */
export const catalogApi = clientApi
export const bookingsApi = clientApi
export const paymentsApi = clientApi
