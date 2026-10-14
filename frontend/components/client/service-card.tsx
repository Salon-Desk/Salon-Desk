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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/80 hover:shadow-xl">
      {/* Product Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={serviceImage(service.id)}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[11px] font-bold text-slate-950 shadow-md backdrop-blur-md">
            <Lock className="h-3 w-3" />
            <span>${service.holdDeposit} Hold • $0 Today</span>
          </span>

          {service.popular && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
              <Star className="h-3 w-3 fill-amber-300" />
              Popular
            </span>
          )}
        </div>

        {/* Bottom Image Info */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-0.5 backdrop-blur-md">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{service.durationMin}m</span>
          </span>
          <button
            type="button"
            onClick={() => onOpenProtocol(service)}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 transition-colors hover:text-white backdrop-blur-md cursor-pointer"
          >
            <Info className="h-3 w-3 text-amber-400" />
            <span>Protocol</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Category & Total Price */}
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              {service.category}
            </span>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900">
                ${service.price}
              </span>
            </div>
          </div>

          {/* Service Title */}
          <h2 className="mb-1.5 text-base font-bold text-slate-900 transition-colors group-hover:text-amber-600">
            {service.name}
          </h2>

          {/* Service Description */}
          <p className="mb-3.5 line-clamp-2 text-xs text-slate-600 leading-relaxed">
            {service.description}
          </p>

          {/* Minimal Stylist Info */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-slate-200">
                <Image
                  src={stylist.avatar}
                  alt={stylist.name}
                  fill
                  sizes="28px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-semibold text-slate-900 truncate">
                {stylist.name}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{stylist.rating}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Ask AI & Book */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <Button
            variant="secondary"
            onClick={() => onAskAi(service)}
            className="w-full text-xs font-semibold py-2 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Ask AI</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => onQuickBook(service)}
            className="w-full text-xs font-semibold py-2 cursor-pointer"
          >
            <span>Book</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Button>
        </div>
      </div>
    </article>
  );
}
