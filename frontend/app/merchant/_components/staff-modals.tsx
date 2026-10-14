'use client'

import type { FormEvent } from 'react'

import {
  Button,
  ConfirmDialog,
  FormActions,
  Modal,
  NumberField,
  SelectField,
  TextField,
} from '@/components/ui'
import type { StaffMember } from '@/types'

export interface StaffFormState {
  name: string
  role: string
  workingHours: string
  breakPeriod: string
  specialties: string
  maxSimultaneousClients: number
  status: 'ACTIVE' | 'ON_LEAVE'
}

export const DEFAULT_STAFF_FORM: StaffFormState = {
  name: '',
  role: 'Senior Braider & Texture Specialist',
  workingHours: '9:00 AM - 6:00 PM',
  breakPeriod: '1:00 PM - 2:00 PM',
  specialties: 'Knotless Braids, Silk Press, Locs Retwist',
  maxSimultaneousClients: 2,
  status: 'ACTIVE',
}

interface StaffFormModalProps {
  editingStaff: StaffMember | null
  form: StaffFormState
  onChange: (next: StaffFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

interface DeleteStaffModalProps {
  staff: StaffMember
  onClose: () => void
  onConfirm: () => void
}

export function StaffFormModal({
  editingStaff,
  form,
  onChange,
  onClose,
  onSubmit,
}: StaffFormModalProps) {
  return (
    <Modal
      onClose={onClose}
      size="md"
      title={editingStaff ? `Edit Stylist: ${editingStaff.name}` : 'Add New Salon Stylist'}
    >
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <TextField
          label="Stylist Full Name"
          required
          value={form.name}
          onChange={(name) => onChange({ ...form, name })}
          placeholder="e.g. Jordan Vance"
        />
        <TextField
          label="Role / Title"
          value={form.role}
          onChange={(role) => onChange({ ...form, role })}
          placeholder="e.g. Senior Braider & Texture Specialist"
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Working Hours"
            value={form.workingHours}
            onChange={(workingHours) => onChange({ ...form, workingHours })}
            placeholder="9:00 AM - 6:00 PM"
          />
          <TextField
            label="Break Period"
            value={form.breakPeriod}
            onChange={(breakPeriod) => onChange({ ...form, breakPeriod })}
            placeholder="1:00 PM - 2:00 PM"
          />
        </div>

        <TextField
          label="Specialties (comma-separated)"
          value={form.specialties}
          onChange={(specialties) => onChange({ ...form, specialties })}
          placeholder="Knotless Braids, Silk Press, Locs"
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Max Simultaneous Clients"
            value={form.maxSimultaneousClients}
            min={1}
            max={4}
            onChange={(maxSimultaneousClients) => onChange({ ...form, maxSimultaneousClients })}
          />
          <SelectField
            label="Availability Status"
            value={form.status}
            onChange={(status) => onChange({ ...form, status: status as StaffFormState['status'] })}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE (On Schedule)' },
              { value: 'ON_LEAVE', label: 'ON_LEAVE' },
            ]}
          />
        </div>

        <FormActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editingStaff ? 'Update Stylist' : 'Save Stylist'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

export function DeleteStaffModal({ staff, onClose, onConfirm }: DeleteStaffModalProps) {
  return (
    <ConfirmDialog
      title={`Remove Stylist: ${staff.name}`}
      description="Are you sure you want to remove this stylist from the salon directory? Any open appointments must be reassigned before removal."
      confirmLabel="Confirm Removal"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
