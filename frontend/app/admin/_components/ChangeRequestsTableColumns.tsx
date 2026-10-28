'use client'

import { CreditCard, Eye, ShieldCheck, Sliders } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import { Button } from '@/components/ui/button'
import type { ApiChangeRequest } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

import { getChangeRequestPlainSummary } from './PayloadParameterCard'

interface ChangeRequestsTableColumnsOptions {
  onInspect: (request: ApiChangeRequest) => void
}

export function getChangeRequestsTableColumns({
  onInspect,
}: ChangeRequestsTableColumnsOptions): ColumnDefinition<ApiChangeRequest>[] {
  return [
    {
      id: 'request_type',
      header: 'Request Type',
      cell: (cr) => {
        const isPaypal = cr.request_type === 'PAYPAL_ACCOUNT'
        const isPolicy = cr.request_type === 'CANCELLATION_POLICY'
        const label = isPaypal
          ? 'PayPal Payout'
          : isPolicy
            ? 'Cancellation Policy'
            : cr.request_type.replace(/_/g, ' ')

        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                isPaypal
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : isPolicy
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {isPaypal ? (
                <CreditCard className="h-4 w-4" />
              ) : isPolicy ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Sliders className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-xs block truncate">{label}</span>
              <span className="font-mono text-[10px] text-slate-400 block truncate">
                Req: {cr.id.slice(0, 8)}…
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'org_id',
      header: 'Salon Org',
      cell: (cr) => (
        <span className="font-mono text-xs text-slate-700 font-medium">
          {cr.org_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      id: 'summary',
      header: 'Plain Language Amendment',
      cell: (cr) => {
        const summary = getChangeRequestPlainSummary(cr)
        return (
          <div className="max-w-md py-1">
            <p className="text-xs text-slate-800 font-medium leading-relaxed">{summary}</p>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (cr) => {
        const status = cr.status?.toUpperCase()
        const tone = status === 'APPROVED' ? 'emerald' : status === 'PENDING' ? 'amber' : 'rose'
        return (
          <StatusBadge tone={tone} size="sm" dot>
            {cr.status}
          </StatusBadge>
        )
      },
    },
    {
      id: 'created_at',
      header: 'Submitted',
      cell: (cr) => (
        <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
          {cr.created_at ? new Date(cr.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (cr) => {
        const isPending = cr.status === 'PENDING'
        return (
          <Button
            size="sm"
            variant={isPending ? 'default' : 'outline'}
            className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isPending
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                : 'border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => onInspect(cr)}
          >
            <Eye className="h-3 w-3 mr-1" />
            <span>{isPending ? 'Review' : 'View'}</span>
          </Button>
        )
      },
    },
  ]
}
