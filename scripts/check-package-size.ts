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

// The packed size depends on the packer: npm's gzip differs between Node and npm
// versions (#325: one dist packed to 998,498 B under Node 26 / npm 11 and to
// 1,000,150 B under CI's Node 22 / npm 10). CI's figure is the one that counts.
const CI_NODE_MAJOR = 22;
const versionOf = (command: string): string => Bun.spawnSync([command, "--version"]).stdout.toString().trim();
const packer = { node: versionOf("node"), npm: versionOf("npm") };
if (Number(packer.node.replace(/^v/, "").split(".")[0]) !== CI_NODE_MAJOR) {
  console.warn(
    `\n!! Packed with Node ${packer.node} / npm ${packer.npm}, not CI's Node ${CI_NODE_MAJOR}: the packed size\n` +
      `!! below is only indicative, and CI's is authoritative. For CI's figure, run\n` +
      `!!   npx -y -p node@${CI_NODE_MAJOR} -p npm@10 -- bun run size:check\n`,
  );
}
const sizes: Record<string, { raw: number; gzip: number; brotli: number }> = {};
function measure(data: Uint8Array) {
  return { raw: data.length, gzip: gzipSync(data, { level: 9 }).length, brotli: brotliCompressSync(data).length };
}
try {
  assert(!pack.files.some((file: { path: string }) => file.path.endsWith(".map")), "Unexpected source maps in npm package");
  // What an install downloads. Raised from 900,000 on 2026-09-29 (Dr Jones) for the
  // overlay elements of wave 2; 830,286 measured after wave 1 (#245). Raised to
  // 1,010,000 for the 35 public Material shapes (FLO-346): 994,762 to 1,000,150,
  // measured with CI's Node 22 / npm 10.
  // FLO-406: medium/high contrast for all 24 themes, including the system fallback.
  // Node 22.23.3 / npm 10.9.9: 1,007,632 -> 1,067,061 compressed bytes.
  // FLO-406 addenda: sparse roles and a shared high palette: 1,076,871 bytes.
  // Direct high values in explicit and system rules: 1,063,670 bytes, measured
  // with Node 22.23.3 / npm 10.9.9. Repeated values compress better than references.
  // 0.10.7 announces `material` 3.0.0's changes: the text field's two-word import paths (four export-map
  // keys and a Sass forward, FLO-560): 1,069,964 to 1,070,230; then the TSDoc notices, which
  // change nothing at run time. Raised by the rule for explicit ceilings (measured plus 1%,
  // up to the next 1,000), Node 22.23.3 / npm 10.9.9.
  assert(pack.size < 1_081_000, "npm tarball exceeds 1,081,000 bytes");
  // Raised from 4,500,000 on 2026-09-28 and from 5,000,000 on 2026-09-29 (Dr Jones) for
  // the elements and framework adapters, whose shadow-root CSS repeats the
  // per-component CSS; 4,936,491 measured after wave 1. Of the rest: types 35%,
  // ESM 23%, CSS 18%, SCSS sources 11%, the CommonJS bundle 8% (a 1.0.0 decision).
  // FLO-406: the generated SCSS plus standalone, base and full CSS copies:
  // 5,716,236 -> 6,571,092 unpacked bytes under the same Node 22 / npm 10 packer.
  // FLO-406 addenda: 6,571,092 -> 6,430,336 -> 6,272,030 unpacked bytes.
  // 0.10.7: the TSDoc notices that say what `material` 3.0.0 changes (comments in the type
  // declarations; nothing at run time) take the package from 6,294,585 to 6,306,126, measured
  // on the release commit. Raised from 6,300,000 by the rule for explicit ceilings (measured
  // plus 1%, up to the next 1,000), Node 22.23.3 / npm 10.9.9.
  assert(pack.unpackedSize < 6_368_000, "Unpacked package exceeds 6,368,000 bytes");

  // Resolve and execute the installed ESM/CJS APIs in Node, not Bun's permissive resolver.
  const smoke = join(temporary, "smoke.mjs");
  await writeFile(smoke, `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import * as esm from 'mtrl';
    import { createButton, createTextfield, createCard, addClass } from 'mtrl';
    import button from 'mtrl/components/button';
    import rail from 'mtrl/components/navigation-rail';
    import { BUTTON_VARIANTS } from 'mtrl/components/button/constants';
    import { addClass as directAddClass } from 'mtrl/core/dom';
    import { JSDOM } from ${JSON.stringify(pathToFileURL(resolve("node_modules/jsdom/lib/api.js")).href)};
    assert.equal(button, createButton);
    // FLO-560: the text field's two-word paths resolve to the modules the old ones do.
    for (const [alias, old] of [
      ['mtrl/components/text-field', 'mtrl/components/textfield'],
      ['mtrl/components/text-field/constants', 'mtrl/components/textfield/constants'],
      ['mtrl/styles/text-field', 'mtrl/styles/textfield'],
      ['mtrl/elements/css/text-field', 'mtrl/elements/css/textfield'],
    ]) assert.equal(import.meta.resolve(alias), import.meta.resolve(old), alias);
    assert.equal((await import('mtrl/components/text-field')).default, createTextfield);
    assert.equal(rail, esm.createNavigationRail);
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
    // FLO-117: addClass takes the name as given. This asserts it from the
    // packaged build, which is where a consumer meets it.
    addClass(b.element, 'smoke');
    assert(b.element.classList.contains('smoke'));
    assert(!b.element.classList.contains('mtrl-smoke'));
    // The component's own classes still carry the prefix, via getClass.
    assert(b.element.classList.contains('mtrl-button'));
    assert(b.element.textContent.includes('Save'));
    const navigation = rail({ items: [{ id: 'home', label: 'Home', icon: '<svg></svg>' }] });
    document.body.append(navigation.element); navigation.expand(); assert(navigation.isExpanded()); navigation.destroy();
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
    import 'mtrl/styles';
    import 'mtrl/styles/button';
    import { createButton, type ButtonConfig, type NavigationRailConfig, type NavigationRailComponent } from 'mtrl';
    import rail from 'mtrl/components/navigation-rail';
    const railConfig: NavigationRailConfig = { expanded: true, layout: 'modal', items: [] };
    const navigation: NavigationRailComponent = rail(railConfig);
    navigation.on('select', event => event.originalEvent.preventDefault());
    import button from 'mtrl/components/button';
    import { BUTTON_VARIANTS } from 'mtrl/components/button/constants';
    import { addClass } from 'mtrl/core/dom';
    const config: ButtonConfig = { text: 'Save', variant: BUTTON_VARIANTS.FILLED };
    const a: ReturnType<typeof createButton> = button(config);
    addClass(a.element, 'ready');
  `);
  await run(["node", resolve("node_modules/typescript/bin/tsc"), typeFixture,
    "--noEmit", "--strict", "--module", "NodeNext", "--moduleResolution", "NodeNext",
    // Side-effect imports are unchecked by default; this is the setting under
    // which `import 'mtrl/styles'` needs its types condition
    "--noUncheckedSideEffectImports",
    "--target", "ES2020", "--types", "node", "--typeRoots", resolve("node_modules/@types")]);

  const fixtures = [
    { name: "addClass", code: "export { addClass } from 'mtrl';", gzip: 900 },
    { name: "button", code: "export { createButton } from 'mtrl';", gzip: 15000 },
    // The URL scheme allowlist is reached through core/dom, so every bundle that builds
    // an element carries it: +260 here, +256 button, +267 rail, +260 textfield, +243 form,
    // measured against 0.9.0. The slider simply had the least headroom (10,934 of 11,000).
    // all-js is 1,353 smaller, the shared code deduplicating across the barrel.
    // Taking part in forms (N12) adds 187: a hidden input carrying the value,
    // two of them for a range slider, kept in step inside render(). Measured
    // 11,468 to 11,655 at 0.9.8. Four redesigns recovered 11 bytes between
    // them — returning the input rather than an object of closures, writing
    // only the content attribute, going through the shared createElement
    // (which cost 5 more), and one formFields property rather than two — so
    // the feature costs what it costs.
    // The boolean-attribute predicate (FLO-240) is reached through core/dom in
    // the same way the URL allowlist is, so every bundle that builds an element
    // carries it: +71 here, +79 button, +85 rail, +77 textfield, +87 form,
    // +107 all-js, measured against 73cbb0c. Slider again had the least
    // headroom (11,652 of 11,700) and was the only fixture to cross its budget.
    // Most of the cost is the eight attribute names themselves; an array with
    // includes() in place of the Set measured 3 bytes worse, so this is close
    // to what the check costs. Writing disabled="false" for disabled: false
    // disabled the control, which is not a trade worth 71 bytes to keep.
    // M3 conformance (FLO-249, FLO-250, FLO-252) adds 888, 11,594 to 12,482 against
    // 6b2143b: the three variants' track geometry after Compose's drawTrack with a stop
    // at each end, the handle narrowing on focus, settling on a spring only for value
    // changes that do not follow the pointer, the inset icon placed on whichever track
    // holds it, and vertical orientation through one axis description shared by the
    // track, the controller and the pointer handlers rather than a second code path.
    // Range limits, keys and RTL (FLO-251) add 302, 12,482 to 12,784: handles that stop
    // at each other in drag, keys and setters with the inner ARIA bounds, PageUp and
    // PageDown by a tenth of the steps, arrows that follow the track as drawn, and an
    // axis that can start on the right.
    // Raised from 12,900 for FLO-331: the track's corner reads its shape token (12,983 measured).
    { name: "slider", code: "export { createSlider } from 'mtrl';", gzip: 13090 },
    { name: "navigation-rail", code: "export { createNavigationRail } from 'mtrl';", gzip: 7000 },
    // FLO-406 contrast CSS: 5,266 -> 7,189 gzip bytes, Node 22.23.3 / npm 10.9.9.
    // FLO-406 direct high values: 8,156 -> 7,631 gzip bytes (same packer).
    { name: "navigation-rail-css", code: "import 'mtrl/styles/base'; import 'mtrl/styles/navigation-rail';", gzip: 7800 },
    // FLO-301 (the required asterisk, the live error, the trailing icon button): 8,456 to
    // 9,058 against 7cd57a6, Node 22 / npm 10.
    { name: "textfield", code: "export { createTextfield } from 'mtrl';", gzip: 9200 },
    { name: "form", code: "export { createButton, createTextfield, createCheckbox } from 'mtrl';", gzip: 22000 },
    // The toolbar (FLO-304): 123,080 to 125,176, measured against b1dbf77.
    // The FAB menu (FLO-306): 125,245 to 127,714, measured against 1bd8343.
    // The Material shapes' geometry in the loading indicator (FLO-346): 127,894 to 128,195, measured against 5b314c5.
    // The text field's asterisk, live error and trailing button (FLO-301): 128,187 to 128,802, against 7cd57a6.
    // The carousel's opt-in wheel scrolling with momentum (FLO-395): 128,896 to 129,565 against
    // 2ef11f0, Node 22 / npm 10.
    // FLO-406/main merge with FLO-403: 129,634 B measured under Node 22.23.3 / npm 10.9.9.
    // isDisabled() on eleven components and the type exports (FLO-384): 129,650 to 129,773
    // against 3f9ca0c7, Node 22.23.3 / npm 10.9.9; the budget keeps the headroom it had.
    // FLO-514 and FLO-515: 129,790 to 129,874 against e0e424e4, Node 22.23.3 / npm 10.9.9.
    // The ceiling rises by that 84 and keeps the 60 bytes it had.
    // FLO-537: the button group's press widths start from a measured length.
    // 129,894 to 129,999 against this branch's main, Node 22.23.3 / npm 10.9.9.
    // The ceiling rises by that 105 and keeps the 40 bytes it had.
    { name: "all-js", code: "export * from 'mtrl';", gzip: 130039 },
    // FLO-406 contrast CSS: 5,173 -> 7,107 gzip bytes, Node 22.23.3 / npm 10.9.9.
    // FLO-406 direct high values: 8,069 -> 7,542 gzip bytes (same packer).
    { name: "button-css", code: "import 'mtrl/styles/base'; import 'mtrl/styles/button';", gzip: 7700 },
    // The outlined text field's notched outline (#234) adds 202, 7,863 to 8,065: three
    // segments with their corners each way round, and the outline colour and width per
    // state, in place of an input border and a focus overlay. The resting label shown
    // alone (FLO-354, FLO-355): the placeholder's fill cleared and the affixes hidden
    // while it rests, 8,183 to 8,245 (+62) against 09d665b, Node 22 / npm 10.
    // The text field's trailing icon button and asterisk (FLO-301): 8,245 to 8,426 against 7cd57a6.
    // FLO-406 contrast CSS: 8,426 -> 10,377 gzip bytes, Node 22.23.3 / npm 10.9.9.
    // FLO-406 direct high values: 11,342 -> 10,811 gzip bytes (same packer).
    { name: "select-css", code: "import 'mtrl/styles/base'; import 'mtrl/styles/select';", gzip: 11000 },
    // FLO-406 contrast CSS: 4,740 -> 6,661 gzip bytes, Node 22.23.3 / npm 10.9.9.
    // FLO-406 direct high values: 7,639 -> 7,111 gzip bytes (same packer).
    { name: "slider-css", code: "import 'mtrl/styles/base'; import 'mtrl/styles/slider';", gzip: 7300 },
    // The .43 rail-motion baseline is 47,117 bytes; core ripple adds about 20 bytes.
    // The tooltip stylesheet adds 486 (measured): it was authored but registered in no
    // bundle, so every budget before this one was set with its CSS missing, not excluded.
    // Moving drawer, side sheet, bottom sheet and dialog onto the expressive springs adds
    // 530 (measured, 47,908 to 48,438 at 0c2d347): each open and close state spells out
    // its spring's linear() curve, and the copies sit too far apart for gzip to share.
    // The inverse roles in every theme (FLO-254) add about 500 (dist/styles.css at gzip
    // level 9, 44,479 to 44,986): three roles in the light and dark block of 17 themes,
    // spread across 34 blocks too far apart for gzip to share. The fixture read 48,709.
    // A chip set's grid cell draws its own 3px focus ring and focus layer (FLO-261): +57
    // (dist/styles.css at gzip level 9, 45,306 to 45,363); the fixture read 49,323.
    // The outlined text field's notched outline (#234): +202, the fixture read 50,865 to
    // 51,067. The time picker's DOM dial (FLO-279): measured 51,497 with both in. Its
    // hour and minute radios (FLO-283): measured 51,628. The menu's top-layer rule
    // (#251), with main at 312ca0e and the time picker tokens: measured 51,667. The
    // modal surfaces in the top layer: +328, measured 51,995 at dba5ba9: the dialog, the
    // two sheets and the modal drawer each undo the user agent's <dialog> box and fade a
    // ::backdrop, with `overlay` held for the exit, in four stylesheets gzip cannot share.
    // Search's surface, a <dialog> in the top layer (FLO-285): measured 52,194. Its
    // state layers and the contained variant (FLO-286, FLO-287): measured 52,328.
    // FLO-311, measured each alone on e36838c: dropping the --*-rgb twin of every colour
    // role in every theme, 52,398 to 49,528; one button state layer in currentColor, its
    // opacity alone per state, in place of a layer per colour style and toggle state:
    // 48,934. With main's FLO-308 themes merged and regenerated without twins: 48,794.
    // The typeface and corner tokens (FLO-330): every font-family and token corner is
    // var(--token, <compiled>), measured 50,184 to 50,678 (+494) at 64c1e86.
    // The toolbar (FLO-304): 50,752 to 51,449, measured against b1dbf77.
    // The FAB menu (FLO-306): 51,494 to 52,688, measured against 1bd8343.
    // The date picker's range bleed: 52,705 to 52,916, measured against d741e93.
    // The text field's trailing icon button and asterisk (FLO-301): 52,916 to 53,072 against 7cd57a6.
    // FLO-406 contrast CSS: 53,072 -> 64,228 gzip bytes, Node 22.23.3 / npm 10.9.9.
    // FLO-406 direct high values: 69,743 -> 65,291 gzip bytes (same packer).
    { name: "full-css", code: "import 'mtrl/styles';", gzip: 66000 },
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
  const visit = async function visit(path: string) {
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
  console.log(`npm package: ${pack.size} bytes compressed, ${pack.unpackedSize} unpacked, ${pack.entryCount} files (packed with Node ${packer.node} / npm ${packer.npm})`);
  await mkdir("analysis", { recursive: true });
  await writeFile("analysis/package-size.json", JSON.stringify({ sizes, package: {
    size: pack.size, unpackedSize: pack.unpackedSize, entryCount: pack.entryCount,
  } }, null, 2) + "\n");
} finally {
  await fixture.cleanup();
}
