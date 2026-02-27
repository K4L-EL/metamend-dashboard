import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  Users,
  TrendingUp,
  Shield,
  Building2,
  Bell,
  ClipboardCheck,
  FlaskConical,
  Network,
  Unplug,
  Workflow,
  Search,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useSidebar } from "./sidebar-context";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  exact: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { to: "/app", icon: LayoutDashboard, label: "Dashboard", exact: true },
      {
        to: "/app/alerts",
        icon: Bell,
        label: "Alerts",
        exact: false,
        badge: "3",
      },
    ],
  },
  {
    title: "Surveillance",
    items: [
      {
        to: "/app/surveillance",
        icon: Activity,
        label: "Infections",
        exact: false,
        badge: "10",
      },
      { to: "/app/patients", icon: Users, label: "Patients", exact: false },
      {
        to: "/app/screening",
        icon: ClipboardCheck,
        label: "Screening",
        exact: false,
      },
      { to: "/app/devices", icon: Unplug, label: "Devices", exact: false },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        to: "/app/forecasting",
        icon: TrendingUp,
        label: "Risk Forecast",
        exact: false,
      },
      {
        to: "/app/resistance",
        icon: FlaskConical,
        label: "AMR Tracking",
        exact: false,
      },
      {
        to: "/app/hospital-map",
        icon: Building2,
        label: "Location Risk",
        exact: false,
      },
      {
        to: "/app/pipelines",
        icon: Workflow,
        label: "Data Pipelines",
        exact: false,
        badge: "New",
      },
    ],
  },
  {
    title: "Response",
    items: [
      {
        to: "/app/outbreaks",
        icon: Shield,
        label: "Outbreaks",
        exact: false,
        badge: "2",
      },
      {
        to: "/app/transmission",
        icon: Network,
        label: "Transmission",
        exact: false,
      },
    ],
  },
];

export function AppSidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { collapsed, toggle } = useSidebar();

  const width = collapsed ? 60 : 240;

  return (
    <aside
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition:
          "width 200ms ease-in-out, min-width 200ms ease-in-out, max-width 200ms ease-in-out",
      }}
      className="border-r border-neutral-200 bg-neutral-950"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-[52px] shrink-0 items-center",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-bold tracking-wider text-neutral-900 shadow-md">
            M
          </div>
          {!collapsed && (
            <div>
              <span className="text-[13px] font-semibold tracking-tight text-white">
                MetaMed
              </span>
              <span className="ml-1 text-[10px] font-medium text-neutral-500">
                Intelligence
              </span>
            </div>
          )}
        </div>
        {!collapsed &&
          ~(
            <div className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5">
              <span className="h-1 w-1 rounded-full bg-neutral-400" />
              <span className="text-[9px] font-medium text-neutral-400">
                Live
              </span>
            </div>
          )}
      </div>

      <div
        className={cn(
          "h-px shrink-0 bg-neutral-800",
          collapsed ? "mx-2" : "mx-4",
        )}
      />

      {/* Search */}
      <div className="shrink-0">
        {!collapsed && (
          <div className="px-3 pb-3 pt-3">
            <button className="flex w-full items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-left transition-colors hover:bg-neutral-800/50">
              <Search
                className="h-3.5 w-3.5 text-neutral-500"
                strokeWidth={2}
              />
              <span className="flex-1 text-[12px] text-neutral-500">
                Search...
              </span>
              <kbd className="hidden rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-600 sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-3">
            <button className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300">
              <Search className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation — takes remaining space, never scrolls */}
      <nav className="flex-1 min-h-0 space-y-1 overflow-hidden px-2 pt-2 pb-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            {!collapsed && (
              <p className="mb-1 px-3 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">
                {section.title}
              </p>
            )}
            {collapsed && (
              <div className="mt-2 mb-1 mx-auto h-px w-6 bg-neutral-800" />
            )}
            <div className="space-y-px">
              {section.items.map(({ to, icon: Icon, label, exact, badge }) => {
                const isActive = exact
                  ? currentPath === to
                  : currentPath.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "group relative flex items-center rounded-lg text-[13px] font-medium transition-all",
                      collapsed
                        ? "justify-center px-0 py-[7px]"
                        : "gap-2.5 px-3 py-[6px]",
                      isActive
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-r-full bg-white" />
                    )}
                    <Icon
                      className={cn(
                        "shrink-0",
                        collapsed ? "h-4 w-4" : "h-[14px] w-[14px]",
                        isActive
                          ? "text-white"
                          : "text-neutral-500 group-hover:text-neutral-300",
                      )}
                      strokeWidth={1.8}
                    />
                    {!collapsed && <span className="flex-1">{label}</span>}
                    {!collapsed && badge && (
                      <span className="inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-neutral-600 px-1.5 text-[9px] font-semibold text-white">
                        {badge}
                      </span>
                    )}
                    {!collapsed && isActive && (
                      <ChevronRight
                        className="h-3 w-3 text-neutral-500"
                        strokeWidth={2}
                      />
                    )}
                    {collapsed && badge && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-neutral-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "h-px shrink-0 bg-neutral-800",
          collapsed ? "mx-2" : "mx-4",
        )}
      />

      {/* Quick links */}
      <div className="shrink-0 space-y-px px-2 py-2">
        <SidebarQuickLink
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
        />
        <SidebarQuickLink
          icon={HelpCircle}
          label="Documentation"
          collapsed={collapsed}
        />
      </div>

      <div
        className={cn(
          "h-px shrink-0 bg-neutral-800",
          collapsed ? "mx-2" : "mx-4",
        )}
      />

      {/* User profile */}
      <div className={cn("shrink-0 py-3", collapsed ? "px-2" : "px-3")}>
        <div
          className={cn(
            "flex items-center rounded-lg transition-colors hover:bg-neutral-900",
            collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2 py-2",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-600 text-[10px] font-bold text-white">
            KM
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-medium text-neutral-200">
                  Dr. K. Mohamed
                </p>
                <p className="truncate text-[10px] text-neutral-500">
                  IPC Lead · Admin
                </p>
              </div>
              <LogOut
                className="h-3.5 w-3.5 shrink-0 text-neutral-500 hover:text-neutral-300"
                strokeWidth={1.8}
              />
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <div
        className={cn(
          "shrink-0 border-t border-neutral-800 py-2",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center rounded-lg py-[6px] text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose
                className="h-[14px] w-[14px] shrink-0"
                strokeWidth={1.8}
              />
              <span className="text-[12px] font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarQuickLink({
  icon: Icon,
  label,
  collapsed,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}) {
  return (
    <button
      title={collapsed ? label : undefined}
      className={cn(
        "flex w-full items-center rounded-lg text-left text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-300",
        collapsed ? "justify-center px-0 py-[7px]" : "gap-2.5 px-3 py-[6px]",
      )}
    >
      <Icon
        className={cn("shrink-0", collapsed ? "h-4 w-4" : "h-[14px] w-[14px]")}
        strokeWidth={1.8}
      />
      {!collapsed && label}
    </button>
  );
}
