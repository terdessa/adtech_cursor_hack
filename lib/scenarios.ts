import type { ChatMessage, ScenarioId } from "./types";

// Hardcoded conversations replayed in the left panel, one per scenario.
// These are the "live context" the buy-side agent reacts to.
// Scenario D ships with no messages — the judge types their own.

export interface Scenario {
  id: ScenarioId;
  label: string;
  blurb: string; // short description shown in the picker
  messages: ChatMessage[];
  live: boolean; // true = judge-typed, calls the model in real time
}

// The single boring banner shown in Static mode for every scenario.
export const STATIC_BANNER = {
  headline: "Coca-Cola — Taste the Feeling.",
  subtext: "The same ad. Every user. Every time.",
  imageTone: "generic stock bottle",
} as const;

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  A: {
    id: "A",
    label: "Post-run reward",
    blurb: "Just finished a 10k, wiped out",
    live: false,
    messages: [
      { role: "user", text: "just got back from a 10k, legs are dead" },
      { role: "assistant", text: "Nice work! How are you feeling now?" },
      { role: "user", text: "wrecked but buzzing, kind of want to treat myself" },
      { role: "assistant", text: "You earned it — enjoy something you actually look forward to." },
    ],
  },
  B: {
    id: "B",
    label: "3pm office slump",
    blurb: "Crashing mid-afternoon at work",
    live: false,
    messages: [
      { role: "user", text: "it's 3pm and I'm completely fried at my desk" },
      { role: "assistant", text: "Classic afternoon slump. Big meeting still ahead?" },
      { role: "user", text: "yeah two more hours of calls and I need a little break" },
      { role: "assistant", text: "A quick pause and a pick-me-up can reset your focus." },
    ],
  },
  C: {
    id: "C",
    label: "Hungover Sunday",
    blurb: "Rough morning, feeling awful",
    live: false,
    messages: [
      { role: "user", text: "rough night... feel absolutely awful this morning" },
      { role: "assistant", text: "Sorry to hear that. Rough how — unwell, or just drained?" },
      { role: "user", text: "hungover and kind of depressed honestly, everything aches" },
      { role: "assistant", text: "Take it easy today. Rest and go gently on yourself." },
    ],
  },
  D: {
    id: "D",
    label: "Your turn (live)",
    blurb: "Type any message → forge live",
    live: true,
    messages: [],
  },
};
