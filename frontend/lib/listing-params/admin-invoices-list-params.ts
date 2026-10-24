import { listingDefaultsFromSchema, type ListingParamSchema } from '@/hooks/useListingParams'

export type AdminInvoicesListParams = {
  search: string
  status: 'all' | 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
  page: number
  limit: number
}

export const AdminInvoicesListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 300,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  status: {
    default: 'all' as const,
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
} satisfies ListingParamSchema<AdminInvoicesListParams>

export const adminInvoicesListDefaults = listingDefaultsFromSchema(AdminInvoicesListParamsSchema)
