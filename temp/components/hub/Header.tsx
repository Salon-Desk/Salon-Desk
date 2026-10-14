'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

interface HeaderProps {
  onOpenSandboxModal?: () => void;
}

export function Header({ onOpenSandboxModal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark */}
        <Logo size="sm" showTagline={false} linkToHome={true} theme="light" />

        {/* Zone 2: Concise navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
          <Link
            href="/client"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Client Experience
          </Link>
          <Link
            href="/merchant"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Salon Console
          </Link>
          <Link
            href="/admin"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Platform Admin
          </Link>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSandboxModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Sandbox Keys
          </button>
        </div>
      </div>
    </header>
  );
}
