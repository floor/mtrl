#!/usr/bin/env bun
// Tabs laid out in a real browser.
//
// FLO-241. `.mtrl-tabs` is `flex-direction: column` so that a scroll container
// sits above the divider. Without `scrollable` the component builds no scroll
// container and the tab buttons are direct children of the root, so they
// inherited that column and **stacked vertically** — while the rule right
// beside it gave them `flex: 1` with the comment "Compose divides the row
// evenly", which was dividing the height instead.
//
// Nothing could catch it. `bun test` runs in JSDOM, which has no stylesheet,
// so every tabs test passed with the component rendering as a vertical list.
// `consumer:check` renders a button and a textfield only. This is the
// component's first browser check, and it exists because a layout bug needs a
// layout engine.
//
// Measured before the fix, at 600px with three tabs:
//   scrollable=false  flexDirection=column  tops=[0,17,34]  lefts=[0,0,0]
//   scrollable=true   flexDirection=column  tops=[0,0,0]    lefts=[52,142,232]
//
//   bun run scripts/check-tabs.ts

import assert from "node:assert/strict";
import { chromium } from "playwright";

const bundle = await Bun.build({
  entrypoints: ["src/components/tabs/index.ts"],
  target: "browser",
  minify: false,
});
assert(bundle.success, String(bundle.logs));
const js = await bundle.outputs[0].text();

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/tabs.js")
      return new Response(js, { headers: { "Content-Type": "text/javascript" } });
    if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
    return new Response(
      `<!doctype html><html><head><link rel="stylesheet" href="/styles.css">
<style>body{margin:0}main{width:600px}</style></head><body><main id="host"></main>
<script type="module">import createTabs from '/tabs.js';
window.mount = (config) => {
  window.t?.destroy?.();
  window.t = createTabs({ tabs: [
    { text: 'Flights', value: 'f', state: 'active' },
    { text: 'Trips', value: 't' },
    { text: 'Hotels', value: 'h' },
  ], ...config });
  document.getElementById('host').append(window.t.element);
};</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  },
});

type Geometry = {
  direction: string;
  tops: number[];
  lefts: number[];
  widths: number[];
  dividerPosition: string;
  indicatorPosition: string;
};

const browser = await chromium.launch({ headless: true });
let checks = 0;

try {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.port}`);
  await page.waitForFunction(() => !!(window as unknown as { mount?: unknown }).mount);

  const measure = async (scrollable: boolean, dir: "ltr" | "rtl"): Promise<Geometry> => {
    await page.evaluate(
      ({ scrollable, dir }) => {
        document.documentElement.dir = dir;
        (window as unknown as { mount: (c: unknown) => void }).mount({ scrollable });
      },
      { scrollable, dir }
    );
    await page.waitForTimeout(80);
    return page.evaluate(() => {
      const root = document.querySelector(".mtrl-tabs") as HTMLElement;
      const tabs = [...root.querySelectorAll('[role="tab"]')] as HTMLElement[];
      const at = (selector: string) => {
        const el = root.querySelector(selector) as HTMLElement | null;
        return el ? getComputedStyle(el).position : "absent";
      };
      return {
        direction: getComputedStyle(root).flexDirection,
        tops: tabs.map((t) => Math.round(t.getBoundingClientRect().top)),
        lefts: tabs.map((t) => Math.round(t.getBoundingClientRect().left)),
        widths: tabs.map((t) => Math.round(t.getBoundingClientRect().width)),
        dividerPosition: at(".mtrl-tabs__divider"),
        indicatorPosition: at(".mtrl-tabs__indicator"),
      };
    });
  };

  for (const dir of ["ltr", "rtl"] as const) {
    // Fixed: the tabs are direct children of the root and must sit in a row,
    // dividing the container evenly.
    const fixed = await measure(false, dir);
    assert.equal(fixed.direction, "row", `fixed tabs, ${dir}: container is ${fixed.direction}`);
    assert.equal(
      new Set(fixed.tops).size,
      1,
      `fixed tabs, ${dir}: not on one row, tops ${fixed.tops}`
    );
    assert.equal(
      new Set(fixed.lefts).size,
      3,
      `fixed tabs, ${dir}: overlapping, lefts ${fixed.lefts}`
    );
    // flex: 1 over a 600px container, three tabs. The comment in the
    // stylesheet says Compose divides the row evenly; this is that.
    for (const width of fixed.widths) {
      assert.ok(
        Math.abs(width - 200) <= 1,
        `fixed tabs, ${dir}: uneven division, widths ${fixed.widths}`
      );
    }
    checks += 4;

    // Scrollable: the tabs live inside the scroll container, so the root keeps
    // its column direction and the tabs are still a row.
    const scrollable = await measure(true, dir);
    assert.equal(
      scrollable.direction,
      "column",
      `scrollable tabs, ${dir}: container is ${scrollable.direction}`
    );
    assert.equal(
      new Set(scrollable.tops).size,
      1,
      `scrollable tabs, ${dir}: not on one row, tops ${scrollable.tops}`
    );
    checks += 2;

    // The reason the root can change direction at all: neither of these is in
    // flow, so neither depends on it.
    assert.equal(fixed.dividerPosition, "absolute", `divider, ${dir}`);
    if (fixed.indicatorPosition !== "absent") {
      assert.equal(fixed.indicatorPosition, "absolute", `indicator, ${dir}`);
    }
    checks += 2;
  }

  assert.deepEqual(errors, [], `page errors: ${errors.join(", ")}`);
  console.log(
    `Passed ${checks} tabs layout checks: fixed tabs in an evenly divided row, ` +
      `scrollable tabs in their scroller, both directions, divider and indicator out of flow.`
  );
} finally {
  await browser.close();
  server.stop();
}
