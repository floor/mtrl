// The base and the typography sheet are both in `@layer mtrl.base`, and both
// have rules for h1 to h6 and p: the reset's `margin: 0`, and the typography
// sheet's `margin-bottom`. Same layer, same specificity, so the later sheet
// wins: typography has to come after the base. This resolves that cascade for
// the two compiled sheets in both orders, and checks that the typography
// module imports the base first, so a JS import cannot get it wrong (from
// #475's review).
import { describe, expect, test } from "bun:test";
import * as sass from "sass";
import { baseStyles, typographyDependencies, typographyStyles } from "../../scripts/style-manifest";

const options: sass.StringOptions<"sync"> = {
  loadPaths: ["src/styles"], style: "compressed", logger: sass.Logger.silent,
};
const compile = (sources: string[]): string =>
  sass.compileString(sources.map((source, i) => `@use "${source}" as entry${i};`).join("\n"), options).css;

/** [specificity, value] of every top-level declaration of `margin-bottom` (or `margin`) that reaches `tag`. */
const marginBottoms = (css: string, tag: string): Array<{ specificity: number; value: string }> => {
  const found: Array<{ specificity: number; value: string }> = [];
  for (const [, prelude, body] of css.matchAll(/(?<=^|\})([^{}@]+)\{([^{}]*)\}/g)) {
    // `:where(h1,p)` matches with no specificity; a bare `h1` with one element
    const where = prelude!.match(/^:where\(([^)]*)\)$/);
    const selectors = (where ? where[1]! : prelude!).split(",");
    if (!selectors.includes(tag)) continue;
    for (const declaration of body!.split(";")) {
      const [property, value] = declaration.split(":");
      if (property === "margin" || property === "margin-bottom") found.push({ specificity: where ? 0 : 1, value: value! });
    }
  }
  return found;
};

/** The winning `margin-bottom` with the sheets in this order, in one layer. */
const resolved = (sheets: string[], tag: string): string => {
  let winner = { specificity: -1, value: "(unset)" };
  for (const css of sheets) for (const candidate of marginBottoms(css, tag)) {
    if (candidate.specificity >= winner.specificity) winner = candidate;
  }
  return winner.value;
};

describe("the base and the typography sheet, in either order", () => {
  const base = compile(baseStyles);
  const typography = compile(typographyStyles);

  test("both sheets set a margin on h1 and p", () => {
    expect(marginBottoms(base, "h1").map((found) => found.value)).toEqual(["0"]);
    expect(marginBottoms(typography, "h1").map((found) => found.value)).toEqual([".5em"]);
    expect(marginBottoms(typography, "p").map((found) => found.value)).toEqual(["1em"]);
  });

  test("typography after the base: headings keep 0.5em and paragraphs 1em below", () => {
    for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) expect([tag, resolved([base, typography], tag)]).toEqual([tag, ".5em"]);
    expect(resolved([base, typography], "p")).toBe("1em");
  });

  test("typography before the base: the reset wins and the margins are gone, so the order matters", () => {
    expect(resolved([typography, base], "h1")).toBe("0");
    expect(resolved([typography, base], "p")).toBe("0");
  });

  test("the typography module imports the base first, as a component's imports its dependencies", () => {
    expect(typographyDependencies).toEqual(["base"]);
  });
});
