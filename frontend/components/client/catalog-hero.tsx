import { Sparkles } from "lucide-react";
import Image from "next/image";

export function CatalogHero() {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md">
      {/* Sleek Luxury Image Banner */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full">
        <Image
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&auto=format&fit=crop&q=80"
          alt="Crown & Blade Atelier Flagship"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        {/* Subtle luxury gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/15" />

        {/* Minimal text overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 md:p-8 text-white">
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 shadow-xs backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            <span>SoHo Flagship • $0 Debited Today</span>
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Crown & Blade Atelier
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-slate-200/90 max-w-xl line-clamp-1">
            Bespoke hair design & grooming with zero upfront risk via PayPal
            authorization holds.
          </p>
        </div>
      </div>
    </section>
  );
}
