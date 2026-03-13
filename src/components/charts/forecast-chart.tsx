import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import type { ForecastTrend } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface ForecastChartProps {
  data: ForecastTrend[];
  title?: string;
}

const COLORS = {
  grid: "#e5e5e5",
  tick: "#737373",
  fill: "rgba(13, 148, 136, 0.06)",
  predicted: "#0d9488",
  actual: "#737373",
};

export function ForecastChart({
  data,
  title = "Infection Forecast",
}: ForecastChartProps) {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-[11px] text-neutral-500">14-day projection</span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: COLORS.tick }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: COLORS.tick }}
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
              dataKey="upperBound"
              stroke="none"
              fill={COLORS.fill}
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="#ffffff"
            />
            <Line
              type="monotone"
              dataKey="predictedCount"
              stroke={COLORS.predicted}
              strokeWidth={2}
              dot={false}
              name="Predicted"
            />
            <Line
              type="monotone"
              dataKey="actualCount"
              stroke={COLORS.actual}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2.5, fill: COLORS.actual, strokeWidth: 0 }}
              name="Actual"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
