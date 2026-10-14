import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  Filter,
  PlusCircle,
  Search,
  Settings,
  SquarePen,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { type ChangeEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react'

import PageSkeletonLoader from '@/components/loader/PageSkeletonLoader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableItemPerPageList } from '@/constant/table'
import { isRemoteImageSrc, resolveImageSrc } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'
import type { DataGridProps } from '@/types/table'

import PrimaryButton from '../button/PrimaryButton'
import { RefreshButton } from '../button/RefreshButton'
import EmptyState from '../empty/EmptyState'
import { renderPageNumbers } from './Pagination'

type RowWithAvatar = {
  avatar?: string
  avatarUrl?: string
}

const tableSelectCheckboxClassName =
  'after:hidden size-4 rounded-md border-border bg-background text-primary-foreground shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground'

const getAvatarSource = (row: unknown): string | null => {
  if (!row || typeof row !== 'object') {
    return null
  }
  const avatarRow = row as RowWithAvatar
  return avatarRow.avatarUrl ?? avatarRow.avatar ?? null
}

/** Server-paginated grids often only receive the current page's rows in `data`. */
function resolveTotalItems(
  totalItemsProp: number | undefined,
  options: {
    manualPagination: boolean
    currentPage: number
    totalPages: number
    pageSize: number
    dataLength: number
  },
): number {
  if (totalItemsProp !== undefined) {
    return totalItemsProp
  }

  const { manualPagination, currentPage, totalPages, pageSize, dataLength } = options

  if (!manualPagination) {
    return dataLength
  }

  if (totalPages <= 0) {
    return dataLength
  }

  if (currentPage === totalPages) {
    return (totalPages - 1) * pageSize + dataLength
  }

  return totalPages * pageSize
}

export function BasicDataGrid<T>({
  data,
  columns,
  title,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showColumnSelector = false,
  showPagination = true,
  showRowSelection = false,
  isFetching = false,
  refetch,
  currentPage = 1,
  totalPages = 1,
  totalItems: totalItemsProp,
  itemsPerPage = 10,
  onItemPerPageChange,
  onPageChange,
  onSearch,
  rowClickPath,
  onRowSelectionChange,
  onFilterClick,
  showFilter = false,
  onAddClick,
  showAddButton = false,
  buttonTitle = 'Add',
  showActions = true,
  onView,
  onEdit,
  onDelete,
  onSuspend,
  customButtons,
  onSortChange,
  initialSort,
  initialSearchValue,
  showItemsPerPage = false,
  isLoading = false,
  className,
}: DataGridProps<T>) {
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage)
  const randomNum = useRef(Math.floor(Math.random() * 1000) + 1)
  const [sorting, setSorting] = useState<SortingState>(
    initialSort ? [{ id: initialSort.id, desc: initialSort.desc }] : [],
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState(initialSearchValue ?? '')
  const onRowSelectionChangeCallback = useRef(onRowSelectionChange)
  onRowSelectionChangeCallback.current = onRowSelectionChange
  useEffect(() => {
    setItemsPerPageState(itemsPerPage)
  }, [itemsPerPage])

  useEffect(() => {
    setSearchQuery(initialSearchValue ?? '')
  }, [initialSearchValue])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (onSearch) {
      onSearch(value)
      return
    }
    setGlobalFilter(value)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPageState(value)
    if (onItemPerPageChange) {
      onItemPerPageChange(value)
    }
    if (onPageChange) {
      onPageChange(1)
    }
  }

  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    const result: ColumnDef<T>[] = []

    if (showRowSelection) {
      result.push({
        id: 'select',
        sortingFn: 'textCaseSensitive',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className={tableSelectCheckboxClassName}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className={tableSelectCheckboxClassName}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }

    columns.forEach((column) => {
      result.push({
        id: column.id,
        sortingFn: 'textCaseSensitive',
        accessorKey: column.accessorKey as string,
        header: ({ column: col }) => {
          if (!column.sortable) {
            return <span className="">{column.header}</span>
          }
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const isSorted = col.getIsSorted()
                let newSort: { id: string; desc: boolean } | null = null

                if (isSorted === 'asc') {
                  newSort = { id: column.id, desc: true }
                } else if (isSorted === 'desc') {
                  newSort = null
                } else {
                  newSort = { id: column.id, desc: false }
                }

                setSorting(newSort ? [{ id: newSort.id, desc: newSort.desc }] : [])

                if (onSortChange) {
                  onSortChange(newSort)
                }
              }}
              className={`px-2 hover:bg-accent h-7 ${
                col.getIsSorted() ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="font-medium tracking-wide text-xs uppercase">{column.header}</span>
              {col.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-1.5 h-3 w-3 text-primary" />
              ) : col.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-1.5 h-3 w-3 text-primary" />
              ) : (
                <ArrowUpDown className="ml-1.5 h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          if (column.cell) {
            return column.cell(row.original)
          }
          const avatarSrc = column.id === 'name' ? getAvatarSource(row.original) : null
          if (avatarSrc) {
            return (
              <div className="flex items-center gap-2">
                <Image
                  width={36}
                  height={36}
                  src={resolveImageSrc(avatarSrc)}
                  alt={String(row.getValue(column.id))}
                  className="w-9 h-9 rounded-full object-cover border border-border"
                  unoptimized={isRemoteImageSrc(avatarSrc)}
                />
                <span className="text-sm text-foreground">{String(row.getValue(column.id))}</span>
              </div>
            )
          }
          if (rowClickPath && column.id === 'name') {
            return (
              <Link
                href={rowClickPath(row.original)}
                className="text-link-text hover:text-link-hover-text hover:underline transition-colors duration-200 text-sm"
              >
                {String(row.getValue(column.id))}
              </Link>
            )
          }
          return <div className="text-sm text-foreground">{String(row.getValue(column.id))}</div>
        },
        enableSorting: column.sortable,
        enableHiding: column.filterable,
      })
    })

    if (showActions) {
      result.push({
        id: `actions-sample-${randomNum.current}`,

        header: () => (
          <span className="text-primary/80 font-medium tracking-wide text-xs uppercase">
            {'Actions'}
          </span>
        ),
        enableHiding: false,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex gap-1.5">
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                onClick={() => onEdit(row.original)}
              >
                <SquarePen className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 cursor-pointer"
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
            {onView && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                onClick={() => onView(row.original)}
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">Detail</span>
              </Button>
            )}
            {onSuspend && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground transition-all duration-200 hover:bg-secondary/15 hover:text-secondary"
                onClick={() => onSuspend(row.original)}
              >
                <span className="sr-only">Suspend</span>S
              </Button>
            )}
          </div>
        ),
      })
    }

    return result
  }, [
    columns,
    showRowSelection,
    rowClickPath,
    showActions,
    onView,
    onEdit,
    onDelete,
    onSuspend,
    onSortChange,
  ])

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    initialState: {
      pagination: {
        pageSize: itemsPerPage,
      },
      sorting: initialSort ? [{ id: initialSort.id, desc: initialSort.desc }] : [],
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    ...(onSearch ? {} : { onGlobalFilterChange: setGlobalFilter }),
    getCoreRowModel: getCoreRowModel(),
    ...(onPageChange ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    ...(onSearch ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(onSearch ? {} : { globalFilter }),
      ...(onPageChange
        ? {
            pagination: {
              pageIndex: Math.max(currentPage - 1, 0),
              pageSize: itemsPerPageState,
            },
          }
        : {}),
    },
    manualSorting: true,
    manualPagination: Boolean(onPageChange),
    ...(onPageChange ? { pageCount: totalPages } : {}),
  })

  useEffect(() => {
    if (onRowSelectionChangeCallback.current) {
      const selectedRows = table.getSelectedRowModel().flatRows.map((row) => row.original)
      onRowSelectionChangeCallback.current(selectedRows)
    }
  }, [table.getSelectedRowModel])

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    } else {
      table.setPageIndex(page - 1)
    }
  }

  const resolvedTotalItems = resolveTotalItems(totalItemsProp, {
    manualPagination: Boolean(onPageChange),
    currentPage,
    totalPages,
    pageSize: itemsPerPageState,
    dataLength: data.length,
  })

  return (
    <div
      className={cn(
        'mx-auto w-full space-y-6 rounded-2xl bg-background px-3 pb-4 pt-2 lg:px-4 xl:pb-5',
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between">
          <div className="relative">
            <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">
              {title}
            </h2>
            <div className="luxury-line w-12 mt-1"></div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xl lg:flex-1 mr-1">
          {showSearch && (
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
                aria-hidden
              />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearch}
                className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white py-0 pl-10 pr-4 text-[13px] text-[#111827] placeholder:text-[#64748B] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {refetch && <RefreshButton onClick={() => refetch()} isLoading={isFetching} size="sm" />}
          {showColumnSelector && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 border-border bg-secondary/20 text-foreground hover:border-primary/40 hover:bg-accent/45"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="text-sm">{'Customize'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id.replace(/_/g, ' ')}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showFilter && (
            <button
              type="button"
              className="flex cursor-pointer flex-row items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 h-11 transition-all duration-200 hover:bg-primary hover:text-white text-primary"
              onClick={onFilterClick}
            >
              <Filter className="h-4 w-4 " />
              <span className="text-sm font-medium ">Filter</span>
            </button>
          )}

          {showItemsPerPage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 rounded-full gap-2 border-border bg-card px-4 text-foreground hover:border-primary/35 hover:bg-accent/35 shadow-none"
                >
                  <span className="text-sm font-normal">
                    {itemsPerPageState} {'per page'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                {TableItemPerPageList.map((num) => (
                  <DropdownMenuCheckboxItem
                    key={num}
                    checked={itemsPerPageState === num}
                    onCheckedChange={() => handleItemsPerPageChange(num)}
                    className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {num}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showAddButton && (
            <PrimaryButton
              size="lg"
              title={buttonTitle}
              icon={<PlusCircle className="h-3.5 w-3.5" />}
              onClick={onAddClick}
              variant="default"
              type="button"
              className="h-10 text-base rounded-[48px] px-6 min-w-32 max-w-fit shadow-none"
            />
          )}

          {customButtons?.map((button, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: action nodes may not have stable ids
            <Fragment key={index}>{button}</Fragment>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card shadow-none ring-1 ring-border/35">
        <Table>
          <TableHeader className="border-b border-border bg-muted/45">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/80 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&_tr]:border-b-0">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tanstackColumns.length} className="p-4">
                  <PageSkeletonLoader
                    variant="table"
                    rows={Math.max(Math.min(itemsPerPageState, 8), 4)}
                    columns={Math.max(tanstackColumns.length, 3)}
                  />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`border-b-0 transition-colors duration-150 hover:bg-accent/35 ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/22'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tanstackColumns.length} className="p-4">
                  <EmptyState
                    icon={<Search />}
                    title={'No results found'}
                    className="w-full border-0 bg-muted/10"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="w-full ">
          {renderPageNumbers(
            currentPage,
            totalPages,
            resolvedTotalItems,
            itemsPerPageState,
            handlePageChange,
          )}
        </div>
      )}
    </div>
  )
}
