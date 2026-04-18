import { Suspense, useState, useCallback, useRef, useEffect, createContext, useContext } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Layers, Columns2, Sun, Moon, Home, ZoomIn, ZoomOut,
  ChevronDown, ChevronRight, Building2,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
} from "lucide-react";
import { Vector3, MOUSE } from "three";
import type { LocationRisk, Patient } from "../../types";
import { HospitalFloor } from "./hospital-floor";
import { FLOOR1_LAYOUT, FLOOR2_LAYOUT, WARD_NAME_MAP, FLOOR_GAP } from "./hospital-floor";
import { MapLegend } from "./map-legend";
import { BedPanel } from "./bed-panel";
import { Loading } from "../ui/loading";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getSettings } from "../../lib/settings-store";

interface HospitalSceneProps {
  locations: LocationRisk[];
  patients: Patient[];
}

export const MapThemeContext = createContext<"dark" | "light">("dark");
export function useMapTheme() { return useContext(MapThemeContext); }

interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

const DEFAULT_CAMERA: CameraTarget = {
  position: [16, 16, 16],
  lookAt: [0, 2.5, 0],
};

function wardCamera(wardPos: [number, number, number], split: boolean, isFloor2: boolean): CameraTarget {
  const ox = split ? (isFloor2 ? 13 : -13) : 0;
  const oy = split && isFloor2 ? -FLOOR_GAP : 0;
  const x = wardPos[0] + ox;
  const y = wardPos[1] + oy;
  const z = wardPos[2];
  return {
    position: [x + 5, y + 4, z + 5],
    lookAt: [x, y + 0.5, z],
  };
}

function floorCamera(floor: number, split: boolean): CameraTarget {
  const isFloor2 = floor === 2;
  const ox = split ? (isFloor2 ? 13 : -13) : 0;
  const baseY = isFloor2 ? FLOOR_GAP : 0;
  const oy = split && isFloor2 ? -FLOOR_GAP : 0;
  const y = baseY + oy;
  return {
    position: [ox + 12, y + 10, 12],
    lookAt: [ox, y + 0.5, 0],
  };
}

function CameraController({ target, controlsRef }: {
  target: CameraTarget;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new Vector3(...target.position));
  const targetLookAt = useRef(new Vector3(...target.lookAt));
  const animating = useRef(false);
  const prevTarget = useRef(target);

  if (prevTarget.current !== target) {
    prevTarget.current = target;
    targetPos.current.set(...target.position);
    targetLookAt.current.set(...target.lookAt);
    animating.current = true;
  }

  useFrame((_, delta) => {
    if (!animating.current) return;
    const speed = delta * 3;
    camera.position.lerp(targetPos.current, speed);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, speed);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      animating.current = false;
    }
  });

  return null;
}

interface NavPanelProps {
  light: boolean;
  activeWard: string | null;
  onSelectWard: (wardId: string) => void;
  onSelectFloor: (floor: number) => void;
  onReset: () => void;
}

function NavPanel({ light, activeWard, onSelectWard, onSelectFloor, onReset }: NavPanelProps) {
  const [floor1Open, setFloor1Open] = useState(true);
  const [floor2Open, setFloor2Open] = useState(true);

  const base = light
    ? "border-neutral-300 bg-white/95 text-neutral-700"
    : "border-neutral-700 bg-neutral-900/95 text-neutral-300";

  const floors = [
    { label: "Floor 1", floor: 1, layout: FLOOR1_LAYOUT, open: floor1Open, toggle: () => setFloor1Open((o) => !o) },
    { label: "Floor 2", floor: 2, layout: FLOOR2_LAYOUT, open: floor2Open, toggle: () => setFloor2Open((o) => !o) },
  ];

  return (
    <div className={`absolute left-4 top-20 z-10 w-40 rounded-lg border p-2 shadow-xl backdrop-blur-sm sm:left-6 sm:w-44 ${base}`}>
      <button
        onClick={onReset}
        className={`mb-1.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
          activeWard === null
            ? (light ? "bg-neutral-200 text-neutral-900" : "bg-neutral-700 text-white")
            : (light ? "hover:bg-neutral-100" : "hover:bg-neutral-800")
        }`}
      >
        <Home className="h-3 w-3" strokeWidth={2} />
        Overview
      </button>

      <div className={`mb-1.5 h-px ${light ? "bg-neutral-200" : "bg-neutral-700"}`} />

      {floors.map(({ label, floor, layout, open, toggle }) => (
        <div key={floor}>
          <button
            onClick={() => { toggle(); onSelectFloor(floor); }}
            className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
              light ? "text-neutral-600 hover:bg-neutral-100" : "text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Building2 className="h-3 w-3" />
            {label}
          </button>
          {open && (
            <div className="ml-3 space-y-px py-0.5">
              {Object.entries(layout).map(([id]) => {
                const name = WARD_NAME_MAP[id] ?? id;
                const isActive = activeWard === id;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectWard(id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                      isActive
                        ? (light ? "bg-neutral-200 text-neutral-900" : "bg-neutral-700 text-white")
                        : (light ? "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200")
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? (light ? "bg-neutral-700" : "bg-white") : (light ? "bg-neutral-300" : "bg-neutral-600")}`} />
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HospitalScene({ locations, patients }: HospitalSceneProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [split, setSplit] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => (getSettings().apearDarkMap ? "dark" : "light"));
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(DEFAULT_CAMERA);
  const [activeWard, setActiveWard] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const light = theme === "light";

  const handleSelect = useCallback((patient: Patient) => {
    setSelectedPatient((prev) => (prev?.id === patient.id ? null : patient));
  }, []);

  const handleSelectWard = useCallback((wardId: string) => {
    const config = FLOOR1_LAYOUT[wardId] ?? FLOOR2_LAYOUT[wardId];
    if (!config) return;
    const isFloor2 = wardId in FLOOR2_LAYOUT;
    setActiveWard(wardId);
    if (!split) {
      setSplit(true);
      setTimeout(() => {
        setCameraTarget(wardCamera(config.position, true, isFloor2));
      }, 100);
    } else {
      setCameraTarget(wardCamera(config.position, split, isFloor2));
    }
  }, [split]);

  const handleSelectFloor = useCallback((floor: number) => {
    setActiveWard(null);
    setCameraTarget(floorCamera(floor, split));
  }, [split]);

  const handleReset = useCallback(() => {
    setActiveWard(null);
    setCameraTarget(DEFAULT_CAMERA);
  }, []);

  const handleZoom = useCallback((direction: "in" | "out") => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    const target = controlsRef.current.target;
    const dir = new Vector3().subVectors(camera.position, target).normalize();
    const amount = direction === "in" ? -3 : 3;
    const newPos = camera.position.clone().addScaledVector(dir, amount);
    const dist = newPos.distanceTo(target);
    if (dist >= 2 && dist <= 50) {
      setCameraTarget({ position: [newPos.x, newPos.y, newPos.z], lookAt: [target.x, target.y, target.z] });
    }
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    const target = controlsRef.current.target;
    const offset = new Vector3(dx, dy, 0).applyQuaternion(camera.quaternion).multiplyScalar(2);
    const newCamPos = camera.position.clone().add(offset);
    const newTarget = target.clone().add(offset);
    setCameraTarget({
      position: [newCamPos.x, newCamPos.y, newCamPos.z],
      lookAt: [newTarget.x, newTarget.y, newTarget.z],
    });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "w": case "arrowup":    handlePan(0, 1); e.preventDefault(); break;
        case "s": case "arrowdown":  handlePan(0, -1); e.preventDefault(); break;
        case "a": case "arrowleft":  handlePan(-1, 0); e.preventDefault(); break;
        case "d": case "arrowright": handlePan(1, 0); e.preventDefault(); break;
        case "+": case "=":         handleZoom("in"); e.preventDefault(); break;
        case "-": case "_":         handleZoom("out"); e.preventDefault(); break;
        case "r":                    handleReset(); e.preventDefault(); break;
      }
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); };
    el.addEventListener("keydown", onKey);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("wheel", onWheel);
    };
  }, [handlePan, handleZoom, handleReset]);

  const btnClass = light
    ? "border-neutral-300 bg-white/90 text-neutral-700 hover:bg-neutral-100"
    : "border-neutral-700 bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white";

  return (
    <MapThemeContext.Provider value={theme}>
      <div
        ref={containerRef}
        tabIndex={0}
        className="relative h-full w-full overflow-hidden rounded-xl shadow-lg outline-none"
        style={{
          border: light ? "1px solid #e5e5e5" : "1px solid #262626",
          background: light ? "#ffffff" : "#141414",
        }}
      >
        <Suspense fallback={<Loading className="h-full" />}>
          <Canvas
            shadows
            camera={{ position: [16, 16, 16], fov: 44 }}
            style={{
              background: light
                ? "linear-gradient(180deg, #f5f5f5 0%, #e5e5e5 100%)"
                : "linear-gradient(180deg, #0f0f0f 0%, #141414 100%)",
            }}
          >
            <ambientLight intensity={light ? 0.8 : 0.55} />
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
              intensity={light ? 0.5 : 0.35}
              color={light ? "#ffffff" : "#d4d4d4"}
              groundColor={light ? "#e5e5e5" : "#141414"}
            />

            <HospitalFloor
              locations={locations}
              patients={patients}
              split={split}
              onSelectPatient={handleSelect}
            />

            <CameraController target={cameraTarget} controlsRef={controlsRef} />

            <OrbitControls
              ref={controlsRef}
              makeDefault
              enablePan
              enableZoom
              enableRotate
              panSpeed={1.2}
              rotateSpeed={0.8}
              zoomSpeed={1.2}
              minDistance={2}
              maxDistance={50}
              maxPolarAngle={Math.PI / 2.05}
              minPolarAngle={0.05}
              screenSpacePanning
              mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
              target={[0, 2.5, 0]}
              enableDamping
              dampingFactor={0.12}
            />

            <fog attach="fog" args={[light ? "#e5e5e5" : "#0f0f0f", 35, 65]} />
          </Canvas>
        </Suspense>

        <MapLegend light={light} />

        {selectedPatient && (
          <BedPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} light={light} />
        )}

        {/* Title */}
        <div className="absolute top-4 left-4 select-none sm:top-6 sm:left-6">
          <h2 className={`text-[13px] font-semibold ${light ? "text-neutral-800" : "text-white/80"}`}>
            Hospital Floor Plan
          </h2>
          <p className={`text-[10px] ${light ? "text-neutral-500" : "text-white/30"}`}>
            Floor 1 & 2 · {patients.length} patients · {locations.length} wards
          </p>
        </div>

        {/* Ward quick-nav */}
        <NavPanel
          light={light}
          activeWard={activeWard}
          onSelectWard={handleSelectWard}
          onSelectFloor={handleSelectFloor}
          onReset={handleReset}
        />

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 sm:top-6 sm:right-6 sm:flex-row">
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-sm transition-colors ${btnClass}`}
          >
            {light ? <Moon className="h-3.5 w-3.5" strokeWidth={2} /> : <Sun className="h-3.5 w-3.5" strokeWidth={2} />}
            <span className="hidden sm:inline">{light ? "Dark Mode" : "Light Mode"}</span>
          </button>
          <button
            onClick={() => setSplit((s) => !s)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-sm transition-colors ${btnClass}`}
          >
            {split ? (
              <><Layers className="h-3.5 w-3.5" strokeWidth={2} /><span className="hidden sm:inline">Stack Floors</span></>
            ) : (
              <><Columns2 className="h-3.5 w-3.5" strokeWidth={2} /><span className="hidden sm:inline">Split Floors</span></>
            )}
          </button>
        </div>

        {/* Navigation controls — bottom right */}
        <div className="absolute bottom-4 right-4 z-20 flex items-end gap-3 sm:bottom-6 sm:right-6">
          {/* D-pad for panning */}
          <div className="grid grid-cols-3 gap-0.5">
            <div />
            <button onClick={() => handlePan(0, 1)} className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Pan up">
              <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <div />
            <button onClick={() => handlePan(-1, 0)} className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Pan left">
              <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <button onClick={handleReset} className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Home view">
              <Home className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <button onClick={() => handlePan(1, 0)} className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Pan right">
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <div />
            <button onClick={() => handlePan(0, -1)} className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Pan down">
              <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <div />
          </div>

          {/* Zoom stack */}
          <div className="flex flex-col gap-1">
            <button onClick={() => handleZoom("in")} className={`flex h-7 w-7 items-center justify-center rounded-md border shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Zoom in">
              <ZoomIn className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <button onClick={() => handleZoom("out")} className={`flex h-7 w-7 items-center justify-center rounded-md border shadow-md backdrop-blur-sm transition-colors ${btnClass}`} title="Zoom out">
              <ZoomOut className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </MapThemeContext.Provider>
  );
}
