import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Building2, Shield, Clock, Key } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/app/account")({
  component: AccountPage,
});

function AccountPage() {
  return (
    <div>
      <Header title="Account" subtitle="Your profile and access information" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8 max-w-3xl">
        {/* Profile */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-bold text-sky-700">
                KM
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-neutral-900">Dr. Khalil Mohamed</h2>
                <p className="text-[13px] text-neutral-500">Infection Prevention & Control Lead</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="metamed">Admin</Badge>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={User} label="Full Name" value="Dr. Khalil Mohamed" />
            <DetailRow icon={Mail} label="Email" value="k.mohamed@metamed.io" />
            <DetailRow icon={Building2} label="Organisation" value="Royal London Hospital" />
            <DetailRow icon={Shield} label="Role" value="IPC Lead — Administrator" />
            <DetailRow icon={Clock} label="Last Login" value="21 Feb 2026, 09:14" />
            <DetailRow icon={Key} label="API Key" value="mm_live_••••••••3f8a" />
          </CardContent>
        </Card>

        {/* Access */}
        <Card>
          <CardHeader>
            <CardTitle>Access Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Dashboard", "Surveillance", "Patients", "Screening",
                "Forecasting", "AMR Tracking", "Hospital Map", "Data Pipelines",
                "Outbreaks", "Transmission", "Alerts", "Settings",
              ].map((perm) => (
                <div key={perm} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
                  <span className="text-[12px] text-neutral-700">{perm}</span>
                  <Badge variant="success" className="text-[10px]">Granted</Badge>
                </div>
              ))}
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
        <span className="text-[12px] text-neutral-500">{label}</span>
      </div>
      <span className="text-[13px] font-medium text-neutral-900">{value}</span>
    </div>
  );
}
