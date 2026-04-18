import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
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
  Microscope,
  Plug,
  FileText,
  Settings,
  User,
  UsersRound,
  ShieldCheck,
  Search,
  LogOut,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { cn } from "../../lib/utils";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  section: string;
  keywords?: string;
  action: () => void;
  adminOnly?: boolean;
}

const CommandPaletteContext = createContext<{ open: () => void; close: () => void } | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  const go = useCallback(
    (to: string) => {
      navigate({ to });
      close();
    },
    [navigate, close],
  );

  const commands: Command[] = useMemo(
    () => [
      { id: "nav-dashboard", section: "Navigate", icon: LayoutDashboard, label: "Dashboard", hint: "Overview", keywords: "home", action: () => go("/app") },
      { id: "nav-alerts", section: "Navigate", icon: Bell, label: "Alerts", hint: "Notifications", action: () => go("/app/alerts") },
      { id: "nav-surveillance", section: "Clinical", icon: Activity, label: "Infections", hint: "Surveillance", keywords: "hai infections cultures", action: () => go("/app/surveillance") },
      { id: "nav-patients", section: "Clinical", icon: Users, label: "Patients", keywords: "people", action: () => go("/app/patients") },
      { id: "nav-screening", section: "Clinical", icon: ClipboardCheck, label: "Screening", keywords: "admission screening mrsa", action: () => go("/app/screening") },
      { id: "nav-devices", section: "Clinical", icon: Plug, label: "Devices", keywords: "cvc catheter urinary", action: () => go("/app/devices") },
      { id: "nav-forecasting", section: "Analytics", icon: TrendingUp, label: "Risk Forecast", keywords: "prediction forecast", action: () => go("/app/forecasting") },
      { id: "nav-resistance", section: "Analytics", icon: FlaskConical, label: "AMR Tracking", keywords: "antimicrobial resistance antibiotics", action: () => go("/app/resistance") },
      { id: "nav-map", section: "Analytics", icon: Building2, label: "Location Risk", keywords: "hospital map 3d wards", action: () => go("/app/hospital-map") },
      { id: "nav-outbreaks", section: "Analytics", icon: Shield, label: "Outbreaks", keywords: "clusters", action: () => go("/app/outbreaks") },
      { id: "nav-transmission", section: "Analytics", icon: Network, label: "Transmission", keywords: "graph network", action: () => go("/app/transmission") },
      { id: "nav-pipelines", section: "Analytics", icon: Workflow, label: "Data Pipelines", keywords: "flow etl", action: () => go("/app/pipelines") },
      { id: "nav-reports", section: "Analytics", icon: FileText, label: "Reports", keywords: "export pdf report", action: () => go("/app/reports") },
      { id: "nav-lab", section: "Workspace", icon: Microscope, label: "MetaMed Lab", keywords: "methodology features", action: () => go("/app/lab") },
      { id: "nav-team", section: "Workspace", icon: UsersRound, label: "Team", keywords: "members invite", action: () => go("/app/team") },
      { id: "nav-account", section: "Workspace", icon: User, label: "Account", keywords: "profile me", action: () => go("/app/account") },
      { id: "nav-settings", section: "Workspace", icon: Settings, label: "Settings", keywords: "preferences toggles", action: () => go("/app/settings") },
      { id: "nav-admin", section: "Workspace", icon: ShieldCheck, label: "Admin panel", keywords: "users teams invites", action: () => go("/app/admin"), adminOnly: true },
      { id: "action-logout", section: "Actions", icon: LogOut, label: "Log out", keywords: "signout exit", action: async () => { close(); await logout(); navigate({ to: "/login" }); } },
    ],
    [go, close, logout, navigate],
  );

  const filtered = useMemo(() => {
    const base = commands.filter((c) => !c.adminOnly || user?.isAdmin);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => {
      const haystack = `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""} ${c.section}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query, user]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach((c) => {
      const list = map.get(c.section) ?? [];
      list.push(c);
      map.set(c.section, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      } else if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setActiveIdx(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd) cmd.action();
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  return (
    <CommandPaletteContext.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 pt-[10vh] backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-neutral-200 px-3">
              <Search className="h-4 w-4 text-neutral-400" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent py-3.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-neutral-400">
                  No commands match "{query}"
                </div>
              ) : (
                grouped.map(([section, items]) => (
                  <div key={section} className="mb-1 last:mb-0">
                    <p className="px-4 pb-1 pt-2 text-[10px] font-semibold tracking-widest text-neutral-400 uppercase">
                      {section}
                    </p>
                    {items.map((c) => {
                      const flatIdx = filtered.indexOf(c);
                      const active = flatIdx === activeIdx;
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.id}
                          data-idx={flatIdx}
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                          onClick={() => c.action()}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                            active ? "bg-sky-50 text-sky-900" : "text-neutral-800 hover:bg-neutral-50",
                          )}
                        >
                          <Icon className={cn("h-4 w-4", active ? "text-sky-600" : "text-neutral-400")} strokeWidth={1.8} />
                          <span className="flex-1">{c.label}</span>
                          {c.hint && (
                            <span className="text-[10px] text-neutral-400">{c.hint}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-[10px] text-neutral-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" />
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" />
                  Select
                </span>
              </div>
              <span>
                <kbd className="rounded bg-white px-1 py-px font-mono">⌘K</kbd> to toggle
              </span>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}
