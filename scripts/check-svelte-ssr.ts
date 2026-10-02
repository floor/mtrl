#!/usr/bin/env bun
// scripts/check-svelte-ssr.ts
// Built-package Svelte SSR: every element's default case, parser consumption,
// hydration and browser isolation. Build first.
//
//   bun run build && bun run svelte-ssr:check
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { chromium } from "playwright";
import { compile, type Warning } from "svelte/compiler";
import type { BunPlugin } from "bun";
import { declarations, elements } from "../src/elements";
import { cases } from "./fixtures/preupgrade-cases";
import { pascal } from "./element-modules";
import { assertGlobalHost, GLOBAL_HOST_DOM, readGlobalHost } from "./fixtures/ssr-global-host";

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
  assert(spec, `no Svelte component for <${element.localName}>`);
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
    markup = `<form onsubmit={(event) => { event.preventDefault(); clicks += 1 }}>${markup.replace(`id=${expr(`host-${item.element}`)}`, `id=${expr(`host-${item.element}`)} type="submit"`)}</form>\n<output id="clicks">{clicks}</output>`;
  }
  if (item.element === "switch") markup += `\n<output id="checked">{checked}</output>`;
  pieces.push(markup);
}
// Named snippets (FLO-412). The component renders each one as a light child of the
// host, inside `<span style="display: contents" slot="…">`, on the server and in
// the browser alike; the declarative root's named slot then shows it before any
// script runs. The default cases above pass default children only.
const SNIPPETS = [
  {
    host: "snippet-card",
    markup: `<Card id="snippet-card">{#snippet headline()}<b id="snippet-headline">Headline</b>{/snippet}{#snippet actions()}<Button id="snippet-action" label="Go"></Button>{/snippet}<p>Body</p></Card>`,
    slots: { headline: "snippet-headline", actions: "snippet-action" },
  },
  {
    host: "snippet-bar",
    markup: `<TopAppBar id="snippet-bar" headline="Title">{#snippet leading()}<i id="snippet-leading">L</i>{/snippet}{#snippet trailing()}<i id="snippet-trailing">T</i>{/snippet}</TopAppBar>`,
    slots: { leading: "snippet-leading", trailing: "snippet-trailing" },
  },
];
const SLOTTED = SNIPPETS.flatMap((item) => Object.entries(item.slots).map(([slot, id]) => ({ host: item.host, slot, id })));
for (const name of ["Card", "TopAppBar", "Button"]) used.add(name);
for (const item of SNIPPETS) pieces.push(item.markup);
pieces.push(`<Button id="globals" label="Globals" popover="auto" inputmode="numeric" enterkeyhint="send" itemprop="name" nonce="abc"></Button>`);
// The switch above is built before the checked binding is added. Add it on the host.
const switchHost = `id=${expr("host-switch")}`;
const app = `<script lang="ts">
  import { ${[...used].sort().join(", ")} } from "mtrl/svelte";
  let clicks = $state(0);
  let checked = $state(true);
</script>
${pieces.join("\n").replace(switchHost, `${switchHost} checked={checked} onchange={(event) => { checked = event.detail.checked }}`)}
`;

const dir = join(process.cwd(), "analysis/svelte-ssr");
await mkdir(dir, { recursive: true });
await Bun.write(join(dir, "App.svelte"), app);
await Bun.write(join(dir, "server.ts"), `import "mtrl/ssr/svelte";
import { render } from "svelte/server";
import App from "./App.svelte";
export const renderBody = (): string => render(App).body;
`);
await Bun.write(join(dir, "client.ts"), `import { hydrate } from "svelte";
import App from "./App.svelte";
const ids = [...document.querySelectorAll("[id^='host-']")].map((node) => node.id);
const before = new Map(ids.map((id) => [id, document.getElementById(id)?.shadowRoot ?? null]));
// Snippet content the server sent: hydration must adopt these nodes, not replace them.
const sent = new Map(${JSON.stringify(SLOTTED.map((item) => item.id))}.map((id: string) => [id, document.getElementById(id)]));
const state: { ready: boolean; same: Record<string, boolean | null>; adopted: Record<string, boolean> } = { ready: false, same: {}, adopted: {} };
Object.assign(window, { svelteSSR: state });
hydrate(App, { target: document.getElementById("root") as HTMLElement });
for (const id of ids) {
  const previous = before.get(id) ?? null;
  state.same[id] = previous ? document.getElementById(id)?.shadowRoot === previous : null;
}
for (const [id, node] of sent) state.adopted[id] = !!node && document.getElementById(id) === node;
state.ready = true;
`);

const warnings: string[] = [];
const plugin = (generate: "client" | "server"): BunPlugin => ({
  name: "svelte",
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
      const compiled = compile(await Bun.file(path).text(), { filename: path, generate, dev: true });
      for (const warning of compiled.warnings as Warning[]) {
        warnings.push(`${generate} ${warning.filename}:${warning.start?.line ?? 0} [${warning.code}] ${warning.message.split("\n")[0]}`);
      }
      return { contents: compiled.js.code, loader: "js" };
    });
  },
});

const bundle = async (entry: string, target: "browser" | "bun", environment: "development" | "production" = "development"): Promise<string> => {
  const loaded: string[] = [];
  const result = await Bun.build({
    entrypoints: [entry], target, conditions: ["development"],
    plugins: [plugin(target === "bun" ? "server" : "client"), {
      name: "ssr-isolation", setup(build) {
        build.onLoad({ filter: /.*/ }, (args) => { loaded.push(args.path); return undefined; });
      },
    }],
    define: { "process.env.NODE_ENV": JSON.stringify(environment) },
  });
  assert(result.success, result.logs.map(String).join("\n"));
  if (target === "browser") {
    assert(!loaded.some((path) => /\/(?:ssr|linkedom)\//.test(path)), `Client loaded server code:\n${loaded.filter((path) => /ssr|linkedom/.test(path)).join("\n")}`);
  }
  const code = await result.outputs[0].text();
  if (target === "browser") assert.doesNotMatch(code, /linkedom|from"mtrl\/ssr"|from 'mtrl\/ssr'/);
  return code;
};

for (const element of Object.values(elements)) {
  const source = await Bun.file(`dist/svelte/${pascal(element.spec.name)}.svelte`).text();
  assert(source.includes("{#if shadow}{@html shadow}{/if}"), `${element.spec.name} was generated without the shadow branch; rebuild`);
}
for (const declaration of Object.values(declarations)) {
  const source = await Bun.file(`dist/svelte/${pascal(declaration.name)}.svelte`).text();
  assert(!source.includes("shadowMarkup"), `${declaration.name} is a declaration and must not emit a shadow template`);
}

const serverBundle = await bundle(join(dir, "server.ts"), "bun");
// A `.js` import beside `server.ts` resolves to the TypeScript source. The bundle needs its own name.
const serverPath = join(process.cwd(), ".check-svelte-ssr.js");
await Bun.write(serverPath, serverBundle);
let html: string;
try {
  const loaded = await import(serverPath);
  html = (loaded as { renderBody: () => string }).renderBody();
} finally {
  await Bun.file(serverPath).delete();
}
assertGlobalHost(html);
const client = await bundle(join(dir, "client.ts"), "browser");
assert.equal(warnings.length, 0, warnings.join("\n"));

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

for (const { host, slot, id } of SLOTTED) {
  const element = parsed.getElementById(host) as DomElement | null;
  assert(element, `missing ${host} in server HTML`);
  assert([...element.children].some((child) => child.localName === "template" && child.hasAttribute("shadowrootmode")), `${host} template`);
  const wrapper = [...element.children].find((child) => child.getAttribute("slot") === slot);
  assert(wrapper, `${host}: no light child with slot="${slot}" in server HTML`);
  assert.equal(wrapper.localName, "span", `${host} ${slot} wrapper`);
  assert.equal(wrapper.getAttribute("style"), "display: contents", `${host} ${slot} wrapper style`);
  assert(wrapper.querySelector(`#${id}`), `${host}: the ${slot} snippet is not inside its wrapper in server HTML`);
}
// Where each snippet's content sits in the browser, and which slot shows it.
const slotted = (items: typeof SLOTTED) => items.map(({ id }) => {
  const wrapper = document.getElementById(id)?.parentElement;
  return {
    id,
    wrapper: wrapper?.localName ?? null,
    slot: wrapper?.getAttribute("slot") ?? null,
    display: wrapper ? getComputedStyle(wrapper).display : null,
    host: wrapper?.parentElement?.id ?? null,
    assigned: wrapper?.assignedSlot?.name ?? null,
    inRoot: !!wrapper?.assignedSlot && wrapper.assignedSlot.getRootNode() === wrapper.parentElement?.shadowRoot,
  };
});
const expectedSlotted = SLOTTED.map(({ host, slot, id }) => ({ id, wrapper: "span", slot, display: "contents", host, assigned: slot, inRoot: true }));

const browser = await chromium.launch();
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  fetch(request) {
    if (new URL(request.url).pathname === "/client.js") return new Response(client, { headers: { "Content-Type": "text/javascript" } });
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
  assert.deepEqual(await inert.evaluate(slotted, SLOTTED), expectedSlotted, "named snippets are slotted before script");
  assert.deepEqual(await inert.evaluate(readGlobalHost), GLOBAL_HOST_DOM);
  await inert.close();

  const page = await browser.newPage();
  const pageWarnings: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "warning" || message.type() === "error") pageWarnings.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(server.url.href);
  await page.waitForFunction(() => (window as unknown as { svelteSSR?: { ready: boolean } }).svelteSSR?.ready);
  const same = await page.evaluate(() => (window as unknown as { svelteSSR: { same: Record<string, boolean | null> } }).svelteSSR.same);
  for (const [element, report] of reports) {
    report.sameRoot = same[`host-${element}`] ?? null;
    report.warnings = pageWarnings.length;
    report.errors = pageErrors.length;
    if (!OPT_OUT.has(element)) assert.equal(report.sameRoot, true, `${element} did not keep its declarative shadow root`);
    else assert.equal(report.sameRoot, null, `${element} had a declarative root`);
  }
  assert.deepEqual(await page.evaluate(slotted, SLOTTED), expectedSlotted, "named snippets are slotted after hydration");
  assert.deepEqual(
    await page.evaluate(() => (window as unknown as { svelteSSR: { adopted: Record<string, boolean> } }).svelteSSR.adopted),
    Object.fromEntries(SLOTTED.map(({ id }) => [id, true])),
    "hydration adopts the server's snippet nodes",
  );
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
console.log(`named snippets: ${SLOTTED.map(({ host, slot }) => `${host.slice("snippet-".length)}/${slot}`).join(", ")}: slotted before script and after hydration, nodes adopted`);
console.log(`svelte-ssr: ${summary.length} elements, ${summary.filter((report) => report.warnings === 0 && report.errors === 0).length} with 0 warnings and 0 errors; click and checked state passed; client bundle has no mtrl/ssr or linkedom`);

const expectContextKnownLimit = (label: string, known: boolean, fixed: boolean, observed: string): void => {
  assert.equal(fixed, false, `${label}: provider context reached the shadow; remove the expected-failure marker (FLO-517)`);
  assert.equal(known, true, `${label}: expected ${observed}; the shadow has an unexpected outcome`);
  console.log(`known limit, FLO-517 (expected to fail until the page-level integration): ${label}: ${observed}`);
};

const contextClient = await bundle("scripts/fixtures/svelte-ssr-context-client.ts", "browser");
for (const environment of ["development", "production"] as const) {
  const label = `Svelte ${environment} context`;
  const contextPath = join(dir, `context-server-${environment}.js`);
  await Bun.write(contextPath, await bundle("scripts/fixtures/svelte-ssr-context-server.ts", "bun", environment));
  const { renderContext } = await import(contextPath) as { renderContext: (mode: "default" | "required" | "error") => string };
  const renderWithWarnings = (mode: "default" | "required" | "error") => {
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (...args) => { warnings.push(args.map(String).join(" ")); };
    try { return { html: renderContext(mode), warnings }; }
    finally { console.warn = original; }
  };
  const provided = renderWithWarnings("default");
  const required = renderWithWarnings("required");
  assert.deepEqual(provided.warnings, [], `${label} default warnings`);
  assert.equal(required.warnings.length, environment === "development" ? 1 : 0, `${label} required warnings`);
  if (environment === "development") assert.match(required.warnings[0] ?? "", /<m-tabs id="context-tabs">.*no shadow root.*Required context is missing/i, `${label} warning names the element and error`);
  assert.throws(() => renderWithWarnings("error"), /Real child error/, `${label}: a real child error must surface`);

  const contextServer = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
    if (new URL(request.url).pathname === "/client.js") return new Response(contextClient, { headers: { "Content-Type": "text/javascript" } });
    const mode = new URL(request.url).searchParams.get("mode") === "required" ? "required" : "default";
    return new Response(`<!doctype html><div id="root">${mode === "required" ? required.html : provided.html}</div><script type="module" src="/client.js"></script>`, { headers: { "Content-Type": "text/html" } });
  } });
  try {
    const inert = await chromium.launch();
    try {
      for (const mode of ["default", "required"] as const) {
        const page = await inert.newPage({ javaScriptEnabled: false });
        try {
          const response = await page.goto(`${contextServer.url.href}?mode=${mode}`);
          const expected = mode === "required" ? "required provider" : "from provider";
          try {
            await page.waitForFunction((text) => document.getElementById("context-tabs")?.querySelector("#context-label")?.textContent === text,
              expected, { timeout: 5000, polling: 50 });
          } catch (cause) {
            throw new Error(`${label} ${mode}: host and provider content did not appear within 5 seconds; response=${response?.status()} url=${page.url()} body=${(await page.locator("body").innerHTML()).slice(0, 700)} serverHTML=${(mode === "required" ? required.html : provided.html).slice(0, 700)}`, { cause });
          }
          const state = await page.evaluate(() => {
            const host = document.getElementById("context-tabs");
            return { root: !!host?.shadowRoot, shadow: host?.shadowRoot?.textContent ?? null, light: host?.querySelector("#context-label")?.textContent ?? null };
          });
          assert.equal(state.light, expected, `${label} ${mode}: light DOM provider`);
          if (mode === "default") {
            expectContextKnownLimit(`${label} default-valued context`, state.root && state.shadow?.includes("DEFAULT") === true,
              state.shadow?.includes("from provider") === true, "shadow contains DEFAULT");
          } else {
            assert.equal(state.root, false, `${label} required context: no declarative shadow root`);
          }
        } finally { await page.close(); }
      }
      const page = await inert.newPage();
      try {
        const warnings: string[] = [], errors: string[] = [];
        page.on("console", (message) => { if (["warning", "error"].includes(message.type())) warnings.push(message.text()); });
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${contextServer.url.href}?mode=required`);
        await page.waitForFunction(() => (window as unknown as { svelteContextSSR?: { ready: boolean } }).svelteContextSSR?.ready);
        await page.waitForFunction(() => !!(document.getElementById("context-tabs") as HTMLElement & { component?: unknown }).component);
        const hydrated = await page.evaluate(() => (window as unknown as { svelteContextSSR: { hadDeclarativeRoot: boolean } }).svelteContextSSR);
        assert.deepEqual({ warnings, errors }, { warnings: [], errors: [] }, `${label} required hydration`);
        assert.equal(hydrated.hadDeclarativeRoot, false, `${label}: no declarative root before upgrade`);
        assert.equal(await page.evaluate(() => !!document.getElementById("context-tabs")?.shadowRoot), true,
          `${label}: element attached a shadow root after upgrade`);
        assert.equal(await page.evaluate(() => !!(document.getElementById("context-tabs") as HTMLElement & { component?: unknown }).component), true,
          `${label}: host upgraded`);
        assert.equal(await page.locator("#context-label").textContent(), "required provider", `${label}: light DOM after hydration`);
      } finally { await page.close(); }
    } finally { await inert.close(); }
  } finally { contextServer.stop(true); }
  console.log(`${label}: required child rendered without shadow, hydration clean, ${required.warnings.length} server warning(s); real child error surfaced`);
}
