"use client";

import Image from "next/image";
import type React from "react";

import { cn, getPublicAbsoluteURL } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  showLogo?: boolean;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  text = "Loading, please wait...",
  showLogo = false,
  overlay = false,
}) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const logoSizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const spinnerContent = (
    <div
      className={cn(
        "flex flex-col justify-center items-center",
        overlay ? "min-h-screen" : "",
        className,
      )}
    >
      {/* Logo */}
      {showLogo && (
        <>
          <Image
            width={280}
            height={280}
            alt="logo"
            src={getPublicAbsoluteURL("/logo-light.png")}
            className={cn(
              "block dark:hidden",
              "mb-4 animate-pulse",
              logoSizeClasses[size],
            )}
            priority
          />

          <Image
            width={280}
            height={280}
            alt="logo"
            src={getPublicAbsoluteURL("/logo-dark.png")}
            className={cn("hidden dark:block", logoSizeClasses[size])}
            priority
          />
        </>
      )}

      {/* Spinner Container */}
      <div className="relative flex items-center justify-center">
        {/* Background Circle */}
        <div
          className={cn(
            "absolute rounded-full bg-[#1A1612]",
            sizeClasses[size],
          )}
        />

        {/* Main Spinner */}
        <svg
          className={cn(
            "animate-spin text-[#CBB26A] relative",
            sizeClasses[size],
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <title>Loading</title>
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8v2a6 6 0 0 0-6 6H4z"
          />
        </svg>

        {/* Inner Pulse Dot */}
        <div
          className={cn(
            "absolute rounded-full bg-[#CBB26A] animate-ping",
            size === "sm"
              ? "w-1 h-1"
              : size === "md"
                ? "w-1.5 h-1.5"
                : size === "lg"
                  ? "w-2 h-2"
                  : "w-3 h-3",
          )}
        />
      </div>

      {/* Loading Text */}
      {text && (
        <p
          className={cn(
            "mt-4 text-[#B8B2A8] font-medium",
            textSizeClasses[size],
          )}
        >
          {text}
        </p>
      )}

      {/* Dots Animation */}
      <div className="flex space-x-1 mt-2">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className={cn(
              "bg-[#CBB26A] rounded-full animate-bounce",
              size === "sm"
                ? "w-1 h-1"
                : size === "md"
                  ? "w-1.5 h-1.5"
                  : size === "lg"
                    ? "w-2 h-2"
                    : "w-2.5 h-2.5",
            )}
            style={{ animationDelay: `${dot * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-[#110D09]/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

const SimpleLoadingSpinner = () => <LoadingSpinner />;

export default LoadingSpinner;
export { SimpleLoadingSpinner };
