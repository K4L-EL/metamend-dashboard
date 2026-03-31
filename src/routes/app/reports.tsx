import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  FileText,
  Printer,
  Loader2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Activity,
  Users,
  Shield,
  ClipboardCheck,
  Plug,
  Network,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import type {
  ReportResponse,
  ReportSection,
  ReportChartData,
  ReportTable,
  ReportMetric,
  ReportExecutiveSummary,
} from "../../types";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});

const CHART_COLORS = [
  "#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#14b8a6", "#84cc16", "#f43f5e", "#a855f7", "#06b6d4",
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  ok: "#22c55e",
};

function ReportsPage() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.reports.generate();
      setReport(data);
    } catch (e) {
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report && !loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-50">
            <FileText className="h-10 w-10 text-sky-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">
            IPC Surveillance Report
          </h1>
          <p className="mb-2 text-sm text-neutral-500">
            Generate a comprehensive infection prevention and control report
            inspired by the{" "}
            <a
              href="https://www.gov.uk/government/publications/english-surveillance-programme-antimicrobial-utilisation-and-resistance-espaur-report"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
            >
              ESPAUR reporting standard
            </a>
            . The report includes detailed charts, data tables, and AI-generated
            analysis across all domains.
          </p>
          <p className="mb-8 text-xs text-neutral-400">
            Powered by Azure OpenAI (GPT-4o) and real-time dashboard data
          </p>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Generate Report
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">
            Generating Report...
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Analysing data and generating AI narratives for each section
          </p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const sections: { key: string; icon: LucideIcon; data: ReportSection }[] = [
    { key: "infections", icon: Activity, data: report.infectionBurden },
    { key: "resistance", icon: TrendingUp, data: report.resistancePatterns },
    { key: "patients", icon: Users, data: report.patientRisk },
    { key: "outbreaks", icon: Shield, data: report.outbreakAnalysis },
    { key: "screening", icon: ClipboardCheck, data: report.screeningCompliance },
    { key: "devices", icon: Plug, data: report.deviceInfections },
    { key: "transmission", icon: Network, data: report.transmissionAnalysis },
    { key: "recommendations", icon: Lightbulb, data: report.recommendations },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Toolbar - hidden in print */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur-sm print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-sky-600" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-900">
              {report.title}
            </h1>
            <p className="text-[10px] text-neutral-400">
              Generated{" "}
              {new Date(report.generatedAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              · Period: {report.period}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateReport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <BarChart3 className="h-3 w-3" />
            Regenerate
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <Printer className="h-3 w-3" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="mx-auto max-w-[900px] px-6 py-8 print:max-w-none print:px-0">
        {/* Cover */}
        <div className="mb-10 rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-950 to-neutral-800 p-10 text-white print:rounded-none print:border-0">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/logo.svg"
              alt="MetaMed"
              className="h-10 w-10 rounded-lg"
            />
            <div>
              <span className="text-lg font-bold tracking-tight">MetaMed</span>
              <span className="ml-1 text-xs font-medium text-neutral-400">
                Intelligence
              </span>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold">{report.title}</h1>
          <p className="text-sm text-neutral-300">
            Reporting Period: {report.period}
          </p>
          <p className="text-xs text-neutral-500">
            Generated:{" "}
            {new Date(report.generatedAt).toLocaleString("en-GB", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-10 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Table of Contents
          </h2>
          <ol className="space-y-1.5">
            <li className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-50 text-[10px] font-bold text-sky-700">
                1
              </span>
              Executive Summary
            </li>
            {sections.map((s, i) => (
              <li
                key={s.key}
                className="flex items-center gap-2 text-sm text-neutral-600"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-100 text-[10px] font-bold text-neutral-600">
                  {i + 2}
                </span>
                {s.data.title}
              </li>
            ))}
          </ol>
        </div>

        {/* Executive Summary */}
        <SectionWrapper
          number={1}
          title="Executive Summary"
          icon={BarChart3}
          defaultOpen
        >
          <ExecutiveSummaryBlock data={report.executiveSummary} />
        </SectionWrapper>

        {/* Report Sections */}
        {sections.map((s, i) => (
          <SectionWrapper
            key={s.key}
            number={i + 2}
            title={s.data.title}
            icon={s.icon}
            defaultOpen
          >
            <SectionBlock data={s.data} />
          </SectionWrapper>
        ))}

        {/* Footer */}
        <div className="mt-10 border-t border-neutral-200 pt-6 text-center print:mt-4">
          <p className="text-[10px] text-neutral-400">
            This report was generated by MetaMed Intelligence Platform using
            Azure OpenAI (GPT-4o). Data is sourced from the hospital IPC
            surveillance system. Report format inspired by the{" "}
            <a
              href="https://www.gov.uk/government/publications/english-surveillance-programme-antimicrobial-utilisation-and-resistance-espaur-report"
              className="text-sky-600 hover:underline"
            >
              ESPAUR Report (UKHSA)
            </a>
            .
          </p>
          <p className="mt-1 text-[10px] text-neutral-300">
            Confidential — For authorised clinical personnel only
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section Wrapper ---------- */

function SectionWrapper({
  number,
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  number: number;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 rounded-xl border border-neutral-200 bg-white overflow-hidden print:mb-4 print:break-inside-avoid-page">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-neutral-50 print:hover:bg-white"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700">
          {number}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
        <h2 className="flex-1 text-sm font-bold text-neutral-900">{title}</h2>
        <span className="print:hidden">
          {open ? (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
        </span>
      </button>
      {open && <div className="border-t border-neutral-100 px-6 py-5">{children}</div>}
    </div>
  );
}

/* ---------- Executive Summary Block ---------- */

function ExecutiveSummaryBlock({ data }: { data: ReportExecutiveSummary }) {
  return (
    <div className="space-y-6">
      {data.narrative && (
        <p className="text-sm leading-relaxed text-neutral-700">
          {data.narrative}
        </p>
      )}
      <MetricGrid metrics={data.keyMetrics} />
      {data.charts.map((c, i) => (
        <ChartBlock key={i} data={c} />
      ))}
    </div>
  );
}

/* ---------- Section Block ---------- */

function SectionBlock({ data }: { data: ReportSection }) {
  return (
    <div className="space-y-6">
      {data.narrative && (
        <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-4 py-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
            {data.narrative}
          </p>
        </div>
      )}
      {data.keyMetrics.length > 0 && <MetricGrid metrics={data.keyMetrics} />}
      {data.charts.map((c, i) => (
        <ChartBlock key={i} data={c} />
      ))}
      {data.tables.map((t, i) => (
        <TableBlock key={i} data={t} />
      ))}
    </div>
  );
}

/* ---------- Metric Grid ---------- */

function MetricGrid({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5"
        >
          <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            {m.label}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900">
              {m.value}
            </span>
            {m.change && (
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  m.change.startsWith("-")
                    ? "text-green-600"
                    : m.change.startsWith("+")
                      ? "text-red-600"
                      : "text-neutral-500",
                )}
              >
                {m.change}
              </span>
            )}
          </div>
          {m.severity && (
            <div
              className="mt-1 h-1 w-full rounded-full"
              style={{
                backgroundColor:
                  SEVERITY_COLORS[m.severity] ?? SEVERITY_COLORS.ok,
                opacity: 0.4,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Chart Block ---------- */

function ChartBlock({ data }: { data: ReportChartData }) {
  const chartData = data.labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    data.series.forEach((s) => {
      point[s.name] = s.values[i] ?? 0;
    });
    return point;
  });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-semibold text-neutral-700">
        {data.title}
      </h4>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {data.chartType === "bar" ? (
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#737373" }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10, fill: "#737373" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {data.series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : data.chartType === "line" ? (
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#737373" }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10, fill: "#737373" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {data.series.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                dataKey={data.series[0]?.name || "Count"}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: "#a3a3a3", strokeWidth: 1 }}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------- Table Block ---------- */

function TableBlock({ data }: { data: ReportTable }) {
  if (data.rows.length === 0) return null;
  return (
    <div className="rounded-lg border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200">
        <h4 className="text-xs font-semibold text-neutral-700">{data.title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              {data.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-neutral-50 transition-colors hover:bg-neutral-50"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 text-xs text-neutral-700 whitespace-nowrap"
                  >
                    {renderCell(cell, data.headers[ci])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderCell(value: string, header?: string) {
  if (header === "Severity" || header === "Status" || header === "Trend") {
    const colors: Record<string, string> = {
      Critical: "bg-red-100 text-red-700",
      High: "bg-orange-100 text-orange-700",
      Medium: "bg-amber-100 text-amber-700",
      Low: "bg-green-100 text-green-700",
      Active: "bg-sky-100 text-sky-700",
      Monitoring: "bg-yellow-100 text-yellow-700",
      Rising: "bg-red-100 text-red-700",
      Stable: "bg-green-100 text-green-700",
      Declining: "bg-blue-100 text-blue-700",
    };
    return (
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
          colors[value] || "bg-neutral-100 text-neutral-600",
        )}
      >
        {value}
      </span>
    );
  }
  if (header === "HAI") {
    return (
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
          value === "Yes"
            ? "bg-red-100 text-red-700"
            : "bg-neutral-100 text-neutral-600",
        )}
      >
        {value}
      </span>
    );
  }
  return value;
}
