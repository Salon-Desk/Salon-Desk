import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface FilterDropdownOption {
  label: string;
  value: string;
}

export interface FilterDropdownProps {
  value: string;
  defaultLabel: string;
  options: Array<string | FilterDropdownOption>;
  onChange: (value: string) => void;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

export function FilterDropdown({
  value,
  defaultLabel,
  options,
  onChange,
  className,
  selectClassName,
  disabled,
  id,
  name,
  "aria-label": ariaLabel,
}: FilterDropdownProps) {
  const isActive = value !== "all" && value !== "";

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <select
        id={id}
        name={name}
        aria-label={ariaLabel ?? defaultLabel}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 w-[188px] cursor-pointer appearance-none rounded-full border bg-white pl-4 pr-9 text-[12px] font-semibold outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50",
          isActive
            ? "border-shega-orange font-bold text-shega-slate"
            : "border-shega-border text-shega-muted hover:border-slate-300",
          selectClassName,
        )}
      >
        <option value="all">{defaultLabel}</option>
        {options.map((opt) => {
          const optValue = typeof opt === "string" ? opt : opt.value;
          const optLabel = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <ChevronDownIcon className="size-3.5 text-shega-muted" />
      </div>
    </div>
  );
}

export default FilterDropdown;
