"use client";

import { CheckCircle, Circle } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlChipOptionClassName,
  formControlOptionScrollClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  name: string;
  label: string;
  isLoading?: boolean;
  options: Option[];
  isRequired?: boolean;
  className?: string;
}

const RHFSelectCardGroup = ({
  name,
  label,
  options,
  isLoading = false,
  isRequired = true,
  className = "",
}: Props) => {
  const { control } = useFormContext();
  const { errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className={cn("w-full", className)}>
          {label ? (
            <FormFieldLabel label={label} isRequired={isRequired} />
          ) : null}

          <div
            className={formControlOptionScrollClassName}
            aria-describedby={error ? errorId : undefined}
          >
            {isLoading ? (
              <div className="flex flex-row gap-2">
                {["a", "b", "c", "d", "e"].map((id) => (
                  <div
                    key={id}
                    className="h-16 w-24 shrink-0 animate-pulse rounded-xl bg-muted sm:h-18 sm:w-28 md:w-32 lg:w-36"
                  />
                ))}
              </div>
            ) : (
              options.map((opt) => {
                const selected = field.value === opt.value;

                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => field.onChange(opt.value)}
                    className={formControlChipOptionClassName(selected)}
                  >
                    {selected ? (
                      <CheckCircle
                        className="size-5 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : (
                      <Circle
                        className="size-5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                    <span className="truncate text-xs font-normal sm:text-sm md:text-base">
                      {opt.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFSelectCardGroup;
