import { createServerFn } from "@tanstack/react-start";

export interface BusinessAuditResult {
  success: boolean;
  data: {
    swot_analysis: string;
    target_audience: string;
    growth_experiments: string[];
  };
  error?: string;
  warning?: string;
}

/**
 * Core logic for business audit, separated from server function wrapper
 * so it can be called internally by other server functions.
 */
export async function performBusinessAudit(businessInfo: string): Promise<BusinessAuditResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Leverage] PERPLEXITY_API_KEY not set. Falling back to mock data for Business Audit.",
    );
    return {
      success: true,
      data: mockAuditData(businessInfo),
      warning: "Using simulated audit data. Set PERPLEXITY_API_KEY for live analysis.",
    } satisfies BusinessAuditResult;
  }

  const prompt = `Perform a comprehensive business audit for: "${businessInfo}".
    
    Analyze the business and provide:
    1. A detailed SWOT analysis (Strengths, Weaknesses, Opportunities, Threats).
    2. Identification of the primary and secondary target audience segments.
    3. 5 high-impact growth experiments or marketing strategies.

    Your response must be a valid JSON object with these exact keys:
    "swot_analysis" (string, markdown), 
    "target_audience" (string, markdown), 
    "growth_experiments" (array of strings).

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
              "You are an expert business analyst. You provide deep, actionable insights in structured JSON format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(45_000),
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
    const auditData = JSON.parse(cleanJson);

    return {
      success: true,
      data: {
        swot_analysis: auditData.swot_analysis || "No SWOT analysis generated.",
        target_audience: auditData.target_audience || "No target audience identified.",
        growth_experiments: Array.isArray(auditData.growth_experiments)
          ? auditData.growth_experiments
          : [],
      },
    } satisfies BusinessAuditResult;
  } catch (err) {
    console.error("[Leverage] Business Audit failed:", err);
    return {
      success: false,
      data: mockAuditData(businessInfo), // Fallback to mock on error but indicate failure
      error: `Audit failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    } satisfies BusinessAuditResult;
  }
}

/**
 * Executes a Smart Business Audit using the Perplexity API.
 * Performs SWOT analysis, target audience identification, and growth experiments.
 */
export const runBusinessAudit = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { businessInfo: string })
  .handler(async (ctx) => {
    return performBusinessAudit(ctx.data.businessInfo);
  });

/**
 * Generates realistic-looking mock data for fallback scenarios.
 */
function mockAuditData(info: string) {
  const isUrl = info.startsWith("http");
  const bizName = isUrl ? info.split("/")[2] : info;

  return {
    swot_analysis: `### SWOT Analysis for ${bizName}

#### Strengths
- Strong initial concept and value proposition.
- Innovative approach to solving market pain points.
- High potential for scalability.

#### Weaknesses
- Limited historical data for deep performance analysis.
- Dependence on external platforms for user acquisition.
- Early stage brand awareness.

#### Opportunities
- Strategic partnerships with complementary businesses.
- Expansion into secondary markets.
- Leveraging AI to optimize internal operations.

#### Threats
- Rapidly changing competitive landscape.
- Potential regulatory shifts in the industry.
- Price sensitivity among target audience.`,
    target_audience: `### Target Audience Breakdown

- **Primary Segment:** Young professionals (25-35) looking for efficiency-boosting tools.
- **Secondary Segment:** Small business owners needing affordable automation solutions.
- **Niche Segment:** Early adopters of open-source technology.`,
    growth_experiments: [
      "Launch a referral program giving users 1 month free for every successful invite.",
      "A/B test the landing page headline with a focus on 'Time Saved' vs 'Revenue Earned'.",
      "Run a targeted LinkedIn ad campaign specifically for SMB owners in the tech sector.",
      "Implement an automated email drip campaign for users who sign up but don't launch a tool within 24 hours.",
      "Host a monthly webinar demonstrating high-value 'no-code' workflows.",
    ],
  };
}
