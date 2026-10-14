"use client";

import { Bot, Lock, Mic, Send, Sparkles, X } from "lucide-react";
import { Button, Drawer } from "@/components/ui";
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
  return (
    <Drawer
      onClose={onClose}
      title={
        <span className="flex items-center gap-1.5">
          AI Booking Concierge
          <span className="rounded border border-amber-400/30 bg-amber-500/20 px-1.5 font-mono text-[10px] text-amber-300">
            Gemini 2.5
          </span>
        </span>
      }
      subtitle={
        mode === "voice" ? "Voice Mode Active" : "Chat & Instant Proposal Mode"
      }
      icon={
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 font-bold text-slate-950 shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
      }
    >
      {/* Custom dark header actions are inside the drawer body because Drawer
          uses a light header. Recreate the concierge chrome in the first row. */}
      <div className="flex items-center justify-end gap-2 border-slate-200 border-b bg-slate-900 px-4 py-2">
        <button
          type="button"
          onClick={() => onModeChange(mode === "chat" ? "voice" : "chat")}
          className={`flex items-center gap-1 rounded-lg p-1.5 font-semibold text-xs transition-colors ${
            mode === "voice"
              ? "bg-amber-500 font-bold text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {mode === "voice" ? (
            <Mic className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          <span className="text-[11px]">
            {mode === "voice" ? "Voice" : "Chat"}
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

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
    </Drawer>
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
    ? "AI Speaking..."
    : isListening
      ? "Listening..."
      : "Voice Ready";

  return (
    <div className="flex flex-1 flex-col items-center justify-between bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
      <div className="mt-6 text-center">
        <span className="mb-3 inline-block rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-1 font-bold text-amber-300 text-xs">
          {status}
        </span>
        <h4 className="mb-1 font-bold text-lg text-white">Speak Naturally</h4>
        <p className="mx-auto max-w-xs text-slate-400 text-xs">
          Say what you want: &quot;Book a balayage Saturday with Elena&quot; or
          &quot;How does the $0 hold work?&quot;
        </p>
      </div>

      <div className="my-8 flex h-24 items-center justify-center gap-1.5">
        {WAVEFORM_BARS.map((bar, index) => {
          const barHeight =
            isListening || isSpeaking
              ? Math.max(
                  12,
                  Math.min(80, ((index % 4) + 1) * volumeLevel * 2.5),
                )
              : 8;
          return (
            <div
              key={bar}
              style={{ height: `${barHeight}px` }}
              className="w-1.5 rounded-full bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-150"
            />
          );
        })}
      </div>

      <div className="mb-6 w-full space-y-2">
        <span className="block text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider">
          Quick Voice Prompts
        </span>
        <VoiceChip
          text="Book Signature Balayage with Elena for Saturday"
          onClick={onVoiceTrigger}
        />
        <VoiceChip
          text="Book Precision Fade with Marcus tomorrow afternoon"
          onClick={onVoiceTrigger}
        />
        <VoiceChip
          text="Explain how the $0 hold policy works"
          onClick={onVoiceTrigger}
        />
      </div>

      <div className="mb-4 text-center">
        <button
          type="button"
          onClick={onToggleListen}
          className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
            isListening
              ? "animate-pulse bg-rose-500 text-white ring-8 ring-rose-500/30"
              : "bg-amber-500 text-slate-950 shadow-xl hover:bg-amber-600"
          }`}
        >
          <Mic className="h-7 w-7" />
        </button>
        <span className="mt-2 block text-[11px] text-slate-400">
          {isListening ? "Listening... Tap to stop" : "Tap to Speak"}
        </span>
      </div>
    </div>
  );
}

function VoiceChip({
  text,
  onClick,
}: {
  text: string;
  onClick: (text: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 p-2.5 text-left text-slate-200 text-xs transition-colors hover:bg-white/20"
    >
      <span>&quot;{text}&quot;</span>
      <Mic className="h-3.5 w-3.5 shrink-0 text-amber-400" />
    </button>
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
  return (
    <div className="flex flex-1 flex-col justify-between overflow-hidden bg-slate-50">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "rounded-tr-xs bg-slate-900 text-white"
                  : "rounded-tl-xs border border-slate-200 bg-white text-slate-800 shadow-xs"
              }`}
            >
              <p>{msg.text}</p>
              <span className="mt-1.5 block font-medium text-[9px] text-slate-400">
                {msg.time}
              </span>
            </div>

            {msg.sender === "assistant" &&
              msg.hasProposal &&
              msg.proposedService && (
                <ProposalCard message={msg} onAuthorize={onAuthorize} />
              )}
          </div>
        ))}

        {isThinking && (
          <div className="flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 text-xs">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span>AI Concierge is selecting the best stylist & slot...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto border-slate-200 border-t bg-white px-3 py-2 scrollbar-none">
        <QuickChip
          label="Fade with Marcus"
          onClick={() => onSend("Book Precision Fade with Marcus tomorrow")}
        />
        <QuickChip
          label="Balayage with Elena"
          onClick={() => onSend("I want Balayage with Elena this weekend")}
        />
        <QuickChip
          label="How hold works"
          onClick={() => onSend("How does the $0 hold protect me?")}
        />
      </div>

      <div className="flex items-center gap-2 border-slate-200 border-t bg-white p-3">
        <input
          type="text"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSend()}
          placeholder="Ask to book, check stylists, or policy..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden"
        />
        <button
          type="button"
          onClick={() => onSend()}
          disabled={!prompt.trim() || isThinking}
          className="shrink-0 rounded-xl bg-slate-900 p-2 text-white text-xs transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
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
  return (
    <div className="mt-2 w-full max-w-[94%] rounded-2xl border border-amber-200 bg-white p-3.5 shadow-xs">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="font-black text-[10px] text-amber-700 uppercase tracking-wider">
          Proposed Reservation
        </span>
      </div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h5 className="font-bold text-slate-900 text-xs">{service.name}</h5>
        <span className="font-black text-slate-900 text-xs">
          ${service.price}
        </span>
      </div>
      <div className="mb-3 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
        <div className="flex justify-between text-slate-600">
          <span>Stylist:</span>
          <span className="font-bold text-slate-900">
            {message.proposedStylist?.name || INITIAL_STAFF[0].name}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Time Slot:</span>
          <span className="font-bold text-slate-900">
            {message.proposedSlot || DEFAULT_TIME_SLOT}
          </span>
        </div>
        <div className="flex justify-between border-slate-200 border-t pt-1 font-semibold text-emerald-600">
          <span>Upfront Today:</span>
          <span>$0.00 (Zero Charge)</span>
        </div>
        <div className="flex justify-between font-semibold text-amber-700">
          <span>Deposit Hold:</span>
          <span>${service.holdDeposit} (PayPal Authorization)</span>
        </div>
      </div>
      <Button
        variant="primary"
        fullWidth
        onClick={() =>
          onAuthorize({
            service,
            stylist: message.proposedStylist,
            slot: message.proposedSlot,
          })
        }
      >
        <Lock className="h-3.5 w-3.5" />
        Authorize Hold with PayPal →
      </Button>
    </div>
  );
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-medium text-[11px] text-slate-700 hover:bg-slate-200"
    >
      {label}
    </button>
  );
}
