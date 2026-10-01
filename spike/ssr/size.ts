// spike/ssr/size.ts — Risk 5: what the server DOM weighs, and proof that the
// client bundles stay free of it.
//
//   bun spike/ssr/size.ts
//
// 1. linkedom and its dependency tree on disk (what `npm i mtrl` would pull
//    if linkedom were a dependency).
// 2. linkedom bundled and minified for a server (what mtrl/ssr's own build
//    would carry if it bundled linkedom instead of depending on it).
// 3. The React client bundle of the proof (react/client.ts) and the
//    elements entry: neither may contain linkedom or the renderer.

import { readdirSync, statSync } from "node:fs";

const dir = import.meta.dir;
const du = (path: string): number => {
  const s = statSync(path);
  if (!s.isDirectory()) return s.size;
  return readdirSync(path).reduce((sum, f) => sum + du(`${path}/${f}`), 0);
};
const tree = ["linkedom", "css-select", "cssom", "html-escaper", "htmlparser2", "uhyphen", "boolbase", "css-what", "dom-serializer", "domelementtype", "domhandler", "domutils", "entities", "nth-check"];
const disk = Object.fromEntries(tree.map((p) => [p, du(`${dir}/node_modules/${p}`)]));
const diskTotal = Object.values(disk).reduce((a, b) => a + b, 0);

const build = async (entry: string, target: "bun" | "browser", minify = true) => {
  const r = await Bun.build({ entrypoints: [entry], target, minify, define: { "process.env.NODE_ENV": '"production"' } });
  if (!r.success) throw new Error(String(r.logs));
  return r.outputs[0].text();
};
await Bun.write(`${dir}/.size-linkedom.ts`, 'export { parseHTML } from "linkedom";\n');
const linkedomJs = await build(`${dir}/.size-linkedom.ts`, "bun");
await Bun.file(`${dir}/.size-linkedom.ts`).delete();
const ssrJs = await build(`${dir}/react/ssr-react.ts`, "bun");
const clientJs = await build(`${dir}/react/client.ts`, "browser");
const elementsJs = await build(`${dir}/../../dist/elements/index.js`, "browser");

const gz = (s: string) => Bun.gzipSync(new TextEncoder().encode(s)).length;
const kib = (n: number) => `${(n / 1024).toFixed(1)} KiB`;
const leaks = (js: string) => ["parseHTML", "linkedom", "htmlparser2", "mtrl.ssr\")]=", "renderHost"].filter((m) => js.includes(m));

const result = {
  disk: { total: diskTotal, packages: disk },
  linkedomBundled: { min: linkedomJs.length, gzip: gz(linkedomJs) },
  ssrReactBundled: { min: ssrJs.length, gzip: gz(ssrJs), markers: leaks(ssrJs) },
  clientBundle: { min: clientJs.length, leaks: leaks(clientJs) },
  elementsBundle: { min: elementsJs.length, leaks: leaks(elementsJs) },
};
await Bun.write(`${dir}/results/size.json`, JSON.stringify(result, null, 2));
console.log(`linkedom + ${tree.length - 1} deps on disk: ${kib(diskTotal)}`);
console.log(`linkedom bundled (bun, minified): ${kib(linkedomJs.length)} / ${kib(gz(linkedomJs))} gzip`);
console.log(`spike mtrl/ssr/react bundled with linkedom + elements + factories (bun, minified): ${kib(ssrJs.length)} / ${kib(gz(ssrJs))} gzip; markers (positive control): ${JSON.stringify(result.ssrReactBundled.markers)}`);
console.log(`React client bundle: ${kib(clientJs.length)}; server-only markers found: ${JSON.stringify(result.clientBundle.leaks)}`);
console.log(`dist/elements bundle: ${kib(elementsJs.length)}; server-only markers found: ${JSON.stringify(result.elementsBundle.leaks)}`);
