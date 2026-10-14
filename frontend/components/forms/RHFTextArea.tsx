"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlTextareaClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";

interface RHFTextAreaProps {
  name: string;
  label: string;
  isRequired?: boolean;
  showRequiredMarker?: boolean;
  showOptionalHint?: boolean;
  labelClassName?: string;
  rows?: number;
}

type CombinedProps = RHFTextAreaProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function RHFTextArea({
  name,
  label,
  isRequired = true,
  showRequiredMarker = true,
  showOptionalHint = true,
  labelClassName,
  rows = 3,
  className,
  ...other
}: CombinedProps) {
  const { control, clearErrors } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          {label ? (
            <FormFieldLabel
              htmlFor={controlId}
              label={label}
              isRequired={isRequired}
              showRequiredMarker={showRequiredMarker}
              showOptionalHint={showOptionalHint}
              className={labelClassName}
            />
          ) : null}

          <textarea
            id={controlId}
            rows={rows}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...field}
            value={field.value ?? ""}
            onChange={(e) => {
              field.onChange(e.target.value);
              clearErrors(name);
            }}
            className={formControlTextareaClassName({
              hasError: !!error,
              className,
            })}
            {...other}
          />

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
}
