import type { PriceRange, ServiceSort } from '@/app/client/_components/CatalogFilters'
import {
  listingDefaultsFromSchema,
  type ListingParamSchema,
  type ListingParamValue,
} from '@/hooks/useListingParams'

export type ClientCatalogListParams = {
  search: string
  category: string
  orgId: string
  sortBy: ServiceSort
  priceRange: PriceRange
  minRating: number
  viewMode: 'grid' | 'list'
}

export const ClientCatalogListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 300,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  category: {
    default: 'All',
    urlKey: 'category',
    omitWhen: 'All',
    urlOnly: true,
  },
  orgId: {
    default: '',
    urlKey: 'orgId',
    omitEmptyForApi: true,
    apiKey: 'org_id',
  },
  sortBy: {
    default: 'popular' as ServiceSort,
    urlKey: 'sort',
    urlOnly: true,
  },
  priceRange: {
    default: 'all' as PriceRange,
    urlKey: 'price',
    omitWhen: 'all',
    urlOnly: true,
  },
  minRating: {
    default: 0,
    urlKey: 'minRating',
    apiKey: 'min_rating',
    omitDefaultForApi: true,
    serialize: (value: ListingParamValue, defaultValue: ListingParamValue) => {
      const rating = typeof value === 'number' ? value : 0
      const def = typeof defaultValue === 'number' ? defaultValue : 0
      return rating === def || rating <= 0 ? null : String(rating)
    },
    parse: (raw: string | null, defaultValue: ListingParamValue) => {
      const def = typeof defaultValue === 'number' ? defaultValue : 0
      if (raw === null || raw === '' || raw === 'undefined' || raw === 'null') {
        return def
      }
      const n = Number.parseInt(raw, 10)
      return Number.isFinite(n) && n >= 1 && n <= 5 ? n : def
    },
  },
  viewMode: {
    default: 'grid' as const,
    urlKey: 'view',
    urlOnly: true,
  },
} satisfies ListingParamSchema<ClientCatalogListParams>

export const clientCatalogListDefaults = listingDefaultsFromSchema<
  ClientCatalogListParams,
  typeof ClientCatalogListParamsSchema
>(ClientCatalogListParamsSchema)
