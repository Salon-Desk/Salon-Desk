'use client'

import { Button, FormActions, Modal, SelectField, TextField } from '@/components/ui'
import type { Organization } from '@/types'

export interface OverrideFormState {
  salonId: string
  customRate: string
  note: string
}

interface AddCommissionOverrideModalProps {
  organizations: Organization[]
  form: OverrideFormState
  onChange: (form: OverrideFormState) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function AddCommissionOverrideModal({
  organizations,
  form,
  onChange,
  onClose,
  onSubmit,
}: AddCommissionOverrideModalProps) {
  return (
    <Modal onClose={onClose} title="Add Partner Commission Override" size="sm">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <SelectField
          label="Select Salon Partner"
          required
          value={form.salonId}
          onChange={(salonId) => onChange({ ...form, salonId })}
          options={[
            { value: '', label: 'Choose a salon...' },
            ...organizations.map((org) => ({
              value: org.id,
              label: org.name,
            })),
          ]}
        />

        <TextField
          label="Custom Rate (%)"
          required
          mono
          value={form.customRate}
          onChange={(customRate) => onChange({ ...form, customRate })}
          placeholder="e.g. 1.8"
        />

        <TextField
          label="Notes / Agreement Reason"
          value={form.note}
          onChange={(note) => onChange({ ...form, note })}
          placeholder="e.g. VIP pilot partner agreement"
        />

        <FormActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Override</Button>
        </FormActions>
      </form>
    </Modal>
  )
}
