'use client'

import { type ReactNode, Suspense } from 'react'

import { AdminLayoutInner } from './_components/AdminLayoutInner'
import { AdminProvider } from './_context/AdminContext'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <Suspense fallback={null}>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </Suspense>
    </AdminProvider>
  )
}
