"use client";

import * as React from "react";

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PickerCard } from "./PickerCard";
import { PickerHeader } from "./PickerHeader";
import { usePickerOpen } from "./PickerOpenContext";
import {
  pickerDrawerContentClass,
  pickerPopoverContentBaseClass,
  pickerPopoverMatchWidthClass,
} from "./picker.styles";
import { useIsPickerMobile } from "./useIsPickerMobile";

type ResponsiveFormPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  srTitle?: string;
  trigger: React.ReactElement;
  children: React.ReactNode;
  closeLabel?: string;
  popoverAlign?: "start" | "center";
  popoverMatchTriggerWidth?: boolean;
  popoverClassName?: string;
  drawerClassName?: string;
  cardClassName?: string;
  cardBodyClassName?: string;
};

export function ResponsiveFormPicker({
  open,
  onOpenChange,
  title,
  srTitle,
  trigger,
  children,
  closeLabel,
  popoverAlign = "start",
  popoverMatchTriggerWidth = true,
  popoverClassName,
  drawerClassName,
  cardClassName,
  cardBodyClassName,
}: ResponsiveFormPickerProps) {
  const isMobile = useIsPickerMobile();
  const { setPickerOpen } = usePickerOpen();
  const close = () => onOpenChange(false);
  const header = title && (
    <PickerHeader title={title} onClose={close} closeLabel={closeLabel} />
  );

  // Hide sticky nav while this picker drawer is open on mobile
  React.useEffect(() => {
    if (!isMobile || !open) {
      return;
    }
    setPickerOpen(true);
    return () => setPickerOpen(false);
  }, [open, isMobile, setPickerOpen]);

  const desktopCard = (
    <PickerCard className={cardClassName} bodyClassName={cardBodyClassName}>
      {title && <div className="shrink-0">{header}</div>}
      {children}
    </PickerCard>
  );

  const mobileCard = (
    <PickerCard className={cardClassName} bodyClassName={cardBodyClassName}>
      {children}
    </PickerCard>
  );

  if (isMobile) {
    return (
      <div className="w-full min-w-0">
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>

          <DrawerContent
            className={cn(pickerDrawerContentClass, drawerClassName)}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {srTitle && (
              <DrawerTitle className="sr-only">{srTitle}</DrawerTitle>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              {header ? <div className="shrink-0 pt-1">{header}</div> : null}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {mobileCard}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <Popover open={open} onOpenChange={onOpenChange} modal={false}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>

        <PopoverContent
          side="bottom"
          align={popoverAlign}
          sideOffset={8}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={cn(
            pickerPopoverContentBaseClass,
            popoverMatchTriggerWidth && pickerPopoverMatchWidthClass,
            popoverClassName,
          )}
        >
          {desktopCard}
        </PopoverContent>
      </Popover>
    </div>
  );
}
