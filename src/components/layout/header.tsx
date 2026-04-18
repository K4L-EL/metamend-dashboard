import { Menu, Search } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { AiChatToggle } from "../ai-chat/chat-panel";
import { NotificationsPopover } from "./notifications-popover";
import { ProfileMenu } from "./profile-menu";
import { useCommandPalette } from "./command-palette";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { openMobile } = useSidebar();
  const { open: openPalette } = useCommandPalette();

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
        <button
          onClick={openPalette}
          className="mr-1 hidden items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-left transition-colors hover:bg-neutral-100 sm:flex"
          title="Command palette"
        >
          <Search className="h-3 w-3 text-neutral-400" strokeWidth={2} />
          <span className="text-[11px] text-neutral-500">Search</span>
          <kbd className="rounded bg-white px-1 py-px text-[9px] text-neutral-500">⌘K</kbd>
        </button>
        <AiChatToggle />
        <NotificationsPopover />
        <div className="ml-1 h-6 w-px bg-neutral-200" />
        <ProfileMenu />
      </div>
    </header>
  );
}
