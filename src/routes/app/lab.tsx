import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FlaskConical, Activity, TrendingUp, Shield, Building2, Network,
  Workflow, ClipboardCheck, Brain, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/app/lab")({
  component: LabPage,
});

interface Feature {
  icon: typeof Activity;
  title: string;
  tag: string;
  tagColor: string;
  summary: string;
  details: string[];
  methodology: string;
}

const FEATURES: Feature[] = [
  {
    icon: Activity,
    title: "Real-time Infection Surveillance",
    tag: "Surveillance",
    tagColor: "metamed",
    summary: "Continuous monitoring of infection signals across all clinical data sources — EHR, labs, screening, and bed management.",
    details: [
      "Ingests HL7 FHIR messages from EHR systems in real time",
      "Correlates lab culture results with clinical context automatically",
      "Distinguishes HAI from community-acquired infections using temporal and spatial analysis",
      "Maintains a living timeline of every infection event per patient",
    ],
    methodology: "Signal processing pipeline with configurable thresholds. Each clinical event is scored against a Bayesian infection probability model trained on historical HAI data.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Risk Forecasting",
    tag: "Forecasting",
    tagColor: "high",
    summary: "14-day infection forecasts and patient-level risk scoring using machine learning models trained on your facility's historical data.",
    details: [
      "Time-series forecasting (ARIMA + gradient boosting ensemble) for ward-level infection counts",
      "Patient risk score derived from admission data, lab trends, antibiotic history, and proximity to known cases",
      "Location risk heat scores updated hourly based on active cases, cleaning schedules, and staffing levels",
      "Confidence intervals and uncertainty bounds shown on all predictions",
    ],
    methodology: "Ensemble model combining classical time-series decomposition with XGBoost for residual correction. Patient risk uses a logistic regression base with feature engineering from 47 clinical variables.",
  },
  {
    icon: Shield,
    title: "Outbreak Detection & Response",
    tag: "Response",
    tagColor: "critical",
    summary: "Automated outbreak detection using cluster analysis, with structured investigation workflows and report generation.",
    details: [
      "SaTScan-inspired spatial-temporal scan statistics detect unusual case clusters",
      "Automatic organism grouping and PFGE/WGS pattern matching when molecular data is available",
      "Structured investigation workflow: detect → investigate → control → resolve",
      "One-click investigation report generation with epidemiological analysis",
    ],
    methodology: "Prospective space-time permutation scan statistic with Monte Carlo hypothesis testing. Cluster significance threshold p < 0.05 with Bonferroni correction for multiple testing.",
  },
  {
    icon: FlaskConical,
    title: "Antimicrobial Resistance Tracking",
    tag: "AMR",
    tagColor: "high",
    summary: "Monitor resistance patterns across organisms and antibiotics. Identify patients of concern before treatment failure.",
    details: [
      "Resistance rate tracking per organism-antibiotic combination with trend analysis",
      "MDR/XDR classification using ECDC standard definitions",
      "Patient-of-concern flagging based on antibiotic history, current susceptibility, and treatment response",
      "Integration with antimicrobial stewardship programme for prescribing audit",
    ],
    methodology: "Resistance rates calculated using rolling 90-day windows. Trend detection uses Mann-Kendall test with Sen's slope estimator. Patient flags use a rule-based expert system augmented with ML risk scoring.",
  },
  {
    icon: Building2,
    title: "3D Hospital Location Risk",
    tag: "Location",
    tagColor: "metamed",
    summary: "Interactive 3D hospital floor plan with bed-level infection status, ward risk scores, and real-time overlays.",
    details: [
      "Three.js-rendered floor plans with accurate ward and bed positioning",
      "Red/amber/green bed status indicators updated from live patient data",
      "Split-floor view for multi-storey hospitals with smooth camera navigation",
      "Click any bed to see patient details, infection history, and risk score",
    ],
    methodology: "Risk scores per location use a weighted composite of: active infection count (40%), recent infection rate (30%), cleaning compliance (15%), and staffing ratio (15%).",
  },
  {
    icon: Network,
    title: "Transmission Network Analysis",
    tag: "Transmission",
    tagColor: "info",
    summary: "Visual network graphs showing potential transmission chains between patients, locations, and organisms.",
    details: [
      "Force-directed graph layout showing patient-to-patient transmission links",
      "Temporal proximity scoring: patients sharing a ward within 48h of each other's positive result",
      "Organism-specific clustering with molecular typing correlation when available",
      "Interactive exploration — click any node to trace the full transmission chain",
    ],
    methodology: "Transmission probability estimated using a modified Reed-Frost model incorporating spatial proximity, temporal overlap, and organism-specific attack rates.",
  },
  {
    icon: Workflow,
    title: "Visual Data Pipeline Builder",
    tag: "Pipelines",
    tagColor: "metamed",
    summary: "Build custom detection and alerting workflows with a drag-and-drop flow editor.",
    details: [
      "Node-based pipeline editor for connecting data sources, transformations, and outputs",
      "Pre-built nodes for common operations: filter, aggregate, threshold, alert",
      "Pipelines execute on a configurable schedule or in real-time streaming mode",
      "Export/import pipeline definitions as JSON for version control",
    ],
    methodology: "Directed acyclic graph (DAG) execution engine. Each node processes data frames sequentially. Supports both batch (cron-scheduled) and streaming (event-driven) execution modes.",
  },
  {
    icon: ClipboardCheck,
    title: "Screening Programme Management",
    tag: "Screening",
    tagColor: "info",
    summary: "Track admission and periodic screening compliance with automated overdue reminders.",
    details: [
      "Configurable screening protocols per ward, organism, and patient risk category",
      "Automatic scheduling based on admission date and screening frequency rules",
      "Overdue screening alerts integrated into the main alerts system",
      "Compliance reporting with ward-level league tables",
    ],
    methodology: "Rule engine matches patients to applicable screening protocols. Compliance rates calculated as (completed on time) / (total due) with exclusions for discharges and clinical exceptions.",
  },
  {
    icon: Brain,
    title: "AI Investigation Engine",
    tag: "AI",
    tagColor: "metamed",
    summary: "Every clinical signal is investigated in context. The AI engine triages signals into actionable categories — reducing false positives by up to 83%.",
    details: [
      "Natural language processing of clinical notes to extract infection-relevant context",
      "Multi-signal fusion: combines lab, clinical, pharmacy, and environmental data",
      "Automated triage into 4 categories: Not Infectious, Monitor, Critical Alert, Outbreak Risk",
      "Continuous learning from clinician feedback to improve classification accuracy",
    ],
    methodology: "Transformer-based NLP model fine-tuned on de-identified clinical notes. Signal fusion uses a weighted evidence accumulation framework. Classification model retrained weekly on confirmed outcomes.",
  },
];

function LabPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div>
      <Header title="MetaMed Lab" subtitle="How the intelligence platform works — methodology and technical details" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-sky-600" strokeWidth={1.8} />
            <div>
              <h3 className="text-[14px] font-semibold text-neutral-900">Understanding MetaMed</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                MetaMed is a system-wide infection intelligence platform. Below is a detailed explanation of each module —
                what it does, how it works, and the methodology behind it. Click any feature to explore the technical details.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {FEATURES.map((feature, idx) => {
            const isOpen = expandedIdx === idx;
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className={cn(
                  "cursor-pointer transition-all",
                  isOpen && "ring-1 ring-sky-200 shadow-md",
                )}
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                      <Icon className="h-5 w-5 text-neutral-600" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-neutral-900">{feature.title}</h3>
                        <Badge variant={feature.tagColor as "metamed"}>{feature.tag}</Badge>
                      </div>
                      <p className="mt-0.5 text-[12px] text-neutral-500">{feature.summary}</p>
                    </div>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" />
                      : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />}
                  </div>

                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 py-4 space-y-4">
                      <div>
                        <h4 className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">How it works</h4>
                        <ul className="mt-2 space-y-2">
                          {feature.details.map((d, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                              <span className="text-[13px] leading-relaxed text-neutral-600">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                        <h4 className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">Methodology</h4>
                        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600">{feature.methodology}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
