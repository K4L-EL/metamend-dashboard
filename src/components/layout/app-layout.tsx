import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider } from "./sidebar-context";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AppSidebar />
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
