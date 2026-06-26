import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Code2,
  Upload,
  DollarSign,
  BookOpen,
  GitBranch,
  Shield,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { tools, type ToolConfig, type InputParameter } from "~/config/tools";

export const Route = createFileRoute("/developers")({
  component: DevelopersPage,
});

const defaultManifest = JSON.stringify(tools[2] || {
  metadata: {
    id: "leverage-tool",
    name: "My Tool",
    description: "Describe what your tool does...",
    repository: "https://github.com/user/repo",
    category: "Custom",
  },
  inputParameters: [
    { key: "api_key", type: "password", label: "API Key", required: true },
    { key: "query", type: "string", label: "Search Query", description: "e.g., what to search for", required: true },
    { key: "format", type: "select", label: "Output Format", options: ["JSON", "CSV"], default: "JSON", required: false },
  ],
  outputSchema: [
    { key: "result", type: "string", label: "Result Data" },
    { key: "count", type: "number", label: "Total Results" },
  ],
}, null, 2);

const benefits = [
  {
    icon: Upload,
    title: "Lazy Ingestion",
    description: "Submit a GitHub URL. We handle the rest — no frontend, no infrastructure.",
  },
  {
    icon: DollarSign,
    title: "50% Revenue Share",
    description: "Earn from the global usage pool every time someone runs your tool.",
  },
  {
    icon: BookOpen,
    title: "Zero Docs Required",
    description: "We auto-generate the UI, docs, and examples from your repository.",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description: "Push updates to your repo and they're live on Leverage in minutes.",
  },
  {
    icon: Shield,
    title: "Sandboxed Execution",
    description: "Every tool runs in an isolated environment. Your code never touches our infrastructure.",
  },
  {
    icon: Code2,
    title: "API Access",
    description: "Advanced users get direct API access to programmatically trigger tools.",
  },
];

function DevelopersPage() {
  const [manifestText, setManifestText] = useState(defaultManifest);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Live parse the manifest JSON
  const parsedConfig: ToolConfig | { error: string } | null = useMemo(() => {
    try {
      const parsed = JSON.parse(manifestText);
      // Validate required fields
      if (!parsed.metadata?.id || !parsed.metadata?.name) {
        return { error: "Missing required fields: metadata.id and metadata.name" };
      }
      if (!Array.isArray(parsed.inputParameters)) {
        return { error: "Missing required field: inputParameters (must be an array)" };
      }
      if (!Array.isArray(parsed.outputSchema)) {
        return { error: "Missing required field: outputSchema (must be an array)" };
      }
      setParseError(null);
      return parsed as ToolConfig;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setParseError(msg);
      return { error: msg };
    }
  }, [manifestText]);

  const isConfigValid = parsedConfig && !("error" in parsedConfig);

  // Find this config among known tools for badge
  const isKnownTool = isConfigValid &&
    tools.some((t) => t.metadata.id === (parsedConfig as ToolConfig).metadata.id);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Code2 className="h-3 w-3" />
          For developers
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Publish your open-source tool.
          <br />
          <span className="text-indigo-600">Earn on every execution.</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          You wrote the code. Let us build the business around it. Submit your
          GitHub repository and we'll transform it into a 1-click tool for
          thousands of entrepreneurs.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">
            <Upload className="h-4 w-4" />
            Submit Your Repo
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50">
            <BookOpen className="h-4 w-4" />
            Documentation
          </button>
        </div>
      </section>

      {/* Lazy-Dev Console */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Code2 className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Lazy-Dev Console
                </h2>
                <p className="text-xs text-gray-500">
                  Edit your <code className="rounded bg-gray-100 px-1 text-xs text-gray-600">leverage.json</code> manifest &mdash; see the UI update instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {showPreview ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {/* JSON Editor */}
          <div className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                <Edit3 className="mr-1 inline h-3 w-3" />
                Editor
              </span>
              {parseError && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  Invalid JSON
                </span>
              )}
              {isConfigValid && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid
                </span>
              )}
            </div>
            <textarea
              value={manifestText}
              onChange={(e) => setManifestText(e.target.value)}
              className="min-h-[320px] w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              spellCheck={false}
            />
          </div>

          {/* Live Preview */}
          <div className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                <Eye className="mr-1 inline h-3 w-3" />
                Preview
              </span>
              {isKnownTool && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Known Tool
                </span>
              )}
            </div>

            {!showPreview ? (
              <div className="flex items-center justify-center min-h-[320px] text-sm text-gray-400">
                Preview hidden
              </div>
            ) : parseError ? (
              <div className="flex items-center justify-center min-h-[320px]">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-300" />
                  <p className="mt-2 text-sm text-red-500">Invalid JSON</p>
                  <p className="mt-1 text-xs text-gray-400">{parseError}</p>
                </div>
              </div>
            ) : isConfigValid ? (
              <div className="min-h-[320px] space-y-3">
                {/* Tool header preview */}
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">
                      {(parsedConfig as ToolConfig).metadata.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {(parsedConfig as ToolConfig).metadata.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(parsedConfig as ToolConfig).metadata.category || "Custom"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {(parsedConfig as ToolConfig).metadata.description}
                  </p>
                </div>

                {/* Auto-generated input fields */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Input Parameters
                  </p>
                  {(parsedConfig as ToolConfig).inputParameters.map((param) => (
                    <div key={param.key}>
                      <label className="mb-0.5 block text-xs font-medium text-gray-700">
                        {param.label}
                        {param.required && <span className="ml-0.5 text-red-400">*</span>}
                      </label>
                      {param.type === "textarea" ? (
                        <textarea
                          disabled
                          rows={3}
                          placeholder={param.description}
                          className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400"
                        />
                      ) : param.type === "select" && param.options ? (
                        <select
                          disabled
                          className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400"
                        >
                          {param.options.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : param.type === "password" ? (
                        <div className="relative">
                          <input
                            disabled
                            type="password"
                            placeholder={param.description}
                            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 pr-8 text-xs text-gray-400"
                          />
                          <EyeOff className="absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-gray-300" />
                        </div>
                      ) : (
                        <input
                          disabled
                          placeholder={param.description}
                          className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400"
                        />
                      )}
                      {param.description && (
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Output schema preview */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Output Schema
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(parsedConfig as ToolConfig).outputSchema.map((field) => (
                        <span
                          key={field.key}
                          className="rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200"
                        >
                          {field.label} ({field.type})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <benefit.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              {benefit.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {benefit.description}
            </p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-base font-semibold text-gray-900">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Submit your repo",
              desc: "Provide a GitHub URL and configure your leverage.json manifest.",
            },
            {
              step: "2",
              title: "We build the UI",
              desc: "Our ingestion pipeline generates a no-code interface from your manifest.",
            },
            {
              step: "3",
              title: "Earn passive income",
              desc: "50% of every subscription dollar from users running your tool flows to you.",
            },
          ].map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {step.step}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
