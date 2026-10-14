'use client'

import {
  Crown,
  Edit2,
  Eye,
  EyeOff,
  Flower2,
  HeartHandshake,
  Palette,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { Badge, Button, Card, IconButton } from '@/components/ui'

import { useAdminContext } from '../_context/admin-context'

const ICON_MAP: Record<string, typeof Scissors> = {
  Scissors,
  Sparkles,
  Palette,
  Flower2,
  Crown,
  HeartHandshake,
}

export default function AdminTaxonomyPage() {
  const {
    state,
    openAddCategory,
    openEditCategory,
    handleToggleCategoryStatus,
    setDeletingCategory,
  } = useAdminContext()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Service Categories &amp; Taxonomy
          </h1>
          <p className="text-slate-500 text-xs">
            {state.categories.length} discovery classifications across partner salons.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddCategory}
          className="rounded-xl px-3.5 py-2 font-medium text-xs shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.categories.map((cat) => {
          const isActive = cat.status === 'ACTIVE'
          const Icon = ICON_MAP[cat.iconName] ?? Scissors

          return (
            <Card
              key={cat.id}
              hoverTone="amber"
              padding="lg"
              className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all hover:shadow-sm"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-2 border-slate-100 border-b pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50 p-2 text-amber-800">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{cat.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400">
                        #{cat.displayOrder} · /{cat.slug}
                      </span>
                    </div>
                  </div>

                  <Badge tone={isActive ? 'emerald' : 'slate'}>{cat.status}</Badge>
                </div>

                <p className="mb-3 text-slate-500 text-xs leading-relaxed">{cat.description}</p>

                <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
                  <span>Services Linked:</span>
                  <span className="font-bold text-slate-900">{cat.servicesCount}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-slate-100 border-t pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleCategoryStatus(cat.id)}
                  className="flex items-center gap-1.5 font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {isActive ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <IconButton
                    title="Edit category"
                    onClick={() => openEditCategory(cat)}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 h-7 w-7 text-slate-600"
                  >
                    <Edit2 className="h-3 w-3" />
                  </IconButton>
                  <IconButton
                    title="Delete category"
                    tone="danger"
                    className="rounded-xl h-7 w-7"
                    onClick={() => setDeletingCategory(cat)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </IconButton>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
