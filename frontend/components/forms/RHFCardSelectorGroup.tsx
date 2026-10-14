"use client";

import { CheckCircle, Circle } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlCardDescriptionClassName,
  formControlCardSubtitleClassName,
  formControlCardTitleClassName,
  formControlLargeCardClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { cn } from "@/lib/utils";

interface Option {
  title: string;
  subtitle?: string;
  description?: string;
  value: string | number;
}

interface Props {
  name: string;
  options: Option[];
  label?: string;
  isRequired?: boolean;
  className?: string;
}

const RHFCardSelectorGroup = ({
  name,
  label,
  options,
  isRequired = true,
  className,
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
            className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2"
            aria-describedby={error ? errorId : undefined}
          >
            {options.map((opt) => {
              const selected = opt.value === field.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={formControlLargeCardClassName(selected)}
                >
                  <div className="flex justify-end">
                    {selected ? (
                      <CheckCircle
                        className="size-5 text-primary sm:size-6 lg:size-7"
                        aria-hidden
                      />
                    ) : (
                      <Circle
                        className="size-5 text-muted-foreground sm:size-6 lg:size-7"
                        aria-hidden
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <p className={formControlCardTitleClassName}>
                        {opt.title}
                      </p>
                      {opt.subtitle ? (
                        <p className={formControlCardSubtitleClassName}>
                          {opt.subtitle}
                        </p>
                      ) : null}
                    </div>
                    {opt.description ? (
                      <p className={formControlCardDescriptionClassName}>
                        {opt.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFCardSelectorGroup;
