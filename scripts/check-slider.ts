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
// The package budget for the slider (check-package-size.ts) moved to 11,500 when the URL
// allowlist reached every bundle; this copy stayed at 11,000, 17 bytes above the slider
// (10,983), until linking a label to its input (#67) added 19 and crossed it at 11,002.
// It follows check-package-size.ts again at 12,600 for M3 conformance (FLO-250, FLO-252),
// which took this build from 11,410 to 12,308; the breakdown is in that fixture.
// Range limits, keys and RTL (FLO-251) took it to 12,604; both copies move to 12,900.
// Track, stops and the inset icon as a percentage of the value (FLO-369) took it
// to 13,151. The ceiling keeps about 150 bytes of room.
// 13,040 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9.
assert(size.gzip < 13200, `Slider JS exceeds 13,200 gzip bytes: ${size.gzip}`);
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === "/slider.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
  if (url.pathname === "/styles.css") return new Response(Bun.file("dist/styles.css"));
  if (reference && url.pathname === "/reference.js") return new Response(Bun.file(resolve(reference, "slider.js")), { headers: { "Content-Type": "text/javascript" } });
  if (reference && url.pathname === "/reference.css") return new Response(Bun.file(resolve(reference, "styles.css")));
  const old = url.searchParams.has("reference");
  // ?motion keeps the slider's own transitions, for the spring check below.
  const still = url.searchParams.has("motion") ? "" : ".mtrl-slider *{transition:none!important}";
  return new Response(`<!doctype html><html><head><link rel="stylesheet" href="/${old ? "reference" : "styles"}.css">
  <style>body{margin:0;padding:24px}#host{width:320px}${still}</style></head><body><div id="host"></div>
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
      return [...document.querySelectorAll('.mtrl-slider__segment')].every(segment => {
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
  const box = await page.locator(".mtrl-slider__container").boundingBox(); assert(box);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await handle.getAttribute("aria-valuenow"), "50");
  await page.evaluate(() => { const s = window.slider; s.setColor("secondary"); s.setSize("XL"); s.showTicks(true); s.setStep(5); });
  assert(await page.locator(".mtrl-slider__ticks").first().isVisible());
  await page.evaluate(() => { (document.querySelector("#host") as HTMLElement).style.width = "96px"; });
  await page.waitForTimeout(50);
  const resized = await handle.boundingBox(); assert(resized);
  assert(Math.abs(resized.x + resized.width / 2 - (24 + 48)) < 1, "Handle lost alignment after resize");
  await page.evaluate(() => { const s = window.slider; s.disable(); });
  assert.equal(await handle.getAttribute("aria-disabled"), "true");
  await page.evaluate(() => { const s = window.slider; s.enable(); s.destroy(); });
  assert.equal(await page.getByRole("slider").count(), 0);

  // M3 conformance, measured on the painted page (FLO-250, FLO-252). Positions are
  // relative to the track, in CSS pixels; the host is 320px wide.
  const paint = async (config: SliderConfig, height = 0) => {
    // As a JSON string, like the scenarios above: SliderConfig is too deep a type to
    // cross page.evaluate's serialisation types.
    await page.evaluate(({ config, height }) => {
      window.mount(JSON.parse(config), 320, "baseline", "light");
      (document.querySelector("#host") as HTMLElement).style.height = height ? `${height}px` : "";
    }, { config: JSON.stringify(config), height });
    await page.waitForTimeout(40);
    return page.evaluate(() => {
      const track = document.querySelector(".mtrl-slider__track")!.getBoundingClientRect();
      const centre = (el: Element) => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2 - track.x, y: b.y + b.height / 2 - track.y }; };
      const icon = document.querySelector<HTMLElement>(".mtrl-slider__inset-icon");
      const iconBox = icon && !icon.hidden ? icon.getBoundingClientRect() : null;
      return {
        track: { width: track.width, height: track.height },
        handles: [...document.querySelectorAll('[role="slider"]')].map(h => ({ ...centre(h), orientation: h.getAttribute("aria-orientation") })),
        dots: [...document.querySelectorAll<HTMLElement>(".mtrl-slider__dot")].filter(dot => !dot.hidden).map(centre),
        icon: iconBox && { x: iconBox.x - track.x, y: iconBox.y - track.y, size: iconBox.width, inactive: icon!.classList.contains("mtrl-slider__inset-icon--inactive") },
      };
    });
  };
  const near = (actual: number, expected: number, what: string) =>
    assert(Math.abs(actual - expected) < 1, `${what}: ${actual} where M3 puts ${expected}`);
  // A standard slider ends its inactive track with one stop, a corner radius (8) from the end.
  let shown = await paint({ value: 50, label: "Volume" });
  near(shown.handles[0]!.x, 160, "standard handle");
  assert.equal(shown.dots.length, 1, "standard slider stops");
  near(shown.dots[0]!.x, 312, "standard end stop");
  // Range and centred sliders are inactive at both ends, so both carry a stop.
  for (const config of [{ range: true, value: 20, secondValue: 80 }, { centered: true, min: -50, max: 50, value: 25 }]) {
    shown = await paint({ ...config, label: "Volume" });
    assert.deepEqual(shown.dots.map(dot => Math.round(dot.x)), [8, 312], `stops of ${JSON.stringify(config)}`);
  }
  // The inset icon: 24px on M, 10px into the active track, centred across it...
  shown = await paint({ value: 50, size: "M", insetIcon: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3z"/></svg>', label: "Volume" });
  assert(shown.icon && !shown.icon.inactive, "inset icon on the active track");
  near(shown.icon.x, 10, "inset icon start"); near(shown.icon.y, 8, "inset icon centring"); near(shown.icon.size, 24, "inset icon size");
  // ...and 10px into the inactive track when the active one cannot hold it: the handle
  // at 16, the inactive track from 16 + 8.
  shown = await paint({ value: 5, size: "M", insetIcon: '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3z"/></svg>', label: "Volume" });
  assert(shown.icon?.inactive, "inset icon moves to the inactive track");
  near(shown.icon!.x, 34, "inset icon on the inactive track");
  // Vertical: zero at the bottom, the size a thickness, the length the slider's height.
  // A visible label sits above and takes its share of that height, so these carry
  // an accessible name only and the track gets all 240px.
  shown = await paint({ orientation: "vertical", size: "L", value: 60, ariaLabel: "Volume" }, 240);
  assert.equal(shown.handles[0]!.orientation, "vertical");
  near(shown.track.height, 240, "vertical track length"); near(shown.track.width, 56, "vertical track thickness");
  near(shown.handles[0]!.y, 96, "vertical handle"); near(shown.handles[0]!.x, 28, "vertical handle centring");
  near(shown.dots[0]!.y, 16, "vertical end stop");
  shown = await paint({ orientation: "vertical", topToBottom: true, value: 25, ariaLabel: "Volume" }, 240);
  near(shown.handles[0]!.y, 60, "top-to-bottom handle");

  // The icon beside the track, level with it, before or after it; the label above or
  // below (FLO-107: both positions used to change nothing on screen).
  const icon = '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3z"/></svg>';
  for (const [iconPosition, labelPosition] of [["start", "start"], ["end", "end"]] as const) {
    await paint({ value: 50, icon, iconPosition, label: "Volume", labelPosition });
    const placed = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const track = box(".mtrl-slider__track"), icon = box(".mtrl-slider__icon"), label = box(".mtrl-slider__label");
      return { trackTop: track.top, trackBottom: track.bottom, trackLeft: track.left, trackRight: track.right, trackMiddle: track.top + track.height / 2,
        iconLeft: icon.left, iconRight: icon.right, iconMiddle: icon.top + icon.height / 2, labelTop: label.top, labelBottom: label.bottom, labelLeft: label.left };
    });
    near(placed.iconMiddle, placed.trackMiddle, `${iconPosition} icon level with the track`);
    if (iconPosition === "start") assert(placed.iconRight <= placed.trackLeft, "a start icon sits before the track");
    else assert(placed.iconLeft >= placed.trackRight, "an end icon sits after the track");
    if (labelPosition === "start") assert(placed.labelBottom <= placed.trackTop, "a start label sits above the track");
    else assert(placed.labelTop >= placed.trackBottom, "an end label sits below the track");
    near(placed.labelLeft, placed.trackLeft, `${labelPosition} label aligned with the track`);
  }

  // Motion, with the slider's own transitions: a tap settles on the default spatial
  // spring (peaks about 270ms in, about 1.5% over, settled by 450ms), which the M3 sliders
  // video approaches (about 300ms, 3-5%); nothing moves on the first render or in a drag.
  const moving = await browser.newPage({ viewport: { width: 600, height: 250 } });
  moving.on("pageerror", error => errors.push(error.message));
  await moving.goto(`http://127.0.0.1:${server.port}/?motion`);
  await moving.waitForFunction(() => window.ready);
  await moving.evaluate(() => window.mount({ value: 50, label: "Volume" }, 320, "baseline", "light"));
  await moving.waitForTimeout(60);
  assert(!(await moving.locator(".mtrl-slider--settling").count()), "the first render settles");
  const track = (await moving.locator(".mtrl-slider__container").boundingBox())!;
  await moving.evaluate(() => {
    const handle = document.querySelector('[role="slider"]')!;
    const samples: [number, number][] = [];
    (window as unknown as { samples: typeof samples }).samples = samples;
    const start = performance.now();
    const frame = () => {
      const box = handle.getBoundingClientRect();
      samples.push([performance.now() - start, box.x + box.width / 2]);
      if (performance.now() - start < 900) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await moving.mouse.click(track.x + track.width * 0.8, track.y + track.height / 2);
  await moving.waitForTimeout(1000);
  const samples = await moving.evaluate(() => (window as unknown as { samples: [number, number][] }).samples);
  const from = samples[0]![1], to = samples[samples.length - 1]![1];
  const began = samples.find(([, x]) => Math.abs(x - from) > 0.5)![0];
  const peak = samples.reduce((a, b) => (b[1] > a[1] ? b : a));
  const overshoot = (peak[1] - to) / (to - from) * 100, peakAfter = peak[0] - began;
  const settledAfter = samples.find(([t, x]) => t > peak[0] && Math.abs(x - to) < 0.5)![0] - began;
  assert(overshoot > 0.5 && overshoot < 4, `tap overshoot ${overshoot.toFixed(2)}%`);
  assert(peakAfter > 150 && peakAfter < 400, `tap peaks after ${Math.round(peakAfter)}ms`);
  assert(settledAfter < 600, `tap settles after ${Math.round(settledAfter)}ms`);
  // A drag follows the pointer: no settling while it moves.
  const handleBox = (await moving.getByRole("slider").boundingBox())!;
  await moving.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await moving.mouse.down();
  await moving.mouse.move(track.x + track.width * 0.3, track.y + track.height / 2, { steps: 5 });
  assert(!(await moving.locator(".mtrl-slider--settling").count()), "a drag settles");
  await moving.mouse.up();
  await moving.close();
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
  const report = { size, comparisons, updateMedianMs: timings, errors, motion: { overshoot, peakAfter, settledAfter } };
  await writeFile(`${artifacts}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ size, updateMedianMs: timings, motion: { overshootPct: +overshoot.toFixed(2), peakAfterMs: Math.round(peakAfter), settledAfterMs: Math.round(settledAfter) }, comparisons: comparisons.length, worst: [...comparisons].sort((a,b) => b.percent-a.percent).slice(0,8) }, null, 2));
} finally { await browser.close(); server.stop(true); }
