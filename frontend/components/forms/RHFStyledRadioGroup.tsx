"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlOptionScrollClassName,
  formControlRadioCardClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface IProps {
  name: string;
  label: string;
  options: {
    label: string;
    value: string | number;
  }[];
  isRequired?: boolean;
}

const RHFStyledRadioGroup = ({
  name,
  label,
  options,
  isRequired = true,
}: IProps) => {
  const { control, clearErrors } = useFormContext();
  const { errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          <FormFieldLabel label={label} isRequired={isRequired} />

          <RadioGroup
            value={
              field.value !== undefined && field.value !== null
                ? String(field.value)
                : undefined
            }
            onValueChange={(value) => {
              field.onChange(value);
              clearErrors(name);
            }}
            className={cn(
              formControlOptionScrollClassName,
              "py-2",
              error && "rounded-md border border-destructive p-2",
            )}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
          >
            {options.map((option) => {
              const optionId = `${name}-${option.value}`;
              const isUnselected = option.value !== field.value;

              return (
                <div
                  key={option.value}
                  className={formControlRadioCardClassName(isUnselected)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id={optionId}
                      value={String(option.value)}
                    />
                    <Label
                      htmlFor={optionId}
                      className="cursor-pointer text-xs font-normal text-foreground sm:text-sm"
                    >
                      {option.label}
                    </Label>
                  </div>
                </div>
              );
            })}
          </RadioGroup>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFStyledRadioGroup;
