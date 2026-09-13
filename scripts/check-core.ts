#!/usr/bin/env bun
/** Exercise the packed shared ripple and component teardown in Chromium. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import type createButton from "../src/components/button";
import { createPackageFixture } from "./package-fixture";

type CoreWindow = Window & {
  core: { createButton: typeof createButton };
  button: ReturnType<typeof createButton>;
  documentListeners: Map<string, Set<EventListenerOrEventListenerObject>>;
  offsetReads: number;
};
const fixture = await createPackageFixture();
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const entry = join(fixture.directory, "core.ts");
  await writeFile(entry, `import { createButton } from 'mtrl'; window.core = { createButton };`);
  const bundle = await Bun.build({ entrypoints: [entry], target: "browser", format: "iife", minify: true });
  assert(bundle.success, String(bundle.logs));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 600, height: 300 } });
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addStyleTag({ content: await readFile(join(fixture.installed, "dist/styles.css"), "utf8") });
  await page.addScriptTag({ content: await bundle.outputs[0].text() });
  await page.evaluate(() => {
    const state = window as unknown as CoreWindow;
    state.documentListeners = new Map(); state.offsetReads = 0;
    const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
    document.addEventListener = (type: string, fn: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (["mouseup", "mouseleave"].includes(type)) {
        if (!state.documentListeners.has(type)) state.documentListeners.set(type, new Set());
        state.documentListeners.get(type)!.add(fn);
      }
      add(type, fn, options);
    };
    document.removeEventListener = (type: string, fn: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
      state.documentListeners.get(type)?.delete(fn); remove(type, fn, options);
    };
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")!;
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { ...height, get() { state.offsetReads++; return height.get!.call(this); } });
    state.button = state.core.createButton({ text: "Save", variant: "filled" });
    state.button.element.id = "button"; document.body.append(state.button.element);
  });
  await page.locator("#button").hover();
  await page.mouse.down();
  await page.waitForFunction(() => {
    const wave = document.querySelector(".mtrl-ripple-wave");
    return wave && getComputedStyle(wave).animationName === "mtrl-ripple-expand" && Number(getComputedStyle(wave).opacity) > 0;
  });
  assert.equal(await page.evaluate(() => (window as unknown as CoreWindow).offsetReads), 0, "Ripple forced an offsetHeight read");
  const artifacts = resolve("analysis/core"); await mkdir(artifacts, { recursive: true });
  await page.screenshot({ path: join(artifacts, "ripple-pressed.png") });
  await page.mouse.up();
  await page.waitForFunction(() => !document.querySelector(".mtrl-ripple-wave"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.down();
  assert.equal(await page.locator(".mtrl-ripple-wave").evaluate(element => getComputedStyle(element).animationName), "none");
  await page.mouse.up();
  await page.evaluate(() => {
    const state = window as unknown as CoreWindow;
    state.button.destroy();
    for (let i = 0; i < 40; i++) {
      const button = state.core.createButton({ text: "Save" }); document.body.append(button.element);
      button.element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      if (i % 2) document.dispatchEvent(new MouseEvent("mouseup"));
      button.destroy(); button.destroy();
    }
  });
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => [...(window as unknown as CoreWindow).documentListeners.values()].reduce((sum, set) => sum + set.size, 0)), 0);
  assert.equal(await page.locator(".mtrl-ripple-wave").count(), 0);
  console.log("Passed packed ripple animation, reduced motion, no forced offsetHeight read, and 40 pressed teardown cycles.");
} finally {
  await browser?.close();
  await fixture.cleanup();
}
