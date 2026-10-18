'use client'

import { CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Loader2, Sliders } from 'lucide-react'
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
} from '@/store/slice/organizationApi'

import { PaypalChangeModal, PolicyChangeModal } from '../_components/settings-modals'

export type MerchantFinanceSettingsMode = 'all' | 'paypal' | 'policies'

interface MerchantFinanceSettingsProps {
  mode?: MerchantFinanceSettingsMode
}

export function MerchantFinanceSettings({ mode = 'all' }: MerchantFinanceSettingsProps) {
  const showPaypal = mode === 'all' || mode === 'paypal'
  const showPolicies = mode === 'all' || mode === 'policies'
  const { data: org, isLoading: orgLoading } = useGetMyOrganizationQuery()
  const { data: account, isLoading: accountLoading } = useGetMyOrgAccountQuery()
  const { data: settings } = useGetMyOrgSettingsQuery()
  const { data: policies = [] } = useGetMyCancellationPoliciesQuery()
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

  const activePolicy = useMemo(
    () => policies.find((p) => p.status?.toLowerCase() === 'active') || policies[0],
    [policies],
  )

  const policyHours = Number(
    (activePolicy?.data?.free_cancel_hours as number | undefined) ??
      (activePolicy?.data?.policyHours as number | undefined) ??
      24,
  )
  const noShowFee = Number(
    (activePolicy?.data?.no_show_fee as number | undefined) ??
      (activePolicy?.data?.noShowFee as number | undefined) ??
      30,
  )

  const merchantId = account?.merchant_id || '—'
  const isLoading = orgLoading || accountLoading || crLoading

  const handleCopyMerchantId = () => {
    if (!account?.merchant_id) return
    void navigator.clipboard.writeText(account.merchant_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitPaypal = async (nextMerchantId: string) => {
    try {
      await createChangeRequest({
        request_type: 'PAYPAL_ACCOUNT',
        payload_json: {
          merchant_id: nextMerchantId,
          display_name: org?.name || nextMerchantId,
          currency: account?.currency || 'USD',
        },
        current_snapshot_json: {
          merchant_id: account?.merchant_id || null,
          merchant_email: account?.merchant_email || null,
          status: account?.status || null,
        },
      }).unwrap()
      toast.success('PayPal change request submitted', toastColor.success)
      setIsPaypalOpen(false)
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not submit request'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleSubmitPolicy = async (next: { policyHours: number; noShowFee: number }) => {
    try {
      await createChangeRequest({
        request_type: 'CANCELLATION_POLICY',
        payload_json: {
          name: activePolicy?.name || 'Updated policy',
          policy_id: activePolicy?.id,
          data: {
            free_cancel_hours: next.policyHours,
            no_show_fee: next.noShowFee,
            hold_percent: 100,
          },
        },
        current_snapshot_json: {
          policy_id: activePolicy?.id || null,
          name: activePolicy?.name || null,
          data: activePolicy?.data || {},
        },
      }).unwrap()
      toast.success('Policy amendment submitted', toastColor.success)
      setIsPolicyOpen(false)
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not submit request'
      toast.error(String(message), toastColor.error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
          {mode === 'paypal'
            ? 'PayPal account'
            : mode === 'policies'
              ? 'Cancellation policies'
              : 'Finance & compliance'}
        </h1>
        <p className="text-slate-500 text-xs">
          {isLoading
            ? 'Loading…'
            : `${org?.name || 'Organization'} · ${settings?.timezone || 'UTC'}`}
        </p>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <p>Could not load change requests.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading settings…
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {showPaypal ? (
          <Card
            padding="lg"
            className="space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center justify-between border-slate-100 border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80">
                  <CreditCard className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">PayPal Account</h2>
                  <span className="text-slate-500 text-[11px]">Direct Payouts</span>
                </div>
              </div>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-medium text-[10px] text-emerald-800 capitalize">
                {account?.status || 'unlinked'}
              </span>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="font-sans text-slate-500">Merchant ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{merchantId}</span>
                  {account?.merchant_id ? (
                    <button
                      type="button"
                      onClick={handleCopyMerchantId}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy Merchant ID"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
                <span className="font-sans text-slate-500">Currency:</span>
                <span className="text-slate-700 font-sans font-medium text-xs">
                  {account?.currency || 'USD'}
                </span>
              </div>
              <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
                <span className="font-sans text-slate-500">Display name:</span>
                <span className="font-bold text-slate-900 font-sans">
                  {account?.display_name || org?.name || '—'}
                </span>
              </div>
            </div>

            <PrimaryButton
              title="Request PayPal ID Change"
              variant="outline"
              size="sm"
              isDisabled={submitting}
              onClick={() => setIsPaypalOpen(true)}
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              className="h-9 rounded-lg text-xs"
            />
          </Card>
        ) : null}

        {showPolicies ? (
          <Card
            padding="lg"
            className="space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center justify-between border-slate-100 border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80">
                  <Clock className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Cancellation Policy</h2>
                  <span className="text-slate-500 text-[11px]">
                    {activePolicy?.name || 'Default policy'}
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-medium text-[10px] text-slate-700 capitalize">
                {activePolicy?.status || 'none'}
              </span>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Free Notice Cutoff:</span>
                <span className="font-bold text-slate-900 font-mono">≥ {policyHours} hours</span>
              </div>
              <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
                <span className="text-slate-500">Standard No-Show Fee:</span>
                <span className="font-bold text-slate-900 font-mono">{formatUsd(noShowFee)}</span>
              </div>
              <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
                <span className="text-slate-500">Address:</span>
                <span className="font-medium text-slate-700 truncate max-w-[60%] text-right">
                  {settings?.physical_address || '—'}
                </span>
              </div>
            </div>

            <PrimaryButton
              title="Request Policy Amendment"
              variant="outline"
              size="sm"
              isDisabled={submitting}
              onClick={() => setIsPolicyOpen(true)}
              icon={<Sliders className="h-3.5 w-3.5" />}
              className="h-9 rounded-lg text-xs"
            />
          </Card>
        ) : null}
      </div>

      <Card
        padding="lg"
        className="space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-center justify-between border-slate-100 border-b pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Change Request History</h2>
            <p className="text-slate-500 text-xs">Platform operator compliance reviews</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
            {changeRequests.length} requests
          </span>
        </div>

        <div className="space-y-2">
          {changeRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No change requests on record.
            </div>
          ) : (
            changeRequests
              .filter((cr) =>
                mode === 'paypal'
                  ? cr.request_type === 'PAYPAL_ACCOUNT'
                  : mode === 'policies'
                    ? cr.request_type === 'CANCELLATION_POLICY'
                    : true,
              )
              .map((cr) => (
                <div
                  key={cr.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 text-xs transition-colors hover:bg-white sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-800">
                        {cr.id.slice(0, 8)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-900">
                        {cr.request_type === 'PAYPAL_ACCOUNT'
                          ? 'PayPal Account Transition'
                          : 'Cancellation Policy Modification'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Submitted {new Date(cr.created_at).toLocaleString()}
                    </div>
                  </div>

                  <span className="self-start sm:self-auto rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-medium text-[10px] text-amber-900 capitalize">
                    {cr.status.replaceAll('_', ' ').toLowerCase()}
                  </span>
                </div>
              ))
          )}
        </div>
      </Card>

      <PaypalChangeModal
        open={isPaypalOpen}
        currentMerchantId={merchantId}
        isLoading={submitting}
        onClose={() => setIsPaypalOpen(false)}
        onSubmit={handleSubmitPaypal}
      />

      <PolicyChangeModal
        open={isPolicyOpen}
        policyHours={policyHours}
        noShowFee={noShowFee}
        isLoading={submitting}
        onClose={() => setIsPolicyOpen(false)}
        onSubmit={handleSubmitPolicy}
      />
    </div>
  )
}
