import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, AlertTriangle, Shield, Activity, ClipboardCheck, Plus } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select, Textarea } from "../../components/ui/form-field";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, severityColor, cn } from "../../lib/utils";
import type { CreateAlertRequest } from "../../types";

export const Route = createFileRoute("/app/alerts")({
  component: AlertsPage,
});

const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const CATEGORIES = ["Infection", "Outbreak", "Risk", "Compliance"];

const ICON_PROPS = { className: "h-4 w-4", strokeWidth: 1.8 } as const;

function categoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "infection": return <Activity {...ICON_PROPS} />;
    case "outbreak": return <AlertTriangle {...ICON_PROPS} />;
    case "risk": return <Shield {...ICON_PROPS} />;
    case "compliance": return <ClipboardCheck {...ICON_PROPS} />;
    default: return <Bell {...ICON_PROPS} />;
  }
}

const EMPTY_FORM: CreateAlertRequest = {
  title: "", description: "", severity: "Medium", category: "Infection",
};

function AlertsPage() {
  const alerts = useAsync(() => api.alerts.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CreateAlertRequest, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.alerts.create(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      alerts.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Alerts" subtitle="System notifications and warnings" />
      <div className="p-4 sm:p-8">
        <div className="mb-6 flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create Alert
          </Button>
        </div>
        <div className="space-y-3">
          {alerts.loading ? (
            <Loading />
          ) : (
            alerts.data?.map((alert) => (
              <Card
                key={alert.id}
                className={cn("transition-all", !alert.isRead && "border-l-[3px] border-l-neutral-900")}
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="mt-0.5 rounded-lg bg-neutral-100 p-2 text-neutral-600">
                    {categoryIcon(alert.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-medium text-primary">{alert.title}</h3>
                      <Badge variant={severityColor(alert.severity)}>{alert.severity}</Badge>
                      {!alert.isRead && <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">{alert.description}</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="text-[11px] text-muted-light">{formatDateTime(alert.createdAt)}</span>
                      <Badge className="text-[10px]">{alert.category}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Alert" subtitle="Raise a new system alert or notification">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input required placeholder="e.g. New MRSA case in ICU-B" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </FormField>
          <FormField label="Description" required>
            <Textarea required placeholder="Describe the alert..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Severity" required>
              <Select value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Category" required>
              <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create Alert"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
