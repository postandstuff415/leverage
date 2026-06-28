import { createServerFn } from "@tanstack/react-start";

export interface DeepResearchResult {
  success: boolean;
  data: {
    executive_summary: string;
    detailed_findings: string;
    bibliography: string;
  };
  error?: string;
  warning?: string;
}

/**
 * Core logic for deep research, powered by Perplexity API.
 */
export async function performDeepResearch(
  topic: string,
  depthLevel: string = "Standard",
  outputFormat: string = "Executive Summary"
): Promise<DeepResearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Leverage] PERPLEXITY_API_KEY not set. Falling back to mock data for Deep Research.",
    );
    return {
      success: true,
      data: mockResearchData(topic, depthLevel, outputFormat),
      warning: "Using simulated research data. Set PERPLEXITY_API_KEY for live analysis.",
    } satisfies DeepResearchResult;
  }

  const prompt = `Perform a deep research report on the topic: "${topic}".
    
    Research Depth: ${depthLevel}
    Preferred Format: ${outputFormat}

    Provide a comprehensive report including:
    1. An Executive Summary (high-level overview of the topic and key takeaways).
    2. Detailed Findings (broken down into logical sections like market trends, key players, technology, or risks).
    3. A Bibliography (list of sources and references used).

    Your response must be a valid JSON object with these exact keys:
    "executive_summary" (string, markdown), 
    "detailed_findings" (string, markdown), 
    "bibliography" (string, markdown).

    Return ONLY the raw JSON object. No preamble, no markdown code blocks.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-reasoning",
        messages: [
          {
            role: "system",
            content:
              "You are an expert research analyst. You provide deep, accurate, and well-cited information in structured JSON format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60_000), // Research can take longer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const jsonResponse = await response.json();
    const content = jsonResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from Perplexity API");
    }

    // Clean up the response in case the model included code blocks
    const cleanJson = content.replace(/```json\n?|```/g, "").trim();
    const researchData = JSON.parse(cleanJson);

    return {
      success: true,
      data: {
        executive_summary: researchData.executive_summary || "No executive summary generated.",
        detailed_findings: researchData.detailed_findings || "No detailed findings available.",
        bibliography: researchData.bibliography || "No bibliography provided.",
      },
    } satisfies DeepResearchResult;
  } catch (err) {
    console.error("[Leverage] Deep Research failed:", err);
    return {
      success: false,
      data: mockResearchData(topic, depthLevel, outputFormat),
      error: `Research failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    } satisfies DeepResearchResult;
  }
}

/**
 * Server function wrapper for the deep researcher.
 */
export const runDeepResearch = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { topic: string; depthLevel?: string; outputFormat?: string })
  .handler(async (ctx) => {
    return performDeepResearch(ctx.data.topic, ctx.data.depthLevel, ctx.data.outputFormat);
  });

/**
 * Generates realistic-looking mock data for fallback scenarios.
 */
function mockResearchData(topic: string, depth: string, format: string) {
  return {
    executive_summary: `### Executive Summary: ${topic}
    
The research into **${topic}** reveals a dynamic and rapidly evolving landscape. Key drivers include technological advancements, shifting consumer preferences, and increasing global competition. This report provides a high-level overview of the current state and future trajectory of the field.

#### Key Takeaways
- **Innovation-Led Growth:** The sector is experiencing significant breakthroughs in AI and automation.
- **Regulatory Tailwinds:** New frameworks are providing more stability for long-term investment.
- **Market Consolidation:** Major players are acquiring smaller startups to bolster their portfolios.`,

    detailed_findings: `### Detailed Findings
    
#### 1. Market Dynamics & Trends
The ${topic} market is currently valued at approximately $45B with a projected CAGR of 12.5% through 2028. The primary growth engine is the adoption of cloud-native architectures.

#### 2. Competitive Landscape
The environment is characterized by a mix of established incumbents and agile disruptors. 
- **Incumbents:** Focusing on vertical integration and legacy system modernization.
- **Disruptors:** Leveraging "AI-first" strategies to gain market share in niche segments.

#### 3. Technology & Infrastructure
Key technological pillars for ${topic} include:
- **Distributed Ledger Technology:** Improving transparency and security.
- **Edge Computing:** Reducing latency for real-time applications.
- **Generative AI:** Optimizing content creation and data analysis.

#### 4. Risks & Mitigations
- **Cybersecurity:** Increasing frequency of sophisticated attacks.
- **Talent Gap:** Shortage of specialized engineers in ${topic}-related fields.`,

    bibliography: `### Bibliography & References

1. **Global Industry Insights (2024)** - *The Future of ${topic}: Trends and Predictions*.
2. **TechReview Quarterly** - *Deep Dive into ${topic} Infrastructure*.
3. **Market Analysis Group** - *Competitive Assessment of Emerging Players in ${topic}*.
4. **Standard & Poors** - *Sector Volatility and Risk Factors for ${topic}*.
5. **IEEE Xplore** - *Technological Breakthroughs in ${topic} Systems* (Academic Journal).`
  };
}
