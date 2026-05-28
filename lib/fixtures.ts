import type { BrandId, FixtureScenarioId, ForgeResponse } from "./types";
import { BID_THRESHOLD } from "./types";
import { BRANDS } from "./brand";

// Pre-generated Forge outputs for the scripted Coca-Cola scenarios (A/B/C).
// These are the demo's reliable backbone: clicking A/B/C with the default
// brand renders these instantly. Scenario C is deliberately rigged to fail the
// guardrail (sensitive context) so the escalation card fires on stage.

export const FIXTURES: Record<FixtureScenarioId, ForgeResponse> = {
  A: {
    brand: "Coca-Cola",
    intent: {
      score: 84,
      category: "reward",
      mood: "accomplished",
      flags: [],
    },
    variants: [
      {
        id: "a1",
        copy: "Crushed that 10k? Reward it with an ice-cold Coke.",
        score: 91,
        status: "approved",
      },
      {
        id: "a2",
        copy: "Big run done. Now for the part you look forward to.",
        score: 83,
        status: "approved",
      },
      {
        id: "a3",
        copy: "You earned this. Crack open a cold one.",
        score: 77,
        status: "approved",
      },
    ],
    guardrail: {
      passed: true,
      checks: [
        { rule: "No health/medical/hydration claims", passed: true },
        { rule: "No competitor mentions", passed: true },
        { rule: "No targeting vulnerable users", passed: true },
      ],
    },
    bidEligible: true,
  },
  B: {
    brand: "Coca-Cola",
    intent: {
      score: 71,
      category: "pick-me-up",
      mood: "drained",
      flags: [],
    },
    variants: [
      {
        id: "b1",
        copy: "3pm wall? Take a Coke break.",
        score: 86,
        status: "approved",
      },
      {
        id: "b2",
        copy: "Two calls to go. Pause, refresh, reset.",
        score: 79,
        status: "approved",
      },
      {
        id: "b3",
        copy: "Open a little happiness before the next meeting.",
        score: 72,
        status: "approved",
      },
    ],
    guardrail: {
      passed: true,
      checks: [
        { rule: "No health/medical/hydration claims", passed: true },
        { rule: "No competitor mentions", passed: true },
        { rule: "No targeting vulnerable users", passed: true },
      ],
    },
    bidEligible: true,
  },
  C: {
    brand: "Coca-Cola",
    intent: {
      score: 38,
      category: "refreshment",
      mood: "unwell",
      flags: ["sensitive-context"],
    },
    variants: [
      {
        id: "c1",
        copy: "Take it slow today — a little something familiar.",
        score: 55,
        status: "approved",
      },
      {
        id: "c2",
        copy: "The classic morning-after fix. Coca-Cola.",
        score: 49,
        status: "flagged",
        flagReason: "Implies a hangover cure — a health claim aimed at someone in distress.",
      },
      {
        id: "c3",
        copy: "Rough morning? Something easy to sip.",
        score: 44,
        status: "approved",
      },
    ],
    guardrail: {
      passed: false,
      checks: [
        { rule: "No health/medical/hydration claims", passed: false },
        { rule: "No competitor mentions", passed: true },
        { rule: "No targeting vulnerable users", passed: false },
      ],
    },
    bidEligible: false,
  },
};

// Neutral fallback for live generation (Scenario D, auto mode, or A/B/C under a
// non-default brand) when the network or key fails. It degrades to a "monitoring,
// no creative" state rather than fabricating a served ad — so a failed call is
// never mistaken for a real, low-intent match.
export function genericFallback(brandId: BrandId): ForgeResponse {
  const brand = BRANDS[brandId];
  return {
    brand: "None",
    assistantReply: "Got it — tell me a bit more about what's going on.",
    intent: { score: 12, category: "low intent", mood: "neutral", flags: [] },
    variants: [],
    guardrail: {
      passed: true,
      checks: brand.guardrailRules.map((rule) => ({ rule, passed: true })),
    },
    bidEligible: false,
  };
}

// Safety net: recompute the derived flag so a hand-edited fixture can't drift.
export function withDerivedBid(res: ForgeResponse): ForgeResponse {
  return { ...res, bidEligible: res.intent.score >= BID_THRESHOLD };
}
