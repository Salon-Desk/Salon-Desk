'use client'

import {
  Button,
  ConfirmDialog,
  FormActions,
  Modal,
  SelectField,
  TextareaField,
  TextField,
} from '@/components/ui'
import type { TaxonomyCategory } from '@/types'

export interface CategoryFormState {
  name: string
  slug: string
  description: string
  iconName: string
  displayOrder: string
}

interface CategoryModalProps {
  editingCategory: TaxonomyCategory | null
  form: CategoryFormState
  onChange: (form: CategoryFormState) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function CategoryModal({
  editingCategory,
  form,
  onChange,
  onClose,
  onSubmit,
}: CategoryModalProps) {
  return (
    <Modal
      onClose={onClose}
      size="sm"
      title={
        editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Taxonomy Category'
      }
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <TextField
          label="Category Name"
          required
          value={form.name}
          onChange={(name) => onChange({ ...form, name })}
          placeholder="e.g. Bridal & Event Styling"
        />

        <TextField
          label="URL Slug"
          mono
          value={form.slug}
          onChange={(slug) => onChange({ ...form, slug })}
          placeholder="e.g. bridal-event-styling"
        />

        <TextareaField
          label="Description"
          value={form.description}
          onChange={(description) => onChange({ ...form, description })}
          placeholder="Summary of service offerings covered under this tag..."
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Display Priority"
            mono
            value={form.displayOrder}
            onChange={(displayOrder) => onChange({ ...form, displayOrder })}
          />
          <SelectField
            label="Icon Identifier"
            value={form.iconName}
            onChange={(iconName) => onChange({ ...form, iconName })}
            options={[
              { value: 'Scissors', label: 'Scissors' },
              { value: 'Sparkles', label: 'Sparkles' },
              { value: 'Palette', label: 'Palette' },
              { value: 'Flower2', label: 'Flower / Spa' },
              { value: 'Crown', label: 'Crown / Shave' },
              { value: 'HeartHandshake', label: 'Heart / Bridal' },
            ]}
          />
        </div>

        <FormActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{editingCategory ? 'Update Category' : 'Create Category'}</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

interface DeleteCategoryModalProps {
  category: TaxonomyCategory
  onClose: () => void
  onConfirm: () => void
}

export function DeleteCategoryModal({ category, onClose, onConfirm }: DeleteCategoryModalProps) {
  return (
    <ConfirmDialog
      title={`Delete Category: ${category.name}`}
      description="Are you sure you want to remove this category? Salons mapped to this tag will fall back to general styling."
      confirmLabel="Delete Category"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
