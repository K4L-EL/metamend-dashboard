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
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
            {title}
          </p>
          <p className="text-[28px] font-semibold leading-tight tracking-tight text-neutral-900">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-neutral-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-neutral-100 p-2.5 text-neutral-600 transition-colors group-hover:bg-neutral-200 group-hover:text-neutral-900">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
          {trend.value < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-neutral-600" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5 text-neutral-600" />
          )}
          <span className="text-[11px] font-semibold text-neutral-700">
            {trend.value >= 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-[11px] text-neutral-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
