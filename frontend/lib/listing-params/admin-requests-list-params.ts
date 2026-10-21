import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

export type AdminRequestsListParams = {
  search: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'all'
  page: number
  limit: number
}

export const AdminRequestsListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 400,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  status: {
    default: 'PENDING' as const,
    urlKey: 'status',
    omitWhen: 'all',
  },
  page: {
    default: 1,
    urlKey: 'page',
  },
  limit: {
    default: 5,
    urlKey: 'limit',
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<AdminRequestsListParams>

export const adminRequestsListDefaults = listingDefaultsFromSchema(AdminRequestsListParamsSchema)

/** Tab badge totals: one row per status, no search filter. */
export const adminRequestsCountDefaults = {
  page: 1,
  limit: 1,
  search: '',
} satisfies Partial<AdminRequestsListParams>

export function buildAdminRequestsCountApiParams(status: AdminRequestsListParams['status']) {
  return listingApiParams(AdminRequestsListParamsSchema, {
    ...adminRequestsCountDefaults,
    status,
  })
}
