import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select } from "../../components/ui/form-field";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, severityColor, statusColor } from "../../lib/utils";
import type { CreateInfectionRequest } from "../../types";

export const Route = createFileRoute("/app/surveillance")({
  component: SurveillancePage,
});

const WARDS = ["ICU-A", "ICU-B", "Ward 2A", "Ward 3B", "Ward 4C", "Surgical", "Emergency", "Neonatal"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const TYPES = ["Bloodstream", "Urinary tract", "Respiratory", "Gastrointestinal", "Wound", "Skin/Soft tissue"];
const ORGANISMS = ["MRSA", "VRE", "C. difficile", "E. coli", "Klebsiella pneumoniae", "Pseudomonas aeruginosa", "Candida auris"];

const EMPTY_FORM: CreateInfectionRequest = {
  patientId: "", organism: ORGANISMS[0]!, type: TYPES[0]!, location: "", ward: WARDS[0]!, severity: "Medium", isHai: true,
};

function SurveillancePage() {
  const infections = useAsync(() => api.infections.getAll(), []);
  const patients = useAsync(() => api.patients.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CreateInfectionRequest, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.infections.create(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      infections.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Surveillance" subtitle="Real-time infection monitoring and tracking" />
      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total Active" value={infections.data?.filter((i) => i.status === "Active").length ?? 0} accent="bg-neutral-900" />
          <MetricCard label="HAI Cases" value={infections.data?.filter((i) => i.isHai).length ?? 0} accent="bg-neutral-600" />
          <MetricCard label="Under Monitoring" value={infections.data?.filter((i) => i.status === "Monitoring").length ?? 0} accent="bg-neutral-400" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Infections</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-light">{infections.data?.length ?? 0} records</span>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Log Infection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {infections.loading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Organism</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>HAI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {infections.data?.map((infection) => (
                    <TableRow key={infection.id}>
                      <TableCell className="font-medium text-primary">{infection.patientName}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted">{infection.organism}</TableCell>
                      <TableCell>{infection.type}</TableCell>
                      <TableCell>{infection.ward}</TableCell>
                      <TableCell><Badge variant={severityColor(infection.severity)}>{infection.severity}</Badge></TableCell>
                      <TableCell><Badge variant={statusColor(infection.status)}>{infection.status}</Badge></TableCell>
                      <TableCell className="text-[12px] text-muted">{formatDateTime(infection.detectedAt)}</TableCell>
                      <TableCell>{infection.isHai && <span className="inline-block h-2 w-2 rounded-full bg-danger" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log Infection" subtitle="Report a new infection detection">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Patient" required>
            <Select required value={form.patientId} onChange={(e) => set("patientId", e.target.value)}>
              <option value="">Select patient...</option>
              {patients.data?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.ward})</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Organism" required>
              <Select value={form.organism} onChange={(e) => set("organism", e.target.value)}>
                {ORGANISMS.map((o) => <option key={o}>{o}</option>)}
              </Select>
            </FormField>
            <FormField label="Infection Type" required>
              <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Location / Source">
              <Input placeholder="e.g. Central line" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </FormField>
            <FormField label="Ward" required>
              <Select value={form.ward} onChange={(e) => set("ward", e.target.value)}>
                {WARDS.map((w) => <option key={w}>{w}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Severity" required>
              <Select value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Healthcare-Associated">
              <label className="mt-1 flex items-center gap-2 text-[13px] text-secondary">
                <input type="checkbox" checked={form.isHai} onChange={(e) => set("isHai", e.target.checked)} className="h-4 w-4 rounded border-border text-accent" />
                HAI
              </label>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Log Infection"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2.5">
        <div className={`h-2 w-2 rounded-full ${accent}`} />
        <p className="text-[11px] font-medium tracking-wide text-muted-light uppercase">{label}</p>
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-primary">{value}</p>
    </div>
  );
}
