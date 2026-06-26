import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

import {
  Search,
  Wallet,
  Store,
  LayoutDashboard,
  Code2,
  Users,
  TrendingUp,
  Calculator,
  Settings,
  ChevronRight,
  Zap,
} from "lucide-react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Leverage — The No-Code App Store" },
      {
        name: "description",
        content:
          "Powerful no-code automation tools for entrepreneurs. One subscription, unlimited tools.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-lg text-gray-500">
      Page not found
    </div>
  ),
  component: RootComponent,
});

const navItems = [
  { label: "Storefront", path: "/", icon: Store },
  { label: "Canvas", path: "/canvas", icon: LayoutDashboard },
  { label: "Developer Portal", path: "/developers", icon: Code2 },
];

const outcomeCategories = [
  { label: "Lead Generation", icon: Users },
  { label: "Marketing & Sales", icon: TrendingUp },
  { label: "Finance & Tax", icon: Calculator },
  { label: "Operations", icon: Settings },
  { label: "AI & Data", icon: Zap },
];

function RootComponent() {
  return (
    <RootDocument>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <span className="text-sm font-bold text-white">L</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                Leverage
              </span>
            </div>

            {/* Search */}
            <div className="hidden max-w-md flex-1 px-8 sm:block">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Credit balance & user */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5">
                <Wallet className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  50 Credits
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Main layout with sidebar */}
        <div className="flex pt-16">
          {/* Sidebar */}
          <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {/* Navigation */}
              <div className="mb-6 space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Navigation
                </p>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="sidebar-link"
                    activeProps={{ className: "sidebar-link active" }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Categories */}
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Categories
                </p>
                {outcomeCategories.map((cat) => (
                  <Link
                    key={cat.label}
                    to="/"
                    search={{ category: cat.label }}
                    className="sidebar-category w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    activeProps={{ className: "sidebar-category w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-indigo-50 text-indigo-700" }}
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                    <ChevronRight className="ml-auto h-3 w-3" />
                  </Link>
                ))}
              </div>
            </nav>

            {/* Upgrade CTA */}
            <div className="border-t border-gray-100 p-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-4 text-white">
                <p className="text-sm font-semibold">Unlock Unlimited</p>
                <p className="mt-1 text-xs text-indigo-200">
                  $29/mo — all tools, no limits
                </p>
                <button className="mt-3 w-full rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                  Upgrade Now
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 lg:pl-64">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="h-full font-[Inter,system-ui,sans-serif]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}