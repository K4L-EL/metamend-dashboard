import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "../../components/layout/app-layout";
import { authService } from "../../services/auth-service";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
