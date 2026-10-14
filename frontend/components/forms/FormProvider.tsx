import type { FormHTMLAttributes, ReactNode } from "react";
import {
  type FieldValues,
  FormProvider as RHFProvider,
  type UseFormReturn,
} from "react-hook-form";

type Props<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues = TFieldValues,
> = {
  children: ReactNode;
  methods: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
  onSubmit?: FormHTMLAttributes<HTMLFormElement>["onSubmit"];
};

export default function FormProvider<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  children,
  onSubmit,
  methods,
}: Props<TFieldValues, TContext, TTransformedValues>) {
  return (
    <RHFProvider {...methods}>
      <form onSubmit={onSubmit}>{children}</form>
    </RHFProvider>
  );
}
