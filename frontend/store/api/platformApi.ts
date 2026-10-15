import type {
  AdminDashboard,
  ApiChangeRequest,
  ApiOrganization,
  ApiServiceCategory,
  CreateServiceCategoryRequest,
  PlatformCommission,
  UpdateServiceCategoryRequest,
} from '@/types/api-org'
import type { MessageOut } from '@/types/auth'
import type { User } from '@/types/user'

import { baseApi } from '../baseApi'
import type { CreateStaffRequest } from '../slice/userApi'

export const platformApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => ({ url: '/api/v1/admin/dashboard', method: 'GET' }),
      providesTags: ['dashboard', 'admin'],
    }),

    getAdminOrganizations: builder.query<ApiOrganization[], { status?: string } | void>({
      query: (params) => ({
        url: '/api/v1/admin/organizations',
        method: 'GET',
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: ['admin', 'organizations'],
    }),

    getPendingSalons: builder.query<ApiOrganization[], void>({
      query: () => ({ url: '/api/v1/admin/salons/pending', method: 'GET' }),
      providesTags: ['admin', 'organizations'],
    }),

    approveOrganization: builder.mutation<ApiOrganization, string>({
      query: (orgId) => ({
        url: `/api/v1/admin/organizations/${orgId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['admin', 'organizations', 'dashboard'],
    }),

    suspendOrganization: builder.mutation<ApiOrganization, string>({
      query: (orgId) => ({
        url: `/api/v1/admin/organizations/${orgId}/suspend`,
        method: 'POST',
      }),
      invalidatesTags: ['admin', 'organizations', 'dashboard'],
    }),

    getAdminCategories: builder.query<ApiServiceCategory[], void>({
      query: () => ({ url: '/api/v1/admin/service-categories', method: 'GET' }),
      providesTags: ['admin', 'catalog'],
    }),

    createAdminCategory: builder.mutation<ApiServiceCategory, CreateServiceCategoryRequest>({
      query: (data) => ({
        url: '/api/v1/admin/service-categories',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['admin', 'catalog'],
    }),

    updateAdminCategory: builder.mutation<
      ApiServiceCategory,
      { categoryId: string; body: UpdateServiceCategoryRequest }
    >({
      query: ({ categoryId, body }) => ({
        url: `/api/v1/admin/service-categories/${categoryId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['admin', 'catalog'],
    }),

    getAdminChangeRequests: builder.query<ApiChangeRequest[], { status?: string } | void>({
      query: (params) => ({
        url: '/api/v1/admin/change-requests',
        method: 'GET',
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: ['admin'],
    }),

    approveChangeRequest: builder.mutation<ApiChangeRequest, { id: string; review_notes?: string }>(
      {
        query: ({ id, review_notes }) => ({
          url: `/api/v1/admin/change-requests/${id}/approve`,
          method: 'POST',
          data: { review_notes },
        }),
        invalidatesTags: ['admin', 'organizations', 'dashboard'],
      },
    ),

    rejectChangeRequest: builder.mutation<ApiChangeRequest, { id: string; review_notes?: string }>({
      query: ({ id, review_notes }) => ({
        url: `/api/v1/admin/change-requests/${id}/reject`,
        method: 'POST',
        data: { review_notes },
      }),
      invalidatesTags: ['admin', 'organizations', 'dashboard'],
    }),

    getAdminCommissions: builder.query<PlatformCommission[], void>({
      query: () => ({ url: '/api/v1/admin/commissions', method: 'GET' }),
      providesTags: ['admin'],
    }),

    createAdminCommission: builder.mutation<
      PlatformCommission,
      {
        service_category_id: string
        name: string
        type: string
        percentage?: number | null
        flat?: number | null
      }
    >({
      query: (data) => ({
        url: '/api/v1/admin/commissions',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['admin'],
    }),

    updateAdminCommission: builder.mutation<
      PlatformCommission,
      {
        commissionId: string
        body: {
          name?: string
          type?: string
          percentage?: number | null
          flat?: number | null
        }
      }
    >({
      query: ({ commissionId, body }) => ({
        url: `/api/v1/admin/commissions/${commissionId}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['admin'],
    }),

    createAdminStaff: builder.mutation<User, CreateStaffRequest>({
      query: (data) => ({
        url: '/api/v1/admin/staff',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['admin', 'user'],
    }),

    deleteAdminStaff: builder.mutation<MessageOut, string>({
      query: (staffId) => ({
        url: `/api/v1/admin/staff/${staffId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['admin', 'user'],
    }),
  }),
})

export const {
  useGetAdminDashboardQuery,
  useGetAdminOrganizationsQuery,
  useGetPendingSalonsQuery,
  useApproveOrganizationMutation,
  useSuspendOrganizationMutation,
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useGetAdminChangeRequestsQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
  useGetAdminCommissionsQuery,
  useCreateAdminCommissionMutation,
  useUpdateAdminCommissionMutation,
  useCreateAdminStaffMutation,
  useDeleteAdminStaffMutation,
} = platformApi

/** @deprecated Use `platformApi` — kept for existing imports. */
export const adminApi = platformApi
