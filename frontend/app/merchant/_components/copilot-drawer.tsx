"use client";

import { Bot, Check, Send } from "lucide-react";
import { useState } from "react";
import { Button, Drawer } from "@/components/ui";
import type { Booking } from "@/types";

export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  hasProposal?: boolean;
  proposalData?: RefundProposal;
}

export interface RefundProposal {
  bookingId: string;
  clientName: string;
  refundAmount: number;
  reason: string;
}

interface CopilotDrawerProps {
  bookings: Booking[];
  onClose: () => void;
  onExecuteRefund: (proposal: RefundProposal) => string;
}

const INITIAL_MESSAGE: CopilotMessage = {
  role: "assistant",
  content:
    "👋 Hello Selamawit! I am your Salon AI Assistant powered by PayPal Agent Toolkit 1.11.0.\n\nI can verify client authorization holds, query appointment breakdowns, or propose goodwill partial refunds for emergencies.",
};

export function CopilotDrawer({
  bookings,
  onClose,
  onExecuteRefund,
}: CopilotDrawerProps) {
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotChat, setCopilotChat] = useState<CopilotMessage[]>([
    INITIAL_MESSAGE,
  ]);

  const handleCopilotSend = (prefilledText?: string) => {
    const text = prefilledText || copilotQuery;
    if (!text.trim()) return;

    const userMsg: CopilotMessage = { role: "user", content: text };
    setCopilotChat((prev) => [...prev, userMsg]);
    setCopilotQuery("");

    const lower = text.toLowerCase();

    if (lower.includes("hana") || lower.includes("status of hana")) {
      const hanaBooking = bookings.find((b) =>
        b.clientName.toLowerCase().includes("hana"),
      );
      const response = hanaBooking
        ? `⚡ [toolkit.get_authorization("${hanaBooking.paypalAuthId}")]\n` +
          `Hana Bekele has an active authorization hold for $${hanaBooking.holdAmount}.00 for "${hanaBooking.serviceName}" scheduled for ${hanaBooking.appointmentTime}.\n` +
          `• Status: HELD (Intent: AUTHORIZE)\n` +
          `• Honor Period: ${hanaBooking.honorPeriodEndsInHours || 38} hours remaining\n` +
          `• $0.00 debited from client account today\n` +
          `• Stylist: ${hanaBooking.stylistName}`
        : "Could not find an active booking for Hana.";

      setCopilotChat((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
      return;
    }

    if (
      lower.includes("summarize") ||
      lower.includes("hold volume") ||
      lower.includes("transactions")
    ) {
      const activeHolds = bookings.filter(
        (b) => b.status === "HELD" || b.status === "REAUTHORIZED",
      );
      const totalProtected = activeHolds.reduce(
        (acc, b) => acc + b.holdAmount,
        0,
      );
      const captured = bookings.filter((b) => b.status === "CAPTURED");
      const totalCaptured = captured.reduce(
        (acc, b) => acc + b.servicePrice,
        0,
      );

      const response =
        `⚡ [toolkit.list_transactions & get_portfolio_summary]\n` +
        `• Active Protected Holds: ${activeHolds.length} bookings ($${totalProtected}.00 reserved on PayPal)\n` +
        `• Settled Revenue Today: $${totalCaptured}.00\n` +
        `• No-Show Protected Recoveries: $30.00 captured with zero chargebacks\n` +
        `• Next upcoming appointment: Hana Bekele (Today at 10:00 AM)`;

      setCopilotChat((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
      return;
    }

    if (
      lower.includes("emergency") ||
      lower.includes("refund") ||
      lower.includes("goodwill")
    ) {
      const jamalBooking = bookings.find((b) => b.id === "SD-8461");
      const refundAmount = 15.0;
      const proposal: RefundProposal = {
        bookingId: jamalBooking?.id || "SD-8461",
        clientName: jamalBooking?.clientName || "Jamal Crawford",
        refundAmount,
        reason: "Client Family Emergency - Goodwill 50% No-Show Waiver",
      };

      const response =
        `⚡ [toolkit.create_refund Proposal]\n` +
        `I recognized intent for a goodwill partial refund. The $30.00 no-show fee for Jamal Crawford (SD-8461) can be partially refunded by $15.00.\n` +
        `Human-in-the-Loop Safeguard: This transaction requires your explicit confirmation below.`;

      setCopilotChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          hasProposal: true,
          proposalData: proposal,
        },
      ]);
      return;
    }

    const defaultResponse =
      `⚡ [PayPal Agent Toolkit 1.11.0]\n` +
      `I can query bookings, verify authorizations, or create refund proposals. Try asking: "What is the status of Hana's hold?" or "Client had a family emergency, refund half the $30 no-show fee."`;

    setCopilotChat((prev) => [
      ...prev,
      { role: "assistant", content: defaultResponse },
    ]);
  };

  return (
    <Drawer
      onClose={onClose}
      title="Owner AI Assistant"
      subtitle="PayPal Agent Toolkit 1.11.0"
      icon={
        <div className="rounded-lg border border-amber-300 bg-amber-100 p-1.5">
          <Bot className="h-4 w-4 text-amber-700" />
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-wrap gap-1.5 border-slate-100 border-b bg-white p-3">
          <button
            type="button"
            onClick={() =>
              handleCopilotSend("What is the status of Hana's hold?")
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-700 transition-colors hover:border-amber-400 hover:text-amber-800"
          >
            🔍 Hana&apos;s hold status?
          </button>
          <button
            type="button"
            onClick={() =>
              handleCopilotSend(
                "Summarize today's hold volume and transactions",
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-700 transition-colors hover:border-amber-400 hover:text-amber-800"
          >
            📊 Today&apos;s volume summary
          </button>
          <button
            type="button"
            onClick={() =>
              handleCopilotSend(
                "Client had a family emergency, refund half the $30 no-show fee.",
              )
            }
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] text-rose-700 transition-colors hover:border-rose-300"
          >
            ⚡ Propose emergency refund
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
          {copilotChat.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}`}
              className={`flex flex-col space-y-2 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-xl p-3 whitespace-pre-line leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 font-semibold text-white shadow-xs"
                    : "border border-slate-200 bg-slate-50 text-slate-800"
                }`}
              >
                {msg.content}
              </div>

              {msg.hasProposal && msg.proposalData ? (
                <div className="w-full space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-[10px] text-purple-900 uppercase tracking-wider">
                      ProposedAction: create_refund
                    </span>
                    <span className="rounded border border-purple-200 bg-purple-100 px-2 py-0.5 font-bold text-[10px] text-purple-800">
                      HITL Confirmation Required
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="font-bold text-slate-900">
                      Client: {msg.proposalData.clientName} (
                      {msg.proposalData.bookingId})
                    </div>
                    <div className="font-bold text-emerald-700 text-sm">
                      Refund Amount: ${msg.proposalData.refundAmount.toFixed(2)}{" "}
                      USD
                    </div>
                    <div className="font-sans text-[11px] text-slate-600">
                      Reason: {msg.proposalData.reason}
                    </div>
                  </div>

                  <Button
                    fullWidth
                    className="border-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                    onClick={() => {
                      const ledgerId = onExecuteRefund(msg.proposalData!);
                      setCopilotChat((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content: `✅ Refund of $${msg.proposalData!.refundAmount.toFixed(2)} successfully executed via PayPal Orders v2 API. Audit ledger entry #${ledgerId} recorded.`,
                        },
                      ]);
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Confirm ${msg.proposalData.refundAmount.toFixed(2)} Partial
                    Refund via PayPal
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCopilotSend();
          }}
          className="flex shrink-0 gap-2 border-slate-200 border-t bg-slate-50 p-3"
        >
          <input
            type="text"
            value={copilotQuery}
            onChange={(event) => setCopilotQuery(event.target.value)}
            placeholder="Ask assistant about holds or settlements..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 text-xs shadow-xs placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden"
          />
          <Button type="submit" variant="primary" size="md">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </Drawer>
  );
}
