import {
  listingApiParams,
  type ListingApiParamsFromSchema,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type ClientOrgDetailListParams = {
  search: string
  category: string
  tab: 'services' | 'about' | 'staff' | 'reviews'
}

export const ClientOrgDetailListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 300,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  category: {
    default: 'all',
    urlKey: 'category',
    omitWhen: 'all',
    urlOnly: true,
  },
  tab: {
    default: 'services' as const,
    urlKey: 'tab',
    urlOnly: true,
  },
} satisfies ListingParamSchema<ClientOrgDetailListParams>

export const clientOrgDetailListDefaults = listingDefaultsFromSchema<
  ClientOrgDetailListParams,
  typeof ClientOrgDetailListParamsSchema
>(ClientOrgDetailListParamsSchema)

export const clientOrgDetailServicesPageSize = LISTING_SECTION_PAGE_SIZE

export function buildClientOrgDetailServicesApiParams(
  orgId: string,
  listingParams: ListingApiParamsFromSchema<
    ClientOrgDetailListParams,
    typeof ClientOrgDetailListParamsSchema
  >,
) {
  return {
    org_id: orgId,
    page_size: clientOrgDetailServicesPageSize,
    ...listingParams,
  }
}

export function buildClientOrgDetailServicesApiParamsFromState(
  orgId: string,
  patch: Partial<ClientOrgDetailListParams> = {},
) {
  return buildClientOrgDetailServicesApiParams(orgId, {
    ...listingApiParams(ClientOrgDetailListParamsSchema, {
      ...clientOrgDetailListDefaults,
      ...patch,
    }),
  } as ListingApiParamsFromSchema<
    ClientOrgDetailListParams,
    typeof ClientOrgDetailListParamsSchema
  >)
}
