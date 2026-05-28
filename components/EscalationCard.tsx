"use client";

import { useEffect, useState } from "react";
import type { Variant } from "@/lib/types";

interface EscalationCardProps {
  open: boolean;
  variant: Variant | null;
  onApprove: () => void;
  onSkip: () => void;
}

const COUNTDOWN_SECONDS = 30;

export default function EscalationCard({
  open,
  variant,
  onApprove,
  onSkip,
}: EscalationCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      return;
    }
    if (secondsLeft <= 0) {
      onSkip();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, secondsLeft, onSkip]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="forge-fade-up w-full max-w-md rounded-2xl border border-yellow-500/40 bg-[#11141b] p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-yellow-400">
          <span className="text-xl">⚠️</span>
          <span className="text-sm font-semibold uppercase tracking-wide">
            Human approval required
          </span>
        </div>

        <p className="mt-3 text-sm text-white/70">
          This conversation was flagged as a <strong>sensitive context</strong>.
          A variant tripped the brand guardrail and cannot serve without a human
          sign-off.
        </p>

        {variant && (
          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
            <div className="text-sm font-medium">&ldquo;{variant.copy}&rdquo;</div>
            {variant.flagReason && (
              <div className="mt-1 text-[12px] text-yellow-300/80">
                {variant.flagReason}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-white/40">
            Auto-skip in <span className="tabular-nums text-white/70">{secondsLeft}s</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
            >
              Skip
            </button>
            <button
              onClick={onApprove}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
