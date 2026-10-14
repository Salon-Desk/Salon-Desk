"use client";

import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlInlineIconClassName,
  formControlPopoverTriggerClassName,
  formControlYearPickerContentClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RHFYearPickerProps {
  name: string;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  startYear?: number;
  endYear?: number;
}

const RHFYearPicker = ({
  name,
  label,
  placeholder = "Select Year",
  isRequired = true,
  startYear = 2000,
  endYear = new Date().getFullYear() + 1,
}: RHFYearPickerProps) => {
  const { control, clearErrors } = useFormContext();
  const [open, setOpen] = useState(false);
  const { controlId, errorId } = formFieldHtmlIds(name);

  const years = useMemo(() => {
    const y: number[] = [];
    for (let i = endYear; i >= startYear; i--) {
      y.push(i);
    }
    return y;
  }, [startYear, endYear]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          <FormFieldLabel
            htmlFor={controlId}
            label={label}
            isRequired={isRequired}
          />

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={controlId}
                type="button"
                variant="outline"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  formControlPopoverTriggerClassName({
                    hasError: !!error,
                    empty: !field.value,
                  }),
                  "font-normal",
                )}
              >
                <span className="min-w-0 truncate">
                  {field.value || placeholder}
                </span>
                <Calendar
                  className={cn(formControlInlineIconClassName, "opacity-60")}
                  aria-hidden
                />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className={formControlYearPickerContentClassName}
              align="start"
              side="bottom"
              sideOffset={4}
              collisionPadding={12}
            >
              <div className="grid grid-cols-3 gap-1.5 p-1 sm:grid-cols-4 sm:gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      field.onChange(String(year));
                      clearErrors(name);
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-md border px-2 py-2 text-center text-sm transition-colors",
                      field.value === year.toString()
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFYearPicker;
