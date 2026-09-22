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
// source asks for, and the class names the built stylesheets define. It reads
// the *compiled* CSS rather than the SCSS, because the SCSS spells these
// through interpolation (`.#{$component}__header`) and only the build shows
// the real name.
//
// It reports, and does not fail, on classes that have never been styled --
// that is a real finding but a pre-existing one, and a rename should not be
// blocked by it. It fails when a component asks for a class whose *dashed*
// spelling exists in the CSS, because that is the migration half-done.
//
// The source side used to be `getClass("…")` literals alone, which was a
// documented blind spot and a large one: the first version of this check saw
// 12 dashed classes left in the library, while the stylesheets defined 146.
// Most element classes are not written as a literal at the call. They are
// spelled one of two other ways, and both are read here now:
//
//   - a value on a component's constants map, `ACTION: "snackbar-action"`,
//     reached as `getClass(SNACKBAR_CLASSES.ACTION)` or interpolated;
//   - a template literal that appends the element to the block,
//     `` `${component.getClass("top-app-bar")}-row` ``.
//
// Only fully resolvable spellings are collected. A template holding a second
// `${…}` -- `` `${getClass("x")}--${config.type}` `` -- names a class whose
// suffix is a runtime value, so it is skipped rather than guessed at.
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

// Component directory names, longest first so `bottom-app-bar` is matched
// whole rather than as `bottom` plus a stray `-app-bar`. An earlier sweep on
// this migration split `button-group` into `button` + `-group` and renamed a
// component as if it were an element, which is the mistake this ordering and
// the `isComponentClass` test below exist to prevent.
// CSS block aliases that differ from their component directory name.
// Time Picker is the remaining component migration in FLO-120.
const DEFERRED_BLOCKS = ["time-picker"];
const COMPONENTS = [...readdirSync("src/components")
  .filter((entry) => statSync(join("src/components", entry)).isDirectory()),
  // A group of checkboxes is an independent block, not a checkbox element.
  "checkbox-group", ...DEFERRED_BLOCKS]
  .sort((a, b) => b.length - a.length);

const sources = [...walk("src/components", ".ts"), ...walk("src/core", ".ts")];

/** `SNACKBAR_CLASSES.ACTION` -> `snackbar-action`, for every constants map. */
const constants = new Map<string, string>();
for (const file of sources.filter((f) => f.endsWith("constants.ts"))) {
  const source = readFileSync(file, "utf8");
  for (const block of source.matchAll(
    /export const ([A-Z][A-Z_0-9]*)\s*(?::[^=]+)?=\s*\{([\s\S]*?)\n\}/g
  )) {
    const [, mapName, body] = block;
    for (const entry of body.matchAll(/^\s*([A-Z][A-Z_0-9]*)\s*:\s*["'`]([^"'`]*)["'`]/gm)) {
      constants.set(`${mapName}.${entry[1]}`, entry[2]);
    }
  }
}

// A class name belongs to a component when it is that block's name, or that
// name followed by a BEM separator. All three separators have to be listed:
// `-` alone would reject `select__menu`, which is the migrated spelling and
// exactly what this check exists to compare against the stylesheet.
const isComponentClass = (value: string): boolean =>
  COMPONENTS.some(
    (component) =>
      value === component ||
      ["-", "--", "__"].some((sep) => value.startsWith(`${component}${sep}`))
  );

// `mtrl-checkbox-icon` -> `mtrl-checkbox__icon`. The separator to move is the
// one after the *block* name, which is why this goes through the component
// list rather than the first dash it finds -- `mtrl-` is itself a dash away
// from the block, and `bottom-app-bar` has two more inside it.
const migratedTwin = (name: string): string => {
  const bare = name.slice("mtrl-".length);
  const component = COMPONENTS.find((c) => bare === c || bare.startsWith(`${c}-`) || bare.startsWith(`${c}__`));
  return component && bare.startsWith(`${component}-`) && !bare.startsWith(`${component}--`) ? `mtrl-${component}__${bare.slice(component.length + 1)}` : name;
};

/** A literal `"x"` or a constants reference `MAP.KEY`, when it resolves. */
const resolve = (token: string): string | null => {
  const literal = token.match(/^["'`]([^"'`]*)["'`]$/);
  if (literal) return literal[1];
  return constants.get(token.trim()) ?? null;
};

/** Every class name the source asks for, with the file that asks for it. */
const asked = new Map<string, string[]>();
const ask = (name: string, file: string) => {
  if (!name || !isComponentClass(name)) return;
  const full = `mtrl-${name}`;
  asked.set(full, [...(asked.get(full) ?? []), file]);
};

for (const file of sources) {
  const source = readFileSync(file, "utf8");

  // getClass("snackbar__text") and getClass(SNACKBAR_CLASSES.ACTION)
  for (const match of source.matchAll(/getClass\??\.?\(\s*([^()]+?)\s*\)/g)) {
    const name = resolve(match[1]);
    if (name !== null) ask(name, file);
  }

  // `${…getClass(X)}-row` -- the block, with the element appended.
  for (const match of source.matchAll(
    /`\$\{[^`]*?getClass\??\.?\(\s*([^()]+?)\s*\)[^`{}]*\}([a-z0-9_-]*)`/g
  )) {
    const block = resolve(match[1]);
    if (block !== null) ask(block + match[2], file);
  }

  // `${PREFIX}-card-actions`, including `${prefix}-${SNACKBAR_CLASSES.ACTION}`.
  for (const match of source.matchAll(/`\$\{[A-Za-z_.$]*(?:[Pp]refix|PREFIX)\}-([^`]*)`/g)) {
    const rest = match[1].replace(
      /\$\{\s*([A-Z][A-Za-z_0-9]*\.[A-Z][A-Z_0-9]*)\s*\}/g,
      (_, ref) => constants.get(ref) ?? "\0"
    );
    // A leftover `${` is a runtime value; the name cannot be known here.
    if (rest.includes("${") || rest.includes("\0")) continue;
    ask(rest, file);
  }

  // The constants themselves. A map value that names a component's class is
  // asked for even when every use of it is interpolated somewhere this does
  // not read -- and a value no longer used at all shows up as never styled,
  // which is how the dead maps in select and top-app-bar were found.
  if (file.endsWith("constants.ts")) {
    for (const entry of source.matchAll(/^\s*[A-Z][A-Z_0-9]*\s*:\s*["'`]([^"'`]*)["'`]/gm)) {
      ask(entry[1], file);
    }
  }
}

// Reject dashed names in both compiled CSS and resolvable source spellings,
// even when a hook has no CSS rule. Shared ripple is an independent core block.
const dashedElements = [...new Set([...defined, ...asked.keys()])]
  .filter(name => migratedTwin(name) !== name).sort();
const deferred = dashedElements.filter(name => DEFERRED_BLOCKS.some(block => name.startsWith(`mtrl-${block}-`)));
if (deferred.length) {
  console.log(`FLO-120 pending: ${deferred.length} dashed Time Picker names (${deferred.filter(name => defined.has(name)).length} in compiled CSS).`);
}
const regressions = dashedElements.filter(name => !deferred.includes(name));
if (regressions.length) {
  console.error(`Remaining dashed component elements: ${regressions.join(", ")}`);
  process.exit(1);
}

const halfMigrated: string[] = [];
const neverStyled: string[] = [];

for (const [name, files] of asked) {
  if (defined.has(name)) continue;
  // A twin in the CSS under the other separator means the two sides disagree.
  // Both directions have to be tested. Checking only the migrated spelling
  // against a dashed stylesheet misses the half that actually happened here:
  // checkbox's stylesheet moved to `__icon` while one build site still asked
  // for `-icon`, and that reads as merely never styled unless the migrated
  // twin is looked for too.
  const dashed = name.replace("__", "-");
  const migrated = migratedTwin(name);
  if (dashed !== name && defined.has(dashed)) {
    halfMigrated.push(`${name} — the stylesheet still defines ${dashed} (${files[0]})`);
  } else if (migrated !== name && defined.has(migrated)) {
    halfMigrated.push(`${name} — the stylesheet defines ${migrated} instead (${files[0]})`);
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
