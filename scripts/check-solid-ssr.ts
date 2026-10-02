#!/usr/bin/env bun
// scripts/check-solid-ssr.ts
// Built-package Solid SSR: every element's default case, parser consumption,
// hydration and browser isolation. Build first.
//
//   bun run build && bun run solid-ssr:check
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { transformAsync } from "@babel/core";
import { parseHTML } from "linkedom";
import { chromium, type Page } from "playwright";
import type { BunPlugin } from "bun";
import { declarations, elements } from "../src/elements";
import { cases } from "./fixtures/preupgrade-cases";
import { assertGlobalHost, GLOBAL_HOST_DOM, readGlobalHost } from "./fixtures/ssr-global-host";
import type { Shape } from "./fixtures/solid-ssr-async";
import { pascal } from "./element-modules";

const version = (await Bun.file("node_modules/solid-js/package.json").json() as { version: string }).version;
// Include the original browser error when hydration cannot reach its ready flag.
const waitForHydration = async (page: Page, warnings: string[], errors: string[]): Promise<void> => {
  assert.deepEqual({ warnings, errors }, { warnings: [], errors: [] });
  const failure = new Promise<never>((_, reject) => page.once("pageerror", reject));
  await Promise.race([
    page.waitForFunction(() => (window as unknown as { solidSSR?: { ready: boolean } }).solidSSR?.ready),
    failure,
  ]);
  assert.deepEqual({ warnings, errors }, { warnings: [], errors: [] });
};
const within = async <T>(work: Promise<T>, name: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${name}: SSR did not finish within 3 seconds`)), 3000);
    })]);
  } finally { clearTimeout(timer); }
};

const OPT_OUT = new Set(["carousel", "fab-menu"]);
// Component names as the adapters export them: textfield is TextField (FLO-383)
const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

interface SpecAttributes { attributes?: Record<string, { type?: string }> }
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
const expr = (value: string): string => `{${JSON.stringify(value)}}`;
const renderNode = (element: DomElement, extra: string[] = []): string => {
  const name = element.localName.slice(2);
  const spec = specs.get(name);
  assert(spec, `no Solid component for <${element.localName}>`);
  used.add(pascal(name));
  const attrs = [...extra];
  for (const attribute of element.attributes) {
    const known = !!spec.attributes && Object.prototype.hasOwnProperty.call(spec.attributes, attribute.name);
    const prop = known ? camel(attribute.name) : attribute.name;
    const type = known ? spec.attributes?.[attribute.name]?.type : undefined;
    if (type === "boolean") attrs.push(`${prop}={${attribute.value === "false" ? "false" : "true"}}`);
    else attrs.push(`${prop}=${expr(attribute.value)}`);
  }
  const inner = [...element.childNodes].map((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      return text.trim() ? `{${JSON.stringify(text)}}` : "";
    }
    return node.nodeType === 1 ? renderNode(node as DomElement) : "";
  }).join("");
  return `<${pascal(name)} ${attrs.join(" ")}>${inner}</${pascal(name)}>`;
};

const pieces: string[] = [];
for (const item of defaults) {
  const host = parseHTML(`<html><body>${item.html}</body></html>`).document.body.firstElementChild as DomElement | null;
  assert(host, item.element);
  const extra = [`id=${expr(`host-${item.element}`)}`];
  let markup = renderNode(host, extra);
  if (item.element === "button") {
    markup = `<form onSubmit={(event) => { event.preventDefault(); setClicks((count) => count + 1); }}>${markup.replace(`id=${expr(`host-${item.element}`)}`, `id=${expr(`host-${item.element}`)} type="submit"`)}</form>\n<output id="clicks">{clicks()}</output>`;
  }
  if (item.element === "switch") markup += `\n<output id="checked">{checked() ? "true" : "false"}</output>`;
  pieces.push(markup);
}
used.add("Button");
pieces.push(`<Button id="globals" label="Globals" popover="auto" inputMode="numeric" enterKeyHint="send" itemProp="name" nonce="abc" />`);
// The switch above is built before the checked binding is added. Add it on the host.
const switchHost = `id=${expr("host-switch")}`;
const app = `import { createSignal } from "solid-js";
import { ${[...used].sort().join(", ")} } from "mtrl/solid";

export const App = () => {
  const [clicks, setClicks] = createSignal(0);
  const [checked, setChecked] = createSignal(true);
  return <main>
${pieces.join("\n").replace(switchHost, `${switchHost} checked={checked()} onChange={(event) => setChecked(event.detail.checked)}`)}
  </main>;
};
`;

const dir = join(process.cwd(), "analysis/solid-ssr");
await mkdir(dir, { recursive: true });
await Bun.write(join(dir, "App.tsx"), app);
await Bun.write(join(dir, "server.tsx"), `import "mtrl/ssr/solid";
import { generateHydrationScript, renderToString, renderToStringAsync, renderToStream } from "solid-js/web";
import { AsyncApp, counts, type Shape } from "../../scripts/fixtures/solid-ssr-async";
import { App } from "./App";
export const renderBody = (): string => renderToString(() => <App />);
export const hydrationScript = (): string => generateHydrationScript();
export const renderScenario = async (shape: Shape, mode: "async" | "stream") => {
  counts.fetches = counts.children = 0;
  const app = () => <AsyncApp shape={shape} />;
  const html = mode === "async"
    ? await renderToStringAsync(app, { timeoutMs: 2500 })
    : await new Promise<string>((resolve, reject) => {
      let output = "";
      renderToStream(app, { onError: reject }).pipe({
        write(chunk: string) { output += chunk; },
        end() { resolve(output); },
      });
    });
  return { html, ...counts };
};
`);
await Bun.write(join(dir, "client.tsx"), `import { hydrate } from "solid-js/web";
import { App } from "./App";
const ids = [...document.querySelectorAll("[id^='host-']")].map((node) => node.id);
const before = new Map(ids.map((id) => [id, document.getElementById(id)?.shadowRoot ?? null]));
const state: { ready: boolean; same: Record<string, boolean | null> } = { ready: false, same: {} };
Object.assign(window, { solidSSR: state });
hydrate(() => <App />, document.getElementById("root") as HTMLElement);
for (const id of ids) {
  const previous = before.get(id) ?? null;
  state.same[id] = previous ? document.getElementById(id)?.shadowRoot === previous : null;
}
state.ready = true;
`);
await Bun.write(join(dir, "Context.tsx"), `import { createContext, useContext } from "solid-js";
import { Tab, Tabs } from "mtrl/solid";
const DefaultContext = createContext("DEFAULT");
const RequiredContext = createContext<string | undefined>(undefined);
const ReadDefault = () => <span id="context-label">{useContext(DefaultContext)}</span>;
const ReadRequired = () => {
  const value = useContext(RequiredContext);
  if (value === undefined) throw new Error("Required context is missing");
  return <span id="context-label">{value}</span>;
};
export const DefaultContextApp = () =>
  <DefaultContext.Provider value="from provider">
    <Tabs id="context-tabs" value="a"><Tab value="a"><ReadDefault /></Tab></Tabs>
  </DefaultContext.Provider>;
export const RequiredContextApp = () =>
  <RequiredContext.Provider value="required provider">
    <Tabs id="context-tabs" value="a"><Tab value="a"><ReadRequired /></Tab></Tabs>
  </RequiredContext.Provider>;
`);
await Bun.write(join(dir, "context-server.tsx"), `import "mtrl/ssr/solid";
import { renderToString } from "solid-js/web";
import { DefaultContextApp, RequiredContextApp } from "./Context";
export const renderContext = (required: boolean): string =>
  renderToString(() => required ? <RequiredContextApp /> : <DefaultContextApp />);
`);
await Bun.write(join(dir, "context-client.tsx"), `import { hydrate } from "solid-js/web";
import { DefaultContextApp, RequiredContextApp } from "./Context";
const required = new URLSearchParams(location.search).get("required") === "true";
const host = document.getElementById("context-tabs");
const before = host?.shadowRoot ?? null;
hydrate(() => required ? <RequiredContextApp /> : <DefaultContextApp />, document.getElementById("root") as HTMLElement);
Object.assign(window, { solidContextSSR: { ready: true, sameRoot: before === document.getElementById("context-tabs")?.shadowRoot } });
`);

await Bun.write(join(dir, "async-client.tsx"), `import { hydrate } from "solid-js/web";
import { AsyncApp, type Shape } from "../../scripts/fixtures/solid-ssr-async";
const shape = new URLSearchParams(location.search).get("shape") as Shape;
const host = document.getElementById("async-host");
const before = host?.shadowRoot;
const state = { ready: false, same: false, before: !!before, lightBefore: host?.textContent, labelBefore: host?.getAttribute("label") };
Object.assign(window, { solidSSR: state });
hydrate(() => <AsyncApp shape={shape} />, document.getElementById("root") as HTMLElement);
state.same = !!before && document.getElementById("async-host")?.shadowRoot === before;
state.ready = true;
`);

// The fixtures compile with the lockfile's babel-preset-solid (1.9.15 when written),
// also under `solid-ssr:floor`, which lowers solid-js alone to the peer floor (1.8.0).
// So a fixture must not use a construct the preset compiles to an import the floor
// runtime lacks: a conditional `value` on a context provider compiles to `memo` from
// solid-js/web, which 1.8.0's server build does not export (#431, f9524000); use
// literal values.
const solid = (generate: "dom" | "ssr"): BunPlugin => ({
  name: "solid",
  setup(build) {
    build.onLoad({ filter: /(?:solid-ssr\/.+|fixtures\/solid-ssr-async)\.tsx$/ }, async ({ path }) => {
      const result = await transformAsync(await Bun.file(path).text(), {
        filename: path,
        presets: [["babel-preset-solid", { generate, hydratable: true }], "@babel/preset-typescript"],
      });
      return { contents: result?.code ?? "", loader: "js" };
    });
  },
});

const bundle = async (entry: string, target: "browser" | "bun"): Promise<string> => {
  const loaded: string[] = [];
  const result = await Bun.build({
    entrypoints: [entry],
    target,
    conditions: ["development"],
    plugins: [solid(target === "bun" ? "ssr" : "dom"), {
      name: "ssr-isolation", setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => { loaded.push(args.path); return undefined; });
      },
    }],
    define: { "process.env.NODE_ENV": '"development"' },
  });
  assert(result.success, result.logs.map(String).join("\n"));
  if (target === "browser") {
    assert(!loaded.some((path) => /\/(?:ssr|linkedom)\//.test(path)), `Client loaded server code:\n${loaded.filter((path) => /ssr|linkedom/.test(path)).join("\n")}`);
  }
  const code = await result.outputs[0].text();
  if (target === "browser") assert.doesNotMatch(code, /linkedom|from"mtrl\/ssr"|from 'mtrl\/ssr'/);
  return code;
};

const serverBundle = await bundle(join(dir, "server.tsx"), "bun");
// A `.js` import beside `server.tsx` resolves to the TypeScript source. The bundle needs its own name.
const serverPath = join(process.cwd(), ".check-solid-ssr.js");
await Bun.write(serverPath, serverBundle);
let html: string;
let head: string;
let renderScenario: (shape: Shape, mode: "async" | "stream") => Promise<{ html: string; fetches: number; children: number }>;
try {
  const loaded = await import(serverPath);
  renderScenario = loaded.renderScenario;
  html = (loaded as { renderBody: () => string }).renderBody();
  head = (loaded as { hydrationScript: () => string }).hydrationScript();
  assertGlobalHost(html);
} finally {
  await Bun.file(serverPath).delete();
}
const client = await bundle(join(dir, "client.tsx"), "browser");
const asyncClient = await bundle(join(dir, "async-client.tsx"), "browser");
let scenarioHTML = "";

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
    const path = new URL(request.url).pathname;
    if (path === "/async-client.js") return new Response(asyncClient, { headers: { "Content-Type": "text/javascript" } });
    if (path === "/scenario") return new Response(`<!doctype html><html><head>${head}</head><body><div id="root">${scenarioHTML}</div><script type="module" src="/async-client.js"></script></body></html>`, { headers: { "Content-Type": "text/html" } });
    if (path === "/client.js") return new Response(client, { headers: { "Content-Type": "text/javascript" } });
    if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
    return new Response(`<!doctype html><html><head><link rel="stylesheet" href="/styles.css">${head}</head><body><div id="root">${html}</div><script type="module" src="/client.js"></script></body></html>`, { headers: { "Content-Type": "text/html" } });
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
  await waitForHydration(page, pageWarnings, pageErrors);
  const same = await page.evaluate(() => (window as unknown as { solidSSR: { same: Record<string, boolean | null> } }).solidSSR.same);
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

  const asyncReports: object[] = [];
  const failures: Error[] = [];
  for (const mode of ["async", "stream"] as const) {
    for (const shape of ["A", "C", "B", "D", "F"] as const) {
      const name = `${mode} ${shape}`;
      let scenarioPage: Page | undefined;
      try {
        const result = await within(renderScenario(shape, mode), name);
        scenarioHTML = result.html;
        assert.equal(result.fetches, 1, `${name}: fetcher runs once`);
        assert.match(scenarioHTML, /<template shadowrootmode="open"/, `${name}: declarative template missing`);
        assert.match(scenarioHTML, /loaded/, `${name}: resolved resource missing`);
        if (mode === "stream" && shape !== "F") assert.match(scenarioHTML, /pending/, `${name}: streamed the pending shell`);
        // F has no boundary to re-render its unresolved light DOM; Solid still
        // serializes the resource for hydration. The other shapes re-render once.
        assert.equal(result.children, shape === "D" ? 0 : shape === "F" ? 1 : 2, `${name}: no duplicate child render`);
        scenarioPage = await browser.newPage();
        const warnings: string[] = [];
        const errors: string[] = [];
        scenarioPage.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") warnings.push(message.text()); });
        scenarioPage.on("pageerror", (error) => errors.push(error.message));
        await scenarioPage.goto(`${server.url.href}scenario?shape=${shape}`);
        await waitForHydration(scenarioPage, warnings, errors);
        const state = await scenarioPage.evaluate(() => {
          const host = document.getElementById("async-host");
          return {
            ...(window as unknown as { solidSSR: { before: boolean; same: boolean; lightBefore: string | null; labelBefore: string | null } }).solidSSR,
            light: host?.textContent,
            label: host?.getAttribute("label"),
            templates: host?.querySelectorAll("template[shadowrootmode]").length,
          };
        });
        assert.equal(state.before, true, `${name}: shadow root before hydration`);
        assert.equal(state.same, true, `${name}: same shadow root after hydration`);
        assert.equal(state.templates, 0, `${name}: all declarative templates consumed`);
        if (shape === "D") {
          assert.equal(state.labelBefore, "loaded", `${name}: resolved label before hydration`);
          assert.equal(state.label, "loaded", `${name}: resolved label`);
        } else {
          const expected = shape === "F" ? "provided " : "provided loaded";
          assert.equal(state.lightBefore, expected, `${name}: light DOM and provider context before hydration`);
          assert.equal(state.light, expected, `${name}: light DOM and provider context after hydration`);
        }
        assert.deepEqual({ warnings, errors }, { warnings: [], errors: [] });
        asyncReports.push({ mode, shape, fetches: result.fetches, children: result.children, ...state, warnings, errors });
        console.log(`Solid ${version} ${name}: completed; template, loaded content, same root, 0 warnings and 0 errors`);
      } catch (cause) {
        const error = new Error(`${name}: ${String(cause)}`, { cause });
        failures.push(error);
        console.error(error.message);
      } finally { await scenarioPage?.close(); }
    }
  }
  await Bun.write(join(dir, `async-${version}.json`), JSON.stringify(asyncReports, null, 2));
  assert.equal(failures.length, 0, failures.map((error) => error.message).join("\n"));
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
console.log(`solid-ssr: ${summary.length} elements, ${summary.filter((report) => report.warnings === 0 && report.errors === 0).length} with 0 warnings and 0 errors; click and checked state passed; client bundle has no mtrl/ssr or linkedom`);

// Keep the bundle distinct from context-server.tsx so Bun imports the compiled module.
const contextPath = join(dir, "context-server.bundle.js");
await Bun.write(contextPath, await bundle(join(dir, "context-server.tsx"), "bun"));
const { renderContext } = await import(contextPath) as { renderContext: (required: boolean) => string };
const contextClient = await bundle(join(dir, "context-client.tsx"), "browser");
const contextHTML = { default: renderContext(false), required: renderContext(true) };
for (const [name, markup] of Object.entries(contextHTML)) {
  const returned = typeof markup === "string" ? markup.slice(0, 700) : String(markup);
  assert.ok(typeof markup === "string" && /id="context-tabs"/.test(markup),
    `Solid ${name} context: server render has no host; returned: ${returned}`);
}
const contextServer = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
  if (new URL(request.url).pathname === "/client.js") return new Response(contextClient, { headers: { "Content-Type": "text/javascript" } });
  const required = new URL(request.url).searchParams.get("required") === "true";
  return new Response(`<!doctype html><html><head>${head}</head><body><div id="root">${required ? contextHTML.required : contextHTML.default}</div><script type="module" src="/client.js"></script></body></html>`, { headers: { "Content-Type": "text/html" } });
} });
const contextBrowser = await chromium.launch();
try {
  for (const required of [false, true]) {
    const label = required ? "required" : "default-valued";
    const expected = required ? "required provider" : "from provider";
    const url = `${contextServer.url.href}?required=${required}`;
    const inert = await contextBrowser.newPage({ javaScriptEnabled: false });
    try {
      const response = await inert.goto(url);
      try {
        await inert.waitForFunction(() => !!document.getElementById("context-tabs")?.shadowRoot, undefined, { timeout: 5000, polling: 50 });
      } catch (cause) {
        throw new Error(`Solid ${label} context: host and declarative root did not appear within 5 seconds; response=${response?.status()} url=${inert.url()} body=${(await inert.locator("body").innerHTML()).slice(0, 700)} serverHTML=${contextHTML[required ? "required" : "default"].slice(0, 700)}`, { cause });
      }
      const state = await inert.evaluate(() => {
        const host = document.getElementById("context-tabs");
        return { host: !!host, template: !!host?.querySelector("template[shadowrootmode]"), root: !!host?.shadowRoot,
          shadow: host?.shadowRoot?.textContent ?? null, light: host?.querySelector("#context-label")?.textContent ?? null };
      });
      assert.equal(state.root, true, `Solid ${label} context: declarative shadow ${JSON.stringify(state)}`);
      assert.equal(state.light, expected, `Solid ${label} context: light DOM`);
      assert.equal(state.shadow?.includes(expected), true, `Solid ${label} context: shadow text`);
      assert.equal(state.shadow?.includes("DEFAULT"), false, `Solid ${label} context: no default in shadow`);
      console.log(`Solid ${label} context: shadow=${expected}, light=${state.light}, throw=no`);
    } finally { await inert.close(); }
    const page = await contextBrowser.newPage();
    try {
      const warnings: string[] = [], errors: string[] = [];
      page.on("console", (message) => { if (["warning", "error"].includes(message.type())) warnings.push(message.text()); });
      page.on("pageerror", (error) => errors.push(error.message));
      const failure = new Promise<never>((_, reject) => page.once("pageerror", reject));
      await page.goto(url);
      await Promise.race([
        page.waitForFunction(() => (window as unknown as { solidContextSSR?: { ready: boolean } }).solidContextSSR?.ready),
        failure,
      ]);
      assert.deepEqual({ warnings, errors }, { warnings: [], errors: [] }, `Solid ${label} context hydration`);
      assert.equal(await page.evaluate(() => (window as unknown as { solidContextSSR: { sameRoot: boolean } }).solidContextSSR.sameRoot), true,
        `Solid ${label} context: hydration kept root`);
    } finally { await page.close(); }
  }
} finally { contextServer.stop(true); await contextBrowser.close(); }
