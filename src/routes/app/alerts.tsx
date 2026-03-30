import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, AlertTriangle, Shield, Activity, ClipboardCheck, Plus,
  Archive, Filter, Check,
} from "lucide-react";
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
import type { Alert, CreateAlertRequest } from "../../types";

export const Route = createFileRoute("/app/alerts")({
  component: AlertsPage,
});

const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const CATEGORIES = ["Infection", "Outbreak", "Risk", "Compliance"];

const CATEGORY_CONFIG: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  infection: { icon: Activity, color: "text-red-500", bg: "bg-red-50" },
  outbreak: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  risk: { icon: Shield, color: "text-neutral-500", bg: "bg-neutral-100" },
  compliance: { icon: ClipboardCheck, color: "text-sky-600", bg: "bg-sky-50" },
};

const EMPTY_FORM: CreateAlertRequest = {
  title: "", description: "", severity: "Medium", category: "Infection",
};

function AlertsPage() {
  const alerts = useAsync(() => api.alerts.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const set = (field: keyof CreateAlertRequest, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.data?.forEach((a) => {
      if (!archivedIds.has(a.id)) {
        const cat = a.category.toLowerCase();
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    });
    return counts;
  }, [alerts.data, archivedIds]);

  const filtered = useMemo(() => {
    let items = alerts.data ?? [];
    items = items.filter((a) =>
      showArchived ? archivedIds.has(a.id) : !archivedIds.has(a.id)
    );
    if (activeSeverity) items = items.filter((a) => a.severity.toLowerCase() === activeSeverity.toLowerCase());
    return items;
  }, [alerts.data, activeSeverity, archivedIds, showArchived]);

  function archiveSelected() {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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
      <div className="space-y-6 p-4 sm:p-6">
        {/* Summary stats (static, non-interactive) */}
        <div className="grid gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const key = cat.toLowerCase();
            const cfg = CATEGORY_CONFIG[key]!;
            const Icon = cfg.icon;
            return (
              <div
                key={cat}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className={cn("rounded-lg p-2", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-neutral-900">{categoryCounts[key] ?? 0}</p>
                  <p className="text-xs font-medium text-neutral-500">{cat}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={activeSeverity ?? ""}
              onChange={(e) => setActiveSeverity(e.target.value || null)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700 outline-none"
            >
              <option value="">All severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
              showArchived
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? "Showing Archived" : "Archived"}
          </button>
          <div className="flex-1" />
          {selectedIds.size > 0 && !showArchived && (
            <Button size="sm" variant="secondary" onClick={archiveSelected}>
              <Archive className="h-3.5 w-3.5" /> Archive {selectedIds.size}
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create Alert
          </Button>
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {alerts.loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-sm text-neutral-500">No alerts found</p>
            </div>
          ) : (
            filtered.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                selected={selectedIds.has(alert.id)}
                onSelect={() => toggleSelect(alert.id)}
                showArchived={showArchived}
              />
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
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create Alert"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AlertRow({
  alert,
  selected,
  onSelect,
  showArchived,
}: {
  alert: Alert;
  selected: boolean;
  onSelect: () => void;
  showArchived: boolean;
}) {
  const cfg = CATEGORY_CONFIG[alert.category.toLowerCase()];
  const Icon = cfg?.icon ?? Bell;

  return (
    <Card className={cn("transition-all", !alert.isRead && !showArchived && "border-l-[3px] border-l-sky-500")}>
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-4">
          {!showArchived && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                selected
                  ? "border-sky-500 bg-sky-500 text-white"
                  : "border-neutral-300 hover:border-neutral-400",
              )}
            >
              {selected && <Check className="h-3 w-3" />}
            </button>
          )}
          <div className={cn("mt-0.5 rounded-lg p-2", cfg?.bg ?? "bg-neutral-100")}>
            <Icon className={cn("h-4 w-4", cfg?.color ?? "text-neutral-600")} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-neutral-900">{alert.title}</h3>
              <Badge variant={severityColor(alert.severity)}>{alert.severity}</Badge>
              <Badge variant="info" className="text-[10px]">{alert.category}</Badge>
              {!alert.isRead && !showArchived && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{alert.description}</p>
            <p className="mt-1.5 text-[10px] text-neutral-400">{formatDateTime(alert.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
