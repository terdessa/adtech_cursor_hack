# Creative Forge — Team Brief

**Read this first. 2 minutes. Then go to your section.**

---

## What we're building

A demo where the **same brand wins the same bid for 3 different users, and each user sees a different generated ad** matched to their conversation context.

Brand for the demo: **Gatorade**. Three scenarios: post-run, office slump, hungover Sunday.

**One sentence pitch:** "The bid is already contextual. We make the creative contextual too."

---

## Hard rules

1. **This is a demo, not a product.** Hardcode anything that doesn't show in the demo.
2. **No new features after 2:00.** Last 30 min is rehearsal only.
3. **One Claude call per scenario.** Returns all three variants + intent + guardrail in one JSON response.
4. **Always have a fallback.** Every API call has a hardcoded backup response. WiFi will fail.
5. **API key never touches the client.** Everything goes through `/api/forge`.

---

## What we're NOT building (don't sneak it back in)

- Streaming responses
- 3 panels running at once
- Zustand
- Tavily / Alpic / MCP
- Real spend pacing
- Auto-rewrite when guardrail fails
- Free-form judge input (stretch goal, only if everything else done by 2:00)

---

## The single API contract (memorize this)

```ts
POST /api/forge
body: { scenarioId: "A" | "B" | "C", brand: "gatorade" }

response: {
  intent:    { score: number, category: string, mood: string, flags: string[] },
  variants:  [{ id, copy, score, status: "approved"|"flagged", flagReason? }, x3],
  guardrail: { passed: boolean, checks: [{ rule: string, passed: boolean }] }
}
```

If you're consuming this — build against a hardcoded mock with this exact shape until P1 ships the real route.

---

## Who owns what

| You | You own | Done by |
|---|---|---|
| **P1** | `app/api/forge/route.ts`, `lib/claude.ts`, `lib/fallback.ts`, prompt | 1h15 |
| **P2** | `ConversationPanel`, `ScenarioPicker`, `ModeToggle`, `lib/scenarios.ts` | 1h15 |
| **P3** | `AgentBrainPanel`, `EscalationCard` (30s countdown) | 1h15 |
| **P4** | `SpendBar`, `lib/brand.ts`, `staticAds.ts`, Tailwind theme, Vercel deploy | 1h15 |

---

## Timeline

```
0:00 – 0:15  Scaffold together, lock the API shape, push to main
0:15 – 1:30  PARALLEL BUILD against mocked response
1:30 – 2:00  Wire up; integration
2:00 – 2:20  E2E test all 3 scenarios + escalation + toggle
2:20 – 2:30  Rehearse demo 3×
```

---

## Demo we're rehearsing

1. Mode = **Static**. Click A, B, C — same boring banner each time. "This is today."
2. Flip to **Forge**. Click A — intent animates to 87, 3 variants render, winner appears in chat. "Same bid, contextual creative."
3. Click B — different vibe, different winner. "Same brand, different conversation, different message."
4. Click C — guardrail flags it, escalation card pops with 30s countdown. "Sensitive context → human in the loop."
5. Point to spend bar. "Pacing budget tracked. Pause when wasted."

**Time to narrate: 90 seconds.**

---

## Full design

See `docs/plans/2026-05-28-creative-forge-design.md` for full architecture, prompt sketch, failure mitigations, and definition of done.

## Original idea dump

See `creative-forge-context.md` for the raw concept (some of it has been cut — trust this brief).
