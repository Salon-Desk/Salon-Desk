"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlCheckboxClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { cn } from "@/lib/utils";

interface RHFCheckboxProps {
  name: string;
  label: string;
  description?: string;
  isRequired?: boolean;
  className?: string;
  isErrorVisible?: boolean;
  disabled?: boolean;
  isRequiredAstrictCaptionVisible?: boolean;
}

const RHFCheckbox = ({
  name,
  label,
  description,
  isRequired = true,
  className,
  disabled = false,
  isErrorVisible = true,
  isRequiredAstrictCaptionVisible = false,
}: RHFCheckboxProps) => {
  const { control, clearErrors, formState } = useFormContext();
  const error = formState.errors[name];

  const { controlId, errorId } = formFieldHtmlIds(name);

  const message =
    error?.message !== undefined && error?.message !== null
      ? String(error.message)
      : "";

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const checked = !!field.value;

        return (
          <FormFieldRoot className={cn("w-full", className)}>
            <div
              className={cn(
                "flex items-start justify-start",
                label || description ? "gap-2" : "",
              )}
            >
              <input
                id={controlId}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  clearErrors(name);
                }}
                className={cn(
                  formControlCheckboxClassName,
                  error && "border-destructive",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              />

              {label || description ? (
                <div className="min-w-0 flex-1 space-y-1">
                  {/* `htmlFor` alone toggles the input — an extra onClick would undo it. */}
                  {label ? (
                    <FormFieldLabel
                      htmlFor={controlId}
                      label={label}
                      isRequired={isRequired}
                      showRequiredMarker={isRequiredAstrictCaptionVisible}
                      className={cn(
                        "cursor-pointer font-normal text-sm",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    />
                  ) : null}

                  {description ? (
                    <label
                      htmlFor={controlId}
                      className={cn(
                        "block cursor-pointer text-xs text-muted-foreground sm:text-sm",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {description}
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>

            {isErrorVisible && message ? (
              <FormFieldError id={errorId} message={message} />
            ) : null}
          </FormFieldRoot>
        );
      }}
    />
  );
};

export default RHFCheckbox;
