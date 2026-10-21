import { listingDefaultsFromSchema, type ListingParamSchema } from '@/hooks/useListingParams'

export type AdminReviewsListParams = {
  search: string
  status: 'pending' | 'approved' | 'rejected' | 'all'
  page: number
  limit: number
}

export const AdminReviewsListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 400,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  status: {
    default: 'pending' as const,
    urlKey: 'status',
    omitWhen: 'all',
  },
  page: {
    default: 1,
    urlKey: 'page',
  },
  limit: {
    default: 10,
    urlKey: 'limit',
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<AdminReviewsListParams>

export const adminReviewsListDefaults = listingDefaultsFromSchema(AdminReviewsListParamsSchema)
