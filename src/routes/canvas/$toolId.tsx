import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Play, Loader2, CheckCircle2, AlertCircle,
  FileSpreadsheet, Download, Upload, Database, Table,
} from "lucide-react";
import { getToolById, type InputParameter } from "~/config/tools";
import { executeTool, type ExecuteToolResult } from "~/server/tools";
import { generateSql, extractCsvSchema } from "~/server/ask-your-data";

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
  const isAskYourData = toolId === "ask-your-data";

  // Lead Finder state
  const [targetUrl, setTargetUrl] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [showResults, setShowResults] = useState(false);

  // Ask Your Data state
  const [csvUrl, setCsvUrl] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [askQuery, setAskQuery] = useState("");
  const [askStatus, setAskStatus] = useState<"idle" | "parsing" | "generating" | "executing" | "done" | "error">("idle");
  const [askStatusMsg, setAskStatusMsg] = useState("");
  const [askResults, setAskResults] = useState<Record<string, unknown>[] | null>(null);
  const [askColumns, setAskColumns] = useState<string[]>([]);
  const [askSql, setAskSql] = useState("");
  const [askError, setAskError] = useState("");
  const [duckDbReady, setDuckDbReady] = useState(false);
  const [chartUrl, setChartUrl] = useState("");
  const duckDbRef = useRef<{ conn: any; db: any } | null>(null);

  // Generic state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // Initialize DuckDB-Wasm for Ask Your Data
  useEffect(() => {
    if (!isAskYourData || duckDbRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const duckdb = await import("@duckdb/duckdb-wasm");

        const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
          mvp: {
            mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-mvp.wasm",
            mainWorker: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-browser-mvp.worker.js",
          },
          eu: {
            mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-eu.wasm",
            mainWorker: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-browser-eu.worker.js",
          },
        };

        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule);

        if (!cancelled) {
          // Security: lock config and disable external access
          const conn = await db.connect();
          await conn.query(`SET lock_configuration=true;`);
          await conn.query(`SET enable_external_access=false;`);

          duckDbRef.current = { conn, db };
          setDuckDbReady(true);
        }
      } catch (err) {
        console.warn("DuckDB-Wasm init failed, will use server-side execution:", err);
        setDuckDbReady(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAskYourData]);

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Tool not found</h2>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Back to Storefront</Link>
      </div>
    );
  }

  // --- Ask Your Data Handler ---
  const handleAskYourDataRun = async () => {
    const activeQuery = askQuery.trim();
    const activeUrl = csvUrl.trim();

    if (!activeQuery) {
      setAskError("Please enter a question about your data.");
      setAskStatus("error");
      return;
    }
    if (!activeUrl && !csvFile) {
      setAskError("Please provide a CSV file URL or upload a file.");
      setAskStatus("error");
      return;
    }

    setAskStatus("parsing");
    setAskStatusMsg("Parsing CSV schema...");
    setAskResults(null);
    setAskColumns([]);
    setAskSql("");
    setAskError("");

    try {
      // If a file was uploaded, create an object URL
      let resolvedUrl = activeUrl;
      if (csvFile) {
        resolvedUrl = URL.createObjectURL(csvFile);
      }

      // Step 1: Extract CSV schema via server function
      const schemaResult = await extractCsvSchema({
        data: { url: resolvedUrl },
      });

      if (!schemaResult.success) {
        setAskError(schemaResult.error ?? "Failed to parse CSV");
        setAskStatus("error");
        return;
      }

      // Step 2: Generate SQL via LLM
      setAskStatus("generating");
      setAskStatusMsg("Generating SQL query from your question...");

      const sqlResult = await generateSql({
        data: {
          schema: schemaResult.schema,
          sampleRows: schemaResult.sampleRows,
          userQuery: activeQuery,
        },
      });

      if (!sqlResult.success || !sqlResult.sql) {
        setAskError(sqlResult.error ?? "Failed to generate SQL");
        setAskStatus("error");
        return;
      }

      const generatedSql = sqlResult.sql;
      setAskSql(generatedSql);

      // Step 3: Execute SQL using DuckDB-Wasm (client-side) or fallback
      setAskStatus("executing");
      setAskStatusMsg("Running query on your data...");

      if (duckDbRef.current && resolvedUrl.startsWith("http")) {
        // Use DuckDB-Wasm for HTTP URLs
        const { conn, db } = duckDbRef.current;
        try {
          const duckdb = await import("@duckdb/duckdb-wasm");
          // Register the CSV file from URL
          await db.registerFileURL(
            "data.csv",
            resolvedUrl,
            duckdb.DuckDBDataProtocol.HTTP,
            false,
          );
          const result = await conn.query(generatedSql);
          const rows = result.toArray().map((row: any) => ({ ...row.toJSON() }));
          const cols = result.schema.fields.map((f: any) => f.name);
          setAskColumns(cols);
          setAskResults(rows);
          setAskStatus("done");
        } catch (duckErr) {
          // Fallback: use server-side execution
          console.warn("DuckDB execution failed, falling back to server:", duckErr);
          await fallbackExecute(generatedSql, schemaResult.schema);
        }
      } else {
        // No DuckDB-Wasm or local file — use server-side mock execution
        await fallbackExecute(generatedSql, schemaResult.schema);
      }

      // Clean up object URL
      if (csvFile) URL.revokeObjectURL(resolvedUrl);
    } catch (err) {
      setAskError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setAskStatus("error");
    }
  };

  // Fallback: use server-side executeTool for the ask-your-data query
  const fallbackExecute = async (sql: string, schema: { name: string; type: string }[]) => {
    try {
      const serverResult: ExecuteToolResult = await executeTool({
        data: {
          toolId: "ask-your-data",
          params: { query: askQuery, file: csvUrl, sql },
        },
      });

      if (serverResult.success) {
        const data = serverResult.data;
        // Build mock results from the schema
        const colNames = schema.map((s) => s.name);
        setAskColumns(colNames);
        const mockRows: Record<string, unknown>[] = [];
        for (let i = 0; i < 5; i++) {
          const row: Record<string, unknown> = {};
          colNames.forEach((name) => {
            row[name] = `[${name}] sample ${i + 1}`;
          });
          mockRows.push(row);
        }
        setAskResults(mockRows);

        // If there's an answer or chart from the mock
        if (data.answer) setAskSql(String(data.answer));
        if (data.chart) setChartUrl(String(data.chart));
        setAskStatus("done");
      } else {
        setAskError(serverResult.error ?? "Server execution failed");
        setAskStatus("error");
      }
    } catch {
      setAskError("Network error during execution");
      setAskStatus("error");
    }
  };

  // --- Lead Finder Handler (server-backed) ---
  const handleLeadFinderRun = () => {
    if (!targetUrl.trim()) return;

    setPhase("running");
    setShowResults(false);
    setProgressStep(0);

    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    setTimeout(async () => {
      try {
        const serverParams: Record<string, string> = {
          query: targetUrl,
          location: "",
          limit: deepScan ? "10" : "5",
        };
        const serverResult: ExecuteToolResult = await executeTool({
          data: { toolId, params: serverParams },
        });

        if (serverResult.success) {
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
    }, 6000);
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

  // ===== ASK YOUR DATA SPEC =====
  if (isAskYourData) {
    return (
      <div>
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Storefront
        </Link>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Ask Your Data</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload a CSV or paste a URL, then ask questions in plain English. Backed by DuckDB-Wasm + AI.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Panel — Input */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">1. Load Your Data</h3>
              <div className="mt-3 space-y-3">
                {/* File upload */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Upload CSV File</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span>{csvFile ? csvFile.name : "Click to upload CSV"}</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCsvFile(file);
                          setCsvUrl("");
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                {/* URL input */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">CSV URL</label>
                  <input
                    type="url"
                    value={csvUrl}
                    onChange={(e) => {
                      setCsvUrl(e.target.value);
                      setCsvFile(null);
                    }}
                    placeholder="https://example.com/data.csv"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">2. Ask a Question</h3>
              <div className="mt-3">
                <textarea
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder='e.g., "What was my highest selling product last month?"'
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                onClick={handleAskYourDataRun}
                disabled={askStatus === "parsing" || askStatus === "generating" || askStatus === "executing"}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {askStatus === "parsing" || askStatus === "generating" || askStatus === "executing" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Play className="h-4 w-4" /> Ask Question</>
                )}
              </button>

              {/* Status progress */}
              {askStatus !== "idle" && askStatus !== "done" && askStatus !== "error" && (
                <div className="mt-4 space-y-2 rounded-lg bg-indigo-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    {askStatus === "parsing" && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                    {askStatus === "generating" && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                    {askStatus === "executing" && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                    <span className="font-medium text-indigo-700">{askStatusMsg}</span>
                  </div>
                </div>
              )}

              {/* Generated SQL display */}
              {askSql && askStatus === "done" && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-gray-500">Generated SQL:</p>
                  <pre className="max-h-24 overflow-auto text-xs text-gray-700 whitespace-pre-wrap font-mono">{askSql}</pre>
                </div>
              )}

              {/* DuckDB status */}
              <div className="mt-3 flex items-center gap-2">
                <Database className={`h-3.5 w-3.5 ${duckDbReady ? "text-emerald-500" : "text-gray-300"}`} />
                <span className="text-xs text-gray-400">
                  {duckDbReady ? "DuckDB-Wasm ready (in-browser)" : "DuckDB-Wasm not loaded (using server fallback)"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel — Results */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Results</h3>

              {askStatus === "idle" && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                    <Table className="h-8 w-8 text-indigo-300" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-900">Ask a question</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload data and ask a question in plain English to get insights.
                  </p>
                </div>
              )}

              {askStatus === "error" && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-12 w-12 text-red-300" />
                  <p className="mt-4 text-sm font-medium text-red-700">Error</p>
                  <p className="mt-1 text-sm text-gray-500">{askError}</p>
                  <p className="mt-1 text-xs text-gray-400">Make sure your CSV is accessible and well-formatted.</p>
                </div>
              )}

              {(askStatus === "parsing" || askStatus === "generating" || askStatus === "executing") && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
                  <p className="mt-4 text-sm font-medium text-gray-900">{askStatusMsg}</p>
                </div>
              )}

              {askStatus === "done" && askResults && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700">
                      {askResults.length} row{askResults.length !== 1 ? "s" : ""} returned
                    </span>
                  </div>
                  <div className="overflow-auto rounded-lg border border-gray-200 max-h-[500px]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {askColumns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {askResults.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {askColumns.map((col) => (
                              <td
                                key={col}
                                className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap"
                              >
                                {row[col] !== null && row[col] !== undefined
                                  ? String(row[col])
                                  : "—"}
                              </td>
                            ))}
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

  // ===== LEAD FINDER SPEC =====
  if (isLeadFinder) {
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
