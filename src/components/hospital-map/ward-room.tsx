import { Html } from "@react-three/drei";
import type { LocationRisk, Patient } from "../../types";
import { Bed } from "./bed";

interface WardRoomProps {
  location: LocationRisk;
  patients: Patient[];
  position: [number, number, number];
  size: [number, number, number];
  bedLayout: { cols: number; rows: number };
  onSelectPatient?: (patient: Patient) => void;
}

function generateBedPositions(
  wardPos: [number, number, number],
  wardSize: [number, number, number],
  layout: { cols: number; rows: number },
): { position: [number, number, number]; bedIndex: number }[] {
  const beds: { position: [number, number, number]; bedIndex: number }[] = [];
  const padX = 0.35;
  const padZ = 0.3;
  const innerW = wardSize[0] - padX * 2;
  const innerD = wardSize[2] - padZ * 2;
  const spacingX = layout.cols > 1 ? innerW / (layout.cols - 1) : 0;
  const spacingZ = layout.rows > 1 ? innerD / (layout.rows - 1) : 0;

  const startX = wardPos[0] - innerW / 2;
  const startZ = wardPos[2] - innerD / 2;
  const floorY = wardPos[1];
  let idx = 0;

  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      beds.push({
        position: [
          startX + col * spacingX,
          floorY + 0.08,
          startZ + row * spacingZ,
        ],
        bedIndex: idx++,
      });
    }
  }
  return beds;
}

export function WardRoom({
  location,
  patients,
  position,
  size,
  bedLayout,
  onSelectPatient,
}: WardRoomProps) {
  const bedPositions = generateBedPositions(position, size, bedLayout);
  const totalBeds = bedLayout.cols * bedLayout.rows;
  const floorY = position[1];

  const bedIds = Array.from({ length: totalBeds }, (_, i) => {
    const prefix = location.name.replace(/[^A-Z0-9]/gi, "").slice(0, 2);
    return `${prefix}-${String(i + 1).padStart(2, "0")}`;
  });

  const assignedPatients = patients.slice(0, totalBeds);

  return (
    <group>
      {/* Ward floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[position[0], floorY + 0.015, position[2]]}
        receiveShadow
      >
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* Ward walls — tall, grey, transparent */}
      <mesh position={[position[0], floorY + 0.5, position[2] - size[2] / 2]}>
        <boxGeometry args={[size[0], 1, 0.025]} />
        <meshPhysicalMaterial color="#e5e5e5" roughness={0.2} transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh position={[position[0], floorY + 0.5, position[2] + size[2] / 2]}>
        <boxGeometry args={[size[0], 1, 0.025]} />
        <meshPhysicalMaterial color="#e5e5e5" roughness={0.2} transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh position={[position[0] - size[0] / 2, floorY + 0.5, position[2]]}>
        <boxGeometry args={[0.025, 1, size[2]]} />
        <meshPhysicalMaterial color="#e5e5e5" roughness={0.2} transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh position={[position[0] + size[0] / 2, floorY + 0.5, position[2]]}>
        <boxGeometry args={[0.025, 1, size[2]]} />
        <meshPhysicalMaterial color="#e5e5e5" roughness={0.2} transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* Beds */}
      {bedPositions.map((bed, i) => (
        <Bed
          key={i}
          position={bed.position}
          patient={assignedPatients[i] ?? null}
          bedId={bedIds[i]!}
          onSelect={onSelectPatient}
        />
      ))}

      {/* Ward label floating above */}
      <Html
        position={[position[0], floorY + 1.25, position[2]]}
        center
        distanceFactor={14}
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap text-center">
          <p className="text-[11px] font-semibold text-white/90 drop-shadow-md">
            {location.name}
          </p>
          <p className="text-[8px] text-white/40">
            {patients.length}/{totalBeds} occupied · {(location.riskScore * 100).toFixed(0)}% risk
          </p>
        </div>
      </Html>
    </group>
  );
}
