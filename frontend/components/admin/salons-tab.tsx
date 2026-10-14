"use client";

import { Edit2, Lock, Plus, Trash2, Unlock } from "lucide-react";
import {
  Button,
  IconButton,
  OrganizationStatusBadge,
  SearchInput,
  SegmentedControl,
} from "@/components/ui";
import type { Organization } from "@/types";
import type { SalonStatusFilter } from "./admin-shared";

interface SalonsTabProps {
  salons: Organization[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: SalonStatusFilter;
  onStatusFilterChange: (value: SalonStatusFilter) => void;
  onAddSalon: () => void;
  onApprove: (orgId: string) => void;
  onEdit: (salon: Organization) => void;
  onSuspend: (salon: Organization) => void;
  onDelete: (salon: Organization) => void;
}

const FILTER_OPTIONS = [
  { value: "ALL" as const, label: "All" },
  { value: "APPROVED" as const, label: "Active" },
  { value: "PENDING_REVIEW" as const, label: "Pending" },
  { value: "SUSPENDED" as const, label: "Suspended" },
];

export function SalonsTab({
  salons,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddSalon,
  onApprove,
  onEdit,
  onSuspend,
  onDelete,
}: SalonsTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-200 fade-in">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold text-slate-900 text-xl">
            Multi-Tenant Salon Directory
          </h2>
          <p className="text-slate-600 text-xs">
            Manage salon partners, approve pending onboarding requests,
            configure custom rates, or suspend accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search salon or city..."
            className="min-w-[200px]"
          />

          <SegmentedControl
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={FILTER_OPTIONS}
            variant="pills"
          />

          <Button onClick={onAddSalon}>
            <Plus className="h-3.5 w-3.5" />
            <span>Onboard Salon</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-slate-200 border-b bg-slate-50 font-semibold text-slate-700">
              <th className="px-4 py-3">Salon &amp; Location</th>
              <th className="px-4 py-3">Owner Contact</th>
              <th className="px-4 py-3">PayPal Merchant ID</th>
              <th className="px-4 py-3">Policy</th>
              <th className="px-4 py-3">Rate Override</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {salons.map((salon) => (
              <tr
                key={salon.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-900">{salon.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {salon.address}
                    {salon.city ? `, ${salon.city}` : ""}
                  </div>
                </td>

                <td className="px-4 py-3.5 text-slate-700">
                  <div className="font-medium">{salon.ownerName}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {salon.email}
                  </div>
                </td>

                <td className="px-4 py-3.5 font-mono text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span>{salon.paypalMerchantId}</span>
                    {salon.verified && (
                      <span
                        className="font-bold text-emerald-700"
                        title="Verified PayPal Sandbox Merchant"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3.5 font-medium text-slate-700">
                  ≥ {salon.cancellationPolicyHours}h free
                </td>

                <td className="px-4 py-3.5">
                  {salon.customCommissionRate ? (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold font-mono text-emerald-800">
                      {salon.customCommissionRate}% VIP
                    </span>
                  ) : (
                    <span className="font-mono text-slate-500">
                      Standard (2.5%)
                    </span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <OrganizationStatusBadge status={salon.status} />
                </td>

                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {salon.status === "PENDING_REVIEW" && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onApprove(salon.id)}
                      >
                        Approve
                      </Button>
                    )}

                    <IconButton
                      title="Edit Salon Details"
                      onClick={() => onEdit(salon)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </IconButton>

                    <IconButton
                      title={
                        salon.status === "SUSPENDED"
                          ? "Reinstate Salon"
                          : "Suspend Salon"
                      }
                      className={
                        salon.status === "SUSPENDED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }
                      onClick={() => onSuspend(salon)}
                    >
                      {salon.status === "SUSPENDED" ? (
                        <Unlock className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </IconButton>

                    <IconButton
                      title="Offboard Salon"
                      tone="danger"
                      onClick={() => onDelete(salon)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
