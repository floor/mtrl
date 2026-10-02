// test/styles/text-field-sass.test.ts
//
// FLO-383: Sass spells the text field in two words too. 0.10.5 had both names;
// 1.0 has only `$text-field` and `text-field()`.
import { expect, test } from "bun:test";
import { compileString } from "sass";

const compile = (source: string): string =>
  compileString(source, { loadPaths: ["src/styles"] }).css.replace(/\s+/g, " ").trim();

test("text-field() reads the map, and a theme configures $text-field", () => {
  expect(compile(`@use 'abstract/variables' as v; a { a: v.text-field('height'); }`)).toBe("a { a: 56px; }");
  expect(compile(`@use 'abstract/variables' as v with ($text-field: ('height': 44px)); a { a: v.text-field('height'); }`)).toBe("a { a: 44px; }");
});

test("the 0.10 names $textfield and textfield() are gone", () => {
  expect(() => compile(`@use 'abstract/variables' as v; a { a: v.textfield('height'); }`)).toThrow(/Undefined function/);
  expect(() => compile(`@use 'abstract/variables' as v with ($textfield: ('height': 40px)); a { a: 1; }`)).toThrow(/textfield/);
});
