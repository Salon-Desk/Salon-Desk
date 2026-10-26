'use client'

import { Building2, Check, MessageSquareQuote, Scissors, Star, X } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import type { ClientFeedbackItem } from '@/types/api-feedback'

interface ReviewDetailsModalProps {
  item: ClientFeedbackItem | null
  open: boolean
  onClose: () => void
  onApprove: (item: ClientFeedbackItem) => void
  onReject: (item: ClientFeedbackItem) => void
  isProcessing: boolean
}

export function ReviewDetailsModal({
  item,
  open,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}: ReviewDetailsModalProps) {
  if (!item) return null

  const isPending = item.status === 'pending'
  const tone =
    item.status === 'approved' ? 'emerald' : item.status === 'rejected' ? 'rose' : 'amber'

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
            <MessageSquareQuote className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight truncate">
                Client Review Details
              </h3>
              <StatusBadge tone={tone} size="sm">
                {item.status ?? 'pending'}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-slate-500 text-xs">
              Submitted on {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Rating Score Card */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Customer Rating
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < item.rating
                        ? 'h-5 w-5 fill-amber-400 text-amber-400'
                        : 'h-5 w-5 text-slate-200'
                    }
                  />
                ))}
              </div>
              <span className="font-extrabold text-slate-900 text-lg ml-1 font-mono">
                {item.rating}/5
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Client
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {item.client_name || 'Anonymous Client'}
            </span>
          </div>
        </div>

        {/* Target Salon & Stylist Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Salon Organization
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{item.organization_name || 'Salon'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Service &amp; Stylist
            </span>
            <div className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
              <Scissors className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">
                {item.service_name || 'Service'}
                {item.stylist_name ? ` · ${item.stylist_name}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Full Review Comment */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Client Feedback
          </div>
          <p className="text-sm text-slate-800 leading-relaxed italic">
            &ldquo;{item.comment || 'No written comment provided.'}&rdquo;
          </p>
          {item.moderation_notes && (
            <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
              <strong className="text-slate-700">Moderator note:</strong> {item.moderation_notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <PrimaryButton
            title="Close"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="h-9 rounded-xl px-4 text-xs font-semibold"
            onClick={onClose}
          />

          {isPending && (
            <div className="flex items-center gap-2">
              <PrimaryButton
                title="Reject Review"
                variant="danger"
                size="sm"
                fullWidth={false}
                icon={<X className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-3.5 text-xs font-bold"
                isLoading={isProcessing}
                isDisabled={isProcessing}
                onClick={() => {
                  onReject(item)
                  onClose()
                }}
              />
              <PrimaryButton
                title="Approve &amp; Publish"
                variant="success"
                size="sm"
                fullWidth={false}
                icon={<Check className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs"
                isLoading={isProcessing}
                isDisabled={isProcessing}
                onClick={() => {
                  onApprove(item)
                  onClose()
                }}
              />
            </div>
          )}
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
