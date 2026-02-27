import { X } from "lucide-react";
import type { Patient } from "../../types";
import { Badge } from "../ui/badge";
import { severityColor } from "../../lib/utils";

interface BedPanelProps {
  patient: Patient;
  onClose: () => void;
}

function riskLevel(score: number): string {
  if (score > 0.75) return "Critical";
  if (score > 0.5) return "High";
  if (score > 0.25) return "Medium";
  return "Low";
}

function barShade(score: number): string {
  if (score > 0.75) return "#171717";
  if (score > 0.5) return "#404040";
  if (score > 0.25) return "#737373";
  return "#a3a3a3";
}

export function BedPanel({ patient, onClose }: BedPanelProps) {
  const level = riskLevel(patient.riskScore);

  return (
    <div className="absolute right-6 top-6 w-72 rounded-xl border border-neutral-700 bg-neutral-900 p-5 shadow-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{patient.name}</h3>
          <p className="text-[11px] text-neutral-400">
            Bed {patient.bedNumber} · {patient.ward}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">Risk Level</span>
          <Badge variant={severityColor(level)}>{level}</Badge>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Risk Score</span>
            <span className="text-sm font-bold text-white">
              {(patient.riskScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${patient.riskScore * 100}%`,
                backgroundColor: barShade(patient.riskScore),
              }}
            />
          </div>
        </div>

        <Stat label="Age / Gender" value={`${patient.age}y · ${patient.gender}`} />
        <Stat label="Status" value={patient.status} />
        <Stat label="Active Infections" value={String(patient.activeInfections)} />
        <Stat label="Admitted" value={new Date(patient.admittedAt).toLocaleDateString()} />

        {patient.organisms.length > 0 && (
          <div>
            <span className="text-xs text-neutral-400">Organisms</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {patient.organisms.map((org) => (
                <span
                  key={org}
                  className="rounded-md bg-neutral-700 px-2 py-0.5 text-[10px] font-medium text-neutral-300 ring-1 ring-inset ring-neutral-600"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}
