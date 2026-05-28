// Source of truth for the Creative Forge API contract.
// Every panel and the /api/forge route code against these types.

export type ScenarioId = "A" | "B" | "C" | "D"; // D = live, judge-typed input
export type FixtureScenarioId = "A" | "B" | "C"; // scenarios that have baked fixtures
export type Mode = "static" | "forge";
export type BrandId = "coca-cola" | "red-bull" | "auto"; // auto = agent picks the brand

export interface Intent {
  score: number; // 0-100 purchase/engagement intent
  category: string; // e.g. "refreshment" | "reward" | "pick-me-up"
  mood: string; // e.g. "energized" | "drained" | "unwell"
  flags: string[]; // [] | ["sensitive-context"]
}

export interface Variant {
  id: string;
  copy: string;
  score: number; // 0-100 context fit
  status: "approved" | "flagged";
  flagReason?: string;
}

export interface GuardrailCheck {
  rule: string;
  passed: boolean;
}

export interface ForgeResponse {
  brand: string; // advertiser served — chosen by the agent in auto mode
  assistantReply?: string; // a natural chat reply, so live (D) feels two-way
  intent: Intent;
  variants: Variant[]; // exactly 3
  guardrail: { passed: boolean; checks: GuardrailCheck[] };
  bidEligible: boolean; // derived: intent.score >= BID_THRESHOLD
}

export const BID_THRESHOLD = 60;

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ForgeRequestBody {
  scenarioId: ScenarioId;
  brandId: BrandId;
  messages: ChatMessage[]; // the conversation to analyze (typed for D, seeded for A-C)
}
