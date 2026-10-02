#!/usr/bin/env bun
// scripts/check-elements-css.ts
/** Build first. Verify the CSS assets used by server-rendered element links. */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { elements } from "../src/elements";
import { hostStyleText } from "../src/elements/define";
import { componentStyles, resolveStyleDependencies, typographyDependencies } from "./style-manifest";

const dir = "dist/elements/css";
const names = ["ripple", ...resolveStyleDependencies(Object.values(elements).flatMap(element => [...element.spec.styles]))];
const files = await readdir(dir);
assert.deepEqual(
  files.filter(file => file.endsWith(".js") && file !== "index.js").sort(),
  names.map(name => `${name}.js`).sort(),
  "Every element style and dependency must have a JS module",
);

for (const name of names) {
  const js = await readFile(join(dir, `${name}.js`), "utf8");
  const css = await readFile(join(dir, `${name}.css`), "utf8");
  assert(css.length > 0, `${name}.css is empty`);
  assert(
    js.includes(`registerStyles({ ${JSON.stringify(name)}: ${JSON.stringify(css)} });`),
    `${name}.css differs from the registered CSS string`,
  );
  assert.equal(
    import.meta.resolve(`mtrl/elements/css/${name}.css`),
    pathToFileURL(resolve(dir, `${name}.css`)).href,
    `${name}.css export must resolve to the CSS file`,
  );
  assert.equal(
    import.meta.resolve(`mtrl/elements/css/${name}`),
    pathToFileURL(resolve(dir, `${name}.js`)).href,
    `${name} must keep resolving to the JS registration module`,
  );
}

for (const { spec } of Object.values(elements)) {
  const file = join(dir, "hosts", `${spec.name}.css`);
  assert.equal(
    await readFile(file, "utf8"),
    hostStyleText(spec),
    `${spec.name} host CSS differs from the browser's registered string`,
  );
  assert.equal(
    import.meta.resolve(`mtrl/elements/css/hosts/${spec.name}.css`),
    pathToFileURL(resolve(file)).href,
    `${spec.name} host export must resolve to the CSS file`,
  );
}

// The selective style modules import their dependencies before their own CSS.
// For typography it is the fix itself: its sheet shares the mtrl.base layer
// with the reset, at the same specificity, so the base has to load first
// (test/styles/typography-order.test.ts measures both orders).
const styleModules: Array<[string, string[]]> = [
  ["typography", typographyDependencies],
  ...Object.entries(componentStyles).map(([name, entry]): [string, string[]] => [name, entry.dependencies]),
];
for (const [name, dependencies] of styleModules) {
  assert.equal(
    await readFile(`dist/styles/${name}.js`, "utf8"),
    dependencies.map(dependency => `import "./${dependency}.js";`).join("\n") + `\nimport "./${name}.css";\n`,
    `dist/styles/${name}.js must import its dependencies, then its own CSS`,
  );
}

console.log(`elements-css:check: ${names.length} CSS modules and ${Object.keys(elements).length} host files match their registered strings; CSS and JS exports resolve; ${styleModules.length} style modules import their dependencies first`);
