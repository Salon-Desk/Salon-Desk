"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PORTAL_NAV } from "@/components/layout";
import { Button } from "@/components/ui";

interface HubHeaderProps {
  onOpenSandboxModal?: () => void;
}

export function HubHeader({ onOpenSandboxModal }: HubHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-slate-200/80 border-b bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <Logo size="sm" showTagline={false} linkToHome theme="light" />

        <nav className="hidden items-center gap-7 font-semibold text-slate-600 text-xs md:flex">
          {PORTAL_NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="whitespace-nowrap transition-colors hover:text-slate-900 hover:underline hover:underline-offset-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button variant="secondary" onClick={onOpenSandboxModal}>
          Sandbox Keys
        </Button>
      </div>
    </header>
  );
}
