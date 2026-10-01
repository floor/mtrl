// spike/ssr/render-pages.ts — server side of Risks 3 and the upgrade probe.
//
//   bun spike/ssr/render-pages.ts
//
// Renders each element's default case with renderHost (linkedom + the shim
// server DOM) into spike/ssr/out/dst/<element>.html: the host with its
// declarative shadow root linking /css/<entry>.css. Also times the render
// (median of 50 after a warm-up) to size the server cost.

import { installDom } from "./server-dom";

installDom("shim");
const { renderHost, renderElement, elements, kebab } = await import("./render-element");
const { cases } = await import("../../scripts/fixtures/preupgrade-cases");
const { mkdir } = await import("node:fs/promises");

const out = `${import.meta.dir}/out/dst`;
await mkdir(out, { recursive: true });
const error = console.error;
console.error = () => {};

const timings: Record<string, number> = {};
for (const key of Object.keys(elements)) {
  const element = kebab(key);
  const c = cases.find((x) => x.element === element && x.variant === "default");
  if (!c) throw new Error(`no default case for ${element}`);
  const { html } = renderHost(c.html, { cssBase: "/css" });
  await Bun.write(`${out}/${element}.html`, html);
  for (let i = 0; i < 5; i++) renderHost(c.html, { cssBase: "/css" });
  const t: number[] = [];
  for (let i = 0; i < 50; i++) {
    const s = performance.now();
    renderHost(c.html, { cssBase: "/css" });
    t.push(performance.now() - s);
  }
  t.sort((a, b) => a - b);
  timings[element] = Number(t[25].toFixed(3));
}
// The API form, for the report.
await Bun.write(`${out}/_api-example.html`, renderElement("m-button", { variant: "filled" }, "Save", { cssBase: "/css" }));
console.error = error;
await Bun.write(`${import.meta.dir}/results/render-timings.json`, JSON.stringify(timings, null, 2));
const values = Object.values(timings).sort((a, b) => a - b);
console.log(`rendered ${values.length}; median ${values[values.length >> 1]} ms, max ${values[values.length - 1]} ms`);
console.log(Object.entries(timings).map(([k, v]) => `${k} ${v}`).join(", "));
process.exit(0);
