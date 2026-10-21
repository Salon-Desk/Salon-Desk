import { listingApiParams } from '@/hooks/useListingParams'

import { LISTING_SECTION_PAGE_SIZE } from './listing-api-limits'
import { merchantDashboardBookingsFetchDefaults } from './merchant-dashboard-bookings-list-params'
import { MerchantServicesListParamsSchema } from './merchant-services-list-params'
import {
  merchantStaffListDefaults,
  MerchantStaffListParamsSchema,
} from './merchant-staff-list-params'

export function buildMerchantDashboardServicesSnapshotApiParams() {
  return listingApiParams(MerchantServicesListParamsSchema, {
    page: 1,
    limit: LISTING_SECTION_PAGE_SIZE,
    search: '',
    categoryId: 'ALL',
  })
}

export function buildMerchantDashboardChangeRequestsSnapshotApiParams() {
  return {
    page: 1,
    page_size: LISTING_SECTION_PAGE_SIZE,
  }
}

export function buildMerchantLayoutBookingsSnapshotApiParams() {
  return { ...merchantDashboardBookingsFetchDefaults }
}

export function buildMerchantLayoutEmployeesSnapshotApiParams() {
  return listingApiParams(MerchantStaffListParamsSchema, {
    ...merchantStaffListDefaults,
    limit: LISTING_SECTION_PAGE_SIZE,
  })
}

export const buildMerchantLayoutServicesSnapshotApiParams =
  buildMerchantDashboardServicesSnapshotApiParams
export const buildMerchantLayoutChangeRequestsSnapshotApiParams =
  buildMerchantDashboardChangeRequestsSnapshotApiParams
