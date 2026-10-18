import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import type { AssistantPortal } from '@/types/api-booking'

export type { AssistantPortal }

export type WelcomeSuggestion = {
  label: string
  hint: string
  prompt: string
  icon: LucideIcon
}

export type PortalChrome = {
  portal: AssistantPortal
  title: string
  subtitleChat: string
  subtitleVoice: string
  fabLabel: string
  fabTitle: string
  placeholder: string
  thinkingLabel: string
  voicePlaceholder: string
  voiceConnecting: string
  voiceListening: string
  voiceIdle: string
  modeToggleLabel: string
  Icon: LucideIcon
  /** Tailwind class fragments for portal-specific chrome */
  fabButton: string
  fabIconWrap: string
  fabIcon: string
  fabPing: string
  fabDot: string
  avatar: string
  avatarIcon: string
  ring: string
  sendReady: string
  chipHover: string
  suggestionHover: string
  focusWithin: string
  panelBg: string
  voiceShellBg: string
  typingDot: string
  welcomeSuggestions: WelcomeSuggestion[]
  chips: string[]
  voiceSuggestions: string[]
}

const CLIENT: PortalChrome = {
  portal: 'client',
  title: 'Concierge',
  subtitleChat: 'Happy to help you book',
  subtitleVoice: 'Listening — talk naturally',
  fabLabel: 'Open chat',
  fabTitle: 'Chat with us',
  placeholder: 'What are you looking for?',
  thinkingLabel: 'Looking that up…',
  voicePlaceholder: 'Ask, search salons, or speak…',
  voiceConnecting: 'Connecting to voice concierge…',
  voiceListening: 'Listening — speak or type',
  voiceIdle: 'Ready — speak or type below',
  modeToggleLabel: 'Concierge mode',
  Icon: Sparkles,
  fabButton:
    'border-stone-700/80 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 hover:border-amber-400/50 hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.25)]',
  fabIconWrap: 'bg-amber-400/15 group-hover:bg-amber-400/25',
  fabIcon: 'text-amber-400',
  fabPing: 'bg-amber-400',
  fabDot: 'border-stone-950 bg-amber-400',
  avatar: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
  avatarIcon: 'text-amber-50',
  ring: 'focus-visible:ring-amber-500',
  sendReady: 'bg-amber-500 hover:bg-amber-600',
  chipHover: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-950',
  suggestionHover: 'hover:border-amber-300 hover:bg-amber-50/40',
  focusWithin: 'focus-within:border-amber-400 focus-within:ring-amber-500/15',
  panelBg: 'bg-[#F7F5F2]',
  voiceShellBg: 'bg-gradient-to-b from-[#FAFAFA] via-white to-amber-50/20',
  typingDot: 'bg-amber-500',
  welcomeSuggestions: [
    {
      label: 'Near me',
      hint: 'Salons close by',
      prompt: 'Find salons near me',
      icon: MapPin,
    },
    {
      label: 'Book a cut',
      hint: 'Tomorrow around 2',
      prompt: 'Book haircut tomorrow at 2pm',
      icon: Calendar,
    },
    {
      label: 'How I pay',
      hint: 'Nothing leaves today',
      prompt: 'How does the $0 hold work?',
      icon: ShieldCheck,
    },
    {
      label: 'What’s on',
      hint: 'A few popular picks',
      prompt: 'Show available services',
      icon: Sparkles,
    },
  ],
  chips: [
    'Find salons near me',
    'Book a haircut tomorrow',
    'How does the $0 hold work?',
    'How do I cancel a booking?',
  ],
  voiceSuggestions: [
    'Find salons near me',
    'Book a haircut tomorrow',
    'How does the $0 hold work?',
    'Log into my account',
  ],
}

const MERCHANT: PortalChrome = {
  portal: 'merchant',
  title: 'Merchant Help',
  subtitleChat: 'How to use your org console',
  subtitleVoice: 'Ask how something works',
  fabLabel: 'Open merchant help',
  fabTitle: 'Merchant help',
  placeholder: 'Ask how to use the merchant console…',
  thinkingLabel: 'Checking the guide…',
  voicePlaceholder: 'Ask about services, staff, settlements…',
  voiceConnecting: 'Connecting to merchant help…',
  voiceListening: 'Listening — ask how to use the console',
  voiceIdle: 'Ready — ask about your org console',
  modeToggleLabel: 'Help mode',
  Icon: Building2,
  fabButton:
    'border-teal-900/70 bg-gradient-to-b from-teal-950 via-stone-950 to-stone-950 hover:border-teal-400/50 hover:shadow-[0_15px_30px_-5px_rgba(45,212,191,0.22)]',
  fabIconWrap: 'bg-teal-400/15 group-hover:bg-teal-400/25',
  fabIcon: 'text-teal-300',
  fabPing: 'bg-teal-400',
  fabDot: 'border-stone-950 bg-teal-400',
  avatar: 'bg-gradient-to-br from-teal-500 via-teal-600 to-teal-800',
  avatarIcon: 'text-teal-50',
  ring: 'focus-visible:ring-teal-500',
  sendReady: 'bg-teal-600 hover:bg-teal-700',
  chipHover: 'hover:border-teal-300 hover:bg-teal-50 hover:text-teal-950',
  suggestionHover: 'hover:border-teal-300 hover:bg-teal-50/50',
  focusWithin: 'focus-within:border-teal-400 focus-within:ring-teal-500/15',
  panelBg: 'bg-[#F3F7F6]',
  voiceShellBg: 'bg-gradient-to-b from-[#F4FAF8] via-white to-teal-50/30',
  typingDot: 'bg-teal-500',
  welcomeSuggestions: [
    {
      label: 'Add staff',
      hint: 'Create a team member',
      prompt: 'How do I create staff step by step?',
      icon: Users,
    },
    {
      label: 'Add service',
      hint: 'Price, duration, capacity',
      prompt: 'How do I add a new service step by step?',
      icon: ClipboardList,
    },
    {
      label: 'Mark show',
      hint: 'Settle an appointment',
      prompt: 'How do I mark show or no-show on an appointment?',
      icon: CircleDollarSign,
    },
    {
      label: 'Commissions',
      hint: 'Fees & invoices',
      prompt: 'How do platform commissions and invoices work for my salon?',
      icon: Settings2,
    },
  ],
  chips: [
    'How do I create staff?',
    'How do commissions work for my salon?',
    'How do I mark show or no-show?',
    'How do I change PayPal?',
    'How do I pay a commission invoice?',
  ],
  voiceSuggestions: [
    'How do I create staff?',
    'How do platform commissions work for merchants?',
    'How do I mark show or no-show?',
    'How do I submit a PayPal change request?',
  ],
}

const ADMIN: PortalChrome = {
  portal: 'admin',
  title: 'Admin Help',
  subtitleChat: 'How to use platform admin',
  subtitleVoice: 'Ask about platform ops',
  fabLabel: 'Open admin help',
  fabTitle: 'Admin help',
  placeholder: 'Ask how to use platform admin…',
  thinkingLabel: 'Checking admin docs…',
  voicePlaceholder: 'Ask about orgs, approvals, commissions…',
  voiceConnecting: 'Connecting to admin help…',
  voiceListening: 'Listening — ask about platform admin',
  voiceIdle: 'Ready — ask how the admin console works',
  modeToggleLabel: 'Help mode',
  Icon: ShieldCheck,
  fabButton:
    'border-sky-900/70 bg-gradient-to-b from-slate-950 via-slate-950 to-stone-950 hover:border-sky-400/50 hover:shadow-[0_15px_30px_-5px_rgba(56,189,248,0.22)]',
  fabIconWrap: 'bg-sky-400/15 group-hover:bg-sky-400/25',
  fabIcon: 'text-sky-300',
  fabPing: 'bg-sky-400',
  fabDot: 'border-stone-950 bg-sky-400',
  avatar: 'bg-gradient-to-br from-sky-500 via-slate-600 to-slate-800',
  avatarIcon: 'text-sky-50',
  ring: 'focus-visible:ring-sky-500',
  sendReady: 'bg-sky-600 hover:bg-sky-700',
  chipHover: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-950',
  suggestionHover: 'hover:border-sky-300 hover:bg-sky-50/50',
  focusWithin: 'focus-within:border-sky-400 focus-within:ring-sky-500/15',
  panelBg: 'bg-[#F4F6F8]',
  voiceShellBg: 'bg-gradient-to-b from-[#F5F7FA] via-white to-sky-50/30',
  typingDot: 'bg-sky-500',
  welcomeSuggestions: [
    {
      label: 'Approve salon',
      hint: 'Pending organizations',
      prompt: 'How do I approve or suspend a salon step by step?',
      icon: Building2,
    },
    {
      label: 'Change requests',
      hint: 'PayPal & policies',
      prompt: 'How do I review merchant change requests step by step?',
      icon: ClipboardList,
    },
    {
      label: 'Commissions',
      hint: 'Update take rates',
      prompt: 'How do I update platform commissions step by step?',
      icon: CircleDollarSign,
    },
    {
      label: 'Invite staff',
      hint: 'Platform admins',
      prompt: 'How do I invite platform admin staff?',
      icon: LayoutDashboard,
    },
  ],
  chips: [
    'How do I approve a salon?',
    'How do I review change requests?',
    'How do I update commissions?',
    'How do I invite admin staff?',
  ],
  voiceSuggestions: [
    'How do I approve a salon?',
    'How do I review change requests?',
    'How do I update commissions?',
    'How do I invite admin staff?',
  ],
}

export function portalFromPathname(pathname: string | null | undefined): AssistantPortal {
  if (!pathname) return 'client'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/merchant') || pathname.startsWith('/org')) return 'merchant'
  return 'client'
}

export function isSupportPortal(portal: AssistantPortal): boolean {
  return portal === 'merchant' || portal === 'admin'
}

export function portalChrome(portal: AssistantPortal): PortalChrome {
  if (portal === 'merchant') return MERCHANT
  if (portal === 'admin') return ADMIN
  return CLIENT
}

export function welcomeMessageForPortal(portal: AssistantPortal): string {
  if (portal === 'merchant') {
    return 'Hi — merchant help here. Ask how to run the console: staff, services, calendar, settlements, PayPal, policies — or how commissions and invoices work (captures go to your PayPal; SalonDesk bills SaaS fees separately). What do you want to do?'
  }
  if (portal === 'admin') {
    return 'Hi — admin help here. I can guide approvals, salon status, commission rules and SaaS billing, taxonomy, or platform staff. What do you want to do?'
  }
  return 'Hey — I can help you find a salon or book a time. What are you in the mood for?'
}

export function chatPanelTitle(portal: AssistantPortal): string {
  return portalChrome(portal).title
}

export function chatPanelSubtitle(portal: AssistantPortal, mode: 'chat' | 'voice'): string {
  const chrome = portalChrome(portal)
  return mode === 'voice' ? chrome.subtitleVoice : chrome.subtitleChat
}

/** Fallback icon when a portal theme is unavailable. */
export const HelpPortalIcon = HelpCircle
