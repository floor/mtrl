import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import {
  componentStyles, fullOnlyStyles, themeStyles, standaloneThemes, baseStyles, typographyStyles, typographyDependencies, utilityStyles,
  resolveStyleDependencies,
} from "./style-manifest";

/** Verify CSS dependencies against the emitted JS, including lazy imports. */
async function validateRuntimeDependencies(outdir: string) {
  const missing = new Set<string>();
  for (const name of Object.keys(componentStyles)) {
    // A source map lists modules retained by the bundler, unlike a raw import
    // graph which also includes unused re-exports from shared feature barrels.
    // Keep splitting off so lazy dependencies are checked too. Maps stay in memory.
    const result = await Bun.build({
      entrypoints: [resolve(outdir, "components", name, "index.js")],
      target: "browser", format: "esm", minify: true, sourcemap: "external",
    });
    assert(result.success, `Cannot check ${name}: ${result.logs}`);
    const map = result.outputs.find(output => output.kind === "sourcemap");
    assert(map, `Missing dependency information for ${name}`);
    const { sources } = await map.json() as { sources: string[] };
    const provided = new Set(resolveStyleDependencies([name]));
    for (const source of sources) {
      const parts = relative(resolve(outdir), resolve(source)).split(sep);
      if (parts[0] === "components" && parts[1] !== name) {
        if (!provided.has(parts[1])) missing.add(`${name} uses ${parts[1]} at runtime but its CSS dependency is missing`);
      }
    }
  }
  assert.equal(missing.size, 0, [...missing].join("\n"));
}

export async function buildStyles(outdir: string, banner: string) {
  resolveStyleDependencies(Object.keys(componentStyles));
  await validateRuntimeDependencies(outdir);
  const options: sass.StringOptions<"sync"> = {
    loadPaths: [resolve("src/styles")], style: "compressed", logger: sass.Logger.silent,
  };
  const use = (sources: string[]) => sources.map((source, i) => `@use "${source}" as entry${i};`).join("\n");
  const full = sass.compileString(await readFile("src/styles/main.scss", "utf8"), options);

  // Use Sass's parsed dependency graph, not text matching, to detect manifest drift.
  const loaded = full.loadedUrls.map(url => relative(resolve("src/styles"), fileURLToPath(url)).split(sep).join("/"));
  const components = loaded.filter(path => path.startsWith("components/")).sort();
  const declared = [...Object.values(componentStyles).map(entry => entry.source), ...fullOnlyStyles]
    .map(source => source.replace(/\/([^/]+)$/, "/_$1.scss")).sort();
  assert.deepEqual(components, declared, "Component CSS manifest differs from the full stylesheet");
  const themes = loaded.filter(path => path.startsWith("themes/") && !["themes/_index.scss", "themes/_base-theme.scss"].includes(path)).sort();
  assert.deepEqual(themes, themeStyles.map(name => `themes/_${name}.scss`).sort(), "Theme CSS manifest differs from the full stylesheet");

  async function emit(path: string, sources: string[], dependencies: string[] = []) {
    const css = sass.compileString(use(sources), options).css;
    if (path.startsWith("styles/")) {
      const name = path.slice("styles/".length);
      // Vite can hoist shared CSS ahead of (or after) its consumer. Declare the
      // same cascade order in EVERY asset so the first loaded asset establishes
      // it, even when the base asset is loaded later. App CSS stays unlayered.
      const layers = ["base", "utilities", ...resolveStyleDependencies(Object.keys(componentStyles))];
      const order = `@layer ${layers.map(layer => `mtrl.${layer}`).join(",")};`;
      // Typography used to be part of the base file, so its rules stay in
      // mtrl.base. A new layer would change the order every sheet declares.
      const layer = name === "typography" ? "base" : name;
      await writeFile(`${outdir}/${path}.css`, `${banner}\n${order}@layer mtrl.${layer}{${css}}\n`);
      // JS module edges are deduplicated across entries. Nested CSS @imports
      // can be independently inlined by Vite and duplicate shared styles.
      await writeFile(`${outdir}/${path}.js`, dependencies.map(dependency => `import "./${dependency}.js";`).join("\n") +
        `\nimport "./${name}.css";\n`);
      await writeFile(`${outdir}/${path}.d.ts`, "export {};\n");
    } else {
      await writeFile(`${outdir}/${path}.css`, `${banner}\n${css}\n`);
    }
  }
  await mkdir(`${outdir}/styles`, { recursive: true });
  await mkdir(`${outdir}/themes`, { recursive: true });
  await writeFile(`${outdir}/styles.css`, `${banner}\n${full.css}\n`);
  // `import 'mtrl/styles'` resolves through the types condition under NodeNext,
  // as the per-component entries do
  await writeFile(`${outdir}/styles.d.ts`, "export {};\n");
  await emit("styles/base", baseStyles);
  await emit("styles/typography", typographyStyles, typographyDependencies);
  await emit("styles/utilities", utilityStyles);
  for (const [name, entry] of Object.entries(componentStyles)) {
    await emit(`styles/${name}`, [entry.source], entry.dependencies);
  }
  for (const name of [...themeStyles, ...standaloneThemes]) await emit(`themes/${name}`, [`themes/${name}`]);
  await emitElementStyles(outdir, options, banner);
}

/**
 * CSS for the elements' shadow roots, as modules that register it: importing
 * `mtrl/elements/css/switch` registers the switch's CSS and its dependencies.
 * Emitted for the components that have an element; importing the module
 * also proves the elements import without a DOM.
 * The shadow base (`ripple`) is what the global base stylesheet gives a
 * component in light DOM and a shadow root does not inherit.
 *
 * For SSR, link in the browser's cascade order (`applyStyles` in
 * src/elements/define.ts adopts host, then ripple, then the spec's styles):
 * `hosts/<element>.css`, then `ripple.css`, then the dependencies in
 * `resolveStyleDependencies` order, then `<component>.css`. The resolver visits
 * dependencies before their component, matching the generated JS imports.
 *
 * Each element's module also registers its pre-upgrade rules
 * (src/styles/elements), which apply to the page until the element is
 * defined. The same rules for every element are `elements/preupgrade.css`,
 * for a server-rendered page's <head>, and `preupgradeStyles(prefix)` in
 * `elements/preupgrade.js` builds them for another tag prefix.
 */
async function emitElementStyles(outdir: string, options: sass.StringOptions<"sync">, banner: string) {
  const dir = `${outdir}/elements/css`;
  await mkdir(dir, { recursive: true });
  await mkdir(`${dir}/hosts`, { recursive: true });
  const { elements } = await import("../src/elements");
  const { preupgradeSheet } = await import("../src/elements/styles");
  const definition = await import("../src/elements/define");
  const { hostStyleText } = definition;
  const preupgrade = await preupgradeStyles(Object.values(elements).map(element => element.spec.name), options);
  const write = async (name: string, source: string, imports: string[]) => {
    const css = sass.compileString(`@use "${source}";`, options).css;
    const rules = preupgrade.get(name);
    await writeFile(`${dir}/${name}.js`,
      imports.map(dependency => `import "./${dependency}.js";`).join("\n") +
      `\nimport { registerStyles${rules ? ", registerPreupgrade" : ""} } from "../styles.js";` +
      `\nregisterStyles({ ${JSON.stringify(name)}: ${JSON.stringify(css)} });\n` +
      (rules ? `registerPreupgrade({ ${JSON.stringify(name)}: ${JSON.stringify(rules)} });\n` : ""));
    await writeFile(`${dir}/${name}.css`, css);
    await writeFile(`${dir}/${name}.d.ts`, "export {};\n");
  };
  await write("ripple", "utilities/ripple", []);
  // Only components that have an element, and what their CSS depends on.
  const names = resolveStyleDependencies(Object.values(elements).flatMap(element => [...element.spec.styles]));
  const missing = [...preupgrade.keys()].filter(name => !names.includes(name));
  assert.deepEqual(missing, [], "Pre-upgrade rules for an element without a CSS module");
  for (const name of names) await write(name, componentStyles[name].source, ["ripple", ...componentStyles[name].dependencies]);
  await writeFile(`${dir}/index.js`, names.map(name => `import "./${name}.js";`).join("\n") + "\n");
  await writeFile(`${dir}/index.d.ts`, "export {};\n");

  for (const element of Object.values(elements)) {
    const hostCss = hostStyleText(element.spec);
    await writeFile(`${dir}/hosts/${element.spec.name}.css`, hostCss);
  }

  const all = [...preupgrade.values()].join("");
  await writeFile(`${outdir}/elements/preupgrade.css`, `${banner}\n${preupgradeSheet(all)}\n`);
  // `import 'mtrl/elements/preupgrade.css'` resolves through the types condition, as `mtrl/styles` does
  await writeFile(`${outdir}/elements/preupgrade.css.d.ts`, "export {};\n");
  await writeFile(`${outdir}/elements/preupgrade.js`,
    `import { DEFAULT_PREFIX, preupgradeSheet } from "./styles.js";\nconst css = ${JSON.stringify(all)};\n` +
    `/** The pre-upgrade stylesheet (elements/preupgrade.css) for a tag prefix, default "m". */\n` +
    `export const preupgradeStyles = (prefix = DEFAULT_PREFIX) => preupgradeSheet(css, [prefix]);\n`);
  await writeFile(`${outdir}/elements/preupgrade.d.ts`,
    `/** The pre-upgrade stylesheet (elements/preupgrade.css) for a tag prefix, default "m". */\n` +
    `export declare const preupgradeStyles: (prefix?: string) => string;\n`);
}

/** Partials in src/styles/elements that are shared, not an element's. */
const SHARED_PREUPGRADE = ["config", "field", "index"];

/**
 * Each element's pre-upgrade rules (src/styles/elements/_<name>.scss), by
 * name. Every element has them, and every partial is an element's or shared.
 */
export async function preupgradeStyles(names: string[], options: sass.StringOptions<"sync">): Promise<Map<string, string>> {
  const partials = (await readdir("src/styles/elements"))
    .map(file => /^_(.+)\.scss$/.exec(file)?.[1])
    .filter((name): name is string => !!name && !SHARED_PREUPGRADE.includes(name));
  assert.deepEqual([...partials].sort(), [...names].sort(), "Pre-upgrade partials differ from the elements");
  const rules = new Map<string, string>();
  for (const name of names) {
    const css = sass.compileString(`@use "elements/${name}";`, options).css;
    // Non-ASCII output would start with a byte order mark, which breaks the
    // first selector once the rules are concatenated.
    assert(/^[\x20-\x7e\n]*$/.test(css), `Pre-upgrade CSS for ${name} is not printable ASCII`);
    rules.set(name, css);
  }
  return rules;
}
