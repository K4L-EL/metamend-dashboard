import { Suspense, useState, useCallback, createContext, useContext } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Layers, Columns2, Sun, Moon } from "lucide-react";
import type { LocationRisk, Patient } from "../../types";
import { HospitalFloor } from "./hospital-floor";
import { MapLegend } from "./map-legend";
import { BedPanel } from "./bed-panel";
import { Loading } from "../ui/loading";

interface HospitalSceneProps {
  locations: LocationRisk[];
  patients: Patient[];
}

export const MapThemeContext = createContext<"dark" | "light">("dark");
export function useMapTheme() { return useContext(MapThemeContext); }

export function HospitalScene({ locations, patients }: HospitalSceneProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [split, setSplit] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const light = theme === "light";

  const handleSelect = useCallback((patient: Patient) => {
    setSelectedPatient((prev) => (prev?.id === patient.id ? null : patient));
  }, []);

  return (
    <MapThemeContext.Provider value={theme}>
      <div
        className="relative h-full w-full overflow-hidden rounded-xl shadow-lg"
        style={{
          border: light ? "1px solid #e5e5e5" : "1px solid #262626",
          background: light ? "#ffffff" : "#0a0a0a",
        }}
      >
        <Suspense fallback={<Loading className="h-full" />}>
          <Canvas
            shadows
            camera={{ position: [16, 16, 16], fov: 44 }}
            style={{
              background: light
                ? "linear-gradient(180deg, #f5f5f5 0%, #e5e5e5 100%)"
                : "linear-gradient(180deg, #050505 0%, #0a0a0a 100%)",
            }}
          >
            <ambientLight intensity={light ? 0.8 : 0.4} />
            <directionalLight
              position={[10, 16, 6]}
              intensity={light ? 1.6 : 1.1}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-far={50}
              shadow-camera-left={-18}
              shadow-camera-right={18}
              shadow-camera-top={18}
              shadow-camera-bottom={-18}
            />
            <hemisphereLight
              intensity={light ? 0.5 : 0.2}
              color={light ? "#ffffff" : "#d4d4d4"}
              groundColor={light ? "#e5e5e5" : "#0a0a0a"}
            />

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

            <fog attach="fog" args={[light ? "#e5e5e5" : "#050505", 30, 65]} />
          </Canvas>
        </Suspense>

        <MapLegend light={light} />

        {selectedPatient && (
          <BedPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} light={light} />
        )}

        <div className="absolute top-4 left-4 select-none sm:top-6 sm:left-6">
          <h2 className={`text-[13px] font-semibold ${light ? "text-neutral-800" : "text-white/80"}`}>
            Hospital Floor Plan
          </h2>
          <p className={`text-[10px] ${light ? "text-neutral-500" : "text-white/30"}`}>
            Floor 1 & 2 · {patients.length} patients · {locations.length} wards
          </p>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 sm:top-6 sm:right-6 sm:flex-row">
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-sm transition-colors ${
              light
                ? "border-neutral-300 bg-white/90 text-neutral-700 hover:bg-neutral-100"
                : "border-neutral-700 bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            {light ? <Moon className="h-3.5 w-3.5" strokeWidth={2} /> : <Sun className="h-3.5 w-3.5" strokeWidth={2} />}
            <span className="hidden sm:inline">{light ? "Dark Mode" : "Light Mode"}</span>
          </button>
          <button
            onClick={() => setSplit((s) => !s)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-sm transition-colors ${
              light
                ? "border-neutral-300 bg-white/90 text-neutral-700 hover:bg-neutral-100"
                : "border-neutral-700 bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            {split ? (
              <><Layers className="h-3.5 w-3.5" strokeWidth={2} /><span className="hidden sm:inline">Stack Floors</span></>
            ) : (
              <><Columns2 className="h-3.5 w-3.5" strokeWidth={2} /><span className="hidden sm:inline">Split Floors</span></>
            )}
          </button>
        </div>

        <div className={`absolute bottom-4 right-4 text-[10px] sm:bottom-6 sm:right-6 ${light ? "text-neutral-400" : "text-white/25"}`}>
          Drag to rotate · Scroll to zoom
        </div>
      </div>
    </MapThemeContext.Provider>
  );
}
