import OpenAI from "openai";
import { BRANDS, DEFAULT_BRAND, AUTO_GUARDRAIL_RULES } from "./brand";
import { FIXTURES, genericFallback } from "./fixtures";
import type { BrandId, ChatMessage, ForgeResponse, ScenarioId } from "./types";
import { BID_THRESHOLD } from "./types";

// Server-only. The key must never reach the client — this module is imported
// solely by the /api/forge route handler.

const MODEL = "gpt-4o";

export interface GenerateForgeParams {
  brandId: BrandId;
  messages: ChatMessage[];
  scenarioId?: ScenarioId; // used to pick the most fitting fallback
}

function buildPrompt(brandId: BrandId, messages: ChatMessage[]): {
  system: string;
  user: string;
} {
  const conversation = messages.map((m) => `${m.role}: ${m.text}`).join("\n");

  const schema = [
    "SCHEMA:",
    '{ "brand": string,',
    '  "assistantReply": string,  // a natural, helpful 1-sentence reply to the user as the conversation\'s AI assistant',
    '  "intent": {"score":0-100,"category":string,"mood":string,"flags":string[]},',
    '  "variants":[{"id":string,"copy":string,"score":0-100,"status":"approved"|"flagged","flagReason"?:string}],',
    '  "guardrail":{"passed":boolean,"checks":[{"rule":string,"passed":boolean}]} }',
    "variants must have exactly 3 items.",
    "",
    "INTENT SCORING — be strict and honest:",
    "- Score reflects GENUINE commercial/contextual relevance for an ad, not politeness.",
    "- Greetings, small talk, or messages with no product/purchase/activity context MUST score below 20.",
    "- Only score 60+ when there is clear, actionable intent or a context a brand can authentically advertise into.",
    "- Do NOT inflate the score to justify serving an ad. A low score is the correct answer for low-intent chatter.",
    "If the conversation shows a sensitive or vulnerable context, set",
    'flags:["sensitive-context"], flag the riskiest variant, and guardrail.passed=false.',
  ];

  let system: string;
  if (brandId === "auto") {
    system = [
      "You are Creative Forge, a buy-side ad creative agent operating across many advertisers.",
      "Given a user's live conversation, identify the SINGLE most relevant real-world advertiser",
      "brand whose product naturally fits the user's intent (e.g. running shoes -> Nike,",
      "coffee craving -> Starbucks), then produce contextual ad creative for THAT brand.",
      "Put the chosen brand name in the \"brand\" field. Match that brand's voice.",
      "If the conversation has no clear commercial intent (e.g. a greeting), set brand to \"None\", score intent low, and do not force a fit.",
      "Return ONLY valid JSON matching the schema. No prose.",
      "",
      `GUARDRAILS (apply to any brand): ${JSON.stringify([
        "no health or medical claims",
        "no deceptive or competitor-disparaging claims",
        "no targeting people in distress",
      ])}`,
      `Each guardrail check rule should be one of: ${JSON.stringify(AUTO_GUARDRAIL_RULES)}.`,
      "",
      ...schema,
    ].join("\n");
  } else {
    const brand = BRANDS[brandId];
    system = [
      "You are Creative Forge, a buy-side ad creative agent for the brand below.",
      "Given a user's live conversation, produce contextual ad creative that fits",
      "their mood and intent while staying inside brand guardrails.",
      'Put the brand name in the "brand" field.',
      "Return ONLY valid JSON matching the schema. No prose.",
      "",
      `BRAND BRIEF: ${JSON.stringify({
        name: brand.name,
        product: brand.product,
        tone: brand.tone,
        guardrails: brand.guardrails,
      })}`,
      `Each guardrail check rule should be one of: ${JSON.stringify(brand.guardrailRules)}.`,
      "",
      ...schema,
    ].join("\n");
  }

  const user = `Conversation:\n${conversation}\n\nGenerate intent analysis, 3 ad variants scored for context fit, and run each guardrail rule.`;

  return { system, user };
}

// Minimal runtime validation — enough to trust the shape before we render it.
function isValidForge(value: unknown): value is Omit<ForgeResponse, "bidEligible"> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const intent = v.intent as Record<string, unknown> | undefined;
  return (
    !!intent &&
    typeof intent.score === "number" &&
    Array.isArray(v.variants) &&
    typeof v.guardrail === "object" &&
    v.guardrail !== null
  );
}

function fallbackFor(params: GenerateForgeParams): ForgeResponse {
  const { brandId, scenarioId } = params;
  // Scripted Coca-Cola scenarios fall back to their hand-tuned fixture.
  if (
    brandId === DEFAULT_BRAND &&
    (scenarioId === "A" || scenarioId === "B" || scenarioId === "C")
  ) {
    return FIXTURES[scenarioId];
  }
  return genericFallback(brandId);
}

// Generates a fresh Forge response via OpenAI. On ANY failure (missing key,
// network, bad JSON, wrong shape) it returns a brand-appropriate fallback so
// the demo never breaks on stage.
export async function generateForge(params: GenerateForgeParams): Promise<ForgeResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || params.messages.length === 0) {
    return fallbackFor(params);
  }

  try {
    const client = new OpenAI({ apiKey });
    const { system, user } = buildPrompt(params.brandId, params.messages);

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackFor(params);

    const parsed: unknown = JSON.parse(raw);
    if (!isValidForge(parsed)) return fallbackFor(params);

    const result = parsed as Omit<ForgeResponse, "bidEligible">;
    const intentScore = result.intent.score;
    // Ensure a brand name is always present for the UI.
    const brand =
      typeof result.brand === "string" && result.brand.trim()
        ? result.brand
        : params.brandId === "auto"
          ? "Matched advertiser"
          : BRANDS[params.brandId].name;

    return {
      ...result,
      brand,
      bidEligible: intentScore >= BID_THRESHOLD,
    };
  } catch {
    return fallbackFor(params);
  }
}
