'use client'

import { useMemo, useState } from 'react'

import { mapCatalogServiceToSalonService } from '@/lib/mappers/booking'
import { useGetCatalogServicesQuery } from '@/store/slice/catalogApi'
import type { SalonService } from '@/types'
import type { CatalogService, CatalogServicesQueryParams } from '@/types/api-org'

const DEFAULT_PAGE_SIZE = 6

export type PagedCatalogFilters = Omit<CatalogServicesQueryParams, 'page' | 'page_size'>

export interface UsePagedCatalogOptions {
  pageSize?: number
  skip?: boolean
}

export function usePagedCatalog(filters: PagedCatalogFilters, options?: UsePagedCatalogOptions) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE
  const skip = options?.skip ?? false
  const filterKey = JSON.stringify(filters)

  const [page, setPage] = useState(1)
  const [committedKey, setCommittedKey] = useState(filterKey)
  if (filterKey !== committedKey) {
    setCommittedKey(filterKey)
    setPage(1)
  }

  const queryArgs = useMemo(() => {
    const parsed = JSON.parse(filterKey) as PagedCatalogFilters
    return {
      ...parsed,
      page,
      page_size: pageSize,
    }
  }, [filterKey, page, pageSize])

  const { data, isLoading, isFetching, isError, refetch, isSuccess } = useGetCatalogServicesQuery(
    queryArgs,
    { skip },
  )

  const items: CatalogService[] = data?.items ?? []
  const services: SalonService[] = useMemo(
    () => items.map(mapCatalogServiceToSalonService),
    [items],
  )

  const catalogById = useMemo(() => {
    const map = new Map<string, CatalogService>()
    items.forEach((s) => map.set(s.id, s))
    return map
  }, [items])

  const isInitialLoading = !skip && items.length === 0 && (isLoading || isFetching)
  const isLoadingMore = isFetching && page > 1 && items.length > 0

  return {
    services,
    items,
    catalogById,
    page,
    total: data?.total ?? 0,
    hasMore: Boolean(data?.has_more),
    isInitialLoading,
    isLoadingMore,
    isFetching,
    isError,
    isSuccess,
    loadMore: () => setPage((p) => p + 1),
    refetch,
    resetPage: () => setPage(1),
  }
}
