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
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {TABS.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange(tab.id)}
          className={activeTab === tab.id ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
