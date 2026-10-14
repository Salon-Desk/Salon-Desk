import { Loader } from "lucide-react";
import Link from "next/link";
import type React from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "submit" | "reset" | "button"; // optional, default 'button'
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "secondary"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean; // Controls width
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  icon,
  href,
  onClick,
  className,
  type = "button",
  isLoading = false,
  isDisabled = false,
  variant = "default",
  size = "default",
  fullWidth = true, // mobile-first full width
}) => {
  // size -> tailwind classes (can be extended)
  const sizeClassesMap: Record<string, string> = {
    default: "h-16 text-base rounded-[48px] px-6",
    sm: "h-10 text-sm rounded-md px-3",
    lg: "h-20 text-lg rounded-[56px] px-8",
    icon: "h-10 w-10 p-2 rounded-full",
  };
  const sizeClasses = sizeClassesMap[size] ?? sizeClassesMap.default;

  // default (primary) visual styles
  const defaultVariantClasses = cn(
    "cursor-pointer bg-primary text-primary-foreground",
    "hover:opacity-95 active:opacity-90",
    "shadow-[0_20px_25px_-5px_rgba(3,1,105,0.1),0_8px_10px_-6px_rgba(3,1,105,0.1)]",
    "transition-all duration-200 ease-in-out",
    "antialiased",
  );

  // outline variant additions — use ! to override shadcn outline hover (muted bg + foreground text)
  const outlineVariantClasses = cn(
    "cursor-pointer border border-primary bg-background text-primary shadow-none",
    "hover:!bg-primary hover:!text-primary-foreground",
    "dark:border-primary dark:bg-background dark:text-primary",
    "dark:hover:!bg-primary dark:hover:!text-primary-foreground",
    "[&_svg]:text-current",
    "transition-colors duration-200 ease-in-out",
    "antialiased",
  );

  // base classes from design system; always include so variants + sizes are predictable
  const baseVariantClass = buttonVariants({ variant, size });

  // width behavior
  const widthClass = fullWidth ? "w-full" : "w-auto";

  // build final className for the button element
  const finalClassName = cn(
    baseVariantClass,
    widthClass,
    sizeClasses,
    // append variant-specific classes AFTER buttonVariants so they can override if necessary
    variant === "default" ? defaultVariantClasses : null,
    variant === "outline" ? outlineVariantClasses : null,
    // allow consumer overrides last
    className,
  );

  // disabled state
  const disabled = isLoading || isDisabled;

  const content = (
    <span className={cn("inline-flex items-center justify-center gap-2")}>
      {icon && icon}
      <span>{title}</span>
      {isLoading && <Loader className="ml-1 h-4 w-4 animate-spin" />}
    </span>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={finalClassName}
        aria-busy={isLoading}
        aria-label={title}
      >
        {content}
      </Link>
    );
  }

  return (
    <Button
      disabled={disabled}
      type={type}
      onClick={onClick}
      className={finalClassName}
      aria-busy={isLoading}
      aria-disabled={disabled}
    >
      {content}
    </Button>
  );
};

export default PrimaryButton;
