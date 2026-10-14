"use client";

import type * as React from "react";

import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";

interface CustomDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: "top" | "bottom" | "left" | "right";
  contentClassName?: string;
  footerClassName?: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const CustomDrawer = ({
  open,
  onOpenChange,
  direction = "right",
  contentClassName,
  footerClassName,
  children,
  header,
  footer,
}: CustomDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
      <DrawerContent
        className={`
          m-3 sm:m-5
          data-[vaul-drawer-direction=right]:w-[96vw]
          data-[vaul-drawer-direction=right]:sm:w-[760px]
          data-[vaul-drawer-direction=right]:lg:w-[72vw]
          data-[vaul-drawer-direction=right]:xl:w-[1100px]
          data-[vaul-drawer-direction=right]:sm:max-w-none
          ${contentClassName || ""}
        `}
      >
        {header}
        {children}
        {footer && (
          <DrawerFooter className={footerClassName}>{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};
