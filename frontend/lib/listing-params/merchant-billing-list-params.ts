import { listingDefaultsFromSchema, type ListingParamSchema } from '@/hooks/useListingParams'

export type MerchantBillingListParams = {
  tab: 'records' | 'invoices'
  status: 'ALL' | 'ACCRUED' | 'INVOICED' | 'PAID' | 'VOID'
  search: string
  page: number
  limit: number
}

export const MerchantBillingListParamsSchema = {
  tab: {
    default: 'records' as const,
    urlKey: 'tab',
    urlOnly: true,
  },
  status: {
    default: 'ALL' as const,
    urlKey: 'status',
    omitWhen: 'ALL',
  },
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 300,
    omitEmptyForApi: true,
    apiKey: 'q',
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
} satisfies ListingParamSchema<MerchantBillingListParams>

export const merchantBillingListDefaults = listingDefaultsFromSchema(
  MerchantBillingListParamsSchema,
)
