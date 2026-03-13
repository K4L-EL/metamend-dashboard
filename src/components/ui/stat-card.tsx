import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { TrendingDown, TrendingUp, ChevronDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  accent?: "metamed" | "danger" | "warning" | "success";
  onClick?: () => void;
  expanded?: boolean;
  expandedContent?: ReactNode;
}

const ACCENT_MAP = {
  metamed: {
    icon: "bg-teal-50 text-teal-600 group-hover:bg-teal-100",
    trend: "text-teal-700",
    bar: "bg-teal-500",
  },
  danger: {
    icon: "bg-red-50 text-red-600 group-hover:bg-red-100",
    trend: "text-red-700",
    bar: "bg-red-500",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
    trend: "text-amber-700",
    bar: "bg-amber-500",
  },
  success: {
    icon: "bg-green-50 text-green-600 group-hover:bg-green-100",
    trend: "text-green-700",
    bar: "bg-green-500",
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
  onClick,
  expanded,
  expandedContent,
}: StatCardProps) {
  const colors = accent ? ACCENT_MAP[accent] : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {colors && (
        <div className={cn("absolute top-0 left-0 h-[2px] w-full", colors.bar)} />
      )}
      <div className="p-5">
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
          <div className="flex items-center gap-2">
            {icon && (
              <div
                className={cn(
                  "rounded-lg p-2.5 transition-colors",
                  colors?.icon ?? "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200 group-hover:text-neutral-900",
                )}
              >
                {icon}
              </div>
            )}
            {onClick && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-neutral-400 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            )}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
            {trend.value < 0 ? (
              <TrendingDown className={cn("h-3.5 w-3.5", colors?.trend ?? "text-neutral-600")} />
            ) : (
              <TrendingUp className={cn("h-3.5 w-3.5", colors?.trend ?? "text-neutral-600")} />
            )}
            <span className={cn("text-[11px] font-semibold", colors?.trend ?? "text-neutral-700")}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value.toFixed(1)}%
            </span>
            <span className="text-[11px] text-neutral-500">{trend.label}</span>
          </div>
        )}
      </div>
      {expanded && expandedContent && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-5">
          {expandedContent}
        </div>
      )}
    </div>
  );
}
