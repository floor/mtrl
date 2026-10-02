// FLO-539. Typography leaves mtrl/styles/base. The build writes the moved
// rules to dist/styles/typography.css; these tests compile the same sources
// the build emits (the tests job has no dist/).
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import * as sass from "sass";
import { baseStyles, componentStyles } from "../../scripts/style-manifest";

const options: sass.StringOptions<"sync"> = {
  loadPaths: ["src/styles"], style: "compressed", logger: sass.Logger.silent,
};

const compile = (sources: string[]): string =>
  sass.compileString(sources.map((source, i) => `@use "${source}" as entry${i};`).join("\n"), options).css;

const ROLES = [
  "display-large", "display-medium", "display-small",
  "headline-large", "headline-medium", "headline-small",
  "title-large", "title-medium", "title-small",
  "body-large", "body-medium", "body-small",
  "label-large", "label-medium", "label-small",
] as const;

const TEXT_UTILITIES = [
  ".mtrl-text-center", ".mtrl-text-left", ".mtrl-text-right",
  ".mtrl-font-thin", ".mtrl-font-light", ".mtrl-font-regular", ".mtrl-font-medium", ".mtrl-font-bold",
  ".mtrl-truncate", ".mtrl-truncate-2", ".mtrl-truncate-3",
];

/** body-medium's font, size and line-height: the base body rule reads these. */
const BODY_THREE = [
  "--mtrl-sys-typescale-body-medium-font",
  "--mtrl-sys-typescale-body-medium-font-size",
  "--mtrl-sys-typescale-body-medium-line-height",
];

const declared = (css: string): string[] =>
  [...new Set([...css.matchAll(/(--mtrl-sys-typescale-[\w-]+)\s*:/g)].map((match) => match[1]!))].sort();

/** Selectors (rule preludes) and declared custom properties, for the full sheet. */
const census = (css: string): { selectors: string[]; properties: string[] } => {
  const without = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const properties = [...new Set([...without.matchAll(/(--[A-Za-z_][\w-]*)\s*:/g)].map((match) => match[1]!))].sort();
  const selectors: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < without.length; i++) {
    const ch = without[i];
    if (ch === "{") {
      if (depth === 0) {
        const prelude = without.slice(start, i).trim();
        if (prelude) selectors.push(prelude);
      }
      depth++;
      start = i + 1;
    } else if (ch === "}") {
      depth--;
      if (depth < 0) depth = 0;
      start = i + 1;
    }
  }
  return { selectors: [...new Set(selectors)].sort(), properties };
};

const typographySources = (await import("../../scripts/style-manifest") as { typographyStyles?: string[] }).typographyStyles;

describe("mtrl/styles/typography", () => {
  test("the build emits dist/styles/typography.css in the base cascade layer", () => {
    const build = readFileSync("scripts/build-styles.ts", "utf8");
    expect(build).toContain('emit("styles/typography", typographyStyles, typographyDependencies)');
    // The rules lived in mtrl.base. A new layer name would change the order
    // every stylesheet declares, which is what keeps load order from mattering.
    expect(build).toContain('name === "typography" ? "base"');
    expect(typographySources).toEqual(["base/typescale", "base/typography"]);
  });

  test("typography.css contains the type classes, text utilities, headings and every typescale token", () => {
    expect(typographySources, "typographyStyles is missing from the manifest").toBeDefined();
    const css = compile(typographySources!);
    for (const role of ROLES) expect(css).toContain(`.mtrl-${role}{`);
    for (const utility of TEXT_UTILITIES) expect(css).toContain(`${utility}{`);
    for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6", "p"]) {
      expect(css).toContain(`${tag}{font-family:var(--mtrl-sys-typescale-`);
    }
    const tokens = declared(css);
    const expected = ROLES.flatMap((role) =>
      ["font", "font-size", "line-height", "letter-spacing", "font-weight"].map((part) => `--mtrl-sys-typescale-${role}-${part}`),
    ).sort();
    expect(tokens).toEqual(expected);
  });

  test("base.css keeps body-medium's three tokens and none of the typography that left", () => {
    const css = compile(baseStyles);
    for (const role of ROLES) expect(css).not.toContain(`.mtrl-${role}{`);
    for (const utility of TEXT_UTILITIES) expect(css).not.toContain(`${utility}{`);
    expect(css).not.toContain("var(--mtrl-sys-typescale-headline-");
    expect(css).not.toContain("var(--mtrl-sys-typescale-title-large-");
    expect(declared(css)).toEqual(BODY_THREE);
    expect(css).toContain("font-family:var(--mtrl-sys-typescale-body-medium-font)");
    expect(css).toContain("font-size:var(--mtrl-sys-typescale-body-medium-font-size)");
    expect(css).toContain("line-height:var(--mtrl-sys-typescale-body-medium-line-height)");
  });

  test("the full stylesheet's selectors and custom properties are unchanged", () => {
    const css = sass.compileString('@use "main";', options).css;
    const snapshot = JSON.parse(readFileSync("test/styles/full-stylesheet.snapshot.json", "utf8")) as {
      selectors: string[]; properties: string[];
    };
    expect(census(css)).toEqual(snapshot);
  });

  test("component and element stylesheets do not read a typescale token or type class", () => {
    const elements = readdirSync("src/styles/elements")
      .map((file) => /^_(.+)\.scss$/.exec(file)?.[1])
      .filter((name): name is string => !!name && !["config", "field", "index"].includes(name));
    const sources = [
      ...Object.values(componentStyles).map((entry) => entry.source),
      ...elements.map((name) => `elements/${name}`),
    ];
    const css = compile(sources);
    expect(css).not.toContain("--mtrl-sys-typescale-");
    for (const role of ROLES) expect(css).not.toContain(`.mtrl-${role}`);
    // The typeface tokens stay on the base and inherit into shadow roots.
    expect(css).toContain("var(--mtrl-ref-typeface-");
  });
});
