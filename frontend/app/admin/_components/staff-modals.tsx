'use client'

import { Button, ConfirmDialog, FormActions, Modal, SelectField, TextField } from '@/components/ui'
import type { PlatformUser } from '@/types'

export interface StaffInviteFormState {
  name: string
  email: string
  role: PlatformUser['role']
}

interface InviteStaffModalProps {
  form: StaffInviteFormState
  onChange: (form: StaffInviteFormState) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function InviteStaffModal({ form, onChange, onClose, onSubmit }: InviteStaffModalProps) {
  return (
    <Modal onClose={onClose} title="Invite Platform Administrator" size="sm">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <TextField
          label="Staff Member Name"
          required
          value={form.name}
          onChange={(name) => onChange({ ...form, name })}
          placeholder="e.g. Jordan Lee"
        />

        <TextField
          label="Corporate Email Address"
          required
          type="email"
          value={form.email}
          onChange={(email) => onChange({ ...form, email })}
          placeholder="jordan.l@salondesk.io"
        />

        <SelectField
          label="Role Tier (RBAC Privileges)"
          value={form.role}
          onChange={(role) => onChange({ ...form, role })}
          options={[
            {
              value: 'Super Admin',
              label: 'Super Admin (All Privileges & Commission Changes)',
            },
            {
              value: 'Compliance Officer',
              label: 'Compliance Officer (Policy & Merchant Approvals)',
            },
            {
              value: 'Support Agent',
              label: 'Support Agent (Directory & Inquiry Read-Write)',
            },
          ]}
        />

        <FormActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Send Admin Invite</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

interface DeleteStaffModalProps {
  user: PlatformUser
  onClose: () => void
  onConfirm: () => void
}

export function DeleteStaffModal({ user, onClose, onConfirm }: DeleteStaffModalProps) {
  return (
    <ConfirmDialog
      title={`Delete Administrator: ${user.name}`}
      description="Are you sure you want to remove this staff account? All admin session tokens will be permanently revoked."
      confirmLabel="Confirm Deletion"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
