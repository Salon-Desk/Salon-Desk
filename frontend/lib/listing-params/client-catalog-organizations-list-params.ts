import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type ClientCatalogOrganizationsListParams = {
  search: string
  page: number
  limit: number
  lat: number
  lng: number
  sort: string
  max_distance_km: number
}

export const ClientCatalogOrganizationsListParamsSchema = {
  search: {
    default: '',
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  page: {
    default: 1,
  },
  limit: {
    default: LISTING_SECTION_PAGE_SIZE,
    apiKey: 'page_size',
  },
  lat: {
    default: 0,
    omitDefaultForApi: true,
  },
  lng: {
    default: 0,
    omitDefaultForApi: true,
  },
  sort: {
    default: '',
    omitEmptyForApi: true,
  },
  max_distance_km: {
    default: 0,
    omitDefaultForApi: true,
  },
} satisfies ListingParamSchema<ClientCatalogOrganizationsListParams>

export const clientCatalogOrganizationsListDefaults = listingDefaultsFromSchema<
  ClientCatalogOrganizationsListParams,
  typeof ClientCatalogOrganizationsListParamsSchema
>(ClientCatalogOrganizationsListParamsSchema)

export function buildClientCatalogOrganizationsApiParams(
  patch: Partial<ClientCatalogOrganizationsListParams> = {},
) {
  return listingApiParams(ClientCatalogOrganizationsListParamsSchema, {
    ...clientCatalogOrganizationsListDefaults,
    ...patch,
  })
}
