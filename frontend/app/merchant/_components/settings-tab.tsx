"use client";

import { Clock, CreditCard, ExternalLink, Sliders } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { MerchantSalonInfo } from "@/lib/data/merchant";
import { formatUsd } from "@/lib/format";
import type { ChangeRequest } from "@/types";

interface SettingsTabProps {
  salon: MerchantSalonInfo;
  changeRequests: ChangeRequest[];
  onRequestPaypalChange: () => void;
  onRequestPolicyChange: () => void;
}

export function SettingsTab({
  salon,
  changeRequests,
  onRequestPaypalChange,
  onRequestPolicyChange,
}: SettingsTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="font-bold text-slate-900 text-xl">
          PayPal Account &amp; Cancellation Settings
        </h2>
        <p className="text-slate-600 text-xs">
          Manage payout credentials and submit formal policy amendment requests
          to the Platform Operator.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                PayPal Merchant Credentials
              </h3>
            </div>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-800">
              VERIFIED_ACTIVE
            </span>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            Client authorization holds and captured deposits route directly to
            your connected PayPal business wallet.
          </p>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">
                Merchant Account ID:
              </span>
              <span className="font-bold text-slate-900">
                {salon.paypalMerchantId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">
                API Gateway Version:
              </span>
              <span className="text-slate-700">
                PayPal Orders v2 (intent: AUTHORIZE)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Commission Tier:</span>
              <span className="font-bold text-amber-800">
                {salon.commissionRate}% VIP Partner
              </span>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={onRequestPaypalChange}>
            Submit Change Request for PayPal ID
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Default Cancellation Policy
              </h3>
            </div>
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold text-[10px] text-amber-800">
              ENFORCED ON PAYPAL
            </span>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            Clients are guaranteed 100% free cancellation if cancelled prior to
            the cutoff window. After cutoff, no-show fees are captured.
          </p>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Free Notice Window:</span>
              <span className="font-bold text-slate-900">
                ≥ {salon.cancellationPolicyHours} hours prior
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Default No-Show Fee:</span>
              <span className="font-bold text-rose-700">
                {formatUsd(salon.defaultNoShowFee)} USD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hold Policy:</span>
              <span className="font-semibold text-emerald-700">
                100% non-debit authorization
              </span>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={onRequestPolicyChange}>
            Propose Cancellation Policy Amendment
            <Sliders className="h-3.5 w-3.5" />
          </Button>
        </Card>
      </div>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Submitted Change Requests (Admin Review Queue)
          </h3>
          <span className="text-slate-500 text-xs">
            Requires Platform Operator Verification
          </span>
        </div>

        <div className="space-y-3">
          {changeRequests.map((cr) => (
            <div
              key={cr.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-amber-700">
                    {cr.id}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-bold text-slate-900">
                    {cr.type === "PAYPAL_ACCOUNT"
                      ? "PayPal Account ID Transition"
                      : "Cancellation Policy Adjustment"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Submitted {cr.submittedAt} · Status:{" "}
                  <span className="font-bold text-amber-800">
                    {cr.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <span className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 font-bold text-[10px] text-amber-800 uppercase tracking-wider">
                Under Admin Review
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
