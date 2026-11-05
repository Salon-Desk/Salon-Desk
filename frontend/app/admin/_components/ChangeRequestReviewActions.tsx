'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextField from '@/components/forms/RHFTextField'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import {
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
} from '@/store/api/platformApi'
import type { ApiChangeRequest } from '@/types/api-org'

import {
  changeRequestReviewDefaultValues,
  type ChangeRequestReviewFormData,
  changeRequestReviewSchema,
} from '../_schemas/change-request.schema'

interface ChangeRequestReviewActionsProps {
  request: ApiChangeRequest
  onReviewed?: () => void
}

export function ChangeRequestReviewActions({
  request,
  onReviewed,
}: ChangeRequestReviewActionsProps) {
  const [approve, { isLoading: approving }] = useApproveChangeRequestMutation()
  const [reject, { isLoading: rejecting }] = useRejectChangeRequestMutation()
  const isLoading = approving || rejecting

  const methods = useForm<ChangeRequestReviewFormData>({
    resolver: zodResolver(changeRequestReviewSchema),
    defaultValues: changeRequestReviewDefaultValues,
  })

  const isPending = request.status === 'PENDING'
  const isApproved = request.status === 'APPROVED'

  if (!isPending) {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          {isApproved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{isApproved ? 'Approved by Administrator' : 'Rejected by Administrator'}</span>
          {request.reviewed_at && (
            <span className="font-normal text-slate-500 text-[11px]">
              · {new Date(request.reviewed_at).toLocaleString()}
            </span>
          )}
        </div>
        {request.review_notes && (
          <p className="text-slate-600 italic pl-5">&ldquo;{request.review_notes}&rdquo;</p>
        )}
      </div>
    )
  }

  const submit = async (action: 'approve' | 'reject') => {
    const data = methods.getValues()
    try {
      if (action === 'approve') {
        await approve({
          id: request.id,
          review_notes: data.review_notes?.trim() || undefined,
        }).unwrap()
        toast.success('Change request approved', toastColor.success)
      } else {
        await reject({
          id: request.id,
          review_notes: data.review_notes?.trim() || undefined,
        }).unwrap()
        toast.success('Change request rejected', toastColor.success)
      }
      methods.reset(changeRequestReviewDefaultValues)
      onReviewed?.()
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Action failed'),
        toastColor.error,
      )
    }
  }

  return (
    <FormProvider methods={methods} onSubmit={(e) => e?.preventDefault()}>
      <div className="space-y-2">
        <RHFTextField
          name="review_notes"
          label="Review notes"
          isRequired={false}
          placeholder="Optional notes for the merchant"
        />
        <div className="flex gap-2">
          <PrimaryButton
            title={approving ? 'Approving…' : 'Approve'}
            type="button"
            size="sm"
            isLoading={approving}
            isDisabled={isLoading}
            className="h-10 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-[0.98] w-32"
            onClick={() => void submit('approve')}
          />
          <PrimaryButton
            title={rejecting ? 'Rejecting…' : 'Reject'}
            type="button"
            variant="destructive"
            size="sm"
            isLoading={rejecting}
            isDisabled={isLoading}
            className="h-10 rounded-xl font-bold text-xs transition-all active:scale-[0.98] w-32"
            onClick={() => void submit('reject')}
          />
        </div>
      </div>
    </FormProvider>
  )
}
