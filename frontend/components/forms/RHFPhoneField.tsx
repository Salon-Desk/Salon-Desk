"use client";
import "intl-tel-input/styles";

import IntlTelInput, {
  type IntlTelInputRef,
} from "@intl-tel-input/react/with-utils";
import type { ValidationError } from "intl-tel-input";
import { Phone } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlInputClassName,
  formControlLeftIconClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import { validationMessages } from "@/constant/validation-messages";
import {
  isValidPhoneValue,
  phonesEqual,
  toPhoneFieldValue,
} from "@/lib/util/phone";

interface RHFPhoneFieldProps {
  name: string;
  label: string;
  isRequired?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  placeholder?: string;
}

type CombinedProps = RHFPhoneFieldProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

type ItiInstance = NonNullable<ReturnType<IntlTelInputRef["getInstance"]>>;

const getAllItiInstances = (): ItiInstance[] => {
  const instances: ItiInstance[] = [];
  document
    .querySelectorAll<HTMLElement>('.iti--allow-dropdown input[type="tel"]')
    .forEach((input) => {
      const id = input.getAttribute("data-intl-tel-input-id");
      if (!id) {
        return;
      }
      // @ts-expect-error — ITI global registry
      const instance = window.intlTelInputGlobals?.getInstance(Number(id));
      if (instance) {
        instances.push(instance);
      }
    });
  return instances;
};

const closeOtherItiDropdowns = (exceptInstance?: ItiInstance) => {
  getAllItiInstances().forEach((instance) => {
    if (instance !== exceptInstance) {
      instance.closeCountrySelector?.();
    }
  });
};

const RHFPhoneField = ({
  name,
  isRequired = true,
  label,
  disabled,
  showLabel = true,
  placeholder = "Enter phone number",
  onBlur: externalOnBlur,
  ...other
}: CombinedProps) => {
  const m = validationMessages;
  const { control, clearErrors } = useFormContext();
  const { controlId, errorId } = formFieldHtmlIds(name);
  const itiRef = useRef<IntlTelInputRef | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Tracks the last value WE emitted via onChangeNumber, so we can ignore
  // an echo of the same value coming back through the `value` prop / library
  // re-render cycle. This is what breaks the autofill feedback loop.
  const lastEmittedRef = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Intercept flag button clicks at the container level — fires BEFORE ITI opens the dropdown
  useEffect(() => {
    if (!isMounted) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleFlagButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isFlagButton =
        target.closest(".iti__selected-country") !== null ||
        target.closest(".iti__arrow") !== null ||
        target.closest('[class*="iti__flag"]') !== null;

      if (isFlagButton) {
        // Close all OTHER dropdowns immediately before this one opens
        closeOtherItiDropdowns(itiRef.current?.getInstance() ?? undefined);
      }
    };

    container.addEventListener("mousedown", handleFlagButtonClick, true);
    return () =>
      container.removeEventListener("mousedown", handleFlagButtonClick, true);
  }, [isMounted]);

  const getItiInstance = () => itiRef.current?.getInstance() ?? null;

  const validatePhoneNumber = (inputNumber: string): boolean => {
    // Prefer country-aware libphonenumber validation (same as Zod schemas).
    // ITI alone can accept incomplete national numbers for some countries.
    return isValidPhoneValue(inputNumber, isRequired);
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: isRequired ? m.required : undefined,
        validate: (value) => {
          if (!value && !isRequired) {
            return true;
          }
          return validatePhoneNumber(value) || m.invalidPhone;
        },
      }}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          {showLabel && label ? (
            <FormFieldLabel
              htmlFor={controlId}
              label={label}
              isRequired={isRequired}
            />
          ) : null}

          <div ref={containerRef} className="relative w-full">
            <Phone className={formControlLeftIconClassName} aria-hidden />

            {isMounted ? (
              <IntlTelInput
                ref={itiRef}
                initialCountry="et"
                dropdownParent={document.body}
                value={toPhoneFieldValue(field.value) || field.value || ""}
                onChangeNumber={(phone: string) => {
                  // Normalize to E.164 so form state matches ITI / API helpers.
                  const next = toPhoneFieldValue(phone) || phone;

                  // Ignore echoes of what we just emitted (autofill / ITI reconcile).
                  if (
                    next === lastEmittedRef.current ||
                    phonesEqual(next, lastEmittedRef.current)
                  ) {
                    return;
                  }

                  if (
                    phonesEqual(next, field.value) ||
                    next === (field.value ?? "")
                  ) {
                    return;
                  }

                  lastEmittedRef.current = next;
                  field.onChange(next);
                  clearErrors(name);
                }}
                disabled={disabled}
                inputProps={{
                  id: controlId,
                  placeholder,
                  "aria-invalid": !!error,
                  "aria-describedby": error ? errorId : undefined,
                  className: formControlInputClassName({
                    hasError: !!error,
                    hasLeftIcon: true,
                  }),
                  autoComplete: "tel",
                  ...other,
                  onFocus: () => {
                    // Close others when text input is focused directly
                    closeOtherItiDropdowns(getItiInstance() ?? undefined);
                  },
                  onBlur: (event) => {
                    getItiInstance()?.closeCountrySelector();
                    field.onBlur();
                    externalOnBlur?.(event);
                  },
                }}
                containerClass="w-full"
                searchInputClass="w-full"
                onChangeValidity={(isValid: boolean) => {
                  if (!isValid && error) {
                    clearErrors(name);
                  }
                }}
                onChangeCountry={(_iso2: string) => {}}
                onChangeErrorCode={(_errorCode: ValidationError | null) => {}}
              />
            ) : (
              <input
                id={controlId}
                readOnly
                placeholder={placeholder}
                className={formControlInputClassName({
                  hasError: !!error,
                  hasLeftIcon: true,
                })}
              />
            )}
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFPhoneField;
