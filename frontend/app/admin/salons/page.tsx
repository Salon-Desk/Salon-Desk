"use client";

import {
  CheckCircle2,
  Copy,
  Edit2,
  Lock,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import {
  Button,
  IconButton,
  OrganizationStatusBadge,
  SearchInput,
  SegmentedControl,
} from "@/components/ui";
import { useAdminContext } from "../_context/admin-context";

const FILTER_OPTIONS = [
  { value: "ALL" as const, label: "All" },
  { value: "APPROVED" as const, label: "Active" },
  { value: "PENDING_REVIEW" as const, label: "Pending" },
  { value: "SUSPENDED" as const, label: "Suspended" },
];

export default function AdminSalonsPage() {
  const {
    filteredSalons,
    salonSearch,
    setSalonSearch,
    salonStatusFilter,
    setSalonStatusFilter,
    setIsAddSalonOpen,
    setEditingSalon,
    setSuspendingSalon,
    setDeletingSalon,
    handleApproveSalon,
  } = useAdminContext();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Partner Salons
          </h1>
          <p className="text-slate-500 text-xs">
            {filteredSalons.length} onboarded salons · PayPal merchant
            integrations
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddSalonOpen(true)}
          className="rounded-xl px-3.5 py-2 font-medium text-xs shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Salon
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            value={salonSearch}
            onChange={setSalonSearch}
            placeholder="Search salons by name, owner, or city..."
            className="w-full text-xs"
          />
        </div>

        <div className="overflow-x-auto pb-1 sm:pb-0">
          <SegmentedControl
            value={salonStatusFilter}
            onChange={setSalonStatusFilter}
            options={FILTER_OPTIONS}
            variant="pills"
          />
        </div>
      </div>

      {/* Salons Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-slate-200/80 border-b bg-slate-50/70 font-semibold text-slate-700">
              <th className="px-5 py-3">Salon</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">PayPal Merchant ID</th>
              <th className="px-5 py-3">Notice Window</th>
              <th className="px-5 py-3">Take-Rate</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSalons.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-slate-400 text-xs"
                >
                  No partner salons found.
                </td>
              </tr>
            ) : (
              filteredSalons.map((salon) => (
                <tr
                  key={salon.id}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 text-sm">
                      {salon.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {salon.city || salon.address}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-700">
                    <div className="font-medium text-slate-900">
                      {salon.ownerName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {salon.email}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">
                        {salon.paypalMerchantId}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(salon.id, salon.paypalMerchantId)
                        }
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy Merchant ID"
                      >
                        {copiedId === salon.id ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    <span className="font-mono text-xs">
                      ≥ {salon.cancellationPolicyHours}h
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    {salon.customCommissionRate ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-medium font-mono text-emerald-900 text-[11px]">
                        {salon.customCommissionRate}% VIP
                      </span>
                    ) : (
                      <span className="font-mono text-slate-500 text-[11px]">
                        2.5% std
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <OrganizationStatusBadge status={salon.status} />
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {salon.status === "PENDING_REVIEW" ? (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApproveSalon(salon.id)}
                          className="h-7 rounded-xl font-medium text-xs px-2.5"
                        >
                          Approve
                        </Button>
                      ) : null}

                      <IconButton
                        title="Edit Salon Details"
                        onClick={() => setEditingSalon(salon)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 h-7 w-7 text-slate-600"
                      >
                        <Edit2 className="h-3 w-3" />
                      </IconButton>

                      <IconButton
                        title={
                          salon.status === "SUSPENDED"
                            ? "Reinstate Salon"
                            : "Suspend Salon"
                        }
                        className={`rounded-xl h-7 w-7 ${
                          salon.status === "SUSPENDED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                        }`}
                        onClick={() => setSuspendingSalon(salon)}
                      >
                        {salon.status === "SUSPENDED" ? (
                          <Unlock className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                      </IconButton>

                      <IconButton
                        title="Remove Salon"
                        tone="danger"
                        className="rounded-xl h-7 w-7"
                        onClick={() => setDeletingSalon(salon)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
