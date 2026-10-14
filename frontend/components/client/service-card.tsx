"use client";

import { ArrowRight, Clock, Info, Lock, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui";
import { stylistForCategory } from "@/lib/data/catalog";
import { serviceImage } from "@/lib/data/service-content";
import type { SalonService } from "@/types";

interface ServiceCardProps {
  service: SalonService;
  onAskAi: (service: SalonService) => void;
  onQuickBook: (service: SalonService) => void;
  onOpenProtocol: (service: SalonService) => void;
}

export function ServiceCard({
  service,
  onAskAi,
  onQuickBook,
  onOpenProtocol,
}: ServiceCardProps) {
  const stylist = stylistForCategory(service.category);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:border-amber-400/80 hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <Image
          src={serviceImage(service.id)}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 font-extrabold text-[11px] text-slate-950 shadow-xs backdrop-blur-xs">
            <Lock className="h-3 w-3" />${service.holdDeposit} Hold Only
          </span>
          {service.popular && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-slate-900/90 px-2 py-0.5 font-bold text-[10px] text-amber-300">
              <Star className="h-3 w-3 fill-amber-300" />
              Popular
            </span>
          )}
        </div>

        <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between font-medium text-white text-xs">
          <span className="flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-0.5 backdrop-blur-xs">
            <Clock className="h-3 w-3 text-amber-400" />
            {service.durationMin} mins
          </span>
          <span className="rounded-md bg-emerald-500/90 px-2 py-0.5 font-bold text-[11px] text-slate-950">
            Free 24h Cancel
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <span className="font-bold text-[11px] text-amber-600 uppercase tracking-wider">
              {service.category}
            </span>
            <span className="font-black text-lg text-slate-900">
              ${service.price}
            </span>
          </div>

          <h3 className="mb-2 font-bold text-base text-slate-900 transition-colors group-hover:text-amber-600">
            {service.name}
          </h3>
          <p className="mb-4 line-clamp-2 text-slate-600 text-xs leading-relaxed">
            {service.description}
          </p>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-300 bg-slate-200">
                <Image
                  src={stylist.avatar}
                  alt={stylist.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  {stylist.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {stylist.role.split("&")[0]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-[11px] text-slate-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{stylist.rating}</span>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/60 p-2.5 text-slate-700 text-xs">
            <div>
              <span className="block font-bold text-[10px] text-amber-800 uppercase tracking-wider">
                Deposit Hold Rule
              </span>
              <span className="font-semibold text-slate-900">
                $0 charged today • ${service.holdDeposit} held
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenProtocol(service)}
              className="flex items-center gap-1 font-bold text-[11px] text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              <Info className="h-3 w-3" />
              <span>Protocol</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-slate-100 border-t pt-2">
          <Button variant="secondary" onClick={() => onAskAi(service)}>
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Ask AI
          </Button>
          <Button variant="primary" onClick={() => onQuickBook(service)}>
            Quick Book
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
