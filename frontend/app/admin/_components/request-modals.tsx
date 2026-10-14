'use client'

import { Button, FormActions, Modal, TextareaField } from '@/components/ui'
import type { ChangeRequest } from '@/types'

interface RejectChangeRequestModalProps {
  request: ChangeRequest
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function RejectChangeRequestModal({
  request,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: RejectChangeRequestModalProps) {
  return (
    <Modal onClose={onClose} title={`Reject Request ${request.id}`} size="sm">
      <p className="mb-3 text-slate-600 text-xs">
        Please enter the compliance reason for rejecting this change for {request.salonName}.
      </p>

      <TextareaField
        label="Rejection reason"
        value={reason}
        onChange={onReasonChange}
        placeholder="e.g. Policy fee exceeds maximum platform ceiling or merchant ID verification failed..."
        rows={3}
      />

      <FormActions>
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          className="border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          Confirm Rejection
        </Button>
      </FormActions>
    </Modal>
  )
}
