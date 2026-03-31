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
  Workflow,
  Search,
  Microscope,
  Plug,
  FileText,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
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
      { to: "/app/alerts", icon: Bell, label: "Alerts", exact: false },
    ],
  },
  {
    title: "Clinical",
    items: [
      { to: "/app/surveillance", icon: Activity, label: "Infections", exact: false },
      { to: "/app/patients", icon: Users, label: "Patients", exact: false },
      { to: "/app/screening", icon: ClipboardCheck, label: "Screening", exact: false },
      { to: "/app/devices", icon: Plug, label: "Devices", exact: false },
    ],
  },
  {
    title: "Analytics",
    items: [
      { to: "/app/forecasting", icon: TrendingUp, label: "Risk Forecast", exact: false },
      { to: "/app/resistance", icon: FlaskConical, label: "AMR Tracking", exact: false },
      { to: "/app/hospital-map", icon: Building2, label: "Location Risk", exact: false },
      { to: "/app/outbreaks", icon: Shield, label: "Outbreaks", exact: false },
      { to: "/app/transmission", icon: Network, label: "Transmission", exact: false },
      { to: "/app/pipelines", icon: Workflow, label: "Data Pipelines", exact: false },
      { to: "/app/reports", icon: FileText, label: "Reports", exact: false },
    ],
  },
];

interface AppSidebarProps {
  mobile?: boolean;
}

export function AppSidebar({ mobile }: AppSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { collapsed, toggle, closeMobile } = useSidebar();

  const isCollapsed = mobile ? false : collapsed;
  const width = isCollapsed ? 60 : 240;

  const handleNavClick = () => {
    if (mobile) closeMobile();
  };

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
        transition: mobile ? "none" : "width 200ms ease-in-out, min-width 200ms ease-in-out, max-width 200ms ease-in-out",
      }}
      className="border-r border-neutral-200 bg-neutral-950"
    >
      {/* Logo */}
      <div className={cn("flex h-[52px] shrink-0 items-center", isCollapsed ? "justify-center px-2" : "justify-between px-4")}>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="MetaMed" className="h-7 w-7 shrink-0 rounded-md shadow-md" />
          {!isCollapsed && (
            <div>
              <span className="text-sm font-semibold tracking-tight text-white">MetaMed</span>
              <span className="ml-1 text-[10px] font-medium text-neutral-500">Intelligence</span>
            </div>
          )}
        </div>
        {mobile && (
          <button onClick={closeMobile} className="rounded-md p-1 text-neutral-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className={cn("h-px shrink-0 bg-neutral-800", isCollapsed ? "mx-2" : "mx-4")} />

      {/* Search */}
      <div className="shrink-0">
        {!isCollapsed && (
          <div className="px-3 pb-3 pt-3">
            <button className="flex w-full items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-left transition-colors hover:bg-neutral-800/50">
              <Search className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
              <span className="flex-1 text-xs text-neutral-500">Search...</span>
              <kbd className="hidden rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-600 sm:inline">⌘K</kbd>
            </button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center py-3">
            <button className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300">
              <Search className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-2 pt-2 pb-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            {!isCollapsed && (
              <p className="mb-1 px-3 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">
                {section.title}
              </p>
            )}
            {isCollapsed && <div className="mt-2 mb-1 mx-auto h-px w-6 bg-neutral-800" />}
            <div className="space-y-px">
              {section.items.map(({ to, icon: Icon, label, exact, badge }) => {
                const isActive = exact ? currentPath === to : currentPath.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    title={isCollapsed ? label : undefined}
                    onClick={handleNavClick}
                    className={cn(
                      "group relative flex items-center rounded-lg text-sm font-medium transition-all",
                      isCollapsed ? "justify-center px-0 py-[7px]" : "gap-2.5 px-3 py-[6px]",
                      isActive
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200",
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-r-full bg-white" />}
                    <Icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-[14px] w-[14px]", isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-300")} strokeWidth={1.8} />
                    {!isCollapsed && <span className="flex-1">{label}</span>}
                    {!isCollapsed && badge && (
                      <span className="inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-neutral-600 px-1.5 text-[10px] font-semibold text-white">
                        {badge}
                      </span>
                    )}
                    {!isCollapsed && isActive && <ChevronRight className="h-3 w-3 text-neutral-500" strokeWidth={2} />}
                    {isCollapsed && badge && <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-neutral-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("h-px shrink-0 bg-neutral-800", isCollapsed ? "mx-2" : "mx-4")} />

      {/* Quick links */}
      <div className="shrink-0 space-y-px px-2 py-2">
        <SidebarQuickLink to="/app/lab" icon={Microscope} label="MetaMed Lab" collapsed={isCollapsed} currentPath={currentPath} onClick={handleNavClick} />
        <SidebarQuickLink to="/app/settings" icon={Settings} label="Settings" collapsed={isCollapsed} currentPath={currentPath} onClick={handleNavClick} />
        <SidebarQuickLink to="/app/account" icon={HelpCircle} label="Account" collapsed={isCollapsed} currentPath={currentPath} onClick={handleNavClick} />
      </div>

      <div className={cn("h-px shrink-0 bg-neutral-800", isCollapsed ? "mx-2" : "mx-4")} />

      {/* User profile */}
      <div className={cn("shrink-0 py-3", isCollapsed ? "px-2" : "px-3")}>
        <div className={cn("flex items-center rounded-lg transition-colors hover:bg-neutral-900", isCollapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2 py-2")}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-600 text-[10px] font-bold text-white">
            KM
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-neutral-200">Dr. K. Mohamed</p>
                <p className="truncate text-[10px] text-neutral-500">IPC Lead · Admin</p>
              </div>
              <LogOut className="h-3.5 w-3.5 shrink-0 text-neutral-500 hover:text-neutral-300" strokeWidth={1.8} />
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle — desktop only */}
      {!mobile && (
        <div className={cn("shrink-0 border-t border-neutral-800 py-2", isCollapsed ? "px-2" : "px-3")}>
          <button
            onClick={toggle}
            className={cn(
              "flex w-full items-center rounded-lg py-[6px] text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            ) : (
              <>
                <PanelLeftClose className="h-[14px] w-[14px] shrink-0" strokeWidth={1.8} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}

function SidebarQuickLink({ to, icon: Icon, label, collapsed, currentPath, onClick }: { to: string; icon: LucideIcon; label: string; collapsed: boolean; currentPath: string; onClick?: () => void }) {
  const isActive = currentPath.startsWith(to);
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-lg text-left text-xs font-medium transition-colors",
        collapsed ? "justify-center px-0 py-[7px]" : "gap-2.5 px-3 py-[6px]",
        isActive
          ? "bg-neutral-800 text-white"
          : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300",
      )}
    >
      <Icon className={cn("shrink-0", collapsed ? "h-4 w-4" : "h-[14px] w-[14px]")} strokeWidth={1.8} />
      {!collapsed && label}
    </Link>
  );
}
