import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Layers, Columns2 } from "lucide-react";
import type { LocationRisk, Patient } from "../../types";
import { HospitalFloor } from "./hospital-floor";
import { MapLegend } from "./map-legend";
import { BedPanel } from "./bed-panel";
import { Loading } from "../ui/loading";

interface HospitalSceneProps {
  locations: LocationRisk[];
  patients: Patient[];
}

export function HospitalScene({ locations, patients }: HospitalSceneProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [split, setSplit] = useState(false);

  const handleSelect = useCallback((patient: Patient) => {
    setSelectedPatient((prev) => (prev?.id === patient.id ? null : patient));
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 shadow-lg">
      <Suspense fallback={<Loading className="h-full" />}>
        <Canvas
          shadows
          camera={{ position: [16, 16, 16], fov: 44 }}
          style={{ background: "linear-gradient(180deg, #050505 0%, #0a0a0a 100%)" }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 16, 6]}
            intensity={1.1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-18}
            shadow-camera-right={18}
            shadow-camera-top={18}
            shadow-camera-bottom={-18}
          />
          <hemisphereLight intensity={0.2} color="#d4d4d4" groundColor="#0a0a0a" />

          <HospitalFloor
            locations={locations}
            patients={patients}
            split={split}
            onSelectPatient={handleSelect}
          />

          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            minDistance={4}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={0.1}
            target={[0, 2.5, 0]}
          />

          <fog attach="fog" args={["#050505", 30, 65]} />
        </Canvas>
      </Suspense>

      <MapLegend />

      {selectedPatient && (
        <BedPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}

      {/* Top-left info */}
      <div className="absolute top-6 left-6 select-none">
        <h2 className="text-[13px] font-semibold text-white/80">Hospital Floor Plan</h2>
        <p className="text-[10px] text-white/30">
          Floor 1 & 2 · {patients.length} patients · {locations.length} wards
        </p>
      </div>

      {/* Split floors toggle */}
      <div className="absolute top-6 right-6 flex gap-2">
        <button
          onClick={() => setSplit((s) => !s)}
          className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/90 px-3 py-2 text-[11px] font-medium text-neutral-300 shadow-lg backdrop-blur-sm transition-colors hover:bg-neutral-700 hover:text-white"
        >
          {split ? (
            <>
              <Layers className="h-3.5 w-3.5" strokeWidth={2} />
              Stack Floors
            </>
          ) : (
            <>
              <Columns2 className="h-3.5 w-3.5" strokeWidth={2} />
              Split Floors
            </>
          )}
        </button>
      </div>

      <div className="absolute bottom-6 right-6 text-[10px] text-white/25">
        Drag to rotate · Scroll to zoom · Click a bed for details
      </div>
    </div>
  );
}
