import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  History,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";
import { getHistory, clearHistory, type HistoryEntry } from "~/lib/history";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());

    // Listen for storage changes from other tabs
    const handler = () => setHistory(getHistory());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your recent tool executions and activity.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Stats summary */}
      {history.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Total Runs</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {history.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Successful</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {history.filter((e) => e.status === "success").length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Failed</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {history.filter((e) => e.status === "error").length}
            </p>
          </div>
        </div>
      )}

      {/* History list */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Execution History
        </h2>

        {history.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-col items-center py-16 text-center">
              <History className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-900">
                No runs yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Run a tool from the Storefront or Canvas to see your history
                here.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
              >
                Browse Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.toolName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {entry.status === "success" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          <AlertCircle className="h-3 w-3" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">
                      {entry.summary}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to="/canvas/$toolId"
                        params={{ toolId: entry.toolId }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}