/**
 * Server-side tool execution engine.
 *
 * This module scaffolds the "pipes" for the Leverage execution backend.
 * Each tool has a mock handler that returns realistic simulated data
 * matching its output schema. When real API keys and logic are available
 * (from the research phase), swap the mock return values for actual
 * API calls — the UI contract stays the same.
 */

import { createServerFn } from "@tanstack/react-start";
import { getToolById } from "~/config/tools";

// ── Type definitions ──────────────────────────────────────────────

export interface ExecuteToolInput {
  toolId: string;
  params: Record<string, string>;
}

export interface ExecuteToolResult {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

// ── Mock data helpers ─────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Tool-specific mock data generators ────────────────────────────

const COMPANIES = [
  "Acme Corp", "Globex Inc", "Initech", "Cyberdyne Systems",
  "Wayne Enterprises", "Stark Industries", "Umbrella Corp",
  "Massive Dynamic", "Hooli", "Pied Piper",
];

const LOCATIONS = [
  "San Francisco, CA", "Austin, TX", "New York, NY", "Chicago, IL",
  "Seattle, WA", "Denver, CO", "Miami, FL", "Portland, OR",
];

function mockLocalLeads(params: Record<string, string>) {
  const count = params.limit ? Math.min(Number(params.limit), 10) : 5;
  const query = params.query || "business";
  const location = params.location || "US";
  const leads: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    leads.push({
      business_name: `${randomChoice(COMPANIES)} ${query.charAt(0).toUpperCase() + query.slice(1)}`,
      phone: `+1 (${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      address: `${randomInt(100, 9999)} ${randomChoice(["Oak", "Maple", "Pine", "Cedar", "Elm"])} St, ${location}`,
      website: `https://www.${query.replace(/\s+/g, "")}${i}.com`,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: randomInt(10, 500),
    });
  }
  return { leads };
}

function mockAiAgentBuilder(params: Record<string, string>) {
  const bizName = params.business_name || "My Business";
  const slug = bizName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    embed_code: `<script src="https://agent.leverage.ai/${slug}/chat.js"></script>`,
    public_url: `https://agent.leverage.ai/${slug}/chat`,
  };
}

function mockWhatsAppSecretary(params: Record<string, string>) {
  return {
    status: "connected",
    last_active: new Date().toISOString(),
    auto_reply_enabled: true,
  };
}

function mockVisibilityAuditor(params: Record<string, string>) {
  const score = randomInt(42, 94);
  return {
    seo_score: score,
    report_url: `https://audit.leverage.ai/reports/${Date.now()}.pdf`,
    recommendations: [
      "Optimize your meta title and description — they are too short",
      "Add alt-text to at least 3 images flagged as missing attributes",
      "Improve page load speed — current TTFB is 2.4s, target under 1.0s",
      "Fix 2 broken internal links found on the homepage",
      "Add structured data (JSON-LD) for better rich snippet eligibility",
    ],
  };
}

function mockSocialVideoCreator(params: Record<string, string>) {
  const platform = params.platform || "TikTok";
  return {
    video_url: `https://cdn.leverage.ai/videos/${Date.now()}_${platform.toLowerCase().replace(/\s+/g, "-")}.mp4`,
    script: `[HOOK] Did you know this one trick changes everything?\n[MAIN] Let me break it down for you step by step...\n[CTA] Comment below and follow for more!`,
    thumbnail_url: `https://cdn.leverage.ai/thumbnails/${Date.now()}.jpg`,
  };
}

function mockAskYourData(params: Record<string, string>) {
  const query = params.query || "What is my revenue?";
  const amount = randomInt(12000, 95000).toLocaleString("en-US");
  return {
    answer: `Based on your data, the answer to "${query}" is: ${amount}.00 trending ${randomChoice(["up", "down", "stable"])} from last period.`,
    chart: `https://charts.leverage.ai/auto/${Date.now()}.png`,
    confidence: parseFloat((0.82 + Math.random() * 0.17).toFixed(2)),
  };
}

function mockBusinessAudit(params: Record<string, string>) {
  const score = randomInt(55, 98);
  return {
    report_html: `https://audit.leverage.ai/reports/${Date.now()}/index.html`,
    health_score: score,
    missing_values: randomInt(0, 15),
    duplicate_rows: randomInt(0, 8),
    data_quality_rating: score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement",
  };
}

function mockContentRepurposer(params: Record<string, string>) {
  const platform = params.target_platform || "All Platforms";
  return {
    generated_posts: [
      `📌 **LinkedIn (${platform === "All Platforms" || platform === "LinkedIn" ? "published" : "draft"}):**\nExciting news! We just wrapped up a deep dive into [topic]. The key takeaway? Simplicity wins. Full breakdown in the comments 👇`,
      `🐦 **Twitter (${platform === "All Platforms" || platform === "Twitter" ? "published" : "draft"}):**\nThread 🧵\n1/ I analyzed 50 successful campaigns. The #1 factor nobody talks about...\n2/ It's not budget. It's consistency.\n3/ Here's the exact formula 👇`,
      `📝 **Blog (${platform === "All Platforms" || platform === "Blog" ? "published" : "draft"}):**\n# The Complete Guide to [Topic]\n\nIn this post, we'll cover everything you need to know...`,
    ],
  };
}

function mockInstantInvoicer(params: Record<string, string>) {
  return {
    invoice_pdf: `https://invoices.leverage.ai/download/${Date.now()}.pdf`,
    invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
    total_amount: randomInt(150, 5000),
    payment_terms: "Net 30",
  };
}

function mockMarketSentiment(params: Record<string, string>) {
  const score = parseFloat((-1 + Math.random() * 2).toFixed(2));
  const label = score > 0.3 ? "Positive" : score < -0.3 ? "Negative" : "Neutral";
  return {
    sentiment_score: score,
    sentiment_label: label,
    key_topics: ["growth", "innovation", "market expansion", "competition"],
    summary: `Market sentiment is ${label.toLowerCase()}. Key drivers include recent product launches and shifting consumer trends.`,
  };
}

// ── The server function ───────────────────────────────────────────

export const executeTool = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as ExecuteToolInput)
  .handler(async (ctx) => {
    const { toolId, params } = ctx.data;
    // Validate the tool exists
    const tool = getToolById(toolId);
    if (!tool) {
      return {
        success: false,
        data: {},
        error: `Unknown tool: "${toolId}". No configuration found.`,
      } satisfies ExecuteToolResult;
    }

    // Simulate processing delay (real backends will replace this)
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      let data: Record<string, unknown>;

      switch (toolId) {
        case "local-leads-finder":
          data = mockLocalLeads(params);
          break;
        case "custom-ai-agent-builder":
          data = mockAiAgentBuilder(params);
          break;
        case "whatsapp-ai-secretary":
          data = mockWhatsAppSecretary(params);
          break;
        case "ai-visibility-auditor":
          data = mockVisibilityAuditor(params);
          break;
        case "social-video-creator":
          data = mockSocialVideoCreator(params);
          break;
        case "ask-your-data":
          data = mockAskYourData(params);
          break;
        case "smart-business-audit":
          data = mockBusinessAudit(params);
          break;
        case "content-repurposer":
          data = mockContentRepurposer(params);
          break;
        case "instant-invoicer":
          data = mockInstantInvoicer(params);
          break;
        case "market-sentiment-watcher":
          data = mockMarketSentiment(params);
          break;
        default:
          // Fallback: generate values from the output schema
          data = {};
          for (const field of tool.outputSchema) {
            data[field.key] = `[${field.label}]: mock output`;
          }
      }

      return {
        success: true,
        data,
      } satisfies ExecuteToolResult;
    } catch (err) {
      return {
        success: false,
        data: {},
        error: `Execution failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      } satisfies ExecuteToolResult;
    }
  });