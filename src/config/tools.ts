// Tool configuration types and data for the Leverage platform
// Source: /home/team/shared/leverage_configs.json

export interface InputParameter {
  key: string;
  type: "string" | "number" | "textarea" | "select" | "password";
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  default?: string | number;
  options?: string[];
}

export interface OutputSchemaField {
  key: string;
  type: string;
  label: string;
}

export interface ToolConfig {
  metadata: {
    id: string;
    name: string;
    description: string;
    repository: string;
    category: string;
  };
  inputParameters: InputParameter[];
  outputSchema: OutputSchemaField[];
}

export const tools: ToolConfig[] = [
  {
    metadata: {
      id: "local-leads-finder",
      name: "Local Leads Finder",
      description:
        "Extract business leads directly from Google Maps including contact info and ratings.",
      repository: "https://github.com/omkarcloud/google-maps-scraper",
      category: "Lead Generation",
    },
    inputParameters: [
      {
        key: "query",
        type: "string",
        label: "Search Term",
        description: "e.g., dental clinics",
        required: true,
      },
      {
        key: "location",
        type: "string",
        label: "City/Region",
        description: "e.g., Austin, TX",
        required: true,
      },
      {
        key: "limit",
        type: "number",
        label: "Max Results",
        default: 50,
        required: false,
      },
    ],
    outputSchema: [
      { key: "business_name", type: "string", label: "Business Name" },
      { key: "phone", type: "string", label: "Phone Number" },
      { key: "address", type: "string", label: "Address" },
      { key: "website", type: "string", label: "Website" },
      { key: "rating", type: "number", label: "Rating" },
      { key: "reviews", type: "number", label: "Reviews" },
    ],
  },
  {
    metadata: {
      id: "custom-ai-agent-builder",
      name: "Custom AI Agent Builder",
      description:
        "Build a custom AI support agent trained on your business data.",
      repository:
        "https://github.com/CatchTheTornado/open-agents-builder",
      category: "AI Operations",
    },
    inputParameters: [
      {
        key: "business_name",
        type: "string",
        label: "Business Name",
        required: true,
      },
      {
        key: "knowledge_base",
        type: "textarea",
        label: "Knowledge Base Text",
        description: "Paste your business info, FAQs, etc.",
        required: true,
      },
      {
        key: "tone",
        type: "select",
        label: "Tone of Voice",
        options: ["Professional", "Friendly", "Concise"],
        default: "Professional",
        required: true,
      },
    ],
    outputSchema: [
      { key: "embed_code", type: "string", label: "Embed Code" },
      { key: "public_url", type: "string", label: "Public Chat URL" },
    ],
  },
  {
    metadata: {
      id: "whatsapp-ai-secretary",
      name: "WhatsApp AI Secretary",
      description:
        "An AI-driven auto-responder for your business WhatsApp.",
      repository:
        "https://github.com/shivamraj02/WhatsApp-Ai-Agent-for-Business-Automation",
      category: "Customer Engagement",
    },
    inputParameters: [
      {
        key: "api_key",
        type: "password",
        label: "WhatsApp API Key",
        required: true,
      },
      {
        key: "faqs",
        type: "textarea",
        label: "Business FAQs",
        required: true,
      },
      {
        key: "schedule",
        type: "string",
        label: "Out-of-Office Schedule",
        placeholder: "e.g. Mon-Fri 9am-5pm",
        required: false,
      },
    ],
    outputSchema: [
      { key: "status", type: "string", label: "Current Status" },
      { key: "last_active", type: "string", label: "Last Active" },
    ],
  },
  {
    metadata: {
      id: "ai-visibility-auditor",
      name: "AI Visibility Auditor",
      description:
        "Get an AI-powered SEO audit of your website with actionable steps.",
      repository: "https://github.com/codedpills/ai-visibility-audit",
      category: "Marketing",
    },
    inputParameters: [
      {
        key: "url",
        type: "string",
        label: "Website URL",
        required: true,
      },
      {
        key: "keywords",
        type: "string",
        label: "Target Keywords",
        description: "Comma separated list",
        required: true,
      },
    ],
    outputSchema: [
      { key: "seo_score", type: "number", label: "SEO Score" },
      { key: "report_url", type: "string", label: "Audit Report PDF" },
      {
        key: "recommendations",
        type: "list",
        label: "Top Recommendations",
      },
    ],
  },
  {
    metadata: {
      id: "social-video-creator",
      name: "Social Video Creator",
      description:
        "Generate viral short-form videos from topics or blog URLs.",
      repository:
        "https://github.com/ARYPROGRAMMER/Video-Generator-AI",
      category: "Content Marketing",
    },
    inputParameters: [
      {
        key: "source",
        type: "string",
        label: "Topic or Blog URL",
        required: true,
      },
      {
        key: "platform",
        type: "select",
        label: "Target Platform",
        options: ["TikTok", "YouTube Shorts", "Instagram Reels"],
        default: "TikTok",
        required: true,
      },
      {
        key: "voice_style",
        type: "select",
        label: "Voiceover Style",
        options: ["Energetic", "Calm", "Professional"],
        default: "Energetic",
        required: true,
      },
    ],
    outputSchema: [
      { key: "video_url", type: "string", label: "Generated Video URL" },
      { key: "script", type: "textarea", label: "Generated Script" },
    ],
  },
  // ===== Batch 2 Tools =====
  {
    metadata: {
      id: "ask-your-data",
      name: "Ask Your Data",
      description: "Conversational interface for your spreadsheets and data. Ask 'What was my highest selling product?' and get instant answers.",
      repository: "https://github.com/gventuri/pandas-ai",
      category: "AI Operations",
    },
    inputParameters: [
      {
        key: "file",
        type: "string",
        label: "Data File URL",
        description: "URL or path to your CSV/Excel file",
        required: true,
      },
      {
        key: "query",
        type: "string",
        label: "Your Question",
        description: "e.g., What was my highest selling product in June?",
        required: true,
      },
    ],
    outputSchema: [
      { key: "answer", type: "string", label: "Answer" },
      { key: "chart", type: "string", label: "Generated Chart URL" },
    ],
  },
  {
    metadata: {
      id: "smart-business-audit",
      name: "Smart Business Audit",
      description: "Instant 1-click comprehensive data health report for your business records.",
      repository: "https://github.com/ydataai/ydata-profiling",
      category: "Operations",
    },
    inputParameters: [
      {
        key: "file",
        type: "string",
        label: "Data File URL",
        description: "URL or path to your CSV/Excel file for auditing",
        required: true,
      },
    ],
    outputSchema: [
      { key: "report_html", type: "string", label: "Audit Report URL" },
      { key: "health_score", type: "number", label: "Data Health Score" },
    ],
  },
  {
    metadata: {
      id: "content-repurposer",
      name: "Content Repurposer",
      description: "Turn long-form transcripts into viral social media posts for LinkedIn, Twitter, and blogs.",
      repository: "https://github.com/prakruthishekar/AI-Content-Generator",
      category: "Content Marketing",
    },
    inputParameters: [
      {
        key: "transcript",
        type: "textarea",
        label: "Video/Podcast Transcript",
        description: "Paste your transcript text here",
        required: true,
      },
      {
        key: "target_platform",
        type: "select",
        label: "Target Platform",
        options: ["LinkedIn", "Twitter", "Blog", "All Platforms"],
        default: "All Platforms",
        required: false,
      },
    ],
    outputSchema: [
      { key: "generated_posts", type: "list", label: "Generated Posts" },
    ],
  },
  {
    metadata: {
      id: "instant-invoicer",
      name: "Instant Invoicer",
      description: "Professional PDF invoices from simple data input. Perfect for freelancers and SMBs.",
      repository: "https://github.com/mahesh147/invoice-generator-python",
      category: "Finance & Tax",
    },
    inputParameters: [
      {
        key: "client_details",
        type: "textarea",
        label: "Client Details",
        description: "Client name, address, email",
        required: true,
      },
      {
        key: "line_items",
        type: "textarea",
        label: "Line Items",
        description: "One item per line: description, quantity, unit price",
        required: true,
      },
      {
        key: "tax_rate",
        type: "number",
        label: "Tax Rate (%)",
        default: 0,
        required: false,
      },
    ],
    outputSchema: [
      { key: "invoice_pdf", type: "string", label: "Invoice PDF URL" },
    ],
  },
  {
    metadata: {
      id: "market-sentiment-watcher",
      name: "Market Sentiment Watcher",
      description: "Real-time sentiment analysis for financial and business news. Make data-driven decisions based on market mood.",
      repository: "https://github.com/mrafee/financial-sentiment-analysis",
      category: "Marketing",
    },
    inputParameters: [
      {
        key: "article_text",
        type: "textarea",
        label: "News Article Text",
        description: "Paste the article or news text to analyze",
        required: true,
      },
    ],
    outputSchema: [
      { key: "sentiment_score", type: "number", label: "Sentiment Score" },
      { key: "sentiment_label", type: "string", label: "Sentiment Label (Positive/Neutral/Negative)" },
    ],
  },
];

export function getToolById(id: string): ToolConfig | undefined {
  return tools.find((t) => t.metadata.id === id);
}
