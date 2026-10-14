"use client";
import Image from "next/image";
import { type ReactElement, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn, getPublicAbsoluteURL } from "@/lib/utils";

import { CounterRow } from "./picker/CounterRow";
import {
  pickerDoneButtonClass,
  pickerGuestPopoverClass,
} from "./picker/picker.styles";
import { ResponsiveFormPicker } from "./picker/ResponsiveFormPicker";
import { useIsPickerMobile } from "./picker/useIsPickerMobile";

const MIN_ROOMS = 1;
const MAX_ROOMS = 50;

function parseRoomCount(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return MIN_ROOMS;
  }
  return Math.min(MAX_ROOMS, Math.max(MIN_ROOMS, parsed));
}

export function RoomCountInput({
  value,
  onValueChange,
  id = "booking-filter-rooms",
  label = "No. of Rooms",
  placeholder = "Enter No. of Rooms",
  hasError = false,
  trigger,
}: {
  value: string;
  onValueChange: (next: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  hasError?: boolean;
  trigger?: (args: {
    roomCount: number;
    formattedValue: string;
    hasValue: boolean;
  }) => ReactElement;
}) {
  const parsed = parseRoomCount(value);
  const [open, setOpen] = useState(false);
  const [draftRooms, setDraftRooms] = useState(parsed);
  const isMobile = useIsPickerMobile();

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftRooms(parseRoomCount(value));
    }
    setOpen(next);
  };

  const activeRooms = open ? draftRooms : parsed;
  const canConfirm = draftRooms >= MIN_ROOMS;

  const handleDone = () => {
    if (!canConfirm) {
      return;
    }
    onValueChange(String(draftRooms));
    setOpen(false);
  };

  const formattedValue =
    parsed >= MIN_ROOMS ? `${parsed} Room${parsed !== 1 ? "s" : ""}` : "";
  const hasValue = parsed >= MIN_ROOMS;

  const triggerEl = trigger ? (
    trigger({ roomCount: parsed, formattedValue, hasValue })
  ) : (
    <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
      <label
        className="ml-1 text-xs font-medium text-foreground sm:text-sm"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative w-full min-w-0">
        <Image
          src={getPublicAbsoluteURL("/svg/room/bed.svg")}
          alt=""
          width={20}
          height={20}
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:size-5"
          aria-hidden
        />
        <input
          id={id}
          type="text"
          readOnly
          value={formattedValue}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full min-w-0 rounded-full border bg-background py-2.5 pl-9 pr-3 text-xs text-text-color placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-11 sm:px-4 sm:pl-10 sm:text-sm lg:h-12",
            hasError
              ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
              : "border-light-text-color focus-visible:border-ring focus-visible:ring-ring",
          )}
        />
      </div>
    </div>
  );

  return (
    <ResponsiveFormPicker
      open={open}
      onOpenChange={handleOpenChange}
      title="Select No. of Rooms"
      srTitle="Select Rooms"
      closeLabel="Close room picker"
      trigger={triggerEl}
      popoverAlign="center"
      popoverMatchTriggerWidth={false}
      popoverClassName={pickerGuestPopoverClass}
      cardBodyClassName={
        isMobile ? "flex min-h-0 flex-1 flex-col gap-3" : undefined
      }
    >
      <div className="flex flex-col gap-0 rounded-2xl px-1">
        <CounterRow
          label="Rooms"
          description="Number of rooms needed"
          icon={getPublicAbsoluteURL("/svg/room/bed.svg")}
          value={activeRooms}
          min={MIN_ROOMS}
          max={MAX_ROOMS}
          onChange={setDraftRooms}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!canConfirm}
          onClick={handleDone}
          className={cn(pickerDoneButtonClass, isMobile && "w-full")}
        >
          Done
        </Button>
      </div>
    </ResponsiveFormPicker>
  );
}
