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

// ── SerpApi Integration ───────────────────────────────────────────

const SERPAPI_BASE = "https://serpapi.com/search.json";

/**
 * Maps the SerpApi Google Maps local result to our output schema.
 */
interface SerpApiPlaceResult {
  title?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  gps_coordinates?: { latitude: number; longitude: number };
  place_id?: string;
  type?: string;
  types?: string[];
  thumbnail?: string;
  operating_hours?: Record<string, string>;
}

interface SerpApiResponse {
  local_results?: SerpApiPlaceResult[];
  error?: string;
  search_metadata?: { id: string; status: string };
}

async function callSerpApiLocalLeads(
  query: string,
  location: string,
  limit: number,
): Promise<{
  leads: Record<string, unknown>[];
  error?: string;
}> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    // No API key configured — fall back to mock data with a warning
    console.warn(
      "[Leverage] SERPAPI_KEY not set. Falling back to mock data for Local Leads Finder.",
    );
    return { leads: mockLeadsFallback(query, location, limit) };
  }

  // Build the search term: combine query and location
  const searchQuery = location ? `${query} in ${location}` : query;

  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("type", "search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(Math.min(limit, 20))); // serpapi supports up to 20

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000), // 15-second timeout
    });
  } catch (fetchErr) {
    return {
      leads: [],
      error: `Network error contacting SerpApi: ${fetchErr instanceof Error ? fetchErr.message : "Unknown error"}`,
    };
  }

  if (!response.ok) {
    return {
      leads: [],
      error: `SerpApi returned HTTP ${response.status}: ${response.statusText}`,
    };
  }

  let json: SerpApiResponse;
  try {
    json = (await response.json()) as SerpApiResponse;
  } catch {
    return {
      leads: [],
      error: "Failed to parse SerpApi response as JSON",
    };
  }

  // Check for API-level errors
  if (json.error) {
    // Rate limit, invalid key, etc.
    if (
      json.error.includes("API key") ||
      json.error.includes("account")
    ) {
      return {
        leads: [],
        error: `SerpApi authentication error: ${json.error}. Please check your SERPAPI_KEY.`,
      };
    }
    return {
      leads: [],
      error: `SerpApi error: ${json.error}`,
    };
  }

  // Map results to our output schema
  const places = json.local_results ?? [];
  const leads: Record<string, unknown>[] = places.map(
    (place: SerpApiPlaceResult) => ({
      business_name: place.title ?? "Unknown Business",
      phone: place.phone ?? "",
      address: place.address ?? "",
      website: place.website ?? "",
      rating: place.rating ?? null,
      reviews: place.reviews ?? 0,
      place_id: place.place_id ?? null,
      categories: Array.isArray(place.types) ? place.types : [],
    }),
  );

  return { leads };
}

/**
 * Fallback mock data used when SerpApi key is not configured.
 */
function mockLeadsFallback(
  query: string,
  location: string,
  count: number,
): Record<string, unknown>[] {
  const companies = [
    "Acme Corp",
    "Globex Inc",
    "Initech",
    "Cyberdyne Systems",
    "Wayne Enterprises",
    "Stark Industries",
    "Umbrella Corp",
    "Massive Dynamic",
    "Hooli",
    "Pied Piper",
  ];
  const streets = ["Oak", "Maple", "Pine", "Cedar", "Elm"];

  const leads: Record<string, unknown>[] = [];
  const actualCount = Math.min(count, 10);
  for (let i = 0; i < actualCount; i++) {
    leads.push({
      business_name: `${companies[i % companies.length]} ${query.charAt(0).toUpperCase() + query.slice(1)}`,
      phone: `+1 (${200 + i * 33}) ${100 + i * 77}-${1000 + i * 1111}`,
      address: `${100 + i * 123} ${streets[i % streets.length]} St, ${location || "US"}`,
      website: `https://www.${query.replace(/\s+/g, "")}${i}.com`,
      rating: parseFloat((3.5 + (i % 5) * 0.3).toFixed(1)),
      reviews: 10 + i * 50,
    });
  }
  return leads;
}

// ── Mock data helpers ─────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Tool-specific mock data generators ────────────────────────────

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

    // Simulate processing delay for mock-based tools
    // (local-leads-finder has its own latency from the API call)
    if (toolId !== "local-leads-finder") {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      let data: Record<string, unknown>;

      switch (toolId) {
        case "local-leads-finder": {
          // Real SerpApi integration (falls back to mock if no API key)
          const query = params.query || "";
          const location = params.location || "";
          const limit = params.limit ? Number(params.limit) : 5;
          const result = await callSerpApiLocalLeads(query, location, limit);
          if (result.error) {
            return {
              success: false,
              data: {},
              error: result.error,
            } satisfies ExecuteToolResult;
          }
          data = { leads: result.leads };
          break;
        }
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