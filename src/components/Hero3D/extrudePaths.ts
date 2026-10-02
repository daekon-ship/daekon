/* =========================================================================
   extrudePaths.ts — SVG path (M L H V A Q C Z, absolute) → THREE extruded
   geometry. Contours after the first become holes (letter counters).
   The y-down SVG space is flipped to y-up; extrusion is z-centered so the
   original 200×200 brand coordinate space is preserved across meshes.
   ========================================================================= */
import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";

type Pt = [number, number];

const TAU = Math.PI * 2;

function tokenize(d: string): (string | number)[] {
  const re = /([MLHVACQZmlhvacz])|(-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
  const out: (string | number)[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) out.push(m[1] ?? Number(m[2]));
  return out;
}

/** angle between u and v, signed */
function angleBetween(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (len === 0) return 0;
  const a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
  return ux * vy - uy * vx < 0 ? -a : a;
}

/** sample an elliptical arc (endpoint parameterization) onto `out` */
function sampleArc(
  out: Pt[],
  x1: number, y1: number,
  rx: number, ry: number, phiDeg: number,
  fa: number, fs: number,
  x2: number, y2: number,
) {
  if (rx === 0 || ry === 0) {
    out.push([x2, y2]);
    return;
  }
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  // (1) center-parameterization conversion (W3C SVG 1.1 appendix F.6.5)
  let Rx = Math.abs(rx);
  let Ry = Math.abs(ry);
  const x1p = (cosP * (x1 - x2)) / 2 + (sinP * (y1 - y2)) / 2;
  const y1p = (-sinP * (x1 - x2)) / 2 + (cosP * (y1 - y2)) / 2;
  const l = (x1p * x1p) / (Rx * Rx) + (y1p * y1p) / (Ry * Ry);
  if (l > 1) {
    const s = Math.sqrt(l);
    Rx *= s;
    Ry *= s;
  }
  const num = Rx * Rx * Ry * Ry - Rx * Rx * y1p * y1p - Ry * Ry * x1p * x1p;
  const den = Rx * Rx * y1p * y1p + Ry * Ry * x1p * x1p;
  const c = Math.sqrt(Math.max(0, num / (den || 1)));
  const sign = fa !== fs ? 1 : -1;
  const cxp = (sign * c * Rx * y1p) / Ry;
  const cyp = (-sign * c * Ry * x1p) / Rx;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const th1 = angleBetween(1, 0, (x1p - cxp) / Rx, (y1p - cyp) / Ry);
  let dt = angleBetween(
    (x1p - cxp) / Rx, (y1p - cyp) / Ry,
    (-x1p - cxp) / Rx, (-y1p - cyp) / Ry,
  );
  if (!fs && dt > 0) dt -= TAU;
  if (fs && dt < 0) dt += TAU;
  // (2) flatten
  const seg = Math.max(6, Math.ceil((Math.abs(dt) / TAU) * 48));
  for (let i = 1; i <= seg; i++) {
    const t = th1 + (dt * i) / seg;
    out.push([
      cx + Rx * Math.cos(t) * cosP - Ry * Math.sin(t) * sinP,
      cy + Rx * Math.cos(t) * sinP + Ry * Math.sin(t) * cosP,
    ]);
  }
}

/** SVG path data → list of closed contours (first = outline, rest = holes) */
export function pathToPolygons(d: string): Pt[][] {
  const toks = tokenize(d);
  const contours: Pt[][] = [];
  let cur: Pt[] = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let i = 0;
  const num = () => toks[i++] as number;
  const cmd = () => toks[i] as string;
  const push = (x: number, y: number) => {
    cx = x;
    cy = y;
    cur.push([x, y]);
  };
  while (i < toks.length) {
    const c = cmd();
    if (typeof c !== "string") break;
    i++;
    switch (c) {
      case "M":
        push(num(), num());
        sx = cx; sy = cy;
        while (typeof toks[i] === "number") push(num(), num());
        break;
      case "L":
        while (typeof toks[i] === "number") push(num(), num());
        break;
      case "H":
        while (typeof toks[i] === "number") push(num(), cy);
        break;
      case "V":
        while (typeof toks[i] === "number") push(cx, num());
        break;
      case "A": {
        while (typeof toks[i] === "number") {
          const rx = num(), ry = num(), rot = num(), fa = num(), fs = num();
          const x2 = num(), y2 = num();
          sampleArc(cur, cx, cy, rx, ry, rot, fa, fs, x2, y2);
          cx = x2; cy = y2;
        }
        break;
      }
      case "Q": {
        while (typeof toks[i] === "number") {
          const qx = num(), qy = num(), x2 = num(), y2 = num();
          const seg = 16;
          for (let s = 1; s <= seg; s++) {
            const t = s / seg;
            const u = 1 - t;
            push(
              u * u * cx + 2 * u * t * qx + t * t * x2,
              u * u * cy + 2 * u * t * qy + t * t * y2,
            );
          }
          cx = x2; cy = y2;
        }
        break;
      }
      case "C": {
        while (typeof toks[i] === "number") {
          const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
          const seg = 20;
          for (let s = 1; s <= seg; s++) {
            const t = s / seg;
            const u = 1 - t;
            push(
              u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
              u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
            );
          }
          cx = x3; cy = y3;
        }
        break;
      }
      case "Z":
        if (cur.length) {
          contours.push(cur);
          cur = [];
        }
        push(sx, sy);
        break;
      default:
        // unsupported/relative command — skip its numbers defensively
        while (typeof toks[i] === "number") i++;
    }
  }
  if (cur.length) contours.push(cur);
  return contours.filter((p) => p.length > 2);
}

export interface ExtrudeOptions {
  depth?: number;
  bevel?: number;
}

/** Extrude an SVG path into z-centered 3D geometry (x/y kept in path space). */
export function extrudeShapeFromD(d: string, opts: ExtrudeOptions = {}): ExtrudeGeometry {
  const depth = opts.depth ?? 26;
  const bevel = opts.bevel ?? 2.2;
  const polys = pathToPolygons(d);
  const flip = (poly: Pt[]) => poly.map(([x, y]) => new Vector2(x, -y));
  const shape = new Shape(flip(polys[0]));
  for (const hole of polys.slice(1)) shape.holes.push(new Path(flip(hole)));
  const geo = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.72,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}
