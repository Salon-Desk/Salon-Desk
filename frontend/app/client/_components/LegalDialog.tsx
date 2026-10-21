'use client'

import { FileText } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'

import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../_constants/checkout-legal'

export type LegalDoc = 'terms' | 'privacy'

const LEGAL_DOCS: Record<LegalDoc, { title: string; sections: typeof TERMS_OF_SERVICE }> = {
  terms: { title: 'Terms of Service', sections: TERMS_OF_SERVICE },
  privacy: { title: 'Privacy Policy', sections: PRIVACY_POLICY },
}

export interface LegalDialogProps {
  doc: LegalDoc
  onClose: () => void
}

export function LegalDialog({ doc, onClose }: LegalDialogProps) {
  const { title, sections } = LEGAL_DOCS[doc]
  return (
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      classNameContent="max-w-2xl"
      header={
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-700" />
          <div>
            <h3 className="font-bold text-base text-stone-900">{title}</h3>
            <p className="text-stone-500 text-xs">
              SalonDesk client bookings · last updated October 2026
            </p>
          </div>
        </div>
      }
      footer={
        <PrimaryButton
          variant="dark"
          className="rounded-full h-10 px-6 font-semibold"
          onClick={onClose}
          title="Done reading"
          fullWidth={false}
        />
      }
    >
      <ol className="space-y-5 py-2">
        {sections.map((section, index) => (
          <li key={section.heading} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-800">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">{section.heading}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{section.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </CustomResponsiveDialog>
  )
}

export default LegalDialog
