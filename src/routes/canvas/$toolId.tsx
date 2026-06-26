import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Play, Loader2, CheckCircle2, AlertCircle,
  FileSpreadsheet, Download,
} from "lucide-react";
import { getToolById, type InputParameter } from "~/config/tools";
import { executeTool, type ExecuteToolResult } from "~/server/tools";

export const Route = createFileRoute("/canvas/$toolId")({
  component: ToolCanvasPage,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="h-12 w-12 text-gray-300" />
      <h2 className="mt-4 text-lg font-semibold text-gray-900">Tool not found</h2>
      <p className="mt-1 text-sm text-gray-500">The tool doesn't exist or has been removed.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Back to Storefront</Link>
    </div>
  ),
});

const PROGRESS_STEPS = [
  "Step 1: Initializing cloud container...",
  "Step 2: Bypassing firewalls and parsing website HTML...",
  "Step 3: AI identifying contact elements and roles...",
  "Step 4: Formatting final structured spreadsheet...",
];

function ToolCanvasPage() {
  const { toolId } = useParams({ from: Route.id });
  const tool = getToolById(toolId);
  const isLeadFinder = toolId === "local-leads-finder";

  // Lead Finder state
  const [targetUrl, setTargetUrl] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [showResults, setShowResults] = useState(false);

  // Generic state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Tool not found</h2>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Back to Storefront</Link>
      </div>
    );
  }

  // --- Lead Finder Handler (server-backed) ---
  const handleLeadFinderRun = () => {
    if (!targetUrl.trim()) return;

    setPhase("running");
    setShowResults(false);
    setProgressStep(0);

    // Run progress animation
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    // Simulate server call (the 1500ms*4 steps = 6s matches the animation)
    // In production, this would be a real API call
    setTimeout(async () => {
      try {
        // Capture the user's inputs for the server call
        const serverParams: Record<string, string> = {
          query: targetUrl,
          location: "",
          limit: deepScan ? "10" : "5",
        };
        const serverResult: ExecuteToolResult = await executeTool({
          data: { toolId, params: serverParams },
        });

        if (serverResult.success) {
          // Store server data as results for the display
          setResults({
            leads: JSON.stringify(serverResult.data.leads ?? []),
            ...serverResult.data,
          } as Record<string, string>);
          setPhase("done");
          setTimeout(() => setShowResults(true), 300);
        } else {
          setResults({ error: serverResult.error ?? "Server execution failed" });
          setPhase("error");
          setTimeout(() => setShowResults(true), 300);
        }
      } catch {
        setResults({ error: "Network error contacting execution server" });
        setPhase("error");
        setTimeout(() => setShowResults(true), 300);
      }
    }, 6000); // after animation completes
  };

  // --- Generic Handler (server-backed) ---
  const handleGenericRun = async () => {
    const missing = tool.inputParameters.filter(p => p.required && !inputs[p.key]?.trim());
    if (missing.length > 0) {
      setStatus("error");
      setResults({ error: "Required: " + missing.map(p => p.label).join(", ") });
      return;
    }

    setStatus("running");
    setResults(null);

    try {
      const serverResult: ExecuteToolResult = await executeTool({
        data: { toolId, params: inputs },
      });

      if (serverResult.success) {
        // Flatten the response into the key-value format the generic UI expects
        const flatResults: Record<string, string> = {};
        for (const [key, value] of Object.entries(serverResult.data)) {
          if (typeof value === "object" && value !== null) {
            flatResults[key] = JSON.stringify(value, null, 2);
          } else {
            flatResults[key] = String(value);
          }
        }
        setResults(flatResults);
        setStatus("done");
      } else {
        setResults({ error: serverResult.error ?? "Unknown server error" });
        setStatus("error");
      }
    } catch {
      setResults({ error: "Network error contacting execution server" });
      setStatus("error");
    }
  };

  // --- Generic Input Renderer ---
  const renderInput = (p: InputParameter) => {
    const v = inputs[p.key] ?? p.default ?? "";
    const c = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";
    if (p.type === "textarea") return <textarea id={p.key} value={v} onChange={e => setInputs(s => ({ ...s, [p.key]: e.target.value }))} placeholder={p.description} rows={4} className={c} />;
    if (p.type === "select" && p.options) return <select id={p.key} value={v} onChange={e => setInputs(s => ({ ...s, [p.key]: e.target.value }))} className={c}>{p.options.map(o => <option key={o}>{o}</option>)}</select>;
    if (p.type === "password") return (
      <div className="relative">
        <input id={p.key} type={showPassword[p.key] ? "text" : "password"} value={v} onChange={e => setInputs(s => ({ ...s, [p.key]: e.target.value }))} placeholder={p.description} className={c + " pr-10"} />
        <button onClick={() => setShowPassword(s => ({ ...s, [p.key]: !s[p.key] }))} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"><AlertCircle className="h-4 w-4" /></button>
      </div>
    );
    return <input id={p.key} type={p.type === "number" ? "number" : "text"} value={v} onChange={e => setInputs(s => ({ ...s, [p.key]: e.target.value }))} placeholder={p.description} className={c} />;
  };

  // ===== LEAD FINDER SPEC =====
  if (isLeadFinder) {
    // Parse leads from server results when available
    let leads: Record<string, unknown>[] = [];
    if (results?.leads) {
      try { leads = JSON.parse(results.leads); }
      catch { /* ignore parse errors */ }
    }
    const errorMsg = phase === "error" ? results?.error : null;

    return (
      <div>
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Panel */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-gray-900">Instant Competitor Lead Finder Configuration</h2>
              <p className="mt-1 text-xs text-gray-400">Enter a competitor URL to extract decision-maker contacts.</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Target Website URL</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example-competitor.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable Deep Sub-Page Scanning</p>
                    <p className="text-xs text-gray-400">Uses extra credits</p>
                  </div>
                  <button
                    onClick={() => setDeepScan(!deepScan)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${deepScan ? "bg-indigo-600" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${deepScan ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              {phase !== "running" && (
                <button
                  onClick={handleLeadFinderRun}
                  disabled={!targetUrl.trim()}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Run Automated Tool
                </button>
              )}

              {phase === "running" && (
                <div className="mt-6 space-y-3 rounded-lg bg-indigo-50 p-4">
                  {PROGRESS_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {i < progressStep ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : i === progressStep ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-600" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={`text-sm ${i < progressStep ? "text-emerald-700" : i === progressStep ? "font-medium text-indigo-700" : "text-gray-400"}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              {!showResults ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                    <FileSpreadsheet className="h-8 w-8 text-indigo-300" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-900">No Data Yet</p>
                  <p className="mt-1 text-sm text-gray-500">Run the tool to generate business value data.</p>
                </div>
              ) : errorMsg ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-12 w-12 text-red-300" />
                  <p className="mt-4 text-sm font-medium text-red-700">Execution Error</p>
                  <p className="mt-1 text-sm text-gray-500">{errorMsg}</p>
                </div>
              ) : leads.length > 0 ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">Lead extraction complete</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{leads.length} contacts</span>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700">
                      <Download className="h-3.5 w-3.5" /> Export to Excel (.xlsx)
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Business Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Address</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leads.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                              {String(row.business_name ?? "")}
                              {row.website && <span className="ml-2 text-xs text-indigo-500">🔗</span>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{String(row.phone ?? "")}</td>
                            <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-600">{String(row.address ?? "")}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <span className="text-amber-500">★</span>
                                {String(row.rating ?? "—")}
                                <span className="ml-1 text-xs text-gray-400">({String(row.reviews ?? "0")})</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-sm font-medium text-gray-900">No leads found</p>
                  <p className="mt-1 text-sm text-gray-500">Try a different URL or enable deep scanning.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== GENERIC TOOL CANVAS =====
  return (
    <div>
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Storefront
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">{tool.metadata.name}</h2>
            <p className="mb-5 text-sm text-gray-500">{tool.metadata.description}</p>
            <div className="space-y-4">
              {tool.inputParameters.map(p => (
                <div key={p.key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{p.label}{p.required && <span className="ml-1 text-red-400">*</span>}</label>
                  {renderInput(p)}
                </div>
              ))}
            </div>
            <button onClick={handleGenericRun} disabled={status === "running"} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {status === "running" ? <><Loader2 className="h-4 w-4 animate-spin" /> Running...</> : <><Play className="h-4 w-4" /> Run Tool</>}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Results</h3>
            {status === "idle" && <div className="py-16 text-center text-sm text-gray-500">Configure inputs and click "Run Tool".</div>}
            {status === "running" && (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
                <p className="mt-4 text-sm font-medium">Processing on server...</p>
              </div>
            )}
            {status === "error" && results?.error && <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{results.error}</div>}
            {status === "done" && results && !results.error && (
              <div className="mt-4">
                <div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><span className="text-sm font-medium text-emerald-700">Complete</span></div>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Field</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Value</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tool.outputSchema.map(f => (
                        <tr key={f.key} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700">{f.label}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {results[f.key] !== undefined ? (
                              <span className="whitespace-pre-wrap">{results[f.key].length > 200 ? results[f.key].slice(0, 200) + "..." : results[f.key]}</span>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
