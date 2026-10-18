'use client'

import { AlertCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { toastColor } from '@/constant/toast-color'
import {
  useCreateMyChangeRequestMutation,
  useGetMyCancellationPoliciesQuery,
  useGetMyChangeRequestsQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgSettingsQuery,
} from '@/store/api/orgApi'

import { type ChangeRequestFilter, ChangeRequestHistory } from './change-request-history'
import { MerchantFinanceHeader } from './merchant-finance-header'
import { MerchantPaypalCard } from './merchant-paypal-card'
import { MerchantPolicyCard } from './merchant-policy-card'
import { PaypalChangeModal, PolicyChangeModal } from './settings-modals'

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
  const [requestFilter, setRequestFilter] = useState<ChangeRequestFilter>('ALL')
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
      <MerchantFinanceHeader
        mode={mode}
        pathname={pathname}
        orgName={org?.name}
        activePolicyOrgName={activePolicy?.org_name}
        timezone={settings?.timezone}
        currency={account?.currency}
        isLoading={isLoading}
      />

      {isError ? (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
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
        {showPaypal ? (
          <MerchantPaypalCard
            account={account}
            orgName={org?.name}
            merchantId={merchantId}
            copied={copied}
            submitting={submitting}
            onCopyMerchantId={handleCopyMerchantId}
            onRequestChange={() => setIsPaypalOpen(true)}
          />
        ) : null}

        {showPolicies ? (
          <MerchantPolicyCard
            policies={policies}
            activePolicy={activePolicy}
            orgName={org?.name}
            policyHours={policyHours}
            noShowFeePercent={noShowFeePercent}
            lateCancelFeePercent={lateCancelFeePercent}
            holdPercent={holdPercent}
            flatNoShowFee={flatNoShowFee}
            submitting={submitting}
            onRequestChange={() => setIsPolicyOpen(true)}
          />
        ) : null}
      </div>

      {/* Change Request History Section */}
      <ChangeRequestHistory
        changeRequests={changeRequests}
        filteredChangeRequests={filteredChangeRequests}
        requestFilter={requestFilter}
        searchQuery={searchQuery}
        defaultOrgName={org?.name}
        onFilterChange={setRequestFilter}
        onSearchChange={setSearchQuery}
      />

      {/* Modals */}
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
