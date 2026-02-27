import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select } from "../../components/ui/form-field";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/table";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDate, cn } from "../../lib/utils";
import type { CreateScreeningRecordRequest } from "../../types";

export const Route = createFileRoute("/app/screening")({
  component: ScreeningPage,
});

const SCREENING_TYPES = ["MRSA", "VRE", "CPE", "C. difficile", "Candida auris"];

const EMPTY_FORM: CreateScreeningRecordRequest = {
  patientId: "", patientName: "", ward: "", screeningType: SCREENING_TYPES[0]!, dueDate: "",
};

function complianceShade(rate: number): string {
  if (rate >= 0.95) return "text-neutral-900";
  if (rate >= 0.85) return "text-neutral-600";
  return "text-neutral-400";
}

function barShade(rate: number): string {
  if (rate >= 0.95) return "bg-neutral-900";
  if (rate >= 0.85) return "bg-neutral-600";
  return "bg-neutral-400";
}

function statusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case "completed": return "bg-neutral-900 text-white";
    case "overdue": return "bg-neutral-700 text-white";
    case "pending": return "bg-neutral-200 text-neutral-700";
    default: return "bg-neutral-100 text-neutral-600";
  }
}

function resultBadge(result: string | null): string | null {
  if (!result) return null;
  return result === "Positive"
    ? "bg-neutral-900 text-white"
    : "bg-neutral-300 text-neutral-800";
}

function ScreeningPage() {
  const compliance = useAsync(() => api.screening.getCompliance(), []);
  const records = useAsync(() => api.screening.getRecords(), []);
  const patients = useAsync(() => api.patients.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CreateScreeningRecordRequest, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  function handlePatientChange(patientId: string) {
    const patient = patients.data?.find((p) => p.id === patientId);
    setForm((f) => ({
      ...f,
      patientId,
      patientName: patient?.name ?? "",
      ward: patient?.ward ?? "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.screening.createRecord(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      records.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Screening Compliance" subtitle="Admission screening and compliance tracking" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        {compliance.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {compliance.data?.map((ward) => (
              <Card key={ward.ward}>
                <CardContent className="p-5">
                  <p className="text-[11px] font-medium tracking-wide text-muted-light uppercase">{ward.ward}</p>
                  <p className={cn("mt-1 text-[28px] font-semibold leading-tight tracking-tight", complianceShade(ward.complianceRate))}>
                    {(ward.complianceRate * 100).toFixed(0)}%
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={cn("h-full rounded-full transition-all", barShade(ward.complianceRate))}
                      style={{ width: `${ward.complianceRate * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                    <span>{ward.completed}/{ward.totalRequired} done</span>
                    {ward.overdue > 0 && <span className="font-medium text-neutral-900">{ward.overdue} overdue</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Screening Records</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-light">{records.data?.length ?? 0} records</span>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Screening
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {records.loading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.data?.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium text-primary">{rec.patientName}</TableCell>
                      <TableCell>{rec.ward}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted">{rec.screeningType}</TableCell>
                      <TableCell><Badge variant={statusBadge(rec.status)}>{rec.status}</Badge></TableCell>
                      <TableCell className="text-[12px] text-muted">{formatDate(rec.dueDate)}</TableCell>
                      <TableCell className="text-[12px] text-muted">
                        {rec.completedDate ? formatDate(rec.completedDate) : <span className="text-muted-light">--</span>}
                      </TableCell>
                      <TableCell>
                        {rec.result ? (
                          <Badge variant={resultBadge(rec.result)!}>{rec.result}</Badge>
                        ) : (
                          <span className="text-[12px] text-muted-light">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Screening Record" subtitle="Schedule a new screening for a patient">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Patient" required>
            <Select required value={form.patientId} onChange={(e) => handlePatientChange(e.target.value)}>
              <option value="">Select patient...</option>
              {patients.data?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.ward})</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Screening Type" required>
              <Select value={form.screeningType} onChange={(e) => set("screeningType", e.target.value)}>
                {SCREENING_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Due Date" required>
              <Input type="date" required value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Screening"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
