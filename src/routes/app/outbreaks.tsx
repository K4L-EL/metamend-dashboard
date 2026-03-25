import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle, CheckCircle2, Clock, Search, Plus,
  FileText, Download, Bot, ChevronDown, ChevronUp,
} from "lucide-react";
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
    case "suspected": return <Search {...props} className="h-4 w-4 text-amber-500" />;
    case "resolved": return <CheckCircle2 {...props} className="h-4 w-4 text-green-500" />;
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

function OutbreaksPage() {
  const outbreaks = useAsync(() => api.outbreaks.getAll(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reportOutbreak, setReportOutbreak] = useState<Outbreak | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Active" value={outbreaks.data?.filter((o) => o.status === "Active").length ?? 0} shade="bg-red-500" />
            <MetricCard label="Under Investigation" value={outbreaks.data?.filter((o) => o.status === "Suspected").length ?? 0} shade="bg-amber-500" />
            <MetricCard label="Resolved (30d)" value={outbreaks.data?.filter((o) => o.status === "Resolved").length ?? 0} shade="bg-green-500" />
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Report modal */}
      <Modal
        open={!!reportOutbreak}
        onClose={() => setReportOutbreak(null)}
        title="Investigation Report"
        subtitle={reportOutbreak ? `${reportOutbreak.organism} — ${reportOutbreak.location}` : ""}
      >
        {reportOutbreak && (
          <div className="space-y-4">
            <pre className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-[11px] leading-relaxed text-neutral-700">
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

      {/* Create outbreak modal */}
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

function MetricCard({ label, value, shade }: { label: string; value: number; shade: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2.5">
        <div className={cn("h-2 w-2 rounded-full", shade)} />
        <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">{label}</p>
      <p className="mt-0.5 text-[13px] text-neutral-600">{value}</p>
    </div>
  );
}
