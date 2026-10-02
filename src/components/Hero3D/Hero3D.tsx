/* =========================================================================
   Hero3D — the brand's Split-D mark as an abstract glass + metal sculpture.
   Two interlocking extruded plates from the real logo vectors: a dark
   brushed-metal stem and a cobalt glass bowl, split apart along their seam
   with an electric light core between them. Reacts to pointer and scroll.
   Procedural — no external assets. Reduced motion → calm static pose.
   ========================================================================= */
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  Component,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { MARK_LEFT, MARK_RIGHT } from "../../brand/Logo";
import { extrudeShapeFromD } from "./extrudePaths";
import "./Hero3D.css";

const BLUE = "#2B50FF";
const BLUE_BRIGHT = "#4D6BFF";
const VIOLET = "#7C6BFF";
const METAL = "#181B22";

/* ---- the sculpture: split D plates + electric core ---- */
function SplitSculpture() {
  const stem = useMemo(() => extrudeShapeFromD(MARK_LEFT, { depth: 26, bevel: 2.4 }), []);
  const bowl = useMemo(() => extrudeShapeFromD(MARK_RIGHT, { depth: 26, bevel: 2.4 }), []);
  const group = useRef<THREE.Group>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const sc = Math.min(1, window.scrollY / 700);
    // cinematic drift: cursor lean + scroll turn + slow idle sway
    group.current.rotation.y +=
      (px * 0.42 + sc * 1.1 + Math.sin(t * 0.22) * 0.12 - group.current.rotation.y) * 0.04;
    group.current.rotation.x +=
      (-py * 0.24 + Math.sin(t * 0.29) * 0.07 - group.current.rotation.x) * 0.04;
    group.current.position.y = Math.sin(t * 0.6) * 0.05 - sc * 0.35;
    if (coreLight.current) {
      coreLight.current.intensity = 2.2 + Math.sin(t * 1.6) * 0.7;
    }
  });

  // fit the 200×200 mark into the viewport, with breathing room
  const scale = (Math.min(viewport.width, viewport.height) * 0.62) / 200;

  return (
    <group ref={group} scale={scale}>
      {/* stem — dark brushed metal */}
      <mesh geometry={stem} position={[-13, 0, 0]}>
        <meshStandardMaterial
          color={METAL}
          metalness={0.92}
          roughness={0.32}
          envMapIntensity={1.1}
        />
      </mesh>
      {/* bowl — cobalt glass */}
      <mesh geometry={bowl} position={[13, 0, 0]}>
        <meshPhysicalMaterial
          color={BLUE}
          metalness={0.08}
          roughness={0.06}
          transmission={0.85}
          thickness={2.4}
          ior={1.45}
          envMapIntensity={1.6}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={new THREE.Color("#0a1c8f")}
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* electric core between the halves */}
      <pointLight ref={coreLight} position={[0, 0, 2]} color={BLUE_BRIGHT} intensity={2.2} distance={9} />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial color={BLUE_BRIGHT} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.1, 24, 24]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

/* ---- studio lighting rig: cold key, blue rim, violet kiss ---- */
function Rig() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 8, 6]} intensity={1.6} color="#eef1ff" />
      <directionalLight position={[-7, -4, 3]} intensity={1.2} color={BLUE_BRIGHT} />
      <pointLight position={[-5, 5, 5]} intensity={0.7} color={VIOLET} distance={16} />
      <Environment
        files="https://raw.githack.com/pmndrs/drei-assets/master/hdri/studio_small_03_1k.hdr"
        preset={undefined}
      />
    </>
  );
}

/* ---- error boundary: WebGL can fail on locked-down machines ---- */
class GLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* swallow — the static fallback is fine */ }
  render() { return this.state.failed ? null : this.props.children; }
}

function StaticMark() {
  return (
    <div className="hero3d__fallback" aria-hidden="true">
      <svg viewBox="0 0 200 200" width={210} height={210}>
        <path d={MARK_LEFT} fill="#232733" />
        <path d={MARK_RIGHT} fill={BLUE} />
      </svg>
    </div>
  );
}

export function Hero3D() {
  const [reduced, setReduced] = useState(false);
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqSmall = window.matchMedia("(max-width: 720px)");
    const sync = () => {
      setReduced(mq.matches);
      setSmall(mqSmall.matches);
    };
    sync();
    mq.addEventListener?.("change", sync);
    mqSmall.addEventListener?.("change", sync);
    return () => {
      mq.removeEventListener?.("change", sync);
      mqSmall.removeEventListener?.("change", sync);
    };
  }, []);

  return (
    <div className={`hero3d${reduced ? " is-reduced" : ""}`} aria-hidden="true">
      <GLBoundary>
        <Canvas
          camera={{ position: [0, 0, 7.4], fov: 38 }}
          dpr={[1, small ? 1.5 : 2]}
          gl={{ antialias: true, alpha: true }}
          frameloop={reduced ? "demand" : "always"}
        >
          <Rig />
          <Suspense fallback={null}>
            <Float speed={reduced ? 0 : 1.1} rotationIntensity={reduced ? 0 : 0.14} floatIntensity={reduced ? 0 : 0.5}>
              <SplitSculpture />
            </Float>
            <ContactShadows
              position={[0, -2.6, 0]}
              opacity={0.6}
              scale={11}
              blur={2.6}
              far={5}
              color="#000000"
            />
          </Suspense>
        </Canvas>
      </GLBoundary>
      <noscript>
        <StaticMark />
      </noscript>
    </div>
  );
}
