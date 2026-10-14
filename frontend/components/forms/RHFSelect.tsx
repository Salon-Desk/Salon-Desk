"use client";

import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlSelectContentClassName,
  formControlSelectItemClassName,
  formControlSelectShellClassName,
  formControlSelectTriggerClassName,
  formControlSelectValueClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RHFSelectProps {
  name: string;
  label?: string;
  options: { value: string; label: string }[];
  isLoading?: boolean;
  isRequired?: boolean;
  defaultValue?: string;
}

export default function RHFSelect({
  name,
  label,
  options,
  isLoading,
  isRequired = true,
  defaultValue,
}: RHFSelectProps) {
  const { control, clearErrors, setValue } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);

  useEffect(() => {
    if (options.length > 0 && defaultValue) {
      setValue(name, defaultValue, { shouldValidate: false });
    } else if (options.length > 0 && isRequired && !defaultValue) {
      const firstValidOption = options.find(
        (option) => option.value.trim() !== "",
      );
      if (firstValidOption) {
        setValue(name, firstValidOption.value, { shouldValidate: false });
      }
    }
  }, [options, name, setValue, isRequired, defaultValue]);

  const validOptions = options.filter((option) => option.value.trim() !== "");

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={
        defaultValue ||
        (validOptions.length > 0 ? validOptions[0].value : undefined)
      }
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          {label ? (
            <FormFieldLabel
              htmlFor={controlId}
              label={label}
              isRequired={isRequired}
            />
          ) : null}

          <div
            className={cn(
              formControlSelectShellClassName({ hasError: !!error }),
              "m-0 overflow-hidden bg-background p-0 shadow-none",
            )}
          >
            <Select
              value={field.value ? field.value : undefined}
              onValueChange={(value) => {
                field.onChange(value);
                clearErrors(name);
              }}
            >
              <SelectTrigger
                id={controlId}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={formControlSelectTriggerClassName}
              >
                <SelectValue
                  placeholder="Select..."
                  className={formControlSelectValueClassName}
                />
              </SelectTrigger>

              <SelectContent
                className={formControlSelectContentClassName}
                position="popper"
              >
                {isLoading ? (
                  <SelectItem
                    disabled
                    value="__loading__"
                    className={formControlSelectItemClassName}
                  >
                    Loading...
                  </SelectItem>
                ) : validOptions.length === 0 ? (
                  <SelectItem
                    disabled
                    value="__empty__"
                    className={formControlSelectItemClassName}
                  >
                    No options available
                  </SelectItem>
                ) : (
                  validOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className={formControlSelectItemClassName}
                    >
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
}
