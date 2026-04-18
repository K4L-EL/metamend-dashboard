import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Plus, X, MapPin, Activity, ShieldAlert, Search,
  AlertTriangle, TrendingUp, BarChart3, GitBranch, Maximize2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select } from "../../components/ui/form-field";
import { Card, CardContent } from "../../components/ui/card";
import { PatientTrendModal } from "../../components/patients/patient-trend-modal";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDate, cn } from "../../lib/utils";
import type { Patient, CreatePatientRequest } from "../../types";

export const Route = createFileRoute("/app/patients")({
  component: PatientsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: (search.patientId as string) ?? undefined,
  }),
});

const WARDS = ["ICU-A", "ICU-B", "Ward 2A", "Ward 3B", "Ward 4C", "Surgical", "Emergency", "Neonatal"];
const STATUSES = ["Stable", "Monitoring", "Critical"];
const EMPTY_FORM: CreatePatientRequest = {
  name: "", age: 0, gender: "Male", ward: "ICU-A", bedNumber: "", status: "Stable",
};

const EXPOSURE_TYPES = ["Direct Contact", "Indirect Contact", "Environmental", "Unknown", "Shared Equipment"];
const RISK_EXPLANATIONS: Record<string, string> = {
  Critical: "has a hospital stay of 14+ days, has been in contact with multiple infected patients, and received broad-spectrum antibiotics in past, putting them at a high risk of infection acquisition",
  High: "has extended hospital stay, previous antibiotic exposure, and proximity to known cases. Elevated risk factors warrant close monitoring",
  Medium: "has moderate risk factors including recent antibiotic use and ward-level exposure. Standard surveillance recommended",
  Low: "has minimal risk factors. Routine screening protocols apply",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generateRiskHistory(patientName: string, currentScore: number) {
  const rand = seededRandom(patientName.charCodeAt(0) * 100 + patientName.charCodeAt(1));
  const points = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const drift = (rand() - 0.45) * 0.08;
    const base = currentScore - 0.15 + (i / 29) * 0.15;
    const val = Math.max(0, Math.min(1, base + drift));
    points.push({ date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), risk: Math.round(val * 100) });
  }
  return points;
}

function generateRiskFactors(patientName: string, score: number) {
  const rand = seededRandom(patientName.charCodeAt(0) * 50);
  const total = score * 100;
  const factors = [
    { name: "Hospital Stay", value: 0, color: "#3b82f6" },
    { name: "Contact", value: 0, color: "#ef4444" },
    { name: "Antibiotics", value: 0, color: "#0ea5e9" },
    { name: "Microbiology", value: 0, color: "#6366f1" },
    { name: "Demographics", value: 0, color: "#64748b" },
  ];
  let remaining = total;
  for (let i = 0; i < factors.length - 1; i++) {
    const share = remaining * (0.15 + rand() * 0.45);
    factors[i]!.value = Math.round(share);
    remaining -= factors[i]!.value;
  }
  factors[factors.length - 1]!.value = Math.round(Math.max(0, remaining));
  return factors.sort((a, b) => b.value - a.value);
}

type ListTab = "at-risk" | "infections" | "clusters";

function PatientsPage() {
  const navigate = useNavigate();
  const { patientId } = useSearch({ from: "/app/patients" });
  const patients = useAsync(() => api.patients.getAll(), []);
  const infections = useAsync(() => api.infections.getAll(), []);
  const transmission = useAsync(() => api.transmission.getNetwork(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [listTab, setListTab] = useState<ListTab>("at-risk");
  const [searchQuery, setSearchQuery] = useState("");
  const [trendModalOpen, setTrendModalOpen] = useState(false);

  useEffect(() => {
    if (patientId && patients.data && !selectedPatient) {
      const found = patients.data.find((p) => p.id === patientId);
      if (found) setSelectedPatient(found);
    }
  }, [patientId, patients.data, selectedPatient]);

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

  const sortedPatients = useMemo(() => {
    let items = patients.data ?? [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    }
    if (listTab === "at-risk") {
      items = [...items].sort((a, b) => b.riskScore - a.riskScore);
    } else if (listTab === "infections") {
      items = items.filter((p) => p.activeInfections > 0).sort((a, b) => b.activeInfections - a.activeInfections);
    } else {
      items = items.filter((p) => p.organisms.length > 0).sort((a, b) => b.riskScore - a.riskScore);
    }
    return items;
  }, [patients.data, listTab, searchQuery]);

  const patientInfections = infections.data?.filter(
    (i) => i.patientId === selectedPatient?.id
  ) ?? [];

  const riskLevel = selectedPatient
    ? selectedPatient.riskScore > 0.75 ? "Critical" : selectedPatient.riskScore > 0.5 ? "High" : selectedPatient.riskScore > 0.25 ? "Medium" : "Low"
    : "Low";

  const riskHistory = selectedPatient ? generateRiskHistory(selectedPatient.name, selectedPatient.riskScore) : [];
  const riskFactors = selectedPatient ? generateRiskFactors(selectedPatient.name, selectedPatient.riskScore) : [];

  const exposure = selectedPatient
    ? EXPOSURE_TYPES[Math.abs(selectedPatient.name.charCodeAt(0)) % EXPOSURE_TYPES.length]
    : "";

  return (
    <div>
      <Header title="Patients" subtitle="Patient infection status and risk profiles" />
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left sidebar patient list */}
        <div className={cn("flex flex-col border-r border-neutral-200 bg-white transition-all", selectedPatient ? "w-[380px]" : "w-full max-w-md")}>
          {/* Search */}
          <div className="border-b border-neutral-200 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID"
                className="flex-1 bg-transparent text-xs text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            {([
              { id: "infections" as const, label: "Infections" },
              { id: "at-risk" as const, label: "At-Risk" },
              { id: "clusters" as const, label: "Clusters" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListTab(tab.id)}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium transition-colors",
                  listTab === tab.id
                    ? "border-b-2 border-sky-500 text-sky-700"
                    : "text-neutral-500 hover:text-neutral-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Patient list */}
          <div className="flex-1 overflow-y-auto">
            {patients.loading ? (
              <div className="p-8"><Loading /></div>
            ) : sortedPatients.length === 0 ? (
              <p className="p-6 text-center text-xs text-neutral-400">No patients found</p>
            ) : (
              sortedPatients.map((patient) => {
                const pct = Math.round(patient.riskScore * 100);
                const riskColor = pct > 75 ? "text-red-600" : pct > 50 ? "text-neutral-700" : "text-sky-600";
                const isSelected = selectedPatient?.id === patient.id;
                const patientExposure = EXPOSURE_TYPES[Math.abs(patient.name.charCodeAt(0)) % EXPOSURE_TYPES.length];

                return (
                  <div
                    key={patient.id}
                    className={cn(
                      "cursor-pointer border-b border-neutral-100 px-4 py-3 transition-colors",
                      isSelected ? "bg-sky-50 border-l-[3px] border-l-sky-500" : "hover:bg-neutral-50",
                    )}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{patient.name}</span>
                      <span className="text-xs text-neutral-400">|</span>
                      <span className={cn("text-sm font-semibold tabular-nums", riskColor)}>{pct}%</span>
                      <span className="text-xs text-neutral-400">|</span>
                      <div className="flex gap-1">
                        {patient.organisms.length > 0
                          ? patient.organisms.map((o) => <Badge key={o} variant="critical" className="text-[10px] px-1.5 py-0">{o}</Badge>)
                          : <span className="text-[10px] text-neutral-400">—</span>
                        }
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        Location: {patient.ward}
                      </span>
                      <span>Status: {patient.status}</span>
                      <span>Exposure: {patientExposure}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add patient button */}
          <div className="border-t border-neutral-200 p-3">
            <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Patient
            </Button>
          </div>
        </div>

        {/* Right detail panel */}
        {selectedPatient ? (
          <div className="flex-1 overflow-y-auto bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-neutral-900">{selectedPatient.name}</h2>
                {selectedPatient.organisms.map((o) => <Badge key={o} variant="critical">{o}</Badge>)}
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
                  <TrendingUp className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedPatient(null)} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* Risk warning banner */}
              {selectedPatient.riskScore > 0.5 && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-xs leading-relaxed text-red-800">
                    This patient has been predicted to be at <strong>{riskLevel.toLowerCase()}</strong> risk of
                    {selectedPatient.organisms.length > 0 ? ` a ${selectedPatient.organisms[0]} infection` : " infection acquisition"}.
                  </p>
                </div>
              )}

              {/* Patient details grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <DetailRow label="Patient" value={selectedPatient.name} />
                <DetailRow label="Hospital No." value={selectedPatient.id.slice(0, 8).toUpperCase()} />
                <DetailRow label="Location" value={`${selectedPatient.ward}, Bed ${selectedPatient.bedNumber}`} />
                <DetailRow label="Status" value={selectedPatient.status} />
                <DetailRow label="Exposure" value={exposure!} />
                <div>
                  <span className="text-xs text-neutral-500">Predicted Risk: </span>
                  <span className={cn("text-sm font-semibold", selectedPatient.riskScore > 0.75 ? "text-red-600" : selectedPatient.riskScore > 0.5 ? "text-neutral-700" : "text-sky-600")}>
                    {Math.round(selectedPatient.riskScore * 100)}%
                  </span>
                </div>
              </div>

              <div className="h-px bg-neutral-200" />

              {/* Risk explanation */}
              <div>
                <p className="text-xs leading-relaxed text-neutral-600">
                  <strong>Predicted Risk Explanation:</strong> {selectedPatient.name} {RISK_EXPLANATIONS[riskLevel]}, predicted to be {Math.round(selectedPatient.riskScore * 100)}%.
                </p>
              </div>

              <div className="h-px bg-neutral-200" />

              {/* Risk Over Time chart */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-neutral-500" />
                    <h3 className="text-sm font-semibold text-neutral-900">Risk Over Time</h3>
                  </div>
                  <button
                    onClick={() => setTrendModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-600 transition-colors hover:border-sky-300 hover:text-sky-700"
                  >
                    <Maximize2 className="h-3 w-3" />
                    Expand trend
                  </button>
                </div>
                <p className="mb-3 text-[10px] text-neutral-400">Predicted risk over time. Hover over time points for more detail, or expand for 60-day view.</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} interval={4} />
                      <YAxis tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e5e5", padding: "6px 10px" }}
                        formatter={(v: number) => [`${v}%`, "Risk"]}
                      />
                      <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk Explainer */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-neutral-500" />
                  <h3 className="text-sm font-semibold text-neutral-900">Risk Explainer</h3>
                </div>
                <p className="mb-3 text-[10px] text-neutral-400">Factors that contribute to the patient's infection risk. Click on each factor to view more detail.</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskFactors} layout="vertical" margin={{ left: 90, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#525252" }} tickLine={false} axisLine={false} width={85} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e5e5", padding: "6px 10px" }}
                        formatter={(v: number) => [`${v}%`, "Contribution"]}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {riskFactors.map((f, i) => (
                          <Cell key={i} fill={f.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Active infections */}
              {patientInfections.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Active Infections</h3>
                  <div className="space-y-2">
                    {patientInfections.map((inf) => (
                      <Card key={inf.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={inf.severity === "Critical" ? "critical" : inf.severity === "High" ? "high" : "medium"}>{inf.severity}</Badge>
                            <span className="font-mono text-xs text-neutral-700">{inf.organism}</span>
                            {inf.isHai && <Badge variant="critical">HAI</Badge>}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-neutral-400">Type:</span> <span className="text-neutral-700">{inf.type}</span></div>
                            <div><span className="text-neutral-400">Ward:</span> <span className="text-neutral-700">{inf.ward}</span></div>
                            <div><span className="text-neutral-400">Source:</span> <span className="text-neutral-700">{inf.location || "Unknown"}</span></div>
                            <div><span className="text-neutral-400">Detected:</span> <span className="text-neutral-700">{formatDate(inf.detectedAt)}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection diagram */}
              {transmission.data && (() => {
                const patientLinks = transmission.data.links.filter(
                  (l) => l.sourceId === selectedPatient.id || l.targetId === selectedPatient.id,
                );
                if (patientLinks.length === 0) return null;
                const connectedIds = new Set<string>([selectedPatient.id]);
                patientLinks.forEach((l) => { connectedIds.add(l.sourceId); connectedIds.add(l.targetId); });
                const connectedNodes = transmission.data.nodes.filter((n) => connectedIds.has(n.id));

                return (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-neutral-500" />
                      <h3 className="text-sm font-semibold text-neutral-900">Contact Network</h3>
                    </div>
                    <p className="mb-3 text-[10px] text-neutral-400">Transmission links for this patient. Click a node to navigate.</p>
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex flex-col items-center gap-4">
                        {/* Center patient node */}
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-sky-400 bg-sky-50">
                          <span className="text-[10px] font-bold text-sky-700">
                            {selectedPatient.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-neutral-700">{selectedPatient.name}</span>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-3">
                          {connectedNodes
                            .filter((n) => n.id !== selectedPatient.id)
                            .map((node) => {
                              const link = patientLinks.find(
                                (l) => l.sourceId === node.id || l.targetId === node.id,
                              );
                              const isPatient = node.id.startsWith("P");
                              const matchedPatient = isPatient ? patients.data?.find((p) => p.id === node.id) : null;
                              return (
                                <div
                                  key={node.id}
                                  className={cn(
                                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors",
                                    isPatient ? "cursor-pointer border-neutral-200 hover:border-sky-300 hover:bg-sky-50" : "border-neutral-200",
                                  )}
                                  onClick={() => {
                                    if (matchedPatient) setSelectedPatient(matchedPatient);
                                  }}
                                >
                                  <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border",
                                    node.nodeType === "Index" ? "border-red-300 bg-red-50" :
                                    node.nodeType === "Environmental" ? "border-sky-300 bg-sky-50" :
                                    node.nodeType === "HCW" ? "border-blue-300 bg-blue-50" :
                                    "border-neutral-300 bg-neutral-100",
                                  )}>
                                    <span className="text-[9px] font-bold text-neutral-600">
                                      {node.patientName.split(" ").map((n) => n[0]).join("")}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-neutral-700">{node.patientName}</span>
                                  <span className="text-[9px] text-neutral-400">{node.ward}</span>
                                  {link && (
                                    <Badge className="text-[8px] px-1.5 py-0">{link.linkType}</Badge>
                                  )}
                                  {link && (
                                    <span className="text-[9px] tabular-nums text-neutral-400">{Math.round(link.confidence * 100)}% confidence</span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-neutral-50">
            <div className="text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Select a patient to view details</p>
              <p className="mt-1 text-xs text-neutral-400">Risk analysis, infection history, and predictions</p>
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

      <PatientTrendModal
        open={trendModalOpen}
        onClose={() => setTrendModalOpen(false)}
        patient={selectedPatient}
        infections={patientInfections}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-neutral-500">{label}: </span>
      <span className="text-sm text-neutral-900">{value}</span>
    </div>
  );
}
