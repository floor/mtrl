// src/core/shapes/polygon.ts
//
// Rounded polygons, after androidx.graphics.shapes RoundedPolygon.kt and
// Shapes.kt: a list of vertices, each with a corner rounding (a radius and a
// smoothing factor), turned into a closed run of cubic Béziers. Corners that
// do not have room for their full radius share the side between them.

import {
  Cubic,
  Point,
  PointTransformer,
  DISTANCE_EPSILON,
  circularArc,
  cubicBounds,
  direction,
  distance,
  dot,
  lerp,
  pointOnCurve,
  reverseCubic,
  rotate90,
  straightLine,
  transformCubic,
  zeroLength,
} from './cubic';

/** How a vertex is rounded: the radius, and how much the curve is smoothed into the sides (0–1) */
export interface CornerRounding {
  radius: number;
  smoothing?: number;
}

export const UNROUNDED: CornerRounding = { radius: 0, smoothing: 0 };

/** A closed shape made of contiguous cubics */
export interface RoundedPolygon {
  cubics: Cubic[];
  centerX: number;
  centerY: number;
}

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
const length = (a: Point): number => distance(a[0], a[1]);
const unit = (a: Point): Point => direction(a[0], a[1]);
const mix = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

const lineIntersection = (p0: Point, d0: Point, p1: Point, d1: Point): Point | null => {
  const rotatedD1 = rotate90(d1);
  const den = dot(d0, rotatedD1);
  if (Math.abs(den) < DISTANCE_EPSILON) return null;
  const num = dot(sub(p1, p0), rotatedD1);
  if (Math.abs(den) < DISTANCE_EPSILON * Math.abs(num)) return null;
  return add(p0, mul(d0, num / den));
};

/** One vertex with its neighbours and its rounding */
interface RoundedCorner {
  p0: Point;
  p1: Point;
  p2: Point;
  d1: Point;
  d2: Point;
  cornerRadius: number;
  smoothing: number;
  expectedRoundCut: number;
  expectedCut: number;
}

const roundedCorner = (p0: Point, p1: Point, p2: Point, rounding: CornerRounding): RoundedCorner => {
  const v01 = sub(p0, p1);
  const v21 = sub(p2, p1);
  const d01 = length(v01);
  const d21 = length(v21);
  if (d01 > 0 && d21 > 0) {
    const d1 = mul(v01, 1 / d01);
    const d2 = mul(v21, 1 / d21);
    const cornerRadius = rounding.radius;
    const smoothing = rounding.smoothing ?? 0;
    const cosAngle = dot(d1, d2);
    const sinAngle = Math.sqrt(1 - cosAngle * cosAngle);
    // tan(A/2) = sinA / (1 + cosA), and tan(A/2) = radius / cut
    const expectedRoundCut = sinAngle > 1e-3 ? (cornerRadius * (cosAngle + 1)) / sinAngle : 0;
    return {
      p0, p1, p2, d1, d2, cornerRadius, smoothing, expectedRoundCut,
      expectedCut: (1 + smoothing) * expectedRoundCut,
    };
  }
  return { p0, p1, p2, d1: [0, 0], d2: [0, 0], cornerRadius: 0, smoothing: 0, expectedRoundCut: 0, expectedCut: 0 };
};

const actualSmoothing = (corner: RoundedCorner, allowedCut: number): number => {
  if (allowedCut > corner.expectedCut) return corner.smoothing;
  if (allowedCut > corner.expectedRoundCut) {
    return (corner.smoothing * (allowedCut - corner.expectedRoundCut)) / (corner.expectedCut - corner.expectedRoundCut);
  }
  return 0;
};

const flankingCurve = (
  actualRoundCut: number,
  smoothing: number,
  corner: Point,
  sideStart: Point,
  circleSegmentIntersection: Point,
  otherCircleSegmentIntersection: Point,
  circleCenter: Point,
  actualR: number,
): Cubic => {
  const sideDirection = unit(sub(sideStart, corner));
  const curveStart = add(corner, mul(sideDirection, actualRoundCut * (1 + smoothing)));
  const p = mix(circleSegmentIntersection, mul(add(circleSegmentIntersection, otherCircleSegmentIntersection), 0.5), smoothing);
  const curveEnd = add(circleCenter, mul(direction(p[0] - circleCenter[0], p[1] - circleCenter[1]), actualR));
  const circleTangent = rotate90(sub(curveEnd, circleCenter));
  const anchorEnd = lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) ?? circleSegmentIntersection;
  const anchorStart = mul(add(curveStart, mul(anchorEnd, 2)), 1 / 3);
  return [curveStart[0], curveStart[1], anchorStart[0], anchorStart[1], anchorEnd[0], anchorEnd[1], curveEnd[0], curveEnd[1]];
};

const cornerCubics = (corner: RoundedCorner, allowedCut0: number, allowedCut1: number): Cubic[] => {
  const allowedCut = Math.min(allowedCut0, allowedCut1);
  const { p0, p1, p2, d1, d2, cornerRadius, expectedRoundCut } = corner;
  if (expectedRoundCut < DISTANCE_EPSILON || allowedCut < DISTANCE_EPSILON || cornerRadius < DISTANCE_EPSILON) {
    return [straightLine(p1[0], p1[1], p1[0], p1[1])];
  }
  const actualRoundCut = Math.min(allowedCut, expectedRoundCut);
  const smoothing0 = actualSmoothing(corner, allowedCut0);
  const smoothing1 = actualSmoothing(corner, allowedCut1);
  const actualR = (cornerRadius * actualRoundCut) / expectedRoundCut;
  const centerDistance = Math.sqrt(actualR * actualR + actualRoundCut * actualRoundCut);
  const center = add(p1, mul(unit(mul(add(d1, d2), 0.5)), centerDistance));
  const circleIntersection0 = add(p1, mul(d1, actualRoundCut));
  const circleIntersection2 = add(p1, mul(d2, actualRoundCut));
  const flanking0 = flankingCurve(actualRoundCut, smoothing0, p1, p0, circleIntersection0, circleIntersection2, center, actualR);
  const flanking2 = reverseCubic(
    flankingCurve(actualRoundCut, smoothing1, p1, p2, circleIntersection2, circleIntersection0, center, actualR),
  );
  return [
    flanking0,
    circularArc(center[0], center[1], flanking0[6], flanking0[7], flanking2[0], flanking2[1]),
    flanking2,
  ];
};

/**
 * Builds a rounded polygon from a flat list of vertex coordinates
 * [x0, y0, x1, y1, ...], a rounding for every vertex or one per vertex, and
 * an optional centre (the vertices' centroid by default).
 */
export const roundedPolygon = (
  vertices: number[],
  rounding: CornerRounding = UNROUNDED,
  perVertexRounding?: CornerRounding[],
  centerX?: number,
  centerY?: number,
): RoundedPolygon => {
  if (vertices.length < 6) throw new Error('Polygons must have at least 3 vertices');
  if (vertices.length % 2 === 1) throw new Error('The vertices array should have even size');
  const n = vertices.length / 2;
  if (perVertexRounding && perVertexRounding.length !== n) {
    throw new Error('perVertexRounding should have one entry per vertex');
  }
  const vertex = (i: number): Point => [vertices[(i % n) * 2]!, vertices[(i % n) * 2 + 1]!];

  const corners: RoundedCorner[] = [];
  for (let i = 0; i < n; i++) {
    corners.push(roundedCorner(vertex(i + n - 1), vertex(i), vertex(i + 1), perVertexRounding?.[i] ?? rounding));
  }

  // For each side, how much of the wanted cuts fit: rounding first, then smoothing
  const cutAdjusts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const next = corners[(i + 1) % n]!;
    const expectedRoundCut = corners[i]!.expectedRoundCut + next.expectedRoundCut;
    const expectedCut = corners[i]!.expectedCut + next.expectedCut;
    const a = vertex(i);
    const b = vertex(i + 1);
    const sideSize = distance(a[0] - b[0], a[1] - b[1]);
    if (expectedRoundCut > sideSize) {
      cutAdjusts.push([sideSize / expectedRoundCut, 0]);
    } else if (expectedCut > sideSize) {
      cutAdjusts.push([1, (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut)]);
    } else {
      cutAdjusts.push([1, 1]);
    }
  }

  const cornerRuns: Cubic[][] = [];
  for (let i = 0; i < n; i++) {
    const corner = corners[i]!;
    const allowed: number[] = [];
    for (let delta = 0; delta <= 1; delta++) {
      const [roundCutRatio, cutRatio] = cutAdjusts[(i + n - 1 + delta) % n]!;
      allowed.push(corner.expectedRoundCut * roundCutRatio + (corner.expectedCut - corner.expectedRoundCut) * cutRatio);
    }
    cornerRuns.push(cornerCubics(corner, allowed[0]!, allowed[1]!));
  }

  // Corners joined by straight edges; zero-length cubics (unrounded corners)
  // are dropped, the edges already meet at the vertex
  const cubics: Cubic[] = [];
  for (let i = 0; i < n; i++) {
    const run = cornerRuns[i]!;
    const nextRun = cornerRuns[(i + 1) % n]!;
    for (const c of run) if (!zeroLength(c)) cubics.push(c);
    const last = run[run.length - 1]!;
    const first = nextRun[0]!;
    const edge = straightLine(last[6], last[7], first[0], first[1]);
    if (!zeroLength(edge)) cubics.push(edge);
  }

  let cx = centerX;
  let cy = centerY;
  if (cx === undefined || cy === undefined) {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < n; i++) {
      sx += vertices[i * 2]!;
      sy += vertices[i * 2 + 1]!;
    }
    cx = sx / n;
    cy = sy / n;
  }
  return { cubics, centerX: cx, centerY: cy };
};

const radial = (radius: number, angle: number, cx: number, cy: number): Point =>
  [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];

/** A regular polygon, first vertex at angle 0 */
export const regularPolygon = (
  numVertices: number,
  radius = 1,
  centerX = 0,
  centerY = 0,
  rounding: CornerRounding = UNROUNDED,
  perVertexRounding?: CornerRounding[],
): RoundedPolygon => {
  const vertices: number[] = [];
  for (let i = 0; i < numVertices; i++) {
    vertices.push(...radial(radius, (Math.PI / numVertices) * 2 * i, centerX, centerY));
  }
  return roundedPolygon(vertices, rounding, perVertexRounding, centerX, centerY);
};

/** A circle approximated by a fully rounded polygon */
export const circle = (numVertices = 8, radius = 1, centerX = 0, centerY = 0): RoundedPolygon => {
  if (numVertices < 3) throw new Error('Circle must have at least three vertices');
  const theta = Math.PI / numVertices;
  return regularPolygon(numVertices, radius / Math.cos(theta), centerX, centerY, { radius });
};

/** A star with `numVerticesPerRadius` outer and inner vertices, outer first at angle 0 */
export const star = (
  numVerticesPerRadius: number,
  radius = 1,
  innerRadius = 0.5,
  rounding: CornerRounding = UNROUNDED,
  innerRounding?: CornerRounding,
  perVertexRounding?: CornerRounding[],
  centerX = 0,
  centerY = 0,
): RoundedPolygon => {
  if (radius <= 0 || innerRadius <= 0) throw new Error('Star radii must both be greater than 0');
  if (innerRadius >= radius) throw new Error('innerRadius must be less than radius');
  let pvRounding = perVertexRounding;
  if (!pvRounding && innerRounding) {
    pvRounding = [];
    for (let i = 0; i < numVerticesPerRadius; i++) pvRounding.push(rounding, innerRounding);
  }
  const vertices: number[] = [];
  for (let i = 0; i < numVerticesPerRadius; i++) {
    vertices.push(...radial(radius, (Math.PI / numVerticesPerRadius) * 2 * i, centerX, centerY));
    vertices.push(...radial(innerRadius, (Math.PI / numVerticesPerRadius) * (2 * i + 1), centerX, centerY));
  }
  return roundedPolygon(vertices, rounding, pvRounding, centerX, centerY);
};

export const transformPolygon = (polygon: RoundedPolygon, f: PointTransformer): RoundedPolygon => {
  const center = f(polygon.centerX, polygon.centerY);
  return { cubics: polygon.cubics.map((c) => transformCubic(c, f)), centerX: center[0], centerY: center[1] };
};

/** Rotation about the origin, in degrees, positive clockwise on a y-down canvas */
export const rotatePolygon = (polygon: RoundedPolygon, degrees: number): RoundedPolygon => {
  const a = (degrees * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return transformPolygon(polygon, (x, y) => [x * cos - y * sin, x * sin + y * cos]);
};

export const scalePolygon = (polygon: RoundedPolygon, sx: number, sy = sx): RoundedPolygon =>
  transformPolygon(polygon, (x, y) => [x * sx, y * sy]);

/** Bounding box [left, top, right, bottom] from the hull of anchors and controls */
export const polygonBounds = (polygon: RoundedPolygon): [number, number, number, number] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of polygon.cubics) {
    const b = cubicBounds(c);
    minX = Math.min(minX, b[0]);
    minY = Math.min(minY, b[1]);
    maxX = Math.max(maxX, b[2]);
    maxY = Math.max(maxY, b[3]);
  }
  return [minX, minY, maxX, maxY];
};

/** The farthest any anchor or curve midpoint gets from the centre */
export const polygonMaxRadius = (polygon: RoundedPolygon): number => {
  let max = 0;
  for (const c of polygon.cubics) {
    const mid = pointOnCurve(c, 0.5);
    max = Math.max(max, distance(c[0] - polygon.centerX, c[1] - polygon.centerY), distance(mid[0] - polygon.centerX, mid[1] - polygon.centerY));
  }
  return max;
};

/** Fits the shape into the unit square, centred, keeping its aspect ratio */
export const normalizePolygon = (polygon: RoundedPolygon): RoundedPolygon => {
  const bounds = polygonBounds(polygon);
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];
  const side = Math.max(width, height);
  const offsetX = (side - width) / 2 - bounds[0];
  const offsetY = (side - height) / 2 - bounds[1];
  return transformPolygon(polygon, (x, y) => [(x + offsetX) / side, (y + offsetY) / side]);
};
