# Creative Forge — Hackathon Project Context
**Cursor × Thrad London 2026 · Track 1: Buy-Side Agents**

---

## The Problem

Today every ad platform works the same way: a brand wins a bid, and the same static pre-made creative gets served to every user who triggered that placement. The bid is contextual. The creative is not.

## The Idea

**Same bid winner. Different ad for every user.**

Creative Forge is the layer that sits after the bid is won. Instead of serving a static creative, it reads the user's live conversation context and generates a matched ad on the fly — same brand, same product, completely different message per user.

```
User A (post-run, tired)    → "Your legs did the work. Gatorade does the rest."
User B (3pm office slump)   → "2:58pm. You know what that means. Gatorade."
User C (hungover Sunday)    → "Rehydrate. No questions asked. Gatorade."
```

Same brand. Same bid won. Three different ads.

---

## Core Pipeline

```
BID WON (assumed / black box)
        │
        ▼
1. CONTEXT READER
   - Extracts intent from conversation
   - Scores purchase signal 0–100
   - Detects mood, topic, sensitivity flags

        │
        ▼
2. CREATIVE GENERATOR
   - Loads brand brief (product, tone, guardrails)
   - Generates 3 ad variants matched to context
   - Scores each variant for relevance + brand fit
   - Picks winner

        │
        ▼
3. GUARDRAIL CHECK
   - Validates copy against brand policy rules
   - Auto-pass → serve immediately
   - Fail → rewrite or escalate to human

        │
   ┌────┴─────┐
 PASS       FLAG
   │           │
   ▼           ▼
 SERVE     HUMAN REVIEW CARD
           (30s timeout → skip)
```

---

## Data Flow Contracts

### Intent Result
```
score     : 0–100 purchase signal strength
category  : string  e.g. "sport", "food", "finance"
mood      : string  e.g. "tired", "motivated", "stressed"
flags     : string[]  e.g. ["health-context", "sensitive"]
```

### Ad Variant
```
id          : string
copy        : string  (the generated ad text)
score       : number  relevance + brand fit
status      : "approved" | "flagged"
flagReason  : string (optional)
```

---

## Human-in-the-Loop Rules

**Agent acts alone when:**
- Intent score > 60
- Category matches campaign targeting
- All guardrails pass automatically
- Spend within daily pacing budget

**Agent escalates to human when:**
- Guardrail fails (health claim, competitor mention)
- Conversation context is sensitive (grief, illness, mental health)
- Spend would exceed daily cap
- New product category not in the original brief

**Escalation card:**
- Shows flag reason + offending copy
- Shows conversation context
- Actions: Approve / Rewrite / Skip
- Auto-skips after 30s (conservative default)

---

## UI Layout

### Split screen — two panels + bottom bar

**Left panel: Live Conversation**
- Chat messages render top to bottom
- Winning ad appears inline, styled as sponsored answer
- Ad has: label, copy, CTA button, skip option

**Right panel: Agent Brain (live)**
- Intent score with animated bar
- Category + mood detected
- Three variants listed with scores
- Active variant highlighted
- Guardrail checklist (pass/fail per rule)
- Status badge: AUTO-SERVED / ESCALATING / SKIPPED

**Bottom bar: Campaign Dashboard**
- Spend today vs daily budget (progress bar)
- Impression count
- CTR
- Top performing variant copy snippet

---

## Demo Scenarios (pre-seeded)

Three chat windows shown simultaneously, same brand wins all three bids.

| Window | User context | Expected ad tone |
|--------|-------------|-----------------|
| A | Post 10k run, legs dead, needs recovery | Physical, direct, product-forward |
| B | 3pm office, back-to-back meetings, can't focus | Relatable, dry humour, energy angle |
| C | Morning after a big night, needs to function | Guilt-free, no-questions-asked, rehydration angle |

**Demo toggle:** Static mode (same banner on all 3) vs Creative Forge mode (3 different generated ads stream in live). Flip in front of judges.

---

## Testing Strategy

| Mode | Context | Ad output | Use when |
|------|---------|-----------|----------|
| Dev mode | Pre-seeded | Mocked (instant) | Building locally |
| Demo mode | Pre-seeded | Real API call | Presenting to judges |
| Free input | Judge types anything | Real API call | Judge interaction moment |

The slight latency on real API calls helps — it shows something genuine is happening.

---

## Tech Stack

```
Framework     Next.js 15 (App Router)
Styling       Tailwind CSS
AI            Claude claude-sonnet-4 via Anthropic API
Streaming     Vercel AI SDK (stream creative gen live)
State         Zustand
Deploy        Vercel
Bonus         Tavily — ground brand brief against live product data
Bonus         Alpic — host MCP tools for serve/log/bid
```

---

## Team Split (3 hours)

| Person | Owns | Done by |
|--------|------|---------|
| P1 | Claude API calls — intent extraction, creative gen, guardrail check | 1h30 |
| P2 | Left panel — chat UI, conversation flow, inline ad render | 1h30 |
| P3 | Right panel — agent brain steps (streaming), escalation card + countdown | 1h30 |
| P4 | Mock brand data, 3 demo scenarios, spend bar, Vercel deploy | 1h30 |

### Timeline
```
0:00 – 0:20   Scaffold together, agree on interfaces, everyone pulls
0:20 – 1:30   Parallel build against agreed interfaces
1:30 – 2:00   Wire up — connect API to panels
2:00 – 2:30   End-to-end test all 3 demo scenarios
2:30 – 3:00   Demo rehearsal only, nothing new
```

---

## Judging Criteria Alignment

| Criterion | How we hit it |
|-----------|--------------|
| Auto-bids on conversational intent | Intent scorer feeds bid eligibility decision |
| Generates and rotates ad creative inside brand guardrails | Core feature — live generation + guardrail check |
| Detects wasted spend, pauses unprofitable placements | Spend bar + pacing logic in campaign dashboard |
| Human-in-the-loop clarity | Escalation card with explicit rules for when agent acts alone |

---

## One-Line Pitch

> "The bid is already contextual. We make the creative contextual too."
