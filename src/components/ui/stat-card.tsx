import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  accent?: "metamed" | "danger" | "warning" | "success";
}

const ACCENT_MAP = {
  metamed: {
    icon: "bg-sky-50 text-sky-600",
    trend: "text-sky-700",
    bar: "bg-sky-500",
  },
  danger: {
    icon: "bg-red-50 text-red-600",
    trend: "text-red-700",
    bar: "bg-red-500",
  },
  warning: {
    icon: "bg-neutral-100 text-neutral-600",
    trend: "text-neutral-700",
    bar: "bg-neutral-500",
  },
  success: {
    icon: "bg-neutral-100 text-neutral-500",
    trend: "text-neutral-600",
    bar: "bg-neutral-400",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  accent,
}: StatCardProps) {
  const colors = accent ? ACCENT_MAP[accent] : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm",
        className,
      )}
    >
      {colors && (
        <div className={cn("absolute top-0 left-0 h-[2px] w-full", colors.bar)} />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {title}
            </p>
            <p className="text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-neutral-500">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "rounded-lg p-2.5",
                colors?.icon ?? "bg-neutral-100 text-neutral-600",
              )}
            >
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
            {trend.value < 0 ? (
              <TrendingDown className={cn("h-3.5 w-3.5", colors?.trend ?? "text-neutral-600")} />
            ) : (
              <TrendingUp className={cn("h-3.5 w-3.5", colors?.trend ?? "text-neutral-600")} />
            )}
            <span className={cn("text-xs font-semibold", colors?.trend ?? "text-neutral-700")}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value.toFixed(1)}%
            </span>
            <span className="text-xs text-neutral-500">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
