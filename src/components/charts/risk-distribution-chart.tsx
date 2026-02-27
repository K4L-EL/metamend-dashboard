import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LocationRisk } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface RiskDistributionChartProps {
  data: LocationRisk[];
  title?: string;
}

function barShade(score: number): string {
  if (score > 0.75) return "#171717";
  if (score > 0.5) return "#404040";
  if (score > 0.25) return "#737373";
  return "#a3a3a3";
}

export function RiskDistributionChart({
  data,
  title = "Location Risk Scores",
}: RiskDistributionChartProps) {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-[11px] text-neutral-500">{data.length} locations</span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: "#737373" }}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={72}
              tick={{ fontSize: 10, fill: "#525252" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              contentStyle={{
                fontSize: 11,
                fontFamily: "Inter, sans-serif",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                padding: "8px 12px",
              }}
            />
            <Bar dataKey="riskScore" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry: LocationRisk) => (
                <Cell key={entry.locationId} fill={barShade(entry.riskScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
