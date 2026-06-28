import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";

import {
  Sparkles,
  Bot,
  MessageCircle,
  Search,
  Video,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Rocket,
  BarChart3,
  Shield,
  Star,
  X,
  MessageSquare,
  FileCheck,
  Repeat,
  FileText,
  TrendingUp,
  Image,
  Scan,
  Target,
  Send,
  ClipboardList,
} from "lucide-react";

import { tools } from "~/config/tools";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: (search.category as string) || "",
  }),
  loader: () => getBusinessName(),
  component: Home,
});

const toolIcons: Record<string, typeof MapPin> = {
  "local-leads-finder": MapPin,
  "custom-ai-agent-builder": Bot,
  "whatsapp-ai-secretary": MessageCircle,
  "ai-visibility-auditor": Search,
  "social-video-creator": Video,
  "ask-your-data": MessageSquare,
  "smart-business-audit": FileCheck,
  "content-repurposer": Repeat,
  "instant-invoicer": FileText,
  "market-sentiment-watcher": TrendingUp,
  "personal-business-wiki": ClipboardList,
  "ai-marketing-assistant": BarChart3,
  "automated-document-generator": FileCheck,
  "instant-background-remover": Image,
  "ai-paperless-office": Scan,
  "deal-closer-assistant": Target,
  "gtm-signal-scorer": TrendingUp,
  "customer-sentiment-dashboard": Star,
  "sales-outreach-accelerator": Send,
  "ai-deep-researcher": Search,
};

const toolGradients: Record<string, string> = {
  "local-leads-finder": "from-emerald-500 to-teal-600",
  "custom-ai-agent-builder": "from-violet-500 to-purple-600",
  "whatsapp-ai-secretary": "from-green-500 to-emerald-600",
  "ai-visibility-auditor": "from-blue-500 to-indigo-600",
  "social-video-creator": "from-rose-500 to-pink-600",
  "ask-your-data": "from-cyan-500 to-blue-600",
  "smart-business-audit": "from-orange-500 to-red-600",
  "content-repurposer": "from-purple-500 to-pink-600",
  "instant-invoicer": "from-teal-500 to-cyan-600",
  "market-sentiment-watcher": "from-yellow-500 to-amber-600",
  "personal-business-wiki": "from-slate-500 to-gray-600",
  "ai-marketing-assistant": "from-orange-500 to-red-600",
  "automated-document-generator": "from-indigo-400 to-blue-500",
  "instant-background-remover": "from-pink-400 to-rose-500",
  "ai-paperless-office": "from-cyan-500 to-teal-600",
  "deal-closer-assistant": "from-red-500 to-rose-600",
  "gtm-signal-scorer": "from-sky-500 to-cyan-600",
  "customer-sentiment-dashboard": "from-rose-400 to-pink-500",
  "sales-outreach-accelerator": "from-emerald-400 to-green-600",
  "ai-deep-researcher": "from-violet-400 to-indigo-500",
};

const toolBadges: Record<string, { label: string; style: string }> = {
  "local-leads-finder": {
    label: "Most Popular",
    style: "bg-emerald-100 text-emerald-700",
  },
  "custom-ai-agent-builder": {
    label: "New",
    style: "bg-violet-100 text-violet-700",
  },
  "social-video-creator": {
    label: "Trending",
    style: "bg-rose-100 text-rose-700",
  },
  "ask-your-data": {
    label: "New",
    style: "bg-cyan-100 text-cyan-700",
  },
  "instant-invoicer": {
    label: "Popular",
    style: "bg-teal-100 text-teal-700",
  },
  "personal-business-wiki": {
    label: "New",
    style: "bg-slate-100 text-slate-700",
  },
  "ai-marketing-assistant": {
    label: "New",
    style: "bg-orange-100 text-orange-700",
  },
  "automated-document-generator": {
    label: "New",
    style: "bg-indigo-100 text-indigo-700",
  },
  "instant-background-remover": {
    label: "New",
    style: "bg-pink-100 text-pink-700",
  },
  "ai-paperless-office": {
    label: "New",
    style: "bg-cyan-100 text-cyan-700",
  },
  "deal-closer-assistant": {
    label: "New",
    style: "bg-red-100 text-red-700",
  },
  "gtm-signal-scorer": {
    label: "New",
    style: "bg-sky-100 text-sky-700",
  },
  "customer-sentiment-dashboard": {
    label: "New",
    style: "bg-rose-100 text-rose-700",
  },
  "sales-outreach-accelerator": {
    label: "New",
    style: "bg-emerald-100 text-emerald-700",
  },
  "ai-deep-researcher": {
    label: "New",
    style: "bg-violet-100 text-violet-700",
  },
};

const benefits = [
  {
    icon: Rocket,
    title: "Enterprise Power",
    description:
      "Tools that usually cost thousands, wrapped in a single $29/mo subscription.",
  },
  {
    icon: BarChart3,
    title: "Zero Config",
    description:
      "No code, no APIs, no deployments. Just open a tool and start getting results.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Every tool runs in an isolated sandbox. Your data never leaves your control.",
  },
];

function Home() {
  const { category } = useSearch({ from: Route.id });
  const navigate = useNavigate();
  const filteredTools = category
    ? tools.filter((t) => {
        const catMap: Record<string, string> = {
          "Lead Generation": "Lead Generation",
          "Marketing & Sales": "Marketing",
          "Finance & Tax": "Finance",
          Operations: "Operations",
          "AI & Data": "AI Operations",
        };
        const mapped = catMap[category];
        return (
          t.metadata.category === category ||
          t.metadata.category === mapped ||
          t.metadata.category?.toLowerCase().includes(category.toLowerCase())
        );
      })
    : tools;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3 w-3" />
          The no-code app store for open source
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Tools that run your business
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            without the code.
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
          Stop burning budget on expensive SaaS. Leverage turns powerful
          open-source software into one-click tools — one subscription,
          unlimited access.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md">
            <CreditCard className="h-4 w-4" />
            Start Free — $29/mo
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50">
            Explore Tools
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Category quick nav */}
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            "Lead Generation",
            "AI Operations",
            "Customer Engagement",
            "Marketing",
            "Content Marketing",
            "Sales",
            "Operations",
            "Data & Analytics",
            "Finance & Tax",
          ].map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-200 hover:text-indigo-600 cursor-pointer"
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Tool Catalog */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Tool Catalog
            </h2>
            <p className="text-sm text-gray-500">
              {category
                ? `Showing ${filteredTools.length} tools in "${category}"`
                : `${filteredTools.length} premium tools — one subscription`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {category && (
              <button
                onClick={() => navigate({ to: "/", search: { category: "" } })}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <X className="h-3 w-3" /> Clear filter
              </button>
            )}
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all &rarr;
            </button>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => {
            const Icon =
              toolIcons[tool.metadata.id] || Star;
            const gradient =
              toolGradients[tool.metadata.id] || "from-indigo-500 to-purple-600";
            const badge = toolBadges[tool.metadata.id];

            return (
              <div key={tool.metadata.id} className="tool-card flex flex-col">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br ${gradient} p-2.5 text-white shadow-sm`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {badge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.style}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-gray-900">
                  {tool.metadata.name}
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-500">
                  {tool.metadata.description}
                </p>

                {/* Input params hint */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tool.inputParameters.map((p) => (
                    <span
                      key={p.key}
                      className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200"
                    >
                      {p.required ? (
                        <span className="text-red-400">*</span>
                      ) : null}{" "}
                      {p.label}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <span className="text-xs text-gray-400">from</span> $29/mo
                  </span>
                  <Link
                    to="/canvas/$toolId"
                    params={{ toolId: tool.metadata.id }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700"
                  >
                    Open Tool
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          One subscription. Unlimited tools.
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          No per-tool pricing. No surprise overages. Just powerful automation at
          your fingertips.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <benefit.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing highlight */}
      <section className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Pricing
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              $29{" "}
              <span className="text-base font-normal text-gray-400">
                /month
              </span>
            </h2>
            <p className="mt-1 max-w-lg text-sm text-gray-400">
              Every tool in the library. Unlimited runs. Cancel anytime.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              All current & future tools
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Priority support
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              14-day free trial
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
