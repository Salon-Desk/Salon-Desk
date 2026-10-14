"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-60 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-lg border border-transparent bg-primary font-medium text-sm text-primary-foreground hover:bg-primary/80",
        primary:
          "rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-white shadow-sm hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]",
        outline:
          "rounded-lg border border-border bg-background font-medium text-sm hover:bg-muted hover:text-foreground",
        secondary:
          "rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 shadow-xs hover:bg-slate-200 hover:text-slate-900",
        ghost:
          "rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        destructive:
          "rounded-lg bg-destructive/10 font-medium text-destructive text-sm hover:bg-destructive/20",
        danger:
          "rounded-xl border border-rose-200 bg-rose-50 font-bold text-rose-700 hover:bg-rose-100",
        success:
          "rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700",
        dark: "rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800",
        paypal:
          "rounded-xl bg-[#FFC439] font-bold text-[#003087] shadow-md hover:bg-[#F4B41A] hover:shadow-lg",
        link: "font-medium text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "gap-1.5 px-3 py-1.5 text-xs",
        md: "gap-2 px-3.5 py-2 text-xs",
        lg: "gap-2 px-4 py-3 text-sm",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  },
);

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>;
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

/** Shared class string so `<Link>`s can match button styling exactly. */
export function buttonClasses({
  variant = "primary",
  size = "sm",
  fullWidth = false,
  className,
}: Pick<ButtonProps, "variant" | "size" | "fullWidth" | "className"> = {}) {
  return cn(
    buttonVariants({ variant, size }),
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
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      {...(!asChild ? { type } : {})}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
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

export { buttonVariants };
