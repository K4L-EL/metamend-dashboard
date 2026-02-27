import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import type { Group } from "three";
import type { LocationRisk, Patient } from "../../types";
import { WardRoom } from "./ward-room";

interface WardConfig {
  position: [number, number, number];
  size: [number, number, number];
  bedLayout: { cols: number; rows: number };
}

const FLOOR_GAP = 5;

const FLOOR1_LAYOUT: Record<string, WardConfig> = {
  LOC001: { position: [-5, 0, -3.5], size: [3.5, 1, 3], bedLayout: { cols: 4, rows: 2 } },
  LOC002: { position: [-5, 0, 1], size: [3.5, 1, 3], bedLayout: { cols: 3, rows: 2 } },
  LOC003: { position: [0, 0, -4.5], size: [3.8, 1, 2.2], bedLayout: { cols: 4, rows: 2 } },
  LOC004: { position: [0, 0, -1.2], size: [3.8, 1, 2.2], bedLayout: { cols: 4, rows: 2 } },
};

const FLOOR2_LAYOUT: Record<string, WardConfig> = {
  LOC005: { position: [0, FLOOR_GAP, 2], size: [3.8, 1, 2.2], bedLayout: { cols: 4, rows: 2 } },
  LOC006: { position: [5, FLOOR_GAP, -3], size: [3.2, 1, 2.8], bedLayout: { cols: 3, rows: 2 } },
  LOC007: { position: [5, FLOOR_GAP, 1.5], size: [3.2, 1, 3.2], bedLayout: { cols: 4, rows: 2 } },
  LOC008: { position: [-5, FLOOR_GAP, 4.8], size: [3, 1, 2], bedLayout: { cols: 3, rows: 2 } },
};

const WARD_NAME_MAP: Record<string, string> = {
  LOC001: "ICU-A",
  LOC002: "ICU-B",
  LOC003: "Ward 2A",
  LOC004: "Ward 3B",
  LOC005: "Ward 4C",
  LOC006: "Surgical",
  LOC007: "Emergency",
  LOC008: "Neonatal",
};

interface HospitalFloorProps {
  locations: LocationRisk[];
  patients: Patient[];
  split: boolean;
  onSelectPatient?: (patient: Patient) => void;
}

function FloorBase({ y }: { y: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 0.01, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.95} />
      </mesh>
      <gridHelper args={[22, 22, "#171717", "#171717"]} position={[0, y + 0.003, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, y + 0.005, 0]}>
        <planeGeometry args={[0.8, 16]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, y + 0.005, 0]}>
        <planeGeometry args={[0.6, 16]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.005, -0.2]}>
        <planeGeometry args={[18, 0.5]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
      </mesh>
    </>
  );
}

export function HospitalFloor({ locations, patients, split, onSelectPatient }: HospitalFloorProps) {
  const floor1Ref = useRef<Group>(null);
  const floor2Ref = useRef<Group>(null);

  const patientsByWard = patients.reduce<Record<string, Patient[]>>((acc, p) => {
    (acc[p.ward] ??= []).push(p);
    return acc;
  }, {});

  const floor1Locations = locations.filter((l) => l.locationId in FLOOR1_LAYOUT);
  const floor2Locations = locations.filter((l) => l.locationId in FLOOR2_LAYOUT);

  const slabY = (FLOOR_GAP - 0.06) / 2;

  useFrame((_, delta) => {
    if (floor1Ref.current) {
      const targetX = split ? -13 : 0;
      const targetY = split ? 0 : 0;
      floor1Ref.current.position.x = MathUtils.lerp(floor1Ref.current.position.x, targetX, delta * 4);
      floor1Ref.current.position.y = MathUtils.lerp(floor1Ref.current.position.y, targetY, delta * 4);
    }
    if (floor2Ref.current) {
      const targetX = split ? 13 : 0;
      const targetY = split ? -FLOOR_GAP : 0;
      floor2Ref.current.position.x = MathUtils.lerp(floor2Ref.current.position.x, targetX, delta * 4);
      floor2Ref.current.position.y = MathUtils.lerp(floor2Ref.current.position.y, targetY, delta * 4);
    }
  });

  return (
    <group>
      {/* Floor 1 group */}
      <group ref={floor1Ref}>
        <FloorBase y={0} />

        {floor1Locations.map((loc) => {
          const config = FLOOR1_LAYOUT[loc.locationId];
          if (!config) return null;
          const wardName = WARD_NAME_MAP[loc.locationId] ?? loc.name;
          const wardPatients = patientsByWard[wardName] ?? [];
          return (
            <WardRoom
              key={loc.locationId}
              location={loc}
              patients={wardPatients}
              position={config.position}
              size={config.size}
              bedLayout={config.bedLayout}
              onSelectPatient={onSelectPatient}
            />
          );
        })}
      </group>

      {/* Floor slab — hidden when split */}
      {!split && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, slabY, 0]} receiveShadow>
            <planeGeometry args={[22, 18]} />
            <meshStandardMaterial color="#141414" roughness={0.9} />
          </mesh>
          {([[-8, -6], [8, -6], [-8, 6], [8, 6]] as const).map(([x, z], i) => (
            <mesh key={`pillar-${i}`} position={[x, slabY, z]}>
              <boxGeometry args={[0.15, FLOOR_GAP - 0.1, 0.15]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
          ))}
        </>
      )}

      {/* Floor 2 group */}
      <group ref={floor2Ref}>
        <FloorBase y={FLOOR_GAP} />

        {floor2Locations.map((loc) => {
          const config = FLOOR2_LAYOUT[loc.locationId];
          if (!config) return null;
          const wardName = WARD_NAME_MAP[loc.locationId] ?? loc.name;
          const wardPatients = patientsByWard[wardName] ?? [];
          return (
            <WardRoom
              key={`f2-${loc.locationId}`}
              location={loc}
              patients={wardPatients}
              position={config.position}
              size={config.size}
              bedLayout={config.bedLayout}
              onSelectPatient={onSelectPatient}
            />
          );
        })}
      </group>
    </group>
  );
}
