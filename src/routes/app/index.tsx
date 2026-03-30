import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, Users, Shield, Bell, AlertCircle } from "lucide-react";
import { Header } from "../../components/layout/header";
import { StatCard } from "../../components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { InfectionTrendChart } from "../../components/charts/infection-trend-chart";
import { RiskDistributionChart } from "../../components/charts/risk-distribution-chart";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, severityColor } from "../../lib/utils";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

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

  if (summary.loading) return <Loading />;

  const s = summary.data;

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Real-time infection intelligence overview"
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Infections"
            value={s?.activeInfections ?? 0}
            icon={<Activity className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="danger"
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
            subtitle={`Avg risk score: ${s?.riskScoreAverage ?? 0}`}
          />
          <StatCard
            title="Active Outbreaks"
            value={s?.activeOutbreaks ?? 0}
            icon={<Shield className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="danger"
          />
          <StatCard
            title="Pending Alerts"
            value={s?.pendingAlerts ?? 0}
            icon={<Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            accent="metamed"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {trends.data && (
            <InfectionTrendChart data={trends.data.infectionTrends} />
          )}
          {locations.data && (
            <RiskDistributionChart data={locations.data} />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <span className="text-xs text-neutral-400">
              {alerts.data?.length ?? 0} items
            </span>
          </CardHeader>
          <CardContent>
            {alerts.loading ? (
              <Loading size="sm" />
            ) : (
              <div className="space-y-2">
                {alerts.data?.slice(0, 5).map((alert) => (
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
                        <p className="text-sm font-medium text-neutral-900">{alert.title}</p>
                        <Badge variant={severityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                        {alert.description}
                      </p>
                      <p className="mt-1.5 text-[10px] text-neutral-400">
                        {formatDateTime(alert.createdAt)}
                      </p>
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
