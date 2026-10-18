'use client'

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import {
  useCreateMyChangeRequestMutation,
  useGetMyCancellationPoliciesQuery,
  useGetMyChangeRequestsQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgSettingsQuery,
} from '@/store/api/orgApi'
import type { ApiChangeRequest } from '@/types/api-org'

import { PaypalChangeModal, PolicyChangeModal } from '../_components/settings-modals'

export type MerchantFinanceSettingsMode = 'all' | 'paypal' | 'policies'

interface MerchantFinanceSettingsProps {
  mode?: MerchantFinanceSettingsMode
}

export function MerchantFinanceSettings({ mode = 'all' }: MerchantFinanceSettingsProps) {
  const pathname = usePathname()
  const showPaypal = mode === 'all' || mode === 'paypal'
  const showPolicies = mode === 'all' || mode === 'policies'

  const { data: org, isLoading: orgLoading } = useGetMyOrganizationQuery()
  const { data: account, isLoading: accountLoading } = useGetMyOrgAccountQuery()
  const { data: settings } = useGetMyOrgSettingsQuery()
  const { data: policies = [], isLoading: policiesLoading } = useGetMyCancellationPoliciesQuery()
  const {
    data: changeRequestsData,
    isLoading: crLoading,
    isError,
    refetch,
  } = useGetMyChangeRequestsQuery()
  const changeRequests = changeRequestsData?.items ?? []
  const [createChangeRequest, { isLoading: submitting }] = useCreateMyChangeRequestMutation()

  const [copied, setCopied] = useState(false)
  const [isPaypalOpen, setIsPaypalOpen] = useState(false)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'ALL',
  )
  const [searchQuery, setSearchQuery] = useState('')

  const activePolicy = useMemo(
    () => policies.find((p) => p.status?.toLowerCase() === 'active') || policies[0],
    [policies],
  )

  const policyHours = Number(
    (activePolicy?.data?.free_cancel_hours as number | undefined) ??
      (activePolicy?.data?.policyHours as number | undefined) ??
      24,
  )
  const noShowFeePercent = Number(
    (activePolicy?.data?.no_show_fee_percent as number | undefined) ??
      (activePolicy?.data?.noShowFeePercent as number | undefined) ??
      50,
  )
  const lateCancelFeePercent = Number(
    (activePolicy?.data?.late_cancel_fee_percent as number | undefined) ??
      (activePolicy?.data?.lateCancelFeePercent as number | undefined) ??
      25,
  )
  const holdPercent = Number((activePolicy?.data?.hold_percent as number | undefined) ?? 100)
  const flatNoShowFee = activePolicy?.data?.no_show_fee as number | undefined

  const merchantId = account?.merchant_id || '—'
  const isLoading = orgLoading || accountLoading || policiesLoading || crLoading

  const handleCopyMerchantId = () => {
    if (!account?.merchant_id) return
    void navigator.clipboard.writeText(account.merchant_id)
    setCopied(true)
    toast.success('Merchant ID copied to clipboard', toastColor.success)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitPaypal = async (
    nextMerchantId: string,
    details?: {
      merchant_id: string
      merchant_email?: string
      display_name?: string
    },
  ) => {
    try {
      await createChangeRequest({
        request_type: 'PAYPAL_ACCOUNT',
        payload_json: {
          merchant_id: nextMerchantId,
          display_name: details?.display_name || org?.name || nextMerchantId,
          currency: account?.currency || 'USD',
          merchant_email: details?.merchant_email || account?.merchant_email || null,
          org_name: org?.name || null,
        },
        current_snapshot_json: {
          merchant_id: account?.merchant_id || null,
          merchant_email: account?.merchant_email || null,
          display_name: account?.display_name || org?.name || null,
          currency: account?.currency || 'USD',
          status: account?.status || null,
          org_name: org?.name || null,
        },
      }).unwrap()
      toast.success('PayPal change request submitted for platform review', toastColor.success)
      setIsPaypalOpen(false)
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not submit request'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleSubmitPolicy = async (next: {
    name: string
    policyHours: number
    noShowFee: number
    noShowFeePercent: number
    lateCancelFeePercent: number
    holdPercent: number
  }) => {
    try {
      await createChangeRequest({
        request_type: 'CANCELLATION_POLICY',
        payload_json: {
          name: next.name || activePolicy?.name || 'Updated policy',
          policy_id: activePolicy?.id,
          org_name: org?.name || null,
          data: {
            free_cancel_hours: next.policyHours,
            no_show_fee_percent: next.noShowFeePercent,
            late_cancel_fee_percent: next.lateCancelFeePercent,
            hold_percent: next.holdPercent,
          },
        },
        current_snapshot_json: {
          policy_id: activePolicy?.id || null,
          name: activePolicy?.name || null,
          org_name: activePolicy?.org_name || org?.name || null,
          data: activePolicy?.data || {},
        },
      }).unwrap()
      toast.success('Policy amendment submitted for platform review', toastColor.success)
      setIsPolicyOpen(false)
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not submit request'
      toast.error(String(message), toastColor.error)
    }
  }

  const filteredChangeRequests = useMemo(() => {
    return changeRequests
      .filter((cr) => {
        if (mode === 'paypal') return cr.request_type === 'PAYPAL_ACCOUNT'
        if (mode === 'policies') return cr.request_type === 'CANCELLATION_POLICY'
        return true
      })
      .filter((cr) => {
        if (requestFilter === 'ALL') return true
        return cr.status?.toUpperCase() === requestFilter
      })
      .filter((cr) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const idMatch = cr.id?.toLowerCase().includes(q)
        const typeMatch = cr.request_type?.toLowerCase().includes(q)
        const notesMatch = cr.review_notes?.toLowerCase().includes(q)
        const submitterMatch = cr.submitter_name?.toLowerCase().includes(q)
        const orgMatch = cr.org_name?.toLowerCase().includes(q)
        return idMatch || typeMatch || notesMatch || submitterMatch || orgMatch
      })
  }, [changeRequests, mode, requestFilter, searchQuery])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Settings Navigation Bar */}
      <div className="border-b border-slate-200/80 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
              {mode === 'paypal'
                ? 'PayPal Payout Configuration'
                : mode === 'policies'
                  ? 'Cancellation & No-Show Terms'
                  : 'Finance & Compliance Governance'}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {isLoading ? (
                'Loading salon configuration…'
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">
                    {org?.name || activePolicy?.org_name || 'Salon'}
                  </span>
                  <span>·</span>
                  <span>Timezone: {settings?.timezone || 'Africa/Addis_Ababa'}</span>
                  <span>·</span>
                  <span>Currency: {account?.currency || 'USD'}</span>
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-slate-100/90 p-1 text-xs">
            <Link
              href="/merchant/settings"
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                pathname === '/merchant/settings'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </Link>
            <Link
              href="/merchant/settings/paypal"
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                pathname === '/merchant/settings/paypal'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PayPal Payouts
            </Link>
            <Link
              href="/merchant/settings/policies"
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                pathname === '/merchant/settings/policies'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Policies
            </Link>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Could not load change requests or compliance records from the server.</span>
          </div>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {/* Main Grid: PayPal Card and/or Policies Card */}
      <div className={`grid grid-cols-1 gap-6 ${mode === 'all' ? 'lg:grid-cols-2' : ''}`}>
        {/* PayPal Card */}
        {showPaypal ? (
          <div className="space-y-6">
            <Card
              padding="lg"
              className="space-y-5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center justify-between border-slate-100 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-800 border border-sky-200/80 shadow-2xs">
                    <CreditCard className="h-5 w-5 text-sky-700" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">PayPal Merchant Account</h2>
                    <p className="text-slate-500 text-xs">
                      Orders v2 direct capture disbursement connection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold text-xs capitalize ${
                      account?.status === 'approved'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : account?.status === 'pending'
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        account?.status === 'approved'
                          ? 'bg-emerald-500 animate-pulse'
                          : account?.status === 'pending'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-slate-400'
                      }`}
                    />
                    {account?.status || 'unlinked'}
                  </span>
                </div>
              </div>

              {/* Organization & Account Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Assigned Salon Entity
                  </span>
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {account?.org_name || org?.name || '—'}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ID: {account?.org_id ? account.org_id.slice(0, 13) + '…' : '—'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Disbursement Currency
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {account?.currency || 'USD'}
                    </span>
                    <span className="rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                      Direct Payout
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Bank settle via PayPal Merchant Rail
                  </span>
                </div>
              </div>

              {/* Verified Merchant ID with Copy */}
              <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/60 to-slate-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-950 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-sky-600" />
                    Verified PayPal Merchant Payer ID
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {account?.approved_at
                      ? `Verified ${new Date(account.approved_at).toLocaleDateString()}`
                      : 'Live Rail'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200/90 bg-white p-2.5 font-mono text-xs shadow-2xs">
                  <span className="font-bold text-slate-900 tracking-wide">{merchantId}</span>
                  {account?.merchant_id ? (
                    <button
                      type="button"
                      onClick={handleCopyMerchantId}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Copy Merchant ID"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[11px] text-emerald-700 font-sans font-semibold">
                            Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-sans">Copy</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                {account?.merchant_email ? (
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Account Email:</span>
                    <span className="font-medium text-slate-800">{account.merchant_email}</span>
                  </div>
                ) : null}
              </div>

              {/* Technical explainer */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-xs text-slate-600 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>How SalonDesk PayPal Authorization Holds Work</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      1. Zero-Debit Hold
                    </span>
                    <span>Client card is authorized at booking. No money charged up front.</span>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-0.5">2. Appointment</span>
                    <span>Hold remains secure until client arrives at salon for appointment.</span>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60 shadow-2xs">
                    <span className="font-bold text-slate-900 block mb-0.5">3. Payout Capture</span>
                    <span>Capture routes funds directly to your verified PayPal account.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <PrimaryButton
                  title="Request PayPal Account Change"
                  variant="outline"
                  size="sm"
                  isDisabled={submitting}
                  onClick={() => setIsPaypalOpen(true)}
                  icon={<ExternalLink className="h-3.5 w-3.5" />}
                  className="h-10 rounded-xl text-xs font-semibold"
                />
                <span className="text-[11px] text-slate-400">
                  Changes require compliance review
                </span>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Cancellation Policies Card */}
        {showPolicies ? (
          <div className="space-y-6">
            <Card
              padding="lg"
              className="space-y-5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center justify-between border-slate-100 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                    <Shield className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">
                      {activePolicy?.name || 'Standard 24h Policy'}
                    </h2>
                    <p className="text-slate-500 text-xs">
                      Enforced cancellation window &amp; no-show guarantee terms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-xs text-emerald-800 capitalize">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activePolicy?.status || 'active'}
                  </span>
                </div>
              </div>

              {/* Organization & Policy Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 rounded-xl bg-slate-50/80 p-3 border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Salon:</span>
                  <span className="font-bold text-slate-900">
                    {activePolicy?.org_name || org?.name || 'Salon'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Policy ID:</span>
                  <span className="font-mono text-slate-600">
                    {activePolicy?.id ? activePolicy.id.slice(0, 13) + '…' : '—'}
                  </span>
                </div>
                {activePolicy?.created_at ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Effective:</span>
                    <span className="text-slate-700">
                      {new Date(activePolicy.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* 4-Item Policy Rule Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-semibold">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>Free Notice</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-base">
                    ≥ {policyHours}h
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Cutoff for 100% free cancellation
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-semibold">
                    <ShieldAlert className="h-3 w-3 text-rose-500" />
                    <span>No-Show Fee</span>
                  </div>
                  <div className="font-mono font-bold text-rose-800 text-base">
                    {flatNoShowFee ? formatUsd(flatNoShowFee) : `${noShowFeePercent}%`}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Retained on unannounced missed slot
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-semibold">
                    <Sliders className="h-3 w-3 text-amber-600" />
                    <span>Late Cancel</span>
                  </div>
                  <div className="font-mono font-bold text-amber-900 text-base">
                    {lateCancelFeePercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Captured if cancelled past notice window
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-semibold">
                    <CreditCard className="h-3 w-3 text-emerald-600" />
                    <span>Hold Share</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-800 text-base">
                    {holdPercent}%
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Zero-debit hold capacity at checkout
                  </span>
                </div>
              </div>

              {/* Sample Customer Agreement Card */}
              <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-950">
                  <FileText className="h-4 w-4 text-amber-700" />
                  <span>Client Checkout Consent Agreement</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90 font-serif italic bg-white/70 p-3 rounded-lg border border-amber-200/60">
                  &ldquo;I authorize a {holdPercent}% zero-debit PayPal hold for this reservation at{' '}
                  {org?.name || activePolicy?.org_name || 'this salon'}. I understand cancellations
                  made at least {policyHours} hours prior incur no charge. Cancellations within{' '}
                  {policyHours} hours incur a {lateCancelFeePercent}% late cancellation fee. Missed
                  appointments incur a{' '}
                  {flatNoShowFee ? formatUsd(flatNoShowFee) : `${noShowFeePercent}%`} no-show fee
                  settled to the salon.&rdquo;
                </p>
              </div>

              {/* All Policies List if multiple exist */}
              {policies.length > 1 ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    All Configured Salon Policies ({policies.length})
                  </span>
                  <div className="space-y-2">
                    {policies.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{p.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">
                            {Number(p.data?.free_cancel_hours || 24)}h notice ·{' '}
                            {Number(p.data?.no_show_fee_percent || 50)}% no-show
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                            p.status?.toLowerCase() === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <PrimaryButton
                  title="Request Policy Amendment"
                  variant="outline"
                  size="sm"
                  isDisabled={submitting}
                  onClick={() => setIsPolicyOpen(true)}
                  icon={<Sliders className="h-3.5 w-3.5" />}
                  className="h-10 rounded-xl text-xs font-semibold"
                />
                <span className="text-[11px] text-slate-400">
                  Requires platform compliance review
                </span>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Change Request History Section */}
      <Card
        padding="lg"
        className="space-y-4 rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-slate-100 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">Change Request History</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                {filteredChangeRequests.length}
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Audit trail of proposed payout destinations and cancellation term amendments
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-slate-100 p-1 text-xs">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setRequestFilter(filter)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors capitalize ${
                  requestFilter === filter
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar if multiple items */}
        {changeRequests.length > 3 ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search change requests by ID, submitter, or review notes…"
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        ) : null}

        {/* List of Change Requests */}
        <div className="space-y-3">
          {filteredChangeRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <FileText className="h-5 w-5" />
              </div>
              <p className="font-medium text-slate-600">No change requests found</p>
              <p className="text-[11px] text-slate-400">
                {requestFilter !== 'ALL'
                  ? `No requests match the "${requestFilter.toLowerCase()}" filter.`
                  : 'You have not submitted any PayPal or Policy amendment requests.'}
              </p>
            </div>
          ) : (
            filteredChangeRequests.map((cr) => (
              <ChangeRequestItemCard key={cr.id} cr={cr} defaultOrgName={org?.name} />
            ))
          )}
        </div>
      </Card>

      {/* Upgraded Modals */}
      <PaypalChangeModal
        open={isPaypalOpen}
        currentMerchantId={merchantId}
        currentEmail={account?.merchant_email}
        currentDisplayName={account?.display_name || org?.name}
        isLoading={submitting}
        onClose={() => setIsPaypalOpen(false)}
        onSubmit={handleSubmitPaypal}
      />

      <PolicyChangeModal
        open={isPolicyOpen}
        initialName={activePolicy?.name}
        policyHours={policyHours}
        noShowFeePercent={noShowFeePercent}
        lateCancelFeePercent={lateCancelFeePercent}
        holdPercent={holdPercent}
        isLoading={submitting}
        onClose={() => setIsPolicyOpen(false)}
        onSubmit={handleSubmitPolicy}
      />
    </div>
  )
}

function ChangeRequestItemCard({
  cr,
  defaultOrgName,
}: {
  cr: ApiChangeRequest
  defaultOrgName?: string
}) {
  const isPaypal = cr.request_type === 'PAYPAL_ACCOUNT'
  const isPolicy = cr.request_type === 'CANCELLATION_POLICY'
  const payload = (cr.payload_json || {}) as Record<string, unknown>
  const snapshot = (cr.current_snapshot_json || {}) as Record<string, unknown>

  const status = (cr.status || 'PENDING').toUpperCase()

  const orgName = cr.org_name || defaultOrgName || (payload.org_name as string) || 'Salon'
  const submitterName = cr.submitter_name || 'Salon Staff'

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 text-xs transition-colors hover:bg-white hover:border-slate-300 space-y-3 shadow-2xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {isPaypal
                ? 'PayPal Payout Destination Change'
                : isPolicy
                  ? 'Cancellation Policy Amendment'
                  : cr.request_type}
            </span>
            <span className="rounded-md bg-slate-200/70 text-slate-700 px-2 py-0.5 font-mono text-[10px] font-semibold">
              Req ID: {cr.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">{orgName}</span>
            <span>·</span>
            <span>Submitted by {submitterName}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {new Date(cr.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="self-start sm:self-auto">
          {status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-xs text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Approved &amp; Active
            </span>
          ) : status === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 font-semibold text-xs text-rose-800">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              Declined by Platform
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-semibold text-xs text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Pending Compliance Review
            </span>
          )}
        </div>
      </div>

      {/* Meaningful Before & After Snapshot Comparison */}
      {isPolicy ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 space-y-2">
          <span className="font-semibold text-amber-950 text-[10px] uppercase tracking-wider block">
            Terms Comparison Snapshot
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-md bg-white/80 p-2 border border-slate-200/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                Previous Enforced Rules
              </span>
              <div className="space-y-0.5 text-slate-700 text-xs">
                <div>
                  Notice Cutoff:{' '}
                  <span className="font-bold text-slate-900">
                    {Number(
                      (snapshot.data as Record<string, unknown>)?.free_cancel_hours ??
                        (snapshot.data as Record<string, unknown>)?.policyHours ??
                        24,
                    )}
                    h
                  </span>
                </div>
                <div>
                  No-Show Penalty:{' '}
                  <span className="font-bold text-slate-900">
                    {Number(
                      (snapshot.data as Record<string, unknown>)?.no_show_fee_percent ??
                        (snapshot.data as Record<string, unknown>)?.noShowFeePercent ??
                        50,
                    )}
                    %
                  </span>
                </div>
                <div>
                  Late Cancel:{' '}
                  <span className="font-bold text-slate-900">
                    {Number(
                      (snapshot.data as Record<string, unknown>)?.late_cancel_fee_percent ??
                        (snapshot.data as Record<string, unknown>)?.lateCancelFeePercent ??
                        25,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-white/90 p-2 border border-amber-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] text-amber-800 font-semibold block uppercase flex items-center gap-1">
                <span>Proposed Amendment</span>
                <ArrowRight className="h-3 w-3 text-amber-600" />
              </span>
              <div className="space-y-0.5 text-slate-800 text-xs">
                <div>
                  Notice Cutoff:{' '}
                  <span className="font-bold text-amber-900">
                    {Number(
                      (payload.data as Record<string, unknown>)?.free_cancel_hours ??
                        payload.policyHours ??
                        24,
                    )}
                    h
                  </span>
                </div>
                <div>
                  No-Show Penalty:{' '}
                  <span className="font-bold text-rose-800">
                    {Number(
                      (payload.data as Record<string, unknown>)?.no_show_fee_percent ??
                        payload.noShowFeePercent ??
                        50,
                    )}
                    %
                  </span>
                </div>
                <div>
                  Late Cancel:{' '}
                  <span className="font-bold text-amber-900">
                    {Number(
                      (payload.data as Record<string, unknown>)?.late_cancel_fee_percent ??
                        payload.lateCancelFeePercent ??
                        25,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isPaypal ? (
        <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 space-y-2">
          <span className="font-semibold text-sky-950 text-[10px] uppercase tracking-wider block">
            Payout Destination Transition
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono">
            <div className="rounded-md bg-white/80 p-2 border border-slate-200/60 flex-1">
              <span className="text-[10px] text-slate-400 font-sans font-semibold block uppercase">
                Previous Merchant ID
              </span>
              <span className="font-bold text-slate-800">
                {(snapshot.merchant_id as string) || 'None (Initial Setup)'}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-sky-600 self-center hidden sm:block shrink-0" />
            <div className="rounded-md bg-white/90 p-2 border border-sky-200/80 flex-1 shadow-2xs">
              <span className="text-[10px] text-sky-800 font-sans font-semibold block uppercase">
                Proposed Merchant ID
              </span>
              <span className="font-bold text-sky-950">
                {(payload.merchant_id as string) || '—'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Review Notes (if provided by admin) */}
      {cr.review_notes ? (
        <div className="flex items-start gap-2 rounded-lg bg-slate-100/80 p-2.5 text-[11px] text-slate-700">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900">Platform Review Notes:</span>
            <p className="text-slate-600 leading-relaxed">{cr.review_notes}</p>
            {cr.reviewed_at ? (
              <span className="text-[10px] text-slate-400 block pt-0.5">
                Reviewed on {new Date(cr.reviewed_at).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
