#!/usr/bin/env bun
// Every class the components ask for is defined by the stylesheets.
//
// Written for the BEM migration (FLO-120), which renames element classes on
// both sides at once -- `mtrl-dialog-header` to `mtrl-dialog__header` -- and
// silently produces an unstyled component if the two sides disagree.
//
// The existing checks do not cover this:
//
//   - `bun test` asserts class names in JSDOM, which has no stylesheet, so a
//     component with no matching CSS passes every test.
//   - `consumer:check` renders real pages in Chromium, but only builds a
//     button and a textfield. It reports 128 comparisons, which is 128 for
//     those two components across themes and viewports -- not coverage of the
//     library. A dialog rename passes it untouched, which is how this check
//     came to be written.
//
// So this compares the two artefacts directly: the class names the component
// source passes to `getClass()`, and the class names the built stylesheets
// define. It reads the *compiled* CSS rather than the SCSS, because the SCSS
// spells these through interpolation (`.#{$component}__header`) and only the
// build shows the real name.
//
// It reports, and does not fail, on classes that have never been styled --
// that is a real finding but a pre-existing one, and a rename should not be
// blocked by it. It fails when a component asks for a class whose *dashed*
// spelling exists in the CSS, because that is the migration half-done.
//
//   bun run scripts/check-class-names.ts

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const walk = (dir: string, ext: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, ext, out);
    else if (path.endsWith(ext)) out.push(path);
  }
  return out;
};

if (!existsSync("dist")) {
  console.error("check-class-names: no dist/. Run `bun run build` first.");
  process.exit(1);
}

const css = walk("dist", ".css").map((p) => readFileSync(p, "utf8")).join("\n");
const defined = new Set(Array.from(css.matchAll(/\.(mtrl-[a-z0-9_-]+)/g), (m) => m[1]));

/** Every getClass("…") argument, with the file that asks for it. */
const asked = new Map<string, string[]>();
for (const file of walk("src/components", ".ts")) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/getClass\(\s*["'`]([a-z][a-z0-9_-]*)["'`]\s*\)/g)) {
    const name = `mtrl-${match[1]}`;
    asked.set(name, [...(asked.get(name) ?? []), file]);
  }
}

const halfMigrated: string[] = [];
const neverStyled: string[] = [];

for (const [name, files] of asked) {
  if (defined.has(name)) continue;
  // A dashed twin in the CSS means the two sides disagree about this class.
  const dashed = name.replace("__", "-");
  if (dashed !== name && defined.has(dashed)) {
    halfMigrated.push(`${name} — the stylesheet still defines ${dashed} (${files[0]})`);
  } else {
    neverStyled.push(`${name} (${files[0]})`);
  }
}

console.log(
  `check-class-names: ${asked.size} classes asked for, ${defined.size} defined by the stylesheets.`
);

if (neverStyled.length) {
  console.log(`\n  ${neverStyled.length} asked for and never styled (reported, not failed):`);
  for (const line of neverStyled.sort()) console.log(`    ${line}`);
}

if (halfMigrated.length) {
  console.error(`\n  ${halfMigrated.length} class(es) renamed on one side only:`);
  for (const line of halfMigrated.sort()) console.error(`    ${line}`);
  console.error("\n  The component and its stylesheet disagree; the element will be unstyled.");
  process.exit(1);
}

console.log("\n  No class is renamed on one side only.");
