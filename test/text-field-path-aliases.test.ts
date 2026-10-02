// test/text-field-path-aliases.test.ts
//
// FLO-560: 1.0 spells the text field in two words in its paths as well
// (`mtrl/components/text-field`, `mtrl/styles/text-field`, …). 0.10.7 offers
// the new paths beside the old ones, so every import can move before the
// upgrade: four exact keys in the export map, pointing at the files the old
// paths resolve to, and a Sass partial that forwards the old one.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import * as sass from "sass";

type Target = Record<string, string>;
const exportsMap = (JSON.parse(readFileSync("package.json", "utf8")) as { exports: Record<string, Target> }).exports;

/** What a pattern key resolves `textfield` to: its targets with `*` filled in. */
const viaPattern = (pattern: string): Target =>
  Object.fromEntries(Object.entries(exportsMap[pattern]!).map(([condition, target]) => [condition, target.replace("*", "textfield")]));

const ALIASES: Array<[alias: string, pattern: string]> = [
  ["./components/text-field", "./components/*"],
  ["./components/text-field/constants", "./components/*/constants"],
  ["./styles/text-field", "./styles/*"],
  ["./elements/css/text-field", "./elements/css/*"],
];

describe("the text field's two-word paths", () => {
  for (const [alias, pattern] of ALIASES) {
    test(`${alias} points at the files ${pattern.replace("*", "textfield")} resolves to`, () => {
      expect(exportsMap[alias]).toEqual(viaPattern(pattern));
    });
  }

  test("an exact key comes before the pattern that would otherwise match it", () => {
    // Node picks the exact key whatever the order; a reader, and some tools, read top down.
    const keys = Object.keys(exportsMap);
    for (const [alias, pattern] of ALIASES) expect(keys.indexOf(alias)).toBeLessThan(keys.indexOf(pattern));
  });

  test("the Sass partial components/text-field forwards components/textfield: the same CSS", () => {
    const options: sass.StringOptions<"sync"> = { loadPaths: ["src/styles"], style: "compressed", logger: sass.Logger.silent };
    const compile = (name: string): string => sass.compileString(`@use "components/${name}";`, options).css;
    expect(compile("text-field")).toBe(compile("textfield"));
    expect(compile("text-field").length).toBeGreaterThan(1000);
  });
});
