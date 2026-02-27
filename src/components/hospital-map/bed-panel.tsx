import { X } from "lucide-react";
import type { Patient } from "../../types";
import { Badge } from "../ui/badge";
import { severityColor } from "../../lib/utils";

interface BedPanelProps {
  patient: Patient;
  onClose: () => void;
  light: boolean;
}

function riskLevel(score: number): string {
  if (score > 0.75) return "Critical";
  if (score > 0.5) return "High";
  if (score > 0.25) return "Medium";
  return "Low";
}

function barShade(score: number, light: boolean): string {
  if (light) {
    if (score > 0.75) return "#525252";
    if (score > 0.5) return "#737373";
    if (score > 0.25) return "#a3a3a3";
    return "#d4d4d4";
  }
  if (score > 0.75) return "#171717";
  if (score > 0.5) return "#404040";
  if (score > 0.25) return "#737373";
  return "#a3a3a3";
}

export function BedPanel({ patient, onClose, light }: BedPanelProps) {
  const level = riskLevel(patient.riskScore);

  return (
    <div
      className={`absolute right-4 top-14 w-64 rounded-xl border p-4 shadow-2xl sm:right-6 sm:top-6 sm:w-72 sm:p-5 ${
        light
          ? "border-neutral-300 bg-white"
          : "border-neutral-700 bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-sm font-semibold ${light ? "text-neutral-900" : "text-white"}`}>{patient.name}</h3>
          <p className={`text-[11px] ${light ? "text-neutral-500" : "text-neutral-400"}`}>
            Bed {patient.bedNumber} · {patient.ward}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`rounded-md p-1 transition-colors ${
            light ? "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800" : "text-neutral-500 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs ${light ? "text-neutral-500" : "text-neutral-400"}`}>Risk Level</span>
          <Badge variant={severityColor(level)}>{level}</Badge>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${light ? "text-neutral-500" : "text-neutral-400"}`}>Risk Score</span>
            <span className={`text-sm font-bold ${light ? "text-neutral-900" : "text-white"}`}>
              {(patient.riskScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${light ? "bg-neutral-200" : "bg-neutral-800"}`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${patient.riskScore * 100}%`, backgroundColor: barShade(patient.riskScore, light) }}
            />
          </div>
        </div>

        <Stat label="Age / Gender" value={`${patient.age}y · ${patient.gender}`} light={light} />
        <Stat label="Status" value={patient.status} light={light} />
        <Stat label="Active Infections" value={String(patient.activeInfections)} light={light} />
        <Stat label="Admitted" value={new Date(patient.admittedAt).toLocaleDateString()} light={light} />

        {patient.organisms.length > 0 && (
          <div>
            <span className={`text-xs ${light ? "text-neutral-500" : "text-neutral-400"}`}>Organisms</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {patient.organisms.map((org) => (
                <span
                  key={org}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    light ? "bg-neutral-100 text-neutral-600" : "bg-neutral-700 text-neutral-300"
                  }`}
                >
                  {org}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, light }: { label: string; value: string; light: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${light ? "text-neutral-500" : "text-neutral-400"}`}>{label}</span>
      <span className={`text-xs font-medium ${light ? "text-neutral-900" : "text-white"}`}>{value}</span>
    </div>
  );
}
