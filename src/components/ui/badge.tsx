import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const VARIANTS: Record<string, string> = {
  default: "bg-neutral-100 text-neutral-600",
  critical: "bg-red-50 text-red-700 border border-red-200",
  high: "bg-amber-50 text-amber-700 border border-amber-200",
  medium: "bg-teal-50 text-teal-700 border border-teal-200",
  low: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  success: "bg-green-50 text-green-700 border border-green-200",
  info: "bg-teal-50 text-teal-700 border border-teal-200",
  metamed: "bg-teal-50 text-teal-700 border border-teal-200",
  outbreak: "bg-red-50 text-red-700 border border-red-200",
  monitoring: "bg-amber-50 text-amber-700 border border-amber-200",
  resolved: "bg-green-50 text-green-700 border border-green-200",
  new: "bg-teal-50 text-teal-700 border border-teal-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

export function Badge({ className, variant, ...props }: BadgeProps) {
  const variantClass = (variant && VARIANTS[variant.toLowerCase()]) ?? VARIANTS.default;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        variantClass,
        className,
      )}
      {...props}
    />
  );
}
