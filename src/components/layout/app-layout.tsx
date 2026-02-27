import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const { mobileOpen, closeMobile } = useSidebar();

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
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
