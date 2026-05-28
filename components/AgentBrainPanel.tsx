"use client";

import { useEffect, useState } from "react";
import type { ForgeResponse, Mode } from "@/lib/types";

interface AgentBrainPanelProps {
  forgeData: ForgeResponse | null;
  mode: Mode;
  isLoading: boolean;
  bidCpm: number;
  bidWon: boolean;
  rationale: string;
}

const THINKING_STEPS = [
  "Analyzing conversation intent…",
  "Drafting 3 creative variants…",
  "Scoring each for context fit…",
  "Running brand guardrails…",
];

export default function AgentBrainPanel({
  forgeData,
  mode,
  isLoading,
  bidCpm,
  bidWon,
  rationale,
}: AgentBrainPanelProps) {
  const active = mode === "forge" && forgeData !== null;

  // Animate the intent bar from 0 up to the real score on each new payload.
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (!active || !forgeData) {
      setBarWidth(0);
      return;
    }
    setBarWidth(0);
    const t = setTimeout(() => setBarWidth(forgeData.intent.score), 80);
    return () => clearTimeout(t);
  }, [active, forgeData]);

  // Cycle through the "thinking" steps while a live call is in flight.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!isLoading) {
      setStep(0);
      return;
    }
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, THINKING_STEPS.length - 1));
    }, 700);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (isLoading) {
    return (
      <section className="flex h-full flex-col justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="text-xs uppercase tracking-wide text-orange-400">Forging…</div>
        {THINKING_STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 text-sm transition ${
              i <= step ? "text-white/90" : "text-white/25"
            }`}
          >
            <span>{i < step ? "✅" : i === step ? "⏳" : "○"}</span>
            {label}
          </div>
        ))}
      </section>
    );
  }

  if (!active || !forgeData) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-center text-white/30">
        <div className="text-3xl">🧠</div>
        <div className="mt-2 max-w-[14rem] text-sm">
          Switch to <span className="text-orange-400">Forge</span> to watch the buy-side agent
          reason about this conversation.
        </div>
      </section>
    );
  }

  const { intent, variants, guardrail } = forgeData;

  // The agent only drafts creative when there's something to act on: biddable
  // intent, OR a safety concern (flag / failed guardrail). A bare "hi" has
  // neither, so the agent just monitors — it does not invent an ad.
  const actionable = bidWon || intent.flags.length > 0 || !guardrail.passed;

  return (
    <section className="flex h-full flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-white/40">
            {actionable ? "Matched advertiser" : "Agent"}
          </span>
          <span className="text-base font-semibold">
            {actionable ? forgeData.brand : "Monitoring conversation"}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            bidWon ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {bidWon ? `BID · $${bidCpm.toFixed(2)} CPM` : "SKIP"}
        </span>
      </div>

      {/* Intent */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-white/60">Intent score</span>
          <span className="font-semibold tabular-nums">{intent.score}/100</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip>{intent.category}</Chip>
          <Chip>mood: {intent.mood}</Chip>
          {intent.flags.map((f) => (
            <Chip key={f} tone="warn">
              {f}
            </Chip>
          ))}
        </div>
      </div>

      {!actionable ? (
        <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
          No biddable intent and no safety concerns detected — the agent is monitoring this
          conversation and has not generated or served any creative.
        </div>
      ) : (
        <>
      {/* Variants */}
      <div>
        <div className="mb-2 text-sm text-white/60">Creative variants</div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div
              key={v.id}
              className="forge-fade-up rounded-lg border border-white/10 bg-white/[0.03] p-3"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm">{v.copy}</div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    v.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {v.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-white/40">fit {v.score}/100</div>
              {v.flagReason && <div className="mt-1 text-[11px] text-yellow-300/80">{v.flagReason}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Guardrail */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-white/60">Brand guardrails</span>
          <span className={`text-xs font-semibold ${guardrail.passed ? "text-green-400" : "text-yellow-400"}`}>
            {guardrail.passed ? "passed" : "needs review"}
          </span>
        </div>
        <div className="space-y-1.5">
          {guardrail.checks.map((c) => (
            <div key={c.rule} className="flex items-center gap-2 text-sm">
              <span>{c.passed ? "✅" : "⚠️"}</span>
              <span className={c.passed ? "text-white/70" : "text-yellow-300/90"}>{c.rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Winner rationale */}
      <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[12px] text-white/60">
        {rationale}
      </div>
        </>
      )}
    </section>
  );
}

interface ChipProps {
  children: React.ReactNode;
  tone?: "default" | "warn";
}

function Chip({ children, tone = "default" }: ChipProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] ${
        tone === "warn" ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-white/60"
      }`}
    >
      {children}
    </span>
  );
}
