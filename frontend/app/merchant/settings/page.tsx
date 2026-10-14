"use client";

import {
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { formatUsd } from "@/lib/format";
import { useMerchantContext } from "../_context/merchant-context";

export default function MerchantSettingsPage() {
  const { state, openChangePaypal, openChangePolicy } = useMerchantContext();

  const [copied, setCopied] = useState(false);

  const handleCopyMerchantId = () => {
    navigator.clipboard.writeText(state.salon.paypalMerchantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
          Settings &amp; Policies
        </h1>
        <p className="text-slate-500 text-xs">
          PayPal merchant credentials, cancellation terms, and compliance
          requests.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PayPal Credentials Card */}
        <Card
          padding="lg"
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
        >
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80">
                <CreditCard className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  PayPal Account
                </h2>
                <span className="text-slate-500 text-[11px]">
                  Direct Payouts
                </span>
              </div>
            </div>
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-medium text-[10px] text-emerald-800">
              Verified
            </span>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="font-sans text-slate-500">Merchant ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">
                  {state.salon.paypalMerchantId}
                </span>
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
              </div>
            </div>
            <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
              <span className="font-sans text-slate-500">API Protocol:</span>
              <span className="text-slate-700 font-sans font-medium text-xs">
                PayPal Orders v2
              </span>
            </div>
            <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
              <span className="font-sans text-slate-500">Take-Rate:</span>
              <span className="font-bold text-slate-900">
                {state.salon.commissionRate}% VIP Rate
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={openChangePaypal}
            className="rounded-xl py-2 font-medium text-xs"
          >
            <span>Request PayPal ID Change</span>
            <ExternalLink className="h-3.5 w-3.5 ml-1 text-slate-400" />
          </Button>
        </Card>

        {/* Cancellation Policy Rules Card */}
        <Card
          padding="lg"
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
        >
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80">
                <Clock className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Cancellation Policy
                </h2>
                <span className="text-slate-500 text-[11px]">
                  Enforced on PayPal
                </span>
              </div>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-medium text-[10px] text-slate-700">
              Active Rule
            </span>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Free Notice Cutoff:</span>
              <span className="font-bold text-slate-900 font-mono">
                ≥ {state.salon.cancellationPolicyHours} hours
              </span>
            </div>
            <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
              <span className="text-slate-500">Standard No-Show Fee:</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatUsd(state.salon.defaultNoShowFee)}
              </span>
            </div>
            <div className="flex justify-between items-center border-slate-200/60 border-t pt-2">
              <span className="text-slate-500">Authorization Model:</span>
              <span className="font-medium text-emerald-700">
                Non-Debit Pre-Auth
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={openChangePolicy}
            className="rounded-xl py-2 font-medium text-xs"
          >
            <span>Request Policy Amendment</span>
            <Sliders className="h-3.5 w-3.5 ml-1 text-slate-400" />
          </Button>
        </Card>
      </div>

      {/* Submitted Change Requests Audit Queue */}
      <Card
        padding="lg"
        className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
      >
        <div className="flex items-center justify-between border-slate-100 border-b pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Change Request History
            </h2>
            <p className="text-slate-500 text-xs">
              Platform operator compliance reviews
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
            {state.changeRequests.length} requests
          </span>
        </div>

        <div className="space-y-2.5">
          {state.changeRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No change requests on record.
            </div>
          ) : (
            state.changeRequests.map((cr) => (
              <div
                key={cr.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs transition-colors hover:bg-white sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-800">
                      {cr.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-medium text-slate-900">
                      {cr.type === "PAYPAL_ACCOUNT"
                        ? "PayPal Account Transition"
                        : "Cancellation Policy Modification"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Submitted {cr.submittedAt}
                  </div>
                </div>

                <span className="self-start sm:self-auto rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-medium text-[10px] text-amber-900">
                  {cr.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
