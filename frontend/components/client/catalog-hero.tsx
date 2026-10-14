import { CheckCircle2, Clock, Lock, Shield } from "lucide-react";

export function CatalogHero() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md sm:p-10">
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 font-semibold text-amber-300 text-xs backdrop-blur-xs">
          <Lock className="h-3.5 w-3.5" />
          <span>A Hold, Not a Charge • Powered by PayPal</span>
        </div>

        <h1 className="mb-3 font-extrabold text-2xl text-white tracking-tight sm:text-4xl">
          Crown & Blade Atelier{" "}
          <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text font-serif text-transparent italic">
            SoHo Flagship
          </span>
        </h1>

        <p className="mb-6 text-slate-300 text-sm leading-relaxed sm:text-base">
          Experience bespoke hair design, skin fades, balayage, and restorative
          spa treatments. Reserve your preferred master stylist with{" "}
          <span className="font-bold text-white underline decoration-amber-400 underline-offset-4">
            zero dollars charged today
          </span>
          . Funds are simply held and release instantly if you cancel on time.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <HeroPill
            icon={
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            }
            label="$0 Upfront Payment"
          />
          <HeroPill
            icon={<Clock className="h-4 w-4 shrink-0 text-amber-400" />}
            label="Free Cancel ≥ 24 Hours"
          />
          <HeroPill
            icon={<Shield className="h-4 w-4 shrink-0 text-sky-400" />}
            label="Cryptographic Consent Hash"
          />
        </div>
      </div>
    </section>
  );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 font-medium text-slate-200 text-xs backdrop-blur-xs">
      {icon}
      <span>{label}</span>
    </div>
  );
}
