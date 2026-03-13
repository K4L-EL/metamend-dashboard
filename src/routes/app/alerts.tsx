import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, AlertTriangle, Shield, Activity, ClipboardCheck, Plus,
  Archive, ChevronDown, ChevronUp, Filter, Check,
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
  risk: { icon: Shield, color: "text-amber-500", bg: "bg-amber-50" },
  compliance: { icon: ClipboardCheck, color: "text-teal-600", bg: "bg-teal-50" },
};

const EMPTY_FORM: CreateAlertRequest = {
  title: "", description: "", severity: "Medium", category: "Infection",
};

function AlertsPage() {
  const alerts = useAsync(() => api.alerts.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    if (activeCategory) items = items.filter((a) => a.category.toLowerCase() === activeCategory);
    if (activeSeverity) items = items.filter((a) => a.severity.toLowerCase() === activeSeverity.toLowerCase());
    return items;
  }, [alerts.data, activeCategory, activeSeverity, archivedIds, showArchived]);

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
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        {/* Category tiles */}
        <div className="grid gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const key = cat.toLowerCase();
            const cfg = CATEGORY_CONFIG[key]!;
            const Icon = cfg.icon;
            const isActive = activeCategory === key;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-teal-300 bg-teal-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm",
                )}
              >
                <div className={cn("rounded-lg p-2", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[22px] font-semibold text-neutral-900">{categoryCounts[key] ?? 0}</p>
                  <p className="text-[11px] font-medium text-neutral-500">{cat}</p>
                </div>
              </button>
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
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-700 outline-none"
            >
              <option value="">All severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] transition-colors",
              showArchived
                ? "border-teal-300 bg-teal-50 text-teal-700"
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
              <p className="mt-2 text-[13px] text-neutral-500">No alerts found</p>
            </div>
          ) : (
            filtered.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                selected={selectedIds.has(alert.id)}
                expanded={expandedId === alert.id}
                onSelect={() => toggleSelect(alert.id)}
                onExpand={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
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
  expanded,
  onSelect,
  onExpand,
  showArchived,
}: {
  alert: Alert;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  showArchived: boolean;
}) {
  const cfg = CATEGORY_CONFIG[alert.category.toLowerCase()];
  const Icon = cfg?.icon ?? Bell;

  return (
    <Card className={cn("transition-all", !alert.isRead && !showArchived && "border-l-[3px] border-l-teal-500")}>
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-4">
          {!showArchived && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                selected
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-neutral-300 hover:border-neutral-400",
              )}
            >
              {selected && <Check className="h-3 w-3" />}
            </button>
          )}
          <div className={cn("mt-0.5 rounded-lg p-2", cfg?.bg ?? "bg-neutral-100")}>
            <Icon className={cn("h-4 w-4", cfg?.color ?? "text-neutral-600")} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onExpand}>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-medium text-neutral-900">{alert.title}</h3>
              <Badge variant={severityColor(alert.severity)}>{alert.severity}</Badge>
              {!alert.isRead && !showArchived && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{alert.description}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[11px] text-neutral-400">{formatDateTime(alert.createdAt)}</span>
              <Badge variant="info" className="text-[10px]">{alert.category}</Badge>
            </div>
          </div>
          <button onClick={onExpand} className="mt-1 text-neutral-400 hover:text-neutral-600">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {expanded && (
          <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Detail label="Category" value={alert.category} />
              <Detail label="Severity" value={alert.severity} />
              <Detail label="Time" value={formatDateTime(alert.createdAt)} />
            </div>
            {alert.relatedEntityType && (
              <p className="mt-3 text-[12px] text-neutral-500">
                Related: <span className="font-medium text-teal-700">{alert.relatedEntityType}</span>
                {alert.relatedEntityId && ` (${alert.relatedEntityId})`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">{label}</p>
      <p className="mt-0.5 text-[13px] text-neutral-700">{value}</p>
    </div>
  );
}
