"use client";

import {
  Button,
  ChangeRequestStatusBadge,
  SegmentedControl,
} from "@/components/ui";
import type { ChangeRequest } from "@/types";
import type { CrSubTab } from "../_libs/admin-shared";

interface RequestsTabProps {
  changeRequests: ChangeRequest[];
  subTab: CrSubTab;
  onSubTabChange: (tab: CrSubTab) => void;
  onApprove: (cr: ChangeRequest) => void;
  onReject: (cr: ChangeRequest) => void;
}

export function RequestsTab({
  changeRequests,
  subTab,
  onSubTabChange,
  onApprove,
  onReject,
}: RequestsTabProps) {
  const policyCount = changeRequests.filter(
    (r) => r.type === "CANCELLATION_POLICY",
  ).length;
  const paypalCount = changeRequests.filter(
    (r) => r.type === "PAYPAL_ACCOUNT",
  ).length;

  const filtered = changeRequests.filter((r) =>
    subTab === "POLICY"
      ? r.type === "CANCELLATION_POLICY"
      : r.type === "PAYPAL_ACCOUNT",
  );

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-200 fade-in">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold text-slate-900 text-xl">
            Merchant Change Request Queue
          </h2>
          <p className="text-slate-600 text-xs">
            Review side-by-side diffs for PayPal sandbox merchant account
            transitions and cancellation policy updates.
          </p>
        </div>

        <SegmentedControl
          variant="pills"
          value={subTab}
          onChange={onSubTabChange}
          options={[
            {
              value: "POLICY" as const,
              label: `Cancellation Policy Diffs (${policyCount})`,
            },
            {
              value: "PAYPAL" as const,
              label: `PayPal Merchant ID Changes (${paypalCount})`,
            },
          ]}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((cr) => {
          const isPending = cr.status === "PENDING_REVIEW";
          const isRejected = cr.status === "REJECTED";

          return (
            <div
              key={cr.id}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-amber-700 text-xs">
                      {cr.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-base text-slate-900">
                      {cr.salonName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Submitted: {cr.submittedAt} · Type:{" "}
                    {cr.type === "PAYPAL_ACCOUNT"
                      ? "PayPal Merchant ID Change"
                      : "Cancellation Policy Adjustment"}
                  </div>
                </div>

                <ChangeRequestStatusBadge status={cr.status} />
              </div>

              {cr.type === "CANCELLATION_POLICY" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                    <span className="block font-bold text-[10px] text-slate-500 uppercase">
                      Current Active Policy
                    </span>
                    <div className="text-slate-700">
                      Free Cancel Window:{" "}
                      <strong className="text-slate-900">
                        {cr.currentData.policyHours} hours
                      </strong>
                    </div>
                    <div className="text-slate-700">
                      No-Show Fee:{" "}
                      <strong className="text-slate-900">
                        ${cr.currentData.noShowFee}.00
                      </strong>
                    </div>
                    <div className="text-slate-700">
                      Deposit Hold:{" "}
                      <strong className="text-slate-900">
                        {cr.currentData.holdPercent}% of ticket
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
                    <span className="block font-bold text-[10px] text-amber-800 uppercase">
                      Proposed Requested Policy (Diff)
                    </span>
                    <div className="text-slate-800">
                      Free Cancel Window:{" "}
                      <strong className="font-bold text-amber-800">
                        {cr.proposedData.policyHours} hours
                      </strong>
                    </div>
                    <div className="text-slate-800">
                      No-Show Fee:{" "}
                      <strong className="font-bold text-amber-800">
                        ${cr.proposedData.noShowFee}.00
                      </strong>
                    </div>
                    <div className="text-slate-800">
                      Deposit Hold:{" "}
                      <strong className="font-bold text-amber-800">
                        {cr.proposedData.holdPercent}% of ticket
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 font-mono text-xs md:grid-cols-2">
                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <span className="block font-bold font-sans text-[10px] text-slate-500 uppercase">
                      Current PayPal Merchant ID
                    </span>
                    <div className="truncate text-slate-800">
                      {cr.currentData.paypalMerchantId}
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <span className="block font-bold font-sans text-[10px] text-amber-800 uppercase">
                      Proposed PayPal Merchant ID
                    </span>
                    <div className="truncate font-bold text-amber-800">
                      {cr.proposedData.paypalMerchantId}
                    </div>
                  </div>
                </div>
              )}

              {isRejected && cr.rejectionReason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-800 text-xs">
                  <strong>Rejection Reason:</strong> {cr.rejectionReason}
                </div>
              )}

              {isPending && (
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="danger" onClick={() => onReject(cr)}>
                    Reject Request
                  </Button>
                  <Button variant="success" onClick={() => onApprove(cr)}>
                    Approve Change &amp; Update Record →
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
