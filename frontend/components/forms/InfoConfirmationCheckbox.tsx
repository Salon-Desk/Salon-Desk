"use client";

import RHFCheckbox from "@/components/forms/RHFChekBox";
import { cn } from "@/lib/utils";

export const INFO_CONFIRMATION_FIELD = "info_confirmed";

export const INFO_CONFIRMATION_MESSAGE =
  "I confirm that the information provided is accurate and will be used to manage this property.";

interface InfoConfirmationCheckboxProps {
  /** Form field name. Defaults to `info_confirmed`. */
  name?: string;
  className?: string;
  isRequired?: boolean;
}

/** Confirmation checkbox wired through react-hook-form via `RHFCheckbox`. */
const InfoConfirmationCheckbox = ({
  name = INFO_CONFIRMATION_FIELD,
  className,
  isRequired = true,
}: InfoConfirmationCheckboxProps) => {
  return (
    <RHFCheckbox
      name={name}
      label={INFO_CONFIRMATION_MESSAGE}
      isRequired={isRequired}
      isRequiredAstrictCaptionVisible={false}
      className={cn("min-w-0 px-4", className)}
    />
  );
};

export default InfoConfirmationCheckbox;
