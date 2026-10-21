import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type MerchantDashboardBookingsListParams = {
  search: string
  filterTab: 'all' | 'holds' | 'captured' | 'voided'
}

export const MerchantDashboardBookingsListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 350,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  filterTab: {
    default: 'all' as const,
    urlKey: 'tab',
    urlOnly: true,
  },
} satisfies ListingParamSchema<MerchantDashboardBookingsListParams>

export const merchantDashboardBookingsListDefaults = listingDefaultsFromSchema(
  MerchantDashboardBookingsListParamsSchema,
)

/** Dashboard KPI + table sample (server max page size). */
export const merchantDashboardBookingsFetchDefaults = {
  page: 1,
  page_size: LISTING_SECTION_PAGE_SIZE,
} as const

export function buildMerchantDashboardBookingsApiParams(
  patch: Pick<MerchantDashboardBookingsListParams, 'search' | 'filterTab'>,
) {
  return {
    ...listingApiParams(MerchantDashboardBookingsListParamsSchema, {
      ...merchantDashboardBookingsListDefaults,
      ...patch,
    }),
    ...merchantDashboardBookingsFetchDefaults,
  }
}
