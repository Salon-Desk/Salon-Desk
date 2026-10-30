import { Calendar, Compass, Home, Search } from 'lucide-react'
import Link from 'next/link'

import { ROUTES } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#fbfbfa] px-4 py-16 text-center">
      {/* Decorative ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 h-72 w-72 rounded-full bg-stone-500/5 blur-2xl" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-lg rounded-3xl border border-stone-200/80 bg-white/95 p-8 shadow-xl shadow-stone-200/40 backdrop-blur-xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 shadow-inner">
          <Compass className="h-8 w-8 animate-pulse text-amber-600" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
          Error 404
        </span>

        <h1 className="mt-4 font-serif text-3xl font-normal text-stone-950 sm:text-4xl">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          The page or salon destination you are looking for has been moved, renamed, or is currently
          unavailable.
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.clientExplore}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-stone-950 px-6 text-xs font-semibold text-white shadow-md shadow-stone-950/15 transition-all hover:bg-stone-800 active:scale-[0.98]"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Browse Salons</span>
          </Link>

          <Link
            href={ROUTES.clientBookings}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 text-xs font-semibold text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.98]"
          >
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
            <span>My Bookings</span>
          </Link>
        </div>

        <div className="mt-8 border-t border-stone-100 pt-5">
          <Link
            href={ROUTES.hub}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-700"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to SalonDesk Home</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
