import { redirect } from 'next/navigation'

/** Legacy alias → canonical client checkout route. */
export default function BookPage() {
  redirect('/client/book')
}
