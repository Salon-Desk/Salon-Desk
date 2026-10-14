"use client";

import { PickerCloseButton } from "./PickerCloseButton";
import { pickerHeaderTitleClass } from "./picker.styles";

type PickerHeaderProps = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
};

export function PickerHeader({
  title,
  onClose,
  closeLabel,
}: PickerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-1">
      <p className={pickerHeaderTitleClass}>{title}</p>
      <PickerCloseButton onClose={onClose} label={closeLabel} />
    </div>
  );
}
