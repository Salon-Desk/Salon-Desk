'use client'

import clsx from 'clsx'
import { type ReactNode, useState } from 'react'

type TabItem = {
  label: string
  value: string
  icon?: ReactNode
}

type ToggleTabsProps = {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  itemClassName?: string
  activeClassName?: string
  inactiveClassName?: string
}

const ToggleTabs = ({
  items,
  defaultValue,
  value,
  onChange,
  className,
  itemClassName,
  activeClassName,
  inactiveClassName,
}: ToggleTabsProps) => {
  const [uncontrolledActive, setUncontrolledActive] = useState(
    defaultValue ?? items[0]?.value ?? '',
  )
  const isControlled = value !== undefined
  const active = isControlled ? value : uncontrolledActive

  const handleChange = (next: string) => {
    if (!isControlled) {
      setUncontrolledActive(next)
    }
    onChange?.(next)
  }

  return (
    <div
      className={clsx(
        'inline-flex w-full items-center gap-1 rounded-full border border-border bg-[#F2F2F2] p-1 sm:w-fit',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = active === item.value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => handleChange(item.value)}
            className={clsx(
              'flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 sm:flex-none sm:text-[15px]',
              itemClassName,
              isActive
                ? clsx('bg-white text-foreground shadow-sm', activeClassName)
                : clsx(
                    'bg-transparent text-foreground/70 hover:bg-black/5 hover:text-foreground',
                    inactiveClassName,
                  ),
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ToggleTabs
