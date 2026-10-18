export function formatRegistrationDate(isoDateString?: string | null): string {
  if (!isoDateString) return 'Recent'
  try {
    const d = new Date(isoDateString)
    if (isNaN(d.getTime())) return 'Recent'
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Recent'
  }
}
