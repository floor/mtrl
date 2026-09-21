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
import { readFileSync } from "node:fs";

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

  // Wave 4.
  radios: ["item", "input", "label", "control", "circle", "ripple", "text"],
  textfield: [
    "input",
    "prefix",
    "suffix",
    "leading-icon",
    "trailing-icon",
    "helper",
    "required",
  ],
  // `thumb-icon` is not written anywhere as `&-thumb-icon`: in the stylesheet
  // `&-icon` is nested inside `&-thumb`, so renaming only the parent is what
  // produces it. Pinned here because that is easy to "fix" into
  // `__thumb__icon` by someone tidying the child too.
  switch: ["container", "content", "input", "track", "thumb", "thumb-icon", "helper"],
  tabs: ["divider", "indicator", "scroll", "scroll-indicator", "scroll-button"],
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

  // The tabs stylesheet carries two blocks: `mtrl-tabs` is the container and
  // `mtrl-button.mtrl-tab` the individual tab. Only the container's elements
  // were migrated, so the tab keeps its own spelling -- a sweep that took the
  // whole file would rename this too, and it is not an element of `tabs`.
  test("the individual tab is its own block, not an element of tabs", () => {
    const css = compile("tabs");
    expect(defines(css, "mtrl-tab")).toBe(true);
    expect(defines(css, "mtrl-tabs__tab")).toBe(false);
  });

  // `mtrl-ripple` is a block of its own, built by the core ripple feature and
  // styled by whichever component hosts it. radios has an *element* that
  // happens to share the word, and driving the rename by element name alone
  // rewrote the core one too on the first pass here -- caught by the suite,
  // not by reading. There is no ripple stylesheet to compile, so the core
  // spelling is pinned where it is actually written.
  test("the core ripple keeps its own block name", () => {
    expect(defines(compile("radios"), "mtrl-radios__ripple")).toBe(true);

    const core = readFileSync("src/core/compose/features/ripple.ts", "utf8");
    expect(core).toContain("`${PREFIX}-ripple`");
    expect(core).not.toContain("`${PREFIX}__ripple`");
  });
});
