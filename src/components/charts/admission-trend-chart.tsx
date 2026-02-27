import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface AdmissionTrendChartProps {
  data: TrendPoint[];
  title?: string;
}

const GREY = { grid: "#e5e5e5", tick: "#737373", bar: "#404040", barHover: "#171717" };

export function AdmissionTrendChart({
  data,
  title = "Admission Trends",
}: AdmissionTrendChartProps) {
  const grouped = data.reduce<Record<string, number>>((acc, point) => {
    const key = point.date.split("T")[0]!;
    acc[key] = (acc[key] ?? 0) + point.count;
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([date, count]) => ({ date, admissions: count }))
    .slice(-14);

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-[11px] text-neutral-500">Last 14 days</span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GREY.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: GREY.tick }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: GREY.tick }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                fontFamily: "Inter, sans-serif",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                padding: "8px 12px",
              }}
            />
            <Bar dataKey="admissions" fill={GREY.bar} radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
