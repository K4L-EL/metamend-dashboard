import { createFileRoute } from "@tanstack/react-router";
import { Settings, Bell, Palette, Plug, Shield, Globe } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

const SECTIONS = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alert delivery, email and push notification preferences",
    items: [
      { label: "Email alerts for critical infections", enabled: true },
      { label: "Push notifications for outbreak detection", enabled: true },
      { label: "Daily summary digest", enabled: false },
      { label: "Screening overdue reminders", enabled: true },
    ],
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the dashboard visual preferences",
    items: [
      { label: "Default to dark mode on Hospital Map", enabled: true },
      { label: "Compact table rows", enabled: false },
      { label: "Show risk score percentages", enabled: true },
    ],
  },
  {
    icon: Plug,
    title: "Integrations",
    description: "Connect external systems and data sources",
    items: [
      { label: "EHR System (HL7 FHIR)", enabled: true },
      { label: "Lab Information System", enabled: true },
      { label: "Pharmacy System", enabled: false },
      { label: "Environmental Monitoring", enabled: false },
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Manage data access and security settings",
    items: [
      { label: "Two-factor authentication", enabled: true },
      { label: "Auto-lock after 15 minutes", enabled: true },
      { label: "Audit logging", enabled: true },
    ],
  },
  {
    icon: Globe,
    title: "Regional",
    description: "Date format, timezone, and language preferences",
    items: [
      { label: "Date format: DD/MM/YYYY", enabled: true },
      { label: "Timezone: GMT", enabled: true },
      { label: "Language: English (UK)", enabled: true },
    ],
  },
];

function SettingsPage() {
  return (
    <div>
      <Header title="Settings" subtitle="Platform configuration and preferences" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        {SECTIONS.map(({ icon: Icon, title, description, items }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-50 p-2">
                  <Icon className="h-4 w-4 text-sky-600" strokeWidth={1.8} />
                </div>
                <div>
                  <CardTitle>{title}</CardTitle>
                  <p className="text-[11px] text-neutral-500">{description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                  <span className="text-[13px] text-neutral-700">{item.label}</span>
                  <div className={`h-5 w-9 rounded-full transition-colors ${item.enabled ? "bg-sky-500" : "bg-neutral-300"}`}>
                    <div
                      className={`h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${item.enabled ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
