"use client";

import { ArrowRight, Clock, Info, Lock, Sparkles, Star } from "lucide-react";
import Image from "next/image";
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
    <article className="group flex flex-col">
      {/* Frameless Media Container - Zero Borders, Zero Shadows */}
      <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-3xl bg-stone-100">
        <Image
          src={serviceImage(service.id)}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
          referrerPolicy="no-referrer"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />

        {/* Top-Left Hold Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-bold text-[11px] text-stone-950 backdrop-blur-md">
            <Lock className="h-3 w-3 text-amber-600" />
            <span>${service.holdDeposit} Hold • $0 Today</span>
          </span>
        </div>

        {/* Top-Right Protocol Button */}
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={() => onOpenProtocol(service)}
            title="View Treatment Protocol"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-950/50 text-white backdrop-blur-md hover:bg-stone-950 transition-colors cursor-pointer"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom Duration Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{service.durationMin}m</span>
          </span>
        </div>
      </div>

      {/* Editorial Content Below Image */}
      <div className="pt-3.5 flex flex-col justify-between flex-1">
        <div>
          {/* Category & Price */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              {service.category}
            </span>
            <span className="text-xl font-extrabold text-stone-950">
              ${service.price}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-base font-bold text-stone-950 leading-snug transition-colors group-hover:text-amber-700">
            {service.name}
          </h2>

          {/* Description */}
          <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          {/* Stylist Mini Row */}
          <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-stone-200">
                <Image
                  src={stylist.avatar}
                  alt={stylist.name}
                  fill
                  sizes="20px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs text-stone-700 font-medium">
                {stylist.name}
              </span>
            </div>

            <div className="flex items-center gap-1 font-semibold text-stone-700 text-[11px]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{stylist.rating}</span>
            </div>
          </div>
        </div>

        {/* Actions - Clean Borderless Pills */}
        <div className="mt-4 flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onQuickBook(service)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-stone-950 py-2.5 px-4 text-xs font-semibold text-white transition-all hover:bg-amber-600 cursor-pointer"
          >
            <span>Book Now</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onAskAi(service)}
            className="flex items-center justify-center gap-1 rounded-full bg-stone-100 py-2.5 px-3.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI</span>
          </button>
        </div>
      </div>
    </article>
  );
}
