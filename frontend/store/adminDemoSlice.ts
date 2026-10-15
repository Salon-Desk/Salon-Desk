import { createAction, createReducer } from '@reduxjs/toolkit'

import { type AdminDashboardState, seedAdminState } from '@/lib/store/admin-store'
import type { StateUpdater } from '@/lib/store/create-persistent-store'

const STORAGE_KEY = 'salondesk:admin-dashboard:v2'

export function readAdminDemoFromStorage(): AdminDashboardState {
  if (typeof window === 'undefined') return seedAdminState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AdminDashboardState
  } catch {
    /* corrupt payload */
  }
  return seedAdminState()
}

function persistAdminDemo(state: AdminDashboardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private mode */
  }
}

export const patchAdminDemo = createAction<StateUpdater<AdminDashboardState>>('adminDemo/patch')
export const resetAdminDemo = createAction('adminDemo/reset')
export const hydrateAdminDemo = createAction<AdminDashboardState>('adminDemo/hydrate')

export const adminDemoReducer = createReducer(seedAdminState(), (builder) => {
  builder
    .addCase(hydrateAdminDemo, (_, action) => action.payload)
    .addCase(patchAdminDemo, (state, action) => {
      const next =
        typeof action.payload === 'function'
          ? action.payload(state)
          : { ...state, ...action.payload }
      persistAdminDemo(next)
      return next
    })
    .addCase(resetAdminDemo, () => {
      const fresh = seedAdminState()
      persistAdminDemo(fresh)
      return fresh
    })
})
