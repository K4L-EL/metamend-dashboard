import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const VARIANTS: Record<string, string> = {
  default: "bg-neutral-100 text-neutral-600",
  critical: "bg-red-50 text-red-700 border border-red-200",
  high: "bg-neutral-100 text-neutral-700 border border-neutral-300",
  medium: "bg-sky-50 text-sky-700 border border-sky-200",
  low: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  success: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  info: "bg-sky-50 text-sky-700 border border-sky-200",
  metamed: "bg-sky-50 text-sky-700 border border-sky-200",
  outbreak: "bg-red-50 text-red-700 border border-red-200",
  monitoring: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  resolved: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  new: "bg-sky-50 text-sky-700 border border-sky-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

export function Badge({ className, variant, ...props }: BadgeProps) {
  const variantClass = (variant && VARIANTS[variant.toLowerCase()]) ?? VARIANTS.default;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variantClass,
        className,
      )}
      {...props}
    />
  );
}
