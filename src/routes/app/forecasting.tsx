import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Maximize2, Minimize2, AlertTriangle, MapPin } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { ForecastChart } from "../../components/charts/forecast-chart";
import { RiskDistributionChart } from "../../components/charts/risk-distribution-chart";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/app/forecasting")({
  component: ForecastingPage,
});

function ForecastingPage() {
  const riskScores = useAsync(() => api.forecasts.getRiskScores(), []);
  const locationRisks = useAsync(() => api.forecasts.getLocationRisks(), []);
  const trends = useAsync(() => api.forecasts.getTrends(14), []);
  const [expandedChart, setExpandedChart] = useState<"forecast" | "location" | null>(null);

  if (riskScores.loading && locationRisks.loading) return <Loading />;

  const criticalPatients = riskScores.data
    ?.filter((s) => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) ?? [];

  return (
    <div>
      <Header
        title="Forecasting"
        subtitle="Risk analytics and predictive models"
      />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        {/* Charts — expandable */}
        {expandedChart !== "location" && (
          <div className={cn(expandedChart === "forecast" && "relative")}>
            {trends.data && (
              <div className="relative">
                <ForecastChart data={trends.data} />
                <button
                  onClick={() => setExpandedChart(expandedChart === "forecast" ? null : "forecast")}
                  className="absolute top-3 right-3 rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-500 shadow-sm hover:text-neutral-900"
                >
                  {expandedChart === "forecast" ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        )}

        {expandedChart !== "forecast" && (
          <div>
            {locationRisks.data && (
              <div className="relative">
                <RiskDistributionChart data={locationRisks.data} />
                <button
                  onClick={() => setExpandedChart(expandedChart === "location" ? null : "location")}
                  className="absolute top-3 right-3 rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-500 shadow-sm hover:text-neutral-900"
                >
                  {expandedChart === "location" ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Critical Risk Patients */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle>Critical Risk Patients</CardTitle>
            </div>
            <span className="text-[11px] text-neutral-400">
              Highest combined risk scores
            </span>
          </CardHeader>
          <CardContent>
            {riskScores.loading ? (
              <Loading />
            ) : criticalPatients.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-neutral-400">No critical risk patients detected</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Key Risk Factors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalPatients.map((score) => (
                    <TableRow key={score.patientId}>
                      <TableCell className="font-medium text-neutral-900">
                        {score.patientName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <MapPin className="h-3 w-3" />
                          {score.ward}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                score.score > 0.75 ? "bg-red-500" : "bg-amber-500",
                              )}
                              style={{ width: `${score.score * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-neutral-600">
                            {(score.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={score.riskLevel === "Critical" ? "critical" : "high"}>
                          {score.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {score.topFactors.map((factor) => (
                            <Badge key={factor} variant="info" className="text-[10px]">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
