import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/table";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDate, cn } from "../../lib/utils";

export const Route = createFileRoute("/app/resistance")({
  component: ResistancePage,
});

function trendIcon(trend: string) {
  switch (trend.toLowerCase()) {
    case "increasing":
      return <TrendingUp className="h-3.5 w-3.5 text-neutral-900" strokeWidth={2} />;
    case "decreasing":
      return <TrendingDown className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />;
    default:
      return <Minus className="h-3.5 w-3.5 text-neutral-300" strokeWidth={2} />;
  }
}

function rateShade(rate: number): string {
  if (rate > 0.5) return "bg-neutral-900";
  if (rate > 0.25) return "bg-neutral-700";
  if (rate > 0.1) return "bg-neutral-500";
  return "bg-neutral-400";
}

function ResistancePage() {
  const summaries = useAsync(() => api.resistance.getSummaries(), []);
  const prescriptions = useAsync(() => api.resistance.getPrescriptions(), []);

  return (
    <div>
      <Header title="Antimicrobial Resistance" subtitle="Resistance patterns and prescribing surveillance" />
      <div className="space-y-6 p-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Antibiotic Prescriptions</CardTitle>
            <span className="text-[11px] text-neutral-500">Active and recent</span>
          </CardHeader>
          <CardContent>
            {prescriptions.loading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Antibiotic</TableHead>
                    <TableHead>Indication</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Appropriate</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.data?.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium text-neutral-900">{rx.patientName}</TableCell>
                      <TableCell className="font-mono text-[11px] text-neutral-500">{rx.antibiotic}</TableCell>
                      <TableCell>{rx.indication}</TableCell>
                      <TableCell className="text-[12px] text-neutral-500">{rx.durationDays}d</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rx.status === "Active"
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-100 text-neutral-600"
                          }
                        >
                          {rx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rx.appropriate ? (
                          <span className="inline-block h-2 w-2 rounded-full bg-neutral-400" />
                        ) : (
                          <Badge variant="bg-neutral-700 text-white">
                            Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[12px] text-neutral-500">{formatDate(rx.startDate)}</TableCell>
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
