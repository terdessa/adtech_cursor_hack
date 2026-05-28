import type { Variant } from "./types";
import { BID_THRESHOLD } from "./types";

// Derives a (fake but plausible) auction bid from intent. The auction itself
// is not real — we surface a bid price so the buy-side story is concrete.

const BASE_CPM = 1.5;
const MAX_PREMIUM = 5; // added on top of base at score 100

export interface BidInfo {
  cpm: number; // dollars per thousand impressions
  won: boolean; // eligible to win the auction
}

export function deriveBid(score: number): BidInfo {
  const cpm = +(BASE_CPM + (Math.max(0, Math.min(score, 100)) / 100) * MAX_PREMIUM).toFixed(2);
  return { cpm, won: score >= BID_THRESHOLD };
}

export function winnerRationale(winner: Variant | null): string {
  if (!winner) {
    return "No variant cleared the guardrails — creative held for human review.";
  }
  return `Won: highest context-fit (${winner.score}/100), cleared all brand guardrails.`;
}
