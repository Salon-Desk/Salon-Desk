"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  formControlSegmentedButtonClassName,
  formControlSegmentedRootClassName,
} from "@/components/forms/form-field-parts";

interface RHFSegmentedControlProps {
  name: string;
  options: {
    label: string;
    value: string;
  }[];
  className?: string;
}

const RHFSegmentedControl = ({
  name,
  options,
  className,
}: RHFSegmentedControlProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div
          className={formControlSegmentedRootClassName(
            options.length,
            className,
          )}
        >
          {options.map((option) => {
            const isActive = field.value === option.value;

            return (
              <button
                type="button"
                key={option.value}
                onClick={(e) => {
                  e.preventDefault();
                  field.onChange(option.value);
                }}
                className={formControlSegmentedButtonClassName(isActive)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    />
  );
};

export default RHFSegmentedControl;
