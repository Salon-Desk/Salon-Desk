import Image from "next/image";

export function CatalogHero() {
  return (
    <section className="mb-8 sm:mb-12 pt-2 sm:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left: Modern Editorial Typography */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
              Crown & Blade Atelier • SoHo, NYC
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-950 leading-[1.1]">
            Bespoke salon artistry,{" "}
            <span className="font-serif italic font-normal text-amber-700">
              zero upfront charge.
            </span>
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed">
            Reserve master stylists with PayPal authorization holds. $0 is
            debited today — funds are securely held and release instantly if you
            cancel on time.
          </p>

          <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              $0 Debited Today
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              Free Cancel ≥ 24h
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              ★ 4.9 (380+ Reviews)
            </span>
          </div>
        </div>

        {/* Right: Borderless & Shadowless Visual Tile */}
        <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] w-full overflow-hidden rounded-3xl bg-stone-100">
          <Image
            src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&auto=format&fit=crop&q=80"
            alt="Crown & Blade Atelier SoHo"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="text-xs font-semibold">Flagship Atelier</div>
            <div className="text-[11px] text-stone-300">
              454 Broome St, SoHo, New York
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
