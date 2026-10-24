// types/table.ts

import type { ReactNode } from 'react'

export type ColumnDefinition<T> = {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => ReactNode
  sortable?: boolean
  filterable?: boolean
  headerClassName?: string
  cellClassName?: string
}

export type DataGridProps<T> = {
  // Data
  data: T[]
  columns: ColumnDefinition<T>[]
  isFetching?: boolean
  refetch?: () => void
  // Basic configuration
  title?: string
  searchPlaceholder?: string

  // Feature toggles
  showSearch?: boolean
  showColumnSelector?: boolean
  showPagination?: boolean
  showRowSelection?: boolean
  showActions?: boolean
  showFilter?: boolean
  showAddButton?: boolean
  showItemsPerPage?: boolean

  isLoading?: boolean

  // Pagination
  currentPage?: number
  totalPages?: number
  /** Total row count from the server (for footer stats). Falls back to `data.length` when omitted. */
  totalItems?: number
  itemsPerPage?: number
  onItemPerPageChange?: (i: number) => void
  onPageChange?: (page: number) => void

  // Search
  onSearch?: (query: string) => void
  initialSearchValue?: string

  // Row interactions
  rowClickPath?: (row: T) => string
  onRowSelectionChange?: (selectedRows: T[]) => void

  // Filter
  onFilterClick?: () => void

  // Add button
  onAddClick?: () => void
  buttonTitle?: string

  // Action handlers
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onSuspend?: (row: T) => void
  onMakeAdmin?: (row: T) => void

  // Custom buttons
  customButtons?: React.ReactNode[]

  // Sorting
  onSortChange?: (sort: { id: string; desc: boolean } | null) => void
  initialSort?: { id: string; desc: boolean } | null

  // Styling props ✨ NEW ✨
  className?: string // Main container class
  tableClassName?: string // Table wrapper class
  headerClassName?: string // Table header class
  rowClassName?: string // Table row class
  cellClassName?: string // Table cell class
}

// Filter types
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | Array<string | number | boolean | null | undefined | object>

export type Filters = Record<string, FilterValue>

// Table state management
export interface UseTableStateProps {
  defaultPage?: number
  defaultLimit?: number
  defaultSearch?: string
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'
  defaultFilters?: Filters
  debounceDelay?: number
}

export interface UseTableStateReturn {
  // Pagination
  page: number
  limit: number

  // Search
  search: string
  debouncedSearch: string

  // Sorting
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Additional filters
  filters: Filters

  // Handlers
  handlePageChange: (newPage: number) => void
  handleSearch: (searchTerm: string) => void
  handleLimitChange: (newLimit: number) => void
  handleSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  handleFilterChange: (filters: Filters) => void
  setFilter: (key: string, value: FilterValue) => void
  removeFilter: (key: string) => void

  // Utilities
  getQueryParams: () => Record<string, FilterValue>
  resetFilters: () => void
  resetAll: () => void
}
