"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { pickerCardClass } from "./picker.styles";

type PickerCardProps = {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function PickerCard({
  children,
  className,
  bodyClassName,
}: PickerCardProps) {
  return (
    <Card padding="none" className={cn(pickerCardClass, className)}>
      <div
        className={cn("flex min-h-0 flex-col gap-3 sm:gap-2", bodyClassName)}
      >
        {children}
      </div>
    </Card>
  );
}
