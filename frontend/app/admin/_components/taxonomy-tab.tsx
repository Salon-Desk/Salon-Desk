'use client'

import {
  Crown,
  Edit2,
  Flower2,
  HeartHandshake,
  Palette,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { Badge, Button, Card } from '@/components/ui'
import type { TaxonomyCategory } from '@/types'

interface TaxonomyTabProps {
  categories: TaxonomyCategory[]
  onAddCategory: () => void
  onEditCategory: (category: TaxonomyCategory) => void
  onToggleStatus: (catId: string) => void
  onDeleteCategory: (category: TaxonomyCategory) => void
}

const ICON_MAP: Record<string, typeof Scissors> = {
  Scissors,
  Sparkles,
  Palette,
  Flower2,
  Crown,
  HeartHandshake,
}

export function TaxonomyTab({
  categories,
  onAddCategory,
  onEditCategory,
  onToggleStatus,
  onDeleteCategory,
}: TaxonomyTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-200">
      <div className="flex justify-end">
        <Button onClick={onAddCategory}>
          <Plus className="h-3.5 w-3.5" />
          <span>New category</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const isActive = cat.status === 'ACTIVE'
          const Icon = ICON_MAP[cat.iconName] ?? Scissors

          return (
            <Card
              key={cat.id}
              hoverTone="amber"
              padding="lg"
              className="flex flex-col justify-between"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-amber-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase">
                        #{cat.displayOrder}
                      </span>
                      <h3 className="font-bold text-base text-slate-900">{cat.name}</h3>
                    </div>
                  </div>

                  <Badge tone={isActive ? 'emerald' : 'slate'}>{cat.status}</Badge>
                </div>

                <p className="mb-3 text-slate-600 text-xs leading-relaxed">{cat.description}</p>

                <div className="font-mono text-[11px] text-slate-500">
                  /{cat.slug} · {cat.servicesCount} services
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-slate-100 border-t pt-4">
                <button
                  type="button"
                  onClick={() => onToggleStatus(cat.id)}
                  className="font-semibold text-slate-600 text-xs transition-colors hover:text-slate-900"
                >
                  {isActive ? 'Hide' : 'Activate'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditCategory(cat)}
                    className="rounded-lg border border-slate-200 bg-slate-100 p-1.5 text-slate-700 shadow-xs hover:bg-slate-200"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(cat)}
                    className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 shadow-xs hover:bg-rose-100"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
