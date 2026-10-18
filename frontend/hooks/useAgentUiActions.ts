'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'

export interface AgentUiActionPayload {
  type: 'navigate' | 'ui_action'
  portal?: string
  action?: string
  target?: string
  tab?: string
  label?: string
  selector?: string
  details?: string
  reason?: string
}

export interface AgentActionHandlers {
  // Merchant actions
  onOpenAddStaff?: () => void
  onOpenAddService?: () => void
  onOpenChangePaypal?: () => void
  onOpenChangePolicy?: () => void
  onOpenCopilot?: () => void
  onFilterHolds?: () => void
  onFilterCaptured?: () => void
  onFilterVoided?: () => void

  // Admin actions
  onOpenAddSalon?: () => void
  onOpenAddOverride?: () => void
  onOpenAddCategory?: () => void
  onOpenInviteStaff?: () => void
  onFilterPolicyRequests?: () => void
  onFilterPaypalRequests?: () => void

  // Generic action handler
  onAction?: (payload: AgentUiActionPayload) => void
}

export function highlightElement(selector: string, durationMs = 3500) {
  if (typeof document === 'undefined') return
  try {
    const el = document.querySelector(selector) as HTMLElement | null
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('agent-element-spotlight')

    window.setTimeout(() => {
      el.classList.remove('agent-element-spotlight')
    }, durationMs)
  } catch (err) {
    console.debug('Failed to highlight element with selector:', selector, err)
  }
}

export function dispatchAgentUiAction(payload: AgentUiActionPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<AgentUiActionPayload>('salondesk:ui_action', { detail: payload }),
  )
}

export function useAgentUiActions(handlers: AgentActionHandlers = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AgentUiActionPayload>
      const detail = customEvent.detail
      if (!detail) return

      if (detail.selector) {
        highlightElement(detail.selector)
      }

      if (detail.type === 'ui_action' && detail.action) {
        switch (detail.action) {
          // Merchant
          case 'open_add_staff':
            handlers.onOpenAddStaff?.()
            break
          case 'open_add_service':
            handlers.onOpenAddService?.()
            break
          case 'open_change_paypal':
            handlers.onOpenChangePaypal?.()
            break
          case 'open_change_policy':
            handlers.onOpenChangePolicy?.()
            break
          case 'open_copilot':
            handlers.onOpenCopilot?.()
            break
          case 'filter_holds':
            handlers.onFilterHolds?.()
            break
          case 'filter_captured':
            handlers.onFilterCaptured?.()
            break
          case 'filter_voided':
            handlers.onFilterVoided?.()
            break

          // Admin
          case 'open_add_salon':
            handlers.onOpenAddSalon?.()
            break
          case 'open_add_override':
            handlers.onOpenAddOverride?.()
            break
          case 'open_add_category':
            handlers.onOpenAddCategory?.()
            break
          case 'open_invite_staff':
            handlers.onOpenInviteStaff?.()
            break
          case 'filter_policy_requests':
            handlers.onFilterPolicyRequests?.()
            break
          case 'filter_paypal_requests':
            handlers.onFilterPaypalRequests?.()
            break

          default:
            handlers.onAction?.(detail)
            break
        }

        if (detail.label) {
          toast.success(`Agent opened ${detail.label}`, toastColor.success)
        }
      } else if (detail.type === 'navigate' && detail.label) {
        toast.info(`Agent navigating to ${detail.label}`, toastColor.info)
      }
    }

    window.addEventListener('salondesk:ui_action', handleEvent)
    return () => {
      window.removeEventListener('salondesk:ui_action', handleEvent)
    }
  }, [handlers])
}
