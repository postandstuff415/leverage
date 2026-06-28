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
import { performBusinessAudit } from "./audit";

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

// ── Batch 3 mock data generators ─────────────────────────────────

function mockPersonalBusinessWiki(params: Record<string, string>) {
  const query = params.query || "general info";
  return {
    answer: `Based on your knowledge base, here's what I found about "${query}":\n\nKey points:\n• Your business generated approximately $450K in revenue last quarter\n• Top-performing product line saw 34% growth YoY\n• Customer retention rate is currently at 78%\n• Three new competitors entered your market segment\n\nSource documents matched: 5`,
    source_links: "https://wiki.leverage.ai/sources/doc1.md, https://wiki.leverage.ai/sources/doc2.md",
  };
}

function mockAiMarketingAssistant(params: Record<string, string>) {
  const score = randomInt(45, 92);
  const goals = params.marketing_goals || "brand awareness";
  return {
    score,
    audit_report: `https://marketing.leverage.ai/audit/${Date.now()}.pdf`,
    recommendations: [
      `Improve SEO targeting for "${goals}" — current keyword coverage is only ${randomInt(30, 60)}%`,
      `Increase social media posting frequency from 3x to 5x per week for better engagement`,
      `Create 3+ lead magnets tailored to your target audience identified in the audit`,
      `Optimize landing page conversion — current rate is ${randomInt(1, 5)}%, industry avg is 8%`,
      `Run A/B tests on email subject lines to improve open rates`,
    ],
  };
}

function mockAutomatedDocumentGenerator(params: Record<string, string>) {
  const docType = params.document_type || "report";
  const companyName = params.company_name || "Your Company";
  return {
    formatted_document: `# ${docType.charAt(0).toUpperCase() + docType.slice(1)} — ${companyName}\n\n## Executive Summary\n\nThis document was auto-generated using Leverage's document pipeline.\n\n## Key Metrics\n- Revenue: $1.2M\n- Growth: 24% YoY\n- Team Size: 45\n\n## Next Steps\nPlease review and approve by end of quarter.`,
    download_url: `https://docs.leverage.ai/download/${Date.now()}.docx`,
  };
}

function mockInstantBackgroundRemover(params: Record<string, string>) {
  const format = params.output_format || "png";
  return {
    processed_image: `https://images.leverage.ai/processed/${Date.now()}.${format}`,
    original_filename: params.image_url?.split("/").pop() || "uploaded_image.jpg",
  };
}

function mockAiPaperlessOffice(params: Record<string, string>) {
  const summaryEnabled = params.enable_summarization === "true" || params.enable_summarization === "yes";
  return {
    extracted_data: JSON.stringify({
      invoice_number: `INV-${randomInt(1000, 9999)}`,
      date: new Date().toISOString().split("T")[0],
      vendor: randomChoice(["Global Supplies Inc", "TechCorp Solutions", "DataStream Services"]),
      total: `$${randomInt(500, 15000).toLocaleString("en-US")}.00`,
      line_items: randomInt(3, 8),
    }, null, 2),
    summary: summaryEnabled
      ? "Document scanned successfully. Key extracted fields: invoice number, date, vendor name, total amount, and 5 line items. Category identified as 'Accounts Payable'."
      : "Summary not requested.",
    category_tag: randomChoice(["Accounts Payable", "Receipts", "Contracts", "HR Documents"]),
  };
}

function mockDealCloserAssistant(params: Record<string, string>) {
  const stage = params.current_stage || "negotiation";
  return {
    risk_level: randomChoice(["Low", "Medium", "High"]),
    suggested_next_steps: [
      `Follow up within 24 hours — deal has been in "${stage}" stage for ${randomInt(3, 14)} days`,
      "Schedule a demo with the decision-maker to address technical concerns",
      "Prepare a customized pricing proposal with 15% first-year discount",
      "Send case studies from 3 similar clients in their industry",
    ],
    winning_strategy: `Focus on ROI metrics. Key decision factors for this deal appear to be: \n1. Time-to-value (target: under 30 days)\n2. Integration with existing stack\n3. Total cost of ownership compared to current solution`,
  };
}

function mockGtmSignalScorer(params: Record<string, string>) {
  const score = randomInt(20, 98);
  const level = score >= 70 ? "High Priority" : score >= 40 ? "Medium Priority" : "Low Priority";
  return {
    lead_score: score,
    priority_level: level,
    key_signals_detected: [
      `Visited pricing page ${randomInt(2, 8)} times in the last 7 days`,
      `Downloaded whitepaper: "Industry Trends ${new Date().getFullYear()}"`,
      `Attended recent webinar on product capabilities`,
      `LinkedIn profile shows decision-maker title (${randomChoice(["VP", "Director", "Head of"])} of ${randomChoice(["Engineering", "Product", "Growth"])})`,
    ],
  };
}

function mockCustomerSentimentDashboard(params: Record<string, string>) {
  const timePeriod = params.time_period || "Last 30 Days";
  const sentiment = randomChoice(["Positive", "Neutral", "Mixed"]);
  return {
    overall_sentiment: `${sentiment} (${timePeriod})`,
    top_complaints: [
      "Response time could be faster — average wait is 4+ hours",
      "Mobile app UI needs improvement — reported by 23% of users",
      "Pricing transparency — some users found hidden fees confusing",
    ],
    top_praises: [
      "Product quality exceeds expectations — mentioned in 78% of reviews",
      "Customer support team is knowledgeable and friendly",
      "Feature set is comprehensive compared to competitors",
    ],
  };
}

function mockSalesOutreachAccelerator(params: Record<string, string>) {
  const tone = params.outreach_tone || "Professional";
  return {
    personalized_message: `Hi {{name}},\n\nI noticed you've been exploring ways to improve your team's efficiency. At ${randomChoice(["Acme Corp", "InnovateLabs", "NextGen Solutions"])}, we help companies like yours achieve 40% faster workflows using our platform.\n\nWould you be open to a 15-minute call this week to see if it's a fit?\n\nBest,\n${randomChoice(["Sarah", "James", "Alex", "Maria"])}`,
    subject_line: `Quick idea for ${randomChoice(["improving", "optimizing", "streamlining"])} your workflow`,
    follow_up_schedule: "Day 1: Initial email\nDay 3: LinkedIn connection request + note\nDay 7: Follow-up email with case study\nDay 14: Final check-in phone call",
  };
}

function mockAiDeepResearcher(params: Record<string, string>) {
  const topic = params.topic || "requested topic";
  const format = params.output_format || "Executive Summary";
  const depth = params.depth_level || "Standard";
  return {
    executive_summary: `## Research Summary: ${topic}\n\nAfter analyzing ${depth === "Exhaustive" ? "47" : "12"} sources, here are the key findings:\n\n**Market Overview**\nThe ${topic} market is projected to grow at ${randomInt(8, 25)}% CAGR over the next 3 years, driven by increasing demand for automation and AI-powered solutions.\n\n**Key Players**\n• Major incumbents: ${randomChoice(["Company A", "Company B", "Company C"])}\n• Emerging disruptors: ${randomChoice(["Startup X", "Startup Y", "Startup Z"])}\n\n**Critical Insight**\n${randomChoice(["First-mover advantage is critical in this space", "Regulatory changes are expected to reshape the landscape", "Customer adoption is accelerating faster than anticipated"])}.`,
    detailed_findings: `[${format} mode] Detailed analysis of "${topic}":\n\n1. Market Size & Growth\n   - Current TAM: ${randomInt(5, 50)}B\n   - Growth drivers: digital transformation, remote work, AI adoption\n   \n2. Competitive Landscape\n   - ${randomInt(15, 50)}+ companies actively competing\n   - Top 3 hold ${randomInt(40, 70)}% market share\n   \n3. Technology Trends\n   - Key innovations: ML-based automation, real-time analytics, API-first architecture\n   - Patent filings up ${randomInt(15, 40)}% year-over-year\n   \n4. Risks & Challenges\n   - Regulatory uncertainty in key markets\n   - Talent shortage for specialized roles\n   - Integration complexity with legacy systems`,
    bibliography: `1. "Industry Report ${new Date().getFullYear()}" — Market Research Firm\n2. "Technology Trends Analysis" — Tech Advisory Board\n3. "Competitive Landscape Assessment" — Industry Analyst\n4. "Consumer Survey Results" — Market Insights Group\n5. "Patent Analysis: ${topic}" — IP Research Institute`,
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
        case "smart-business-audit": {
          const businessInfo = params.business_info || "";
          const result = await performBusinessAudit(businessInfo);
          if (!result.success && !result.warning) {
            return {
              success: false,
              data: {},
              error: result.error,
            } satisfies ExecuteToolResult;
          }
          data = result.data;
          break;
        }
        case "content-repurposer":
          data = mockContentRepurposer(params);
          break;
        case "instant-invoicer":
          data = mockInstantInvoicer(params);
          break;
        case "market-sentiment-watcher":
          data = mockMarketSentiment(params);
          break;
        // Batch 3 tools
        case "personal-business-wiki":
          data = mockPersonalBusinessWiki(params);
          break;
        case "ai-marketing-assistant":
          data = mockAiMarketingAssistant(params);
          break;
        case "automated-document-generator":
          data = mockAutomatedDocumentGenerator(params);
          break;
        case "instant-background-remover":
          data = mockInstantBackgroundRemover(params);
          break;
        case "ai-paperless-office":
          data = mockAiPaperlessOffice(params);
          break;
        case "deal-closer-assistant":
          data = mockDealCloserAssistant(params);
          break;
        case "gtm-signal-scorer":
          data = mockGtmSignalScorer(params);
          break;
        case "customer-sentiment-dashboard":
          data = mockCustomerSentimentDashboard(params);
          break;
        case "sales-outreach-accelerator":
          data = mockSalesOutreachAccelerator(params);
          break;
        case "ai-deep-researcher":
          data = mockAiDeepResearcher(params);
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