import type { StaffMember } from '@/types'

export interface CatalogStaffMember {
  id: string
  org_id: string
  role: string
  display_name: string
  picture?: string | null
  rating_avg: number
  review_count: number
  specialties: string[]
}

export function mapCatalogStaffToUi(staff: CatalogStaffMember): StaffMember {
  return {
    id: staff.id,
    name: staff.display_name,
    role: staff.role,
    avatar: staff.picture || '',
    rating: staff.rating_avg,
    reviewsCount: staff.review_count,
    specialties: staff.specialties ?? [],
    status: 'ACTIVE',
  }
}
