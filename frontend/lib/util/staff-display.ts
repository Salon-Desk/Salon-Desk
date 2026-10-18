import type { User } from '@/types/user'

const AVATAR_GRADIENTS = [
  'from-amber-500 to-amber-700',
  'from-stone-900 to-slate-800',
  'from-teal-600 to-emerald-700',
  'from-sky-600 to-indigo-700',
  'from-rose-600 to-purple-700',
]

export function staffDisplayName(user: User): string {
  const first = user.profile?.first_name || user.first_name
  const last = user.profile?.last_name || user.last_name
  if (first || last) return [first, last].filter(Boolean).join(' ')
  if (user.name) return user.name
  return user.email
}

export function staffInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function staffAvatarGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

export function staffPicture(user: User): string | null {
  return user.profile?.picture || null
}

export function staffPhone(user: User): string | null {
  return user.profile?.phone || user.phone || null
}

export function staffRoleLabel(role: string): string {
  return role.replace(/_/g, ' ')
}
