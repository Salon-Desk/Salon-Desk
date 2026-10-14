"use client";

import { Bot, Clock, Lock, Mic, Send, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import type { ConciergeMessage } from "@/hooks";
import { INITIAL_STAFF } from "@/lib/data/catalog";
import { DEFAULT_TIME_SLOT } from "@/lib/data/service-content";
import type { SalonService, StaffMember } from "@/types";

const WAVEFORM_BARS = [
  "w1",
  "w2",
  "w3",
  "w4",
  "w5",
  "w6",
  "w7",
  "w8",
  "w9",
  "w10",
  "w11",
  "w12",
  "w13",
  "w14",
  "w15",
  "w16",
] as const;

interface AiConciergeProps {
  mode: "voice" | "chat";
  onModeChange: (mode: "voice" | "chat") => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  isThinking: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  messages: ConciergeMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSend: (prompt?: string, service?: SalonService) => void;
  onVoiceTrigger: (text: string) => void;
  onToggleListen: () => void;
  onAuthorize: (opts: {
    service: SalonService;
    stylist?: StaffMember;
    slot?: string;
  }) => void;
  onClose: () => void;
}

export function AiConcierge({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  isThinking,
  isListening,
  isSpeaking,
  volumeLevel,
  messages,
  messagesEndRef,
  onSend,
  onVoiceTrigger,
  onToggleListen,
  onAuthorize,
  onClose,
}: AiConciergeProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close concierge"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Concierge"
        className="relative flex h-full w-full max-w-full sm:max-w-md flex-col border-l border-slate-200 bg-white text-slate-900 shadow-2xl animate-in slide-in-from-right-8 duration-300"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="pt-2 pb-1 sm:hidden flex justify-center">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Clean Light-Themed Header */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Sparkles className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">AI Concierge</h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Gemini 2.5
              </p>
            </div>
          </div>

          {/* Minimal Mode Toggle & Close Button */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => onModeChange("chat")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  mode === "chat"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-amber-600" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => onModeChange("voice")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  mode === "voice"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Mic className="h-3.5 w-3.5 text-amber-600" />
                <span>Voice</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        {mode === "voice" ? (
          <VoiceSurface
            isListening={isListening}
            isSpeaking={isSpeaking}
            volumeLevel={volumeLevel}
            onVoiceTrigger={onVoiceTrigger}
            onToggleListen={onToggleListen}
          />
        ) : (
          <ChatSurface
            messages={messages}
            messagesEndRef={messagesEndRef}
            isThinking={isThinking}
            prompt={prompt}
            onPromptChange={onPromptChange}
            onSend={onSend}
            onAuthorize={onAuthorize}
          />
        )}
      </div>
    </div>
  );
}

function VoiceSurface({
  isListening,
  isSpeaking,
  volumeLevel,
  onVoiceTrigger,
  onToggleListen,
}: {
  isListening: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  onVoiceTrigger: (text: string) => void;
  onToggleListen: () => void;
}) {
  const status = isSpeaking
    ? "Speaking..."
    : isListening
      ? "Listening..."
      : "Tap to Speak";

  return (
    <div className="flex flex-1 flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-50 via-white to-amber-50/20 text-slate-900 overflow-y-auto">
      {/* Top Status */}
      <div className="pt-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isListening
              ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
              : isSpeaking
                ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status}
        </span>
      </div>

      {/* Dynamic Sound Waveform Bars */}
      <div className="my-8 flex h-20 items-center justify-center gap-1.5 px-4">
        {WAVEFORM_BARS.map((bar, index) => {
          const barHeight =
            isListening || isSpeaking
              ? Math.max(
                  12,
                  Math.min(72, ((index % 5) + 1) * volumeLevel * 2.5),
                )
              : 8;
          return (
            <div
              key={bar}
              style={{ height: `${barHeight}px` }}
              className="w-1.5 rounded-full bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-150"
            />
          );
        })}
      </div>

      {/* Clean Quick Prompts */}
      <div className="w-full max-w-xs space-y-2 mb-6">
        <button
          type="button"
          onClick={() =>
            onVoiceTrigger("Book Precision Fade tomorrow with Marcus")
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:border-amber-300 transition-colors shadow-xs cursor-pointer truncate"
        >
          &quot;Book Precision Fade tomorrow with Marcus&quot;
        </button>
        <button
          type="button"
          onClick={() =>
            onVoiceTrigger("Book Signature Balayage this Saturday")
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:border-amber-300 transition-colors shadow-xs cursor-pointer truncate"
        >
          &quot;Book Signature Balayage this Saturday&quot;
        </button>
      </div>

      {/* Central Mic Button */}
      <div className="mb-4 text-center">
        <button
          type="button"
          onClick={onToggleListen}
          aria-label={isListening ? "Stop listening" : "Start speaking"}
          className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 shadow-lg cursor-pointer ${
            isListening
              ? "bg-rose-500 text-white ring-8 ring-rose-500/20 scale-105"
              : "bg-gradient-to-tr from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:scale-105 shadow-amber-500/25"
          }`}
        >
          <Mic className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

function ChatSurface({
  messages,
  messagesEndRef,
  isThinking,
  prompt,
  onPromptChange,
  onSend,
  onAuthorize,
}: {
  messages: ConciergeMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isThinking: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: (prompt?: string) => void;
  onAuthorize: (opts: {
    service: SalonService;
    stylist?: StaffMember;
    slot?: string;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-1 flex-col justify-between overflow-hidden bg-slate-50/70">
      {/* Messages Thread */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "rounded-tr-xs bg-slate-900 text-white font-medium shadow-xs"
                    : "rounded-tl-xs border border-slate-200/90 bg-white text-slate-800 shadow-xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Minimal Clean Proposal Card */}
              {!isUser && msg.hasProposal && msg.proposedService && (
                <ProposalCard message={msg} onAuthorize={onAuthorize} />
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span>Finding available slots...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Minimal Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200/80 bg-white px-3 py-2 scrollbar-none snap-x">
        <button
          type="button"
          onClick={() => onSend("Book Precision Fade with Marcus")}
          className="snap-start shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-amber-300 transition-colors cursor-pointer"
        >
          Fade with Marcus
        </button>
        <button
          type="button"
          onClick={() => onSend("Book Balayage this Saturday")}
          className="snap-start shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-amber-300 transition-colors cursor-pointer"
        >
          Balayage this Saturday
        </button>
        <button
          type="button"
          onClick={() => onSend("How does the $0 hold work?")}
          className="snap-start shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-amber-300 transition-colors cursor-pointer"
        >
          How $0 hold works
        </button>
      </div>

      {/* Sleek Light Input Bar */}
      <div className="border-t border-slate-200/80 bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ask or book anything..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-hidden transition-colors"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 transition-all hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ProposalCard({
  message,
  onAuthorize,
}: {
  message: ConciergeMessage;
  onAuthorize: (opts: {
    service: SalonService;
    stylist?: StaffMember;
    slot?: string;
  }) => void;
}) {
  const service = message.proposedService;
  if (!service) return null;

  const stylist = message.proposedStylist || INITIAL_STAFF[0];
  const slot = message.proposedSlot || DEFAULT_TIME_SLOT;

  return (
    <div className="mt-2.5 w-full max-w-[92%] rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-3.5 text-slate-900 shadow-sm">
      {/* Title & Price */}
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="font-bold text-sm text-slate-900 truncate">
          {service.name}
        </h4>
        <span className="font-extrabold text-sm text-slate-900 shrink-0">
          ${service.price}
        </span>
      </div>

      {/* Time & Stylist info */}
      <div className="mb-3 flex items-center justify-between text-xs text-slate-700 rounded-lg bg-white border border-slate-200/80 px-2.5 py-1.5 shadow-2xs">
        <span className="flex items-center gap-1.5 text-slate-700">
          <User className="h-3 w-3 text-amber-600" />
          {stylist.name}
        </span>
        <span className="flex items-center gap-1.5 text-slate-700">
          <Clock className="h-3 w-3 text-amber-600" />
          {slot}
        </span>
      </div>

      {/* Direct One-Click Button */}
      <Button
        variant="primary"
        fullWidth
        onClick={() =>
          onAuthorize({
            service,
            stylist,
            slot,
          })
        }
        className="w-full py-2 font-bold text-xs cursor-pointer shadow-xs"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Hold with PayPal ($0 today) →</span>
      </Button>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span>${service.holdDeposit} hold amount</span>
        <span>Free 24h cancel</span>
      </div>
    </div>
  );
}
