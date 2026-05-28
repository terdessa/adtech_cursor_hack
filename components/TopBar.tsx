"use client";

import { SCENARIOS } from "@/lib/scenarios";
import { BRANDS } from "@/lib/brand";
import type { BrandId, Mode, ScenarioId } from "@/lib/types";

interface TopBarProps {
  scenarioId: ScenarioId;
  mode: Mode;
  brandId: BrandId;
  onScenarioChange: (id: ScenarioId) => void;
  onModeChange: (mode: Mode) => void;
  onBrandChange: (id: BrandId) => void;
}

const SCENARIO_ORDER: ScenarioId[] = ["A", "B", "C", "D"];

export default function TopBar({
  scenarioId,
  mode,
  brandId,
  onScenarioChange,
  onModeChange,
  onBrandChange,
}: TopBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight">🔥 Creative Forge</span>
        <label className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50">
          brand
          <select
            value={brandId}
            onChange={(e) => onBrandChange(e.target.value as BrandId)}
            className="bg-transparent text-sm font-medium text-white outline-none"
          >
            {Object.values(BRANDS).map((b) => (
              <option key={b.id} value={b.id} className="bg-[#11141b]">
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        {SCENARIO_ORDER.map((id) => {
          const active = id === scenarioId;
          const scenario = SCENARIOS[id];
          return (
            <button
              key={id}
              onClick={() => onScenarioChange(id)}
              className={`rounded-lg px-3 py-2 text-left transition ${
                active
                  ? scenario.live
                    ? "bg-orange-500/20 ring-1 ring-orange-400/50"
                    : "bg-white/15 ring-1 ring-white/30"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-sm font-medium">
                {id} · {scenario.label}
              </div>
              <div className="text-[11px] text-white/40">{scenario.blurb}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
        {(["static", "forge"] as Mode[]).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                active
                  ? m === "forge"
                    ? "bg-orange-500 text-white"
                    : "bg-white/80 text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </header>
  );
}
