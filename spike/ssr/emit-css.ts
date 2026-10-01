// spike/ssr/emit-css.ts — Risk 3: the element CSS as real .css files.
//
// The element CSS ships only as JS modules today (dist/elements/css/<name>.js,
// each `registerStyles({ name: "<css>" })`). This extracts the same strings
// into spike/ssr/out/css/<name>.css, plus host-<element>.css (the shared host
// rules plus the spec's hostStyles, which define() registers at runtime).
// In the real build this is one more writeFile in emitElementStyles
// (scripts/build-styles.ts) and one per element for the host rules.
//
//   bun run build && bun spike/ssr/emit-css.ts

import { readdir, mkdir } from "node:fs/promises";

const root = `${import.meta.dir}/../..`;
const out = `${import.meta.dir}/out/css`;
await mkdir(out, { recursive: true });

const sizes: Record<string, number> = {};
for (const file of (await readdir(`${root}/dist/elements/css`)).filter((f) => f.endsWith(".js") && f !== "index.js")) {
  const text = await Bun.file(`${root}/dist/elements/css/${file}`).text();
  const body = text.replace(/^import .*$/gm, "");
  const found: Record<string, string> = {};
  new Function("registerStyles", "registerPreupgrade", body)((css: Record<string, string>) => Object.assign(found, css), () => {});
  for (const [name, css] of Object.entries(found)) {
    await Bun.write(`${out}/${name}.css`, css);
    sizes[name] = css.length;
  }
}

// Host rules: BASE_HOST_STYLES (src/elements/define.ts) + spec.hostStyles.
const BASE_HOST_STYLES =
  ":host{display:inline-block}:host([hidden]){display:none}*,*::before,*::after{box-sizing:border-box}";
const { elements } = await import("../../src/elements");
for (const element of Object.values(elements)) {
  const css = BASE_HOST_STYLES + (element.spec.hostStyles ?? "");
  await Bun.write(`${out}/host-${element.spec.name}.css`, css);
}
const total = Object.values(sizes).reduce((a, b) => a + b, 0);
console.log(`${Object.keys(sizes).length} entry .css files (${(total / 1024).toFixed(1)} KiB raw) + ${Object.keys(elements).length} host files in spike/ssr/out/css`);
