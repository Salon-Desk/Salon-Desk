"use client";

import type { ComponentProps } from "react";

import RHFTextField from "@/components/forms/RHFTextField";

type RHFEmailFieldProps = Omit<
  ComponentProps<typeof RHFTextField>,
  "type" | "leftIcon"
>;

const RHFEmailField = ({
  label = "Email",
  placeholder = "Enter email address",
  ...props
}: RHFEmailFieldProps) => {
  return (
    <RHFTextField
      type="email"
      leftIcon="mail"
      label={label}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default RHFEmailField;
