import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'

export type MerchantStaffListParams = {
  search: string
  role: 'all' | 'stylist' | 'reception' | 'org_owner'
  viewMode: 'grid' | 'table'
  page: number
  limit: number
}

export const MerchantStaffListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 350,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  role: {
    default: 'all' as const,
    urlKey: 'role',
    omitWhen: 'all',
  },
  viewMode: {
    default: 'grid' as const,
    urlKey: 'view',
    urlOnly: true,
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
} satisfies ListingParamSchema<MerchantStaffListParams>

export const merchantStaffListDefaults = listingDefaultsFromSchema(MerchantStaffListParamsSchema)

export const merchantStaffCountDefaults = {
  page: 1,
  limit: 1,
  search: '',
} satisfies Partial<MerchantStaffListParams>

export function buildMerchantStaffCountApiParams(role: MerchantStaffListParams['role']) {
  return listingApiParams(MerchantStaffListParamsSchema, {
    ...merchantStaffCountDefaults,
    role,
  })
}
