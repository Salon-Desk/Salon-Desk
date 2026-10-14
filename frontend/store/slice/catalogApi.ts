import type { ApiServiceCategory, CatalogOrganization, CatalogService } from '@/types/api-org'

import { apiSlice } from '../apiSlice'

export const catalogApi = apiSlice.injectEndpoints({
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
  }),
})

export const {
  useGetCatalogOrganizationsQuery,
  useGetCatalogCategoriesQuery,
  useGetCatalogServicesQuery,
} = catalogApi
