import { Star } from 'lucide-react'

export interface ReviewCardProps {
  title: string
  subtitle?: string | null
  rating: number
  comment?: string | null
  dateLabel: string
}

export function ReviewCard({ title, subtitle, rating, comment, dateLabel }: ReviewCardProps) {
  return (
    <article className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950">{title}</p>
          {subtitle ? <p className="truncate text-xs text-stone-500">{subtitle}</p> : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)}
        </span>
      </div>
      {comment ? (
        <p className="text-sm leading-relaxed text-stone-600">{comment}</p>
      ) : (
        <p className="text-sm italic text-stone-400">No written comment.</p>
      )}
      <p className="mt-2 text-[11px] text-stone-400">{dateLabel}</p>
    </article>
  )
}
