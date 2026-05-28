"use client";

import { useEffect, useState } from "react";
import { STATIC_BANNER } from "@/lib/scenarios";
import type { Scenario } from "@/lib/scenarios";
import type { ChatMessage, Mode, Variant } from "@/lib/types";
import HeatMeter from "./HeatMeter";

interface ConversationPanelProps {
  scenario: Scenario;
  mode: Mode;
  messages: ChatMessage[];
  winner: Variant | null;
  brandName: string;
  staticHeadline: string;
  peakScore: number; // the intent score the conversation reaches at its peak
  serveThreshold: number; // heat must clear this before an ad serves
  bidCpm: number;
  rationale: string;
  isLoading: boolean;
  hasResult: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onSubmitLive: (text: string) => void;
}

const TYPING_DELAY_MS = 450;

export default function ConversationPanel({
  scenario,
  mode,
  messages,
  winner,
  brandName,
  staticHeadline,
  peakScore,
  serveThreshold,
  bidCpm,
  rationale,
  isLoading,
  hasResult,
  canRegenerate,
  onRegenerate,
  onSubmitLive,
}: ConversationPanelProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [draft, setDraft] = useState("");

  // Scripted scenarios replay with a typing delay; live (D) messages appear
  // instantly as the judge submits them.
  useEffect(() => {
    if (scenario.live) {
      setVisibleCount(messages.length);
      return;
    }
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= messages.length; i++) {
      timers.push(setTimeout(() => setVisibleCount(i), i * TYPING_DELAY_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [scenario.id, scenario.live, messages.length]);

  const allShown = visibleCount >= messages.length;

  // Conversation intent "heat". For scripted scenarios it climbs as messages
  // reveal toward the scenario's peak score; for live (D) it reflects the
  // latest forge result. No result yet → cold.
  const progress = messages.length > 0 ? visibleCount / messages.length : 0;
  const heat = scenario.live ? (hasResult ? peakScore : 0) : peakScore * progress;
  const peakReached = heat >= serveThreshold;

  // Static mode always shows the banner once the conversation has played out.
  // Forge mode only serves at the peak — and live scenarios need a result first.
  const conversationReady = allShown && (mode === "static" || !scenario.live || hasResult);
  const showStaticAd = mode === "static" && conversationReady;
  const showForgeSlot = mode === "forge" && conversationReady;

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text || isLoading) return;
    onSubmitLive(text);
    setDraft("");
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-white/40">
        Live conversation · user {scenario.id}
      </div>

      {mode === "forge" && <HeatMeter heat={heat} threshold={serveThreshold} />}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.slice(0, visibleCount).map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`forge-fade-up max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user" ? "bg-blue-600/80 text-white" : "bg-white/10 text-white/90"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {scenario.live && messages.length === 0 && !isLoading && (
          <div className="py-8 text-center text-sm text-white/30">
            Type what the user is saying, then forge a live ad ↓
          </div>
        )}

        {/* Static: the same banner always serves. */}
        {showStaticAd && (
          <div className="forge-fade-up pt-2">
            <AdCard label="Sponsored" headline={staticHeadline} sub={STATIC_BANNER.subtext} tone="static" />
          </div>
        )}

        {/* Forge: the agent only serves once heat reaches the peak threshold.
            Below the threshold the heat meter above conveys the holding state. */}
        {showForgeSlot && peakReached && (
          <div className="forge-fade-up pt-2">
            {winner ? (
              <AdCard
                label={`${brandName || "Sponsored"} · won at $${bidCpm.toFixed(2)} CPM`}
                headline={winner.copy}
                sub={rationale}
                tone="forge"
              />
            ) : (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300/80">
                Peak intent, but no eligible creative — held for human review.
              </div>
            )}
          </div>
        )}
      </div>

      {scenario.live ? (
        <div className="flex gap-2 border-t border-white/10 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. just landed my dream job!"
            className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:bg-white/10"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !draft.trim()}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50"
          >
            {isLoading ? "Forging…" : "⚡ Forge"}
          </button>
        </div>
      ) : (
        canRegenerate && (
          <div className="border-t border-white/10 p-3">
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50"
            >
              {isLoading ? "Forging…" : "⚡ Regenerate (live)"}
            </button>
          </div>
        )
      )}
    </section>
  );
}

interface AdCardProps {
  label: string;
  headline: string;
  sub: string;
  tone: "static" | "forge";
}

function AdCard({ label, headline, sub, tone }: AdCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "forge"
          ? "border-orange-500/40 bg-gradient-to-br from-orange-500/15 to-transparent"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-1 text-base font-semibold">{headline}</div>
      <div className="mt-0.5 text-xs text-white/50">{sub}</div>
    </div>
  );
}
