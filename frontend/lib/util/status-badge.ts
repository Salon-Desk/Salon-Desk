const STATUS_STYLES: Record<string, string> = {
  "Quote Sent": "border-sky-200 bg-sky-50 text-sky-800",
  Converted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Awaiting Payment": "border-amber-200 bg-amber-50 text-amber-800",
  "Payment Confirmed": "border-teal-200 bg-teal-50 text-teal-800",
  "Under Review": "border-violet-200 bg-violet-50 text-violet-800",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Inactive: "border-slate-200 bg-slate-50 text-slate-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-800",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function getAgentStatusBadgeStyle(status: string): {
  className: string;
} {
  return {
    className:
      STATUS_STYLES[status] ?? "border-slate-200 bg-slate-50 text-slate-700",
  };
}
