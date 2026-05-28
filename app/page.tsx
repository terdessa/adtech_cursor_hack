"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import ConversationPanel from "@/components/ConversationPanel";
import AgentBrainPanel from "@/components/AgentBrainPanel";
import EscalationCard from "@/components/EscalationCard";
import CampaignDashboard from "@/components/CampaignDashboard";
import { SCENARIOS } from "@/lib/scenarios";
import { FIXTURES, genericFallback } from "@/lib/fixtures";
import { BRANDS, DEFAULT_BRAND } from "@/lib/brand";
import { deriveBid, winnerRationale } from "@/lib/bidding";
import type {
  BrandId,
  ChatMessage,
  FixtureScenarioId,
  ForgeResponse,
  Mode,
  ScenarioId,
  Variant,
} from "@/lib/types";
import { BID_THRESHOLD } from "@/lib/types";

// The variant that actually serves: highest-scoring approved variant, but only
// when the agent is eligible to bid and the guardrail passed. Otherwise nothing
// serves and the conversation is held for review.
function pickWinner(data: ForgeResponse | null): Variant | null {
  if (!data || !data.bidEligible || !data.guardrail.passed) return null;
  const approved = data.variants.filter((v) => v.status === "approved");
  if (approved.length === 0) return null;
  return approved.reduce((best, v) => (v.score > best.score ? v : best));
}

function isFixtureScenario(id: ScenarioId): id is FixtureScenarioId {
  return id === "A" || id === "B" || id === "C";
}

export default function Home() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("A");
  const [mode, setMode] = useState<Mode>("static");
  const [brandId, setBrandId] = useState<BrandId>(DEFAULT_BRAND);
  const [forgeData, setForgeData] = useState<ForgeResponse | null>(null);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [servedCount, setServedCount] = useState(0);

  const isDefaultBrand = brandId === DEFAULT_BRAND;

  // Live call to /api/forge for Scenario D, or A/B/C under a non-default brand.
  const runForge = useCallback(
    async (sid: ScenarioId, msgs: ChatMessage[]): Promise<ForgeResponse> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/forge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: sid, brandId, messages: msgs }),
        });
        const data = (await res.json()) as ForgeResponse;
        setForgeData(data);
        return data;
      } catch {
        const fallback =
          isDefaultBrand && isFixtureScenario(sid) ? FIXTURES[sid] : genericFallback(brandId);
        setForgeData(fallback);
        return fallback;
      } finally {
        setIsLoading(false);
      }
    },
    [brandId, isDefaultBrand],
  );

  // Decide what the agent shows whenever mode / scenario / brand changes.
  useEffect(() => {
    if (mode !== "forge") {
      setForgeData(null);
      return;
    }
    const scn = SCENARIOS[scenarioId];
    if (scn.live) {
      // Scenario D waits for the judge to type — reset to a clean slate.
      setForgeData(null);
      setLiveMessages([]);
      return;
    }
    // A/B/C generate live; the fixture is the fallback (on error inside runForge,
    // and here if the live result misses the scripted beat so the rehearsed demo
    // is bulletproof: A/B must serve an ad, C must flag the sensitive context).
    let cancelled = false;
    void (async () => {
      const data = await runForge(scenarioId, scn.messages);
      if (cancelled || !isDefaultBrand || !isFixtureScenario(scenarioId)) return;
      const beatMet = scenarioId === "C" ? !data.guardrail.passed : data.bidEligible;
      if (!beatMet) setForgeData(FIXTURES[scenarioId]);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, scenarioId, brandId, isDefaultBrand, runForge]);

  // Open the escalation card when the guardrail fails (fires on Scenario C).
  useEffect(() => {
    setEscalationOpen(mode === "forge" && !!forgeData && !forgeData.guardrail.passed);
  }, [mode, forgeData]);

  // Bump the dashboard whenever a creative actually serves.
  useEffect(() => {
    if (isLoading) return;
    if (mode === "static") {
      setServedCount((c) => c + 1);
    } else if (forgeData && pickWinner(forgeData)) {
      setServedCount((c) => c + 1);
    }
  }, [mode, scenarioId, forgeData, isLoading]);

  const handleSubmitLive = useCallback(
    async (text: string) => {
      const next: ChatMessage[] = [...liveMessages, { role: "user", text }];
      setLiveMessages(next);
      const data = await runForge("D", next);
      // Append the agent's chat reply so the conversation reads two-way.
      const reply = data.assistantReply?.trim();
      if (reply) {
        setLiveMessages([...next, { role: "assistant", text: reply }]);
      }
    },
    [liveMessages, runForge],
  );

  const handleRegenerate = useCallback(() => {
    void runForge(scenarioId, SCENARIOS[scenarioId].messages);
  }, [scenarioId, runForge]);

  const winner = useMemo(() => pickWinner(forgeData), [forgeData]);
  const flaggedVariant = useMemo(
    () => forgeData?.variants.find((v) => v.status === "flagged") ?? null,
    [forgeData],
  );
  const bid = useMemo(
    () => deriveBid(mode === "forge" && forgeData ? forgeData.intent.score : 0),
    [mode, forgeData],
  );
  const rationale = useMemo(() => winnerRationale(winner), [winner]);

  const scenario = SCENARIOS[scenarioId];
  const messages = scenario.live ? liveMessages : scenario.messages;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        scenarioId={scenarioId}
        mode={mode}
        brandId={brandId}
        onScenarioChange={setScenarioId}
        onModeChange={setMode}
        onBrandChange={setBrandId}
      />

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-2">
        <ConversationPanel
          scenario={scenario}
          mode={mode}
          messages={messages}
          winner={winner}
          brandName={forgeData?.brand ?? ""}
          staticHeadline={BRANDS[brandId].staticHeadline}
          peakScore={forgeData?.intent.score ?? 0}
          serveThreshold={BID_THRESHOLD}
          bidCpm={bid.cpm}
          rationale={rationale}
          isLoading={isLoading}
          hasResult={forgeData !== null}
          canRegenerate={mode === "forge" && scenarioId === "A"}
          onRegenerate={handleRegenerate}
          onSubmitLive={handleSubmitLive}
        />
        <AgentBrainPanel
          forgeData={forgeData}
          mode={mode}
          isLoading={isLoading}
          bidCpm={bid.cpm}
          bidWon={bid.won}
          rationale={rationale}
        />
      </main>

      <CampaignDashboard
        servedCount={servedCount}
        mode={mode}
        bidCpm={bid.cpm}
        bidWon={bid.won}
      />

      <EscalationCard
        open={escalationOpen}
        variant={flaggedVariant}
        onApprove={() => setEscalationOpen(false)}
        onSkip={() => setEscalationOpen(false)}
      />
    </div>
  );
}
