'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label'?: string
  shortcut?: string
  className?: string
  autoFocusOnShortcut?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  'aria-label': ariaLabel,
  shortcut = '⌘K',
  className,
  autoFocusOnShortcut = true,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocusOnShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [autoFocusOnShortcut])

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200/80 bg-white py-2 pr-14 pl-9 text-xs text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] transition-all placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          className="-translate-y-1/2 absolute top-1/2 right-2.5 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : shortcut ? (
        <span
          onClick={() => inputRef.current?.focus()}
          className="-translate-y-1/2 absolute top-1/2 right-2.5 inline-flex cursor-pointer items-center rounded-md border border-slate-200/90 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 select-none hover:text-slate-600"
        >
          {shortcut}
        </span>
      ) : null}
    </div>
  )
}
