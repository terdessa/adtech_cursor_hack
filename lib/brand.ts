import type { BrandId } from "./types";

// Brand registry. The selected brand drives the live LLM prompt and the
// guardrail checklist labels. Coca-Cola is the default demo brand; Red Bull
// is the contrast brand used to show the platform adapting to any advertiser.

export interface BrandBrief {
  id: BrandId;
  name: string;
  product: string;
  tone: string;
  // Sent to the model as the rules it must obey.
  guardrails: string[];
  // Human-readable labels shown ticking in the guardrail checklist.
  guardrailRules: string[];
  // The single static banner headline shown in Static mode (the "old world").
  staticHeadline: string;
}

export const DEFAULT_BRAND: BrandId = "coca-cola";

// Universal guardrails applied when the agent is choosing the brand (auto mode).
export const AUTO_GUARDRAIL_RULES = [
  "No health/medical claims",
  "No deceptive or competitor-disparaging claims",
  "No targeting vulnerable users",
];

export const BRANDS: Record<BrandId, BrandBrief> = {
  auto: {
    id: "auto",
    name: "✨ Auto (best match)",
    product: "any advertiser",
    tone: "match the chosen brand's voice, max 12 words per ad",
    guardrails: [
      "no health or medical claims",
      "no deceptive or competitor-disparaging claims",
      "no targeting people in distress",
    ],
    guardrailRules: AUTO_GUARDRAIL_RULES,
    staticHeadline: "Your Ad Here — One Size Fits All.",
  },
  "coca-cola": {
    id: "coca-cola",
    name: "Coca-Cola",
    product: "refreshing soft drink",
    tone: "warm, uplifting, optimistic, max 12 words per ad",
    guardrails: [
      "no health, medical, or hydration/recovery claims",
      "no competitor mentions",
      "no targeting people in distress",
    ],
    guardrailRules: [
      "No health/medical/hydration claims",
      "No competitor mentions",
      "No targeting vulnerable users",
    ],
    staticHeadline: "Coca-Cola — Taste the Feeling.",
  },
  "red-bull": {
    id: "red-bull",
    name: "Red Bull",
    product: "energy drink",
    tone: "bold, high-energy, daring, max 12 words per ad",
    guardrails: [
      "no health or medical claims",
      "no encouraging excessive consumption",
      "no competitor mentions",
      "no targeting people in distress",
    ],
    guardrailRules: [
      "No health/medical claims",
      "No competitor mentions",
      "No targeting vulnerable users",
    ],
    staticHeadline: "Red Bull — Gives You Wings.",
  },
};
