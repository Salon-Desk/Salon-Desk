import { listingDefaultsFromSchema, type ListingParamSchema } from '@/hooks/useListingParams'

export type AdminStaffListParams = {
  search: string
  role: 'all' | 'platform_admin' | 'platform_staff'
  page: number
  limit: number
}

export const AdminStaffListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 300,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  role: {
    default: 'all' as const,
    urlKey: 'role',
    omitWhen: 'all',
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
} satisfies ListingParamSchema<AdminStaffListParams>

export const adminStaffListDefaults = listingDefaultsFromSchema(AdminStaffListParamsSchema)
