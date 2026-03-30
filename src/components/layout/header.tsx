import { Bell, Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { openMobile } = useSidebar();

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openMobile}
          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 md:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && (
            <>
              <div className="hidden h-4 w-px bg-neutral-200 sm:block" />
              <p className="hidden text-xs text-neutral-500 sm:block">{subtitle}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
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
            <p className="text-xs font-medium leading-tight text-neutral-900">Dr. K. Mohamed</p>
            <p className="text-[10px] text-neutral-500">IPC Lead</p>
          </div>
        </button>
      </div>
    </header>
  );
}
