#!/usr/bin/env bun
/** Build first. Measure actual packed consumers, not source-only imports. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve, basename, dirname } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import ts from "typescript";

import { createPackageFixture, run } from "./package-fixture";

const fixture = await createPackageFixture();
const { directory: temporary, pack } = fixture;
const sizes: Record<string, { raw: number; gzip: number; brotli: number }> = {};
function measure(data: Uint8Array) {
  return { raw: data.length, gzip: gzipSync(data, { level: 9 }).length, brotli: brotliCompressSync(data).length };
}
try {
  assert(!pack.files.some((file: { path: string }) => file.path.endsWith(".map")), "Unexpected source maps in npm package");
  assert(pack.size < 900_000, "npm tarball exceeds 900,000 bytes");
  assert(pack.unpackedSize < 4_500_000, "Unpacked package exceeds 4,500,000 bytes");

  // Resolve and execute the installed ESM/CJS APIs in Node, not Bun's permissive resolver.
  const smoke = join(temporary, "smoke.mjs");
  await writeFile(smoke, `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import * as esm from 'mtrl';
    import { createButton, createTextfield, createCard, addClass } from 'mtrl';
    import button from 'mtrl/components/button';
    import { BUTTON_VARIANTS } from 'mtrl/components/button/constants';
    import { addClass as directAddClass } from 'mtrl/core/dom';
    import { JSDOM } from ${JSON.stringify(pathToFileURL(resolve("node_modules/jsdom/lib/api.js")).href)};
    assert.equal(button, createButton);
    assert.equal(directAddClass, addClass);
    const cjs = createRequire(import.meta.url)('mtrl');
    assert.equal(typeof cjs.createButton, 'function');
    assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
    for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement', 'Event', 'CustomEvent', 'MutationObserver']) {
      globalThis[key] = dom.window[key];
    }
    globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
    globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
    // No canvas rendering in JSDOM; exercise the lazy module and DOM lifecycle.
    dom.window.HTMLCanvasElement.prototype.getContext = () => null;
    const b = button({ text: 'Save', variant: BUTTON_VARIANTS.FILLED });
    document.body.append(b.element);
    addClass(b.element, 'smoke');
    assert(b.element.classList.contains('mtrl-smoke'));
    assert(b.element.textContent.includes('Save'));
    const field = createTextfield({ label: 'Name' });
    field.setValue('Ada');
    assert.equal(field.getValue(), 'Ada');
    const loading = button({ text: 'Upload', progress: { indeterminate: false } });
    document.body.append(loading.element);
    await loading.showProgress();
    assert(loading.element.querySelector('canvas'), 'Lazy progress module did not load');
    await loading.hideProgress();
    const card = createCard({ buttons: [{ text: 'Action' }] });
    document.body.append(card.element);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert(card.element.querySelector('button')?.textContent.includes('Action'), 'Lazy card button did not load');
    card.destroy(); loading.destroy(); b.destroy(); field.destroy(); dom.window.close();
  `);
  await run(["node", smoke], temporary);

  // Check declaration resolution using strict NodeNext semantics.
  const typeFixture = join(temporary, "types.ts");
  await writeFile(typeFixture, `
    import { createButton, type ButtonConfig } from 'mtrl';
    import button from 'mtrl/components/button';
    import { BUTTON_VARIANTS } from 'mtrl/components/button/constants';
    import { addClass } from 'mtrl/core/dom';
    const config: ButtonConfig = { text: 'Save', variant: BUTTON_VARIANTS.FILLED };
    const a: ReturnType<typeof createButton> = button(config);
    addClass(a.element, 'ready');
  `);
  await run(["node", resolve("node_modules/typescript/bin/tsc"), typeFixture,
    "--noEmit", "--strict", "--module", "NodeNext", "--moduleResolution", "NodeNext",
    "--target", "ES2020", "--types", "node", "--typeRoots", resolve("node_modules/@types")]);

  const fixtures = [
    { name: "addClass", code: "export { addClass } from 'mtrl';", gzip: 900 },
    { name: "button", code: "export { createButton } from 'mtrl';", gzip: 15000 },
    { name: "textfield", code: "export { createTextfield } from 'mtrl';", gzip: 8500 },
    { name: "form", code: "export { createButton, createTextfield, createCheckbox } from 'mtrl';", gzip: 22000 },
    { name: "all-js", code: "export * from 'mtrl';", gzip: 125000 },
    { name: "button-css", code: "import 'mtrl/styles/base'; import 'mtrl/styles/button';", gzip: 6500 },
    { name: "select-css", code: "import 'mtrl/styles/base'; import 'mtrl/styles/select';", gzip: 8000 },
    { name: "full-css", code: "import 'mtrl/styles';", gzip: 45000 },
  ];
  for (const fixture of fixtures) {
    const entry = join(temporary, `${fixture.name}.ts`);
    await writeFile(entry, fixture.code);
    const result = await Bun.build({ entrypoints: [entry], format: "esm", target: "browser", minify: true });
    assert(result.success, String(result.logs));
    const css = fixture.name.endsWith("-css");
    const outputs = result.outputs.filter(output => output.path.endsWith(css ? ".css" : ".js"));
    assert.equal(outputs.length, 1, `${fixture.name}: expected one ${css ? "CSS" : "JS"} output`);
    const bytes = new Uint8Array(await outputs[0].arrayBuffer());
    sizes[fixture.name] = measure(bytes);
    assert(sizes[fixture.name].gzip <= fixture.gzip, `${fixture.name} exceeds ${fixture.gzip} gzip bytes: ${sizes[fixture.name].gzip}`);
    if (css) {
      const text = new TextDecoder().decode(bytes);
      assert(text.includes("--mtrl-sys-color-primary"), "CSS base theme was discarded");
      assert(text.includes(".mtrl-"), "CSS side-effect import was discarded");
      if (fixture.name === "button-css") {
        assert(text.includes(".mtrl-button") && text.includes(".mtrl-progress"));
        assert(!text.includes(".mtrl-textfield"), "Unrelated component CSS retained");
      }
      if (fixture.name === "select-css") assert(text.includes(".mtrl-menu") && text.includes(".mtrl-textfield"));
    }
  }

  // Sum the entry's static dependency graph, not just its tiny re-export stub.
  const splitDir = join(temporary, "split");
  const split = await Bun.build({ entrypoints: [join(temporary, "button.ts")], outdir: splitDir,
    format: "esm", target: "browser", minify: true, splitting: true });
  assert(split.success, String(split.logs));
  const byPath = new Map(split.outputs.map(output => [output.path, output]));
  const initial = new Set<string>();
  const deferred = new Set<string>();
  async function visit(path: string) {
    if (initial.has(path)) return;
    initial.add(path);
    const output = byPath.get(path);
    assert(output, `Missing chunk ${path}`);
    const file = ts.createSourceFile(path, await output.text(), ts.ScriptTarget.Latest, true);
    const dependencies: string[] = [];
    function walk(node: ts.Node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        dependencies.push(resolve(dirname(path), node.moduleSpecifier.text));
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
        deferred.add(resolve(dirname(path), node.arguments[0].text));
      }
      ts.forEachChild(node, walk);
    }
    walk(file);
    for (const dependency of dependencies) await visit(dependency);
  }
  const entry = split.outputs.find(output => basename(output.path) === "button.js");
  assert(entry);
  await visit(entry.path);
  assert([...deferred].some(path => !initial.has(path)), "Progress is no longer deferred");
  sizes["button-initial"] = { raw: 0, gzip: 0, brotli: 0 };
  for (const path of initial) {
    const chunk = measure(new Uint8Array(await byPath.get(path)!.arrayBuffer()));
    for (const metric of ["raw", "gzip", "brotli"] as const) sizes["button-initial"][metric] += chunk[metric];
  }
  assert(sizes["button-initial"].gzip < 9000, "Button initial payload exceeds 9000 gzip bytes");

  console.table(sizes);
  console.log(`npm package: ${pack.size} bytes compressed, ${pack.unpackedSize} unpacked, ${pack.entryCount} files`);
  await mkdir("analysis", { recursive: true });
  await writeFile("analysis/package-size.json", JSON.stringify({ sizes, package: {
    size: pack.size, unpackedSize: pack.unpackedSize, entryCount: pack.entryCount,
  } }, null, 2) + "\n");
} finally {
  await fixture.cleanup();
}
