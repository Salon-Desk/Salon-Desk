'use client'

import type { FormEvent } from 'react'

import {
  Button,
  FormActions,
  Modal,
  NumberField,
  Panel,
  SelectField,
  TextField,
} from '@/components/ui'

interface PaypalChangeModalProps {
  currentMerchantId: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

interface PolicyChangeModalProps {
  policyHours: number
  noShowFee: number
  onChange: (next: { policyHours: number; noShowFee: number }) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

export function PaypalChangeModal({
  currentMerchantId,
  value,
  onChange,
  onClose,
  onSubmit,
}: PaypalChangeModalProps) {
  return (
    <Modal onClose={onClose} size="md" title="Request PayPal Merchant ID Change">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <p className="text-slate-600 leading-relaxed">
          Platform Admin approval is required before changing the payout account. Payouts will
          continue routing to your verified ID until approved.
        </p>

        <Panel className="space-y-1 bg-white font-mono text-[11px]">
          <span className="font-sans text-slate-500 uppercase">Current Approved ID:</span>
          <div className="font-bold text-slate-900">{currentMerchantId}</div>
        </Panel>

        <TextField
          label="New Proposed PayPal Merchant ID"
          required
          mono
          value={value}
          onChange={onChange}
          placeholder="e.g. SELAM-EXPANSION-8812"
        />

        <FormActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Submit Change Request
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

export function PolicyChangeModal({
  policyHours,
  noShowFee,
  onChange,
  onClose,
  onSubmit,
}: PolicyChangeModalProps) {
  return (
    <Modal onClose={onClose} size="md" title="Propose Cancellation Policy Amendment">
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <p className="text-slate-600 leading-relaxed">
          Policy changes undergo compliance review to prevent deceptive booking terms for salon
          customers.
        </p>

        <SelectField
          label="Proposed Free Cancellation Notice (Hours)"
          required
          value={String(policyHours)}
          onChange={(value) => onChange({ policyHours: Number(value), noShowFee })}
          options={[
            { value: '12', label: '12 Hours Prior' },
            { value: '24', label: '24 Hours Prior (Industry Standard)' },
            { value: '48', label: '48 Hours Prior' },
            { value: '72', label: '72 Hours Prior' },
          ]}
        />

        <NumberField
          label="Default No-Show Fee ($)"
          required
          value={noShowFee}
          min={10}
          step={5}
          onChange={(nextFee) => onChange({ policyHours, noShowFee: nextFee })}
        />

        <FormActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Submit Policy Proposal
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
