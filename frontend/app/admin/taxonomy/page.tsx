'use client'

import { CheckCircle2, Copy, Edit2, Layers, Plus, Tags } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Pagination } from '@/components/table/Pagination'
import { Badge, Card, EmptyState, IconButton, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useGetAdminCategoriesQuery } from '@/store/api/platformApi'
import type { ApiServiceCategory } from '@/types/api-org'

import { AdminQueryState } from '../_components/admin-query-state'
import { CategoryFormModal } from '../_components/category-form-modal'

export default function AdminTaxonomyPage() {
  const { skipAdminApi } = useAdminSession()
  const {
    data: categoriesData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCategoriesQuery(undefined, { skip: skipAdminApi })
  const categories = categoriesData?.items ?? []
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<ApiServiceCategory | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('Category UUID copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize))
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-xl text-slate-900 tracking-tight sm:text-2xl">
            Service Taxonomy &amp; Categories
          </h1>
          <p className="text-xs text-slate-500">
            {isLoading
              ? 'Loading…'
              : `${categories.length} platform taxonomy categories for service classification`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            placeholder="Search categories…"
            className="w-48 sm:w-64 text-xs"
          />
          <PrimaryButton
            title="Add category"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-4 w-4" />}
            className="h-9 rounded-lg px-3.5 text-xs font-semibold shadow-xs"
            onClick={() => {
              setEditing(null)
              setIsOpen(true)
            }}
          />
        </div>
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading categories…"
        errorLabel="Could not load categories."
      >
        {!isLoading && !isError && categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No service categories yet"
            description="Create categories like Hair Styling, Coloring, Spa, or Treatments to classify salon service menus."
            action={
              <PrimaryButton
                title="Create category"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="h-8.5 rounded-lg px-4 text-xs"
                onClick={() => {
                  setEditing(null)
                  setIsOpen(true)
                }}
              />
            }
          />
        ) : null}

        <div className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {paginatedCategories.map((category) => (
              <Card
                key={category.id}
                className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 font-bold border border-amber-200/60">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                          {category.name}
                        </h3>
                        <Badge tone="slate" size="sm">
                          Standard Taxonomy
                        </Badge>
                      </div>
                    </div>

                    <IconButton
                      aria-label="Edit category"
                      onClick={() => {
                        setEditing(category)
                        setIsOpen(true)
                      }}
                      className="rounded-lg"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {category.description || 'Platform service category classification.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <button
                    type="button"
                    onClick={() => handleCopyId(category.id)}
                    className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy category UUID"
                  >
                    <span>ID: {category.id.slice(0, 8)}…</span>
                    {copiedId === category.id ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                  <span className="text-emerald-700 font-sans font-medium text-[11px]">Active</span>
                </div>
              </Card>
            ))}
          </div>

          {filteredCategories.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              pageSize={pageSize}
              setCurrentPage={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[4, 6, 12, 24]}
            />
          )}
        </div>
      </AdminQueryState>

      <CategoryFormModal
        open={isOpen}
        editing={editing}
        onClose={() => {
          setIsOpen(false)
          setEditing(null)
          void refetch()
        }}
      />
    </div>
  )
}
