'use client'

import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { AdminDashboardState } from '@/lib/store/admin-store'
import type { ClientStoreState } from '@/lib/store/client-store'
import type { StateUpdater } from '@/lib/store/create-persistent-store'
import type { MerchantConsoleState } from '@/lib/store/merchant-store'
import type { AppDispatch, RootState } from '@/store'
import { patchAdminDemo, resetAdminDemo } from '@/store/adminDemoSlice'
import { patchClientDemo, resetClientDemo } from '@/store/clientDemoSlice'
import { patchMerchantDemo, resetMerchantDemo } from '@/store/merchantDemoSlice'

export interface PersistentStoreHandle<T> {
  state: T
  setState: (updater: StateUpdater<T>) => T
  resetState: () => T
}

export function useClientStore(): PersistentStoreHandle<ClientStoreState> {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector((s: RootState) => s.clientDemo)

  const setState = useCallback(
    (updater: StateUpdater<ClientStoreState>) => {
      dispatch(patchClientDemo(updater))
      return typeof updater === 'function' ? updater(state) : { ...state, ...updater }
    },
    [dispatch, state],
  )

  const resetState = useCallback(() => {
    dispatch(resetClientDemo())
    return state
  }, [dispatch, state])

  return { state, setState, resetState }
}

export function useMerchantStore(): PersistentStoreHandle<MerchantConsoleState> {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector((s: RootState) => s.merchantDemo)

  const setState = useCallback(
    (updater: StateUpdater<MerchantConsoleState>) => {
      dispatch(patchMerchantDemo(updater))
      return typeof updater === 'function' ? updater(state) : { ...state, ...updater }
    },
    [dispatch, state],
  )

  const resetState = useCallback(() => {
    dispatch(resetMerchantDemo())
    return state
  }, [dispatch, state])

  return { state, setState, resetState }
}

export function useAdminStore(): PersistentStoreHandle<AdminDashboardState> {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector((s: RootState) => s.adminDemo)

  const setState = useCallback(
    (updater: StateUpdater<AdminDashboardState>) => {
      dispatch(patchAdminDemo(updater))
      return typeof updater === 'function' ? updater(state) : { ...state, ...updater }
    },
    [dispatch, state],
  )

  const resetState = useCallback(() => {
    dispatch(resetAdminDemo())
    return state
  }, [dispatch, state])

  return { state, setState, resetState }
}
