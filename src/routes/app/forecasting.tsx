import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { ForecastChart } from "../../components/charts/forecast-chart";
import { RiskDistributionChart } from "../../components/charts/risk-distribution-chart";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { severityColor } from "../../lib/utils";

export const Route = createFileRoute("/app/forecasting")({
  component: ForecastingPage,
});

function ForecastingPage() {
  const riskScores = useAsync(() => api.forecasts.getRiskScores(), []);
  const locationRisks = useAsync(() => api.forecasts.getLocationRisks(), []);
  const trends = useAsync(() => api.forecasts.getTrends(14), []);

  if (riskScores.loading && locationRisks.loading) return <Loading />;

  return (
    <div>
      <Header
        title="Forecasting"
        subtitle="Risk analytics and predictive models"
      />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {trends.data && <ForecastChart data={trends.data} />}
          {locationRisks.data && (
            <RiskDistributionChart data={locationRisks.data} />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Risk Scores</CardTitle>
            <span className="text-[11px] text-muted-light">
              Ranked by infection risk
            </span>
          </CardHeader>
          <CardContent>
            {riskScores.loading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Top Risk Factors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskScores.data?.map((score) => (
                    <TableRow key={score.patientId}>
                      <TableCell className="font-medium text-primary">
                        {score.patientName}
                      </TableCell>
                      <TableCell>{score.ward}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted">
                        {(score.score * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityColor(score.riskLevel)}>
                          {score.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {score.topFactors.map((factor) => (
                            <Badge key={factor} className="text-[10px]">
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
