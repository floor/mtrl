// test/styles/bem-element-names.test.ts
//
// The element classes this wave of FLO-120 renamed, pinned in the stylesheets.
//
// `classes:check` compares the names the source asks for against the names the
// stylesheets define, so it catches the rename landing on one side only. What
// it cannot catch is both sides moving back together: revert the component and
// its stylesheet and the two still agree, and the check stays green. That is
// what this file is for -- it names the migrated spelling directly, and fails
// if the dashed one comes back.
//
// The stylesheets are compiled here rather than read from dist/, for the same
// reason the check reads dist/ rather than the SCSS: `&__handle` nested inside
// `.#{$component}` is not the class name, and only the compiler knows that it
// is `mtrl-bottom-sheet__handle`.

import { describe, test, expect } from "bun:test";
import { compileString } from "sass";

const compile = (component: string): string =>
  compileString(`@use 'components/${component}';`, {
    loadPaths: ["src/styles"],
    style: "expanded",
  }).css;

/** The elements each component now spells with `__`, per stylesheet. */
const MIGRATED: Record<string, string[]> = {
  progress: ["canvas"],
  snackbar: ["action", "close"],
  "bottom-app-bar": ["actions", "fab-container"],
  select: ["menu"],
  checkbox: ["input", "icon"],
  "top-app-bar": ["headline", "leading", "trailing", "row"],
  "side-sheet": ["scrim", "container", "header", "title", "close", "content"],
  "bottom-sheet": ["scrim", "container", "handle", "header", "title", "content"],
};

const defines = (css: string, className: string): boolean =>
  new RegExp(`\\.${className.replace(/[-]/g, "\\-")}(?![a-z0-9_-])`).test(css);

describe("migrated element classes", () => {
  for (const [component, elements] of Object.entries(MIGRATED)) {
    const css = compile(component);

    for (const element of elements) {
      test(`${component} styles __${element}, not -${element}`, () => {
        expect(defines(css, `mtrl-${component}__${element}`)).toBe(true);
        expect(defines(css, `mtrl-${component}-${element}`)).toBe(false);
      });
    }
  }

  // A modifier is not an element. `mtrl-snackbar--visible` and the rest keep
  // their two dashes, and a sweep that turned every separator into `__` would
  // pass every assertion above while breaking these.
  test("block modifiers keep their two dashes", () => {
    expect(defines(compile("snackbar"), "mtrl-snackbar--visible")).toBe(true);
    expect(defines(compile("side-sheet"), "mtrl-side-sheet--open")).toBe(true);
    expect(defines(compile("top-app-bar"), "mtrl-top-app-bar--scrolled")).toBe(true);
  });

  // `mtrl-checkbox-group` is deliberately left alone: it is a group *of*
  // checkboxes, its own block, not an element of one -- the same reading that
  // keeps `button-group` whole. A later pass that "finishes" checkbox by
  // renaming it to `mtrl-checkbox__group` would be wrong, so it is pinned.
  test("checkbox-group stays a block of its own", () => {
    const css = compile("checkbox");
    expect(defines(css, "mtrl-checkbox-group")).toBe(true);
    expect(defines(css, "mtrl-checkbox__group")).toBe(false);
  });

  // The tooltip's arrow was the other direction of the same mistake: the
  // stylesheet had moved to `__arrow` while TOOLTIP_CLASSES.ARROW, which is
  // exported, still named the dashed one. Nothing in src reads that map, so
  // no test saw it; the stylesheet side is pinned here and the constant is
  // covered by `classes:check` now reading constants maps.
  test("tooltip styles __arrow", () => {
    const css = compile("tooltip");
    expect(defines(css, "mtrl-tooltip__arrow")).toBe(true);
    expect(defines(css, "mtrl-tooltip-arrow")).toBe(false);
  });
});
