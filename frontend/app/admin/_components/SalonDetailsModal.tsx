'use client'

import {
  Calendar,
  CheckCircle2,
  Copy,
  PauseCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import type { ApiOrganization } from '@/types/api-org'

import { formatRegistrationDate } from '../_utils'
import { SalonAvatar } from './SalonAvatar'

interface SalonDetailsModalProps {
  org: ApiOrganization | null
  open: boolean
  onClose: () => void
  onApprove: (org: ApiOrganization) => void
  onSuspend: (org: ApiOrganization) => void
  onCopy: (text: string, label: string) => void
  copiedKey: string | null
  approving: boolean
  suspending: boolean
}

export function SalonDetailsModal({
  org,
  open,
  onClose,
  onApprove,
  onSuspend,
  onCopy,
  copiedKey,
  approving,
  suspending,
}: SalonDetailsModalProps) {
  if (!org) return null

  const isApproved = org.status === 'approved'
  const isPending = org.status === 'pending'
  const tone = isApproved ? 'emerald' : isPending ? 'amber' : 'rose'

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="flex items-center gap-3">
          <SalonAvatar
            name={org.name}
            picture={org.picture}
            className="h-12 w-12 shrink-0 rounded-2xl"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight truncate">
                {org.name}
              </h3>
              <StatusBadge tone={tone} size="sm" dot>
                {org.status}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-slate-500 text-xs">
              Registered partner salon on SalonDesk Network
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Verification Status Banner */}
        <div
          className={`rounded-2xl border p-4 ${
            isApproved
              ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
              : isPending
                ? 'border-amber-200 bg-amber-50/60 text-amber-950'
                : 'border-rose-200 bg-rose-50/60 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isApproved
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : isPending
                    ? 'bg-amber-500/10 text-amber-700'
                    : 'bg-rose-500/10 text-rose-700'
              }`}
            >
              {isApproved ? (
                <ShieldCheck className="h-5 w-5" />
              ) : isPending ? (
                <Shield className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs">
                {isApproved
                  ? 'Active Verified Salon'
                  : isPending
                    ? 'Compliance Review Pending'
                    : 'Salon Suspended'}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">
                {isApproved
                  ? 'This salon has satisfied identity and payment verification. It can accept online bookings and process PayPal authorizations.'
                  : isPending
                    ? 'This salon has registered but requires platform compliance approval before it can go live in search discovery.'
                    : 'This salon is paused. Client bookings and automated hold authorizations are disabled.'}
              </p>
            </div>
          </div>
        </div>

        {/* Salon Metadata Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Registration Date</span>
            </div>
            <p className="mt-1 font-semibold text-slate-900 text-xs">
              {formatRegistrationDate(org.created_at)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Owner Account</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-slate-900 text-xs truncate max-w-[150px]">
                {org.owner_id}
              </span>
              <button
                type="button"
                onClick={() => onCopy(org.owner_id, 'Owner Account ID')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 cursor-pointer"
                title="Copy Owner ID"
              >
                {copiedKey === org.owner_id ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Salon Description */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            About the Salon
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {org.description || 'No public description submitted yet.'}
          </p>
        </div>

        {/* Technical UUID Card */}
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Organization Identifier (UUID)
            </span>
            <span className="font-mono text-xs text-slate-700 truncate block mt-0.5">{org.id}</span>
          </div>
          <button
            type="button"
            onClick={() => onCopy(org.id, 'Organization UUID')}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            {copiedKey === org.id ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span>{copiedKey === org.id ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <PrimaryButton
            title="Close"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="h-9 rounded-xl px-4 text-xs font-semibold"
            onClick={onClose}
          />

          <div className="flex items-center gap-2">
            {!isApproved ? (
              <PrimaryButton
                title={approving ? 'Approving…' : 'Approve Salon'}
                size="sm"
                fullWidth={false}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs"
                isLoading={approving}
                isDisabled={approving}
                onClick={() => onApprove(org)}
              />
            ) : (
              <PrimaryButton
                title={suspending ? 'Suspending…' : 'Suspend Salon'}
                variant="outline"
                size="sm"
                fullWidth={false}
                icon={<PauseCircle className="h-3.5 w-3.5 text-rose-600" />}
                className="h-9 rounded-xl px-4 text-xs font-bold text-rose-700 hover:bg-rose-50 border-rose-200"
                isLoading={suspending}
                isDisabled={suspending}
                onClick={() => onSuspend(org)}
              />
            )}
          </div>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
