"use client";

import { X } from "lucide-react";
import type React from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface CustomResponsiveDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  classNameContent?: string;
  classNameBody?: string;
  classNameHeader?: string;
  classNameFooter?: string;
  classNameCloseBtn?: string;
  hideFooterBorder?: boolean;
}

export interface CustomResponsiveDialogHandle {
  scrollToTop: () => void;
}

const CustomResponsiveDialog = forwardRef<
  CustomResponsiveDialogHandle,
  CustomResponsiveDialogProps
>(
  (
    {
      open,
      setOpen,
      children,
      header,
      footer,
      classNameContent,
      classNameBody,
      classNameHeader,
      classNameFooter,
      classNameCloseBtn,
      hideFooterBorder = false,
    },
    ref,
  ) => {
    const bodyRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      scrollToTop() {
        bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      },
    }));

    const isDesktop = useMediaQuery("(min-width: 768px)");

    const contentClasses = cn(
      "w-full max-w-lg rounded-xl border-none  [&>button]:hidden  scrollbar-hide bg-background shadow-xl",
      "p-0 gap-0 flex flex-col overflow-hidden ",
      "max-h-[90dvh] scrollbar-hide", // dynamic viewport height (fixes mobile browser height issues)
      classNameContent,
    );

    const bodyClasses = cn(
      "flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide",
      "px-5 sm:px-8 lg:px-0 py-6",
      "scrollbar-thin",
      classNameBody,
    );

    // Header and footer hug their content; each dialog owns its own chrome padding.
    // Only the footer keeps a bottom inset so action buttons never sit on the dialog edge.
    const headerClasses = cn("flex-none", classNameHeader);

    const footerClasses = cn(
      "flex-none pb-4",
      !hideFooterBorder && "border-t",
      classNameFooter,
    );

    const closeBtnClasses = cn(
      "absolute top-4 right-4 z-50",
      "rounded-full p-2 transition-colors",
      "hover:bg-muted",
      "text-muted-foreground hover:text-foreground",
      "cursor-pointer",
      classNameCloseBtn,
    );

    const CloseButton = (
      <button
        type="button"
        onClick={() => setOpen(false)}
        className={closeBtnClasses}
        aria-label="Close dialog"
      >
        <X className="w-5 h-5" />
      </button>
    );

    if (isDesktop) {
      return (
        <Dialog open={open} onOpenChange={setOpen} modal>
          <DialogContent className={contentClasses}>
            {CloseButton}

            {header ? (
              <DialogHeader className={headerClasses}>
                {header}
                {/* Visually hidden title for screen reader accessibility */}
                <DialogTitle className="sr-only">
                  {typeof header === "string" ? header : "Dialog"}
                </DialogTitle>
              </DialogHeader>
            ) : (
              /* Visually hidden title for screen reader accessibility when no header */
              <DialogTitle className="sr-only">Dialog</DialogTitle>
            )}

            <div ref={bodyRef} className={bodyClasses}>
              {children}
            </div>

            {footer && (
              <DialogFooter className={footerClasses}>{footer}</DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={open} onOpenChange={setOpen} modal>
        <DrawerContent
          className="rounded-t-2xl flex flex-col overflow-hidden [&>button]:hidden"
          style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
        >
          {CloseButton}
          {header ? (
            <DrawerHeader
              className={cn("p-0 [&>button]:hidden", headerClasses)}
            >
              {header}
              {/* Visually hidden title for screen reader accessibility */}
              <DrawerTitle className="sr-only">
                {typeof header === "string" ? header : "Dialog"}
              </DrawerTitle>
            </DrawerHeader>
          ) : (
            /* Visually hidden title for screen reader accessibility when no header */
            <DrawerTitle className="sr-only">Dialog</DrawerTitle>
          )}

          <div
            ref={bodyRef}
            className="flex-1 min-h-0 max-h-[70dvh] overflow-y-auto overflow-x-hidden scrollbar-thin"
          >
            {children}
          </div>

          {footer && (
            <DrawerFooter className={cn("p-0", footerClasses)}>
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  },
);

CustomResponsiveDialog.displayName = "CustomResponsiveDialog";

export default CustomResponsiveDialog;
