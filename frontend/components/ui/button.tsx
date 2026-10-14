import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "dark"
  | "paypal";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:from-amber-600 hover:to-amber-700",
  secondary:
    "bg-slate-100 text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-200 hover:text-slate-900",
  ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  danger: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
  success:
    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
  // PayPal's own button palette — kept literal so checkout reads as authentic.
  paypal:
    "bg-[#FFC439] text-[#003087] shadow-md hover:bg-[#F4B41A] hover:shadow-lg",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-xs gap-2",
  lg: "px-4 py-3 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

/** Shared class string so `<Link>`s can match button styling exactly. */
export function buttonClasses({
  variant = "primary",
  size = "sm",
  fullWidth = false,
  className,
}: Pick<ButtonProps, "variant" | "size" | "fullWidth" | "className"> = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-bold whitespace-nowrap transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "sm",
  fullWidth = false,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}

/** Small square button used for row-level edit/delete affordances. */
export function IconButton({
  tone = "neutral",
  className,
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-lg border p-1.5 shadow-xs transition-colors disabled:pointer-events-none disabled:opacity-60",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
