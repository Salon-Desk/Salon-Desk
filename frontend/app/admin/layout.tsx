'use client'

import { Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ConsoleShell } from '@/components/layout/console-shell'
import { PortalGuard } from '@/components/layout/portal-guard'
import { Toast } from '@/components/ui'
import type { AppDispatch } from '@/store/app'
import { logout, userSelector } from '@/store/authSlice'
import { useGetAdminDashboardQuery } from '@/store/slice/adminApi'
import type { PlatformUser } from '@/types'

import { AdminHeader } from './_components/admin-header'
import { AdminSidebar } from './_components/admin-sidebar'
import { getAdminTabFromPathname } from './_constants/admin-nav'
import { AdminProvider, useAdminContext } from './_context/admin-context'

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentTab = getAdminTabFromPathname(pathname)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(userSelector)
  const { data: dashboard } = useGetAdminDashboardQuery()
  const { isResetting, message, handleResetData } = useAdminContext()

  const handleLockSession = () => {
    dispatch(logout())
  }

  return (
    <PortalGuard portal="admin">
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 selection:bg-amber-500/20">
        {message && (
          <Toast
            message={message}
            position="top-right"
            theme="dark"
            icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          />
        )}

        <ConsoleShell
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
          sidebar={
            <AdminSidebar
              activeTab={currentTab}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              organizationCount={dashboard?.total_organizations ?? 0}
              categoryCount={0}
              staffCount={0}
              pendingCrCount={dashboard?.pending_change_requests ?? 0}
              pendingSalonCount={dashboard?.pending_organizations ?? 0}
              currentUser={
                {
                  id: user?.id || 'unknown',
                  name:
                    [user?.profile?.first_name, user?.profile?.last_name]
                      .filter(Boolean)
                      .join(' ') ||
                    user?.email?.split('@')[0] ||
                    'Admin',
                  email: user?.email || '',
                  role: user?.role === 'platform_staff' ? 'Support Agent' : 'Super Admin',
                  status: 'ACTIVE',
                  avatar: '',
                  lastActive: 'Now',
                } satisfies PlatformUser
              }
              onLockSession={handleLockSession}
              onResetDemo={handleResetData}
              isResetting={isResetting}
            />
          }
          header={
            <AdminHeader
              activeTab={currentTab}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
              onResetDemo={handleResetData}
              isResetting={isResetting}
            />
          }
        >
          <div className="animate-in fade-in duration-200">{children}</div>
        </ConsoleShell>
      </div>
    </PortalGuard>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  )
}
