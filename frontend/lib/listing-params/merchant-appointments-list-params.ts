import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type MerchantAppointmentsListParams = {
  search: string
  holdStatus: 'ALL' | 'HELD' | 'CAPTURED' | 'VOIDED' | 'REAUTHORIZED' | 'NO_SHOW_CAPTURED'
  page: number
  limit: number
}

export const MerchantAppointmentsListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 350,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  holdStatus: {
    default: 'ALL' as const,
    urlKey: 'holdStatus',
    omitWhen: 'ALL',
    apiKey: 'status',
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
} satisfies ListingParamSchema<MerchantAppointmentsListParams>

export const merchantAppointmentsListDefaults = listingDefaultsFromSchema<
  MerchantAppointmentsListParams,
  typeof MerchantAppointmentsListParamsSchema
>(MerchantAppointmentsListParamsSchema)

/** KPI cards + filter tab counts (unfiltered list sample). */
export const merchantAppointmentsKpiDefaults = {
  page: 1,
  limit: LISTING_SECTION_PAGE_SIZE,
  search: '',
  holdStatus: 'ALL',
} satisfies Partial<MerchantAppointmentsListParams>

export function buildMerchantAppointmentsKpiApiParams() {
  return listingApiParams(MerchantAppointmentsListParamsSchema, merchantAppointmentsKpiDefaults)
}
