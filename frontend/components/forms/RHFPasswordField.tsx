"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldHint,
  FormFieldLabel,
  FormFieldRoot,
  formControlInlineIconClassName,
  formControlShellClassName,
  formControlShellInputClassName,
  formControlToggleIconClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";

interface RHFPasswordFieldProps {
  name: string;
  label: string;
  isRequired?: boolean;
  hint?: string;
}

const RHFPasswordField = ({
  name,
  label,
  isRequired = true,
  hint,
  ...other
}: RHFPasswordFieldProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { control, clearErrors } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
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

          <div className={formControlShellClassName({ hasError: !!error })}>
            <Lock className={formControlInlineIconClassName} aria-hidden />

            <input
              id={controlId}
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className={formControlShellInputClassName}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                field.onChange(e.target.value);
                clearErrors(name);
              }}
              {...other}
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Eye className={formControlToggleIconClassName} aria-hidden />
              ) : (
                <EyeOff
                  className={formControlToggleIconClassName}
                  aria-hidden
                />
              )}
            </button>
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : hint ? (
            <FormFieldHint message={hint} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFPasswordField;
