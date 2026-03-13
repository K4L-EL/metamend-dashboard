import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Plus, X, MapPin, Activity, Pill, ShieldAlert, Unplug,
  User, ClipboardCheck, ChevronRight,
} from "lucide-react";
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
import type { Patient, CreatePatientRequest } from "../../types";

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
    score > 0.75 ? "bg-red-500"
    : score > 0.5 ? "bg-amber-500"
    : score > 0.25 ? "bg-teal-500"
    : "bg-neutral-400";

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-neutral-200">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-neutral-500">{pct.toFixed(0)}%</span>
    </div>
  );
}

const DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "infections", label: "Infections", icon: Activity },
  { id: "screenings", label: "Screenings", icon: ClipboardCheck },
  { id: "prescribing", label: "Prescribing", icon: Pill },
  { id: "devices", label: "Devices", icon: Unplug },
] as const;

type TabId = (typeof DETAIL_TABS)[number]["id"];

const MOCK_COMPLAINTS = [
  "Pneumonia with respiratory failure",
  "Post-operative recovery — abdominal surgery",
  "Acute renal failure requiring dialysis",
  "Sepsis of unknown origin",
  "CHF exacerbation with fluid overload",
  "Trauma — MVA with multiple fractures",
  "Diabetic ketoacidosis",
  "COPD acute exacerbation",
];

const MOCK_MEDS = [
  { name: "Vancomycin", dose: "1g IV q12h", days: 5, type: "Antibiotic" },
  { name: "Meropenem", dose: "1g IV q8h", days: 3, type: "Antibiotic" },
  { name: "Metformin", dose: "500mg PO bid", days: 30, type: "Regular" },
  { name: "Enoxaparin", dose: "40mg SC daily", days: 7, type: "Prophylaxis" },
  { name: "Fluconazole", dose: "400mg IV daily", days: 4, type: "Antifungal" },
];

const MOCK_DEVICES = [
  { type: "Central Venous Catheter", site: "Right subclavian", inserted: "2026-02-10", status: "Active" },
  { type: "Urinary Catheter", site: "Indwelling", inserted: "2026-02-08", status: "Active" },
  { type: "Peripheral IV", site: "Left hand", inserted: "2026-02-15", status: "Removed" },
];

function PatientsPage() {
  const navigate = useNavigate();
  const patients = useAsync(() => api.patients.getAll(), []);
  const infections = useAsync(() => api.infections.getAll(), []);
  const screenings = useAsync(() => api.screening.getRecords(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

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

  const patientInfections = infections.data?.filter(
    (i) => i.patientId === selectedPatient?.id
  ) ?? [];

  const patientScreenings = screenings.data?.filter(
    (s) => s.patientId === selectedPatient?.id
  ) ?? [];

  return (
    <div>
      <Header title="Patients" subtitle="Patient infection status and risk profiles" />
      <div className="flex h-[calc(100vh-56px)]">
        {/* Patient list */}
        <div className={cn("flex-1 overflow-y-auto p-4 sm:p-8 transition-all", selectedPatient && "max-w-[55%]")}>
          <Card>
            <CardHeader>
              <CardTitle>All Patients</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-400">{patients.data?.length ?? 0} patients</span>
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
                      <TableHead>Ward</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Infections</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.data?.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedPatient?.id === patient.id && "bg-teal-50/50",
                        )}
                        onClick={() => { setSelectedPatient(patient); setActiveTab("overview"); }}
                      >
                        <TableCell className="font-medium text-neutral-900">{patient.name}</TableCell>
                        <TableCell>{patient.ward}</TableCell>
                        <TableCell className="font-mono text-[11px] text-neutral-500">{patient.bedNumber}</TableCell>
                        <TableCell><Badge variant={statusColor(patient.status)}>{patient.status}</Badge></TableCell>
                        <TableCell><RiskIndicator score={patient.riskScore} /></TableCell>
                        <TableCell className="text-center">
                          {patient.activeInfections > 0 ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-red-500 px-1.5 text-[11px] font-semibold text-white">{patient.activeInfections}</span>
                          ) : (
                            <span className="text-[12px] text-neutral-400">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-neutral-300" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail panel */}
        {selectedPatient && (
          <div className="w-[45%] shrink-0 overflow-y-auto border-l border-neutral-200 bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
              <div>
                <h2 className="text-[15px] font-semibold text-neutral-900">{selectedPatient.name}</h2>
                <p className="text-[12px] text-neutral-500">
                  {selectedPatient.age}y · {selectedPatient.gender} · {selectedPatient.ward} / {selectedPatient.bedNumber}
                </p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="rounded-md p-1 text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200">
              {DETAIL_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium transition-colors",
                    activeTab === id
                      ? "border-b-2 border-teal-500 text-teal-700"
                      : "text-neutral-500 hover:text-neutral-700",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {activeTab === "overview" && (
                <>
                  <DetailSection title="Admission Snapshot">
                    <p className="text-[13px] text-neutral-700">
                      {MOCK_COMPLAINTS[Math.abs(selectedPatient.name.charCodeAt(0)) % MOCK_COMPLAINTS.length]}
                    </p>
                  </DetailSection>
                  <DetailSection title="Location">
                    <button
                      onClick={() => navigate({ to: "/app/hospital-map", search: { ward: selectedPatient.ward } })}
                      className="flex items-center gap-2 text-[13px] text-teal-700 hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedPatient.ward} — Bed {selectedPatient.bedNumber}
                    </button>
                  </DetailSection>
                  <DetailSection title="Risk Score">
                    <div className="flex items-center gap-3">
                      <RiskIndicator score={selectedPatient.riskScore} />
                      <Badge variant={selectedPatient.riskScore > 0.5 ? "high" : "low"}>
                        {selectedPatient.riskScore > 0.75 ? "Critical" : selectedPatient.riskScore > 0.5 ? "Elevated" : "Normal"}
                      </Badge>
                    </div>
                  </DetailSection>
                  <DetailSection title="Status">
                    <Badge variant={statusColor(selectedPatient.status)}>{selectedPatient.status}</Badge>
                  </DetailSection>
                  <DetailSection title="Active Organisms">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.organisms.length > 0
                        ? selectedPatient.organisms.map((o) => <Badge key={o} variant="critical">{o}</Badge>)
                        : <span className="text-[12px] text-neutral-400">None detected</span>
                      }
                    </div>
                  </DetailSection>
                </>
              )}

              {activeTab === "infections" && (
                patientInfections.length === 0
                  ? <EmptyTab message="No infection records for this patient" />
                  : patientInfections.map((inf) => (
                    <Card key={inf.id} className="border-neutral-200">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={inf.severity === "Critical" ? "critical" : inf.severity === "High" ? "high" : "medium"}>{inf.severity}</Badge>
                          <span className="font-mono text-[12px] text-neutral-700">{inf.organism}</span>
                          {inf.isHai && <Badge variant="critical">HAI</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                          <div><span className="text-neutral-400">Type:</span> <span className="text-neutral-700">{inf.type}</span></div>
                          <div><span className="text-neutral-400">Ward:</span> <span className="text-neutral-700">{inf.ward}</span></div>
                          <div><span className="text-neutral-400">Source:</span> <span className="text-neutral-700">{inf.location || "Unknown"}</span></div>
                          <div><span className="text-neutral-400">Detected:</span> <span className="text-neutral-700">{formatDate(inf.detectedAt)}</span></div>
                        </div>
                        <Badge variant={statusColor(inf.status)}>{inf.status}</Badge>
                      </CardContent>
                    </Card>
                  ))
              )}

              {activeTab === "screenings" && (
                patientScreenings.length === 0
                  ? <EmptyTab message="No screening records for this patient" />
                  : patientScreenings.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900">{s.screeningType}</p>
                        <p className="text-[11px] text-neutral-500">Due: {formatDate(s.dueDate)}</p>
                      </div>
                      <Badge variant={s.status === "Completed" ? "success" : s.status === "Overdue" ? "critical" : "default"}>{s.status}</Badge>
                    </div>
                  ))
              )}

              {activeTab === "prescribing" && (
                MOCK_MEDS.slice(0, 3 + (selectedPatient.name.charCodeAt(0) % 3)).map((med, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-neutral-900">{med.name}</p>
                        {med.type === "Antibiotic" && <Badge variant="high">Antibiotic</Badge>}
                      </div>
                      <p className="text-[11px] text-neutral-500">{med.dose} · Day {med.days}</p>
                    </div>
                    <Badge variant={med.type === "Antibiotic" ? "monitoring" : "default"}>{med.type}</Badge>
                  </div>
                ))
              )}

              {activeTab === "devices" && (
                MOCK_DEVICES.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{d.type}</p>
                      <p className="text-[11px] text-neutral-500">{d.site} · Inserted {formatDate(d.inserted)}</p>
                    </div>
                    <Badge variant={d.status === "Active" ? "info" : "default"}>{d.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Patient"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">{title}</p>
      {children}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-[13px] text-neutral-400">{message}</p>
    </div>
  );
}
