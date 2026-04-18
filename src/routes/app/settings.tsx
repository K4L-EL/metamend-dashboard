import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Palette, Plug, Shield, Globe, Check, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useSettings, type AppSettings } from "../../lib/settings-store";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

interface ToggleItem {
  key: keyof AppSettings;
  label: string;
  description?: string;
  kind: "toggle";
}

interface SelectItem {
  key: keyof AppSettings;
  label: string;
  description?: string;
  kind: "select";
  options: string[];
}

type Item = ToggleItem | SelectItem;

interface Section {
  icon: LucideIcon;
  title: string;
  description: string;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alert delivery, email and push notification preferences",
    items: [
      { key: "notifEmailCritical", label: "Email alerts for critical infections", kind: "toggle" },
      { key: "notifPushOutbreak", label: "Push notifications for outbreak detection", kind: "toggle" },
      { key: "notifDailyDigest", label: "Daily summary digest", kind: "toggle" },
      { key: "notifScreeningOverdue", label: "Screening overdue reminders", kind: "toggle" },
    ],
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the dashboard visual preferences",
    items: [
      { key: "apearDarkMap", label: "Default to dark mode on Hospital Map", kind: "toggle" },
      { key: "apearCompactRows", label: "Compact table rows", kind: "toggle" },
      { key: "apearShowRiskPct", label: "Show risk score percentages", kind: "toggle" },
    ],
  },
  {
    icon: Plug,
    title: "Integrations",
    description: "Connect external systems and data sources",
    items: [
      { key: "intEhr", label: "EHR System (HL7 FHIR)", kind: "toggle" },
      { key: "intLis", label: "Lab Information System", kind: "toggle" },
      { key: "intPharmacy", label: "Pharmacy System", kind: "toggle" },
      { key: "intEnvMonitoring", label: "Environmental Monitoring", kind: "toggle" },
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Manage data access and security settings",
    items: [
      { key: "privacyTwoFactor", label: "Two-factor authentication", kind: "toggle" },
      { key: "privacyAutoLock", label: "Auto-lock after 15 minutes of inactivity", kind: "toggle" },
      { key: "privacyAuditLogging", label: "Audit logging", kind: "toggle" },
    ],
  },
  {
    icon: Globe,
    title: "Regional",
    description: "Date format, timezone, and language preferences",
    items: [
      {
        key: "regionDateFormat",
        label: "Date format",
        kind: "select",
        options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      },
      {
        key: "regionTimezone",
        label: "Timezone",
        kind: "select",
        options: ["GMT", "BST", "CET", "EST", "PST", "UTC"],
      },
      {
        key: "regionLanguage",
        label: "Language",
        kind: "select",
        options: ["English (UK)", "English (US)", "Français", "Deutsch"],
      },
    ],
  },
];

function SettingsPage() {
  const { settings, update, reset } = useSettings();
  const [savedHint, setSavedHint] = useState(false);

  function onChange<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    update(key, value);
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 1500);
  }

  return (
    <div>
      <Header title="Settings" subtitle="Platform configuration and preferences" />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            Changes are saved automatically in your browser.
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium text-emerald-600 transition-opacity",
                savedHint ? "opacity-100" : "opacity-0",
              )}
            >
              <Check className="h-3 w-3" /> Saved
            </span>
            <button
              onClick={() => {
                if (confirm("Reset all settings to defaults?")) reset();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900"
            >
              <RotateCcw className="h-3 w-3" /> Reset to defaults
            </button>
          </div>
        </div>

        {SECTIONS.map(({ icon: Icon, title, description, items }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-50 p-2">
                  <Icon className="h-4 w-4 text-sky-600" strokeWidth={1.8} />
                </div>
                <div>
                  <CardTitle>{title}</CardTitle>
                  <p className="text-xs text-neutral-500">{description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const value = settings[item.key];
                if (item.kind === "toggle") {
                  const enabled = Boolean(value);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3"
                    >
                      <span className="text-sm text-neutral-700">{item.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => onChange(item.key, !enabled as AppSettings[typeof item.key])}
                        className={cn(
                          "relative h-5 w-9 rounded-full transition-colors",
                          enabled ? "bg-sky-500" : "bg-neutral-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0 h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                            enabled ? "translate-x-4" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3"
                  >
                    <span className="text-sm text-neutral-700">{item.label}</span>
                    <select
                      value={String(value)}
                      onChange={(e) =>
                        onChange(item.key, e.target.value as AppSettings[typeof item.key])
                      }
                      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 outline-none focus:border-sky-400"
                    >
                      {item.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
