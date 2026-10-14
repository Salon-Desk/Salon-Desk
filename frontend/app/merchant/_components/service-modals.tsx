'use client'

import type { FormEvent } from 'react'

import {
  Button,
  ConfirmDialog,
  FormActions,
  Modal,
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from '@/components/ui'
import type { SalonService } from '@/types'

export interface ServiceFormState {
  name: string
  category: SalonService['category']
  durationMin: number
  price: number
  holdDeposit: number
  noShowFee: number
  description: string
}

export const DEFAULT_SERVICE_FORM: ServiceFormState = {
  name: '',
  category: 'Braids & Locs',
  durationMin: 120,
  price: 120,
  holdDeposit: 120,
  noShowFee: 30,
  description: '',
}

const SERVICE_CATEGORIES: SalonService['category'][] = [
  'Braids & Locs',
  'Styling & Color',
  'Haircuts',
  'Beard & Grooming',
  'Spa & Facial',
]

interface ServiceFormModalProps {
  editingService: SalonService | null
  form: ServiceFormState
  onChange: (next: ServiceFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

interface DeleteServiceModalProps {
  service: SalonService
  onClose: () => void
  onConfirm: () => void
}

export function ServiceFormModal({
  editingService,
  form,
  onChange,
  onClose,
  onSubmit,
}: ServiceFormModalProps) {
  return (
    <Modal
      onClose={onClose}
      size="md"
      title={editingService ? `Edit Service: ${editingService.name}` : 'Create New Salon Service'}
    >
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <TextField
          label="Service Name"
          required
          value={form.name}
          onChange={(name) => onChange({ ...form, name })}
          placeholder="e.g. Knotless Micro Braids"
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Category"
            value={form.category}
            onChange={(category) =>
              onChange({
                ...form,
                category: category as SalonService['category'],
              })
            }
            options={SERVICE_CATEGORIES.map((category) => ({
              value: category,
              label: category,
            }))}
          />
          <NumberField
            label="Duration (minutes)"
            value={form.durationMin}
            min={15}
            step={15}
            onChange={(durationMin) => onChange({ ...form, durationMin })}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="Price ($)"
            value={form.price}
            min={10}
            onChange={(price) => onChange({ ...form, price, holdDeposit: price })}
          />
          <NumberField
            label="Hold Deposit ($)"
            value={form.holdDeposit}
            min={10}
            onChange={(holdDeposit) => onChange({ ...form, holdDeposit })}
          />
          <NumberField
            label="No-Show Fee ($)"
            value={form.noShowFee}
            min={5}
            onChange={(noShowFee) => onChange({ ...form, noShowFee })}
          />
        </div>

        <TextareaField
          label="Service Description"
          value={form.description}
          onChange={(description) => onChange({ ...form, description })}
          placeholder="Includes hair prep and botanical steam rinse..."
          rows={2}
        />

        <FormActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editingService ? 'Update Service' : 'Create Service'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

export function DeleteServiceModal({ service, onClose, onConfirm }: DeleteServiceModalProps) {
  return (
    <ConfirmDialog
      title={`Delete Service: ${service.name}`}
      description="Are you sure you want to remove this service offering? Existing bookings will retain their original price and hold terms."
      confirmLabel="Delete Service"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
