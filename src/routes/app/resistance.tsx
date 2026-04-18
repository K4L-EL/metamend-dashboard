import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldAlert,
  ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import type { Patient, ResistanceSummary } from "../../types";

export const Route = createFileRoute("/app/resistance")({
  component: ResistancePage,
});

function trendIcon(trend: string) {
  switch (trend.toLowerCase()) {
    case "increasing":
      return <TrendingUp className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />;
    case "decreasing":
      return <TrendingDown className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />;
    default:
      return <Minus className="h-3.5 w-3.5 text-neutral-300" strokeWidth={2} />;
  }
}

function rateShade(rate: number): string {
  if (rate > 0.5) return "bg-red-500";
  if (rate > 0.25) return "bg-neutral-500";
  if (rate > 0.1) return "bg-sky-500";
  return "bg-neutral-400";
}

interface PatientOfConcern {
  id: string;
  name: string;
  ward: string;
  organism: string;
  resistanceLevel: number;
  reasons: string[];
  action: string;
}

function buildPatientsOfConcern(
  patients: Patient[],
  summaries: ResistanceSummary[],
): PatientOfConcern[] {
  if (!patients.length) return [];

  // Build organism -> worst resistance pattern lookup
  const organismRisk = new Map<string, { rate: number; antibiotics: string[]; mdr: number }>();
  summaries.forEach((s) => {
    const worst = [...s.patterns].sort((a, b) => b.resistanceRate - a.resistanceRate);
    organismRisk.set(s.organism, {
      rate: worst[0]?.resistanceRate ?? 0,
      antibiotics: worst.slice(0, 2).map((p) => p.antibiotic),
      mdr: s.mdrRate,
    });
  });

  const concerns: PatientOfConcern[] = patients
    .filter((p) => p.organisms.length > 0 && p.riskScore > 0.4)
    .map((p) => {
      const primary = p.organisms[0] ?? "Unknown";
      const risk = organismRisk.get(primary);
      const level = risk ? Math.max(risk.rate, p.riskScore) : p.riskScore;
      const reasons: string[] = [];
      reasons.push(`${primary} isolated — current status ${p.status}`);
      if (risk) reasons.push(`Local ${primary} resistance: ${(risk.rate * 100).toFixed(0)}% (${risk.antibiotics.join(", ")})`);
      if (risk && risk.mdr > 0.3) reasons.push(`Organism is MDR in ${(risk.mdr * 100).toFixed(0)}% of recent isolates`);
      reasons.push(`Predicted infection risk: ${(p.riskScore * 100).toFixed(0)}%`);
      if (p.activeInfections > 1) reasons.push(`${p.activeInfections} active infections recorded`);
      const action = level > 0.65
        ? "Review antimicrobial plan — consider susceptibility-guided escalation"
        : level > 0.4
        ? "Monitor treatment response and re-culture if no improvement in 48 h"
        : "Continue current regimen with routine monitoring";
      return {
        id: p.id,
        name: p.name,
        ward: `${p.ward} · Bed ${p.bedNumber}`,
        organism: primary,
        resistanceLevel: Math.min(level, 1),
        reasons,
        action,
      };
    })
    .sort((a, b) => b.resistanceLevel - a.resistanceLevel)
    .slice(0, 8);

  return concerns;
}

function ResistancePage() {
  const summaries = useAsync(() => api.resistance.getSummaries(), []);
  const patientsAsync = useAsync(() => api.patients.getAll(), []);
  const navigate = useNavigate();
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [expandedOrganism, setExpandedOrganism] = useState<string | null>(null);

  const togglePatient = (id: string) =>
    setExpandedPatient((prev) => (prev === id ? null : id));

  const toggleOrganism = (org: string) =>
    setExpandedOrganism((prev) => (prev === org ? null : org));

  const patientsOfConcern = useMemo(
    () => buildPatientsOfConcern(patientsAsync.data ?? [], summaries.data ?? []),
    [patientsAsync.data, summaries.data],
  );

  return (
    <div>
      <Header title="Antimicrobial Resistance" subtitle="Resistance patterns and prescribing surveillance" />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Patients of Concern */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <CardTitle>Patients of Concern</CardTitle>
              </div>
              <span className="text-xs text-neutral-400">
                Derived from live patient risk + local resistance patterns
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              {patientsAsync.loading ? (
                <Loading />
              ) : patientsOfConcern.length === 0 ? (
                <EmptyState
                  icon={<ShieldAlert className="h-6 w-6" />}
                  title="No patients currently flagged"
                  description="No active patients have organisms with elevated resistance risk."
                />
              ) : (
                patientsOfConcern.map((patient) => {
                  const isOpen = expandedPatient === patient.id;
                  return (
                    <div
                      key={patient.id}
                      className={cn(
                        "rounded-xl border border-neutral-200 transition-all cursor-pointer",
                        isOpen ? "bg-neutral-50 p-4" : "p-3 hover:bg-neutral-50",
                      )}
                      onClick={() => togglePatient(patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-neutral-900">{patient.name}</h3>
                          <Badge variant="critical">{patient.organism}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-200">
                              <div
                                className={cn("h-full rounded-full", rateShade(patient.resistanceLevel))}
                                style={{ width: `${patient.resistanceLevel * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-medium text-neutral-600">
                              {(patient.resistanceLevel * 100).toFixed(0)}%
                            </span>
                          </div>
                          {isOpen
                            ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
                            : <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />}
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{patient.ward}</p>

                      {isOpen && (
                        <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3">
                          <div className="space-y-1.5">
                            {patient.reasons.map((reason, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                                <p className="text-xs leading-relaxed text-neutral-600">{reason}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                            <p className="text-xs font-medium text-neutral-700">{patient.action}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: "/app/patients", search: { patientId: patient.id } });
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:border-sky-300 hover:text-sky-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open patient profile
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Resistance Patterns */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-700">Resistance Patterns</h3>
            {summaries.loading ? (
              <Loading />
            ) : (
              <div className="grid gap-4 grid-cols-1">
                {summaries.data?.map((summary) => {
                  const isOpen = expandedOrganism === summary.organism;
                  return (
                    <Card
                      key={summary.organism}
                      className={cn("cursor-pointer transition-all", isOpen && "ring-1 ring-sky-200")}
                      onClick={() => toggleOrganism(summary.organism)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <CardTitle>{summary.organism}</CardTitle>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {summary.totalIsolates} isolates · {(summary.mdrRate * 100).toFixed(0)}% MDR
                            </p>
                          </div>
                          {isOpen
                            ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
                            : <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />}
                        </div>
                      </CardHeader>
                      {isOpen && (
                        <CardContent>
                          <div className="space-y-2.5">
                            {summary.patterns.map((p) => (
                              <div key={p.antibiotic} className="flex items-center gap-3">
                                <span className="w-36 truncate text-xs text-neutral-600">
                                  {p.antibiotic}
                                </span>
                                <div className="flex-1">
                                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                                    <div
                                      className={cn("h-full rounded-full", rateShade(p.resistanceRate))}
                                      style={{ width: `${p.resistanceRate * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="w-10 text-right text-xs font-medium tabular-nums text-neutral-600">
                                  {(p.resistanceRate * 100).toFixed(0)}%
                                </span>
                                {trendIcon(p.trend)}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
