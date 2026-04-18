import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { User, Mail, Building2, Shield, Clock, LogOut } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../lib/auth-context";

export const Route = createFileRoute("/app/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.displayName ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <Header title="Account" subtitle="Your profile and access information" />
      <div className="space-y-6 p-4 sm:p-6 max-w-3xl">
        {/* Profile */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">
                  {initials}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">{user?.displayName ?? "—"}</h2>
                  <p className="text-sm text-neutral-500">{user?.title ?? "Team member"}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {user?.isAdmin && <Badge variant="metamed">Admin</Badge>}
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate({ to: "/login" });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={User} label="Full Name" value={user?.displayName ?? "—"} />
            <DetailRow icon={Mail} label="Email" value={user?.email ?? "—"} />
            <DetailRow icon={Building2} label="Organisation" value={user?.organization ?? "—"} />
            <DetailRow icon={Shield} label="Role" value={user?.isAdmin ? "Administrator" : (user?.title ?? "Member")} />
            <DetailRow icon={Clock} label="Last Login" value={formatDate(user?.lastLoginAt)} />
            <DetailRow icon={Clock} label="Account Created" value={formatDate(user?.createdAt)} />
          </CardContent>
        </Card>

        {/* Access */}
        <Card>
          <CardHeader>
            <CardTitle>Access Permissions</CardTitle>
            <span className="text-xs text-neutral-400">
              {user?.isAdmin ? "Administrator — full workspace access" : "Standard member — read/write clinical modules"}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: "Dashboard", admin: false },
                { name: "Surveillance", admin: false },
                { name: "Patients", admin: false },
                { name: "Screening", admin: false },
                { name: "Forecasting", admin: false },
                { name: "AMR Tracking", admin: false },
                { name: "Hospital Map", admin: false },
                { name: "Data Pipelines", admin: false },
                { name: "Outbreaks", admin: false },
                { name: "Transmission", admin: false },
                { name: "Alerts", admin: false },
                { name: "Settings", admin: false },
                { name: "Admin Panel", admin: true },
                { name: "User Management", admin: true },
              ].map((perm) => {
                const granted = perm.admin ? Boolean(user?.isAdmin) : true;
                return (
                  <div key={perm.name} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
                    <span className="text-xs text-neutral-700">{perm.name}</span>
                    {granted ? (
                      <Badge variant="success" className="text-[10px]">Granted</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px]">Admin only</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-neutral-400" strokeWidth={1.8} />
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}
