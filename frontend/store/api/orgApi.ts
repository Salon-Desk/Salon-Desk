import type { ApiBooking, PaymentCapture } from '@/types/api-booking'
import {
  type ApiChangeRequest,
  type ApiOrganization,
  type ApiOrgService,
  type ApiOrgSettings,
  type ApiPage,
  type CreateChangeRequestBody,
  normalizePaginated,
  type UpdateOrgServiceRequest,
} from '@/types/api-org'
import type { MessageOut, OrgOwnerSignUpRequest, OrgOwnerSignUpResponse } from '@/types/auth'
import type { User } from '@/types/user'

export interface ApiOrgAccount {
  id: string
  org_id: string
  merchant_id: string
  merchant_email?: string | null
  display_name: string
  currency: string
  status: string
  approved_at?: string | null
}

export interface ApiCancellationPolicy {
  id: string
  org_id: string
  name: string
  status: string
  data: Record<string, unknown>
}

export interface ApiOrgShift {
  id: string
  org_id: string
  name: string
  data: Record<string, unknown>
}

import { baseApi } from '../baseApi'
import type { UpdateEmployeeRequest } from '../slice/userApi'

/**
 * Merchant org-scoped API (Postman: /api/v1/organizations/me/*).
 */
export const orgApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    signUpOrgOwner: builder.mutation<OrgOwnerSignUpResponse, OrgOwnerSignUpRequest>({
      query: (body) => ({
        url: '/api/v1/organizations/sign-up',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['auth', 'organizations'],
    }),

    getMyOrganization: builder.query<ApiOrganization, void>({
      query: () => ({ url: '/api/v1/organizations/me', method: 'GET' }),
      providesTags: ['organizations'],
    }),

    updateMyOrganization: builder.mutation<
      ApiOrganization,
      { name?: string; description?: string; picture?: string }
    >({
      query: (data) => ({
        url: '/api/v1/organizations/me',
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['organizations'],
    }),

    uploadOrgLogo: builder.mutation<ApiOrganization, FormData>({
      query: (formData) => ({
        url: '/api/v1/organizations/me/logo',
        method: 'POST',
        data: formData,
      }),
      invalidatesTags: ['organizations'],
    }),

    getMyOrgSettings: builder.query<ApiOrgSettings, void>({
      query: () => ({ url: '/api/v1/organizations/me/settings', method: 'GET' }),
      providesTags: ['organizations'],
    }),

    updateMyOrgSettings: builder.mutation<
      ApiOrgSettings,
      {
        timezone?: string
        physical_address?: string
        lat?: number
        lng?: number
        working_hours?: Record<string, unknown>
      }
    >({
      query: (data) => ({
        url: '/api/v1/organizations/me/settings',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['organizations'],
    }),

    getMyEmployees: builder.query<
      ApiPage<User>,
      {
        page?: number
        page_size?: number
        q?: string
        status_filter?: string
        role?: string
      } | void
    >({
      query: (params) => ({
        url: '/api/v1/organizations/me/employees',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<User> | User[]) => normalizePaginated(res),
      providesTags: ['user', 'organizations'],
    }),

    createMyEmployee: builder.mutation<User, FormData>({
      query: (formData) => ({
        url: '/api/v1/organizations/me/employees',
        method: 'POST',
        data: formData,
      }),
      invalidatesTags: ['user', 'organizations'],
    }),

    updateMyEmployee: builder.mutation<User, { employeeId: string; data: UpdateEmployeeRequest }>({
      query: ({ employeeId, data }) => ({
        url: `/api/v1/organizations/me/employees/${employeeId}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['user', 'organizations'],
    }),

    deleteMyEmployee: builder.mutation<MessageOut, string>({
      query: (employeeId) => ({
        url: `/api/v1/organizations/me/employees/${employeeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['user', 'organizations'],
    }),

    uploadEmployeeAvatar: builder.mutation<User, { employeeId: string; file: FormData }>({
      query: ({ employeeId, file }) => ({
        url: `/api/v1/organizations/me/employees/${employeeId}/avatar`,
        method: 'POST',
        data: file,
      }),
      invalidatesTags: ['user', 'organizations'],
    }),

    getMyServices: builder.query<
      ApiPage<ApiOrgService>,
      {
        page?: number
        page_size?: number
        q?: string
        category_id?: string
        status?: string
      } | void
    >({
      query: (params) => ({
        url: '/api/v1/organizations/me/services',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiOrgService> | ApiOrgService[]) => normalizePaginated(res),
      providesTags: ['organizations', 'catalog'],
    }),

    createMyService: builder.mutation<ApiOrgService, FormData>({
      query: (formData) => ({
        url: '/api/v1/organizations/me/services',
        method: 'POST',
        data: formData,
      }),
      invalidatesTags: ['organizations', 'catalog'],
    }),

    updateMyService: builder.mutation<
      ApiOrgService,
      { serviceId: string; body: UpdateOrgServiceRequest }
    >({
      query: ({ serviceId, body }) => ({
        url: `/api/v1/organizations/me/services/${serviceId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['organizations', 'catalog'],
    }),

    uploadServiceImage: builder.mutation<ApiOrgService, { serviceId: string; file: FormData }>({
      query: ({ serviceId, file }) => ({
        url: `/api/v1/organizations/me/services/${serviceId}/images`,
        method: 'POST',
        data: file,
      }),
      invalidatesTags: ['organizations', 'catalog'],
    }),

    getMyChangeRequests: builder.query<
      ApiPage<ApiChangeRequest>,
      { page?: number; page_size?: number; q?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/organizations/me/change-requests',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiChangeRequest> | ApiChangeRequest[]) =>
        normalizePaginated(res),
      providesTags: ['organizations'],
    }),

    createMyChangeRequest: builder.mutation<ApiChangeRequest, CreateChangeRequestBody>({
      query: (data) => ({
        url: '/api/v1/organizations/me/change-requests',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['organizations', 'admin'],
    }),

    getMyOrgAccount: builder.query<ApiOrgAccount | null, void>({
      query: () => ({ url: '/api/v1/organizations/me/account', method: 'GET' }),
      providesTags: ['organizations'],
    }),

    getMyCancellationPolicies: builder.query<ApiCancellationPolicy[], void>({
      query: () => ({
        url: '/api/v1/organizations/me/cancellation-policies',
        method: 'GET',
      }),
      providesTags: ['organizations'],
    }),

    getMyOrgBookings: builder.query<
      ApiPage<ApiBooking>,
      {
        page?: number
        page_size?: number
        q?: string
        status?: string
        starts_at?: string
        ends_at?: string
      } | void
    >({
      query: (params) => ({
        url: '/api/v1/organizations/me/bookings',
        method: 'GET',
        params: params
          ? {
              ...(params.page ? { page: params.page } : {}),
              ...(params.page_size ? { page_size: params.page_size } : {}),
              ...(params.q ? { q: params.q } : {}),
              ...(params.status ? { status: params.status } : {}),
              ...(params.starts_at ? { starts_at: params.starts_at } : {}),
              ...(params.ends_at ? { ends_at: params.ends_at } : {}),
            }
          : undefined,
      }),
      transformResponse: (res: ApiPage<ApiBooking> | ApiBooking[]) => normalizePaginated(res),
      providesTags: ['bookings', 'organizations'],
    }),

    getMyShifts: builder.query<ApiOrgShift[], void>({
      query: () => ({ url: '/api/v1/organizations/me/shifts', method: 'GET' }),
      providesTags: ['organizations'],
    }),

    createMyShift: builder.mutation<ApiOrgShift, { name: string; data: Record<string, unknown> }>({
      query: (data) => ({
        url: '/api/v1/organizations/me/shifts',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['organizations'],
    }),

    updateMyShift: builder.mutation<
      ApiOrgShift,
      { shiftId: string; body: { name?: string; data?: Record<string, unknown> } }
    >({
      query: ({ shiftId, body }) => ({
        url: `/api/v1/organizations/me/shifts/${shiftId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['organizations'],
    }),

    deleteMyShift: builder.mutation<MessageOut, string>({
      query: (shiftId) => ({
        url: `/api/v1/organizations/me/shifts/${shiftId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['organizations'],
    }),

    assignEmployeeShift: builder.mutation<unknown, { user_id: string; org_shift_id: string }>({
      query: (data) => ({
        url: '/api/v1/organizations/me/employee-shifts',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['organizations', 'user'],
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

    getSettlementBooking: builder.query<ApiBooking, string>({
      query: (bookingId) => ({
        url: `/api/v1/settlements/${bookingId}`,
        method: 'GET',
      }),
      providesTags: ['bookings'],
    }),
  }),
})

export const {
  useSignUpOrgOwnerMutation,
  useGetMyOrganizationQuery,
  useUpdateMyOrganizationMutation,
  useUploadOrgLogoMutation,
  useGetMyOrgSettingsQuery,
  useUpdateMyOrgSettingsMutation,
  useGetMyEmployeesQuery,
  useCreateMyEmployeeMutation,
  useUpdateMyEmployeeMutation,
  useDeleteMyEmployeeMutation,
  useUploadEmployeeAvatarMutation,
  useGetMyServicesQuery,
  useCreateMyServiceMutation,
  useUpdateMyServiceMutation,
  useUploadServiceImageMutation,
  useGetMyChangeRequestsQuery,
  useCreateMyChangeRequestMutation,
  useGetMyOrgAccountQuery,
  useGetMyCancellationPoliciesQuery,
  useGetMyOrgBookingsQuery,
  useGetMyShiftsQuery,
  useCreateMyShiftMutation,
  useUpdateMyShiftMutation,
  useDeleteMyShiftMutation,
  useAssignEmployeeShiftMutation,
  useMarkBookingShowMutation,
  useMarkBookingNoShowMutation,
  useGetSettlementBookingQuery,
} = orgApi

/** @deprecated Use `orgApi` — kept for existing imports. */
export const organizationApi = orgApi
