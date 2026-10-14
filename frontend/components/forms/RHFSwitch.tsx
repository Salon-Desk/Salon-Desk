"use client";

import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlSwitchRootClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { Switch } from "@/components/ui/switch";

interface IProps {
  name: string;
  label: string;
  isRequired?: boolean;
}

const RHFSwitch = ({
  name,
  isRequired = true,
  label,
  ...other
}: IProps & React.ComponentProps<typeof Switch>) => {
  const { control } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className={formControlSwitchRootClassName}>
          <FormFieldLabel
            htmlFor={controlId}
            label={label}
            isRequired={isRequired}
          />
          <div className="flex items-center gap-2">
            <Switch
              id={controlId}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              checked={field.value}
              onCheckedChange={field.onChange}
              {...other}
            />
          </div>
          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFSwitch;
