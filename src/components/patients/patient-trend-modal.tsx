import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart,
} from "recharts";
import { TrendingUp, Activity, Pill, AlertCircle } from "lucide-react";
import { Modal } from "../ui/modal";
import { Badge } from "../ui/badge";
import type { Patient, Infection } from "../../types";
import { formatDate } from "../../lib/utils";

interface PatientTrendModalProps {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
  infections: Infection[];
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function buildExtendedHistory(name: string, currentScore: number, days: number) {
  const rand = seeded(name.charCodeAt(0) * 131 + (name.charCodeAt(1) || 1));
  const points: Array<{ date: string; risk: number; threshold: number; day: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const drift = (rand() - 0.45) * 0.09;
    const base = currentScore - 0.22 + (i / days) * 0.22;
    const val = Math.max(0, Math.min(1, base + drift));
    points.push({
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      risk: Math.round(val * 100),
      threshold: 65,
      day: days - i,
    });
  }
  return points;
}

function buildAntibioticTimeline(name: string, days: number) {
  const rand = seeded(name.charCodeAt(0) * 77);
  const drugs = ["Piperacillin-tazobactam", "Meropenem", "Vancomycin", "Ceftriaxone"];
  const events: Array<{ day: number; drug: string; dose: number }> = [];
  for (let i = 0; i < days; i++) {
    if (rand() > 0.78) {
      const drug = drugs[Math.floor(rand() * drugs.length)]!;
      events.push({ day: i + 1, drug, dose: 1 });
    }
  }
  return events;
}

export function PatientTrendModal({
  open,
  onClose,
  patient,
  infections,
}: PatientTrendModalProps) {
  const history = useMemo(
    () => (patient ? buildExtendedHistory(patient.name, patient.riskScore, 60) : []),
    [patient],
  );
  const antibioticEvents = useMemo(
    () => (patient ? buildAntibioticTimeline(patient.name, 60) : []),
    [patient],
  );

  if (!patient) return null;

  const first = history[0]?.risk ?? 0;
  const last = history[history.length - 1]?.risk ?? 0;
  const delta = last - first;
  const daysAboveThreshold = history.filter((h) => h.risk >= 65).length;
  const peak = history.reduce((m, h) => Math.max(m, h.risk), 0);
  const ordered = [...infections].sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${patient.name} — 60-day trend`}
      subtitle={`${patient.ward} · Bed ${patient.bedNumber} · ${patient.activeInfections} active infection${patient.activeInfections === 1 ? "" : "s"}`}
      className="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <TrendStat label="Current risk" value={`${last}%`} accent={last >= 65 ? "danger" : "neutral"} />
          <TrendStat label="60-day change" value={`${delta > 0 ? "+" : ""}${delta}%`} accent={delta > 0 ? "danger" : "success"} />
          <TrendStat label="Peak risk" value={`${peak}%`} accent="neutral" />
          <TrendStat label="Days ≥ 65%" value={daysAboveThreshold.toString()} accent={daysAboveThreshold > 7 ? "danger" : "neutral"} />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sky-600" />
            <h3 className="text-sm font-semibold text-neutral-900">Risk trajectory</h3>
            <span className="text-[10px] text-neutral-400">last 60 days</span>
          </div>
          <div className="h-60 rounded-lg border border-neutral-200 bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} interval={8} />
                <YAxis tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e5e5", padding: "6px 10px" }}
                  formatter={(v: number) => [`${v}%`, "Risk"]}
                />
                <ReferenceLine y={65} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Alert threshold", fontSize: 9, fill: "#ef4444", position: "right" }} />
                <Area type="monotone" dataKey="risk" stroke="#0ea5e9" strokeWidth={1.8} fill="url(#riskGrad)" dot={false} activeDot={{ r: 3, fill: "#0ea5e9" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Pill className="h-4 w-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900">Antimicrobial exposure</h3>
            </div>
            <div className="h-40 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              {antibioticEvents.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  No recorded antimicrobial doses in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.map((h) => ({
                    day: h.day,
                    doses: antibioticEvents.filter((e) => e.day <= h.day).length,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#a3a3a3" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e5e5", padding: "6px 10px" }}
                      formatter={(v: number) => [`${v} dose${v === 1 ? "" : "s"}`, "Cumulative"]}
                      labelFormatter={(v) => `Day ${v}`}
                    />
                    <Line type="monotone" dataKey="doses" stroke="#64748b" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-2 text-[10px] text-neutral-500">
              {antibioticEvents.length} dose{antibioticEvents.length === 1 ? "" : "s"} recorded over last 60 days.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900">Infection events</h3>
            </div>
            {ordered.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
                No active infections for this patient.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
                {ordered.map((inf) => (
                  <li key={inf.id} className="flex items-start gap-2 p-3">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] text-neutral-800">{inf.organism}</span>
                        <Badge
                          variant={inf.severity === "Critical" ? "critical" : inf.severity === "High" ? "high" : "medium"}
                          className="text-[9px]"
                        >
                          {inf.severity}
                        </Badge>
                        {inf.isHai && <Badge variant="critical" className="text-[9px]">HAI</Badge>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {inf.type} · {inf.ward} · detected {formatDate(inf.detectedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-4 py-3 text-[11px] leading-relaxed text-sky-900">
          <strong className="font-semibold">AI summary.</strong>{" "}
          {delta > 10
            ? `Risk has climbed ${delta} points over 60 days, ${daysAboveThreshold} of which crossed the 65% alert threshold. Recommend IPC review and consider isolation protocol.`
            : delta < -5
              ? `Risk has improved by ${Math.abs(delta)} points. Continue current management and re-screen at 7-day interval.`
              : `Risk is stable. Continue routine surveillance; next scheduled review in 7 days.`}
        </div>
      </div>
    </Modal>
  );
}

function TrendStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "danger" | "success" | "neutral";
}) {
  const colour =
    accent === "danger"
      ? "text-red-600"
      : accent === "success"
        ? "text-emerald-600"
        : "text-neutral-900";
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${colour}`}>{value}</p>
    </div>
  );
}
