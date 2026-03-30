import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { StatCard } from "../../components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select } from "../../components/ui/form-field";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/table";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDate, statusColor, cn } from "../../lib/utils";
import type { CreateDeviceInfectionRequest } from "../../types";

export const Route = createFileRoute("/app/devices")({
  component: DevicesPage,
});

const DEVICE_TYPES = ["Central Venous Catheter", "Urinary Catheter", "Peripheral IV", "Ventilator", "Surgical Drain"];
const ORGANISMS = ["MRSA", "VRE", "C. difficile", "E. coli", "Klebsiella pneumoniae", "Pseudomonas aeruginosa", "Candida auris"];
const WARDS = ["ICU-A", "ICU-B", "Ward 2A", "Ward 3B", "Ward 4C", "Surgical", "Emergency", "Neonatal"];

const EMPTY_FORM: CreateDeviceInfectionRequest = {
  patientId: "", patientName: "", deviceType: DEVICE_TYPES[0]!, organism: ORGANISMS[0]!, ward: WARDS[0]!, insertionDate: "", infectionDate: "",
};

function DevicesPage() {
  const summaries = useAsync(() => api.devices.getSummaries(), []);
  const infections = useAsync(() => api.devices.getInfections(), []);
  const patients = useAsync(() => api.patients.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CreateDeviceInfectionRequest, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  function handlePatientChange(patientId: string) {
    const patient = patients.data?.find((p) => p.id === patientId);
    setForm((f) => ({
      ...f,
      patientId,
      patientName: patient?.name ?? "",
      ward: patient?.ward ?? f.ward,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.devices.createInfection(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      infections.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Header title="Device Surveillance" subtitle="Infections linked to catheters, lines, and medical devices" />
      <div className="space-y-6 p-4 sm:p-6">
        {summaries.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {summaries.data?.map((d) => (
              <Card key={d.deviceType}>
                <CardContent className="p-5">
                  <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">{d.deviceType}</p>
                  <p className={cn("mt-1 text-2xl font-semibold leading-tight tracking-tight", d.infectionRate > 0.15 ? "text-neutral-900" : d.infectionRate > 0.05 ? "text-neutral-600" : "text-neutral-400")}>
                    {(d.infectionRate * 100).toFixed(1)}%
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">infection rate</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-200 pt-3">
                    <div>
                      <p className="text-[10px] text-neutral-400">Devices</p>
                      <p className="text-sm font-semibold text-neutral-900">{d.totalDevices}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">Infections</p>
                      <p className="text-sm font-semibold text-neutral-900">{d.infections}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-neutral-500">Avg {d.avgDaysToInfection.toFixed(1)} days to infection</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Device-Associated Infections</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">{infections.data?.length ?? 0} records</span>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Log Device Infection
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
                    <TableHead>Device</TableHead>
                    <TableHead>Organism</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Days to Infection</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {infections.data?.map((inf) => (
                    <TableRow key={inf.id}>
                      <TableCell className="font-medium text-neutral-900">{inf.patientName}</TableCell>
                      <TableCell className="text-xs text-neutral-600">{inf.deviceType}</TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600">{inf.organism}</TableCell>
                      <TableCell className="text-xs text-neutral-600">{inf.ward}</TableCell>
                      <TableCell>
                        <span className={cn("font-mono text-xs", inf.daysToInfection > 7 ? "text-neutral-900 font-semibold" : "text-neutral-500")}>
                          {inf.daysToInfection}d
                        </span>
                      </TableCell>
                      <TableCell><Badge variant={statusColor(inf.status)}>{inf.status}</Badge></TableCell>
                      <TableCell className="text-xs text-neutral-500">
                        <span>Ins: {formatDate(inf.insertionDate)}</span>
                        <br />
                        <span>Inf: {formatDate(inf.infectionDate)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log Device Infection" subtitle="Record an infection associated with a medical device">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Patient" required>
            <Select required value={form.patientId} onChange={(e) => handlePatientChange(e.target.value)}>
              <option value="">Select patient...</option>
              {patients.data?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.ward})</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Device Type" required>
              <Select value={form.deviceType} onChange={(e) => set("deviceType", e.target.value)}>
                {DEVICE_TYPES.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="Organism" required>
              <Select value={form.organism} onChange={(e) => set("organism", e.target.value)}>
                {ORGANISMS.map((o) => <option key={o}>{o}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Ward" required>
            <Select value={form.ward} onChange={(e) => set("ward", e.target.value)}>
              {WARDS.map((w) => <option key={w}>{w}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Insertion Date" required>
              <Input type="date" required value={form.insertionDate} onChange={(e) => set("insertionDate", e.target.value)} />
            </FormField>
            <FormField label="Infection Date" required>
              <Input type="date" required value={form.infectionDate} onChange={(e) => set("infectionDate", e.target.value)} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Log Infection"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
