'use client'

import { useCallback } from 'react'

import { useSearchablePaginatedList } from '@/hooks/use-searchable-paginated-list'
import { buildAdminCurationCatalogServicesApiParams } from '@/lib/listing-params/admin-curation-list-params'
import { buildClientCatalogCategoriesApiParams } from '@/lib/listing-params/client-catalog-categories-list-params'
import { buildClientCatalogOrganizationsApiParams } from '@/lib/listing-params/client-catalog-organizations-list-params'
import {
  useGetCatalogCategoriesQuery,
  useGetCatalogOrganizationQuery,
  useGetCatalogOrganizationsQuery,
  useGetCatalogServicesQuery,
} from '@/store/api/clientApi'
import type { ApiServiceCategory, CatalogOrganization, CatalogService } from '@/types/api-org'

export function useSearchableCatalogOrganizations(options?: {
  skip?: boolean
  selectedOrgId?: string
  lat?: number
  lng?: number
  sort?: string
  max_distance_km?: number
}) {
  const skip = options?.skip ?? false
  const selectedOrgId = options?.selectedOrgId?.trim() ?? ''
  const lat = options?.lat
  const lng = options?.lng
  const sort = options?.sort
  const max_distance_km = options?.max_distance_km

  const { data: selectedOrg } = useGetCatalogOrganizationQuery(selectedOrgId, {
    skip: skip || !selectedOrgId,
  })

  const buildArgs = useCallback(
    ({ search, page, pageSize }: { search: string; page: number; pageSize: number }) =>
      buildClientCatalogOrganizationsApiParams({
        search,
        page,
        limit: pageSize,
        ...(typeof lat === 'number' ? { lat } : {}),
        ...(typeof lng === 'number' ? { lng } : {}),
        ...(sort ? { sort } : {}),
        ...(typeof max_distance_km === 'number' ? { max_distance_km } : {}),
      }),
    [lat, lng, sort, max_distance_km],
  )

  const resolvePinned = useCallback(
    (ids: string[]) => {
      if (selectedOrg && ids.includes(selectedOrg.id)) {
        return [selectedOrg]
      }
      return [] as CatalogOrganization[]
    },
    [selectedOrg],
  )

  return useSearchablePaginatedList<CatalogOrganization, ReturnType<typeof buildArgs>>({
    buildArgs,
    useQuery: useGetCatalogOrganizationsQuery,
    getItemId: (o) => o.id,
    skip,
    pinItemIds: selectedOrgId ? [selectedOrgId] : [],
    resolvePinnedItems: resolvePinned,
  })
}

export function useSearchableCatalogServices(options?: { skip?: boolean }) {
  const buildArgs = useCallback(
    ({ search, page, pageSize: _pageSize }: { search: string; page: number; pageSize: number }) =>
      buildAdminCurationCatalogServicesApiParams({ search, page }),
    [],
  )

  return useSearchablePaginatedList<CatalogService, ReturnType<typeof buildArgs>>({
    buildArgs,
    useQuery: useGetCatalogServicesQuery,
    getItemId: (s) => s.id,
    skip: options?.skip,
  })
}

export function useSearchableCatalogCategories(options?: { skip?: boolean }) {
  const buildArgs = useCallback(
    ({ search, page, pageSize }: { search: string; page: number; pageSize: number }) =>
      buildClientCatalogCategoriesApiParams({ search, page, limit: pageSize }),
    [],
  )

  return useSearchablePaginatedList<ApiServiceCategory, ReturnType<typeof buildArgs>>({
    buildArgs,
    useQuery: useGetCatalogCategoriesQuery,
    getItemId: (c) => c.id,
    skip: options?.skip,
  })
}
