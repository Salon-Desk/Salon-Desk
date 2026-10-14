'use client'

import {
  type AdminDashboardState,
  adminStore,
  clientStore,
  type ClientStoreState,
  type MerchantConsoleState,
  merchantStore,
} from '@/lib/store'

import { type PersistentStoreHandle, usePersistentStore } from './use-persistent-store'

export function useClientStore(): PersistentStoreHandle<ClientStoreState> {
  return usePersistentStore(clientStore)
}

export function useMerchantStore(): PersistentStoreHandle<MerchantConsoleState> {
  return usePersistentStore(merchantStore)
}

export function useAdminStore(): PersistentStoreHandle<AdminDashboardState> {
  return usePersistentStore(adminStore)
}
