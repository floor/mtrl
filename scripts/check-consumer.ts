#!/usr/bin/env bun
/** Build first. Check a packed production Vite app and compare CSS in Chromium. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";
import { build, preview, type Manifest } from "vite";
import { chromium, type Page } from "playwright";
import { createPackageFixture } from "./package-fixture";

const fixture = await createPackageFixture();
const { directory } = fixture;
const artifacts = resolve("analysis/browser");
await rm(artifacts, { recursive: true, force: true });
await mkdir(artifacts, { recursive: true });
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let server: Awaited<ReturnType<typeof preview>> | undefined;
const scenarios = [
  { name: "button", component: "button" },
  { name: "button-hover", component: "button", state: "hover" },
  { name: "button-focus", component: "button", state: "focus" },
  { name: "textfield", component: "textfield" },
  { name: "select", component: "select" },
  { name: "select-open", component: "select", state: "open" },
  { name: "select-error", component: "select", state: "error" },
  { name: "checkbox", component: "checkbox" },
  { name: "segmented-button", component: "segmented-button" },
  { name: "button-group", component: "button-group" },
  { name: "split-button", component: "split-button" },
  { name: "split-button-open", component: "split-button", state: "open" },
  { name: "tabs", component: "tabs" },
  { name: "card", component: "card" },
  { name: "dialog", component: "dialog" },
  { name: "snackbar", component: "snackbar" },
];
try {
  // Library mode retains exports for measurement; an HTML fixture below tests
  // actual application mode, CSS extraction, network loading, and rendering.
  const sizes: Record<string, { initialGzip: number; totalGzip: number }> = {};
  for (const [name, symbol, budget] of [
    ["addClass", "addClass", 1000], ["textfield", "createTextfield", 9000], ["button", "createButton", 10000],
  ] as const) {
    const entry = join(directory, `${name}.ts`);
    await writeFile(entry, `export { ${symbol} } from 'mtrl';`);
    const result = await build({
      root: directory, configFile: false, envFile: false, logLevel: "error",
      build: { write: false, minify: true, lib: { entry, formats: ["es"] } },
    });
    assert(!("on" in result), "Unexpected Vite watcher");
    const outputs = (Array.isArray(result) ? result : [result]).flatMap(output => output.output);
    const chunks = outputs.filter(output => output.type === "chunk");
    const initial = new Set<string>();
    function visit(filename: string) {
      if (initial.has(filename)) return;
      initial.add(filename);
      const chunk = chunks.find(chunk => chunk.fileName === filename);
      assert(chunk, `Missing Vite chunk: ${filename}`);
      chunk.imports.forEach(visit);
    }
    chunks.filter(chunk => chunk.isEntry).forEach(chunk => visit(chunk.fileName));
    sizes[name] = { initialGzip: 0, totalGzip: 0 };
    for (const chunk of chunks) {
      const size = gzipSync(chunk.code, { level: 9 }).length;
      sizes[name].totalGzip += size;
      if (initial.has(chunk.fileName)) sizes[name].initialGzip += size;
    }
    assert(sizes[name].initialGzip < budget, `${name} Vite initial gzip exceeds ${budget}: ${sizes[name].initialGzip}`);
    if (name === "button") assert(chunks.some(chunk => !initial.has(chunk.fileName)), "Vite did not split lazy progress");
  }
  console.log("Vite packed-consumer sizes:");
  console.table(sizes);

  await copyFile("test/browser/fixture.ts", join(directory, "fixture.ts"));
  await copyFile("test/browser/fixture.css", join(directory, "fixture.css"));
  const input: Record<string, string> = {};
  for (const scenario of scenarios) {
    for (const style of ["full", "selective"]) {
      const name = `${style}-${scenario.name}`;
      const css = style === "full" ? ["mtrl/styles"] : ["mtrl/styles/base", `mtrl/styles/${scenario.component}`, "mtrl/themes/ocean"];
      await writeFile(join(directory, `${name}.ts`), css.map(path => `import '${path}';`).join("\n") +
        '\nimport "./fixture.css";\nimport "./fixture.ts";');
      await writeFile(join(directory, `${name}.html`), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>mtrl CSS comparison</title></head><body data-case="${scenario.component}"><main></main><script type="module" src="./${name}.ts"></script></body></html>`);
      input[name] = join(directory, `${name}.html`);
    }
  }
  // This independent entry must not statically import progress through a gallery.
  await writeFile(join(directory, "lazy.ts"), `
    import button from 'mtrl/components/button';
    import 'mtrl/styles/base'; import 'mtrl/styles/button';
    const b = button({ text: 'Load progress', progress: { value: 40, indeterminate: false } });
    document.body.append(b.element);
    b.element.addEventListener('click', async () => { await b.showProgress(); document.body.dataset.loaded = 'true'; });
  `);
  await writeFile(join(directory, "lazy.html"), '<!doctype html><html><body><script type="module" src="./lazy.ts"></script></body></html>');
  input.lazy = join(directory, "lazy.html");
  // Exercise deduplication even when the app explicitly imports a dependency.
  await writeFile(join(directory, "dedup.ts"), "import 'mtrl/styles/base'; import 'mtrl/styles/segmented-button'; import 'mtrl/styles/button'; document.body.dataset.ready = 'true';");
  await writeFile(join(directory, "dedup.html"), '<!doctype html><html><body><script type="module" src="./dedup.ts"></script></body></html>');
  input.dedup = join(directory, "dedup.html");
  await writeFile(join(directory, "dedup-reference.ts"), "import 'mtrl/styles/base'; import 'mtrl/styles/segmented-button'; document.body.dataset.ready = 'true';");
  await writeFile(join(directory, "dedup-reference.html"), '<!doctype html><html><body><script type="module" src="./dedup-reference.ts"></script></body></html>');
  input["dedup-reference"] = join(directory, "dedup-reference.html");
  const outDir = join(directory, "site");
  await build({ root: directory, configFile: false, envFile: false, logLevel: "error",
    build: { outDir, target: "esnext", manifest: true, rolldownOptions: { input } },
  });
  const manifest: Manifest = JSON.parse(await readFile(join(outDir, ".vite/manifest.json"), "utf8"));
  await writeFile(join(artifacts, "vite-manifest.json"), JSON.stringify(manifest, null, 2));
  function assets(entry: string, kind: "static" | "dynamic") {
    const result = new Set<string>();
    const seen = new Set<string>();
    function visit(key: string) {
      if (seen.has(key)) return;
      seen.add(key);
      const chunk = manifest[key];
      assert(chunk, `Manifest entry missing: ${key}`);
      result.add(chunk.file);
      chunk.css?.forEach(file => result.add(file));
      chunk.imports?.forEach(visit);
      if (kind === "dynamic") chunk.dynamicImports?.forEach(visit);
    }
    visit(entry);
    return result;
  }
  const cssFiles = [...assets("dedup.html", "static")].filter(path => path.endsWith(".css")).sort();
  const referenceCSS = [...assets("dedup-reference.html", "static")].filter(path => path.endsWith(".css")).sort();
  assert(cssFiles.length, "Vite discarded CSS side-effect imports");
  assert.deepEqual(cssFiles, referenceCSS, "Importing button explicitly added duplicate CSS assets");
  const lazyInitial = assets("lazy.html", "static");
  const lazyDeferred = [...assets("lazy.html", "dynamic")].filter(path => path.endsWith(".js") && !lazyInitial.has(path));
  assert(lazyDeferred.length, "Production Vite app lost its lazy chunk");

  server = await preview({ root: directory, configFile: false, envFile: false, logLevel: "error",
    build: { outDir }, preview: { host: "127.0.0.1", port: 0, open: false },
  });
  const address = server.httpServer.address();
  assert(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1040, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
  const errors: string[] = [];
  context.on("page", page => {
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  });
  const lazyPage = await context.newPage();
  const requested = new Set<string>();
  lazyPage.on("request", request => requested.add(new URL(request.url()).pathname.slice(1)));
  await lazyPage.goto(`${origin}/lazy.html`);
  await lazyPage.getByRole("button", { name: "Load progress" }).waitFor();
  assert(!lazyDeferred.some(file => requested.has(file)), "Progress JS downloaded before use");
  await lazyPage.getByRole("button", { name: "Load progress" }).click();
  await lazyPage.locator('body[data-loaded="true"] canvas').waitFor();
  assert(lazyDeferred.some(file => requested.has(file)), "Lazy progress was not requested on click");
  await lazyPage.close();

  async function snapshot(page: Page) {
    return page.evaluate(() => [...document.body.querySelectorAll("*")].filter(el => !["SCRIPT", "STYLE"].includes(el.tagName)).map(el => {
      const rect = el.getBoundingClientRect();
      const styles = (pseudo?: string) => {
        const css = getComputedStyle(el, pseudo);
        return Object.fromEntries([
          "display", "visibility", "position", "color", "background-color", "opacity", "font-family", "font-size", "font-weight",
          "outline-style", "outline-width", "outline-color", "outline-offset",
          "line-height", "border-radius", "border-width", "border-color", "padding", "margin", "box-shadow", "transform",
        ].map(key => [key, css.getPropertyValue(key)]));
      };
      return { tag: el.tagName, focused: el === document.activeElement, focusVisible: el.matches(":focus-visible"), rect: [rect.x, rect.y, rect.width, rect.height].map(n => Math.round(n * 100) / 100),
        styles: styles(), before: styles("::before"), after: styles("::after") };
    }));
  }
  const failures: string[] = [];
  let comparisons = 0;
  for (const width of [1040, 390]) for (const theme of ["baseline", "ocean"]) for (const mode of ["light", "dark"]) {
    const pages = await Promise.all([context.newPage(), context.newPage()]);
    for (const page of pages) await page.setViewportSize({ width, height: 900 });
    for (const scenario of scenarios) {
      const label = `${scenario.name}-${theme}-${mode}-${width}`;
      await Promise.all(pages.map(async (page, i) => {
        const params = new URLSearchParams({ theme, mode, state: scenario.state ?? "" });
        await page.goto(`${origin}/${i === 0 ? "full" : "selective"}-${scenario.name}.html?${params}`);
        await page.locator('body[data-ready="true"]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (scenario.state === "hover") await page.getByRole("button").first().hover();
        if (scenario.state === "focus") await page.keyboard.press("Tab");
        await page.screenshot({ path: join(artifacts, `${label}-${i === 0 ? "full" : "selective"}.png`), fullPage: true, animations: "disabled" });
      }));
      const [full, selective] = await Promise.all(pages.map(snapshot));
      const fullPNG = await readFile(join(artifacts, `${label}-full.png`));
      const selectivePNG = await readFile(join(artifacts, `${label}-selective.png`));
      if (JSON.stringify(full) !== JSON.stringify(selective) || !fullPNG.equals(selectivePNG)) {
        failures.push(label);
        await writeFile(join(artifacts, `${label}.json`), JSON.stringify({ full, selective }, null, 2));
      }
      comparisons++;
    }
    await Promise.all(pages.map(page => page.close()));
    console.log(`Compared ${theme} ${mode}, ${width}px (${comparisons} pairs so far)`);
  }
  // Real pointer/keyboard states and form behavior using only selective styles.
  const page = await context.newPage();
  await page.goto(`${origin}/selective-select.html`);
  await page.locator('body[data-ready="true"]').waitFor();
  await page.locator(".mtrl-select").click();
  await page.getByText("Paris", { exact: true }).click();
  assert.equal(await page.locator("input").inputValue(), "Paris");
  await page.goto(`${origin}/selective-checkbox.html`);
  await page.locator('body[data-ready="true"]').waitFor();
  const unchecked = page.getByRole("checkbox").first();
  await unchecked.focus();
  await page.keyboard.press("Space");
  assert(await unchecked.isChecked(), "Keyboard checkbox interaction failed");
  await page.close();
  const report = { vite: sizes, browser: await browser.version(), comparisons, failures, errors };
  await writeFile(join(artifacts, "report.json"), JSON.stringify(report, null, 2));
  assert.deepEqual(errors, [], "Browser errors occurred");
  assert.deepEqual(failures, [], "Full/selective CSS mismatches (see analysis/browser)");
  console.log(`Passed ${comparisons} full/selective screenshot and computed-style comparisons, interactions, and lazy network checks.`);
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.httpServer.close(error => error ? reject(error) : resolve());
  });
  await fixture.cleanup();
}
