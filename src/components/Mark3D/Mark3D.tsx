/* =========================================================================
   Mark3D — the full DAEKON wordmark as live 3D type.
   Each letter is extruded from the brand's vector wordmark paths (same
   source as the SVG logo set), floats on its own phase and leans with the
   pointer. Blue seam light + particles + ground shadow on a light stage.
   No external assets: everything is procedural.
   ========================================================================= */
import { Suspense, useMemo, useRef, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { Group, Mesh, PointLight, Points as ThreePoints, ExtrudeGeometry } from "three";
import { ExtrusionPath, extrudeShape } from "./extrudePaths";
import { WORDMARK } from "../../brand/wordmark";
import "./Mark3D.css";

const BLUE_LIGHT = "#2B50FF";
const BLUE_DEEP = "#1636E7";
const GRAPHITE = "#14161B";

/* ---- geometry: one extruded plate per letter, from the brand vectors ---- */
function useLetterGeometries(): ExtrudeGeometry[] {
  return useMemo(() => {
    const cx = WORDMARK.width / 2;
    return WORDMARK.glyphs.map((g) => {
      // wordmark space: cap 100, baseline y=100, y-down → center and flip
      const pts = ExtrusionPath(g.d).map(
        ([x, y]) => [x - cx, 50 - y] as [number, number],
      );
      return extrudeShape(pts, { depth: 30, bevel: 2.5 });
    });
  }, []);
}

function WordmarkMeshes() {
  const geo = useLetterGeometries();
  const group = useRef<Group>(null);
  const letters = useRef<(Mesh | null)[]>([]);
  const glow = useRef<PointLight>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // gentle pointer-follow sway — the word stays readable
      const px = (state.pointer.x * Math.PI) / 12;
      const py = (state.pointer.y * Math.PI) / 14;
      group.current.rotation.y +=
        (px + Math.sin(t * 0.24) * 0.06 - group.current.rotation.y) * 0.05;
      group.current.rotation.x +=
        (-py + Math.sin(t * 0.31) * 0.04 - group.current.rotation.x) * 0.05;
    }
    letters.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = Math.sin(t * 0.9 + i * 0.55) * 0.09;
      m.position.z = Math.cos(t * 0.6 + i * 0.42) * 0.06;
    });
    if (glow.current) {
      glow.current.intensity = 1.5 + Math.sin(t * 2.0) * 0.8;
    }
  });

  // responsive: the wordmark fills most of the stage width on any screen
  const scale = Math.min(viewport.width * 0.82, 7.4) / WORDMARK.width;

  return (
    <group ref={group} scale={scale}>
      {geo.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          ref={(m) => {
            letters.current[i] = m;
          }}
        >
          <meshStandardMaterial color={GRAPHITE} metalness={0.4} roughness={0.28} />
        </mesh>
      ))}
      <pointLight
        ref={glow}
        position={[0, 0, 1.1]}
        color={BLUE_LIGHT}
        intensity={1.5}
        distance={8}
      />
    </group>
  );
}

/* ---- particle field ---- */
function Particles({ count = 90 }: { count?: number }) {
  const ref = useRef<ThreePoints>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
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
      <pointsMaterial size={0.032} color={BLUE_DEEP} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---- rig: lights ---- */
function Rig() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, -3, 4]} intensity={0.6} color={BLUE_LIGHT} />
      <pointLight position={[0, 0, 4.5]} intensity={0.5} color={BLUE_LIGHT} />
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
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
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
            <WordmarkMeshes />
            <ContactShadows
              position={[0, -1.35, 0]}
              opacity={0.3}
              scale={10}
              blur={2.6}
              far={4}
              color="#141a3c"
            />
            {!reduced && <Particles />}
          </Suspense>
        </Canvas>
      </GLBoundary>
      <noscript>
        <StaticMark />
      </noscript>
    </div>
  );
}
