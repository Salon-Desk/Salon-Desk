import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type ClientCatalogCategoriesListParams = {
  search: string
  page: number
  limit: number
}

export const ClientCatalogCategoriesListParamsSchema = {
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
} satisfies ListingParamSchema<ClientCatalogCategoriesListParams>

export const clientCatalogCategoriesListDefaults = listingDefaultsFromSchema<
  ClientCatalogCategoriesListParams,
  typeof ClientCatalogCategoriesListParamsSchema
>(ClientCatalogCategoriesListParamsSchema)

export function buildClientCatalogCategoriesApiParams(
  patch: Partial<ClientCatalogCategoriesListParams> = {},
) {
  return listingApiParams(ClientCatalogCategoriesListParamsSchema, {
    ...clientCatalogCategoriesListDefaults,
    ...patch,
  })
}
