'use client'

import { pickerHeaderTitleClass } from './picker.styles'
import { PickerCloseButton } from './PickerCloseButton'

type PickerHeaderProps = {
  title: string
  onClose: () => void
  closeLabel?: string
}

export function PickerHeader({ title, onClose, closeLabel }: PickerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-1">
      <p className={pickerHeaderTitleClass}>{title}</p>
      <PickerCloseButton onClose={onClose} label={closeLabel} />
    </div>
  )
}
