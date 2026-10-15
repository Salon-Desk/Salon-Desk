import { createAction, createReducer } from '@reduxjs/toolkit'

import { type ClientStoreState, seedClientState } from '@/lib/store/client-store'
import type { StateUpdater } from '@/lib/store/create-persistent-store'

const STORAGE_KEY = 'salondesk:client-state:v1'

export function readClientDemoFromStorage(): ClientStoreState {
  if (typeof window === 'undefined') return seedClientState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ClientStoreState
  } catch {
    /* corrupt payload */
  }
  return seedClientState()
}

function persistClientDemo(state: ClientStoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private mode */
  }
}

export const patchClientDemo = createAction<StateUpdater<ClientStoreState>>('clientDemo/patch')
export const resetClientDemo = createAction('clientDemo/reset')
export const hydrateClientDemo = createAction<ClientStoreState>('clientDemo/hydrate')

export const clientDemoReducer = createReducer(seedClientState(), (builder) => {
  builder
    .addCase(hydrateClientDemo, (_, action) => action.payload)
    .addCase(patchClientDemo, (state, action) => {
      const next =
        typeof action.payload === 'function'
          ? action.payload(state)
          : { ...state, ...action.payload }
      persistClientDemo(next)
      return next
    })
    .addCase(resetClientDemo, () => {
      const fresh = seedClientState()
      persistClientDemo(fresh)
      return fresh
    })
})
