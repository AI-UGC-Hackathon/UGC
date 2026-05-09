// Exa research enrichment.
// Adds web-grounded insights (trends, audience pains, competitor angles)
// that get folded into the Gemini prompt so the script reflects current
// real-world context. Does NOT generate the script itself.
// Docs: https://docs.exa.ai/reference/search

const ENDPOINT = "https://api.exa.ai/search";

export type ExaInsight = {
  category: "trend" | "audience_pain" | "competitor_angle" | "fact";
  insight: string;
  source?: string;
};

export type ExaResearch = {
  query: string;
  insights: ExaInsight[];
  raw?: unknown;
};

const RESEARCH_SCHEMA = {
  type: "object",
  description:
    "UGC ad research: current trends, audience pains, competitor angles, and notable facts.",
  required: ["insights"],
  properties: {
    insights: {
      type: "array",
      description:
        "5–7 sharp, ad-ready insights a copywriter could use to make the ad more grounded and persuasive.",
      items: {
        type: "object",
        required: ["category", "insight"],
        properties: {
          category: {
            type: "string",
            description:
              "One of: trend (currently working on TikTok/Reels), audience_pain (a real frustration target users voice), competitor_angle (how rivals position), fact (concrete claim worth using).",
          },
          insight: {
            type: "string",
            description:
              "One tight sentence, specific enough to inform copy. Avoid generic marketing fluff.",
          },
        },
      },
    },
  },
} as const;

export async function researchProduct(opts: {
  apiKey: string;
  productDescription: string;
  audience: string;
  platform: string;
  angle: string;
  signal?: AbortSignal;
}): Promise<ExaResearch> {
  if (!opts.apiKey) throw new Error("Missing Exa API key");

  const queryParts = [
    opts.productDescription || "consumer product",
    "UGC ad angles",
    opts.audience ? `for ${opts.audience}` : "",
    `on ${opts.platform}`,
    "2026 trends",
  ].filter(Boolean);
  const query = queryParts.join(" ").slice(0, 300);

  const body = {
    query,
    type: "auto",
    numResults: 8,
    contents: { highlights: true },
    systemPrompt:
      "You are a UGC ad strategist. From the search results, surface concrete, currently-true insights a copywriter can act on. Prefer specifics over generalities. No marketing platitudes. No fabricated stats.",
    outputSchema: RESEARCH_SCHEMA,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": opts.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Exa search failed (${res.status}): ${txt.slice(0, 220)}`);
  }
  const data = (await res.json()) as {
    output?: {
      content?: { insights?: ExaInsight[] };
      grounding?: Array<{
        field?: string;
        citations?: Array<{ url?: string; title?: string }>;
      }>;
    };
  };

  const rawInsights = data.output?.content?.insights ?? [];
  const grounding = data.output?.grounding ?? [];
  const insights: ExaInsight[] = rawInsights.map((ins, i) => {
    const fieldKey = `insights[${i}].insight`;
    const g = grounding.find((g) => g.field === fieldKey);
    const url = g?.citations?.[0]?.url;
    return {
      category: ins.category ?? "fact",
      insight: ins.insight ?? "",
      source: url,
    };
  });

  return { query, insights, raw: data };
}

export function formatResearchForPrompt(research: ExaResearch): string {
  if (!research.insights.length) return "";
  const lines = research.insights.map((i) => {
    const tag =
      i.category === "trend"
        ? "TREND"
        : i.category === "audience_pain"
        ? "PAIN"
        : i.category === "competitor_angle"
        ? "COMPETITOR"
        : "FACT";
    return `- [${tag}] ${i.insight}`;
  });
  return `Research notes from Exa (web-grounded; use when relevant, ignore when not):\n${lines.join(
    "\n",
  )}`;
}
