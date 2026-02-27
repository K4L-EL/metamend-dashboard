import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TrendPoint } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface InfectionTrendChartProps {
  data: TrendPoint[];
  title?: string;
}

const GREY = {
  grid: "#e5e5e5",
  tick: "#737373",
  dark: "#404040",
  darkFill: "rgba(64, 64, 64, 0.08)",
  light: "#737373",
  lightFill: "rgba(115, 115, 115, 0.06)",
};

export function InfectionTrendChart({
  data,
  title = "Infection Trends",
}: InfectionTrendChartProps) {
  const grouped = data.reduce<Record<string, { date: string; HAI: number; Community: number }>>(
    (acc, point) => {
      const key = point.date.split("T")[0]!;
      if (!acc[key]) acc[key] = { date: key, HAI: 0, Community: 0 };
      if (point.category === "HAI") acc[key]!.HAI = point.count;
      else acc[key]!.Community = point.count;
      return acc;
    },
    {},
  );

  const chartData = Object.values(grouped).slice(-14);

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-[11px] text-neutral-500">Last 14 days</span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
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
            <Legend
              iconSize={6}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "#737373" }}
            />
            <Area
              type="monotone"
              dataKey="HAI"
              stroke={GREY.dark}
              fill={GREY.darkFill}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="Community"
              stroke={GREY.light}
              fill={GREY.lightFill}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
