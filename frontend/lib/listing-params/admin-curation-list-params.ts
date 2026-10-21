import { listingApiParams } from '@/hooks/useListingParams'

import { AdminSalonsListParamsSchema } from './admin-salons-list-params'
import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'

export function buildAdminCurationOrganizationsApiParams(
  patch: { search?: string; page?: number } = {},
) {
  return listingApiParams(AdminSalonsListParamsSchema, {
    page: patch.page ?? 1,
    limit: LISTING_SECTION_PAGE_SIZE,
    search: patch.search ?? '',
    status: 'approved',
  })
}

export function buildAdminCurationCatalogServicesApiParams(
  patch: { search?: string; page?: number } = {},
) {
  return {
    page: patch.page ?? 1,
    page_size: LISTING_SECTION_PAGE_SIZE,
    ...(patch.search?.trim() ? { q: patch.search.trim() } : {}),
  }
}
