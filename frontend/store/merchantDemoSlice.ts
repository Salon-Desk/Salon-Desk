import { createAction, createReducer } from '@reduxjs/toolkit'

import type { StateUpdater } from '@/lib/store/create-persistent-store'
import { type MerchantConsoleState, seedMerchantState } from '@/lib/store/merchant-store'

const STORAGE_KEY = 'salondesk:merchant-console:v3'

export function readMerchantDemoFromStorage(): MerchantConsoleState {
  if (typeof window === 'undefined') return seedMerchantState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MerchantConsoleState
  } catch {
    /* corrupt payload */
  }
  return seedMerchantState()
}

function persistMerchantDemo(state: MerchantConsoleState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private mode */
  }
}

export const patchMerchantDemo =
  createAction<StateUpdater<MerchantConsoleState>>('merchantDemo/patch')
export const resetMerchantDemo = createAction('merchantDemo/reset')
export const hydrateMerchantDemo = createAction<MerchantConsoleState>('merchantDemo/hydrate')

export const merchantDemoReducer = createReducer(seedMerchantState(), (builder) => {
  builder
    .addCase(hydrateMerchantDemo, (_, action) => action.payload)
    .addCase(patchMerchantDemo, (state, action) => {
      const next =
        typeof action.payload === 'function'
          ? action.payload(state)
          : { ...state, ...action.payload }
      persistMerchantDemo(next)
      return next
    })
    .addCase(resetMerchantDemo, () => {
      const fresh = seedMerchantState()
      persistMerchantDemo(fresh)
      return fresh
    })
})
