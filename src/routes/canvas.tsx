import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Play,
  History,
  ArrowUpRight,
  MapPin,
  Bot,
  MessageCircle,
  Search,
  Video,
  MessageSquare,
  FileCheck,
  Repeat,
  FileText,
  TrendingUp,
} from "lucide-react";
import { tools } from "~/config/tools";

export const Route = createFileRoute("/canvas")({
  component: CanvasPage,
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
};

const toolColors: Record<string, string> = {
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
};

function CanvasPage() {
  const { pathname } = useLocation();
  const isIndex = pathname === "/canvas" || pathname === "/canvas/";

  if (!isIndex) {
    return <Outlet />;
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canvas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Run individual tools or orchestrate multi-step automations.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          <Play className="h-4 w-4" />
          Browse Tools
        </Link>
      </div>

      {/* Tool quick-launch grid */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Quick Launch
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = toolIcons[tool.metadata.id] || LayoutDashboard;
            const colors = toolColors[tool.metadata.id] || "from-indigo-500 to-purple-600";
            return (
              <Link
                key={tool.metadata.id}
                to="/canvas/$toolId"
                params={{ toolId: tool.metadata.id }}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colors} text-white`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {tool.metadata.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {tool.metadata.category}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Multi-step canvas area */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Workflow Canvas
        </h2>
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-12">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <LayoutDashboard className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Your canvas is empty
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Drag tools from the quick-launch grid to build a multi-step
              workflow. Connect them end-to-end to run complex operations.
            </p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">
              <Play className="h-4 w-4" />
              Start Building
            </button>
          </div>
        </div>
      </section>

      {/* Recent runs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Runs</h2>
          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View history &rarr;
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center py-12 text-center">
            <History className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No runs yet. Start your first workflow to see results here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
