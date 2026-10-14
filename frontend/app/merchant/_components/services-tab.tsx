"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { Button, Card, IconButton } from "@/components/ui";
import { formatUsd } from "@/lib/format";
import type { SalonService } from "@/types";

interface ServicesTabProps {
  services: SalonService[];
  onAddService: () => void;
  onEditService: (service: SalonService) => void;
  onDeleteService: (service: SalonService) => void;
}

export function ServicesTab({
  services,
  onAddService,
  onEditService,
  onDeleteService,
}: ServicesTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold text-slate-900 text-xl">
            Services &amp; Deposit Policy Catalog
          </h2>
          <p className="text-slate-600 text-xs">
            Define service pricing, required hold deposits, and customizable
            no-show retention fees.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onAddService}>
          <Plus className="h-3.5 w-3.5" />
          New Service
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((srv) => (
          <Card
            key={srv.id}
            hoverTone="amber"
            className="flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold font-mono text-[10px] text-amber-800">
                  {srv.category}
                </span>
                <span className="font-mono text-slate-500 text-xs">
                  {srv.durationMin} mins
                </span>
              </div>

              <h3 className="mb-1 font-bold text-base text-slate-900">
                {srv.name}
              </h3>
              <p className="mb-3 line-clamp-2 text-slate-600 text-xs leading-relaxed">
                {srv.description}
              </p>

              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Service Price:</span>
                  <strong className="text-slate-900">
                    {formatUsd(srv.price)}
                  </strong>
                </div>
                <div className="flex justify-between font-bold text-amber-800">
                  <span>PayPal Hold Deposit:</span>
                  <span>{formatUsd(srv.holdDeposit)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>No-Show Retained Fee:</span>
                  <span>{formatUsd(srv.noShowFee)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-slate-100 border-t pt-3 text-xs">
              <span className="font-mono text-[11px] text-slate-500">
                24h free cancellation
              </span>
              <div className="flex items-center gap-2">
                <IconButton
                  aria-label="Edit service"
                  onClick={() => onEditService(srv)}
                  className="border border-slate-200 bg-slate-100 text-slate-700 shadow-xs hover:bg-slate-200"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  aria-label="Delete service"
                  onClick={() => onDeleteService(srv)}
                  className="border border-rose-200 bg-rose-50 text-rose-700 shadow-xs hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
