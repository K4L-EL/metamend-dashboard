import { useEffect, type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { AiChatDrawer } from "../ai-chat/chat-panel";
import { ChatProvider } from "../ai-chat/chat-context";
import { CommandPaletteProvider } from "./command-palette";
import { useSettings } from "../../lib/settings-store";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const { mobileOpen, closeMobile } = useSidebar();
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.classList.toggle("metamed-compact", settings.apearCompactRows);
  }, [settings.apearCompactRows]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={closeMobile} />
          <div className="relative z-50">
            <AppSidebar mobile />
          </div>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", overflowY: "auto" }}>
        {children}
      </main>

      <AiChatDrawer />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <ChatProvider>
          <LayoutInner>{children}</LayoutInner>
        </ChatProvider>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
