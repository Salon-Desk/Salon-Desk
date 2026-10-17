import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface VoiceAgentShellProps {
  children: ReactNode
  className?: string
}

export function VoiceAgentShell({ children, className }: VoiceAgentShellProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#FAFAFA] via-white to-amber-50/20 px-6 py-8',
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
