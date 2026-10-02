// test/styles/text-field-sass.test.ts
//
// FLO-383: Sass spells the text field in two words too. 0.10.5 has both
// names: `$text-field` / `text-field()` and the deprecated `$textfield` /
// `textfield()`, one map, so a theme may configure either. `material` 3.0.0 keeps only the
// new ones.
import { describe, expect, test } from "bun:test";
import { compileString } from "sass";

const css = (source: string): string =>
  compileString(source, { loadPaths: ["src/styles"] }).css.replace(/\s+/g, " ").trim();

describe("the text field's Sass map and function (FLO-383)", () => {
  test("text-field() and the deprecated textfield() read the same values", () => {
    const keys = ["width", "height", "height-small", "border-radius", "icon-size"];
    const read = (fn: string) => css(`@use 'abstract/variables' as v; a { ${keys.map((k, i) => `p${i}: v.${fn}('${k}');`).join(" ")} }`);
    expect(read("text-field")).toBe(read("textfield"));
    expect(css(`@use 'abstract/variables' as v; a { a: v.text-field('height'); }`)).toBe("a { a: 56px; }");
  });

  test("a theme may configure either name, and both functions see it", () => {
    const old = `@use 'abstract/variables' as v with ($textfield: ('height': 40px)); a { a: v.text-field('height'); b: v.textfield('height'); }`;
    const now = `@use 'abstract/variables' as v with ($text-field: ('height': 44px)); a { a: v.text-field('height'); b: v.textfield('height'); }`;
    expect(css(old)).toBe("a { a: 40px; b: 40px; }");
    expect(css(now)).toBe("a { a: 44px; b: 44px; }");
  });
});
