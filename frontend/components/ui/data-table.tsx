import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  className?: string
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  /** Shown in place of the body when `rows` is empty. */
  emptyState?: ReactNode
  /** Renders cell text in mono — used for the audit ledger. */
  mono?: boolean
  className?: string
}

/**
 * Column-driven table with a shared header/zebra/hover treatment, so the
 * appointment, ledger, directory and commission tables stay visually identical.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyState,
  mono = false,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]',
        className,
      )}
    >
      <table className={cn('w-full text-left text-xs', mono && 'font-mono')}>
        <thead>
          <tr className="border-slate-200/80 border-b bg-slate-50/80 font-semibold text-slate-700">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-sans',
                  column.align === 'right' && 'text-right',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center font-sans text-slate-500 text-xs"
              >
                {emptyState ?? 'No records to display.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="group transition-colors hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3.5 align-middle',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
