"use client";

import type { Mode } from "@/lib/types";

interface CampaignDashboardProps {
  servedCount: number;
  mode: Mode;
  bidCpm: number;
  bidWon: boolean;
}

const SPEND_PER_SERVE = 1.84; // hardcoded demo delta
const IMPRESSIONS_PER_SERVE = 1280;
const BUDGET = 50;

export default function CampaignDashboard({
  servedCount,
  mode,
  bidCpm,
  bidWon,
}: CampaignDashboardProps) {
  const spend = +(servedCount * SPEND_PER_SERVE).toFixed(2);
  const impressions = servedCount * IMPRESSIONS_PER_SERVE;
  const ctr = servedCount > 0 ? (mode === "forge" ? 4.7 : 1.2) : 0;
  const spendPct = Math.min((spend / BUDGET) * 100, 100);

  return (
    <footer className="grid grid-cols-2 gap-4 border-t border-white/10 px-6 py-4 sm:grid-cols-4">
      <Metric label="Spend" value={`$${spend.toFixed(2)}`} sub={`of $${BUDGET} budget`}>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${spendPct}%` }}
          />
        </div>
      </Metric>
      <Metric label="Impressions" value={impressions.toLocaleString()} sub="served" />
      <Metric label="CTR" value={`${ctr.toFixed(1)}%`} sub={mode === "forge" ? "contextual" : "static"} />
      <Metric
        label="Auction bid"
        value={`$${bidCpm.toFixed(2)} CPM`}
        sub={bidWon ? "won the auction" : "below threshold — skipped"}
        accent={bidWon ? "text-green-400" : "text-yellow-400"}
      />
    </footer>
  );
}

interface MetricProps {
  label: string;
  value: string;
  sub: string;
  accent?: string;
  children?: React.ReactNode;
}

function Metric({ label, value, sub, accent, children }: MetricProps) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className={`text-xl font-semibold tabular-nums ${accent ?? ""}`}>{value}</div>
      <div className="text-[11px] text-white/40">{sub}</div>
      {children}
    </div>
  );
}
