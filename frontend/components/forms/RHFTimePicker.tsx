"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlInputClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";

interface IProps {
  name: string;
  label: string;
  isRequired?: boolean;
  placeholder?: string;
}

const RHFTimePicker = ({
  name,
  label,
  isRequired = true,
  placeholder,
  ...other
}: IProps & React.InputHTMLAttributes<HTMLInputElement>) => {
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
            />
          ) : null}

          <input
            id={controlId}
            type="time"
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...field}
            value={field.value ?? ""}
            onChange={(e) => {
              field.onChange(e.target.value);
              clearErrors(name);
            }}
            className={formControlInputClassName({ hasError: !!error })}
            {...other}
          />

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFTimePicker;
