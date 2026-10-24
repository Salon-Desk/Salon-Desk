import {
  listingApiParams,
  listingDefaultsFromSchema,
  type ListingParamSchema,
} from '@/hooks/useListingParams'
import type { StatusFilter } from '@/types/organization'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export type AdminSalonsListParams = {
  search: string
  status: StatusFilter
  page: number
  limit: number
}

export const AdminSalonsListParamsSchema = {
  search: {
    default: '',
    urlKey: 'search',
    debounceMs: 350,
    omitEmptyForApi: true,
    apiKey: 'q',
  },
  status: {
    default: 'all' as StatusFilter,
    urlKey: 'status',
    omitDefaultForApi: true,
  },
  page: {
    default: 1,
    urlKey: 'page',
  },
  limit: {
    default: 5,
    urlKey: 'limit',
    apiKey: 'page_size',
  },
} satisfies ListingParamSchema<AdminSalonsListParams>

export const adminSalonsListDefaults = listingDefaultsFromSchema(AdminSalonsListParamsSchema)

export function buildAdminOrganizationsPickerApiParams(
  patch: Partial<AdminSalonsListParams> & { status?: Exclude<StatusFilter, 'all'> } = {},
) {
  const status = patch.status ?? 'approved'
  return listingApiParams(AdminSalonsListParamsSchema, {
    page: 1,
    limit: LISTING_SECTION_PAGE_SIZE,
    search: '',
    ...patch,
    status,
  })
}
