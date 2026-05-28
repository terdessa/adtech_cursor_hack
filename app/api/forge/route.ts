import { generateForge } from "@/lib/openai";
import { genericFallback } from "@/lib/fixtures";
import { DEFAULT_BRAND, BRANDS } from "@/lib/brand";
import type { BrandId, ChatMessage, ForgeRequestBody, ScenarioId } from "@/lib/types";

// POST /api/forge → ForgeResponse
// Used by live generation: Scenario D (judge-typed) and A/B/C under a
// non-default brand. Always returns a valid ForgeResponse — generateForge
// falls back to a fixture or generic response on any failure.

const VALID_IDS: ScenarioId[] = ["A", "B", "C", "D"];

function parseBrand(value: unknown): BrandId {
  return typeof value === "string" && value in BRANDS ? (value as BrandId) : DEFAULT_BRAND;
}

export async function POST(request: Request): Promise<Response> {
  let scenarioId: ScenarioId = "D";
  let brandId: BrandId = DEFAULT_BRAND;
  let messages: ChatMessage[] = [];

  try {
    const body = (await request.json()) as Partial<ForgeRequestBody>;
    if (body.scenarioId && VALID_IDS.includes(body.scenarioId)) {
      scenarioId = body.scenarioId;
    }
    brandId = parseBrand(body.brandId);
    if (Array.isArray(body.messages)) {
      messages = body.messages.filter(
        (m): m is ChatMessage =>
          !!m && typeof m.text === "string" && (m.role === "user" || m.role === "assistant"),
      );
    }
  } catch {
    // Malformed body — fall through with safe defaults.
  }

  try {
    const result = await generateForge({ brandId, messages, scenarioId });
    return Response.json(result);
  } catch {
    return Response.json(genericFallback(brandId));
  }
}
