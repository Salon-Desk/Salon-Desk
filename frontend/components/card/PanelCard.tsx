import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PanelCardProps = {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  /** `panel` = 8px radius (chart/KPI sections), `table` = 12px + 24px padding */
  variant?: 'panel' | 'table'
}

export function PanelCard({
  title,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'panel',
}: PanelCardProps) {
  const isTable = variant === 'table'

  return (
    <section
      className={cn(
        'flex flex-col border border-[#E5E7EB] bg-white',
        isTable ? 'gap-5 rounded-xl p-6' : 'gap-4 rounded-lg p-5',
        className,
      )}
    >
      {title || action ? (
        <header
          className={cn(
            'flex items-center justify-between gap-3',
            isTable && 'min-h-[22px]',
            headerClassName,
          )}
        >
          {title ? (
            <h2
              className={cn(
                'font-extrabold text-[#111827]',
                isTable ? 'text-lg leading-[22px]' : 'text-base leading-[19px]',
              )}
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      ) : null}
      <div className={cn('min-w-0', contentClassName)}>{children}</div>
    </section>
  )
}

export default PanelCard
