import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/use-listing-params'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type MerchantServicesListParams = {
  search: string
  categoryId: string
  page: number
  limit: number
}

export const MerchantServicesListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 350,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  categoryId: {
    default: 'ALL',
    urlKey: 'categoryId',
    omitWhen: 'ALL',
    apiKey: 'category_id',
  },
  page: {
    default: 1,
    urlKey: 'page',
  },
  limit: {
    default: 9,
    urlKey: 'limit',
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<MerchantServicesListParams>

export const merchantServicesListDefaults = listingDefaultsFromSchema(
  MerchantServicesListParamsSchema,
)

/** Load all services once for per-category tab counts (not the paginated list). */
export const merchantServicesCategoryCountsDefaults = {
  page: 1,
  limit: LISTING_SECTION_PAGE_SIZE,
  search: '',
  categoryId: 'ALL',
} satisfies Partial<MerchantServicesListParams>

export function buildMerchantServicesCategoryCountsApiParams() {
  return listingApiParams(MerchantServicesListParamsSchema, merchantServicesCategoryCountsDefaults)
}
