import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldAlert,
  ChevronDown, ChevronUp, Maximize2, Minimize2,
} from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

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
  name: string;
  ward: string;
  currentAntibiotic: string;
  organism: string;
  resistanceLevel: number;
  reasons: string[];
  action: string;
}

const MOCK_PATIENTS_OF_CONCERN: PatientOfConcern[] = [
  {
    name: "Eleanor Rigby",
    ward: "ICU-A",
    currentAntibiotic: "Vancomycin",
    organism: "MRSA",
    resistanceLevel: 0.72,
    reasons: [
      "3 antibiotic courses in past 6 months",
      "Current Vancomycin showing reduced susceptibility",
      "MRSA bloodstream infection — HAI confirmed",
      "Prior treatment failure with Daptomycin",
    ],
    action: "Review treatment — consider Linezolid",
  },
  {
    name: "James Morrison",
    ward: "Ward 3B",
    currentAntibiotic: "Meropenem",
    organism: "Klebsiella pneumoniae",
    resistanceLevel: 0.65,
    reasons: [
      "ESBL-producing K. pneumoniae isolated",
      "Carbapenem resistance detected at 65%",
      "Post-surgical wound infection",
      "2 prior antibiotic courses this admission",
    ],
    action: "Review treatment — susceptibility testing pending",
  },
  {
    name: "Sarah Chen",
    ward: "ICU-B",
    currentAntibiotic: "Fluconazole",
    organism: "Candida auris",
    resistanceLevel: 0.58,
    reasons: [
      "C. auris — emerging pathogen, high transmission risk",
      "Fluconazole resistance reported at 58%",
      "Patient immunocompromised (neutropenic)",
      "Current treatment may be inadequate",
    ],
    action: "Switch to Echinocandin — contact IPC team",
  },
  {
    name: "Robert Taylor",
    ward: "Ward 2A",
    currentAntibiotic: "Ciprofloxacin",
    organism: "E. coli",
    resistanceLevel: 0.45,
    reasons: [
      "UTI with E. coli — community-acquired",
      "Fluoroquinolone resistance increasing locally (45%)",
      "Patient has history of recurrent UTIs",
    ],
    action: "Monitor response — consider Nitrofurantoin step-down",
  },
];

function ResistancePage() {
  const summaries = useAsync(() => api.resistance.getSummaries(), []);
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
  const [expandedOrganism, setExpandedOrganism] = useState<string | null>(null);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);

  const togglePatient = (idx: number) =>
    setExpandedPatient((prev) => (prev === idx ? null : idx));

  const toggleOrganism = (org: string) =>
    setExpandedOrganism((prev) => (prev === org ? null : org));

  const eitherExpanded = leftExpanded || rightExpanded;

  return (
    <div>
      <Header title="Antimicrobial Resistance" subtitle="Resistance patterns and prescribing surveillance" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        <div className={cn("grid gap-6", eitherExpanded ? "grid-cols-1" : "lg:grid-cols-2")}>
          {/* Left: Patients of Concern */}
          {(!rightExpanded || leftExpanded) && (
            <Card className={cn(leftExpanded && "col-span-full")}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <CardTitle>Patients of Concern</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">
                    Flagged by resistance analysis
                  </span>
                  <button
                    onClick={() => { setLeftExpanded((e) => !e); setRightExpanded(false); }}
                    className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                    title={leftExpanded ? "Collapse" : "Expand"}
                  >
                    {leftExpanded
                      ? <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />
                      : <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_PATIENTS_OF_CONCERN.map((patient, idx) => {
                  const isOpen = expandedPatient === idx;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-xl border border-neutral-200 transition-all cursor-pointer",
                        isOpen ? "bg-neutral-50 p-4" : "p-3 hover:bg-neutral-50",
                      )}
                      onClick={() => togglePatient(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-semibold text-neutral-900">{patient.name}</h3>
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
                            <span className="font-mono text-[11px] font-medium text-neutral-600">
                              {(patient.resistanceLevel * 100).toFixed(0)}%
                            </span>
                          </div>
                          {isOpen
                            ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
                            : <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />}
                        </div>
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {patient.ward} · {patient.currentAntibiotic}
                      </p>

                      {isOpen && (
                        <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3">
                          <div className="space-y-1.5">
                            {patient.reasons.map((reason, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                                <p className="text-[12px] leading-relaxed text-neutral-600">{reason}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                            <p className="text-[12px] font-medium text-neutral-700">{patient.action}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Right: Resistance Patterns (Pathogens) */}
          {(!leftExpanded || rightExpanded) && (
            <div className={cn("space-y-4", rightExpanded && "col-span-full")}>
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-neutral-700">Resistance Patterns</h3>
                <button
                  onClick={() => { setRightExpanded((e) => !e); setLeftExpanded(false); }}
                  className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  title={rightExpanded ? "Collapse" : "Expand"}
                >
                  {rightExpanded
                    ? <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />
                    : <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />}
                </button>
              </div>
              {summaries.loading ? (
                <Loading />
              ) : (
                <div className={cn("grid gap-4", rightExpanded ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
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
                              <p className="mt-0.5 text-[11px] text-neutral-500">
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
                                  <span className="w-36 truncate text-[12px] text-neutral-600">
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
                                  <span className="w-10 text-right text-[11px] font-medium tabular-nums text-neutral-600">
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
          )}
        </div>
      </div>
    </div>
  );
}
