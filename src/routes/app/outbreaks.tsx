import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, Search, Plus } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select } from "../../components/ui/form-field";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDate, severityColor, statusColor, cn } from "../../lib/utils";
import type { CreateOutbreakRequest } from "../../types";

export const Route = createFileRoute("/app/outbreaks")({
  component: OutbreaksPage,
});

const ORGANISMS = ["MRSA", "VRE", "C. difficile", "E. coli", "Klebsiella pneumoniae", "Pseudomonas aeruginosa", "Candida auris"];
const LOCATIONS = ["ICU-A", "ICU-B", "Ward 2A", "Ward 3B", "Ward 4C", "Surgical", "Emergency", "Neonatal", "ICU Complex"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];

const EMPTY_FORM: CreateOutbreakRequest = {
  organism: ORGANISMS[0]!, location: LOCATIONS[0]!, severity: "Medium", affectedPatients: 1,
};

function statusIcon(status: string) {
  const props = { strokeWidth: 1.8 } as const;
  switch (status.toLowerCase()) {
    case "active": return <AlertTriangle {...props} className="h-4 w-4 text-neutral-900" />;
    case "suspected": return <Search {...props} className="h-4 w-4 text-neutral-500" />;
    case "resolved": return <CheckCircle2 {...props} className="h-4 w-4 text-neutral-400" />;
    default: return <Clock {...props} className="h-4 w-4 text-neutral-300" />;
  }
}

function OutbreaksPage() {
  const outbreaks = useAsync(() => api.outbreaks.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CreateOutbreakRequest, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.outbreaks.create(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      outbreaks.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Outbreaks" subtitle="Outbreak detection and investigation tracking" />
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Active" value={outbreaks.data?.filter((o) => o.status === "Active").length ?? 0} shade="bg-neutral-900" />
            <MetricCard label="Under Investigation" value={outbreaks.data?.filter((o) => o.status === "Suspected").length ?? 0} shade="bg-neutral-600" />
            <MetricCard label="Resolved (30d)" value={outbreaks.data?.filter((o) => o.status === "Resolved").length ?? 0} shade="bg-neutral-400" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Report Outbreak
          </Button>
        </div>

        {outbreaks.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {outbreaks.data?.map((outbreak) => (
              <Card key={outbreak.id}>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    {statusIcon(outbreak.status)}
                    <CardTitle>{outbreak.organism}</CardTitle>
                  </div>
                  <Badge variant={statusColor(outbreak.status)}>{outbreak.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Detail label="Location" value={outbreak.location} />
                    <Detail label="Affected Patients" value={String(outbreak.affectedPatients)} />
                    <Detail label="Detected" value={formatDate(outbreak.detectedAt)} />
                    <Detail label="Investigation" value={outbreak.investigationStatus} />
                  </div>
                  <div className="border-t border-border pt-3">
                    <Badge variant={severityColor(outbreak.severity)}>{outbreak.severity} severity</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Report Outbreak" subtitle="Log a suspected or confirmed outbreak">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Organism" required>
              <Select value={form.organism} onChange={(e) => set("organism", e.target.value)}>
                {ORGANISMS.map((o) => <option key={o}>{o}</option>)}
              </Select>
            </FormField>
            <FormField label="Location" required>
              <Select value={form.location} onChange={(e) => set("location", e.target.value)}>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Severity" required>
              <Select value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Affected Patients" required>
              <Input type="number" required min={1} value={form.affectedPatients} onChange={(e) => set("affectedPatients", Number(e.target.value))} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Report Outbreak"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, shade }: { label: string; value: number; shade: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2.5">
        <div className={cn("h-2 w-2 rounded-full", shade)} />
        <p className="text-[11px] font-medium tracking-wide text-muted-light uppercase">{label}</p>
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-primary">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-muted-light uppercase">{label}</p>
      <p className="mt-0.5 text-[13px] text-secondary">{value}</p>
    </div>
  );
}
