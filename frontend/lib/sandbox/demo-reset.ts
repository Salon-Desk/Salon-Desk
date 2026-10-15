import { store } from '@/store'
import { resetAdminDemo } from '@/store/adminDemoSlice'
import { resetClientDemo } from '@/store/clientDemoSlice'
import { resetMerchantDemo } from '@/store/merchantDemoSlice'

export function resetClientDemoState(): void {
  store.dispatch(resetClientDemo())
}

export function resetMerchantDemoState(): void {
  store.dispatch(resetMerchantDemo())
}

export function resetAdminDemoState(): void {
  store.dispatch(resetAdminDemo())
}

export function resetAllDemoStores(): void {
  resetClientDemoState()
  resetMerchantDemoState()
  resetAdminDemoState()
}
