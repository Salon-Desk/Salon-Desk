'use client'

import { Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { type ReactNode, Suspense, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ConsoleShell } from '@/components/layout/console-shell'
import { PortalGuard } from '@/components/layout/portal-guard'
import { Toast } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { buildAdminCategoriesNavApiParams } from '@/lib/listing-params/admin-taxonomy-list-params'
import type { AppDispatch } from '@/store'
import {
  useGetAdminCategoriesQuery,
  useGetAdminDashboardQuery,
  useGetAdminStaffQuery,
} from '@/store/api/platformApi'
import { logout, userSelector } from '@/store/authSlice'
import type { PlatformUser } from '@/types'

import { AdminHeader } from './_components/AdminHeader'
import { AdminSidebar } from './_components/AdminSidebar'
import { getAdminTabFromPathname } from './_constants/admin-nav'
import { AdminProvider, useAdminContext } from './_context/admin-context'

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentTab = getAdminTabFromPathname(pathname)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(userSelector)
  const { skipAdminApi } = useAdminSession()
  const { data: dashboard } = useGetAdminDashboardQuery(undefined, { skip: skipAdminApi })
  const { data: categoriesData } = useGetAdminCategoriesQuery(buildAdminCategoriesNavApiParams(), {
    skip: skipAdminApi,
  })
  const { data: staffData } = useGetAdminStaffQuery(undefined, { skip: skipAdminApi })
  const categories = categoriesData?.items ?? []
  const { message } = useAdminContext()

  const handleLockSession = () => {
    dispatch(logout('admin'))
  }

  return (
    <PortalGuard portal="admin">
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 selection:bg-amber-500/20">
        {message ? (
          <Toast
            message={message}
            position="top-right"
            theme="dark"
            icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          />
        ) : null}

        <ConsoleShell
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
          sidebar={
            <AdminSidebar
              activeTab={currentTab}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              organizationCount={dashboard?.total_organizations ?? 0}
              categoryCount={categories.length}
              staffCount={staffData?.length ?? 0}
              pendingCrCount={dashboard?.pending_change_requests ?? 0}
              pendingReviewCount={dashboard?.pending_client_feedback ?? 0}
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
            />
          }
          header={
            <AdminHeader
              activeTab={currentTab}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
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
      <Suspense fallback={null}>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </Suspense>
    </AdminProvider>
  )
}
