"use client";

import {
  Button,
  ChangeRequestStatusBadge,
  SegmentedControl,
} from "@/components/ui";
import type { ChangeRequest } from "@/types";
import type { CrSubTab } from "../_types/admin-types";

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
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-200">
      <div className="flex justify-end">
        <SegmentedControl
          variant="pills"
          value={subTab}
          onChange={onSubTabChange}
          options={[
            {
              value: "POLICY" as const,
              label: `Policy (${policyCount})`,
            },
            {
              value: "PAYPAL" as const,
              label: `PayPal (${paypalCount})`,
            },
          ]}
        />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 text-sm">
            No requests in this queue.
          </div>
        ) : null}

        {filtered.map((cr) => {
          const isPending = cr.status === "PENDING_REVIEW";
          const isRejected = cr.status === "REJECTED";

          return (
            <div
              key={cr.id}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold font-mono text-amber-700 text-xs">
                      {cr.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {cr.salonName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {cr.submittedAt}
                  </div>
                </div>

                <ChangeRequestStatusBadge status={cr.status} />
              </div>

              {cr.type === "CANCELLATION_POLICY" ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                    <span className="block font-bold text-[10px] text-slate-500 uppercase">
                      Current
                    </span>
                    <div className="text-slate-700">
                      Cancel window:{" "}
                      <strong>{cr.currentData.policyHours}h</strong>
                    </div>
                    <div className="text-slate-700">
                      No-show:{" "}
                      <strong>${cr.currentData.noShowFee}.00</strong>
                    </div>
                    <div className="text-slate-700">
                      Hold: <strong>{cr.currentData.holdPercent}%</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
                    <span className="block font-bold text-[10px] text-amber-800 uppercase">
                      Proposed
                    </span>
                    <div className="text-slate-800">
                      Cancel window:{" "}
                      <strong className="text-amber-800">
                        {cr.proposedData.policyHours}h
                      </strong>
                    </div>
                    <div className="text-slate-800">
                      No-show:{" "}
                      <strong className="text-amber-800">
                        ${cr.proposedData.noShowFee}.00
                      </strong>
                    </div>
                    <div className="text-slate-800">
                      Hold:{" "}
                      <strong className="text-amber-800">
                        {cr.proposedData.holdPercent}%
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 font-mono text-xs md:grid-cols-2">
                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <span className="block font-bold font-sans text-[10px] text-slate-500 uppercase">
                      Current
                    </span>
                    <div className="truncate text-slate-800">
                      {cr.currentData.paypalMerchantId}
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <span className="block font-bold font-sans text-[10px] text-amber-800 uppercase">
                      Proposed
                    </span>
                    <div className="truncate font-bold text-amber-800">
                      {cr.proposedData.paypalMerchantId}
                    </div>
                  </div>
                </div>
              )}

              {isRejected && cr.rejectionReason ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-800 text-xs">
                  <strong>Rejected:</strong> {cr.rejectionReason}
                </div>
              ) : null}

              {isPending ? (
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <Button variant="danger" onClick={() => onReject(cr)}>
                    Reject
                  </Button>
                  <Button variant="success" onClick={() => onApprove(cr)}>
                    Approve
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
