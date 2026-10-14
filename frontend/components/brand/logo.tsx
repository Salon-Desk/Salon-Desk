"use client";

import Link from "next/link";
import { useId } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  linkToHome?: boolean;
  theme?: "light" | "dark";
  className?: string;
}

export function Logo({
  size = "md",
  showTagline = false,
  linkToHome = true,
  theme = "light",
  className = "",
}: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const iconDimensions = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }[size];

  const brandTextClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-5xl",
  }[size];

  const depositsTextClasses = {
    sm: "text-[9px] tracking-[0.25em]",
    md: "text-[12px] tracking-[0.3em]",
    lg: "text-[16px] tracking-[0.35em]",
    xl: "text-[22px] tracking-[0.4em]",
  }[size];

  const isLight = theme === "light";

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Visual Motif: Calendar Pad + Lock Shackle + Intersecting Shears + Sparkles */}
      <div
        className={`relative shrink-0 ${iconDimensions} flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 280 280"
          className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>SalonDesk Deposits</title>
          <defs>
            <linearGradient
              id={`${uid}-shackleGradient`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <linearGradient
              id={`${uid}-calPadGradient`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <linearGradient
              id={`${uid}-calHeaderGrad`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>

            <linearGradient
              id={`${uid}-bladeBlue`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>

          {/* Ambient Glow */}
          <circle cx="140" cy="140" r="110" fill="#F59E0B" opacity="0.15" />

          {/* Lock Shackle Arch */}
          <path
            d="M 95 140 C 95 75, 185 75, 185 140 L 185 160 L 160 160 L 160 140 C 160 95, 120 95, 120 140 L 120 160 L 95 160 Z"
            fill={`url(#${uid}-shackleGradient)`}
            stroke="#92400E"
            strokeWidth="2.5"
          />

          {/* Calendar Pad Body */}
          <rect
            x="45"
            y="125"
            width="190"
            height="135"
            rx="18"
            fill={`url(#${uid}-calPadGradient)`}
            stroke="#FDE68A"
            strokeWidth="3"
          />

          {/* Calendar Header */}
          <rect
            x="47"
            y="127"
            width="186"
            height="34"
            rx="15"
            fill={`url(#${uid}-calHeaderGrad)`}
          />

          {/* Calendar Ring Clips */}
          <rect x="80" y="115" width="14" height="20" rx="4" fill="#78350F" />
          <rect x="186" y="115" width="14" height="20" rx="4" fill="#78350F" />

          {/* Calendar Date Slots */}
          <g opacity="0.9">
            <rect x="65" y="172" width="30" height="26" rx="6" fill="#D97706" />
            <rect
              x="105"
              y="172"
              width="30"
              height="26"
              rx="6"
              fill="#D97706"
            />
            <rect
              x="145"
              y="172"
              width="30"
              height="26"
              rx="6"
              fill="#D97706"
            />
            {/* Active hold highlighted slot */}
            <rect
              x="185"
              y="172"
              width="30"
              height="26"
              rx="6"
              fill="#FEF08A"
              stroke="#FFF"
              strokeWidth="2"
            />

            <rect x="65" y="206" width="30" height="26" rx="6" fill="#B45309" />
            <rect
              x="105"
              y="206"
              width="30"
              height="26"
              rx="6"
              fill="#B45309"
            />
            <rect
              x="145"
              y="206"
              width="30"
              height="26"
              rx="6"
              fill="#B45309"
            />
            <rect
              x="185"
              y="206"
              width="30"
              height="26"
              rx="6"
              fill="#EA580C"
            />
          </g>

          {/* INTERSECTING STYLING SHEARS (SCISSORS) */}
          <g transform="translate(140, 175) rotate(-30) translate(-140, -175)">
            <path
              d="M 136 175 L 138 40 Q 140 30 142 40 L 144 175 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <path
              d="M 136 175 L 133 245 Q 130 262 115 270 Q 95 275 90 255 Q 85 235 110 230 Q 125 230 133 210 Z"
              fill={`url(#${uid}-bladeBlue)`}
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <circle
              cx="106"
              cy="252"
              r="14"
              fill="#090D16"
              stroke="#38BDF8"
              strokeWidth="2"
            />
          </g>

          <g transform="translate(140, 175) rotate(30) translate(-140, -175)">
            <path
              d="M 136 175 L 138 40 Q 140 30 142 40 L 144 175 Z"
              fill="#38BDF8"
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <path
              d="M 144 175 L 147 245 Q 150 262 165 270 Q 185 275 190 255 Q 195 235 170 230 Q 155 230 147 210 Z"
              fill={`url(#${uid}-bladeBlue)`}
              stroke="#38BDF8"
              strokeWidth="2"
            />
            {/* Pinky spur */}
            <path
              d="M 185 268 Q 200 274 208 288 Q 196 284 188 273 Z"
              fill="#2563EB"
            />
            <circle
              cx="174"
              cy="252"
              r="14"
              fill="#090D16"
              stroke="#38BDF8"
              strokeWidth="2"
            />
          </g>

          {/* Central Pivot Gold Rivet */}
          <circle
            cx="140"
            cy="175"
            r="9"
            fill="#FEF08A"
            stroke="#B45309"
            strokeWidth="2"
          />
          <circle cx="140" cy="175" r="4" fill="#78350F" />

          {/* Sparkling Diamond Stars */}
          <path
            d="M 65 95 Q 65 105 75 105 Q 65 105 65 115 Q 65 105 55 105 Q 65 105 65 95 Z"
            fill="#FEF08A"
          />
          <path
            d="M 215 95 Q 215 105 225 105 Q 215 105 215 115 Q 215 105 205 105 Q 215 105 215 95 Z"
            fill="#FBBF24"
          />
          <path
            d="M 140 270 Q 140 278 148 278 Q 140 278 140 286 Q 140 278 132 278 Q 140 278 140 270 Z"
            fill="#FEF08A"
          />
        </svg>
      </div>

      {/* Typography: "SalonDesk" + "DEPOSITS" */}
      <div className="flex flex-col">
        <div
          className={`font-black tracking-tight leading-none ${
            isLight ? "text-slate-900" : "text-white"
          } ${brandTextClasses}`}
        >
          Salon
          <span className={isLight ? "text-sky-600" : "text-[#38BDF8]"}>
            Desk
          </span>
        </div>
        <div
          className={`font-black uppercase text-transparent bg-clip-text ${
            isLight
              ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700"
              : "bg-gradient-to-r from-[#FDE68A] via-[#F59E0B] to-[#D97706]"
          } leading-none mt-1 ${depositsTextClasses}`}
        >
          DEPOSITS
        </div>
        {showTagline && (
          <span
            className={`text-[10px] ${
              isLight ? "text-slate-500" : "text-[#94A3B8]"
            } tracking-wider uppercase font-semibold mt-1`}
          >
            A hold, not a charge
          </span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        href="/"
        className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
