'use client'

import { useCallback } from 'react'

import { useSearchablePaginatedList } from '@/hooks/use-searchable-paginated-list'
import { listingApiParams } from '@/hooks/useListingParams'
import { AdminSalonsListParamsSchema } from '@/lib/listing-params/admin-salons-list-params'
import { LISTING_SECTION_PAGE_SIZE } from '@/lib/listing-params/listing-api-limits'
import { useGetAdminOrganizationsQuery } from '@/store/api/platformApi'
import type { ApiOrganization } from '@/types/api-org'
import type { StatusFilter } from '@/types/organization'

export function useSearchableAdminOrganizations(options?: {
  skip?: boolean
  status?: Exclude<StatusFilter, 'all'>
}) {
  const status = options?.status ?? 'approved'
  const skip = options?.skip ?? false

  const buildArgs = useCallback(
    ({ search, page, pageSize }: { search: string; page: number; pageSize: number }) =>
      listingApiParams(AdminSalonsListParamsSchema, {
        page,
        limit: pageSize,
        search,
        status,
      }),
    [status],
  )

  return useSearchablePaginatedList<ApiOrganization, ReturnType<typeof buildArgs>>({
    buildArgs,
    useQuery: useGetAdminOrganizationsQuery,
    getItemId: (o) => o.id,
    skip,
    pageSize: LISTING_SECTION_PAGE_SIZE,
  })
}
