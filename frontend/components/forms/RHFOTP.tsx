"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlOtpGroupClassName,
  formControlOtpSlotClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface RHFOTPProps {
  name: string;
  label?: string;
  maxLength?: number;
  isRequired?: boolean;
}

const RHFOTP = ({
  name,
  label,
  maxLength = 6,
  isRequired = true,
}: RHFOTPProps) => {
  const { control } = useFormContext();
  const { errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          {label ? (
            <FormFieldLabel label={label} isRequired={isRequired} />
          ) : null}

          <div
            className="w-full min-w-0"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            <InputOTP
              maxLength={maxLength}
              value={field.value || ""}
              onChange={field.onChange}
              containerClassName="w-full"
            >
              <InputOTPGroup
                className={formControlOtpGroupClassName}
                style={{
                  gridTemplateColumns: `repeat(${maxLength}, minmax(var(--form-control-min-h), 1fr))`,
                }}
              >
                {Array.from({ length: maxLength }).map((_, index) => (
                  <InputOTPSlot
                    // biome-ignore lint/suspicious/noArrayIndexKey: OTP slots are positional
                    key={index}
                    index={index}
                    className={cn(
                      formControlOtpSlotClassName,
                      error ? "border-destructive" : "border-border",
                    )}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFOTP;
