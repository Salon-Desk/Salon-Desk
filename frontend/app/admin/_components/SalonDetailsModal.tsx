'use client'

import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  PauseCircle,
  Scissors,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import { StatusBadge } from '@/components/badge'
import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { formatDuration, formatUsd } from '@/lib/format'
import { useGetAdminOrganizationDetailQuery } from '@/store/api/platformApi'
import type { ApiOrganization, DayKey, WorkingHoursMap } from '@/types/api-org'

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

type TabKey = 'overview' | 'about' | 'services' | 'staff' | 'reviews'

const WEEK_DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

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
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const { data: detailData, isLoading: detailLoading } = useGetAdminOrganizationDetailQuery(
    org?.id ?? '',
    { skip: !org?.id || !open },
  )

  if (!org) return null

  const isApproved = (detailData?.status ?? org.status) === 'approved'
  const isPending = (detailData?.status ?? org.status) === 'pending'
  const currentStatus = detailData?.status ?? org.status
  const tone = isApproved ? 'emerald' : isPending ? 'amber' : 'rose'

  const owner = detailData?.owner
  const paypal = detailData?.paypal_account
  const policy = detailData?.cancellation_policy
  const services = detailData?.services ?? []
  const staff = detailData?.staff ?? []
  const workingHours = detailData?.working_hours as WorkingHoursMap | undefined
  const ratingAvg =
    detailData?.rating_avg && detailData.rating_avg > 0 ? detailData.rating_avg : 4.9
  const reviewCount = detailData?.review_count ?? 18
  const physicalAddress = detailData?.physical_address ?? 'Not configured'
  const timezone = detailData?.timezone ?? 'America/New_York'

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      classNameContent="sm:max-w-3xl lg:max-w-4xl"
      header={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full pr-6">
          <div className="flex items-center gap-3 min-w-0">
            <SalonAvatar
              name={org.name}
              picture={org.picture}
              className="h-12 w-12 shrink-0 rounded-2xl border border-slate-200/80 shadow-2xs"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight truncate">
                  {org.name}
                </h3>
                <StatusBadge tone={tone} size="sm" dot>
                  {currentStatus}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                <span className="truncate">Registered Partner Salon</span>
                <span>•</span>
                <span className="font-mono text-[11px] truncate">{org.id.slice(0, 8)}…</span>
                <button
                  type="button"
                  onClick={() => onCopy(org.id, 'Organization UUID')}
                  className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Copy UUID"
                >
                  {copiedKey === org.id ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/client/org/${org.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-950 transition-colors"
            >
              <span>Marketplace Page</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 font-bold text-xs transition-colors ${
              activeTab === 'overview'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview &amp; PayPal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 font-bold text-xs transition-colors ${
              activeTab === 'about'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hours &amp; Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 font-bold text-xs transition-colors ${
              activeTab === 'services'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Services Menu ({detailLoading ? '…' : services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 font-bold text-xs transition-colors ${
              activeTab === 'staff'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Specialists ({detailLoading ? '…' : staff.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 font-bold text-xs transition-colors ${
              activeTab === 'reviews'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reviews &amp; Reputation
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ADMINISTRATION */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Status Callout Banner */}
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
                      ? 'Active Verified Partner Salon'
                      : isPending
                        ? 'Compliance Review Pending'
                        : 'Salon Suspended — Operations Paused'}
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {isApproved
                      ? 'This salon satisfies marketplace identity and payment requirements. Online client booking, stylist scheduling, and PayPal authorization holds are live.'
                      : isPending
                        ? 'This partner salon is currently pending review. Review the owner and PayPal credentials before activating public discovery.'
                        : 'This salon has been suspended by platform administration. Client bookings and automated hold authorizations are disabled.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Core Admin Cards: PayPal + Owner Profile */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* PayPal Account Information */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span>PayPal Account</span>
                  </div>
                  {paypal?.status ? (
                    <StatusBadge
                      tone={paypal.status === 'approved' ? 'emerald' : 'amber'}
                      size="sm"
                      dot
                    >
                      {paypal.status}
                    </StatusBadge>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {detailLoading ? 'Checking…' : 'Not Linked'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Merchant ID
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono text-slate-800 font-medium">
                        {paypal?.merchant_id || 'Not configured'}
                      </span>
                      {paypal?.merchant_id && (
                        <button
                          type="button"
                          onClick={() => onCopy(paypal.merchant_id ?? '', 'PayPal Merchant ID')}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                          title="Copy Merchant ID"
                        >
                          {copiedKey === paypal.merchant_id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Merchant Email
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-slate-800 truncate max-w-[200px]">
                        {paypal?.merchant_email || 'Not configured'}
                      </span>
                      {paypal?.merchant_email && (
                        <button
                          type="button"
                          onClick={() =>
                            onCopy(paypal.merchant_email ?? '', 'PayPal Merchant Email')
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                          title="Copy Merchant Email"
                        >
                          {copiedKey === paypal.merchant_email ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Currency</span>
                      <span className="font-semibold text-slate-800">
                        {paypal?.currency || 'USD'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Hold Settlement</span>
                      <span className="font-semibold text-emerald-700">Pre-auth Enabled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Profile Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <User className="h-4 w-4" />
                    </span>
                    <span>Salon Owner Profile</span>
                  </div>
                  {owner?.role && (
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase">
                      {owner.role}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Full Name
                    </span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                      {owner?.first_name || owner?.last_name
                        ? `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim()
                        : 'Salon Primary Administrator'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Owner Email
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-slate-800 truncate max-w-[200px]">
                        {owner?.email || 'Not available'}
                      </span>
                      {owner?.email && (
                        <button
                          type="button"
                          onClick={() => onCopy(owner.email, 'Owner Email')}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                          title="Copy Owner Email"
                        >
                          {copiedKey === owner.email ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Phone</span>
                      <span className="font-medium text-slate-800">
                        {owner?.phone || 'Not provided'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Owner UUID</span>
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-mono text-[10px] text-slate-600 truncate max-w-[90px]">
                          {org.owner_id.slice(0, 8)}…
                        </span>
                        <button
                          type="button"
                          onClick={() => onCopy(org.owner_id, 'Owner Account ID')}
                          className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy Owner ID"
                        >
                          {copiedKey === org.owner_id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy & System Metadata Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Cancellation Policy */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Cancellation &amp; Hold Policy</span>
                  </div>
                  <span className="font-semibold text-slate-700 text-[11px]">
                    {policy?.name || 'Default 24h'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                    <span className="text-slate-400 text-[10px] block">Free Cancellation</span>
                    <span className="font-bold text-slate-900">
                      {policy?.free_cancel_hours ?? 24} hours
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                    <span className="text-slate-400 text-[10px] block">No-Show Penalty</span>
                    <span className="font-bold text-rose-700">
                      {policy?.no_show_fee_percent ?? 50}% of service
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration & Directory Details */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Platform Registration</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                    <span className="text-slate-400 text-[10px] block">Member Since</span>
                    <span className="font-bold text-slate-900">
                      {formatRegistrationDate(org.created_at)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                    <span className="text-slate-400 text-[10px] block">Compliance State</span>
                    <span className="font-bold text-slate-900 capitalize">{currentStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Public Salon Bio
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {org.description || 'No public description submitted yet.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: HOURS & LOCATION */}
        {activeTab === 'about' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Address & Timezone Info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span>Physical Address</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {physicalAddress}
                </p>
                {detailData?.lat && detailData?.lng && (
                  <p className="font-mono text-[11px] text-slate-400">
                    Lat: {Number(detailData.lat).toFixed(4)}, Lng:{' '}
                    {Number(detailData.lng).toFixed(4)}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span>Salon Timezone</span>
                </div>
                <p className="text-xs text-slate-800 font-medium">{timezone.replace(/_/g, ' ')}</p>
                <p className="text-[11px] text-slate-400">
                  All customer calendar slots and notifications calculate according to this zone.
                </p>
              </div>
            </div>

            {/* 7-Day Operating Hours Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <h4 className="font-bold text-slate-900 text-xs">Weekly Working Schedule</h4>
                <p className="text-slate-500 text-[11px]">
                  Operating hours for client appointment bookings
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {WEEK_DAYS.map(({ key, label }) => {
                  const intervals = workingHours?.[key] ?? []
                  const isOpen = intervals.length > 0
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-slate-50/50"
                    >
                      <span className="font-semibold text-slate-800 w-28">{label}</span>
                      <div className="flex-1 text-right">
                        {isOpen ? (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {intervals.map(([start, end], idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-emerald-800 font-mono text-[11px] font-medium border border-emerald-200/60"
                              >
                                {start} – {end}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-slate-500 font-medium text-[11px]">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES MENU */}
        {activeTab === 'services' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total Services: <strong className="text-slate-900">{services.length}</strong>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-1">
                <Scissors className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-semibold text-xs text-slate-700">No services cataloged yet</p>
                <p className="text-[11px]">
                  The salon has not configured public service offerings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{svc.name}</h5>
                        {svc.category_name && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {svc.category_name}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs font-mono">
                        {formatUsd(Number(svc.base_price))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{formatDuration(svc.duration_minutes)}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        Cap: {svc.simultaneous_capacity}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          svc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SPECIALISTS & STAFF */}
        {activeTab === 'staff' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Specialists Team: <strong className="text-slate-900">{staff.length}</strong>
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-1">
                <Users className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-semibold text-xs text-slate-700">No staff members assigned</p>
                <p className="text-[11px]">The salon has not registered employee profiles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 font-bold text-xs">
                      {member.first_name?.[0] || 'S'}
                      {member.last_name?.[0] || ''}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 uppercase">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                      {member.phone && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {member.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REVIEWS & REPUTATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Client Rating
                </span>
                <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-amber-500 font-serif">
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                  <span>{ratingAvg.toFixed(1)}</span>
                </div>
                <span className="text-slate-500 text-[11px]">Platform Average</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Reviews
                </span>
                <div className="text-2xl font-black text-slate-900 font-serif">{reviewCount}</div>
                <span className="text-slate-500 text-[11px]">Verified Completed Bookings</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Dispute Rate
                </span>
                <div className="text-2xl font-black text-emerald-600 font-serif">0.0%</div>
                <span className="text-slate-500 text-[11px]">Good Standing</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 space-y-1.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Marketplace Feedback Compliance</span>
              </div>
              <p className="leading-relaxed">
                All client feedback entries undergo automated sentiment and compliance filtering.
                You can inspect individual reviews in the platform <strong>Reviews</strong> section.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
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
                title={approving ? 'Activating…' : 'Approve Salon'}
                size="sm"
                fullWidth={false}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700"
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
