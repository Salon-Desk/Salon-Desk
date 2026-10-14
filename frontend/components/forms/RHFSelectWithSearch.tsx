"use client";

import { ChevronDown } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
  formControlChevronClassName,
  formControlComboboxTriggerClassName,
  formControlCommandEmptyClassName,
  formControlCommandInputClassName,
  formControlCommandItemClassName,
  formControlCommandListClassName,
  formControlDropdownContentClassName,
  formFieldHtmlIds,
} from "@/components/forms/form-field-parts";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import LoadingSpinner from "../loader/LoadingSpinner";

interface Options {
  value: string;
  label: string;
}

interface RHFSelectWithSearchProps {
  name: string;
  label: string;
  options: Options[];
  isRequired?: boolean;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  isSearchable?: boolean;
  disabled?: boolean;
  isNullable?: boolean;
  hasMore?: boolean;
  defaultValueLabel: string;
  onSearch?: (value: string) => void;
  fetchMore?: () => void;
  className?: string;
  onChange?: (value: string | undefined) => void;
}

const RHFSelectWithSearch: React.FC<RHFSelectWithSearchProps> = ({
  name,
  label,
  options,
  isRequired = true,
  isLoading = false,
  isFetchingMore = false,
  isSearchable = false,
  disabled = false,
  isNullable = true,
  hasMore = false,
  defaultValueLabel,
  onSearch,
  fetchMore,
  className,
  onChange,
}) => {
  const { control, setValue, clearErrors } = useFormContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLButtonElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { controlId, errorId } = formFieldHtmlIds(name);

  const displayedOptions = useMemo(() => {
    if (isSearchable && !onSearch && searchTerm.trim().length > 0) {
      const normalized = searchTerm.trim().toLowerCase();
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(normalized),
      );
    }
    return options;
  }, [isSearchable, onSearch, searchTerm, options]);

  const handleSelect = (value: string | undefined) => {
    setValue(name, value);
    clearErrors(name);
    onChange?.(value);
    setPopoverOpen(false);
  };

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    if (!popoverOpen || !fetchMore || !hasMore || !sentinelRef.current) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isFetchingMore) {
          fetchMore?.();
        }
      },
      {
        root: commandListRef.current,
        rootMargin: "0px 0px 100px 0px",
        threshold: 0.1,
      },
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [popoverOpen, fetchMore, hasMore, isFetchingMore]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className={cn("relative w-full", className)}>
          {label ? (
            <FormFieldLabel
              htmlFor={controlId}
              label={label}
              isRequired={isRequired}
            />
          ) : null}

          <Popover open={popoverOpen} modal onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild disabled={disabled}>
              <button
                ref={inputRef}
                id={controlId}
                role="combobox"
                type="button"
                disabled={disabled}
                aria-expanded={popoverOpen}
                aria-controls={`${controlId}-listbox`}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  formControlComboboxTriggerClassName({
                    hasError: !!error,
                    disabled,
                    className: "flex items-center justify-between gap-2 pr-4",
                  }),
                  !field.value && "text-muted-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-left text-[length:var(--form-control-text)] font-normal">
                  {field.value
                    ? options.find((opt) => opt.value === field.value)?.label ||
                      defaultValueLabel
                    : `Select ${label}`}
                </span>
                <ChevronDown
                  className={cn(formControlChevronClassName, "text-primary")}
                  aria-hidden
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              className={formControlDropdownContentClassName}
              style={{ width: inputWidth }}
              align="start"
              side="bottom"
              sideOffset={4}
              avoidCollisions={false}
            >
              <Command
                className="bg-popover"
                shouldFilter={!onSearch}
                filter={onSearch ? () => 1 : undefined}
              >
                {isSearchable ? (
                  <CommandInput
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className={formControlCommandInputClassName}
                    value={searchTerm}
                    onValueChange={(val) => {
                      setSearchTerm(val);
                      onSearch?.(val);
                    }}
                  />
                ) : null}

                <CommandList
                  ref={commandListRef}
                  className={formControlCommandListClassName}
                >
                  {isLoading ? (
                    <CommandEmpty>
                      <LoadingSpinner />
                    </CommandEmpty>
                  ) : displayedOptions.length === 0 && !isNullable ? (
                    <CommandEmpty className={formControlCommandEmptyClassName}>
                      No {label.toLowerCase()} found.
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {isNullable ? (
                        <CommandItem
                          key="none"
                          onSelect={() => handleSelect(undefined)}
                          className={formControlCommandItemClassName}
                        >
                          None
                        </CommandItem>
                      ) : null}
                      {displayedOptions.map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={`${opt.label} ${opt.value}`}
                          onSelect={() => handleSelect(opt.value)}
                          className={formControlCommandItemClassName}
                        >
                          {opt.label}
                        </CommandItem>
                      ))}

                      <div
                        ref={sentinelRef}
                        style={{
                          height: "1px",
                          position: "relative",
                          top: "100px",
                        }}
                      />
                      {isFetchingMore ? (
                        <div className="flex justify-center p-2">
                          <LoadingSpinner />
                        </div>
                      ) : null}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ""} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  );
};

export default RHFSelectWithSearch;
