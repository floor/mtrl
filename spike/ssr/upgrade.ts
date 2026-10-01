// spike/ssr/upgrade.ts — the re-render on upgrade, per element, in Chromium.
//
//   bun run build && bun spike/ssr/emit-css.ts && bun spike/ssr/render-pages.ts
//   bun spike/ssr/upgrade.ts [element…]
//
// For each element's default case, two pages:
//   dst:   the server render (out/dst/<element>.html): host + declarative
//          shadow root linking the element CSS.
//   phaseA: today's server output, host + light DOM, with preupgrade.css.
// Each page loads with no element script; once settled (fonts, 2 frames) the
// stage is screenshotted, then the element script is added, the element
// upgrades (attachShadow returns the declarative root, cleared; the factory
// renders), and after 3 frames + 400 ms the stage is screenshotted again.
// Reported: pixels that changed (% of the stage), the layout shift (CLS
// entries after the script ran, summed), the shadow root kept its <link>s or
// not, and page errors. Writes results/upgrade.json.

import { chromium, type Page } from "playwright";
import { PNG } from "pngjs";

const root = `${import.meta.dir}/../..`;
const only = process.argv.slice(2);
const { cases } = await import("../../scripts/fixtures/preupgrade-cases");
const { elements } = await import("../../src/elements");
const kebab = (n: string) => n.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const names = Object.keys(elements).map(kebab).filter((n) => !only.length || only.includes(n));

const built = await Bun.build({ entrypoints: [`${import.meta.dir}/browser-entry.ts`], target: "browser" });
if (!built.success) throw new Error(String(built.logs));
const js = await built.outputs[0].text();

const STAGE = 360;
const page = (body: string, head = ""): string =>
  `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/base.css">${head}
<style>body{margin:0}#stage{width:${STAGE}px;min-height:120px;padding:8px}</style></head>
<body><div id="stage">${body}</div><div id="after">Following text</div></body></html>`;

const http = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === "/entry.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
    if (p === "/base.css") return new Response(Bun.file(`${root}/dist/styles/base.css`));
    if (p === "/preupgrade.css") return new Response(Bun.file(`${root}/dist/elements/preupgrade.css`));
    if (p.startsWith("/css/")) return new Response(Bun.file(`${import.meta.dir}/out/css/${p.slice(5)}`), { headers: { "Content-Type": "text/css" } });
    const [, kind, element] = p.split("/");
    const c = cases.find((x) => x.element === element && x.variant === "default");
    if (!c) return new Response("not found", { status: 404 });
    const html =
      kind === "dst"
        ? page(await Bun.file(`${import.meta.dir}/out/dst/${element}.html`).text())
        : page(c.html, '<link rel="stylesheet" href="/preupgrade.css">');
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  },
});

const settle = (p: Page, ms = 0) =>
  p.evaluate(async (ms) => {
    await document.fonts.ready;
    for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
    if (ms) await new Promise((r) => setTimeout(r, ms));
  }, ms);

const clip = { x: 0, y: 0, width: STAGE + 16, height: 400 };
const diff = (a: Buffer, b: Buffer): number => {
  const x = PNG.sync.read(a), y = PNG.sync.read(b);
  let changed = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2]) > 24) changed++;
  }
  return (changed / (x.width * x.height)) * 100;
};

const browser = await chromium.launch();
const results: Record<string, unknown>[] = [];
const shots = `${import.meta.dir}/out/shots`;

for (const element of names) {
  const row: Record<string, unknown> = { element };
  for (const kind of ["dst", "phaseA"] as const) {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      (window as any).shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) (window as any).shifts.push({ value: e.value, t: e.startTime });
      }).observe({ type: "layout-shift", buffered: true });
    });
    await p.goto(`http://127.0.0.1:${http.port}/${kind}/${element}`, { waitUntil: "load" });
    await settle(p, 200);
    const before = await p.screenshot({ clip, animations: "disabled" });
    const declarative = await p.evaluate(() => {
      const host = document.querySelector("#stage > *") as Element;
      return { shadow: !!host.shadowRoot, links: host.shadowRoot?.querySelectorAll("link").length ?? 0 };
    });
    const t0 = await p.evaluate(() => performance.now());
    await p.addScriptTag({ url: "/entry.js", type: "module" });
    await p.waitForFunction(() => (window as any).ready);
    await settle(p, 400);
    const after = await p.screenshot({ clip, animations: "disabled" });
    const state = await p.evaluate((t0) => {
      const host = document.querySelector("#stage > *") as Element;
      const shifts = ((window as any).shifts as { value: number; t: number }[]).filter((s) => s.t >= t0);
      return {
        defined: !!customElements.get(host.localName),
        upgraded: !!(host as any).component,
        links: host.shadowRoot?.querySelectorAll("link").length ?? 0,
        children: host.shadowRoot?.children.length ?? 0,
        cls: shifts.reduce((a, s) => a + s.value, 0),
      };
    }, t0);
    await Bun.write(`${shots}/${element}-${kind}-before.png`, before);
    await Bun.write(`${shots}/${element}-${kind}-after.png`, after);
    row[kind] = {
      declarativeBefore: declarative,
      after: state,
      changedPct: Number(diff(before, after).toFixed(3)),
      errors,
    };
    await ctx.close();
  }
  results.push(row);
  const d = row.dst as any, a = row.phaseA as any;
  console.log(
    `${element.padEnd(18)} dst: ${String(d.changedPct).padStart(7)}% px, CLS ${d.after.cls.toFixed(4)}, links after ${d.after.links}, upgraded ${d.after.upgraded}${d.errors.length ? `, errors ${d.errors.join(" | ")}` : ""}   phaseA: ${String(a.changedPct).padStart(7)}% px, CLS ${a.after.cls.toFixed(4)}`
  );
}

await Bun.write(`${import.meta.dir}/results/upgrade${only.length ? "-" + only.join("-") : ""}.json`, JSON.stringify(results, null, 2));
await browser.close();
http.stop();
