import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function riskColor(score: number): string {
  if (score > 0.75) return "bg-neutral-900 text-white shadow-sm";
  if (score > 0.5) return "bg-neutral-700 text-white shadow-sm";
  if (score > 0.25) return "bg-neutral-500 text-white shadow-sm";
  return "bg-neutral-300 text-neutral-800 shadow-sm";
}

export function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-neutral-900 text-white";
    case "high":
      return "bg-neutral-700 text-white";
    case "medium":
      return "bg-neutral-500 text-white";
    case "low":
      return "bg-neutral-300 text-neutral-800";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "critical":
      return "bg-neutral-900 text-white";
    case "suspected":
      return "bg-neutral-700 text-white";
    case "monitoring":
      return "bg-neutral-500 text-white";
    case "resolved":
    case "stable":
      return "bg-neutral-300 text-neutral-800";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}
