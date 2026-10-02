#!/usr/bin/env bun
// scripts/check-ssr-fallback.ts
// Build first. Check parser-created roots, phase-A fallbacks and browser upgrade.
import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";
import { parseHTML } from "linkedom";
import { renderElement } from "../dist/ssr/index.js";
import { cases } from "./fixtures/preupgrade-cases";
import { checkDeclarativeUpgrade } from "./check-elements-ssr";

const engines = { chromium, firefox, webkit };
const requested = process.argv.find(arg => arg.startsWith("--engine="))?.split("=")[1];
assert(!requested || requested in engines, `Unknown engine: ${requested}`);
const bundle = await Bun.build({ entrypoints: ["scripts/fixtures/ssr-parity.ts"], target: "browser" });
assert(bundle.success, String(bundle.logs));
const js = await bundle.outputs[0].text();
const fixtures = cases.filter(c => c.variant === "default").map(fixture => {
  const source = parseHTML(`<html><body>${fixture.html}</body></html>`).document.body.firstElementChild!;
  return {
    name: fixture.element,
    html: renderElement(`m-${fixture.element}`, Object.fromEntries(Array.from(source.attributes, a => [a.name, a.value])), source.innerHTML),
    fallback: ["carousel", "fab-menu"].includes(fixture.element),
  };
});
for (const attributes of [{ open: true }, { presentation: "menu" }]) fixtures.push({
  name: `fab-menu ${JSON.stringify(attributes)}`,
  html: renderElement("m-fab-menu", attributes, '<m-fab-menu-item>A</m-fab-menu-item><m-fab-menu-item>B</m-fab-menu-item>'),
  fallback: true,
});
for (const name of ["menu", "split-button"]) fixtures.push({
  name: `${name} nested submenu`,
  html: renderElement(`m-${name}`, {}, '<m-menu-item>A<m-menu-item>B</m-menu-item></m-menu-item>'),
  fallback: true,
});
let html = "";
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === "/fixture.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
  if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
  return new Response(`<!doctype html><html><head><link rel="stylesheet" href="/styles.css"></head><body>${html}</body></html>`, { headers: { "Content-Type": "text/html" } });
} });
try {
  for (const [name, engine] of Object.entries(engines)) {
    if (requested && requested !== name) continue;
    const browser = await engine.launch();
    try {
      await checkDeclarativeUpgrade(browser);
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const fixture of fixtures) {
        html = fixture.html;
        await page.goto(server.url.href);
        assert.equal(await page.evaluate(() => !!document.body.firstElementChild?.shadowRoot), !fixture.fallback, `${name}/${fixture.name}: parser root`);
        const before = await page.evaluate(() => document.body.firstElementChild!.innerHTML);
        await page.addScriptTag({ url: `${server.url}fixture.js`, type: "module" });
        await page.waitForFunction(() => !!window.ssrParity);
        await page.evaluate(() => window.ssrParity.upgrade());
        await page.waitForFunction(() => !!(document.body.firstElementChild as HTMLElement & { component?: unknown }).component);
        await page.evaluate(async () => { for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame); });
        assert.equal(await page.evaluate(() => document.body.firstElementChild!.querySelectorAll(":scope > template[shadowrootmode]").length), 0, `${name}/${fixture.name}: leftover template`);
        // The upgrade sets the roving tabindex on the toolbar's default-slot
        // targets (FLO-387). The server wrote none, so that light DOM changes.
        if (fixture.name !== "toolbar") assert.equal(await page.evaluate(() => document.body.firstElementChild!.innerHTML), before, `${name}/${fixture.name}: light DOM preserved`);
        assert.deepEqual(errors, [], `${name}/${fixture.name}: browser errors`);
      }
      await page.close();
      console.log(`SSR fallback ${name}: ${fixtures.length} equal, 0 exceptions, 0 failures; early-definition regression passed`);
    } finally { await browser.close(); }
  }
} finally { server.stop(true); }
