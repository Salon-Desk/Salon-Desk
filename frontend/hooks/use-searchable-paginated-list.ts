'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import { LISTING_SECTION_PAGE_SIZE } from '@/lib/listing-params/listing-api-limits'

type PageResult<T> = {
  items: T[]
  total: number
  has_more?: boolean
  page?: number
}

type UseSearchablePaginatedListOptions<T, TArg> = {
  buildArgs: (input: { search: string; page: number; pageSize: number }) => TArg
  useQuery: (
    arg: TArg,
    options?: { skip?: boolean },
  ) => {
    data?: PageResult<T>
    isFetching: boolean
    isLoading: boolean
  }
  getItemId: (item: T) => string
  pageSize?: number
  skip?: boolean
  /** Keep these ids visible even when not in the current result page (e.g. selected value). */
  pinItemIds?: string[]
  resolvePinnedItems?: (ids: string[]) => T[]
}

export function useSearchablePaginatedList<T, TArg>({
  buildArgs,
  useQuery,
  getItemId,
  pageSize = LISTING_SECTION_PAGE_SIZE,
  skip = false,
  pinItemIds = [],
  resolvePinnedItems,
}: UseSearchablePaginatedListOptions<T, TArg>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<T[]>([])

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    setPage(1)
    setItems([])
  }, [debouncedSearch])

  const queryArg = useMemo(
    () => buildArgs({ search: debouncedSearch, page, pageSize }),
    [buildArgs, debouncedSearch, page, pageSize],
  )

  const { data, isFetching, isLoading } = useQuery(queryArg, { skip })

  useEffect(() => {
    if (skip || !data) {
      return
    }
    setItems((prev) => {
      if (page <= 1) {
        return data.items
      }
      const seen = new Set(prev.map(getItemId))
      const merged = [...prev]
      for (const item of data.items) {
        const id = getItemId(item)
        if (!seen.has(id)) {
          seen.add(id)
          merged.push(item)
        }
      }
      return merged
    })
  }, [data, page, skip, getItemId])

  const total = data?.total ?? items.length
  const hasMore =
    data?.has_more ?? (total > 0 ? items.length < total : (data?.items.length ?? 0) >= pageSize)

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1)
    }
  }, [hasMore, isFetching])

  const pinned = useMemo(() => {
    if (!pinItemIds.length || !resolvePinnedItems) {
      return [] as T[]
    }
    return resolvePinnedItems(pinItemIds)
  }, [pinItemIds, resolvePinnedItems])

  const mergedItems = useMemo(() => {
    if (!pinned.length) {
      return items
    }
    const seen = new Set(items.map(getItemId))
    const extra = pinned.filter((item) => !seen.has(getItemId(item)))
    return [...extra, ...items]
  }, [items, pinned, getItemId])

  return {
    items: mergedItems,
    search,
    setSearch,
    hasMore,
    loadMore,
    total,
    isFetching,
    isLoading,
    page,
    reset: () => {
      setSearch('')
      setPage(1)
      setItems([])
    },
  }
}
