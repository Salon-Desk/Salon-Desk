'use client'

import { Edit2, Plus, Tags } from 'lucide-react'
import { useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, IconButton } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useGetAdminCategoriesQuery } from '@/store/api/platformApi'
import type { ApiServiceCategory } from '@/types/api-org'

import { AdminQueryState } from '../_components/admin-query-state'
import { CategoryFormModal } from '../_components/category-form-modal'

export default function AdminTaxonomyPage() {
  const { skipAdminApi } = useAdminSession()
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminCategoriesQuery(undefined, { skip: skipAdminApi })
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<ApiServiceCategory | null>(null)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-xl text-slate-900 sm:text-2xl">Service taxonomy</h1>
          <p className="text-xs text-slate-500">
            {isLoading ? 'Loading…' : `${categories.length} platform categories`}
          </p>
        </div>
        <PrimaryButton
          title="Add category"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-4 w-4" />}
          className="h-9 rounded-xl px-3.5 text-xs"
          onClick={() => {
            setEditing(null)
            setIsOpen(true)
          }}
        />
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading categories…"
        errorLabel="Could not load categories."
      >
        {!isLoading && !isError && categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Tags className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2.5 text-sm font-medium text-slate-700">No categories yet</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{category.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {category.description || 'No description'}
                  </p>
                </div>
                <IconButton
                  aria-label="Edit category"
                  onClick={() => {
                    setEditing(category)
                    setIsOpen(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      </AdminQueryState>

      <CategoryFormModal
        open={isOpen}
        editing={editing}
        onClose={() => {
          setIsOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
