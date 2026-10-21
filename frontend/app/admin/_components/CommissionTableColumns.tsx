'use client'

import { Clock, CreditCard, Edit2 } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import { IconButton } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import type { PlatformCommission } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

export function formatCommissionRate(c: PlatformCommission): string {
  const pct = c.percentage != null ? `${Number(c.percentage)}%` : null
  const flat = c.flat != null ? formatUsd(Number(c.flat)) : null
  if (c.type === 'hybrid') return [pct, flat].filter(Boolean).join(' + ')
  if (c.type === 'flat') return flat || '—'
  return pct || '—'
}

interface CommissionColumnOptions {
  categoryNameById: Map<string, string>
  onEdit: (commission: PlatformCommission) => void
}

export function getCommissionTableColumns({
  categoryNameById,
  onEdit,
}: CommissionColumnOptions): ColumnDefinition<PlatformCommission>[] {
  return [
    {
      id: 'name',
      header: 'Rule Name',
      cell: (c) => (
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <span>{c.name}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Target Category',
      cell: (c) => (
        <span className="font-medium text-slate-700">
          {categoryNameById.get(c.service_category_id) || c.service_category_id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Model Type',
      cell: (c) => {
        const tone = c.type === 'percentage' ? 'emerald' : c.type === 'flat' ? 'sky' : 'purple'
        return (
          <StatusBadge tone={tone} size="sm">
            {c.type}
          </StatusBadge>
        )
      },
    },
    {
      id: 'rate',
      header: 'Platform Rate',
      cell: (c) => (
        <span className="font-bold font-mono text-emerald-800 text-sm tabular-nums tracking-tight">
          {formatCommissionRate(c)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Audit Status',
      cell: () => (
        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 tabular-nums">
          <Clock className="h-3 w-3" />
          <span>Active Policy</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (c) => (
        <IconButton
          aria-label="Edit commission"
          onClick={() => onEdit(c)}
          className="rounded-lg opacity-80 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </IconButton>
      ),
    },
  ]
}
