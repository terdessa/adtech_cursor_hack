# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This is a **hackathon project in the design phase** — there is no code yet. The repo currently contains only specification and planning markdown. The build will happen during a 2.5-hour hackathon window using Next.js 15.

## What this project is

**Creative Forge** — Cursor × Thrad London 2026 hackathon, Track 1 (Buy-Side Agents).

The pitch: same brand wins a bid, but the creative served is generated per-user based on their live conversation context. One bid winner → three different ads for three different users.

A demo, not a product. Aggressive hardcoding is correct.

## Read these first, in order

1. **`docs/TEAM-BRIEF.md`** — the canonical 2-minute brief. Hard rules, what's cut, API contract, owner split, demo script. Trust this over the original idea dump.
2. **`docs/plans/2026-05-28-creative-forge-design.md`** — full scoped design: architecture, prompt sketch, failure mitigations, definition of done.
3. **`creative-forge-context.md`** — the original idea dump. Useful for the "why," but several pieces of it have been explicitly cut. Always defer to the team brief when they disagree.

## The single API contract

All UI work codes against this shape. P1 owns the route; P2/P3/P4 mock it locally until the real route ships.

```ts
POST /api/forge
body: { scenarioId: "A" | "B" | "C", brand: "gatorade" }

response: {
  intent:    { score: number, category: string, mood: string, flags: string[] },
  variants:  [{ id, copy, score, status: "approved"|"flagged", flagReason? }, x3],
  guardrail: { passed: boolean, checks: [{ rule: string, passed: boolean }] }
}
```

One Claude call returns the entire response as JSON. Never split this into multiple calls.

## Hard rules that drove the design

These are scope decisions, not preferences — overriding them blows the time budget:

- **No streaming.** Await the response once and render.
- **One scenario on screen at a time** (scenario picker), not 3 simultaneous panels.
- **`useState` only**, no Zustand.
- **No Tavily, no Alpic, no MCP integrations.**
- **No auto-rewrite** on guardrail fail — pass or flag, nothing else.
- **API key is server-side only**, via `/api/forge`. Never in client code.
- **Every API call has a hardcoded fallback** in `lib/fallback.ts` keyed by `scenarioId`. WiFi will fail at the venue.
- **No new features after the 2:00 mark** — last 30 minutes is rehearsal only.

## Planned tech stack (not yet installed)

- Next.js 15 (App Router)
- Tailwind CSS
- Anthropic SDK, model: `claude-sonnet-4`
- Deploy: Vercel

No `package.json` exists yet. Commands (`dev`, `build`, `lint`, `test`) will appear once the scaffold is created.

## Demo brand

Gatorade. Three pre-seeded conversations: post-run recovery, 3pm office slump, hungover Sunday. Scenario C is the one scripted to trigger the escalation card (sensitive-context guardrail).
