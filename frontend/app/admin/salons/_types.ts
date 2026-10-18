import type { ApiOrgStatus } from '@/types/api-org'

export type StatusFilter = 'all' | ApiOrgStatus

export interface SalonCounts {
  all: number
  pending: number
  approved: number
  suspended: number
}
