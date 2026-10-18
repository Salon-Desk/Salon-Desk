import type { ReactNode } from 'react'

import { type AssistantPortal, portalChrome } from '@/lib/assistant-portal'
import { cn } from '@/lib/utils'

export interface VoiceAgentShellProps {
  children: ReactNode
  portal?: AssistantPortal
  className?: string
}

export function VoiceAgentShell({ children, portal = 'client', className }: VoiceAgentShellProps) {
  const chrome = portalChrome(portal)
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-6 py-8',
        chrome.voiceShellBg,
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
