// test/core/shapes.test.ts
//
// The rounded-polygon geometry and the Material shapes, against what the
// Compose Material 3 builders produce.
import { describe, test, expect } from 'bun:test';
import {
  roundedPolygon,
  regularPolygon,
  circle,
  star,
  normalizePolygon,
  polygonBounds,
  polygonMaxRadius,
  materialShape,
  radialProfile,
  pointOnCurve,
} from '../../src/core/shapes';
import type { MaterialShapeName } from '../../src/core/shapes';

const contiguous = (cubics: readonly (readonly number[])[]): boolean =>
  cubics.every((c, i) => {
    const prev = cubics[(i + cubics.length - 1) % cubics.length]!;
    return Math.abs(c[0]! - prev[6]!) < 1e-4 && Math.abs(c[1]! - prev[7]!) < 1e-4;
  });

/** Number of local maxima around a radial profile */
const peaks = (radii: Float32Array): number => {
  let count = 0;
  const n = radii.length;
  for (let i = 0; i < n; i++) {
    const prev = radii[(i + n - 1) % n]!;
    const next = radii[(i + 1) % n]!;
    if (radii[i]! > prev && radii[i]! >= next) count++;
  }
  return count;
};

describe('rounded polygons', () => {
  test('an unrounded square is four straight edges meeting at the vertices', () => {
    const square = roundedPolygon([1, 1, -1, 1, -1, -1, 1, -1]);
    expect(square.cubics.length).toBe(4);
    expect(contiguous(square.cubics)).toBe(true);
    expect(square.centerX).toBe(0);
    expect(square.centerY).toBe(0);
  });

  test('rounding a corner replaces it with an arc on the rounding circle; smoothing adds flanks', () => {
    const rounded = roundedPolygon([1, 1, -1, 1, -1, -1, 1, -1], { radius: 0.5 });
    // without smoothing the flanks have no length: 4 arcs + 4 edges
    expect(rounded.cubics.length).toBe(8);
    expect(contiguous(rounded.cubics)).toBe(true);
    // the arc of the first corner (1, 1) is centred at (0.5, 0.5) with radius 0.5
    const arc = rounded.cubics[0]!;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const [x, y] = pointOnCurve(arc, t);
      expect(Math.hypot(x - 0.5, y - 0.5)).toBeCloseTo(0.5, 2);
    }
    expect(polygonBounds(rounded)).toEqual([-1, -1, 1, 1]);
    const smoothed = roundedPolygon([1, 1, -1, 1, -1, -1, 1, -1], { radius: 0.5, smoothing: 0.5 });
    expect(smoothed.cubics.length).toBe(16);
    expect(contiguous(smoothed.cubics)).toBe(true);
  });

  test('a corner without room for its radius shares the side with its neighbour', () => {
    // a 1-wide side cannot hold two 0.8 cuts: the cuts scale to fit
    const tight = roundedPolygon([0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5], { radius: 0.8 });
    expect(contiguous(tight.cubics)).toBe(true);
    const bounds = polygonBounds(tight);
    expect(bounds[2] - bounds[0]).toBeCloseTo(1, 5);
  });

  test('a circle is round to within a fraction of a percent', () => {
    const profile = radialProfile(circle(8));
    for (const r of profile.radii) expect(r).toBeCloseTo(1, 2);
  });

  test('a regular polygon has its first vertex at angle 0; a star alternates outer and inner radii', () => {
    const pentagon = regularPolygon(5);
    expect(pentagon.cubics[0]![0]).toBeCloseTo(1, 5);
    expect(pentagon.cubics[0]![1]).toBeCloseTo(0, 5);
    const five = star(5, 1, 0.5);
    expect(polygonMaxRadius(five)).toBeCloseTo(1, 5);
    expect(five.cubics[0]![0]).toBeCloseTo(1, 5);
    expect(peaks(radialProfile(five).radii)).toBe(5);
  });

  test('normalising fits the shape into the unit square, centred', () => {
    const wide = normalizePolygon(roundedPolygon([2, 0.5, -2, 0.5, -2, -0.5, 2, -0.5]));
    expect(polygonBounds(wide).map((v) => Math.round(v * 1000) / 1000)).toEqual([0, 0.375, 1, 0.625]);
  });
});

describe('material shapes', () => {
  const names: MaterialShapeName[] = ['softBurst', 'cookie9', 'pentagon', 'pill', 'sunny', 'cookie4', 'oval', 'circle'];

  test('every shape is contiguous and normalised into the unit square', () => {
    for (const name of names) {
      const shape = materialShape(name);
      expect(contiguous(shape.cubics)).toBe(true);
      const b = polygonBounds(shape);
      expect(Math.max(b[2] - b[0], b[3] - b[1])).toBeCloseTo(1, 5);
      expect(b[0]).toBeGreaterThanOrEqual(-1e-5);
      expect(b[1]).toBeGreaterThanOrEqual(-1e-5);
    }
  });

  test('the stars have the right number of points', () => {
    expect(peaks(radialProfile(materialShape('softBurst')).radii)).toBe(10);
    expect(peaks(radialProfile(materialShape('cookie9')).radii)).toBe(9);
    expect(peaks(radialProfile(materialShape('sunny')).radii)).toBe(8);
    expect(peaks(radialProfile(materialShape('cookie4')).radii)).toBe(4);
    expect(peaks(radialProfile(materialShape('pentagon')).radii)).toBe(5);
  });

  test('the pill and the oval are elongated along the same diagonal; the cookies sit within the circle', () => {
    const longest = (radii: Float32Array) => radii.indexOf(Math.max(...radii));
    const pill = radialProfile(materialShape('pill'));
    expect(pill.maxRadius / Math.min(...pill.radii)).toBeGreaterThan(1.2);
    expect(longest(pill.radii)).toBeCloseTo(135, -1);
    const oval = radialProfile(materialShape('oval'));
    expect(oval.maxRadius / Math.min(...oval.radii)).toBeCloseTo(1 / 0.64, 1);
    expect(longest(oval.radii)).toBeCloseTo(135, -1);
    expect(polygonMaxRadius(materialShape('cookie9'))).toBeLessThanOrEqual(0.5 + 1e-3);
    // normalised on the control-point hull, as Compose does, so a hair under 0.5
    expect(radialProfile(materialShape('circle')).maxRadius).toBeCloseTo(0.5, 1);
  });

  test('profiles sample the outline around the area centroid at even angles', () => {
    const profile = radialProfile(materialShape('circle'), 90);
    expect(profile.radii.length).toBe(90);
    expect(profile.centerX).toBeCloseTo(0.5, 4);
    expect(profile.centerY).toBeCloseTo(0.5, 4);
    // the pentagon's mass sits below the middle of its box; the pivot follows it
    const pentagon = radialProfile(materialShape('pentagon'));
    expect(pentagon.centerY).toBeGreaterThan(0.52);
    // so the sampled outline has its centroid at the pivot
    const centroid = (p: ReturnType<typeof radialProfile>) => {
      const n = p.radii.length;
      const at = (i: number): [number, number] => {
        const a = (i / n) * 2 * Math.PI;
        return [p.centerX + Math.cos(a) * p.radii[i % n]!, p.centerY + Math.sin(a) * p.radii[i % n]!];
      };
      let area = 0; let cx = 0; let cy = 0;
      for (let i = 0; i < n; i++) {
        const [x0, y0] = at(i); const [x1, y1] = at(i + 1);
        const c = x0 * y1 - x1 * y0; area += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
      }
      return [cx / (3 * area), cy / (3 * area)];
    };
    for (const name of ['pentagon', 'cookie9', 'softBurst'] as const) {
      const p = radialProfile(materialShape(name));
      const [cx, cy] = centroid(p);
      expect(cx).toBeCloseTo(p.centerX, 3);
      expect(cy).toBeCloseTo(p.centerY, 3);
    }
  });
});
