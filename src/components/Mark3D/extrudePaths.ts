/* =========================================================================
   extrudePaths — SVG path (M L H V A Z, absolute) → THREE.ExtrudeGeometry.
   Used to build the 3D Split-D from the exact brand vector paths, so the
   3D object and the 2D logo set share one source of truth.
   ========================================================================= */
import * as THREE from "three";

export type Pt = [number, number];

/** Sample an SVG elliptical arc segment into line points. */
function arcToPoints(
  x1: number, y1: number,
  rx: number, ry: number, phiDeg: number,
  largeArc: boolean, sweep: boolean,
  x2: number, y2: number,
): Pt[] {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
  const x1p = cosP * dx2 + sinP * dy2;
  const y1p = -sinP * dx2 + cosP * dy2;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s; ry *= s;
  }
  // SVG F.6.5: the sign of the center offset is + when flags differ, − when equal
  const sign = largeArc !== sweep ? 1 : -1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
  const theta2 = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx);
  let dTheta = theta2 - theta1;
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;
  const steps = Math.max(8, Math.ceil((Math.abs(dTheta) / (2 * Math.PI)) * 48));
  const pts: Pt[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = theta1 + (dTheta * i) / steps;
    const px = cx + rx * Math.cos(t) * cosP - ry * Math.sin(t) * sinP;
    const py = cy + rx * Math.cos(t) * sinP + ry * Math.sin(t) * cosP;
    pts.push([px, py]);
  }
  return pts;
}

/**
 * Parse an absolute-command SVG path (M L H V A Z) into a flat point list.
 * Curves/arcs are flattened into polylines — enough fidelity for beveled
 * extrusion at mark scale.
 */
export function ExtrusionPath(d: string): Pt[] {
  const tokens = d.match(/[MLHVQCAZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const pts: Pt[] = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      cx = num(); cy = num(); sx = cx; sy = cy;
      pts.push([cx, cy]);
    } else if (cmd === "L") {
      while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
        cx = num(); cy = num();
        pts.push([cx, cy]);
      }
    } else if (cmd === "H") {
      while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
        cx = num();
        pts.push([cx, cy]);
      }
    } else if (cmd === "V") {
      while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
        cy = num();
        pts.push([cx, cy]);
      }
    } else if (cmd === "A") {
      const rx = num(), ry = num(), phi = num();
      const laf = num() !== 0, sf = num() !== 0;
      const x = num(), y = num();
      pts.push(...arcToPoints(cx, cy, rx, ry, phi, laf, sf, x, y));
      cx = x; cy = y;
    } else if (cmd === "Q" || cmd === "C") {
      // fallback: treat control/end as line end (brand paths use only arcs)
      while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) { num(); num(); }
      cx = num(); cy = num();
      pts.push([cx, cy]);
    } else if (cmd === "Z") {
      pts.push([sx, sy]);
    }
  }
  return pts;
}

/** Build an extruded, beveled geometry from a flat point list. */
export function extrudeShape(
  pts: Pt[],
  opts: { depth: number; bevel?: number; curveSegments?: number } = { depth: 20 },
): THREE.ExtrudeGeometry {
  const { depth, bevel = 2.5, curveSegments = 10 } = opts;
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments,
  });
  // center on z only — x/y must keep the brand's relative layout
  // (stem left, bowl right), otherwise both plates collapse to origin
  geo.translate(0, 0, -depth / 2);
  return geo;
}
