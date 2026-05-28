"use client";

interface HeatMeterProps {
  heat: number; // 0-100 current conversation intent
  threshold: number; // serve threshold
}

// Visualizes conversation intent climbing in real time. The agent only serves
// an ad once heat crosses the threshold — i.e. at the conversation's peak.
export default function HeatMeter({ heat, threshold }: HeatMeterProps) {
  const clamped = Math.max(0, Math.min(heat, 100));
  const peakReached = clamped >= threshold;

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide">
        <span className="text-white/40">🌡️ Conversation intent</span>
        <span className={peakReached ? "font-semibold text-orange-400" : "text-white/50"}>
          {peakReached ? "🔥 peak — serving" : "watching…"} · {Math.round(clamped)}
        </span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            peakReached
              ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.7)]"
              : "bg-gradient-to-r from-sky-500 to-amber-400"
          }`}
          style={{ width: `${clamped}%` }}
        />
        {/* serve threshold marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/60"
          style={{ left: `${threshold}%` }}
          title={`serve threshold ${threshold}`}
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-white/30">
        <span>cold</span>
        <span style={{ marginLeft: "auto" }}>serve @ {threshold}</span>
      </div>
    </div>
  );
}
