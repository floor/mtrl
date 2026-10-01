// spike/ssr/link-timeline.ts — Risk 3, follow-up: what each engine paints
// while the shadow roots' stylesheets are still loading.
//
//   bun spike/ssr/link-timeline.ts [delayMs=1500]   # after render-pages + emit-css
//
// The button/switch page of styles-by-link.ts, CSS delayed 1500 ms, links in
// the templates only (and, as a variant, also as render-blocking stylesheets
// in <head>). A requestAnimationFrame loop in the page records, per frame,
// whether the first button's shadow <button> has its computed background
// (styled) and its box (laid out), plus the layout shifts. Screenshots are
// not used here: WebKit's screenshot waits for pending loads.
// Writes results/link-timeline-${DELAY}.json.

import { chromium, firefox, webkit, type BrowserType } from "playwright";

const root = `${import.meta.dir}/../..`;
const dst = (name: string) => Bun.file(`${import.meta.dir}/out/dst/${name}.html`).text();
const button = await dst("button");
const sw = await dst("switch");
const body = `<p id="intro">Intro text outside any element.</p><p>${button}</p><p>${sw}</p><p id="after">After</p>`;
const entries = [...new Set([...button.matchAll(/href="([^"]+)"/g), ...sw.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];

const http = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === "/base.css") return new Response(Bun.file(`${root}/dist/styles/base.css`));
    if (p.startsWith("/css/")) {
      await Bun.sleep(DELAY);
      return new Response(Bun.file(`${import.meta.dir}/out/css/${p.slice(5)}`), { headers: { "Content-Type": "text/css" } });
    }
    const head = url.searchParams.get("head") === "stylesheet" ? entries.map((h) => `<link rel="stylesheet" href="${h}">`).join("") : "";
    // The probe runs from <head>, before the body is parsed.
    const probe = `<script>
      window.frames_ = []; window.shifts_ = [];
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) shifts_.push({ t: Math.round(e.startTime), v: e.value }); }).observe({ type: "layout-shift", buffered: true });
      const t0 = performance.now();
      const tick = () => {
        const host = document.querySelector("m-button");
        const inner = host && host.shadowRoot && host.shadowRoot.querySelector("button");
        const after = document.getElementById("after");
        if (inner) {
          const cs = getComputedStyle(inner); const r = inner.getBoundingClientRect();
          frames_.push({ t: Math.round(performance.now() - t0), bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height), afterY: after ? Math.round(after.getBoundingClientRect().y) : null });
        }
        if (performance.now() - t0 < 2500) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    </script>`;
    return new Response(
      `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/base.css">${head}${probe}<style>body{margin:0;padding:8px}</style></head><body>${url.searchParams.get("head") === "inline" ? inlineBody : body}</body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  },
});

const DELAY = Number(process.argv[2] ?? 1500);
// Inline variant: the same templates with each <link> replaced by a <style> holding the file.
const inline = async (html: string) => {
  let out = html;
  for (const m of html.matchAll(/<link rel="stylesheet" href="\/css\/([^"]+)">/g)) {
    out = out.replace(m[0], `<style>${await Bun.file(`${import.meta.dir}/out/css/${m[1]}`).text()}</style>`);
  }
  return out;
};
const inlineBody = await inline(body);
const all: Record<string, unknown> = {};
for (const [engine, type] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]] as [string, BrowserType][]) {
  const browser = await type.launch();
  for (const head of ["none", "stylesheet", "inline"]) {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 400 } });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${http.port}/?head=${head}`, { waitUntil: "load" });
    await Bun.sleep(1200);
    const { frames, shifts } = await page.evaluate(() => ({ frames: (window as any).frames_, shifts: (window as any).shifts_ }));
    // Collapse runs of identical frames.
    const runs: { from: number; to: number; bg: string; w: number; h: number; afterY: number | null }[] = [];
    for (const f of frames) {
      const last = runs[runs.length - 1];
      if (last && last.bg === f.bg && last.w === f.w && last.h === f.h && last.afterY === f.afterY) last.to = f.t;
      else runs.push({ from: f.t, to: f.t, bg: f.bg, w: f.w, h: f.h, afterY: f.afterY });
    }
    all[`${engine}/${head}`] = { runs, shifts };
    console.log(`${engine} head=${head}: ${runs.map((r) => `${r.from}-${r.to}ms bg=${r.bg} ${r.w}x${r.h} afterY=${r.afterY}`).join(" | ")}; shifts ${JSON.stringify(shifts)}`);
    await ctx.close();
  }
  await browser.close();
}
await Bun.write(`${import.meta.dir}/results/link-timeline-${DELAY}.json`, JSON.stringify(all, null, 2));
http.stop();
