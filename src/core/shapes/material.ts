// src/core/shapes/material.ts
//
// The Material 3 shapes the loading indicator morphs through, built as the
// Compose Material 3 `MaterialShapes` builds them (vertex lists repeated
// around a centre, or stars), normalised into the unit square. Each shape
// also has a radial profile: its outline sampled at fixed angles around the
// centre, which is how the indicator interpolates one shape into the next.

import { pointOnCurve } from './cubic';
import {
  CornerRounding,
  RoundedPolygon,
  circle,
  normalizePolygon,
  polygonBounds,
  polygonMaxRadius,
  rotatePolygon,
  roundedPolygon,
  scalePolygon,
  star,
} from './polygon';

const cornerRound15: CornerRounding = { radius: 0.15 };
const cornerRound50: CornerRounding = { radius: 0.5 };

interface PointNRound {
  x: number;
  y: number;
  r: CornerRounding;
}

const point = (x: number, y: number, r: CornerRounding = { radius: 0 }): PointNRound => ({ x, y, r });

const toRadians = (degrees: number): number => (degrees / 360) * 2 * Math.PI;

/**
 * Repeats a few points around the centre, `reps` times, optionally mirroring
 * every other repetition (MaterialShapes.doRepeat)
 */
const repeat = (points: PointNRound[], reps: number, cx: number, cy: number, mirroring: boolean): PointNRound[] => {
  const result: PointNRound[] = [];
  if (mirroring) {
    const angles = points.map((p) => (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI);
    const distances = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const actualReps = reps * 2;
    const sectionAngle = 360 / actualReps;
    for (let it = 0; it < actualReps; it++) {
      for (let index = 0; index < points.length; index++) {
        const i = it % 2 === 0 ? index : points.length - 1 - index;
        if (i > 0 || it % 2 === 0) {
          const a = toRadians(sectionAngle * it + (it % 2 === 0 ? angles[i]! : sectionAngle - angles[i]! + 2 * angles[0]!));
          result.push(point(Math.cos(a) * distances[i]! + cx, Math.sin(a) * distances[i]! + cy, points[i]!.r));
        }
      }
    }
    return result;
  }
  const np = points.length;
  for (let it = 0; it < np * reps; it++) {
    const p = points[it % np]!;
    const a = toRadians(Math.floor(it / np) * (360 / reps));
    const dx = p.x - cx;
    const dy = p.y - cy;
    result.push(point(dx * Math.cos(a) - dy * Math.sin(a) + cx, dx * Math.sin(a) + dy * Math.cos(a) + cy, p.r));
  }
  return result;
};

const customPolygon = (pnr: PointNRound[], reps: number, mirroring = false, cx = 0.5, cy = 0.5): RoundedPolygon => {
  const points = repeat(pnr, reps, cx, cy, mirroring);
  const vertices: number[] = [];
  for (const p of points) vertices.push(p.x, p.y);
  return roundedPolygon(vertices, undefined, points.map((p) => p.r), cx, cy);
};

/** Names of the Material shapes available here */
export type MaterialShapeName =
  | 'circle'
  | 'oval'
  | 'pill'
  | 'pentagon'
  | 'sunny'
  | 'cookie4'
  | 'cookie9'
  | 'softBurst';

const builders: Record<MaterialShapeName, () => RoundedPolygon> = {
  circle: () => circle(10),
  oval: () => rotatePolygon(scalePolygon(circle(), 1, 0.64), -45),
  pill: () =>
    customPolygon(
      [point(0.961, 0.039, { radius: 0.426 }), point(1.001, 0.428), point(1.0, 0.609, { radius: 1 })],
      2,
      true,
    ),
  pentagon: () =>
    customPolygon(
      [point(0.5, -0.009, { radius: 0.172 }), point(1.03, 0.365, { radius: 0.164 }), point(0.828, 0.97, { radius: 0.169 })],
      1,
      true,
    ),
  sunny: () => star(8, 1, 0.8, cornerRound15),
  cookie4: () => customPolygon([point(1.237, 1.236, { radius: 0.258 }), point(0.5, 0.918, { radius: 0.233 })], 4),
  cookie9: () => rotatePolygon(star(9, 1, 0.8, cornerRound50), -90),
  softBurst: () => customPolygon([point(0.193, 0.277, { radius: 0.053 }), point(0.176, 0.055, { radius: 0.053 })], 10),
};

const cache = new Map<MaterialShapeName, RoundedPolygon>();

/** A Material shape, normalised into the unit square */
export const materialShape = (name: MaterialShapeName): RoundedPolygon => {
  let shape = cache.get(name);
  if (!shape) {
    shape = normalizePolygon(builders[name]());
    cache.set(name, shape);
  }
  return shape;
};

/** A shape's outline as radii at evenly spaced angles around its centre */
export interface RadialProfile {
  /** Radius at angle i * 2π / radii.length, clockwise from the positive x axis on a y-down canvas */
  radii: Float32Array;
  centerX: number;
  centerY: number;
  /** The largest radius, for fitting the shape into a circle */
  maxRadius: number;
}

const TWO_PI = Math.PI * 2;

/**
 * Samples the outline at `samples` angles. The shape must be star-shaped
 * around its bounds centre, which every Material shape is: each ray from the
 * centre crosses the outline once.
 */
export const radialProfile = (polygon: RoundedPolygon, samples = 360, stepsPerCubic = 24): RadialProfile => {
  const bounds = polygonBounds(polygon);
  const centerX = (bounds[0] + bounds[2]) / 2;
  const centerY = (bounds[1] + bounds[3]) / 2;

  // The outline as (angle, radius) pairs, sorted by angle
  const outline: [number, number][] = [];
  for (const cubic of polygon.cubics) {
    for (let s = 0; s < stepsPerCubic; s++) {
      const [x, y] = pointOnCurve(cubic, s / stepsPerCubic);
      const dx = x - centerX;
      const dy = y - centerY;
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += TWO_PI;
      outline.push([angle, Math.hypot(dx, dy)]);
    }
  }
  outline.sort((a, b) => a[0] - b[0]);
  const last = outline[outline.length - 1]!;
  const first = outline[0]!;
  outline.unshift([last[0] - TWO_PI, last[1]]);
  outline.push([first[0] + TWO_PI, first[1]]);

  const radii = new Float32Array(samples);
  let j = 0;
  let maxRadius = 0;
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * TWO_PI;
    while (outline[j + 1]![0] < angle) j++;
    const [a0, r0] = outline[j]!;
    const [a1, r1] = outline[j + 1]!;
    const t = a1 === a0 ? 0 : (angle - a0) / (a1 - a0);
    const r = r0 + (r1 - r0) * t;
    radii[i] = r;
    if (r > maxRadius) maxRadius = r;
  }
  return { radii, centerX, centerY, maxRadius };
};

export { polygonMaxRadius };
