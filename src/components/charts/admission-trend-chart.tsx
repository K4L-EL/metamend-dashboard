import {
  AreaChart,
  Area,
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
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#737373" }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#737373" }}
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
            <Area
              type="monotone"
              dataKey="admissions"
              stroke="#0d9488"
              strokeWidth={2}
              fill="url(#admissionGradient)"
              dot={{ r: 3, fill: "#0d9488", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
