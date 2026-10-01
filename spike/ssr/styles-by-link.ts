// spike/ssr/styles-by-link.ts — Risk 3: element CSS by <link> inside the
// declarative shadow roots. One page: three <m-button>s and two <m-switch>es,
// server-rendered (out/dst), no element script.
//
//   bun run build && bun spike/ssr/emit-css.ts && bun spike/ssr/render-pages.ts
//   bun spike/ssr/styles-by-link.ts
//
// 1. JS disabled, CSS served at once: is the first paint styled? (screenshot
//    vs the upgraded page, which is the reference.)
// 2. CSS delayed by 1500 ms, three heads: links in the templates only; plus
//    <link rel=preload as=style> in <head>; plus <link rel=stylesheet> in
//    <head> (render-blocking). A screenshot is taken 300 ms after the
//    response commits; we record when it completed and how far it is from
//    the reference, and first-contentful-paint.
// 3. Requests per CSS file (deduplication across instances).
// Writes results/styles-by-link.json and out/link-*.png.

import { chromium, firefox, webkit, type BrowserType } from "playwright";
import { PNG } from "pngjs";

const root = `${import.meta.dir}/../..`;
const dst = (name: string) => Bun.file(`${import.meta.dir}/out/dst/${name}.html`).text();
const button = await dst("button");
const sw = await dst("switch");
const body = `<p id="intro">Intro text outside any element.</p><p>${button} ${button.replace(">Save<", ">Cancel<")} ${button.replace(">Save<", ">Retry<")}</p><p>${sw}</p><p>${sw.replace(">Wi-Fi<", ">Bluetooth<")}</p>`;
const inlined = async (html: string) => {
  let out = html;
  for (const m of html.matchAll(/<link rel="stylesheet" href="\/css\/([^"]+)">/g)) {
    out = out.replace(m[0], `<style>${await Bun.file(`${import.meta.dir}/out/css/${m[1]}`).text()}</style>`);
  }
  return out;
};
const inlineBody = await inlined(body);
const entries = [...new Set([...button.matchAll(/href="([^"]+)"/g), ...sw.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];

const built = await Bun.build({ entrypoints: [`${import.meta.dir}/browser-entry.ts`], target: "browser" });
const js = await built.outputs[0].text();

let delay = 0;
const requests = new Map<string, number>();
const http = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === "/entry.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
    if (p === "/base.css") return new Response(Bun.file(`${root}/dist/styles/base.css`));
    if (p.startsWith("/css/")) {
      requests.set(p, (requests.get(p) ?? 0) + 1);
      if (delay) await Bun.sleep(delay);
      return new Response(Bun.file(`${import.meta.dir}/out/css/${p.slice(5)}`), { headers: { "Content-Type": "text/css", "Cache-Control": "max-age=3600" } });
    }
    const head =
      url.searchParams.get("head") === "preload"
        ? entries.map((h) => `<link rel="preload" as="style" href="${h}">`).join("")
        : url.searchParams.get("head") === "stylesheet"
          ? entries.map((h) => `<link rel="stylesheet" href="${h}">`).join("")
          : "";
    const script = url.searchParams.has("upgrade") ? '<script type="module" src="/entry.js"></script>' : "";
    return new Response(
      `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/base.css">${head}<style>body{margin:0;padding:8px}</style></head><body>${url.searchParams.get("head") === "inline" ? inlineBody : body}${script}</body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  },
});
const base = `http://127.0.0.1:${http.port}/`;
const clip = { x: 0, y: 0, width: 420, height: 200 };
const diff = (a: Buffer, b: Buffer): number => {
  const x = PNG.sync.read(a), y = PNG.sync.read(b);
  let changed = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2]) > 24) changed++;
  }
  return Number(((changed / (x.width * x.height)) * 100).toFixed(3));
};
const out = `${import.meta.dir}/out`;
const all: Record<string, unknown> = {};
const engines: [string, BrowserType][] = [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]];
for (const [engine, type] of engines) {
const browser = await type.launch();
const result: Record<string, unknown> = {};
all[engine] = result;

// Reference: upgraded by the element script, settled.
{
  const ctx = await browser.newContext({ viewport: { width: 800, height: 400 } });
  const p = await ctx.newPage();
  await p.goto(`${base}?upgrade`);
  await p.waitForFunction(() => (window as any).ready);
  await p.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));
  });
  const ref = await p.screenshot({ clip });
  await Bun.write(`${out}/link-${engine}-reference.png`, ref);
  result.reference = "upgraded, settled";
  await ctx.close();

  // 1. JS disabled, no delay.
  const noJs = await browser.newContext({ viewport: { width: 800, height: 400 }, javaScriptEnabled: false });
  const q = await noJs.newPage();
  requests.clear();
  await q.goto(base, { waitUntil: "load" });
  await Bun.sleep(300);
  const shot = await q.screenshot({ clip });
  await Bun.write(`${out}/link-${engine}-nojs.png`, shot);
  result.noJs = { changedPctVsReference: diff(shot, ref), requests: Object.fromEntries(requests) };
  await noJs.close();

  // 2. Delayed CSS, three heads.
  delay = 1500;
  for (const head of ["none", "preload", "stylesheet", "inline"]) {
    const c = await browser.newContext({ viewport: { width: 800, height: 400 } });
    const page = await c.newPage();
    await page.addInitScript(() => {
      (window as any).paints = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) (window as any).paints.push({ name: e.name, t: Math.round(e.startTime) });
      }).observe({ type: "paint", buffered: true });
    });
    requests.clear();
    const start = Date.now();
    await page.goto(`${base}?head=${head}`, { waitUntil: "commit" });
    await Bun.sleep(300);
    const early = await page.screenshot({ clip });
    const earlyAt = Date.now() - start;
    await page.waitForLoadState("load");
    await Bun.sleep(200);
    const late = await page.screenshot({ clip });
    const paints = await page.evaluate(() => (window as any).paints);
    await Bun.write(`${out}/link-${engine}-delay-${head}-early.png`, early);
    result[`delay1500-${head}`] = {
      earlyScreenshotDoneMs: earlyAt,
      earlyChangedPctVsReference: diff(early, ref),
      afterLoadChangedPctVsReference: diff(late, ref),
      paints,
      requests: Object.fromEntries(requests),
    };
    await c.close();
  }
}
delay = 0;
await browser.close();
}
await Bun.write(`${import.meta.dir}/results/styles-by-link.json`, JSON.stringify(all, null, 2));
for (const [engine, r] of Object.entries(all) as [string, any][]) {
  console.log(`${engine}: no-JS first paint vs reference ${r.noJs.changedPctVsReference}% px; requests per file ${[...new Set(Object.values(r.noJs.requests))].join("/")}`);
  for (const head of ["none", "preload", "stylesheet", "inline"]) {
    const d = r[`delay1500-${head}`];
    console.log(`  delay 1500 ms, head=${head.padEnd(10)} early shot at ${d.earlyScreenshotDoneMs} ms: ${d.earlyChangedPctVsReference}% px off; after load ${d.afterLoadChangedPctVsReference}%; paints ${d.paints.map((p: any) => `${p.name}@${p.t}`).join(" ")}`);
  }
}
http.stop();
