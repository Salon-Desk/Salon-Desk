"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlInputClassName,
  formControlUnitSwitchButtonClassName,
  formControlUnitSwitchClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";

interface Options {
  label: string;
  value: string;
}

interface FieldValue {
  value?: number | string;
  unit?: string;
}

type NestedFieldError = {
  message?: string;
  value?: { message?: string };
};

interface IProps {
  name: string;
  label: string;
  isRequired?: boolean;
  placeholder?: string;
  options: Options[];
}

const RHFNumberFieldWithSwitchUnit = ({
  name,
  label,
  isRequired = true,
  placeholder,
  options,
  ...other
}: IProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { control, clearErrors } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);

  const handleInput = (value: string) => value.replace(/\D/g, "");

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={{
        value: undefined,
        unit: options?.[0]?.value ?? "",
      }}
      render={({ field, fieldState: { error } }) => {
        const fieldError = error as NestedFieldError | undefined;
        const errorMessage =
          fieldError?.value?.message ?? fieldError?.message ?? "";

        // ✅ Always ensure unit fallback to first option
        const fieldValue: FieldValue = {
          value: field.value?.value,
          unit: field.value?.unit ?? options?.[0]?.value,
        };

        // ✅ Ensure form state always has a unit (important after reset)
        if (!field.value?.unit && options?.length > 0) {
          field.onChange({
            value: field.value?.value,
            unit: options[0].value,
          });
        }

        return (
          <FormFieldRoot>
            {label && (
              <FormFieldLabel
                htmlFor={controlId}
                label={label}
                isRequired={isRequired}
              />
            )}

            <div className="relative flex items-center">
              {/* INPUT */}
              <input
                id={controlId}
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                aria-invalid={!!errorMessage}
                aria-describedby={errorMessage ? errorId : undefined}
                value={fieldValue.value ?? ""}
                onFocus={(e) => {
                  if (fieldValue.value === 0 || fieldValue.value === "0") {
                    requestAnimationFrame(() => {
                      e.target.select();
                    });
                  }
                  other.onFocus?.(e);
                }}
                onChange={(e) => {
                  const digitsOnly = handleInput(e.target.value);

                  field.onChange({
                    ...fieldValue,
                    value: digitsOnly === "" ? undefined : digitsOnly,
                  });

                  clearErrors(name);
                }}
                className={formControlInputClassName({
                  hasError: !!errorMessage,
                  className: "pr-24 sm:pr-28",
                })}
                {...other}
              />

              {/* SWITCH (Segmented Control) */}
              <div className={formControlUnitSwitchClassName}>
                {options.map((option) => {
                  const isActive =
                    (fieldValue.unit ?? options[0].value) === option.value;

                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => {
                        field.onChange({
                          ...fieldValue,
                          unit: option.value,
                        });
                      }}
                      className={formControlUnitSwitchButtonClassName(isActive)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage ? (
              <FormFieldError id={errorId} message={errorMessage} />
            ) : null}
          </FormFieldRoot>
        );
      }}
    />
  );
};

export default RHFNumberFieldWithSwitchUnit;
