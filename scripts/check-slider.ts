#!/usr/bin/env bun
/** Build first. Optional --reference=/path with slider.js and styles.css from the canvas build. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { gzipSync } from "node:zlib";
import type { SliderConfig, SliderComponent } from "../src/components/slider/types";

declare global {
  interface Window {
    ready: boolean;
    slider: SliderComponent;
    mount: (config: SliderConfig, width: number, theme: string, mode: string) => void;
  }
}

const reference = process.argv.find(arg => arg.startsWith("--reference="))?.slice(12);
const artifacts = resolve("analysis/slider-dom");
await mkdir(artifacts, { recursive: true });
const bundle = await Bun.build({ entrypoints: [resolve("src/components/slider/index.ts")], minify: true, target: "browser" });
assert(bundle.success, String(bundle.logs));
const js = await bundle.outputs[0].text();
const size = { raw: Buffer.byteLength(js), gzip: gzipSync(js, { level: 9 }).length };
assert(size.gzip < 11000, `Slider JS exceeds 11,000 gzip bytes: ${size.gzip}`);
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === "/slider.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
  if (url.pathname === "/styles.css") return new Response(Bun.file("dist/styles.css"));
  if (reference && url.pathname === "/reference.js") return new Response(Bun.file(resolve(reference, "slider.js")), { headers: { "Content-Type": "text/javascript" } });
  if (reference && url.pathname === "/reference.css") return new Response(Bun.file(resolve(reference, "styles.css")));
  const old = url.searchParams.has("reference");
  return new Response(`<!doctype html><html><head><link rel="stylesheet" href="/${old ? "reference" : "styles"}.css">
  <style>body{margin:0;padding:24px}#host{width:320px}.mtrl-slider *{transition:none!important}</style></head><body><div id="host"></div>
  <script type="module">import ${old ? "{createSlider}" : "createSlider"} from '/${old ? "reference" : "slider"}.js';
  window.mount = (config, width, theme, mode) => {
    window.slider?.destroy(); const host=document.querySelector('#host'); host.replaceChildren();host.style.width=width+'px';
    document.documentElement.dataset.theme=theme;document.documentElement.dataset.themeMode=mode;
    window.slider=createSlider(config);host.append(window.slider.element);
  };window.ready=true;</script></body></html>`, { headers: { "Content-Type": "text/html" } });
} });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 600, height: 250 }, reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.port}`);
  await page.waitForFunction(() => window.ready);
  const old = reference ? await browser.newPage({ viewport: { width: 600, height: 250 }, reducedMotion: "reduce" }) : null;
  if (old) { await old.goto(`http://127.0.0.1:${server.port}/?reference`); await old.waitForFunction(() => window.ready); }
  const scenarios: (SliderConfig & { name: string })[] = [
    { name: "single", value: 35 }, { name: "minimum", value: 0 }, { name: "maximum", value: 100 },
    { name: "range", range: true, value: 20, secondValue: 80 },
    { name: "close-range", range: true, value: 49, secondValue: 51 },
    { name: "center-positive", centered: true, min: -100, value: 35 },
    { name: "center-negative", centered: true, min: -100, value: -35 },
    { name: "center-zero", centered: true, min: -100, value: 0 },
    { name: "ticks", ticks: true, step: 10, value: 30 },
    { name: "disabled-ticks", ticks: true, step: 10, value: 30, disabled: true },
  ];
  const comparisons: { name: string; changedPixels: number; pixels: number; percent: number }[] = [];
  for (const size of ["XS", "S", "M", "L", "XL"]) for (const width of [96, 320]) for (const scenario of scenarios) {
    const name = `${scenario.name}-${size}-${width}`;
    const theme = width === 96 ? "ocean" : "baseline", mode = width === 96 ? "dark" : "light";
    for (const target of [page, ...(old ? [old] : [])]) {
      await target.evaluate(({ config, width, theme, mode }) => window.mount(JSON.parse(config), width, theme, mode), { config: JSON.stringify({ ...scenario, size, label: "Volume" }), width, theme, mode });
      await target.waitForTimeout(35);
    }
    assert.equal(await page.locator("canvas").count(), 0);
    const handles = page.getByRole("slider");
    assert.equal(await handles.count(), scenario.range ? 2 : 1);
    assert.equal(await handles.first().getAttribute("aria-valuenow"), String(scenario.value));
    const geometry = await page.evaluate(() => {
      const centers = [...document.querySelectorAll('[role="slider"]')].map(handle => {
        const rect = handle.getBoundingClientRect(); return rect.x + rect.width / 2;
      });
      return [...document.querySelectorAll('.mtrl-slider-segment')].every(segment => {
        const rect = segment.getBoundingClientRect();
        return rect.width < 0.1 || centers.every(center => rect.right <= center - 5.8 || rect.left >= center + 5.8);
      });
    });
    assert(geometry, `${name}: track intrudes into the handle gap`);
    const png = await page.locator("#host").screenshot({ path: `${artifacts}/${name}.png` });
    if (old) {
      const before = await old.locator("#host").screenshot({ path: `${artifacts}/${name}-canvas.png` });
      const result = await page.evaluate(async ({ a, b }) => {
        const decode = async (data: string) => { const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode(); const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0); return { width: image.width, height: image.height, data: ctx.getImageData(0, 0, image.width, image.height).data }; };
        const [first, second] = await Promise.all([decode(a), decode(b)]);
        if (first.width !== second.width || first.height !== second.height) throw new Error("Slider bounds changed");
        let changedPixels = 0;
        for (let i = 0; i < first.data.length; i += 4) {
          if ([0, 1, 2].some(c => Math.abs(first.data[i + c] - second.data[i + c]) > 12)) changedPixels++;
        }
        return { changedPixels, pixels: first.width * first.height, percent: changedPixels / (first.width * first.height) * 100 };
      }, { a: before.toString("base64"), b: png.toString("base64") });
      comparisons.push({ name, ...result });
    }
  }
  // Real API, keyboard, pointer, resizing and lifecycle checks.
  await page.evaluate(() => window.mount({ value: 20, step: 10, label: "Volume" }, 320, "baseline", "light"));
  await page.waitForTimeout(30);
  const handle = page.getByRole("slider");
  await handle.focus(); await page.keyboard.press("ArrowRight");
  assert.equal(await handle.getAttribute("aria-valuenow"), "30");
  await page.keyboard.press("End"); assert.equal(await handle.getAttribute("aria-valuenow"), "100");
  await page.keyboard.press("Home"); assert.equal(await handle.getAttribute("aria-valuenow"), "0");
  const box = await page.locator(".mtrl-slider-container").boundingBox(); assert(box);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await handle.getAttribute("aria-valuenow"), "50");
  await page.evaluate(() => { const s = window.slider; s.setColor("secondary"); s.setSize("XL"); s.showTicks(true); s.setStep(5); });
  assert(await page.locator(".mtrl-slider-ticks").first().isVisible());
  await page.evaluate(() => { (document.querySelector("#host") as HTMLElement).style.width = "96px"; });
  await page.waitForTimeout(50);
  const resized = await handle.boundingBox(); assert(resized);
  assert(Math.abs(resized.x + resized.width / 2 - (24 + 48)) < 1, "Handle lost alignment after resize");
  await page.evaluate(() => { const s = window.slider; s.disable(); });
  assert.equal(await handle.getAttribute("aria-disabled"), "true");
  await page.evaluate(() => { const s = window.slider; s.enable(); s.destroy(); });
  assert.equal(await page.getByRole("slider").count(), 0);
  assert.deepEqual(errors, []);
  const timings: Record<string, number> = {};
  for (const [name, target] of [["dom", page], ["canvas", old]] as const) {
    if (!target) continue;
    timings[name] = await target.evaluate(() => {
      window.mount({ value: 20, ticks: true, step: 1 }, 320, "baseline", "light");
      const durations: number[] = [];
      for (let run = 0; run < 5; run++) {
        const start = performance.now();
        for (let i = 0; i < 200; i++) window.slider.setValue(i % 101, false);
        durations.push(performance.now() - start);
      }
      window.slider.destroy();
      return durations.sort((a,b) => a-b)[2];
    });
  }
  const report = { size, comparisons, updateMedianMs: timings, errors };
  await writeFile(`${artifacts}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ size, updateMedianMs: timings, comparisons: comparisons.length, worst: [...comparisons].sort((a,b) => b.percent-a.percent).slice(0,8) }, null, 2));
} finally { await browser.close(); server.stop(true); }
