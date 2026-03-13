import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldAlert } from "lucide-react";
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
      return <TrendingDown className="h-3.5 w-3.5 text-green-500" strokeWidth={2} />;
    default:
      return <Minus className="h-3.5 w-3.5 text-neutral-300" strokeWidth={2} />;
  }
}

function rateShade(rate: number): string {
  if (rate > 0.5) return "bg-red-500";
  if (rate > 0.25) return "bg-amber-500";
  if (rate > 0.1) return "bg-teal-500";
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

  return (
    <div>
      <Header title="Antimicrobial Resistance" subtitle="Resistance patterns and prescribing surveillance" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        {/* Patients of Concern */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <CardTitle>Patients of Concern</CardTitle>
            </div>
            <span className="text-[11px] text-neutral-400">
              Flagged by resistance analysis
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_PATIENTS_OF_CONCERN.map((patient, idx) => (
              <div key={idx} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-neutral-900">{patient.name}</h3>
                      <Badge variant="critical">{patient.organism}</Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-neutral-500">
                      {patient.ward} · Current: <span className="font-medium text-neutral-700">{patient.currentAntibiotic}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={cn("h-full rounded-full", rateShade(patient.resistanceLevel))}
                          style={{ width: `${patient.resistanceLevel * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[12px] font-medium text-neutral-700">
                        {(patient.resistanceLevel * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-neutral-400">Resistance level</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {patient.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      <p className="text-[12px] leading-relaxed text-neutral-600">{reason}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-[12px] font-medium text-amber-800">{patient.action}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resistance Patterns */}
        {summaries.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {summaries.data?.map((summary) => (
              <Card key={summary.organism}>
                <CardHeader>
                  <div>
                    <CardTitle>{summary.organism}</CardTitle>
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      {summary.totalIsolates} isolates · {(summary.mdrRate * 100).toFixed(0)}% MDR
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {summary.patterns.map((p) => (
                      <div key={p.antibiotic} className="flex items-center gap-3">
                        <span className="w-40 truncate text-[12px] text-neutral-600">
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
