# Creative Forge — Implementation Plan

**Date:** 2026-05-28
**Team:** 3 people · **Budget:** 2 hours hard cap · **Build tool:** Cursor + Claude Code agents
**Status:** APPROVED SCOPE — build against this.

> Companion docs: `docs/TEAM-BRIEF.md` (the 2-min read), `docs/plans/2026-05-28-creative-forge-design.md` (design rationale). This file is the build plan.

---

## 1. Locked Scope

**Hero moment:** the Static → Forge toggle. Everything protects it.
**Generation model:** outputs pre-generated and baked into `lib/fixtures.ts`. One live "Regenerate" button on Scenario A is the only real Claude call in the demo.

### IN (core + all 4 stretch)
- Single split-screen page, scenario picker (A/B/C), Static/Forge toggle.
- Left: conversation playback with inline ad render.
- Right: **animated agent brain** (intent bar fills, variants reveal staggered, guardrail checks tick).
- **BID / SKIP** eligibility badge driven by intent score.
- **Escalation card** on Scenario C (30s countdown, Approve/Skip).
- **Bottom dashboard** (fake spend bar, impressions, CTR — tick on serve).
- One real `/api/forge` route + "Regenerate" button (Scenario A only).
- Fallback fixtures so the demo never depends on the network.

### OUT (do not build)
- Streaming · 3 simultaneous panels · Zustand · real bid/pacing logic · auto-rewrite · free judge input · Tavily/Alpic/MCP wiring (pitch-only).

### Sponsors
- **Real:** Anthropic Claude (core). **Named in pitch:** Cursor, Vercel, Thrad. **Roadmap slide:** Alpic (MCP), Tavily (live grounding). No extra wiring.

---

## 2. Architecture

```
app/
  layout.tsx
  page.tsx                  ← assembles the 3 panels, owns top-level useState
  api/forge/route.ts        ← POST → ForgeResponse (real Claude call + fallback)
components/
  TopBar.tsx                ← ScenarioPicker + ModeToggle
  ConversationPanel.tsx     ← left: message playback + inline ad + Regenerate btn
  AgentBrainPanel.tsx       ← right: intent bar, variants, guardrail checklist, BID badge
  EscalationCard.tsx        ← modal + 30s countdown (Scenario C)
  CampaignDashboard.tsx     ← bottom: spend bar, impressions, CTR
lib/
  types.ts                  ← ForgeResponse + all shared types (source of truth)
  fixtures.ts               ← pre-generated Forge outputs per scenario (A/B/C)
  scenarios.ts              ← hardcoded conversations + static banner
  brand.ts                  ← Gatorade brief + guardrail rules
  claude.ts                 ← Anthropic call, JSON parse, fallback wrapper
```

**State lives in `page.tsx`** (useState only): `scenarioId`, `mode` (`static|forge`), `forgeData`, `isLoading`, `escalationOpen`, `servedCount`. Passed down as props. No global store.

---

## 3. Data Contract (`lib/types.ts` — write this FIRST, together)

```ts
export type ScenarioId = "A" | "B" | "C";
export type Mode = "static" | "forge";

export interface Intent {
  score: number;          // 0-100
  category: string;       // "sport" | "productivity" | "recovery"
  mood: string;           // "tired" | "stressed" | "recovering"
  flags: string[];        // [] | ["sensitive-context"]
}

export interface Variant {
  id: string;
  copy: string;
  score: number;          // 0-100 context fit
  status: "approved" | "flagged";
  flagReason?: string;
}

export interface GuardrailCheck { rule: string; passed: boolean; }

export interface ForgeResponse {
  intent: Intent;
  variants: Variant[];               // exactly 3
  guardrail: { passed: boolean; checks: GuardrailCheck[] };
  bidEligible: boolean;              // derived: intent.score >= 60
}
```

The 3 panels code against this shape from minute 0. P1's real route and `fixtures.ts` both return exactly this.

---

## 4. Team Split

Each person drives Claude Code in their own Cursor window. Branch per person, merge at 1:30.

### P1 — API + Data (the spine)
Owns: `lib/types.ts` (with team), `lib/claude.ts`, `app/api/forge/route.ts`, `lib/fixtures.ts`, `lib/brand.ts`, `.env.local`.
- Write `types.ts` first, push immediately so P2/P3 unblock.
- Hand-author `fixtures.ts`: run Claude 3x locally to generate real on-brand outputs for A/B/C, paste results in. **Scenario C's fixture has a flagged variant + `sensitive-context` flag hardcoded.**
- `route.ts`: real Anthropic call wrapped in try/catch then returns fixture on any failure. Used only by Regenerate.
- Skill: **claude-api** for the SDK call + JSON mode.

### P2 — Left + Shell
Owns: `app/page.tsx`, `components/TopBar.tsx`, `ConversationPanel.tsx`, `lib/scenarios.ts`.
- `page.tsx` top-level state + layout grid (left | right, dashboard below).
- Conversation = hardcoded message array replayed with ~400ms typing delay.
- Static mode renders `scenarios.staticBanner`. Forge mode renders winning variant inline as sponsored answer.
- "Regenerate" button (Scenario A only) POSTs `/api/forge`, swaps in result.
- Skill: **frontend-design** for the chat UI.

### P3 — Right + Stretch
Owns: `AgentBrainPanel.tsx`, `EscalationCard.tsx`, `CampaignDashboard.tsx`.
- Agent brain: intent bar animates to score, variants fade in staggered (CSS/`setTimeout`), guardrail checks tick green, BID/SKIP badge from `bidEligible`.
- Escalation card: opens when `forgeData.guardrail.passed === false` (fires on C). 30s countdown then auto-skip. Approve/Skip buttons.
- Dashboard: numbers bump by hardcoded deltas when an ad serves.
- Skill: **frontend-design** + **ui-ux-pro-max** for polish.

---

## 5. Timeline (2h)

```
0:00-0:15  TOGETHER: scaffold Next.js, write lib/types.ts, agree fixtures shape, push to main
0:15-1:00  PARALLEL: P1 fixtures+route · P2 shell+left · P3 right panels (all vs types.ts)
1:00-1:30  PARALLEL cont. + P2/P3 pull P1 fixtures, wire real data
1:30       FEATURE FREEZE - no new features past here
1:30-1:45  INTEGRATE: merge branches, run all 3 scenarios end-to-end
1:45-1:55  Fix breakage only. Deploy to Vercel. Test deployed URL.
1:55-2:00  Rehearse the 90-sec demo once.
```

If behind at 1:00: drop in this order — dashboard, then animated brain, then escalation card. Toggle + 3 fixtures is the floor; never cut that.

---

## 6. Scaffold Commands (minute 0)

```bash
npx create-next-app@latest . --ts --tailwind --app --no-src-dir --eslint
npm i @anthropic-ai/sdk
# .env.local:  ANTHROPIC_API_KEY=sk-...
npm run dev
```

---

## 7. The Claude Prompt (P1 — `lib/claude.ts`)

This is the LLM prompt the `/api/forge` route sends. Model: `claude-sonnet-4`, temp 0.7, response as strict JSON.

```
SYSTEM:
You are Creative Forge, a buy-side ad creative agent for the brand below.
Given a user's live conversation, produce contextual ad creative that fits
their mood and intent while staying inside brand guardrails.
Return ONLY valid JSON matching the schema. No prose.

BRAND BRIEF:
{ name: "Gatorade", product: "sports hydration drink",
  tone: "punchy, motivating, max 12 words per ad",
  guardrails: ["no health/medical claims", "no competitor mentions",
               "no targeting people in distress"] }

SCHEMA:
{ "intent": {"score":0-100,"category":string,"mood":string,"flags":string[]},
  "variants":[{"id":string,"copy":string,"score":0-100,
               "status":"approved"|"flagged","flagReason"?:string}],  // exactly 3
  "guardrail":{"passed":boolean,"checks":[{"rule":string,"passed":boolean}]} }

USER:
Conversation:
{messages}

Generate intent analysis, 3 ad variants scored for context fit, and run each
guardrail rule. If the conversation shows a sensitive/vulnerable context, set
flags:["sensitive-context"], flag the riskiest variant, and guardrail.passed=false.
```

Parse defensively: `JSON.parse` inside try/catch; on any throw or non-2xx, return the matching fixture. Compute `bidEligible = intent.score >= 60` after parse.

---

## 8. Build Agent Prompt (paste into each person's Claude Code)

Give your owned section to Claude Code with this wrapper so every agent stays inside scope:

```
You are building ONE part of "Creative Forge", a 2-hour hackathon demo.
Read docs/TEAM-BRIEF.md and docs/plans/2026-05-28-creative-forge-implementation-plan.md first.

NON-NEGOTIABLE CONSTRAINTS:
- Next.js 15 App Router, Tailwind, TypeScript, useState only (no Zustand/Redux).
- Code against lib/types.ts exactly. Do not change the ForgeResponse shape.
- This is a demo: hardcode/fake anything not in my assigned section. No real
  bidding, pacing, streaming, or auth. No new dependencies beyond @anthropic-ai/sdk.
- No tests, no error boundaries beyond a try/catch fallback. Speed over polish.
- Keep components small and self-contained; props in, JSX out.

MY SECTION: <paste your P1/P2/P3 task list from section 4>

Deliver working code, then stop. Do not touch files outside my section.
Use the `frontend-design` skill for any UI work.
```

---

## 9. Multi-Agent Orchestration (optional accelerator)

If one person finishes early, they can fan out parallel Claude Code subagents instead of waiting:

- **Build phase:** spawn parallel agents per component (e.g. `EscalationCard`, `CampaignDashboard`) using the build prompt above — they're independent, no shared state, safe to parallelize.
- **Pre-demo gate (1:45):** run the **code-reviewer** skill on the merged branch — catches console errors and broken props fast. Scope it to "demo-blocking bugs only," ignore style/coverage.
- **Skills to lean on:** `frontend-design` (all UI), `claude-api` (P1's route), `ui-ux-pro-max` (final visual polish if time). Do NOT invoke tdd/security/coverage skills — out of scope for a 2h demo.

Rule: parallel agents only for **independent** files. Anything touching `page.tsx` state stays single-owner (P2) to avoid merge conflicts.

---

## 10. Definition of Done

- [ ] `lib/types.ts` shared; all panels compile against it.
- [ ] Static mode shows same banner on A/B/C.
- [ ] Forge mode shows distinct ad + intent + variants per scenario.
- [ ] Toggle flips cleanly, repeatedly, with no flicker/error.
- [ ] Scenario C fires the escalation card with countdown.
- [ ] BID/SKIP badge + dashboard numbers visible.
- [ ] Regenerate (Scenario A) makes a real Claude call; fails gracefully to fixture offline.
- [ ] Deployed Vercel URL works on the venue laptop.
- [ ] 90-sec demo rehearsed once.

---

## 11. Demo Script (the 90 seconds)

1. Static mode, click A, B, C, same banner. *"Every user, same ad. This is today."*
2. Flip to Forge, click A, brain animates, contextual ad appears. *"Same bid, contextual creative."*
3. Click B, different mood, different winner. *"Same brand, different conversation."*
4. Click C, escalation card pops. *"Sensitive context, human signs off."*
5. Point to dashboard + BID badge. *"Intent-driven bidding, spend tracked, brand-safe."*
6. Hit Regenerate on A, live Claude call. *"And it's real, generated live."*
