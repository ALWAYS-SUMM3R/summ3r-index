import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Curated high-signal AI prediction markets on Polymarket
const AI_MARKET_SLUGS = [
  // Model Race
  { slug: "which-company-has-the-best-ai-model-end-of-april", category: "Model Race" },
  { slug: "which-company-has-best-ai-model-end-of-june", category: "Model Race" },
  { slug: "which-company-has-second-best-ai-model-end-of-june", category: "Model Race" },
  { slug: "will-a-chinese-ai-model-become-1-by-june-30", category: "Model Race" },
  { slug: "will-a-dllm-be-the-top-ai-model-before-2027", category: "Model Race" },
  // Releases
  { slug: "claude-5-released-by", category: "Releases" },
  { slug: "gpt-6-released-by", category: "Releases" },
  { slug: "grok-5-released-by", category: "Releases" },
  { slug: "will-openai-launch-a-consumer-hardware-product-by", category: "Releases" },
  // Capability Milestones
  { slug: "openai-announces-it-has-achieved-agi-before-2027", category: "Long-range" },
  { slug: "ai-model-scores-90-on-frontiermath-benchmark-before-2027", category: "Long-range" },
  // Market Events
  { slug: "openai-ipo-by", category: "Market Events" },
  { slug: "openai-1t-ipo-before-2027", category: "Market Events" },
  { slug: "openai-ipo-closing-market-cap", category: "Market Events" },
  { slug: "anthropic-ipo-closing-market-cap", category: "Market Events" },
  { slug: "openai-acquired-before-2027", category: "Market Events" },
  { slug: "anthropic-acquired-before-2027", category: "Market Events" },
  // Governance
  { slug: "ai-bubble-burst-by", category: "Market Events" },
];

async function fetchPolymarketEvent(slug: string) {
  const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "SUMM3R-AI-Index/1.0" }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

function extractProbability(event: any): number | null {
  const markets = event?.markets || [];
  if (!markets.length) return null;
  const prices = markets[0]?.outcomePrices;
  if (!prices) return null;
  try {
    const parsed = typeof prices === "string" ? JSON.parse(prices) : prices;
    const val = parseFloat(parsed[0]);
    return isNaN(val) ? null : Math.round(val * 1000) / 10;
  } catch { return null; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const results = { updated: 0, created: 0, errors: [] as string[] };
    const now = new Date().toISOString().slice(0, 10);

    for (const { slug, category } of AI_MARKET_SLUGS) {
      try {
        const event = await fetchPolymarketEvent(slug);
        if (!event) { results.errors.push(`Not found: ${slug}`); continue; }

        const probability = extractProbability(event);
        const volume = Math.round(parseFloat(event.volume || "0"));
        const title = event.title || slug;
        const endDate = (event.endDate || "").slice(0, 10);
        const url = `https://polymarket.com/event/${slug}`;

        const existing = await base44.asServiceRole.entities.Prediction.filter({ slug });
        const record = { title, source: "Polymarket", probability, volume, end_date: endDate, slug, url, category, last_updated: now };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.Prediction.update(existing[0].id, record);
          results.updated++;
        } else {
          await base44.asServiceRole.entities.Prediction.create(record);
          results.created++;
        }

        await new Promise(r => setTimeout(r, 150));
      } catch (err: any) {
        results.errors.push(`${slug}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `Synced ${results.created + results.updated} AI predictions from Polymarket`,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
