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

function statusBadgeVariant(status: string): string {
  switch (status.toLowerCase()) {
    case "completed": return "success";
    case "overdue": return "critical";
    case "pending": return "default";
    default: return "default";
  }
}

function resultBadgeVariant(result: string | null): string | null {
  if (!result) return null;
  return result === "Positive" ? "critical" : "default";
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
      <div className="space-y-6 p-4 sm:p-6">
        {compliance.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {compliance.data?.map((ward) => (
              <Card key={ward.ward}>
                <CardContent className="p-5">
                  <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">{ward.ward}</p>
                  <p className={cn("mt-1 text-2xl font-semibold leading-tight tracking-tight", complianceShade(ward.complianceRate))}>
                    {(ward.complianceRate * 100).toFixed(0)}%
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={cn("h-full rounded-full transition-all", barShade(ward.complianceRate))}
                      style={{ width: `${ward.complianceRate * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
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
              <span className="text-xs text-neutral-400">{records.data?.length ?? 0} records</span>
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
                    <TableHead>Dates</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.data?.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium text-neutral-900">{rec.patientName}</TableCell>
                      <TableCell className="text-xs text-neutral-600">{rec.ward}</TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600">{rec.screeningType}</TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(rec.status)}>{rec.status}</Badge></TableCell>
                      <TableCell className="text-xs text-neutral-500">
                        <span>Due: {formatDate(rec.dueDate)}</span>
                        {rec.completedDate && (
                          <>
                            <br />
                            <span>Done: {formatDate(rec.completedDate)}</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {rec.result ? (
                          <Badge variant={resultBadgeVariant(rec.result)!}>{rec.result}</Badge>
                        ) : (
                          <span className="text-xs text-neutral-400">--</span>
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
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Screening"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
