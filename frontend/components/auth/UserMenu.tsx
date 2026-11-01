'use client'

import {
  ChevronDown,
  LogOut,
  Scissors,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

import { type AppPortal, logout, portalUserSelector, userSelector } from '@/store/authSlice'
import { API_TAG_TYPES, baseApi } from '@/store/baseApi'

import { useAuthModal } from './auth-context'

interface UserMenuProps {
  portal?: AppPortal
  compact?: boolean
}

export const UserMenu: React.FC<UserMenuProps> = ({ portal, compact = false }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const activeUser = useSelector(userSelector)
  const portalUser = useSelector(portal ? portalUserSelector(portal) : userSelector)
  const user = portal ? portalUser : activeUser
  const { openAuthModal } = useAuthModal()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    dispatch(logout(portal))
    dispatch(baseApi.util.invalidateTags([...API_TAG_TYPES]))
    setIsOpen(false)
    toast.success('Signed out successfully')
    router.push('/')
    router.refresh()
  }

  // Not signed in
  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => openAuthModal('sign-in', portal)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-amber-400 hover:text-amber-700 transition-colors"
        >
          <UserIcon className="h-3.5 w-3.5 text-slate-500" />
          <span className="whitespace-nowrap">Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => openAuthModal('demo-personas', portal)}
          title="Quick 1-Click Demo Accounts"
          className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/20 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span className="hidden sm:inline">Demo</span>
        </button>
      </div>
    )
  }

  // Role display label
  const roleLabels: Record<string, { label: string; tone: string }> = {
    client: { label: 'Client', tone: 'bg-sky-100 text-sky-800 border-sky-200' },
    org_owner: { label: 'Owner', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
    reception: { label: 'Reception', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
    stylist: { label: 'Stylist', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
    platform_admin: { label: 'Admin', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    platform_staff: { label: 'Staff', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  }

  const roleMeta = roleLabels[user.role] || {
    label: user.role,
    tone: 'bg-slate-100 text-slate-800 border-slate-200',
  }
  const displayName = user.profile?.first_name || user.first_name || user.email.split('@')[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-xs hover:border-slate-300 transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 font-bold text-[11px] text-white">
          {displayName.charAt(0).toUpperCase()}
        </div>

        {!compact && (
          <div className="hidden items-center gap-1.5 text-left sm:flex">
            <span className="max-w-[100px] truncate font-semibold">{displayName}</span>
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${roleMeta.tone}`}
            >
              {roleMeta.label}
            </span>
          </div>
        )}

        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-[min(15rem,calc(100vw-2rem))] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="border-b border-slate-100 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{displayName}</span>
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${roleMeta.tone}`}
              >
                {roleMeta.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-500 font-mono">{user.email}</p>
            {user.org_id && (
              <p className="mt-0.5 truncate text-[10px] text-amber-700 font-mono">
                Org: {user.org_id.slice(0, 8)}...
              </p>
            )}
          </div>

          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Workspace
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push('/client')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <UserIcon className="h-3.5 w-3.5 text-sky-500" />
              <span>Client Experience</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push('/merchant')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Scissors className="h-3.5 w-3.5 text-amber-500" />
              <span>Salon Console</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push('/admin')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Platform Admin</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                openAuthModal('demo-personas', portal)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Switch Demo Persona</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
