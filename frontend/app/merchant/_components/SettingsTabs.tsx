'use client'

import { Building2, CreditCard, Lock, Shield } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { Button } from '@/components/ui'

export type SettingsTab = 'general' | 'paypal' | 'policies' | 'security'

interface SettingsTabsProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Building2 className="h-4 w-4" /> },
  { id: 'paypal', label: 'PayPal', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'policies', label: 'Policies', icon: <Shield className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
]

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab | null
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      onTabChange(tabParam)
    }
  }, [searchParams, onTabChange])

  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-1.5 no-scrollbar">
      {TABS.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          className={`shrink-0 rounded-xl ${
            activeTab === tab.id
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
