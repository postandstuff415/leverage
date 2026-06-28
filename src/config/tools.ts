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
      description: "Get a comprehensive SWOT analysis, target audience breakdown, and growth experiments for any business URL or description.",
      repository: "https://github.com/perplexica/perplexica",
      category: "Operations",
    },
    inputParameters: [
      {
        key: "business_info",
        type: "textarea",
        label: "Business Info",
        description: "Paste a website URL or describe the business (e.g., 'A vegan bakery in Austin specializing in gluten-free cupcakes')",
        required: true,
      },
    ],
    outputSchema: [
      { key: "swot_analysis", type: "textarea", label: "SWOT Analysis" },
      { key: "target_audience", type: "textarea", label: "Target Audience Identification" },
      { key: "growth_experiments", type: "list", label: "Growth Experiments" },
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
  {
    metadata: {
      id: "personal-business-wiki",
      name: "Personal Business Wiki",
      description: "A second brain for your business. Ingest bookmarks, emails, and documents to have an AI-powered knowledge base you can chat with instantly.",
      repository: "https://github.com/supermemoryai/supermemory",
      category: "Operations",
    },
    inputParameters: [
      {
        key: "knowledge_source",
        type: "textarea",
        label: "Knowledge Source",
        description: "Paste text or a list of URLs (one per line) to build your wiki.",
        required: false,
      },
      {
        key: "file_url",
        type: "string",
        label: "Document URL",
        description: "Public URL to a PDF, DOCX, or TXT file.",
        required: false,
      },
      {
        key: "query",
        type: "string",
        label: "Ask a Question",
        description: "What would you like to know from your wiki?",
        required: true,
      },
    ],
    outputSchema: [
      { key: "answer", type: "string", label: "AI Answer" },
      { key: "source_links", type: "string", label: "Sources" },
    ],
  },
  {
    metadata: {
      id: "ai-marketing-assistant",
      name: "AI Marketing Assistant",
      description: "AI-driven landing page audit and marketing workflow automation.",
      repository: "https://github.com/ericosiu/ai-marketing-skills",
      category: "Marketing",
    },
    inputParameters: [
      {
        key: "url",
        type: "string",
        label: "Landing Page URL",
        description: "The URL of the page you want to audit.",
        required: true,
      },
      {
        key: "marketing_goals",
        type: "textarea",
        label: "Marketing Goals",
        description: "What are you trying to achieve? (e.g., more signups, higher sales).",
        required: true,
      },
      {
        key: "target_audience",
        type: "string",
        label: "Target Audience",
        description: "Who are you trying to reach?",
        required: true,
      },
    ],
    outputSchema: [
      { key: "score", type: "string", label: "Conversion Score (0-100)" },
      { key: "audit_report", type: "textarea", label: "Audit Report" },
      { key: "recommendations", type: "textarea", label: "Top Recommendations" },
    ],
  },
  {
    metadata: {
      id: "automated-document-generator",
      name: "Automated Document Generator",
      description: "Turn raw data into professional business documents, letters, or reports automatically.",
      repository: "https://github.com/epistola-app/epistola-suite",
      category: "Operations",
    },
    inputParameters: [
      {
        key: "document_type",
        type: "select",
        label: "Document Type",
        required: true,
        options: ["Business Letter", "Invoice", "Meeting Notes", "Proposal"],
      },
      {
        key: "raw_data",
        type: "textarea",
        label: "Raw Data",
        description: "Paste the content or data points for the document.",
        required: true,
      },
      {
        key: "company_name",
        type: "string",
        label: "Company Name",
        required: true,
      },
      {
        key: "tone",
        type: "select",
        label: "Tone",
        required: true,
        options: ["Professional", "Casual", "Persuasive"],
        default: "Professional",
      },
    ],
    outputSchema: [
      { key: "formatted_document", type: "textarea", label: "Generated Content" },
      { key: "download_url", type: "string", label: "Download Link" },
    ],
  },
  {
    metadata: {
      id: "instant-background-remover",
      name: "Instant Background Remover",
      description: "Pro-quality image background removal in one click.",
      repository: "https://github.com/nadermx/backgroundremover",
      category: "Marketing",
    },
    inputParameters: [
      {
        key: "image_url",
        type: "string",
        label: "Image URL",
        description: "Public URL of the image to process.",
        required: true,
      },
      {
        key: "output_format",
        type: "select",
        label: "Output Format",
        required: true,
        options: ["PNG", "JPEG", "WebP"],
        default: "PNG",
      },
      {
        key: "alpha_matting",
        type: "select",
        label: "Enhance Edges",
        required: true,
        options: ["Yes", "No"],
        default: "Yes",
      },
    ],
    outputSchema: [
      { key: "processed_image", type: "string", label: "Processed Image URL" },
      { key: "original_filename", type: "string", label: "File Name" },
    ],
  },
  {
    metadata: {
      id: "ai-paperless-office",
      name: "AI Paperless Office",
      description: "Automated document archiving and management with AI-powered tagging and summarization.",
      repository: "https://github.com/knows-cloud/paperless-iq",
      category: "Operations",
    },
    inputParameters: [
      {
        key: "file_url",
        type: "string",
        label: "Document URL",
        description: "Public URL of the document to process.",
        required: true,
      },
      {
        key: "extraction_fields",
        type: "string",
        label: "Custom Extraction Fields",
        description: "e.g., Invoice Number, Total Amount",
        required: false,
      },
      {
        key: "enable_summarization",
        type: "select",
        label: "Enable AI Summary",
        required: true,
        options: ["Yes", "No"],
        default: "Yes",
      },
    ],
    outputSchema: [
      { key: "extracted_data", type: "textarea", label: "Extracted Data" },
      { key: "summary", type: "textarea", label: "AI Summary" },
      { key: "category_tag", type: "string", label: "Category Tag" },
    ],
  },
  {
    metadata: {
      id: "deal-closer-assistant",
      name: "Deal Closer Assistant",
      description: "AI-powered sales deal tracker and risk identifier to help you close faster.",
      repository: "https://github.com/faradayio/dealbot",
      category: "Sales",
    },
    inputParameters: [
      {
        key: "deal_details",
        type: "textarea",
        label: "Deal Details",
        description: "Provide info about the current deal and client.",
        required: true,
      },
      {
        key: "current_stage",
        type: "select",
        label: "Current Sales Stage",
        required: true,
        options: ["Discovery", "Proposal", "Negotiation", "Closing"],
      },
      {
        key: "last_interaction",
        type: "textarea",
        label: "Last Interaction Summary",
        required: true,
      },
    ],
    outputSchema: [
      { key: "risk_level", type: "string", label: "Risk Level" },
      { key: "suggested_next_steps", type: "textarea", label: "Suggested Actions" },
      { key: "winning_strategy", type: "textarea", label: "Recommended Strategy" },
    ],
  },
  {
    metadata: {
      id: "gtm-signal-scorer",
      name: "GTM Signal Scorer",
      description: "Automatically scores Go-To-Market signals to prioritize high-intent leads.",
      repository: "https://github.com/attentiontech/gtm-superintelligence",
      category: "Sales",
    },
    inputParameters: [
      {
        key: "lead_data",
        type: "textarea",
        label: "Lead Data/Interactions",
        description: "Paste lead contact info or recent activity logs.",
        required: true,
      },
      {
        key: "target_customer_profile",
        type: "textarea",
        label: "Ideal Customer Profile (ICP)",
        description: "Describe your perfect customer.",
        required: true,
      },
      {
        key: "intent_signals",
        type: "textarea",
        label: "Custom Intent Signals",
        description: "e.g., Pricing page visit, Whitepaper download.",
        required: false,
      },
    ],
    outputSchema: [
      { key: "lead_score", type: "string", label: "Lead Score (0-100)" },
      { key: "priority_level", type: "string", label: "Priority Level" },
      { key: "key_signals_detected", type: "textarea", label: "Top Intent Signals" },
    ],
  },
  {
    metadata: {
      id: "customer-sentiment-dashboard",
      name: "Customer Sentiment Dashboard",
      description: "Real-time analysis of customer reviews and feedback trends.",
      repository: "https://github.com/arpan65/Customer-Review-Analysis-SaaS",
      category: "Marketing",
    },
    inputParameters: [
      {
        key: "reviews_text",
        type: "textarea",
        label: "Paste Customer Reviews",
        description: "Paste one or more reviews here.",
        required: true,
      },
      {
        key: "competitor_name",
        type: "string",
        label: "Competitor to Benchmark",
        required: false,
      },
      {
        key: "time_period",
        type: "select",
        label: "Time Period",
        required: true,
        options: ["Last 30 Days", "Last 90 Days", "All Time"],
        default: "Last 30 Days",
      },
    ],
    outputSchema: [
      { key: "overall_sentiment", type: "string", label: "Overall Sentiment" },
      { key: "top_complaints", type: "textarea", label: "Common Complaints" },
      { key: "top_praises", type: "textarea", label: "Common Praises" },
    ],
  },
  {
    metadata: {
      id: "sales-outreach-accelerator",
      name: "Sales Outreach Accelerator",
      description: "Automate personalized sales outreach messages at scale.",
      repository: "https://github.com/BraaMohammed/bricks",
      category: "Sales",
    },
    inputParameters: [
      {
        key: "recipient_data",
        type: "textarea",
        label: "Recipient Info",
        description: "Paste LinkedIn profile or company info.",
        required: true,
      },
      {
        key: "product_description",
        type: "textarea",
        label: "Your Product/Offer",
        required: true,
      },
      {
        key: "outreach_tone",
        type: "select",
        label: "Outreach Tone",
        required: true,
        options: ["Professional", "Bold", "Helpful", "Inquisitive"],
        default: "Professional",
      },
    ],
    outputSchema: [
      { key: "personalized_message", type: "textarea", label: "Personalized Message" },
      { key: "subject_line", type: "string", label: "Suggested Subject Line" },
      { key: "follow_up_schedule", type: "textarea", label: "Follow-up Cadence" },
    ],
  },
  {
    metadata: {
      id: "ai-deep-researcher",
      name: "AI Deep Researcher",
      description: "Get a deep research report on any complex topic, industry, or competitor.",
      repository: "https://github.com/Egonex-AI/Understand-Anything",
      category: "Data & Analytics",
    },
    inputParameters: [
      {
        key: "topic",
        type: "string",
        label: "Research Topic",
        description: "What topic should we research in depth?",
        required: true,
      },
      {
        key: "depth_level",
        type: "select",
        label: "Research Depth",
        required: true,
        options: ["Standard", "Exhaustive"],
        default: "Standard",
      },
      {
        key: "output_format",
        type: "select",
        label: "Report Format",
        required: true,
        options: ["Executive Summary", "Detailed Whitepaper"],
        default: "Executive Summary",
      },
    ],
    outputSchema: [
      { key: "executive_summary", type: "textarea", label: "Executive Summary" },
      { key: "detailed_findings", type: "textarea", label: "Key Findings" },
      { key: "bibliography", type: "textarea", label: "Sources & References" },
    ],
  },
];

export function getToolById(id: string): ToolConfig | undefined {
  return tools.find((t) => t.metadata.id === id);
}
