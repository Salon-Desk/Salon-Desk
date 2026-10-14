"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlNumberChipClassName,
  formControlOptionScrollClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";

interface IProps {
  name: string;
  label: string;
  isRequired?: boolean;
}

const RHFStyledNumberSelector = ({
  name,
  label,
  isRequired = true,
}: IProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { control } = useFormContext();
  const { errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className="relative w-full">
          <FormFieldLabel label={label} isRequired={isRequired} />

          <div
            className={formControlOptionScrollClassName}
            aria-describedby={error ? errorId : undefined}
          >
            {[...Array(10)].map((_, index) => {
              const value = index;
              const isSelected = Number(field.value) === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={formControlNumberChipClassName(isSelected)}
                >
                  {index === 0 ? "None" : value}
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

export default RHFStyledNumberSelector;
