"use client";

import { CheckCircle, Circle } from "lucide-react";
import Image from "next/image";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlOptionScrollClassName,
  formControlScrollCardClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { resolveImageSrc } from "@/lib/util/remoteImage";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string | number;
  icon: string;
}

interface Props {
  name: string;
  label: string;
  options: Option[];
  isRequired?: boolean;
}

const RHFLageSelectCardGroup = ({
  name,
  label,
  options,
  isRequired = true,
}: Props) => {
  const { control } = useFormContext();
  const { errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className="w-full">
          {label ? (
            <FormFieldLabel label={label} isRequired={isRequired} />
          ) : null}

          <div
            className={formControlOptionScrollClassName}
            aria-describedby={error ? errorId : undefined}
          >
            {options.map((opt) => {
              const selected = field.value === opt.value;

              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={(e) => {
                    e.preventDefault();
                    field.onChange(opt.value);
                  }}
                  className={formControlScrollCardClassName(selected)}
                >
                  <div className="flex w-full justify-end">
                    {selected ? (
                      <CheckCircle
                        className="rounded-full bg-primary text-primary-foreground"
                        aria-hidden
                      />
                    ) : (
                      <Circle className="text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="flex flex-col justify-start gap-3.5">
                    <Image
                      width={45}
                      height={37}
                      src={resolveImageSrc(opt.icon)}
                      alt=""
                      className=""
                    />
                    <p
                      className={cn(
                        "text-sm font-bold sm:text-[15px]",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {opt.label}
                    </p>
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

export default RHFLageSelectCardGroup;
