'use client'

import { Edit2, Loader2, Plus, Tags } from 'lucide-react'
import { useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, IconButton } from '@/components/ui'
import { useGetAdminCategoriesQuery } from '@/store/slice/adminApi'
import type { ApiServiceCategory } from '@/types/api-org'

import { CategoryFormModal } from '../_components/category-form-modal'

export default function AdminTaxonomyPage() {
  const { data: categories = [], isLoading, isError, refetch } = useGetAdminCategoriesQuery()
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading categories…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <p>Could not load categories.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !isError && categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Tags className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No categories yet</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4">
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
