#!/usr/bin/env bun
/** Build first. Check a packed production Vite app and compare CSS in Chromium. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, copyFile, rm, symlink } from "node:fs/promises";
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
  { name: "button-group", component: "button-group" },
  { name: "split-button", component: "split-button" },
  { name: "split-button-open", component: "split-button", state: "open" },
  { name: "tabs", component: "tabs" },
  { name: "card", component: "card" },
  { name: "dialog", component: "dialog" },
  { name: "snackbar", component: "snackbar" },
];
try {
  // The types-only JSX entries resolve from the installed package, through its
  // exports (FLO-333): a .tsx per framework opts in and uses a bare tag.
  await mkdir(join(directory, "node_modules/@types"), { recursive: true });
  for (const name of ["react", "@types/react", "solid-js", "csstype"]) {
    await symlink(resolve("node_modules", name), join(directory, "node_modules", name), "dir").catch(() => {});
  }
  for (const [framework, flags] of [
    ["react", ["--jsx", "react-jsx"]],
    ["solid", ["--jsx", "preserve", "--jsxImportSource", "solid-js"]],
  ] as const) {
    const file = join(directory, `jsx-${framework}.tsx`);
    await writeFile(file, `import type {} from "mtrl/${framework}/jsx";\nexport const tag = <m-switch checked supporting-text="Help" />;\n`);
    const tsc = Bun.spawnSync([
      resolve("node_modules/.bin/tsc"), "--noEmit", "--strict", "--skipLibCheck", "--moduleResolution", "bundler",
      "--module", "esnext", "--target", "es2022", "--lib", "es2022,dom", ...flags, file,
    ], { cwd: directory, stdout: "pipe", stderr: "pipe" });
    assert.equal(tsc.exitCode, 0, `mtrl/${framework}/jsx from the packed package:\n${tsc.stdout}${tsc.stderr}`);
  }
  console.log("JSX entries: mtrl/react/jsx and mtrl/solid/jsx type a bare tag from the packed package");

  // The component subpaths are an explicit list since 1.0.0 (FLO-381): each one
  // resolves from the packed package, and the folders inside a component, which
  // the old `./components/*` pattern matched across slashes, do not.
  const componentSubpaths = Object.keys((await Bun.file("package.json").json()).exports)
    .filter(key => key.startsWith("./components/")).map(key => `mtrl${key.slice(1)}`);
  const nestedSubpaths = [
    "bottom-sheet/features", "carousel/features", "chips/chip", "chips/chip/constants", "chips/features",
    "drawer/features", "list/features", "menu/features", "progress/features", "search/features",
    "side-sheet/features", "slider/features", "textfield/features",
  ].map(path => `mtrl/components/${path}`);
  const probe = join(directory, "resolve-components.mjs");
  // import.meta.resolve maps a specifier through exports without opening the
  // file, so the probe also checks that the module and its declarations exist.
  await writeFile(probe, `import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const out = {};
for (const specifier of ${JSON.stringify([...componentSubpaths, ...nestedSubpaths])}) {
  try {
    const file = fileURLToPath(import.meta.resolve(specifier));
    out[specifier] = !existsSync(file) ? "missing " + file
      : !existsSync(file.replace(/\\.js$/, ".d.ts")) ? "missing declarations" : "ok";
  } catch (error) { out[specifier] = error.code; }
}
console.log(JSON.stringify(out));
`);
  const resolved: Record<string, string> = JSON.parse(Bun.spawnSync(["node", probe], { cwd: directory }).stdout.toString());
  assert.deepEqual(componentSubpaths.filter(specifier => resolved[specifier] !== "ok"), [],
    "allowlisted component subpaths that do not resolve to a file (and its .d.ts) in the packed package");
  assert.deepEqual(nestedSubpaths.filter(specifier => resolved[specifier] !== "ERR_PACKAGE_PATH_NOT_EXPORTED"), [],
    "folders inside a component that still resolve (or fail for another reason)");
  console.log(`Component subpaths: ${componentSubpaths.length} resolve to files in the packed package, ${nestedSubpaths.length} nested ones do not`);

  // Library mode retains exports for measurement; an HTML fixture below tests
  // actual application mode, CSS extraction, network loading, and rendering.
  const sizes: Record<string, { initialGzip: number; totalGzip: number }> = {};
  // textfield 9,600 to 9,700 with no headroom left: next c7858870 measures 9,604 locally
  // (FLO-416's multiline SSR fix), the forward merge 9,603; CI read just under 9,600.
  // textfield 9,000 to 9,600 for FLO-301 (the asterisk, the live error, the trailing button):
  // 8,953 to 9,520 against 7cd57a6.
  // addClass from its subpath since 1.0.0 removed it from the root (FLO-351)
  // addClass 603 and button 8,447 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9.
  // addClass 603; 100 B floor, 750 against b9dab36e, Node 22.23.3 / npm 10.9.9.
  for (const [name, symbol, budget, from] of [
    ["addClass", "addClass", 750, "mtrl/core/dom"], ["textfield", "createTextField", 9700, "mtrl"], ["button", "createButton", 8550, "mtrl"],
  ] as const) {
    const entry = join(directory, `${name}.ts`);
    await writeFile(entry, `export { ${symbol} } from '${from}';`);
    const result = await build({
      root: directory, configFile: false, envFile: false, logLevel: "error",
      build: { write: false, minify: true, lib: { entry, formats: ["es"] } },
    });
    assert(!("on" in result), "Unexpected Vite watcher");
    const outputs = (Array.isArray(result) ? result : [result]).flatMap(output => output.output);
    const chunks = outputs.filter(output => output.type === "chunk");
    const initial = new Set<string>();
    const visit = function visit(filename: string) {
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
  // The menu's submenu feature is a lazy chunk too (FLO-310). `?nested` gives
  // the menu nested items at creation; without it the items are flat, and
  // window.nest() gives it nested ones through setItems.
  await writeFile(join(directory, "menu.ts"), `
    import { createMenu } from 'mtrl';
    import 'mtrl/styles/base'; import 'mtrl/styles/menu';
    const opener = document.createElement('button');
    opener.textContent = 'Actions';
    document.body.append(opener);
    const flat = [{ id: 'copy', text: 'Copy' }, { id: 'paste', text: 'Paste' }];
    const nested = [{ id: 'share', text: 'Share', hasSubmenu: true, submenu: [{ id: 'link', text: 'Copy link' }] }, ...flat];
    const menu = createMenu({ opener, items: location.search === '?nested' ? nested : flat });
    Object.assign(window, { nest: () => menu.setItems(nested) });
    menu.open();
    document.body.dataset.ready = 'true';
  `);
  await writeFile(join(directory, "menu.html"), '<!doctype html><html><body><script type="module" src="./menu.ts"></script></body></html>');
  input.menu = join(directory, "menu.html");
  // Exercise deduplication even when the app explicitly imports a dependency.
  await writeFile(join(directory, "dedup.ts"), "import 'mtrl/styles/base'; import 'mtrl/styles/button-group'; import 'mtrl/styles/button'; document.body.dataset.ready = 'true';");
  await writeFile(join(directory, "dedup.html"), '<!doctype html><html><body><script type="module" src="./dedup.ts"></script></body></html>');
  input.dedup = join(directory, "dedup.html");
  await writeFile(join(directory, "dedup-reference.ts"), "import 'mtrl/styles/base'; import 'mtrl/styles/button-group'; document.body.dataset.ready = 'true';");
  await writeFile(join(directory, "dedup-reference.html"), '<!doctype html><html><body><script type="module" src="./dedup-reference.ts"></script></body></html>');
  input["dedup-reference"] = join(directory, "dedup-reference.html");
  const outDir = join(directory, "site");
  await build({ root: directory, configFile: false, envFile: false, logLevel: "error",
    build: { outDir, target: "esnext", manifest: true, rolldownOptions: { input } },
  });
  const manifest: Manifest = JSON.parse(await readFile(join(outDir, ".vite/manifest.json"), "utf8"));
  await writeFile(join(artifacts, "vite-manifest.json"), JSON.stringify(manifest, null, 2));
  const assets = function assets(entry: string, kind: "static" | "dynamic") {
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
  const submenuChunk = Object.entries(manifest).find(([key]) => key.endsWith("components/menu/features/submenu.js"))?.[1].file;
  assert(submenuChunk, "Vite did not split the menu's submenu feature into a chunk");
  assert(!assets("menu.html", "static").has(submenuChunk), "The submenu feature is in the menu's initial graph");
  assert(assets("menu.html", "dynamic").has(submenuChunk), "The menu does not load the submenu chunk");

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

  // A menu without nested items never requests the submenu chunk, opened or
  // not; setItems with nested items requests it. A menu created with nested
  // items requests it at creation, with no interaction, and its submenu opens.
  const submenuRequested = (page: Page): Promise<unknown> =>
    page.waitForRequest(request => new URL(request.url()).pathname.slice(1) === submenuChunk, { timeout: 5000 });
  const flatPage = await context.newPage();
  const flatRequested = new Set<string>();
  flatPage.on("request", request => flatRequested.add(new URL(request.url()).pathname.slice(1)));
  await flatPage.goto(`${origin}/menu.html`);
  await flatPage.locator('body[data-ready="true"]').waitFor();
  await flatPage.getByRole("menuitem", { name: "Copy" }).waitFor();
  await flatPage.waitForTimeout(300);
  assert(!flatRequested.has(submenuChunk), "A menu without nested items requested the submenu chunk");
  const afterSetItems = submenuRequested(flatPage);
  await flatPage.evaluate(() => (window as unknown as { nest: () => void }).nest());
  await afterSetItems;
  await flatPage.close();
  // A context of its own, so the chunk is not already in the cache
  const nestedContext = await browser.newContext({ reducedMotion: "reduce" });
  const nestedPage = await nestedContext.newPage();
  nestedPage.on("pageerror", error => errors.push(error.message));
  nestedPage.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const atCreation = submenuRequested(nestedPage);
  await nestedPage.goto(`${origin}/menu.html?nested`);
  await atCreation;
  await nestedPage.getByRole("menuitem", { name: "Share" }).click();
  await nestedPage.getByRole("menuitem", { name: "Copy link" }).waitFor();
  await nestedContext.close();

  const snapshot = async function snapshot(page: Page) {
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
  const retaken: string[] = [];
  let comparisons = 0;
  // For chasing a flaky comparison: CONSUMER_SCENARIOS=split-button-open
  // compares only those scenarios, CONSUMER_ROUNDS=20 repeats the whole matrix.
  const only = process.env.CONSUMER_SCENARIOS?.split(",").filter(Boolean);
  const compared = only ? scenarios.filter((scenario) => only.includes(scenario.name)) : scenarios;
  assert(compared.length, `No scenario matches CONSUMER_SCENARIOS=${process.env.CONSUMER_SCENARIOS}`);
  const rounds = Number(process.env.CONSUMER_ROUNDS ?? 1);
  for (let round = 1; round <= rounds; round++)
  for (const width of [1040, 390]) for (const theme of ["baseline", "ocean"]) for (const mode of ["light", "dark"]) {
    const pages = await Promise.all([context.newPage(), context.newPage()]);
    for (const page of pages) await page.setViewportSize({ width, height: 900 });
    for (const scenario of compared) {
      const label = `${scenario.name}-${theme}-${mode}-${width}${rounds > 1 ? `-round${round}` : ""}`;
      await Promise.all(pages.map(async (page, i) => {
        const params = new URLSearchParams({ theme, mode, state: scenario.state ?? "" });
        await page.goto(`${origin}/${i === 0 ? "full" : "selective"}-${scenario.name}.html?${params}`);
        await page.locator('body[data-ready="true"]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (scenario.state === "hover") await page.getByRole("button").first().hover();
        if (scenario.state === "focus") await page.keyboard.press("Tab");
      }));
      const capture = async (): Promise<Buffer[]> => {
        await Promise.all(pages.map((page, i) =>
          page.screenshot({ path: join(artifacts, `${label}-${i === 0 ? "full" : "selective"}.png`), fullPage: true, animations: "disabled" })));
        return Promise.all(["full", "selective"].map(style => readFile(join(artifacts, `${label}-${style}.png`))));
      };
      // The computed-style snapshot of both pages, before and after the capture: a
      // page whose styles are still settling when it is captured shows as a change
      // between the two.
      const before = await Promise.all(pages.map(snapshot));
      let [fullPNG, selectivePNG] = await capture();
      const [full, selective] = await Promise.all(pages.map(snapshot));
      const settled = JSON.stringify(before[0]) === JSON.stringify(full) && JSON.stringify(before[1]) === JSON.stringify(selective);
      // Twice in CI one capture of `split-button-open` matched a green run's image
      // exactly and the other differed in 26 to 29 pixels, on the rows where the open
      // menu's shadow falls on the buttons: the full build once, the selective build
      // once, with the DOM and the computed styles identical. So it was a capture, not
      // a difference between the builds. The cause found is how Chromium blends that
      // shadow depending on the layers under it; test/browser/fixture.css pins the
      // menu to a layer for that. This is the net under it, and it is kept narrow,
      // because a second capture also gives a second chance to a real difference that
      // comes and goes (a constant one is still there; an intermittent one may not be):
      // - only a pair whose snapshots are equal across the two pages, and unchanged
      //   from before the capture to after it, is captured again, once;
      // - a retake that matches is a warning in the log and in the final line, the
      //   first images are kept, and the report lists the pair;
      // - more than one matched retake in a round fails the check: the glitch above is
      //   one pair in a run, and a timing problem would hit several.
      if (settled && JSON.stringify(full) === JSON.stringify(selective) && !fullPNG.equals(selectivePNG)) {
        await writeFile(join(artifacts, `${label}-first-full.png`), fullPNG);
        await writeFile(join(artifacts, `${label}-first-selective.png`), selectivePNG);
        await pages[0].waitForTimeout(250);
        [fullPNG, selectivePNG] = await capture();
        if (fullPNG.equals(selectivePNG)) {
          retaken.push(label);
          console.log(`::warning::consumer:check captured ${label} a second time: the first pair differed in pixels only, the second matches. First images: analysis/browser/${label}-first-*.png`);
        } else console.log(`Captured ${label} again: the first pair differed in pixels only; the second still differs`);
      }
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
  const report = { vite: sizes, browser: await browser.version(), comparisons, retaken, failures, errors };
  await writeFile(join(artifacts, "report.json"), JSON.stringify(report, null, 2));
  assert.deepEqual(errors, [], "Browser errors occurred");
  assert.deepEqual(failures, [], "Full/selective CSS mismatches (see analysis/browser)");
  assert(retaken.length <= rounds, `${retaken.length} pairs only matched on a second capture (${retaken.join(", ")}): one per round is the known capture glitch, more is a timing problem`);
  console.log(`Passed ${comparisons} full/selective screenshot and computed-style comparisons${retaken.length ? ` (${retaken.length} only on a second capture: ${retaken.join(", ")})` : ""}, interactions, and lazy network checks.`);
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.httpServer.close(error => error ? reject(error) : resolve());
  });
  await fixture.cleanup();
}
