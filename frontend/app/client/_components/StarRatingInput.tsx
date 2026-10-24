import { Star } from 'lucide-react'

export interface StarRatingInputProps {
  value: number
  onChange: (rating: number) => void
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} stars`}
          onClick={() => onChange(star)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 cursor-pointer"
        >
          <Star
            className={
              star <= value ? 'h-6 w-6 fill-amber-400 text-amber-400' : 'h-6 w-6 text-stone-300'
            }
          />
        </button>
      ))}
    </div>
  )
}
