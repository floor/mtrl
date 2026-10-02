// test/component-exports.test.ts
//
// FLO-381: `mtrl/components/<name>` is public API like the root. Each index's
// export list is pinned, so a name joining or leaving a component subpath fails
// here until the fixture is regenerated (`bun run component-exports:update`)
// and the diff reviewed. The internals leaving in `material` 3.0.0 carry @deprecated on
// their re-export: an editor flags them imported from the component's subpath.
import { describe, expect, test } from "bun:test";
import ts from "typescript";
import { join } from "node:path";
import { diffComponentExports, readComponentExports, readPinned } from "../scripts/component-exports";

const ROOT = join(import.meta.dir, "..");
const now = readComponentExports();
// The index subpaths' leaving internals; the /constants subpaths are pinned too (FLO-384)
// and carry deprecations of their own, which this list is not about.
const deprecated = Object.entries(now).filter(([component]) => !component.includes("/")).flatMap(([component, exports]) =>
  exports.filter((e) => e.status === "deprecated" && !e.note?.startsWith("Use ")).map((e) => ({ component, ...e })));

describe("the component subpaths' exports (FLO-381)", () => {
  test("match the pinned lists: an added or removed name fails until the fixture is regenerated", async () => {
    const changes = diffComponentExports(await readPinned(), now);
    expect(changes, `Run \`bun run component-exports:update\` if intended:\n${changes.join("\n")}`).toEqual([]);
  });

  test("the internals leaving in `material` 3.0.0 are deprecated, and say so", () => {
    expect(deprecated.map((e) => `${e.component}:${e.name}`).sort()).toEqual([
      "card:ExpandableFeature", "card:LoadingFeature", "card:SwipeableFeature", "card:withAPI", "card:withElevation",
      "card:withExpandable", "card:withLoading", "card:withSwipeable",
      "datepicker:DEFAULT_DATE_FORMAT",
      "switch:SupportingTextComponent", "switch:withSupportingText",
      "tabs:DividerConfig", "tabs:IndicatorComponent", "tabs:IndicatorFeatureConfig", "tabs:ScrollableComponent",
      "tabs:ScrollableConfig", "tabs:TabsManagementComponent", "tabs:TabsManagementConfig", "tabs:addScrollIndicators",
      "tabs:createTabIndicator", "tabs:createTabsState", "tabs:setupKeyboardNavigation", "tabs:updateTabPanels",
      "tabs:withDivider", "tabs:withIndicator", "tabs:withScrollable", "tabs:withTabsManagement",
    ].sort());
    for (const e of deprecated) expect(e.note).toContain(`removed from mtrl/components/${e.component} in \`material\` 3.0.0`);
  });

  test("the old names are deprecated toward the canonical ones, which are public (FLO-383)", () => {
    const entry = (component: string, name: string) => now[component]?.find((e) => e.name === name);
    for (const [component, old, to] of [["textfield", "TextfieldConfig", "TextFieldConfig"], ["textfield", "TextfieldComponent", "TextFieldComponent"],
      ["card", "CardSchema", "CardConfig"], ["top-app-bar", "TopAppBar", "TopAppBarComponent"], ["bottom-app-bar", "BottomAppBar", "BottomAppBarComponent"]]) {
      expect(entry(component!, to!)?.status).toBe("public");
      expect(entry(component!, old!)).toMatchObject({ status: "deprecated" });
      expect(entry(component!, old!)?.note).toStartWith(`Use ${to}`);
    }
    expect(entry("textfield", "createTextField")?.status).toBe("public");
  });

  test("every /constants subpath is pinned beside its index (FLO-384)", () => {
    const constants = Object.keys(now).filter((key) => key.endsWith("/constants"));
    expect(constants.length).toBeGreaterThan(30);
    for (const key of constants) expect(Object.keys(now)).toContain(key.slice(0, -"/constants".length));
    expect(now["button/constants"]?.map((e) => e.name)).toContain("BUTTON_VARIANTS");
  });

  test("the types public members are typed with, and the documented tabs helper, stay public", () => {
    const status = (component: string, name: string) => now[component]?.find((e) => e.name === name)?.status;
    expect([
      status("carousel", "SlidesAPI"), status("icon-button", "IconAPI"), status("icon-button", "ToggleManager"),
      status("tabs", "IndicatorConfig"), status("tabs", "setupResponsiveBehavior"),
    ]).toEqual(["public", "public", "public", "public", "public"]);
  });
});

describe("deprecation is on the subpath's re-export (FLO-381)", () => {
  const CONSUMER = join(ROOT, "test/__component-exports-consumer.ts");
  const flaggedIn = (source: string): Set<string> => {
    const options: ts.CompilerOptions = {
      strict: true, skipLibCheck: true, noEmit: true,
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    };
    const host: ts.LanguageServiceHost = {
      getScriptFileNames: () => [CONSUMER],
      getScriptVersion: () => "1",
      getScriptSnapshot: (file) => file === CONSUMER ? ts.ScriptSnapshot.fromString(source)
        : ts.sys.fileExists(file) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(file)!) : undefined,
      getCurrentDirectory: () => ROOT,
      getCompilationSettings: () => options,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: (file) => file === CONSUMER || ts.sys.fileExists(file),
      readFile: (file) => file === CONSUMER ? source : ts.sys.readFile(file),
    };
    return new Set(ts.createLanguageService(host).getSuggestionDiagnostics(CONSUMER)
      .filter((d) => d.code === 6385 || d.code === 6387)
      .map((d) => source.slice(d.start!, d.start! + d.length!).split(" as ")[0]!));
  };

  test("imported from its component's subpath, every leaving name is flagged", () => {
    const byComponent = new Map<string, string[]>();
    for (const e of deprecated) byComponent.set(e.component, [...(byComponent.get(e.component) ?? []), e.name]);
    const source = [...byComponent].map(([component, names], i) =>
      `import { ${names.map((n) => `${n} as d${i}_${n}`).join(", ")} } from "../src/components/${component}";`).join("\n");
    const flagged = flaggedIn(source);
    expect(deprecated.filter((e) => !flagged.has(e.name)).map((e) => `${e.component}:${e.name}`)).toEqual([]);
  }, 60_000);

  test("a public name of the same components is not flagged by these tags", () => {
    const flagged = flaggedIn([
      'import { createCard, createCardContent } from "../src/components/card";',
      'import { createTabs, setupResponsiveBehavior, type IndicatorConfig } from "../src/components/tabs";',
      'import { createSwitch } from "../src/components/switch";',
      'import { createDatePicker } from "../src/components/datepicker";',
    ].join("\n"));
    expect([...flagged]).toEqual([]);
  }, 60_000);
});
