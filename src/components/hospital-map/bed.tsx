import { useState, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";
import { Color, MathUtils } from "three";
import type { Patient } from "../../types";

interface BedProps {
  position: [number, number, number];
  patient: Patient | null;
  bedId: string;
  onSelect?: (patient: Patient) => void;
}

const COLOR_FRAME = new Color("#171717");
const COLOR_PILLOW = new Color("#404040");
const COLOR_EMPTY_BED = new Color("#262626");

const STATUS_RED = new Color("#dc2626");
const STATUS_YELLOW = new Color("#ca8a04");
const STATUS_GREEN = new Color("#16a34a");
const STATUS_EMPTY_INDICATOR = new Color("#404040");

function getBedColor(patient: Patient | null): Color {
  if (!patient) return COLOR_EMPTY_BED;
  if (patient.activeInfections > 0) return new Color("#2a1a1a");
  if (patient.riskScore > 0.6) return new Color("#2a2a1a");
  return new Color("#1a2a1a");
}

function getIndicatorColor(patient: Patient | null): Color {
  if (!patient) return STATUS_EMPTY_INDICATOR;
  if (patient.activeInfections > 0) return STATUS_RED;
  if (patient.riskScore > 0.6) return STATUS_YELLOW;
  return STATUS_GREEN;
}

function getStatusLabel(patient: Patient | null): string {
  if (!patient) return "Empty";
  if (patient.activeInfections > 0) return "Infected";
  if (patient.riskScore > 0.6) return "At Risk";
  if (patient.status === "Monitoring") return "Monitoring";
  return "Stable";
}

export function Bed({ position, patient, bedId, onSelect }: BedProps) {
  const groupRef = useRef<Mesh>(null);
  const indicatorRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const bedColor = useMemo(() => getBedColor(patient), [patient]);
  const indicatorColor = useMemo(() => getIndicatorColor(patient), [patient]);
  const isInfected = patient !== null && patient.activeInfections > 0;
  const hasPatient = patient !== null;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const targetY = hovered ? position[1] + 0.04 : position[1];
    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetY, delta * 10);

    if (isInfected) {
      const t = clock.getElapsedTime();
      const pulse = 0.15 + Math.sin(t * 3) * 0.1;
      const mat = groupRef.current.children[0] as Mesh;
      if (mat?.material) {
        (mat.material as unknown as { emissiveIntensity: number }).emissiveIntensity = pulse;
      }
    }

    if (indicatorRef.current && hasPatient) {
      const t = clock.getElapsedTime();
      const bob = Math.sin(t * 2 + position[0] * 3) * 0.015;
      indicatorRef.current.position.y = position[1] + 0.3 + bob;
      const mat = indicatorRef.current.material as unknown as { emissiveIntensity: number };
      if (isInfected) {
        mat.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.3;
      }
    }
  });

  return (
    <group>
      {/* Status indicator dot floating above the bed */}
      {hasPatient && (
        <mesh
          ref={indicatorRef}
          position={[position[0], position[1] + 0.3, position[2]]}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={indicatorColor}
            emissive={indicatorColor}
            emissiveIntensity={isInfected ? 0.8 : 0.5}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      )}

      <group
        ref={groupRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = patient ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (patient && onSelect) onSelect(patient);
        }}
      >
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.06, 0.7]} />
          <meshStandardMaterial color={COLOR_FRAME} roughness={0.8} />
        </mesh>

        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.64]} />
          <meshStandardMaterial
            color={bedColor}
            emissive={bedColor}
            emissiveIntensity={isInfected ? 0.2 : hovered ? 0.15 : 0.05}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>

        <mesh position={[0, 0.09, -0.22]} castShadow>
          <boxGeometry args={[0.24, 0.04, 0.15]} />
          <meshStandardMaterial
            color={patient ? COLOR_PILLOW : COLOR_FRAME}
            roughness={0.7}
          />
        </mesh>

        <mesh position={[0, 0.12, -0.34]}>
          <boxGeometry args={[0.36, 0.16, 0.02]} />
          <meshStandardMaterial color={COLOR_FRAME} roughness={0.6} metalness={0.2} />
        </mesh>
      </group>

      {hovered && (
        <Html
          position={[position[0], position[1] + 0.5, position[2]]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div className="w-44 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-neutral-400">Bed {bedId}</span>
              <span className="text-[9px] font-semibold text-neutral-300">
                {getStatusLabel(patient)}
              </span>
            </div>
            {patient ? (
              <div className="mt-1.5">
                <p className="text-[11px] font-semibold text-white">{patient.name}</p>
                <p className="text-[9px] text-neutral-400">{patient.age}y · {patient.gender}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="h-1 overflow-hidden rounded-full bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-neutral-400"
                        style={{ width: `${patient.riskScore * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] tabular-nums text-neutral-400">
                    {(patient.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
                {patient.organisms.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {patient.organisms.map((org) => (
                      <span key={org} className="rounded bg-neutral-700 px-1 py-0.5 text-[8px] text-neutral-300">
                        {org}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-[10px] text-neutral-500">Unoccupied</p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
