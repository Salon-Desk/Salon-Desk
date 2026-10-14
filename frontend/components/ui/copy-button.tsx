"use client";

import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  value: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
  label?: string;
  className?: string;
}

/** Pairs with the `useClipboard` hook; swaps to a check for ~2s after copying. */
export function CopyButton({
  value,
  copyKey,
  copiedKey,
  onCopy,
  label = "Copy to clipboard",
  className,
}: CopyButtonProps) {
  const isCopied = copiedKey === copyKey;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onCopy(value, copyKey);
      }}
      className={cn(
        "shrink-0 text-slate-400 transition-colors hover:text-amber-600",
        className,
      )}
    >
      {isCopied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/** Mono value box with an inline copy affordance. */
export function CopyableValue({
  value,
  copyKey,
  copiedKey,
  onCopy,
  className,
}: CopyButtonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded border border-slate-200 bg-white p-2 font-mono text-slate-800 text-xs",
        className,
      )}
    >
      <span className="truncate">{value}</span>
      <CopyButton
        value={value}
        copyKey={copyKey}
        copiedKey={copiedKey}
        onCopy={onCopy}
      />
    </div>
  );
}
