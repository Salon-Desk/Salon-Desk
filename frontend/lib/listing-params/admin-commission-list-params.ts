import { listingDefaultsFromSchema, type ListingParamSchema } from '@/hooks/useListingParams'

export type AdminCommissionListParams = {
  search: string
  page: number
  limit: number
}

export const AdminCommissionListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 400,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  page: {
    default: 1,
    urlKey: 'page',
  },
  limit: {
    default: 8,
    urlKey: 'limit',
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<AdminCommissionListParams>

export const adminCommissionListDefaults = listingDefaultsFromSchema(
  AdminCommissionListParamsSchema,
)
