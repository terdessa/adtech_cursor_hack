# Creative Forge — Scoped Hackathon Design

**Date:** 2026-05-28
**Time budget:** 2.5 hours (hard cap)
**Goal:** Demo-able prototype, not a product. Hardcode aggressively.

---

## Pitch (unchanged)

> "The bid is already contextual. We make the creative contextual too."

Same brand, same bid won, three different generated ads — one per user conversation context.

---

## Scope Decisions

### IN
- Single split-screen UI (left: conversation, right: agent brain).
- Top bar: **scenario picker** (A / B / C) + **mode toggle** (Static vs Forge).
- Bottom strip: fake spend bar + impression count + CTR (numbers tick up on serve).
- One Claude call per scenario that returns: `{ intent, variants[3], guardrailResults }` as JSON.
- One scripted scenario triggers the **escalation card** with 30s countdown.
- Three pre-seeded conversations (Gatorade brand for all three).
- Cached fallback responses baked in for offline / API-down failure.

### OUT (cut for time)
- Streaming (Vercel AI SDK). Await once, render.
- 3 simultaneous live panels. One at a time, user clicks scenario.
- Zustand. `useState` + small context is enough.
- Tavily, Alpic, MCP integrations.
- Real spend pacing logic. Fake increment only.
- Auto-rewrite on guardrail fail. Pass/fail only.
- Free judge input mode. (Stretch goal #1 if time allows after rehearsal.)
- Multi-step agent calls. One call, structured JSON out.

---

## Architecture

```
[Next.js 15 App Router]
  app/
    page.tsx                 ← single-page split screen
    api/forge/route.ts       ← POST { scenarioId } → ForgeResponse
  components/
    ScenarioPicker.tsx
    ConversationPanel.tsx    ← left
    AgentBrainPanel.tsx      ← right (intent, variants, guardrail checklist)
    EscalationCard.tsx       ← modal with 30s countdown
    SpendBar.tsx             ← bottom
    ModeToggle.tsx           ← Static vs Forge
  lib/
    scenarios.ts             ← hardcoded conversations + expected ad tone
    brand.ts                 ← Gatorade brief (JSON)
    claude.ts                ← single fetch to Anthropic, JSON-mode prompt
    fallback.ts              ← cached responses keyed by scenarioId
    staticAds.ts             ← the boring banner for "Static" mode
```

**API contract** (single endpoint, single call):

```ts
POST /api/forge
body: { scenarioId: "A" | "B" | "C", brand: "gatorade" }

response: {
  intent:    { score: number, category: string, mood: string, flags: string[] },
  variants:  [{ id, copy, score, status: "approved"|"flagged", flagReason? }, x3],
  guardrail: { passed: boolean, checks: [{ rule: string, passed: boolean }] }
}
```

One Claude call. One JSON response. Defensive parse with fallback to cached response if parse fails or API errors.

---

## Demo Flow (narration)

1. Load app. Mode = **Static**. Click each scenario — same boring "GATORADE: Stay Hydrated" banner shows for all three. Judges see the problem.
2. Flip toggle to **Forge**. Click Scenario A — agent brain animates: intent score fills to 87, "category: sport / mood: tired", 3 variants stream in (faked stagger from one response), guardrail checks tick green, winning variant renders inline in chat as sponsored answer.
3. Scenario B — different vibe, dry-humour copy, different winning variant.
4. Scenario C — sensitive mood detected ("hungover"), guardrail flags health-claim rule, **escalation card pops** with 30s countdown. Judge can Approve or let it auto-skip.
5. Bottom bar shows spend ticking up across all served ads.

**Total demo: ~90 seconds.** Rehearse 3×.

---

## Failure Mitigations

| Risk | Mitigation |
|---|---|
| Venue WiFi dies | `fallback.ts` returns hardcoded response per scenarioId if fetch fails. |
| Claude returns malformed JSON | `try/catch` around parse → use fallback. |
| API rate limit during rehearsal | In-memory cache per scenarioId; only re-fetch on explicit re-run. |
| Escalation card doesn't fire | Scenario C's fallback has `flagged` hardcoded. |
| API key leak | Server-side only via `/api/forge`. `ANTHROPIC_API_KEY` in `.env.local`. |

---

## Team Split (4 people, 2.5h)

| Person | Owns | Consumes | Done by |
|---|---|---|---|
| P1 | `api/forge/route.ts`, `lib/claude.ts`, `lib/fallback.ts`, prompt design | nothing (produces the API) | 1h15 |
| P2 | `ConversationPanel`, `ScenarioPicker`, `ModeToggle`, `lib/scenarios.ts` | `/api/forge` response | 1h15 |
| P3 | `AgentBrainPanel`, `EscalationCard` (countdown) | response object as props | 1h15 |
| P4 | `SpendBar`, `lib/brand.ts`, `staticAds.ts`, Tailwind theme, Vercel deploy | nothing (cosmetic + deploy) | 1h15 |

### Timeline

```
0:00 – 0:15  Clone, agree on response shape, push scaffold
0:15 – 1:30  Parallel build against the mocked response shape
1:30 – 2:00  Wire up; everyone hits /api/forge for real
2:00 – 2:20  E2E test all 3 scenarios + escalation + static toggle
2:20 – 2:30  Rehearsal only. No new features.
```

**Hard rule: no new features after 2:00.** Polish and rehearse only.

---

## Prompt Sketch (for P1)

```
System: You are a creative ad generator for {BRAND}. Given a user conversation,
output STRICT JSON: { intent, variants, guardrail }.

User: Brand brief: {brand JSON}. Conversation: {messages}.
Rules: no health claims, no competitor mentions, no medical advice.
Generate 3 ad variants. Score each 0-100 for context fit. Mark any variant
that violates a rule as status:"flagged" with flagReason.
```

Use Claude's JSON mode / response_format. Model: `claude-sonnet-4`. Temp 0.7.

---

## Definition of Done

- [ ] All 3 scenarios run without console errors.
- [ ] Static → Forge toggle works visibly.
- [ ] Escalation card fires on Scenario C.
- [ ] Fallback works (test by killing network).
- [ ] Deployed to Vercel with working URL.
- [ ] Demo narrated end-to-end in <2 min.
