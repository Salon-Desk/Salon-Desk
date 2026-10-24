import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type ClientMyBookingsListParams = {
  page: number
  limit: number
  status: 'all' | string
  q: string
  sort:
    | 'starts_at_asc'
    | 'starts_at_desc'
    | 'created_at_asc'
    | 'created_at_desc'
    | 'total_price_asc'
    | 'total_price_desc'
}

export const ClientMyBookingsListParamsSchema = {
  page: {
    default: 1,
    urlKey: 'bkPage',
  },
  limit: {
    default: LISTING_SECTION_PAGE_SIZE,
    urlKey: 'bkLimit',
    apiKey: 'page_size',
  },
  status: {
    default: 'all' as const,
    urlKey: 'bkStatus',
    omitWhen: 'all',
  },
  q: {
    default: '' as const,
    urlKey: 'bkQ',
    omitWhen: '',
    omitEmptyForApi: true,
  },
  sort: {
    default: 'starts_at_desc' as const,
    urlKey: 'bkSort',
    omitDefaultForApi: true,
  },
} satisfies ListingParamSchema<ClientMyBookingsListParams>

export const clientMyBookingsListDefaults = listingDefaultsFromSchema<
  ClientMyBookingsListParams,
  typeof ClientMyBookingsListParamsSchema
>(ClientMyBookingsListParamsSchema)

export function buildClientMyBookingsApiParams(patch: Partial<ClientMyBookingsListParams> = {}) {
  return listingApiParams(ClientMyBookingsListParamsSchema, {
    ...clientMyBookingsListDefaults,
    ...patch,
  })
}
