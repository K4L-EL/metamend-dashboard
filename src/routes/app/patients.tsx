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
import { formatDate, statusColor, cn } from "../../lib/utils";
import type { CreatePatientRequest } from "../../types";

export const Route = createFileRoute("/app/patients")({
  component: PatientsPage,
});

const WARDS = ["ICU-A", "ICU-B", "Ward 2A", "Ward 3B", "Ward 4C", "Surgical", "Emergency", "Neonatal"];
const STATUSES = ["Stable", "Monitoring", "Critical"];

const EMPTY_FORM: CreatePatientRequest = {
  name: "", age: 0, gender: "Male", ward: "ICU-A", bedNumber: "", status: "Stable",
};

function RiskIndicator({ score }: { score: number }) {
  const pct = score * 100;
  const color =
    score > 0.75 ? "bg-neutral-900"
    : score > 0.5 ? "bg-neutral-700"
    : score > 0.25 ? "bg-neutral-500"
    : "bg-neutral-400";

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-neutral-200">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-muted">{pct.toFixed(0)}%</span>
    </div>
  );
}

function PatientsPage() {
  const patients = useAsync(() => api.patients.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CreatePatientRequest, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patients.create(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      patients.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Patients" subtitle="Patient infection status and risk profiles" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>All Patients</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-light">{patients.data?.length ?? 0} patients</span>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Patient
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {patients.loading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age / Gender</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Bed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Infections</TableHead>
                    <TableHead>Organisms</TableHead>
                    <TableHead>Admitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.data?.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium text-primary">{patient.name}</TableCell>
                      <TableCell className="text-[12px] text-muted">{patient.age} / {patient.gender}</TableCell>
                      <TableCell>{patient.ward}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted">{patient.bedNumber}</TableCell>
                      <TableCell><Badge variant={statusColor(patient.status)}>{patient.status}</Badge></TableCell>
                      <TableCell><RiskIndicator score={patient.riskScore} /></TableCell>
                      <TableCell className="text-center">
                        {patient.activeInfections > 0 ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-neutral-800 px-1.5 text-[11px] font-semibold text-white">{patient.activeInfections}</span>
                        ) : (
                          <span className="text-[12px] text-muted-light">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {patient.organisms.map((org) => (<Badge key={org} className="text-[10px]">{org}</Badge>))}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-muted">{formatDate(patient.admittedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Patient" subtitle="Register a new patient in the system">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name" required>
            <Input required placeholder="e.g. John Smith" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Age" required>
              <Input type="number" required min={0} max={120} value={form.age || ""} onChange={(e) => set("age", Number(e.target.value))} />
            </FormField>
            <FormField label="Gender" required>
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ward" required>
              <Select value={form.ward} onChange={(e) => set("ward", e.target.value)}>
                {WARDS.map((w) => <option key={w}>{w}</option>)}
              </Select>
            </FormField>
            <FormField label="Bed Number" required>
              <Input required placeholder="e.g. A-14" value={form.bedNumber} onChange={(e) => set("bedNumber", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Patient"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
