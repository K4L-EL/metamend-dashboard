import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getDateLocale(): string {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("metamed.settings.v1") : null;
    if (!raw) return "en-GB";
    const parsed = JSON.parse(raw) as { regionDateFormat?: string };
    switch (parsed.regionDateFormat) {
      case "MM/DD/YYYY":
        return "en-US";
      case "YYYY-MM-DD":
        return "sv-SE";
      case "DD/MM/YYYY":
      default:
        return "en-GB";
    }
  } catch {
    return "en-GB";
  }
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat(getDateLocale(), {
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
  if (score > 0.75) return "bg-red-600 text-white shadow-sm";
  if (score > 0.5) return "bg-neutral-500 text-white shadow-sm";
  if (score > 0.25) return "bg-sky-500 text-white shadow-sm";
  return "bg-neutral-300 text-neutral-800 shadow-sm";
}

export function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "critical";
    case "high": return "high";
    case "medium": return "medium";
    case "low": return "low";
    default: return "default";
  }
}

export function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "critical": return "critical";
    case "suspected": return "high";
    case "monitoring": return "monitoring";
    case "resolved":
    case "stable": return "resolved";
    default: return "default";
  }
}
