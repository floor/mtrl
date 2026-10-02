#!/usr/bin/env bun
// scripts/check-ssr-parity.ts
// Build first. Structural parity and its owned exceptions stay in Chromium.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { parseHTML } from "linkedom";
import "./fixtures/ssr-css";
import { renderElement } from "../src/ssr/index.ts";
import { elements } from "../dist/elements/index.js";
import { cases } from "./fixtures/preupgrade-cases";
import exceptions from "./fixtures/ssr-parity-exceptions.json";
import type { ParityAPI, Snapshot } from "./fixtures/ssr-parity";

declare global { interface Window { ssrParity: ParityAPI } }
type Difference = { property: string; server: string | null; browser: string | null };
type Exception = Difference & { element: string; phase: string; issue: string };
const allowed = exceptions as Exception[];
const engine = process.argv.find(arg => arg.startsWith("--engine="))?.split("=")[1] ?? "chromium";
assert.equal(engine, "chromium", "Structural parity is Chromium-only; use ssr:check for three-engine upgrade/paint coverage");
const defaults = cases.filter(c => c.variant === "default");
assert.equal(defaults.length, 37); // 36 elements, and the navigation bar (FLO-305)
assert.deepEqual(defaults.map(c => c.element).sort(), Object.values(elements).map(e => e.spec.name).sort());
const fixtures = [
  ...defaults,
  { element: "textfield", variant: "multiline value", html: '<m-textfield label="Name" type="multiline" value="Ada"></m-textfield>' },
];
assert.equal(fixtures.length, 38);
const bundle = await Bun.build({ entrypoints: ["scripts/fixtures/ssr-parity.ts"], target: "browser" });
assert(bundle.success, String(bundle.logs));
const js = await bundle.outputs[0].text();
let html = "";
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === "/fixture.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
  if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
  return new Response(`<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css"><style>body{width:600px;margin:0}</style></head><body>${html}</body></html>`, { headers: { "Content-Type": "text/html" } });
} });
const browser = await chromium.launch();
const report: Array<{ element: string; equal: number; exceptions: number; failures: Array<Difference & { phase: string }> }> = [];
const observed = new Set<number>();
const optedOut = new Set(["carousel", "fab-menu"]);
const compare = (a: Snapshot, b: Snapshot): Difference[] => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(key => a[key] !== b[key]).map(property => ({ property, server: a[property] ?? null, browser: b[property] ?? null }));
try {
  for (const fixture of fixtures) {
    const source = parseHTML(`<html><body>${fixture.html}</body></html>`).document.body.firstElementChild!;
    const attrs = Object.fromEntries(Array.from(source.attributes, a => [a.name, a.value]));
    const authoredIds = [source, ...Array.from(source.querySelectorAll("[id]"))].map(n => n.id).filter(Boolean);
    html = renderElement(`m-${fixture.element}`, attrs, source.innerHTML);
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto(server.url.href);
    // Parser-created shadow root before any library script is loaded.
    const fallback = optedOut.has(fixture.element);
    assert.equal(await page.evaluate(() => !!document.body.firstElementChild?.shadowRoot), !fallback, `${fixture.element}: declarative root policy`);
    if (fallback) {
      const preserved = await page.evaluate(markup => {
        const expected = document.createElement("template");
        expected.innerHTML = markup;
        return document.body.firstElementChild!.cloneNode(true).isEqualNode(expected.content.firstElementChild);
      }, fixture.html);
      assert(preserved, `${fixture.element}: fallback must contain only the authored host and light DOM`);
    }
    await page.addScriptTag({ url: `${server.url}fixture.js`, type: "module" });
    await page.waitForFunction(() => !!window.ssrParity);
    const ssr = await page.evaluate(ids => window.ssrParity.snapshot(document.body.firstElementChild!, ids), authoredIds);
    const upgrade = await page.evaluate(ids => {
      window.ssrParity.upgrade();
      return window.ssrParity.snapshot(document.body.firstElementChild!, ids);
    }, authoredIds);
    if (!fallback) assert.equal(Object.keys(upgrade).filter(k => k.endsWith("/shadow/css")).length, Object.keys(ssr).filter(k => k.endsWith("/shadow/css")).length, "Upgrade lost roots");
    html = "";
    await page.goto(server.url.href);
    await page.addScriptTag({ url: `${server.url}fixture.js`, type: "module" });
    await page.waitForFunction(() => !!window.ssrParity);
    const immediate = await page.evaluate(({ markup, ids }) => window.ssrParity.snapshot(window.ssrParity.mount(markup), ids), { markup: fixture.html, ids: authoredIds });
    assert.deepEqual(compare(upgrade, immediate), [], `${fixture.element}: upgrade differs from fresh construction`);
    const order = await page.evaluate(() => window.ssrParity.styleOrder(document.querySelector("main")!.firstElementChild!));
    const linked = renderElement(`m-${fixture.element}`, {}, "", { styles: "link", cssBase: "/css" });
    const urls = [...linked.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(urls, fallback ? [] : order.names.map(name => `/css/${name.replace("host:", "hosts/")}.css`), `${fixture.element}: link adoption order`);
    assert.deepEqual(order.sources, order.adopted, `${fixture.element}: inline source/adoption order`);
    if (!fallback) assert.equal(ssr["host/shadow/css"], order.adopted.join("\n"), `${fixture.element}: inline/adopted CSS`);
    await page.evaluate(async () => { for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame); });
    await page.waitForTimeout(400);
    const settled = await page.evaluate(ids => window.ssrParity.snapshot(document.querySelector("main")!.firstElementChild!, ids), authoredIds);
    const row = { element: fixture.element, equal: 0, exceptions: 0, failures: [] as Array<Difference & { phase: string }> };
    for (const [phase, actual] of (fallback ? [] : [["immediate", immediate], ["settled", settled]]) as Array<[string, Snapshot]>) {
      const differences = compare(ssr, actual);
      row.equal += new Set([...Object.keys(ssr), ...Object.keys(actual)]).size - differences.length;
      for (const diff of differences) {
        const match = allowed.findIndex(e => e.element === fixture.element && e.phase === phase && e.property === diff.property && e.server === diff.server && e.browser === diff.browser);
        if (match >= 0) { observed.add(match); row.exceptions++; }
        else row.failures.push({ phase, ...diff });
      }
    }
    assert.deepEqual(errors, [], `${fixture.element}: browser errors`);
    report.push(row);
    console.log(`${fixture.element}${fallback ? " (host/light DOM only)" : ""}: ${row.equal} equal, ${row.exceptions} exceptions, ${row.failures.length} failures`);
    await page.close();
  }
  await mkdir("analysis", { recursive: true });
  await Bun.write(`analysis/ssr-parity-${engine}.json`, JSON.stringify(report, null, 2));
  console.log(`SSR parity chromium: ${report.reduce((n, row) => n + row.equal, 0)} equal, ${report.reduce((n, row) => n + row.exceptions, 0)} exceptions, ${report.reduce((n, row) => n + row.failures.length, 0)} failures`);
  assert.equal(allowed.length - observed.size, 0, "Resolved exceptions must be removed");
  assert.equal(report.reduce((n, row) => n + row.failures.length, 0), 0, `Unexpected differences: analysis/ssr-parity-${engine}.json`);
} finally { await browser.close(); server.stop(true); }
