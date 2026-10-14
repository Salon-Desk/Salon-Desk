"use client";

import { ChevronDown } from "lucide-react";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlCheckboxOptionClassName,
  formControlChevronClassName,
  formControlDropdownContentClassName,
  formControlSelectContentClassName,
  formControlSelectItemClassName,
  formControlSelectShellClassName,
  formControlSelectTriggerClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import LoadingSpinner from "../loader/LoadingSpinner";

interface Options {
  value: string;
  label: string;
}

type RHFSelectionPropsBase = {
  name: string;
  label: string;
  options: Options[];
  isRequired?: boolean;
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  /** Placeholder when nothing is selected (single and multi). */
  placeholder?: string;
};

type RHFSelectionSingleProps = RHFSelectionPropsBase & {
  multiple?: false;
};

type RHFSelectionMultiProps = RHFSelectionPropsBase & {
  multiple: true;
  /** Max option labels to show before summarizing as “+N more”. */
  maxSummaryLabels?: number;
};

export type RHFSelectionProps =
  | RHFSelectionSingleProps
  | RHFSelectionMultiProps;

function normalizeMultiValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

function multiSelectionSummary(
  selected: string[],
  optionList: Options[],
  maxLabels: number,
): string {
  if (selected.length === 0) {
    return "";
  }
  const labels = selected
    .map((v) => optionList.find((o) => o.value === v)?.label)
    .filter((l): l is string => Boolean(l));
  if (labels.length === 0) {
    return `${selected.length} selected`;
  }
  if (labels.length <= maxLabels) {
    return labels.join(", ");
  }
  const shown = labels.slice(0, maxLabels).join(", ");
  return `${shown} +${labels.length - maxLabels} more`;
}

const triggerInnerClassName = formControlSelectTriggerClassName;

const RHFSelection: React.FC<RHFSelectionProps> = (props) => {
  const {
    name,
    label,
    options,
    isRequired = true,
    className,
    showLabel = true,
    disabled = false,
    isLoading = false,
    placeholder,
  } = props;

  const multiple = props.multiple === true;
  const maxSummaryLabels = multiple ? (props.maxSummaryLabels ?? 2) : 2;

  const { control, clearErrors } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);

  const defaultPlaceholder = placeholder ?? `Select ${label}`;

  if (multiple) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={({ field, fieldState: { error } }) => {
          const selected = normalizeMultiValue(field.value);
          const summary = multiSelectionSummary(
            selected,
            options,
            maxSummaryLabels,
          );

          const toggle = (optionValue: string, checked: boolean) => {
            const next = checked
              ? selected.includes(optionValue)
                ? selected
                : [...selected, optionValue]
              : selected.filter((id) => id !== optionValue);
            field.onChange(next);
            clearErrors(name);
          };

          return (
            <FormFieldRoot className={cn("w-full", className)}>
              {showLabel ? (
                <FormFieldLabel
                  htmlFor={controlId}
                  label={label}
                  isRequired={isRequired}
                />
              ) : null}

              <div
                className={cn(
                  formControlSelectShellClassName({ hasError: !!error }),
                  "p-0 m-0 bg-background overflow-hidden border-[0.9px] border-border shadow-none rounded-2xl",
                )}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id={controlId}
                      disabled={disabled || isLoading}
                      aria-describedby={error ? errorId : undefined}
                      aria-haspopup="dialog"
                      data-invalid={error ? true : undefined}
                      className={cn(
                        triggerInnerClassName,
                        "flex w-full items-center justify-between gap-2 rounded-2xl text-left",
                        (disabled || isLoading) &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          !summary && "text-muted-foreground",
                        )}
                      >
                        {isLoading ? "Loading…" : summary || defaultPlaceholder}
                      </span>
                      <ChevronDown
                        className={cn(
                          formControlChevronClassName,
                          "opacity-50",
                        )}
                        aria-hidden
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      formControlDropdownContentClassName,
                      "w-(--radix-popover-trigger-width)",
                    )}
                    collisionPadding={12}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="max-h-52 overflow-y-auto p-1 scrollbar-hide sm:max-h-60">
                      {isLoading ? (
                        <div className="flex justify-center py-6">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        options.map((option) => (
                          <label
                            key={option.value}
                            className={formControlCheckboxOptionClassName}
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(option.value)}
                              disabled={disabled}
                              onChange={(e) =>
                                toggle(option.value, e.target.checked)
                              }
                              className="relative w-[21px] h-[21px] appearance-none cursor-pointer rounded-lg border border-primary bg-transparent checked:bg-primary checked:border-primary transition-all duration-200 checked:before:content-['✓'] checked:before:absolute checked:before:inset-0 checked:before:flex checked:before:items-center checked:before:justify-center checked:before:text-white checked:before:text-xs checked:before:font-bold"
                            />

                            <span className="font-normal text-foreground">
                              {option.label}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {error ? (
                <FormFieldError id={errorId} message={error.message ?? ""} />
              ) : null}
            </FormFieldRoot>
          );
        }}
      />
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className={cn("w-full", className)}>
          {showLabel ? (
            <FormFieldLabel
              htmlFor={controlId}
              label={label}
              isRequired={isRequired}
            />
          ) : null}

          <div
            className={cn(
              formControlSelectShellClassName({ hasError: !!error }),
              "m-0 overflow-hidden border-[0.9px] border-border bg-background p-0 shadow-none",
            )}
          >
            <Select
              value={
                field.value === undefined ||
                field.value === null ||
                field.value === ""
                  ? undefined
                  : String(field.value)
              }
              onValueChange={(value) => {
                field.onChange(value);
                clearErrors(name);
              }}
              disabled={disabled}
            >
              <SelectTrigger
                id={controlId}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={triggerInnerClassName}
              >
                <SelectValue placeholder={defaultPlaceholder} />
              </SelectTrigger>

              <SelectContent
                className={formControlSelectContentClassName}
                position="popper"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={formControlSelectItemClassName}
                    >
                      {option.label}
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
};

export default RHFSelection;
