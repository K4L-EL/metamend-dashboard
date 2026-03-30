import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, Users, Shield, Bell, AlertCircle, ArrowRight, TrendingUp as TrendUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Header } from "../../components/layout/header";
import { StatCard } from "../../components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { InfectionTrendChart } from "../../components/charts/infection-trend-chart";
import { RiskDistributionChart } from "../../components/charts/risk-distribution-chart";
import { AdmissionTrendChart } from "../../components/charts/admission-trend-chart";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, severityColor } from "../../lib/utils";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function MiniTrendChart({ color }: { color: string }) {
  const points = Array.from({ length: 14 }, (_, i) => ({
    day: i,
    v: Math.max(0, Math.floor(Math.random() * 8) + (i > 7 ? 2 : 0)),
  }));
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
        <XAxis dataKey="day" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 10, borderRadius: 6, border: "1px solid #e5e5e5", padding: "4px 8px" }}
          formatter={(v: number) => [v, "Count"]}
          labelFormatter={(l) => `Day ${l}`}
        />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const FEED_ICONS: Record<string, string> = {
  infection: "bg-red-50 text-red-500",
  outbreak: "bg-red-50 text-red-600",
  risk: "bg-neutral-100 text-neutral-500",
  compliance: "bg-sky-50 text-sky-600",
};

function DashboardPage() {
  const navigate = useNavigate();
  const summary = useAsync(() => api.dashboard.getSummary(), []);
  const trends = useAsync(() => api.dashboard.getTrends(30), []);
  const alerts = useAsync(() => api.alerts.getAll(true), []);
  const locations = useAsync(() => api.forecasts.getLocationRisks(), []);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  if (summary.loading) return <Loading />;

  const s = summary.data;
  const toggle = (id: string) => setExpandedCard((prev) => (prev === id ? null : id));

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Real-time infection intelligence overview"
      />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Infections"
            value={s?.activeInfections ?? 0}
            icon={<Activity className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="danger"
            onClick={() => toggle("infections")}
            expanded={expandedCard === "infections"}
            expandedContent={<MiniTrendChart color="#dc2626" />}
            trend={
              s
                ? { value: s.infectionRateChange, label: "vs last period" }
                : undefined
            }
          />
          <StatCard
            title="Patients at Risk"
            value={s?.patientsAtRisk ?? 0}
            icon={<Users className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="warning"
            onClick={() => toggle("risk")}
            expanded={expandedCard === "risk"}
            expandedContent={<MiniTrendChart color="#737373" />}
            subtitle={`Avg risk score: ${s?.riskScoreAverage ?? 0}`}
          />
          <StatCard
            title="Active Outbreaks"
            value={s?.activeOutbreaks ?? 0}
            icon={<Shield className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="danger"
            onClick={() => toggle("outbreaks")}
            expanded={expandedCard === "outbreaks"}
            expandedContent={<MiniTrendChart color="#dc2626" />}
          />
          <StatCard
            title="Pending Alerts"
            value={s?.pendingAlerts ?? 0}
            icon={<Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="metamed"
            onClick={() => toggle("alerts")}
            expanded={expandedCard === "alerts"}
            expandedContent={<MiniTrendChart color="#0ea5e9" />}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {trends.data && (
            <InfectionTrendChart data={trends.data.infectionTrends} />
          )}
          {locations.data && (
            <RiskDistributionChart
              data={locations.data}
            />
          )}
        </div>

        {trends.data && (
          <AdmissionTrendChart data={trends.data.admissionTrends} />
        )}

        {/* News Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendUp className="h-4 w-4 text-sky-600" />
              <CardTitle>Activity Feed</CardTitle>
            </div>
            <span className="text-[11px] text-neutral-400">
              {alerts.data?.length ?? 0} items
            </span>
          </CardHeader>
          <CardContent>
            {alerts.loading ? (
              <Loading size="sm" />
            ) : (
              <div className="space-y-2">
                {alerts.data?.slice(0, 8).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex cursor-pointer items-start gap-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3.5 transition-colors hover:bg-neutral-50"
                    onClick={() => {
                      const cat = alert.category.toLowerCase();
                      if (cat === "infection") navigate({ to: "/app/surveillance" });
                      else if (cat === "outbreak") navigate({ to: "/app/outbreaks" });
                      else if (cat === "compliance") navigate({ to: "/app/screening" });
                      else navigate({ to: "/app/alerts" });
                    }}
                  >
                    <div className={`mt-0.5 rounded-md p-1.5 ${FEED_ICONS[alert.category.toLowerCase()] ?? "bg-neutral-100 text-neutral-500"}`}>
                      <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-neutral-900">{alert.title}</p>
                        <Badge variant={severityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                        {alert.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="text-[10px] text-neutral-400">
                          {formatDateTime(alert.createdAt)}
                        </p>
                        <ArrowRight className="h-3 w-3 text-neutral-300" />
                        <span className="text-[10px] text-sky-600">{alert.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
