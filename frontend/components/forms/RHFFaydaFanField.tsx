"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlInputClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";

interface Props {
  name: string;
  label: string;
  isRequired?: boolean;
  placeholder?: string;
}

const formatFanNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 16);

  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const RHFFaydaFanField = ({
  name,
  label,
  isRequired = true,
  placeholder,
}: Props) => {
  const { control, clearErrors } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          <FormFieldLabel
            htmlFor={controlId}
            label={label}
            isRequired={isRequired}
          />

          <input
            id={controlId}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={formatFanNumber(field.value ?? "")}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, "").slice(0, 16);

              field.onChange(rawValue); // store raw value
              clearErrors(name);
            }}
            className={formControlInputClassName({
              hasError: !!error,
              hasLeftIcon: false,
            })}
          />

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFFaydaFanField;
