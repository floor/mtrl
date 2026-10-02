#!/usr/bin/env bun
// scripts/check-vue-ssr.ts
// Built-package Vue SSR: every element's default case, parser consumption,
// hydration and browser isolation. Build first.
//
//   bun run build && bun run vue-ssr:check
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { chromium } from "playwright";
import { declarations, elements } from "../src/elements";
import { cases } from "./fixtures/preupgrade-cases";
import { pascal as componentName } from "./element-modules";
import { assertGlobalHost, GLOBAL_HOST_DOM, readGlobalHost } from "./fixtures/ssr-global-host";

// CI runs this twice, on the installed Vue and on the peer floor: the log says which.
const version = (await Bun.file("node_modules/vue/package.json").json() as { version: string }).version;
const OPT_OUT = new Set(["carousel", "fab-menu"]);
const pascal = (name: string): string => name.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

interface SpecAttributes {
  attributes?: Record<string, { type?: string }>;
  properties?: Record<string, unknown>;
}
const specs = new Map<string, SpecAttributes>();
for (const element of Object.values(elements)) specs.set(element.spec.name, element.spec);
for (const declaration of Object.values(declarations)) specs.set(declaration.name, declaration);

interface DomNode { nodeType: number; textContent: string | null }
interface DomElement extends DomNode {
  localName: string;
  attributes: Iterable<{ name: string; value: string }>;
  childNodes: Iterable<DomNode>;
  children: Iterable<DomElement>;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  querySelector(selector: string): DomElement | null;
}

const defaults = cases.filter((item) => item.variant === "default");
const missing = [...specs.keys()].filter((name) => specs.get(name)?.attributes && Object.values(elements).some((element) => element.spec.name === name) && !defaults.some((item) => item.element === name));
assert.deepEqual(missing, [], `default SSR case missing for ${missing.join(", ")}`);

const used = new Set<string>();
const propName = (spec: SpecAttributes, attribute: string): string => {
  const known = !!spec.attributes && Object.prototype.hasOwnProperty.call(spec.attributes, attribute);
  if (!known) return attribute;
  const name = camel(attribute);
  const shadowed = !!spec.properties && Object.prototype.hasOwnProperty.call(spec.properties, name);
  return shadowed ? `default${pascal(name)}` : name;
};

const renderNode = (element: DomElement, extra: Array<[string, string]> = []): string => {
  const name = element.localName.slice(2);
  const spec = specs.get(name);
  assert(spec, `no Vue component for <${element.localName}>`);
  const component = `M${componentName(name)}`; // MTextField (FLO-383)
  used.add(component);
  const props = new Map<string, string>(extra);
  for (const attribute of element.attributes) {
    const key = propName(spec, attribute.name);
    const type = spec.attributes?.[attribute.name]?.type;
    const value = type === "boolean"
      ? (attribute.value === "false" ? "false" : "true")
      : JSON.stringify(attribute.value);
    props.set(key, value);
  }
  const children: string[] = [];
  for (const node of element.childNodes) {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (text.trim()) children.push(JSON.stringify(text));
    } else if (node.nodeType === 1) children.push(renderNode(node as DomElement));
  }
  const attrs = [...props].map(([key, value]) => `${JSON.stringify(key)}: ${value}`).join(", ");
  const slot = children.length === 0 ? ""
    : children.length === 1 ? `, () => ${children[0]}`
    : `, () => [${children.join(", ")}]`;
  return `h(${component}, { ${attrs} }${slot})`;
};

const pieces: string[] = [];
for (const item of defaults) {
  const host = parseHTML(`<html><body>${item.html}</body></html>`).document.body.firstElementChild as DomElement | null;
  assert(host, item.element);
  const extra: Array<[string, string]> = [["id", JSON.stringify(`host-${item.element}`)]];
  if (item.element === "button") {
    extra.push(["type", JSON.stringify("submit")]);
    pieces.push(`h("form", { onSubmit: (event: Event) => { event.preventDefault(); clicks.value += 1; } }, [${renderNode(host, extra)}])`);
    pieces.push(`h("output", { id: "clicks" }, String(clicks.value))`);
    continue;
  }
  if (item.element === "switch") {
    extra.push(["checked", "checked.value"]);
    extra.push(["onChange", "(event: CustomEvent<{ checked: boolean }>) => { checked.value = event.detail.checked; }"]);
    pieces.push(renderNode(host, extra));
    pieces.push(`h("output", { id: "checked" }, String(checked.value))`);
    continue;
  }
  pieces.push(renderNode(host, extra));
}
used.add("MButton");
pieces.push(`h(MButton, { id: "globals", label: "Globals", popover: "auto", inputmode: "numeric", enterkeyhint: "send", itemprop: "name", nonce: "abc" })`);

const app = `import { defineComponent, h, ref } from "vue";
import { ${[...used].sort().join(", ")} } from "mtrl/vue";

export const App = defineComponent(() => {
  const clicks = ref(0);
  const checked = ref(true);
  return () => h("main", null, [
    ${pieces.join(",\n    ")}
  ]);
});
`;

const dir = join(process.cwd(), "analysis/vue-ssr");
await mkdir(dir, { recursive: true });
await Bun.write(join(dir, "App.ts"), app);
const asyncApp = `import { defineComponent, h, Suspense } from "vue";
import { MButton } from "mtrl/vue";

const pending = new Promise<string>((resolve) => setTimeout(() => resolve("outside-loaded"), 20));

const Slow = defineComponent({
  name: "Slow",
  async setup() {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return () => h("i", { id: "async-setup" }, "async-loaded");
  },
});

const Reader = defineComponent({
  name: "Reader",
  async setup() {
    const text = await pending;
    return () => h("i", { id: "outside" }, text);
  },
});

const SyncRead = defineComponent({
  name: "SyncRead",
  async setup() {
    const text = await pending;
    return () => h(MButton, { id: "host-sync" }, () => h("i", { id: "sync-read" }, text));
  },
});

const Plain = defineComponent({
  name: "Plain",
  async setup() {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return () => h("i", { id: "plain-setup" }, "plain-loaded");
  },
});

export const AsyncApp = defineComponent(() => {
  return () => h("main", null, [
    h(Suspense, null, {
      default: () => h(MButton, { id: "host-async" }, () => h(Slow)),
      fallback: () => h("em", "async-pending"),
    }),
    h(Suspense, null, {
      default: () => h(MButton, { id: "host-outside" }, () => h(Reader)),
      fallback: () => h("em", "outside-pending"),
    }),
    h(Suspense, null, {
      default: () => h(SyncRead),
      fallback: () => h("em", "sync-pending"),
    }),
    h(Suspense, null, {
      default: () => h("div", { id: "plain-async" }, [h(Plain)]),
      fallback: () => h("em", "plain-pending"),
    }),
  ]);
});
`;

await Bun.write(join(dir, "AsyncApp.ts"), asyncApp);
await Bun.write(join(dir, "server.ts"), `import "mtrl/ssr/vue";
import { createSSRApp } from "vue";
import { pipeToNodeWritable, renderToString, renderToWebStream } from "@vue/server-renderer";
import { PassThrough } from "node:stream";
import { App } from "./App";
import { AsyncApp } from "./AsyncApp";
export const renderBody = (): Promise<string> => renderToString(createSSRApp(App));
export const renderAsync = (): Promise<string> => renderToString(createSSRApp(AsyncApp));
export const renderAsyncNode = (): Promise<string> => new Promise((resolve, reject) => {
  const writable = new PassThrough();
  const chunks: Buffer[] = [];
  const timer = setTimeout(() => reject(new Error("Vue SSR node stream did not finish")), 5000);
  writable.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
  writable.on("error", (error) => {
    clearTimeout(timer);
    reject(error);
  });
  writable.on("end", () => {
    clearTimeout(timer);
    resolve(Buffer.concat(chunks).toString());
  });
  pipeToNodeWritable(createSSRApp(AsyncApp), {}, writable);
});
export const renderAsyncStream = async (): Promise<string> => {
  const stream = renderToWebStream(createSSRApp(AsyncApp));
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let html = "";
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const remaining = Math.max(1, deadline - Date.now());
    const next = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Vue SSR stream did not finish")), remaining)),
    ]);
    if (next.done) return html + decoder.decode();
    html += decoder.decode(next.value, { stream: true });
  }
  throw new Error("Vue SSR stream did not finish");
};
`);
await Bun.write(join(dir, "client.ts"), `import { createSSRApp } from "vue";
import { App } from "./App";
const ids = [...document.querySelectorAll("[id^='host-']")].map((node) => node.id);
const before = new Map(ids.map((id) => [id, document.getElementById(id)?.shadowRoot ?? null]));
const state: { ready: boolean; same: Record<string, boolean | null> } = { ready: false, same: {} };
Object.assign(window, { vueSSR: state });
createSSRApp(App).mount("#root");
for (const id of ids) {
  const previous = before.get(id) ?? null;
  state.same[id] = previous ? document.getElementById(id)?.shadowRoot === previous : null;
}
state.ready = true;
`);
await Bun.write(join(dir, "async-client.ts"), `import { createSSRApp } from "vue";
import { AsyncApp } from "./AsyncApp";
const ids = ["host-async", "host-outside", "host-sync"];
const before = new Map(ids.map((id) => [id, document.getElementById(id)?.shadowRoot ?? null]));
const state: { ready: boolean; same: Record<string, boolean | null> } = { ready: false, same: {} };
Object.assign(window, { vueAsync: state });
createSSRApp(AsyncApp).mount("#root");
for (const id of ids) {
  const previous = before.get(id) ?? null;
  state.same[id] = previous ? document.getElementById(id)?.shadowRoot === previous : null;
}
state.ready = true;
`);

// Development builds, so Vue reports hydration mismatches and warnings.
const defines = {
  "process.env.NODE_ENV": '"development"',
  __VUE_OPTIONS_API__: "true",
  __VUE_PROD_DEVTOOLS__: "false",
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true",
};

const bundle = async (entry: string, target: "browser" | "bun"): Promise<string> => {
  const loaded: string[] = [];
  const result = await Bun.build({
    entrypoints: [entry], target, conditions: ["development"], define: defines,
    plugins: [{
      name: "ssr-isolation", setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => { loaded.push(args.path); return undefined; });
      },
    }],
  });
  assert(result.success, result.logs.map(String).join("\n"));
  if (target === "browser") {
    assert(!loaded.some((path) => /\/(?:ssr|linkedom)\//.test(path)), `Client loaded server code:\n${loaded.filter((path) => /ssr|linkedom/.test(path)).join("\n")}`);
  }
  const code = await result.outputs[0].text();
  if (target === "browser") assert.doesNotMatch(code, /linkedom|from"mtrl\/ssr"|from 'mtrl\/ssr'/);
  return code;
};

const createSource = await Bun.file("dist/vue/create.js").text();
assert(createSource.includes("createStaticVNode"), "Vue runtime was built without the shadow template; rebuild");
for (const declaration of Object.values(declarations)) {
  const source = await Bun.file(`dist/vue/${declaration.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.js`).text();
  assert(!source.includes("shadow("), `${declaration.name} is a declaration and must not emit a shadow template`);
}

const serverBundle = await bundle(join(dir, "server.ts"), "bun");
// A `.js` import beside `server.ts` resolves to the TypeScript source. The bundle needs its own name.
const serverPath = join(process.cwd(), ".check-vue-ssr.js");
await Bun.write(serverPath, serverBundle);
let html: string;
let asyncHtml = "";
let asyncStream = "";
try {
  const loaded = await import(serverPath) as {
    renderBody: () => Promise<string>;
    renderAsync: () => Promise<string>;
    renderAsyncStream: () => Promise<string>;
    renderAsyncNode: () => Promise<string>;
  };
  html = await loaded.renderBody();
  asyncHtml = await loaded.renderAsync();
  asyncStream = await loaded.renderAsyncStream();
  assert.equal(await loaded.renderAsyncNode(), asyncHtml, "pipeToNodeWritable did not match renderToString");
} finally {
  await Bun.file(serverPath).delete();
}
assertGlobalHost(html);
assert.equal(asyncStream, asyncHtml, "renderToWebStream did not match renderToString");
assert.match(asyncHtml, /<i id="async-setup">async-loaded<\/i>/);
assert.match(asyncHtml, /<i id="outside">outside-loaded<\/i>/);
assert.match(asyncHtml, /<i id="sync-read">outside-loaded<\/i>/);
assert.match(asyncHtml, /<div id="plain-async"><i id="plain-setup">plain-loaded<\/i><\/div>/);
assert.doesNotMatch(asyncHtml, /pending/);
for (const id of ["host-async", "host-outside", "host-sync"]) {
  assert.match(asyncHtml, new RegExp(`<m-button[^>]*\\bid="${id}"[^>]*>\\s*<template shadowrootmode="open"`), id);
}
const client = await bundle(join(dir, "client.ts"), "browser");
const asyncClient = await bundle(join(dir, "async-client.ts"), "browser");

interface Report {
  element: string;
  template: boolean;
  shadowBeforeScript: boolean;
  sameRoot: boolean | null;
  descendantShadow: boolean | null;
  warnings: number;
  errors: number;
}
const parsed = parseHTML(`<html><body>${html}</body></html>`).document;
const reports = new Map<string, Report>();
for (const item of defaults) {
  const host = parsed.getElementById(`host-${item.element}`) as DomElement | null;
  assert(host, `missing host-${item.element} in server HTML`);
  const template = [...host.children].some((child) => child.localName === "template" && child.hasAttribute("shadowrootmode"));
  const descendant = item.element === "toolbar"
    ? [...(host.querySelector("m-icon-button") as DomElement).children].some((child) => child.localName === "template" && child.hasAttribute("shadowrootmode"))
    : null;
  assert.equal(template, !OPT_OUT.has(item.element), `${item.element} template`);
  if (descendant !== null) assert.equal(descendant, true, "toolbar's icon button still declares a shadow root");
  reports.set(item.element, {
    element: item.element, template, shadowBeforeScript: false, sameRoot: null, descendantShadow: descendant, warnings: 0, errors: 0,
  });
}

const browser = await chromium.launch();
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/client.js") return new Response(client, { headers: { "Content-Type": "text/javascript" } });
    if (pathname === "/async.js") return new Response(asyncClient, { headers: { "Content-Type": "text/javascript" } });
    if (pathname === "/async") return new Response(`<!doctype html><div id="root">${asyncHtml}</div><script type="module" src="/async.js"></script>`, { headers: { "Content-Type": "text/html" } });
    return new Response(`<!doctype html><div id="root">${html}</div><script type="module" src="/client.js"></script>`, { headers: { "Content-Type": "text/html" } });
  },
});
try {
  const inert = await browser.newPage({ javaScriptEnabled: false });
  await inert.goto(server.url.href);
  const before = await inert.evaluate(() => [...document.querySelectorAll("[id^='host-']")].map((node) => ({
    id: node.id,
    shadow: !!node.shadowRoot,
    childShadow: node.id === "host-toolbar" ? !!node.querySelector("m-icon-button")?.shadowRoot : null,
  })));
  for (const row of before) {
    const element = row.id.slice("host-".length);
    const report = reports.get(element);
    assert(report, element);
    report.shadowBeforeScript = row.shadow;
    assert.equal(row.shadow, !OPT_OUT.has(element), `${element} shadow root before script`);
    if (row.childShadow !== null) assert.equal(row.childShadow, true, "toolbar's icon button has a shadow root before script");
  }
  assert.deepEqual(await inert.evaluate(readGlobalHost), GLOBAL_HOST_DOM);
  await inert.close();

  const page = await browser.newPage();
  const pageWarnings: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") pageWarnings.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(server.url.href);
  await page.waitForFunction(() => (window as unknown as { vueSSR?: { ready: boolean } }).vueSSR?.ready);
  const same = await page.evaluate(() => (window as unknown as { vueSSR: { same: Record<string, boolean | null> } }).vueSSR.same);
  for (const [element, report] of reports) {
    report.sameRoot = same[`host-${element}`] ?? null;
    report.warnings = pageWarnings.length;
    report.errors = pageErrors.length;
    if (!OPT_OUT.has(element)) assert.equal(report.sameRoot, true, `${element} did not keep its declarative shadow root`);
    else assert.equal(report.sameRoot, null, `${element} had a declarative root`);
  }
  const upgraded = await page.evaluate(() => !!(document.getElementById("host-button") as HTMLElement & { component?: unknown }).component);
  assert.equal(upgraded, true, "button did not upgrade");
  // Every default host shares the page, and fixed bars cover the first controls.
  // Clicking the host fires the same listener a pointer click would.
  await page.evaluate(() => document.getElementById("host-button")?.click());
  await page.waitForFunction(() => document.getElementById("clicks")?.textContent === "1");
  await page.evaluate(() => {
    const host = document.getElementById("host-switch");
    (host?.shadowRoot?.querySelector("input") ?? host)?.click();
  });
  await page.waitForFunction(() => document.getElementById("checked")?.textContent === "false");
  assert.equal(await page.locator("#host-switch").getByRole("switch", { name: "Wi-Fi" }).isChecked(), false);
  assert.deepEqual(await page.evaluate(readGlobalHost), GLOBAL_HOST_DOM);
  assert.deepEqual({ warnings: pageWarnings, errors: pageErrors }, { warnings: [], errors: [] });
  await page.close();

  const asyncPage = `${server.url.origin}/async`;
  const asyncInert = await browser.newPage({ javaScriptEnabled: false });
  await asyncInert.goto(asyncPage);
  const asyncShadow = await asyncInert.evaluate(() => ["host-async", "host-outside", "host-sync"].map((id) => ({
    id, shadow: !!document.getElementById(id)?.shadowRoot,
  })));
  for (const row of asyncShadow) assert.equal(row.shadow, true, `${row.id} shadow root before script`);
  assert.equal(await asyncInert.locator("#plain-setup").textContent(), "plain-loaded");
  await asyncInert.close();

  const asyncLive = await browser.newPage();
  const asyncWarnings: string[] = [];
  const asyncErrors: string[] = [];
  asyncLive.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") asyncWarnings.push(message.text()); });
  asyncLive.on("pageerror", (error) => asyncErrors.push(error.message));
  await asyncLive.goto(asyncPage);
  await asyncLive.waitForFunction(() => {
    const state = (window as unknown as { vueAsync?: { ready: boolean } }).vueAsync;
    return state?.ready
      && document.getElementById("async-setup")?.textContent === "async-loaded"
      && document.getElementById("outside")?.textContent === "outside-loaded"
      && document.getElementById("sync-read")?.textContent === "outside-loaded"
      && document.getElementById("plain-setup")?.textContent === "plain-loaded";
  });
  const asyncSame = await asyncLive.evaluate(() => (window as unknown as { vueAsync: { same: Record<string, boolean | null> } }).vueAsync.same);
  for (const id of ["host-async", "host-outside", "host-sync"]) assert.equal(asyncSame[id], true, `${id} did not keep its declarative shadow root`);
  assert.equal(await asyncLive.locator("body").textContent().then((text) => text?.includes("pending")), false);
  assert.deepEqual({ warnings: asyncWarnings, errors: asyncErrors }, { warnings: [], errors: [] });
  await asyncLive.close();
} finally {
  server.stop(true);
  await browser.close();
}

const summary = [...reports.values()];
await Bun.write(join(dir, "summary.json"), JSON.stringify(summary, null, 2));
for (const report of summary) {
  const root = report.sameRoot === null ? "n/a" : report.sameRoot ? "kept" : "replaced";
  console.log(`${report.element}: template=${report.template ? "yes" : "no"} shadow=${report.shadowBeforeScript ? "yes" : "no"} sameRoot=${root} warnings=${report.warnings} errors=${report.errors}`);
}
console.log(`vue-ssr, Vue ${version}: ${summary.length} elements, ${summary.filter((report) => report.warnings === 0 && report.errors === 0).length} with 0 warnings and 0 errors; click and checked state passed; client bundle has no mtrl/ssr or linkedom`);
console.log(`vue-ssr async, Vue ${version}: setup, outside read, web stream, and pipeToNodeWritable finished with content, the declarative template, the same shadow root, and 0 warnings`);
