'use client'

import { AlertTriangle, Building2, Trash2 } from 'lucide-react'

import { Button, FormActions, Modal, TextareaField, TextField } from '@/components/ui'
import type { Organization } from '@/types'

export interface SalonFormState {
  name: string
  category: string
  ownerName: string
  email: string
  phone: string
  address: string
  city: string
  paypalMerchantId: string
}

interface AddSalonModalProps {
  form: SalonFormState
  onChange: (form: SalonFormState) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function AddSalonModal({ form, onChange, onClose, onSubmit }: AddSalonModalProps) {
  return (
    <Modal
      onClose={onClose}
      title="Onboard New Salon Partner"
      icon={<Building2 className="h-5 w-5 text-amber-600" />}
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <TextField
          label="Salon Business Name"
          required
          value={form.name}
          onChange={(name) => onChange({ ...form, name })}
          placeholder="e.g. Saffron & Comb Studio"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Owner Full Name"
            value={form.ownerName}
            onChange={(ownerName) => onChange({ ...form, ownerName })}
            placeholder="e.g. Maya Lin"
          />
          <TextField
            label="Contact Email"
            required
            type="email"
            value={form.email}
            onChange={(email) => onChange({ ...form, email })}
            placeholder="owner@salon.com"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Street Address"
            value={form.address}
            onChange={(address) => onChange({ ...form, address })}
            placeholder="e.g. 55 Mercer St"
          />
          <TextField
            label="City & State"
            value={form.city}
            onChange={(city) => onChange({ ...form, city })}
            placeholder="New York, NY"
          />
        </div>

        <TextField
          label="PayPal Merchant Sandbox ID"
          mono
          value={form.paypalMerchantId}
          onChange={(paypalMerchantId) => onChange({ ...form, paypalMerchantId })}
          placeholder="e.g. MERCHANT_SAFFRON_8801"
        />

        <FormActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Onboard Salon &amp; Activate</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

interface EditSalonModalProps {
  salon: Organization
  onChange: (salon: Organization) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent) => void
}

export function EditSalonModal({ salon, onChange, onClose, onSubmit }: EditSalonModalProps) {
  return (
    <Modal onClose={onClose} title={`Edit Salon: ${salon.name}`}>
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <TextField
          label="Salon Name"
          value={salon.name}
          onChange={(name) => onChange({ ...salon, name })}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Contact Email"
            type="email"
            value={salon.email}
            onChange={(email) => onChange({ ...salon, email })}
          />
          <TextField
            label="Cancellation Window (Hours)"
            mono
            value={String(salon.cancellationPolicyHours)}
            onChange={(raw) =>
              onChange({
                ...salon,
                cancellationPolicyHours: parseInt(raw, 10) || 24,
              })
            }
          />
        </div>

        <TextField
          label="Custom Commission Rate Override (%)"
          mono
          value={salon.customCommissionRate !== undefined ? String(salon.customCommissionRate) : ''}
          placeholder="Leave empty for standard 2.5%"
          onChange={(raw) =>
            onChange({
              ...salon,
              customCommissionRate: raw ? parseFloat(raw) : undefined,
            })
          }
        />

        <FormActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

interface SuspendSalonModalProps {
  salon: Organization
  suspensionReason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function SuspendSalonModal({
  salon,
  suspensionReason,
  onReasonChange,
  onClose,
  onConfirm,
}: SuspendSalonModalProps) {
  const isSuspended = salon.status === 'SUSPENDED'

  return (
    <Modal
      onClose={onClose}
      size="sm"
      icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
      title={isSuspended ? 'Reinstate Salon Account' : 'Suspend Salon Account'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isSuspended ? 'success' : 'danger'}
            className={
              isSuspended ? undefined : 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700'
            }
            onClick={onConfirm}
          >
            Confirm {isSuspended ? 'Reinstatement' : 'Suspension'}
          </Button>
        </>
      }
    >
      <p className="text-slate-600 text-xs leading-relaxed">
        {isSuspended
          ? `Reinstating "${salon.name}" will unlock new PayPal authorization holds and restore their stylist chairs to customer booking.`
          : `Suspending "${salon.name}" halts authorization processing and hides their service catalog from discovery.`}
      </p>

      {!isSuspended && (
        <div className="mt-4">
          <TextareaField
            label="Audit Suspension Reason"
            value={suspensionReason}
            onChange={onReasonChange}
            placeholder="e.g. Consecutive customer complaints regarding disputed cancellation windows..."
            rows={3}
          />
        </div>
      )}
    </Modal>
  )
}

interface DeleteSalonModalProps {
  salon: Organization
  onClose: () => void
  onConfirm: () => void
}

export function DeleteSalonModal({ salon, onClose, onConfirm }: DeleteSalonModalProps) {
  return (
    <Modal
      onClose={onClose}
      size="sm"
      className="border-rose-200"
      icon={<Trash2 className="h-5 w-5 text-rose-600" />}
      title="Permanently Offboard Salon"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            Delete &amp; Offboard
          </Button>
        </>
      }
    >
      <p className="text-slate-600 text-xs leading-relaxed">
        Are you sure you want to delete <strong className="text-slate-900">{salon.name}</strong>?
        All pending authorization holds will be voided and staff access terminated.
      </p>
    </Modal>
  )
}
