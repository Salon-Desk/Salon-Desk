export type SearchableListControls = {
  onSearchChange: (query: string) => void
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
  total: number
}
