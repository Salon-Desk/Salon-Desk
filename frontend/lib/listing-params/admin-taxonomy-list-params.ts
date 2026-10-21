import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type AdminTaxonomyListParams = {
  search: string
  page: number
  limit: number
}

export const AdminTaxonomyListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 400,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  page: {
    default: 1,
    urlKey: 'page',
  },
  limit: {
    default: 6,
    urlKey: 'limit',
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<AdminTaxonomyListParams>

export const adminTaxonomyListDefaults = listingDefaultsFromSchema(AdminTaxonomyListParamsSchema)

/** Admin shell / nav: load all categories in one request. */
export function buildAdminCategoriesNavApiParams() {
  return listingApiParams(AdminTaxonomyListParamsSchema, {
    page: 1,
    limit: LISTING_SECTION_PAGE_SIZE,
    search: '',
  })
}
