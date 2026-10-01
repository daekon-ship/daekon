/* =========================================================================
   Mark3D — the full DAEKON wordmark as live 3D type.
   Each letter is extruded from the brand's vector wordmark paths (same
   source as the SVG logo set), floats on its own phase and leans with the
   pointer. Blue seam light + particles + ground shadow on a light stage.
   No external assets: everything is procedural.
   ========================================================================= */
import { Suspense, useMemo, useRef, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import type { Group, Mesh, PointLight, ExtrudeGeometry } from "three";
import { ExtrusionPath, extrudeShape } from "./extrudePaths";
import { WORDMARK } from "../../brand/wordmark";
import "./Mark3D.css";

const BLUE_LIGHT = "#2B50FF";
const BLUE_DEEP = "#1636E7";
const PAPER = "#F4F2EE"; // white cap faces pop on the night stage

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

function WordmarkMeshes({ animated = true }: { animated?: boolean }) {
  const geo = useLetterGeometries();
  const group = useRef<Group>(null);
  const letters = useRef<(Mesh | null)[]>([]);
  const glow = useRef<PointLight>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // pointer sway + a scroll-linked turn: the word rotates as you scroll
      const px = (state.pointer.x * Math.PI) / 10;
      const py = (state.pointer.y * Math.PI) / 13;
      const sc = typeof window !== "undefined" ? Math.min(1, window.scrollY / 900) : 0;
      group.current.rotation.y +=
        (px + sc * 0.5 + Math.sin(t * 0.24) * 0.06 - group.current.rotation.y) * 0.05;
      group.current.rotation.x +=
        (-py + Math.sin(t * 0.31) * 0.04 - group.current.rotation.x) * 0.05;
    }
    letters.current.forEach((m, i) => {
      if (!m) return;
      const floatY = Math.sin(t * 0.9 + i * 0.55) * 0.09;
      const floatZ = Math.cos(t * 0.6 + i * 0.42) * 0.06;
      if (!animated) {
        // reduced motion: rest pose immediately
        m.position.set(0, 0, 0);
        m.rotation.x = 0;
        m.scale.setScalar(1);
        return;
      }
      // intro: letters fly in and settle one by one (with a little overshoot)
      const p = Math.min(1, Math.max(0, (t - i * 0.12) / 0.95));
      const c1 = 1.70158, c3 = c1 + 1;
      const ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
      m.position.y = floatY * p + (1 - p) * -1.6;
      m.position.z = floatZ * p;
      m.rotation.x = (1 - p) * -0.65;
      m.rotation.y = (1 - p) * 0.35 * (i % 2 === 0 ? 1 : -1);
      m.scale.setScalar(0.8 + 0.2 * ease);
    });
    if (glow.current) {
      glow.current.intensity = 1.5 + Math.sin(t * 2.0) * 0.8;
    }
  });

  // responsive: the wordmark fills most of the stage width on any screen
  const scale = Math.min(viewport.width * 0.87, 7.9) / WORDMARK.width;

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
          {/* cap faces: porcelain white; side walls: glowing DAEKON blue rim */}
          <meshStandardMaterial attach="material-0" color={PAPER} metalness={0.65} roughness={0.2} />
          <meshStandardMaterial attach="material-1" color={BLUE_DEEP} metalness={0.4} roughness={0.28} emissive={BLUE_LIGHT} emissiveIntensity={0.5} />
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

/* ---- rig: night-stage lighting ---- */
function Rig() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#ffffff" />
      <directionalLight position={[-6, -3, 4]} intensity={1.1} color={BLUE_LIGHT} />
      <pointLight position={[0, 1.5, 4.5]} intensity={0.9} color="#cdd6ff" />
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
            <WordmarkMeshes animated={!reduced} />
            <ContactShadows
              position={[0, -1.35, 0]}
              opacity={0.55}
              scale={10}
              blur={2.8}
              far={4}
              color="#000000"
            />
            {!reduced && (
              <Sparkles
                count={70}
                scale={[9, 4.5, 3.5]}
                size={2.4}
                speed={0.35}
                color="#9db2ff"
                opacity={0.75}
              />
            )}
          </Suspense>
        </Canvas>
      </GLBoundary>
      <noscript>
        <StaticMark />
      </noscript>
    </div>
  );
}
