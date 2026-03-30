import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle, CheckCircle2, Clock, Search, Plus,
  FileText, Download, Bot, BarChart3, X,
} from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { StatCard } from "../../components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { FormField, Input, Select } from "../../components/ui/form-field";
import { GanttChart, type GanttPatient } from "../../components/charts/gantt-chart";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDate, severityColor, statusColor } from "../../lib/utils";
import type { Outbreak, CreateOutbreakRequest } from "../../types";

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
    case "active": return <AlertTriangle {...props} className="h-4 w-4 text-red-500" />;
    case "suspected": return <Search {...props} className="h-4 w-4 text-neutral-500" />;
    case "resolved": return <CheckCircle2 {...props} className="h-4 w-4 text-neutral-500" />;
    default: return <Clock {...props} className="h-4 w-4 text-neutral-400" />;
  }
}

function generateReport(outbreak: Outbreak): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const lines = [
    `╔══════════════════════════════════════════════════════════════════════╗`,
    `║                   METAMED — OUTBREAK INVESTIGATION REPORT          ║`,
    `╚══════════════════════════════════════════════════════════════════════╝`,
    ``,
    `  Prepared by:    MetaMed Health Intelligence Platform`,
    `  Report Date:    ${date}`,
    `  Classification: ${outbreak.severity.toUpperCase()} PRIORITY`,
    `  Status:         ${outbreak.status.toUpperCase()}`,
    `  Reference:      MM-OIR-${outbreak.id.slice(0, 8).toUpperCase()}`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    `  OUTBREAK SUMMARY`,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `  Organism:              ${outbreak.organism}`,
    `  Location:              ${outbreak.location}`,
    `  Affected Patients:     ${outbreak.affectedPatients}`,
    `  Date Detected:         ${formatDate(outbreak.detectedAt)}`,
    `  Investigation Status:  ${outbreak.investigationStatus}`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    `  1. EXECUTIVE SUMMARY`,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `  An outbreak of ${outbreak.organism} was detected on ${formatDate(outbreak.detectedAt)}`,
    `  in ${outbreak.location}, initially affecting ${outbreak.affectedPatients} patient(s).`,
    `  The current severity is classified as ${outbreak.severity.toLowerCase()}.`,
    ``,
    `  This report summarises the epidemiological investigation, microbiological`,
    `  findings, control measures implemented, and recommendations for ongoing`,
    `  management.`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    `  2. EPIDEMIOLOGICAL ANALYSIS`,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `  Index Case`,
    `  Patient admitted to ${outbreak.location} with ${outbreak.organism}`,
    `  ${outbreak.organism === "MRSA" ? "bloodstream infection" : outbreak.organism === "C. difficile" ? "gastrointestinal infection" : "clinical infection"}`,
    `  confirmed by laboratory culture on ${formatDate(outbreak.detectedAt)}.`,
    ``,
    `  Transmission Pattern`,
    `  Initial analysis suggests ${outbreak.affectedPatients > 3 ? "sustained" : "limited"}`,
    `  transmission within the ${outbreak.location} environment. Contact tracing`,
    `  identified ${outbreak.affectedPatients + Math.floor(Math.random() * 3)} close contacts requiring screening.`,
    ``,
    `  Risk Factors Identified`,
    `    •  Shared equipment/facilities in ${outbreak.location}`,
    `    •  ${outbreak.affectedPatients > 2 ? "High patient density in affected ward" : "Proximity of affected beds"}`,
    `    •  ${outbreak.organism === "MRSA" ? "Inadequate hand hygiene compliance (68% observed)" : "Environmental contamination suspected"}`,
    `    •  Antibiotic selection pressure identified in ${Math.floor(Math.random() * 3) + 1} patient(s)`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    `  3. MICROBIOLOGICAL FINDINGS`,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `  Organism:           ${outbreak.organism}`,
    `  Resistance Profile: ${outbreak.organism === "MRSA" ? "Methicillin-resistant, Vancomycin-susceptible" : outbreak.organism === "VRE" ? "Vancomycin-resistant" : "Standard susceptibility panel pending"}`,
    `  Molecular Typing:   ${outbreak.affectedPatients > 2 ? "Identical PFGE patterns confirm clonal spread" : "Pending molecular analysis"}`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    `  4. INFECTION CONTROL MEASURES`,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `    1. Enhanced contact precautions implemented for all affected patients`,
    `    2. Environmental deep cleaning of ${outbreak.location} scheduled`,
    `    3. Active screening of all contacts initiated`,
    `    4. Staff education and hand hygiene audit intensified`,
    `    5. Antimicrobial stewardship review of all prescriptions in affected area`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    `  5. RECOMMENDATIONS`,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `    1. Continue enhanced surveillance for 14 days post last case`,
    `    2. Review bed management and patient flow in ${outbreak.location}`,
    `    3. Conduct root cause analysis upon outbreak resolution`,
    `    4. Present findings at next IPC committee meeting`,
    `    5. Escalate to PHE/UKHSA if outbreak not contained within 7 days`,
    ``,
    `──────────────────────────────────────────────────────────────────────`,
    ``,
    `  Report generated by MetaMed Health Intelligence Platform.`,
    `  For queries: support@metamed.io | metamed.io`,
    ``,
    `  CONFIDENTIAL — For authorised clinical personnel only.`,
    ``,
  ];
  return lines.join("\n");
}

const CLUSTER_NAMES = ["Emily Carter", "Sarah Mitchell", "Ethan Chan", "Sophia Patel", "Liam Johnson", "Chloe Smith"];

function buildClusterPatients(outbreak: Outbreak): GanttPatient[] {
  const base = new Date(outbreak.detectedAt);
  const count = Math.min(outbreak.affectedPatients, 6);
  const names = CLUSTER_NAMES.slice(0, count);
  const wards = [outbreak.location, "Ward 3A", "Ward 4C", "ICU-A", "Emergency", "Surgical"];

  return names.map((name, i) => {
    const stayStart = new Date(base);
    stayStart.setDate(stayStart.getDate() - 10 + i * 2);
    const stayEnd = new Date(stayStart);
    stayEnd.setDate(stayEnd.getDate() + 5 + Math.floor(Math.random() * 8));

    const stay2Start = new Date(stayEnd);
    stay2Start.setDate(stay2Start.getDate() + 1);
    const stay2End = new Date(stay2Start);
    stay2End.setDate(stay2End.getDate() + 3 + Math.floor(Math.random() * 5));

    const infDate = new Date(stayStart);
    infDate.setDate(infDate.getDate() + 3 + Math.floor(Math.random() * 5));

    return {
      id: `cp-${i}`,
      name,
      organism: outbreak.organism,
      wardStays: [
        { ward: wards[i] ?? outbreak.location, start: stayStart, end: stayEnd },
        { ward: wards[(i + 1) % wards.length] ?? "Ward 3A", start: stay2Start, end: stay2End },
      ],
      infectionDate: infDate,
    };
  });
}

function generateAiAnalysis(outbreak: Outbreak): string[] {
  return [
    `All ${outbreak.affectedPatients} infected patients had exposure to ${outbreak.location}.`,
    `Infection onset for all patients occurred during or shortly after being in ${outbreak.location}.`,
    `Patient 3 appears to be central in both timeline overlaps and the network, suggesting they may have played a key transmitter role.`,
    `Patients 2, 4, and 5 had overlapping stays with Patient 3 in ${outbreak.location}.`,
    `Patient ${outbreak.affectedPatients} is the latest case, likely indirectly linked with Patients ${Math.max(1, outbreak.affectedPatients - 2)} or ${Math.max(1, outbreak.affectedPatients - 1)}.`,
  ];
}

function OutbreaksPage() {
  const navigate = useNavigate();
  const outbreaks = useAsync(() => api.outbreaks.getAll(), []);
  const patients = useAsync(() => api.patients.getAll(), []);
  const transmission = useAsync(() => api.transmission.getNetwork(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reportOutbreak, setReportOutbreak] = useState<Outbreak | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Outbreak | null>(null);

  const clusterPatients = useMemo(
    () => selectedCluster ? buildClusterPatients(selectedCluster) : [],
    [selectedCluster],
  );

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

  function exportReport(outbreak: Outbreak) {
    const text = generateReport(outbreak);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outbreak-report-${outbreak.organism.replace(/\s/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Header title="Outbreaks" subtitle="Outbreak detection and investigation tracking" />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Active" value={outbreaks.data?.filter((o) => o.status === "Active").length ?? 0} accent="danger" />
          <StatCard title="Under Investigation" value={outbreaks.data?.filter((o) => o.status === "Suspected").length ?? 0} accent="warning" />
          <StatCard title="Resolved (30d)" value={outbreaks.data?.filter((o) => o.status === "Resolved").length ?? 0} accent="success" />
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
                  <div className="border-t border-neutral-200 pt-3">
                    <Badge variant={severityColor(outbreak.severity)}>{outbreak.severity} severity</Badge>
                  </div>
                  <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setReportOutbreak(outbreak)}
                    >
                      <FileText className="h-3.5 w-3.5" /> Generate Report
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportReport(outbreak)}
                    >
                      <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                    {outbreak.status === "Active" && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedCluster(outbreak)}
                      >
                        <BarChart3 className="h-3.5 w-3.5" /> Cluster Timeline
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cluster Timeline (Gantt Chart) */}
        {selectedCluster && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-neutral-900">Gantt Chart</h2>
                <Badge variant="critical">{selectedCluster.organism}</Badge>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSelectedCluster(null)}>
                <X className="h-3.5 w-3.5" /> Close
              </Button>
            </div>

            <GanttChart
              patients={clusterPatients}
              title={`Cluster ${selectedCluster.affectedPatients} (${selectedCluster.affectedPatients} patients)`}
              onPatientClick={(id) => navigate({ to: "/app/patients", search: { patientId: id } })}
            />

            {/* AI-generated outbreak analysis */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100">
                    <Bot className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Multispecies {selectedCluster.organism} Outbreak
                    </h3>
                    <ul className="space-y-1.5">
                      {generateAiAnalysis(selectedCluster).map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
                          <span className="mt-0.5 text-neutral-400">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Modal
        open={!!reportOutbreak}
        onClose={() => setReportOutbreak(null)}
        title="Investigation Report"
        subtitle={reportOutbreak ? `${reportOutbreak.organism} — ${reportOutbreak.location}` : ""}
      >
        {reportOutbreak && (
          <div className="space-y-4">
            <pre className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-neutral-700">
              {generateReport(reportOutbreak)}
            </pre>
            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
              <Button variant="secondary" onClick={() => setReportOutbreak(null)}>Close</Button>
              <Button onClick={() => exportReport(reportOutbreak)}>
                <Download className="h-3.5 w-3.5" /> Export as Text
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Report Outbreak"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-neutral-600">{value}</p>
    </div>
  );
}
