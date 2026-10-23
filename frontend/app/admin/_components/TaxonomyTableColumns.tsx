'use client'

import { CheckCircle2, Copy, Layers } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import type { ApiServiceCategory } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

interface TaxonomyColumnOptions {
  copiedId: string | null
  onCopyId: (id: string) => void
}

export function getTaxonomyTableColumns({
  copiedId,
  onCopyId,
}: TaxonomyColumnOptions): ColumnDefinition<ApiServiceCategory>[] {
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
      id: 'id',
      header: 'Category ID',
      cell: (category) => (
        <button
          type="button"
          onClick={() => onCopyId(category.id)}
          className="inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] text-slate-400 transition-colors hover:text-slate-700"
          title="Copy category UUID"
        >
          <span>ID: {category.id.slice(0, 8)}…</span>
          {copiedId === category.id ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <Copy className="h-3 w-3 text-slate-400" />
          )}
        </button>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <StatusBadge tone="emerald" size="sm">
          Active
        </StatusBadge>
      ),
    },
  ]
}
