'use client'

import { Layers } from 'lucide-react'

import { StatusBadge } from '@/components/badge'
import type { ApiServiceCategory } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

export function getTaxonomyTableColumns(): ColumnDefinition<ApiServiceCategory>[] {
  return [
    {
      id: 'name',
      header: 'Category Name',
      cell: (category) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/60 bg-amber-500/10 font-bold text-amber-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">{category.name}</div>
            <StatusBadge tone="slate" size="sm">
              Standard Taxonomy
            </StatusBadge>
          </div>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (category) => (
        <p className="line-clamp-2 max-w-md text-slate-500 text-xs leading-relaxed">
          {category.description || 'Platform service category classification.'}
        </p>
      ),
    },
    {
      id: 'active_salons',
      header: 'Active Salons',
      cell: (category) => (
        <span className="font-semibold text-slate-900 text-xs font-mono">
          {category.active_organizations_count ?? 0}
        </span>
      ),
    },
    {
      id: 'active_services',
      header: 'Active Services',
      cell: (category) => (
        <span className="font-semibold text-slate-900 text-xs font-mono">
          {category.active_services_count ?? 0}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (category) => {
        const isActive = (category.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE'
        return (
          <StatusBadge tone={isActive ? 'emerald' : 'slate'} size="sm" dot>
            {isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        )
      },
    },
  ]
}
