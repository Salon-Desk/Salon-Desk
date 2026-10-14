"use client";

import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import {
  Button,
  ChangeRequestStatusBadge,
  SegmentedControl,
} from "@/components/ui";
import { useAdminContext } from "../_context/admin-context";

export default function AdminRequestsPage() {
  const {
    state,
    crSubTab,
    setCrSubTab,
    handleApproveChangeRequest,
    setRejectingCr,
  } = useAdminContext();

  const policyCount = state.changeRequests.filter(
    (r) => r.type === "CANCELLATION_POLICY",
  ).length;
  const paypalCount = state.changeRequests.filter(
    (r) => r.type === "PAYPAL_ACCOUNT",
  ).length;

  const filtered = state.changeRequests.filter((r) =>
    crSubTab === "POLICY"
      ? r.type === "CANCELLATION_POLICY"
      : r.type === "PAYPAL_ACCOUNT",
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Approvals &amp; Change Requests
          </h1>
          <p className="text-slate-500 text-xs">
            Merchant cancellation policy and PayPal wallet transitions.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div>
          <SegmentedControl
            variant="pills"
            value={crSubTab}
            onChange={setCrSubTab}
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
      </div>

      {/* Requests List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/90 bg-white px-6 py-16 text-center text-slate-400 text-xs shadow-xs">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-900 text-sm">
              All Caught Up
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              No pending requests in this queue.
            </p>
          </div>
        ) : null}

        {filtered.map((cr) => {
          const isPending = cr.status === "PENDING_REVIEW";
          const isRejected = cr.status === "REJECTED";

          return (
            <div
              key={cr.id}
              className="space-y-3.5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3 border-slate-100 border-b pb-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-700 text-xs">
                      {cr.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {cr.salonName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Submitted {cr.submittedAt}
                  </div>
                </div>

                <ChangeRequestStatusBadge status={cr.status} />
              </div>

              {cr.type === "CANCELLATION_POLICY" ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5 text-xs">
                    <span className="block font-medium text-[10px] text-slate-400 uppercase tracking-wider">
                      Current Policy
                    </span>
                    <div className="space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Notice window:</span>
                        <strong className="text-slate-900">
                          {cr.currentData.policyHours}h
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>No-show fee:</span>
                        <strong className="text-slate-900">
                          ${cr.currentData.noShowFee}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs">
                    <span className="flex items-center gap-1 font-medium text-[10px] text-amber-900 uppercase tracking-wider">
                      <span>Proposed Policy</span>
                      <ArrowRight className="h-3 w-3 text-amber-600" />
                    </span>
                    <div className="space-y-1 text-slate-900">
                      <div className="flex justify-between">
                        <span className="text-amber-800">Notice window:</span>
                        <strong className="text-amber-950 font-bold">
                          {cr.proposedData.policyHours}h
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-800">No-show fee:</span>
                        <strong className="text-amber-950 font-bold">
                          ${cr.proposedData.noShowFee}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 font-mono text-xs md:grid-cols-2">
                  <div className="space-y-1 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5">
                    <span className="block font-sans font-medium text-[10px] text-slate-400 uppercase tracking-wider">
                      Current PayPal ID
                    </span>
                    <div className="truncate text-slate-900 font-bold text-xs">
                      {cr.currentData.paypalMerchantId}
                    </div>
                  </div>

                  <div className="space-y-1 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5">
                    <span className="flex items-center gap-1 font-sans font-medium text-[10px] text-amber-900 uppercase tracking-wider">
                      <span>Proposed PayPal ID</span>
                      <ArrowRight className="h-3 w-3 text-amber-600" />
                    </span>
                    <div className="truncate font-bold text-amber-950 text-xs">
                      {cr.proposedData.paypalMerchantId}
                    </div>
                  </div>
                </div>
              )}

              {isRejected && cr.rejectionReason ? (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-900 text-xs">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <div>
                    <strong>Reason:</strong> {cr.rejectionReason}
                  </div>
                </div>
              ) : null}

              {isPending ? (
                <div className="flex items-center justify-end gap-2 pt-2 border-slate-100 border-t">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setRejectingCr(cr)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApproveChangeRequest(cr)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium shadow-xs"
                  >
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
