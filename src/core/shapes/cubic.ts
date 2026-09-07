// src/core/shapes/cubic.ts
//
// Cubic Bézier helpers, after androidx.graphics.shapes Cubic.kt.

/** A cubic Bézier: anchor 0, control 0, control 1, anchor 1 */
export type Cubic = readonly [number, number, number, number, number, number, number, number];

/** A 2D point */
export type Point = readonly [number, number];

/** Below this distance two points are the same point */
export const DISTANCE_EPSILON = 1e-4;

export const lerp = (start: number, stop: number, fraction: number): number =>
  (1 - fraction) * start + fraction * stop;

export const distance = (x: number, y: number): number => Math.sqrt(x * x + y * y);

/** Unit vector in the direction of (x, y) */
export const direction = (x: number, y: number): Point => {
  const d = distance(x, y);
  if (d <= 0) throw new Error('Required distance greater than zero');
  return [x / d, y / d];
};

export const rotate90 = ([x, y]: Point): Point => [-y, x];

export const dot = (a: Point, b: Point): number => a[0] * b[0] + a[1] * b[1];

/** A straight segment expressed as a cubic */
export const straightLine = (x0: number, y0: number, x1: number, y1: number): Cubic => [
  x0, y0,
  lerp(x0, x1, 1 / 3), lerp(y0, y1, 1 / 3),
  lerp(x0, x1, 2 / 3), lerp(y0, y1, 2 / 3),
  x1, y1,
];

/**
 * A circular arc from (x0, y0) to (x1, y1) around (centerX, centerY),
 * approximated by one cubic; the arc must be under 180 degrees.
 */
export const circularArc = (
  centerX: number, centerY: number,
  x0: number, y0: number,
  x1: number, y1: number,
): Cubic => {
  const p0d = direction(x0 - centerX, y0 - centerY);
  const p1d = direction(x1 - centerX, y1 - centerY);
  const rotatedP0 = rotate90(p0d);
  const rotatedP1 = rotate90(p1d);
  const clockwise = dot(rotatedP0, [x1 - centerX, y1 - centerY]) >= 0;
  const cosa = dot(p0d, p1d);
  if (cosa > 0.999) return straightLine(x0, y0, x1, y1);
  const k =
    (distance(x0 - centerX, y0 - centerY) * 4 / 3) *
    ((Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa)) / (1 - cosa)) *
    (clockwise ? 1 : -1);
  return [
    x0, y0,
    x0 + rotatedP0[0] * k, y0 + rotatedP0[1] * k,
    x1 - rotatedP1[0] * k, y1 - rotatedP1[1] * k,
    x1, y1,
  ];
};

export const pointOnCurve = (c: Cubic, t: number): Point => {
  const u = 1 - t;
  return [
    c[0] * (u * u * u) + c[2] * (3 * t * u * u) + c[4] * (3 * t * t * u) + c[6] * (t * t * t),
    c[1] * (u * u * u) + c[3] * (3 * t * u * u) + c[5] * (3 * t * t * u) + c[7] * (t * t * t),
  ];
};

export const reverseCubic = (c: Cubic): Cubic => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]];

export const zeroLength = (c: Cubic): boolean =>
  Math.abs(c[0] - c[6]) < DISTANCE_EPSILON && Math.abs(c[1] - c[7]) < DISTANCE_EPSILON;

export type PointTransformer = (x: number, y: number) => Point;

export const transformCubic = (c: Cubic, f: PointTransformer): Cubic => {
  const a0 = f(c[0], c[1]);
  const c0 = f(c[2], c[3]);
  const c1 = f(c[4], c[5]);
  const a1 = f(c[6], c[7]);
  return [a0[0], a0[1], c0[0], c0[1], c1[0], c1[1], a1[0], a1[1]];
};

/**
 * The bounding box of a cubic as [left, top, right, bottom]. The approximate
 * box is the hull of anchors and controls, which is what the library uses to
 * normalise shapes.
 */
export const cubicBounds = (c: Cubic): [number, number, number, number] => {
  if (zeroLength(c)) return [c[0], c[1], c[0], c[1]];
  return [
    Math.min(c[0], c[2], c[4], c[6]),
    Math.min(c[1], c[3], c[5], c[7]),
    Math.max(c[0], c[2], c[4], c[6]),
    Math.max(c[1], c[3], c[5], c[7]),
  ];
};
