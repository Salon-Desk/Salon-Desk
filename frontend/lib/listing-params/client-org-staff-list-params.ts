import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type ClientOrgStaffListParams = {
  page: number
  limit: number
}

export const ClientOrgStaffListParamsSchema = {
  page: {
    default: 1,
  },
  limit: {
    default: LISTING_SECTION_PAGE_SIZE,
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<ClientOrgStaffListParams>

export const clientOrgStaffListDefaults = listingDefaultsFromSchema<
  ClientOrgStaffListParams,
  typeof ClientOrgStaffListParamsSchema
>(ClientOrgStaffListParamsSchema)

export type ClientOrgStaffQueryArg = {
  orgId: string
  page?: number
  page_size?: number
}

export function buildClientOrgStaffQueryArg(orgId: string): ClientOrgStaffQueryArg {
  const api = listingApiParams(ClientOrgStaffListParamsSchema, clientOrgStaffListDefaults)
  return {
    orgId,
    page: typeof api.page === 'number' ? api.page : 1,
    page_size: typeof api.page_size === 'number' ? api.page_size : LISTING_SECTION_PAGE_SIZE,
  }
}
