"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  label: string;
  value: string;
};

type FilterSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  /** Fixed width for toolbar filters (Figma: 160px). */
  widthClassName?: string;
  "aria-label"?: string;
};

/**
 * Shared table/toolbar filter select — Figma agent styling
 * (36px height, 6px radius, #E5E7EB border).
 */
export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  triggerClassName,
  widthClassName = "w-[160px]",
  "aria-label": ariaLabel,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "h-9 rounded-md border-[#E5E7EB] bg-white px-2.5 text-[13px] text-[#111827] shadow-none",
          widthClassName,
          triggerClassName,
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default FilterSelect;
