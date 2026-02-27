import { Bell, ChevronRight, Search } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function useBreadcrumbs() {
  const routerState = useRouterState();
  const path = routerState.location.pathname;
  const segments = path.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    isLast: i === segments.length - 1,
  }));
}

export function Header({ title, subtitle }: HeaderProps) {
  const crumbs = useBreadcrumbs();

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-neutral-200 bg-white px-8 shadow-sm">
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center gap-1">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-neutral-300" strokeWidth={2} />}
              <span className={crumb.isLast ? "text-[10px] font-medium text-neutral-600" : "text-[10px] text-neutral-400"}>
                {crumb.label}
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[14px] font-semibold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && (
            <>
              <div className="h-4 w-px bg-neutral-200" />
              <p className="text-[11px] text-neutral-500">{subtitle}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
          <Search className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button className="relative rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-800 px-1 text-[8px] font-bold text-white">
            3
          </span>
        </button>
        <div className="ml-1 h-6 w-px bg-neutral-200" />
        <button className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-white">
            KM
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-[11px] font-medium leading-tight text-neutral-900">Dr. K. Mohamed</p>
            <p className="text-[9px] text-neutral-500">IPC Lead</p>
          </div>
        </button>
      </div>
    </header>
  );
}
