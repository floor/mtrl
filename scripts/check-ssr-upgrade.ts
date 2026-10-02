#!/usr/bin/env bun
// scripts/check-ssr-upgrade.ts
// Per-engine pixel parity is independent of Chromium's structural parity exceptions.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, firefox, webkit, type Page } from "playwright";
import { parseHTML } from "linkedom";
import { renderElement } from "../dist/ssr/index.js";
import { elements } from "../dist/elements/index.js";
import { cases } from "./fixtures/preupgrade-cases";
import allowed from "./fixtures/ssr-upgrade-exceptions.json";
import type { UpgradeAPI } from "./fixtures/ssr-observe";
declare global { interface Window { ssrUpgrade: UpgradeAPI } }
const engine = process.argv.find(arg => arg.startsWith("--engine="))?.split("=")[1] ?? "chromium";
assert(engine === "chromium" || engine === "firefox" || engine === "webkit");
const fixtures = cases.filter(c => c.variant === "default");
// Hosts that opt out of SSR: the server emits the authored host and light DOM.
const FALLBACK = ["carousel", "fab-menu"];
// Light children that have their own declarative roots and are measured across
// the upgrade (FLO-412). The toolbar renders its own root (FLO-387); its icon
// buttons still do, and each must upgrade in place.
const RENDERED_CHILDREN: Record<string, string> = { toolbar: "m-icon-button" };
assert.deepEqual(fixtures.map(c => c.element).sort(), Object.values(elements).map(e => e.spec.name).sort());
const bundle = await Bun.build({ entrypoints: ["scripts/fixtures/ssr-upgrade.ts"], target: "browser" });
assert(bundle.success, String(bundle.logs));
const js = await bundle.outputs[0].text();
const observer = await Bun.build({ entrypoints: ["scripts/fixtures/ssr-observe.ts"], target: "browser" });
assert(observer.success, String(observer.logs));
const observeJS = await observer.outputs[0].text();
const mutation = process.argv.find(arg => arg.startsWith("--mutate="))?.split("=")[1];
assert(mutation === undefined || ["root", "styles", "pixels", "layout"].includes(mutation), "Unknown mutation");
const only = process.argv.find(arg => arg.startsWith("--element="))?.split("=")[1] ?? (mutation ? "button" : undefined);
assert(only === undefined || fixtures.some(f => f.element === only), "Unknown element");
const directory = `analysis/ssr-upgrade/${engine}${mutation ? `/mutation-${mutation}` : only ? `/element-${only}` : ""}`;
await mkdir(directory, { recursive: true });
// A new page's pointer rests at the viewport origin, and whether the browser has
// applied :hover there by the time of a capture is timing. With the fixture at the
// origin, CI captured a button group's first button hovered before the upgrade and
// not after (2,713 pixels); ten of the fixtures change under a pointer there. So
// the stage starts below the origin, clear of the tallest touch target that
// overflows its host, and each pass checks that nothing of the fixture is under
// the pointer. No pointer event is dispatched: moving the pointer away instead
// starts the un-hover transition it was meant to avoid.
const CLEAR = 32;
// Placed at the viewport's top edge whatever the stage does. Its surface has no
// hover state; the check below still refuses a control of it under the pointer.
const AT_ORIGIN = ["top-app-bar"];
/**
 * What is under the resting pointer: the page itself, the fixture's surface, one of
 * its controls, or something else. Anything but the page counts, inside the host or
 * not: a fixture may render a scrim or a menu elsewhere in the document.
 */
const underPointer = (page: Page): Promise<string> => page.evaluate(() => {
  const host = document.querySelector("#stage > :first-child")!;
  let hit = document.elementFromPoint(0, 0);
  if (!hit || hit === document.body || hit === document.documentElement) return "page";
  if (!(hit === host || host.contains(hit))) return `<${hit.localName}> outside the fixture`;
  // elementFromPoint stops at a shadow host; look inside it.
  for (let inner = hit.shadowRoot?.elementFromPoint(0, 0); inner && inner !== hit; inner = hit.shadowRoot?.elementFromPoint(0, 0)) hit = inner;
  // Landmark roles (the bar is a banner) are surfaces; these are what a pointer changes.
  const controls = "button, a, input, select, textarea, label, summary, [tabindex], " +
    ["button", "link", "tab", "menuitem", "option", "switch", "checkbox", "radio", "slider"].map(role => `[role=${role}]`).join(", ");
  return hit.closest(controls) ? "control of the fixture" : "surface of the fixture";
});
const clearOfPointer = async (page: Page, fixture: string, when: string): Promise<void> => {
  const under = await underPointer(page);
  assert(under === "page" || (under === "surface of the fixture" && AT_ORIGIN.includes(fixture)),
    `${engine}/${fixture}: a ${under} is under the resting pointer ${when}`);
};
let html = "";
let preupgrade = false;
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === "/fixture.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
  if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
  if (path === "/preupgrade.css") return new Response(Bun.file("dist/elements/preupgrade.css"));
  return new Response(`<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css">${preupgrade ? '<link rel="stylesheet" href="/preupgrade.css">' : ""}<style>body{width:600px;margin:0;padding-top:${CLEAR}px}#stage{width:600px}</style></head><body><main id="stage">${html}<div id="following">Following content</div></main></body></html>`, { headers: { "Content-Type": "text/html" } });
} });
const browser = await ({ chromium, firefox, webkit })[engine].launch();
type Box = { x: number; y: number; width: number; height: number };
const regions = (page: Page, selector: string): Promise<Box[]> => page.evaluate(selector =>
  Array.from(document.querySelector("#stage > :first-child")!.shadowRoot!.querySelectorAll(selector), node => {
    const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
  }), selector);
const pixels = async (page: Page, before: Buffer, after: Buffer, regions: Box[]) => page.evaluate(async ({ a, b, regions }) => {
  const read = async (base64: string) => {
    const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.width, image.height).data;
  };
  const [x, y] = await Promise.all([read(a), read(b)]);
  let changed = 0, outside = 0, maxDelta = 0;
  const bounds = [1024, 768, -1, -1];
  for (let i = 0; i < x.length; i += 4) if (x[i] !== y[i] || x[i + 1] !== y[i + 1] || x[i + 2] !== y[i + 2] || x[i + 3] !== y[i + 3]) {
    changed++;
    const px = (i / 4) % 1024, py = Math.floor(i / 4 / 1024);
    if (!regions.some(r => px >= Math.floor(r.x) && px < Math.ceil(r.x + r.width) && py >= Math.floor(r.y) && py < Math.ceil(r.y + r.height))) outside++;
    bounds[0] = Math.min(bounds[0], px); bounds[1] = Math.min(bounds[1], py);
    bounds[2] = Math.max(bounds[2], px); bounds[3] = Math.max(bounds[3], py);
    maxDelta = Math.max(maxDelta, ...[0, 1, 2, 3].map(c => Math.abs(x[i + c] - y[i + c])));
  }
  return { changed, outside, maxDelta, bounds };
}, { a: before.toString("base64"), b: after.toString("base64"), regions });
const report: object[] = [];
let failures = 0, equal = 0, exceptions = 0;
const started = performance.now();
try {
  for (const fixture of fixtures.filter(f => !only || f.element === only)) {
    const host = parseHTML(`<html><body>${fixture.html}</body></html>`).document.body.firstElementChild!;
    html = renderElement(`m-${fixture.element}`, Object.fromEntries(Array.from(host.attributes, a => [a.name, a.value])), host.innerHTML);
    if (mutation === "root") html = html.replace('shadowrootmode="open"', 'data-no-shadow="open"');
    if (mutation === "styles") html = html.replace(/<style>[\s\S]*?<\/style>/g, "");
    const options = { viewport: { width: 1024, height: 768 }, reducedMotion: "reduce" as const };
    preupgrade = false;
    const children = RENDERED_CHILDREN[fixture.element] ?? "";
    let roots: boolean[] = [];
    let inert = await browser.newPage({ ...options, javaScriptEnabled: false });
    await inert.goto(server.url.href);
    const firstPaint = await inert.evaluate(() => {
      const root = document.querySelector("#stage > :first-child")!.shadowRoot;
      if (!root) return { root: false, rules: 0, styled: false };
      const style = root.querySelector("style");
      if (!style?.sheet) return { root: true, rules: 0, styled: false };
      const nodes = [root.host, ...Array.from(root.querySelectorAll("*"))];
      const signature = () => nodes.map(node => {
        const css = getComputedStyle(node);
        return [css.display, css.position, css.fontFamily, css.color, css.backgroundColor, css.width, css.height, css.padding, css.borderRadius].join(";");
      }).join("\n");
      const before = signature();
      const rules = style.sheet?.cssRules.length ?? 0;
      style.sheet!.disabled = true;
      const styled = before !== signature();
      style.sheet!.disabled = false;
      return { root: true, rules, styled };
    });
    if (FALLBACK.includes(fixture.element)) {
      assert.deepEqual(firstPaint, { root: false, rules: 0, styled: false }, `${engine}/${fixture.element}: opted-out host must have no declarative root`);
      assert(await inert.evaluate(markup => {
        const expected = document.createElement("template");
        expected.innerHTML = markup;
        return document.querySelector("#stage > :first-child")!.isEqualNode(expected.content.firstElementChild);
      }, fixture.html), `${engine}/${fixture.element}: fallback must contain only the authored host and light DOM`);
      if (!children) {
        await clearOfPointer(inert, fixture.element, "without JavaScript");
        await inert.screenshot({ path: `${directory}/${fixture.element}-before.png`, animations: "disabled" });
        await inert.close();
        equal++;
        report.push({ element: fixture.element, firstPaint, fallback: true });
        console.log(`${engine}/${fixture.element}: host/light DOM only, no declarative root`);
        continue;
      }
      roots = await inert.evaluate(selector => Array.from(document.querySelectorAll(`#stage > :first-child ${selector}`),
        child => (child.shadowRoot?.querySelector("style")?.sheet?.cssRules.length ?? 0) > 0), children);
      assert(roots.length > 0 && roots.every(Boolean), `${engine}/${fixture.element}: every ${children} must have a styled declarative root without JavaScript`);
      await inert.close();
      preupgrade = true;
      inert = await browser.newPage({ ...options, javaScriptEnabled: false });
      await inert.goto(server.url.href);
    } else {
      assert(firstPaint.root && firstPaint.rules > 0 && firstPaint.styled, `${engine}/${fixture.element}: unstyled no-JS root ${JSON.stringify(firstPaint)}`);
      // Child roots used to be recorded only for an opted-out host. The toolbar
      // has its own root now, and its icon buttons are still measured (FLO-412).
      if (children) {
        roots = await inert.evaluate(selector => Array.from(document.querySelectorAll(`#stage > :first-child ${selector}`),
          child => (child.shadowRoot?.querySelector("style")?.sheet?.cssRules.length ?? 0) > 0), children);
        assert(roots.length > 0 && roots.every(Boolean), `${engine}/${fixture.element}: every ${children} must have a styled declarative root without JavaScript`);
      }
    }
    const anchors = await inert.evaluate(() => CSS.supports("anchor-name", "none"));
    const allowance = allowed.find(e => e.element === fixture.element && e.engines.includes(engine) && (!e.withoutAnchors || !anchors));
    const beforeRegions = allowance ? await regions(inert, allowance.selector) : [];
    if (allowance) assert(beforeRegions.length, `${fixture.element}: exception selector matches no SSR node`);
    await clearOfPointer(inert, fixture.element, "before the upgrade");
    const before = await inert.screenshot({ path: `${directory}/${fixture.element}-before.png`, animations: "disabled" });
    await inert.close();
    const page = await browser.newPage(options);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(server.url.href);
    await page.addScriptTag({ content: observeJS });
    await page.waitForFunction(() => !!window.ssrUpgrade);
    await page.evaluate(({ url, mutation, children }) => window.ssrUpgrade.observe(async () => {
      // The children's roots before the upgrade. A constructor's attachShadow returns a
      // declarative root as the same object, emptied, so comparing them afterwards shows
      // that each host survived and upgraded, not that its root was never rebuilt: the
      // pixel and geometry comparison is what would show a rebuild.
      const parsed = children ? Array.from(document.querySelectorAll(`#stage > :first-child ${children}`), child => child.shadowRoot) : [];
      Object.assign(window, { ssrParsedRoots: parsed });
      await import(url);
      const host = document.querySelector<HTMLElement>("#stage > :first-child")!;
      if (mutation === "layout") host.style.marginTop = "10px";
      if (mutation === "pixels") host.shadowRoot!.querySelector<HTMLElement>("button")!.style.backgroundColor = "red";
    }, children), { url: `${server.url}fixture.js`, mutation, children });
    assert(await page.evaluate(() => {
      const host = document.querySelector("#stage > :first-child") as HTMLElement & { component?: unknown };
      return !!host.shadowRoot && !!host.component;
    }), `${fixture.element}: upgrade must retain the shadow root and construct the component`);
    if (children) assert.deepEqual(await page.evaluate(selector => {
      const parsed = (window as unknown as { ssrParsedRoots: (ShadowRoot | null)[] }).ssrParsedRoots;
      return Array.from(document.querySelectorAll<HTMLElement & { component?: unknown }>(`#stage > :first-child ${selector}`),
        (child, i) => !!child.component && !!parsed[i] && child.shadowRoot === parsed[i]);
    }, children), roots.map(() => true), `${fixture.element}: every ${children} must upgrade in place`);
    const state = await page.evaluate(() => window.ssrUpgrade.state);
    const tabs = fixture.element === "tabs" ? await page.evaluate(() => {
      const indicator = document.querySelector("m-tabs")!.shadowRoot!.querySelector<HTMLElement>('[part="indicator"]')!;
      return { anchors: CSS.supports("anchor-name", "none"), width: getComputedStyle(indicator).width, transform: indicator.style.transform, inlineWidth: indicator.style.width };
    }) : undefined;
    await clearOfPointer(page, fixture.element, "after the upgrade");
    const after = await page.screenshot({ path: `${directory}/${fixture.element}-after.png`, animations: "disabled" });
    const afterRegions = allowance ? await regions(page, allowance.selector) : [];
    if (allowance) assert(afterRegions.length, `${fixture.element}: exception selector matches no upgraded node`);
    const pixelDiff = await pixels(page, before, after, [...beforeRegions, ...afterRegions]);
    const changedPixels = pixelDiff.changed;
    const issues = [ ...(changedPixels ? ["pixels"] : []), ...(state.nativeCLS || state.maxGeometryDelta ? ["layout"] : []), ...errors ];
    if (tabs) {
      console.log(`${engine} tabs: ${tabs.anchors ? "CSS anchors" : "measurement fallback"}, indicator width ${tabs.width}`);
      assert(parseFloat(tabs.width) > 0, "Tabs indicator must have a visible width");
      if (!tabs.anchors) assert(parseFloat(tabs.inlineWidth) > 0 && tabs.transform, "Tabs measurement fallback must run");
    }
    const exception = issues.length === 1 && issues[0] === "pixels" && allowance && !pixelDiff.outside &&
      changedPixels <= (allowance.maxPixels ?? Infinity) && pixelDiff.maxDelta <= (allowance.maxDelta ?? 255) ? allowance.reason : undefined;
    if (!issues.length) equal++;
    else if (exception) exceptions++;
    else failures++;
    report.push({ element: fixture.element, firstPaint, changedPixels, pixelDiff, ...state, tabs, issues, exception });
    console.log(`${engine}/${fixture.element}: pixels=${changedPixels}, CLS=${state.nativeSupported ? state.nativeCLS : "unsupported"}, geometry=${state.maxGeometryDelta}, ${exception ? "exception" : issues.length ? "FAIL" : "equal"}`);
    await page.close();
  }
  const summary = { engine, equal, exceptions, failures, seconds: (performance.now() - started) / 1000 };
  await Bun.write(`${directory}/report.json`, JSON.stringify({ summary, report }, null, 2));
  console.log(`SSR upgrade ${engine}: ${equal} equal, ${exceptions} exceptions, ${failures} failures (${summary.seconds.toFixed(1)}s)`);
  assert.equal(failures, 0, `${directory}/report.json`);
} finally { await browser.close(); server.stop(true); }
