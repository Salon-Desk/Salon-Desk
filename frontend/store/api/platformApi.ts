import type { ClientFeedbackItem } from '@/types/api-feedback'
import {
  type AdminCuration,
  type AdminDashboard,
  type ApiChangeRequest,
  type ApiOrganization,
  type ApiPage,
  type ApiServiceCategory,
  type CreateFeaturedItemRequest,
  type CreateServiceCategoryRequest,
  type GenerateCommissionInvoiceRequest,
  type HeroImageUploadResponse,
  type HeroSettings,
  normalizePaginated,
  type OrgCommissionInvoice,
  type PlatformCommission,
  type PopularSettings,
  type UpdateFeaturedItemRequest,
  type UpdateHeroSettingsRequest,
  type UpdatePopularSettingsRequest,
  type UpdateServiceCategoryRequest,
} from '@/types/api-org'
import type { MessageOut } from '@/types/auth'
import type { User } from '@/types/user'
import type { CreateStaffRequest } from '@/types/user'

import { baseApi } from '../baseApi'

export const platformApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => ({ url: '/api/v1/admin/dashboard', method: 'GET' }),
      providesTags: ['dashboard', 'admin'],
    }),

    getAdminOrganizations: builder.query<
      ApiPage<ApiOrganization>,
      { page?: number; page_size?: number; q?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/organizations',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiOrganization> | ApiOrganization[]) =>
        normalizePaginated(res),
      providesTags: ['admin', 'organizations'],
    }),

    getPendingSalons: builder.query<
      ApiPage<ApiOrganization>,
      { page?: number; page_size?: number; q?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/salons/pending',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiOrganization> | ApiOrganization[]) =>
        normalizePaginated(res),
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

    getAdminCategories: builder.query<
      ApiPage<ApiServiceCategory>,
      { page?: number; page_size?: number; q?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/service-categories',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiServiceCategory> | ApiServiceCategory[]) =>
        normalizePaginated(res),
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

    getAdminChangeRequests: builder.query<
      ApiPage<ApiChangeRequest>,
      {
        page?: number
        page_size?: number
        q?: string
        status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string
      } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/change-requests',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<ApiChangeRequest> | ApiChangeRequest[]) =>
        normalizePaginated(res),
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

    getAdminCommissions: builder.query<
      ApiPage<PlatformCommission>,
      { page?: number; page_size?: number; q?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/commissions',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<PlatformCommission> | PlatformCommission[]) =>
        normalizePaginated(res),
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

    getAdminStaff: builder.query<User[], void>({
      query: () => ({
        url: '/api/v1/admin/staff',
        method: 'GET',
      }),
      providesTags: ['admin', 'user'],
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

    getAdminCommissionInvoices: builder.query<
      ApiPage<OrgCommissionInvoice>,
      { page?: number; page_size?: number; status?: string; org_id?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/commission-invoices',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: ApiPage<OrgCommissionInvoice> | OrgCommissionInvoice[]) =>
        normalizePaginated(res),
      providesTags: ['admin', 'payments'],
    }),

    createAdminCommissionInvoice: builder.mutation<
      OrgCommissionInvoice,
      GenerateCommissionInvoiceRequest
    >({
      query: (data) => ({
        url: '/api/v1/admin/commission-invoices',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['admin', 'payments', 'organizations'],
    }),

    issueAdminCommissionInvoice: builder.mutation<OrgCommissionInvoice, string>({
      query: (invoiceId) => ({
        url: `/api/v1/admin/commission-invoices/${invoiceId}/issue`,
        method: 'POST',
      }),
      invalidatesTags: ['admin', 'payments', 'organizations'],
    }),

    getAdminClientFeedback: builder.query<
      ApiPage<ClientFeedbackItem>,
      { page?: number; page_size?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/client-feedback',
        method: 'GET',
        params: params || { status: 'pending' },
      }),
      transformResponse: (res: ApiPage<ClientFeedbackItem> | ClientFeedbackItem[]) =>
        normalizePaginated(res),
      providesTags: ['admin'],
    }),

    approveAdminClientFeedback: builder.mutation<
      ClientFeedbackItem,
      { feedbackId: string; moderation_notes?: string | null }
    >({
      query: ({ feedbackId, moderation_notes }) => ({
        url: `/api/v1/admin/client-feedback/${feedbackId}/approve`,
        method: 'POST',
        data: { moderation_notes: moderation_notes ?? null },
      }),
      invalidatesTags: ['admin', 'catalog', 'dashboard'],
    }),

    rejectAdminClientFeedback: builder.mutation<
      ClientFeedbackItem,
      { feedbackId: string; moderation_notes?: string | null }
    >({
      query: ({ feedbackId, moderation_notes }) => ({
        url: `/api/v1/admin/client-feedback/${feedbackId}/reject`,
        method: 'POST',
        data: { moderation_notes: moderation_notes ?? null },
      }),
      invalidatesTags: ['admin', 'catalog', 'dashboard'],
    }),

    voidAdminCommissionInvoice: builder.mutation<OrgCommissionInvoice, string>({
      query: (invoiceId) => ({
        url: `/api/v1/admin/commission-invoices/${invoiceId}/void`,
        method: 'POST',
      }),
      invalidatesTags: ['admin', 'payments', 'organizations'],
    }),

    getAdminCuration: builder.query<AdminCuration, void>({
      query: () => ({ url: '/api/v1/admin/curation', method: 'GET' }),
      providesTags: ['admin', 'curation'],
    }),

    updateHeroSettings: builder.mutation<HeroSettings, UpdateHeroSettingsRequest>({
      query: (body) => ({
        url: '/api/v1/admin/curation/hero',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['admin', 'curation', 'catalog'],
    }),

    uploadHeroImage: builder.mutation<HeroImageUploadResponse, FormData>({
      query: (formData) => ({
        url: '/api/v1/admin/curation/hero/image',
        method: 'POST',
        data: formData,
      }),
      invalidatesTags: ['admin', 'curation', 'catalog'],
    }),

    updatePopularAlgorithm: builder.mutation<PopularSettings, UpdatePopularSettingsRequest>({
      query: (body) => ({
        url: '/api/v1/admin/curation/popular-algorithm',
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: ['admin', 'curation', 'catalog'],
    }),

    createFeaturedItem: builder.mutation<
      { id: string; message: string },
      CreateFeaturedItemRequest
    >({
      query: (body) => ({
        url: '/api/v1/admin/curation/featured',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['admin', 'curation', 'catalog'],
    }),

    updateFeaturedItem: builder.mutation<
      { id: string; message: string },
      { id: string; body: UpdateFeaturedItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/curation/featured/${id}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['admin', 'curation', 'catalog'],
    }),

    deleteFeaturedItem: builder.mutation<{ id: string; message: string }, string>({
      query: (id) => ({
        url: `/api/v1/admin/curation/featured/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['admin', 'curation', 'catalog'],
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
  useGetAdminStaffQuery,
  useCreateAdminStaffMutation,
  useDeleteAdminStaffMutation,
  useGetAdminCommissionInvoicesQuery,
  useCreateAdminCommissionInvoiceMutation,
  useIssueAdminCommissionInvoiceMutation,
  useVoidAdminCommissionInvoiceMutation,
  useGetAdminClientFeedbackQuery,
  useApproveAdminClientFeedbackMutation,
  useRejectAdminClientFeedbackMutation,
  useGetAdminCurationQuery,
  useUpdateHeroSettingsMutation,
  useUploadHeroImageMutation,
  useUpdatePopularAlgorithmMutation,
  useCreateFeaturedItemMutation,
  useUpdateFeaturedItemMutation,
  useDeleteFeaturedItemMutation,
} = platformApi

/** @deprecated Use `platformApi` — kept for existing imports. */
export const adminApi = platformApi
