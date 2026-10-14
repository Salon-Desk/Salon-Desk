"use client";

type PickerCloseButtonProps = {
  onClose: () => void;
  label?: string;
};

export function PickerCloseButton({
  onClose,
  label = "Close picker",
}: PickerCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="flex size-6 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted sm:size-7"
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
