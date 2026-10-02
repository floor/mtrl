// test/core/material-shapes.test.ts
//
// FLO-346: the 35 Material 3 Expressive shapes, held to Compose. The fixture
// is Compose Material 3's own MaterialShapes builders, run on graphics-shapes
// 1.0.1 (the version Compose depends on) by scripts/generate-material-shapes.kt:
// every shape here must match it cubic for cubic.
import { describe, expect, test } from "bun:test";
import {
  materialShape,
  materialShapePath,
  polygonBounds,
  polygonPath,
  radialProfile,
  shapeCookie4Sided,
  shapeCookie9Sided,
  shapeHeart,
  shapeSquare,
  type MaterialShapeName,
} from "../../src/core/shapes";
import fixture from "../fixtures/material-shapes.json";

const reference = fixture.shapes as Record<string, number[][]>;
const names = Object.keys(reference) as MaterialShapeName[];

describe("the fixture", () => {
  test("is Compose's MaterialShapes at a recorded revision, on graphics-shapes 1.0.1", () => {
    expect(fixture.source.androidx).toMatch(/^[0-9a-f]{40}$/);
    expect(fixture.source.file).toContain("MaterialShapes.kt");
    expect(fixture.source.graphicsShapes).toBe("androidx.graphics:graphics-shapes-desktop:1.0.1");
    expect(names).toHaveLength(35);
  });
});

describe("every Material shape", () => {
  for (const name of names) {
    test(`${name} matches Compose, cubic for cubic`, () => {
      const cubics = materialShape(name).cubics;
      const expected = reference[name]!;
      expect(cubics.length).toBe(expected.length);
      let worst = 0;
      cubics.forEach((cubic, i) => cubic.forEach((value, k) => (worst = Math.max(worst, Math.abs(value - expected[i]![k]!)))));
      expect(worst).toBeLessThan(1e-4);
    });
  }

  test("is normalised into the unit square, filling it along its longer side", () => {
    for (const name of names) {
      const [left, top, right, bottom] = polygonBounds(materialShape(name));
      for (const edge of [left, top]) expect(edge).toBeGreaterThanOrEqual(-1e-9);
      for (const edge of [right, bottom]) expect(edge).toBeLessThanOrEqual(1 + 1e-9);
      expect(Math.max(right - left, bottom - top)).toBeCloseTo(1, 9);
    }
  });

  test("is one closed run of cubics, each starting where the last ended", () => {
    for (const name of names) {
      const cubics = materialShape(name).cubics;
      expect(cubics.length).toBeGreaterThan(2);
      cubics.forEach((cubic, i) => {
        const next = cubics[(i + 1) % cubics.length]!;
        expect(next[0]).toBe(cubic[6]);
        expect(next[1]).toBe(cubic[7]);
      });
    }
  });

  test("is built once", () => {
    expect(shapeHeart()).toBe(shapeHeart());
    expect(materialShape("heart")).toBe(shapeHeart());
  });
});

describe("names", () => {
  test("1.0 has only Compose's names: the 'cookie4' and 'cookie9' aliases are gone", () => {
    expect(materialShape("cookie4Sided")).toBe(shapeCookie4Sided());
    expect(materialShape("cookie9Sided")).toBe(shapeCookie9Sided());
    // @ts-expect-error 'cookie4' was 0.10's alias of 'cookie4Sided'
    expect(() => materialShape("cookie4")).toThrow();
  });
});

describe("SVG paths", () => {
  test("an outline as M, one C per cubic, Z, scaled to the size", () => {
    const polygon = shapeHeart();
    const path = polygonPath(polygon, 48);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.split("C")).toHaveLength(polygon.cubics.length + 1);
    const [x, y] = path.slice(1, path.indexOf("C")).split(" ").map(Number);
    expect(x).toBeCloseTo(polygon.cubics[0]![0] * 48, 2);
    expect(y).toBeCloseTo(polygon.cubics[0]![1] * 48, 2);
  });

  test("the rounded square, at 100", () => {
    expect(polygonPath(shapeSquare(), 100)).toBe(
      "M91.213 91.213C85.784 96.642 78.284 100 70 100C56.667 100 43.333 100 30 100C13.431 100 0 86.569 0 70C0 56.667 0 43.333 0 30C0 13.431 13.431 0 30 0C43.333 0 56.667 0 70 0C86.569 0 100 13.431 100 30C100 43.333 100 56.667 100 70C100 78.284 96.642 85.784 91.213 91.213Z",
    );
  });

  test("materialShapePath is polygonPath of the named shape", () => {
    expect(materialShapePath("clover4Leaf", 24)).toBe(polygonPath(materialShape("clover4Leaf"), 24));
    expect(materialShapePath("circle")).toBe(polygonPath(materialShape("circle"), 1));
  });
});

describe("radial profiles", () => {
  const notStarShaped = ["puffy", "pixelTriangle"];

  test("every star-shaped Material shape has one", () => {
    for (const name of names.filter((n) => !notStarShaped.includes(n))) {
      const profile = radialProfile(materialShape(name), 120);
      expect(profile.radii).toHaveLength(120);
      expect(profile.maxRadius).toBeGreaterThan(0);
    }
  });

  test("a shape that doubles back as seen from its centroid is refused, not sampled wrong", () => {
    for (const name of notStarShaped) {
      expect(() => radialProfile(materialShape(name as MaterialShapeName))).toThrow(/not star-shaped/);
    }
  });
});
