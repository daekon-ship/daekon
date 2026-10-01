/* =========================================================================
   Mark3D — the DAEKON Split-D mark as a live 3D object.
   Geometry is built from the brand's vector paths (same source as the SVG
   set), extruded and beveled. Slow float + pointer-follow rotation + pulsing
   seam light + particles. No external assets: everything is procedural.
   ========================================================================= */
import { Suspense, useMemo, useRef, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, PointLight, Points as ThreePoints, ExtrudeGeometry } from "three";
import { ExtrusionPath, extrudeShape } from "./extrudePaths";
import "./Mark3D.css";

const BLUE_LIGHT = "#2B50FF";
const BLUE_DEEP = "#1636E7";
const PAPER = "#F4F2EE"; // dark-mode brand combo: white stem + bright blue bowl

/* ---- geometry: two extruded shapes from the brand's mark paths ---- */
function useMarkGeometries(): { left: ExtrudeGeometry; right: ExtrudeGeometry } {
  return useMemo(() => {
    // brand mark paths, 200×200 box, y-down → flip y and center
    const left =
      "M 16 10 L 71 10 L 71 44 L 50 44 L 50 156 L 71 156 L 71 190 L 16 190 Z";
    const right =
      "M 77 10 L 110 10 A 66 66 0 0 1 176 76 L 176 124 A 66 66 0 0 1 110 190 " +
      "L 77 190 L 77 156 L 104 156 A 38 38 0 0 0 142 118 L 142 82 " +
      "A 38 38 0 0 0 104 44 L 77 44 Z";
    const toWorld = (d: string) =>
      ExtrusionPath(d).map(([x, y]) => [x - 100, 100 - y] as [number, number]);
    const depth = 34;
    const bevel = 3;
    return {
      left: extrudeShape(toWorld(left), { depth, bevel }),
      right: extrudeShape(toWorld(right), { depth, bevel }),
    };
  }, []);
}

/* ---- seamless looping float ---- */
function useFloat(speed = 1) {
  const t = useRef(Math.random() * 100);
  return () => {
    t.current += 0.016 * speed;
    return Math.sin(t.current) * 0.12;
  };
}

function MarkMeshes() {
  const geo = useMarkGeometries();
  const group = useRef<Group>(null);
  const seam = useRef<PointLight>(null);
  const float = useFloat(0.8);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // near-frontal pose so the D always reads; pointer + idle sway add life
      const px = (state.pointer.x * Math.PI) / 16;
      const py = (state.pointer.y * Math.PI) / 16;
      group.current.rotation.y += (px - 0.1 + Math.sin(t * 0.24) * 0.08 - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (-py + Math.sin(t * 0.31) * 0.05 - group.current.rotation.x) * 0.05;
      group.current.position.y = float();
    }
    if (seam.current) {
      // pulsing seam light between the two halves
      const p = 1.6 + Math.sin(t * 2.1) * 0.9;
      seam.current.intensity = p;
    }
  });

  return (
    <group ref={group} scale={0.011}>
      {/* two plates, separated along z: the split reads as physical depth */}
      <mesh geometry={geo.left} position={[0, 0, -10]}>
        <meshStandardMaterial color={PAPER} metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh geometry={geo.right} position={[0, 0, 10]}>
        <meshStandardMaterial color={BLUE_LIGHT} metalness={0.35} roughness={0.22} emissive={BLUE_DEEP} emissiveIntensity={0.35} />
      </mesh>
      <pointLight ref={seam} position={[0, 0, 0]} color={BLUE_LIGHT} intensity={1.6} distance={9} />
    </group>
  );
}

/* ---- particle field ---- */
function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<ThreePoints>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.035;
    ref.current.position.y = Math.sin(t * 0.4) * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={BLUE_LIGHT} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---- rig: light + environment ---- */
function Rig() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, -3, 4]} intensity={0.7} color={BLUE_LIGHT} />
      <pointLight position={[0, 0, 4]} intensity={0.6} color={BLUE_LIGHT} />
    </>
  );
}

/* ---- error boundary: WebGL can fail on locked-down machines ---- */
class GLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* swallow — fallback UI renders instead */ }
  render() { return this.state.failed ? null : this.props.children; }
}

function StaticMark() {
  return (
    <div className="mark3d__fallback" aria-hidden="true">
      <img src="/favicon.ico" alt="" width={120} height={120} />
    </div>
  );
}

export function Mark3D({ className = "" }: { className?: string }) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <div className={`mark3d ${className}`} data-reveal>
      <GLBoundary>
        <Canvas
          camera={{ position: [0, 0, 6.8], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ position: "absolute", inset: 0 }}
          frameloop={reduced ? "demand" : "always"}
        >
          <Rig />
          <Suspense fallback={null}>
            <MarkMeshes />
            {!reduced && <Particles />}
          </Suspense>
        </Canvas>
      </GLBoundary>
      <noscript><StaticMark /></noscript>
    </div>
  );
}
