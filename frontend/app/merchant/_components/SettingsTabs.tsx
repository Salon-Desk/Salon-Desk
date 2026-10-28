'use client'

import { Building2, Clock, CreditCard, Lock, Shield, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { Button } from '@/components/ui'

export type SettingsTab =
  'general' | 'profile' | 'hours-location' | 'paypal' | 'policies' | 'security'

interface SettingsTabsProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  incompleteTabs?: Partial<Record<SettingsTab, boolean>>
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'Salon Branding', icon: <Building2 className="h-4 w-4" /> },
  { id: 'profile', label: 'My Profile', icon: <User className="h-4 w-4" /> },
  { id: 'hours-location', label: 'Hours & Location', icon: <Clock className="h-4 w-4" /> },
  { id: 'paypal', label: 'PayPal', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'policies', label: 'Policies', icon: <Shield className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
]

export function SettingsTabs({ activeTab, onTabChange, incompleteTabs }: SettingsTabsProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab | null
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      onTabChange(tabParam)
    }
  }, [searchParams, onTabChange])

  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-1.5 no-scrollbar">
      {TABS.map((tab) => {
        const isIncomplete = Boolean(incompleteTabs?.[tab.id])

        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            <span>{tab.label}</span>
            {isIncomplete && (
              <span
                className={`ml-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-tight ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'border border-amber-300 bg-amber-50 text-amber-800'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeTab === tab.id ? 'bg-slate-950' : 'animate-pulse bg-amber-500'
                  }`}
                />
                Setup
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
