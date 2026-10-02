// test/component-exports.test.ts
//
// FLO-381: `mtrl/components/<name>` is public API like the root. Each index's
// export list is pinned, so a name joining or leaving a component subpath fails
// here until the fixture is regenerated (`bun run component-exports:update`)
// and the diff reviewed. 0.10.5 deprecated the internals the indexes leaked;
// 1.0.0 removes them, and the manifest lists each component subpath by name
// instead of a wildcard that also exposed the folders inside a component.
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { componentNames, diffComponentExports, readComponentExports, readPinned } from "../scripts/component-exports";
import { readRootExports } from "../scripts/root-exports";

const ROOT = join(import.meta.dir, "..");
const now = readComponentExports();
const pkg = await Bun.file(join(ROOT, "package.json")).json();

/** What 0.10.5 deprecated on the component subpaths (FLO-381 PR 1, #359) */
const REMOVED = [
  "card:ExpandableFeature", "card:LoadingFeature", "card:SwipeableFeature", "card:withAPI", "card:withElevation",
  "card:withExpandable", "card:withLoading", "card:withSwipeable",
  "datepicker:DEFAULT_DATE_FORMAT",
  "switch:SupportingTextComponent", "switch:withSupportingText",
  "tabs:DividerConfig", "tabs:IndicatorComponent", "tabs:IndicatorFeatureConfig", "tabs:ScrollableComponent",
  "tabs:ScrollableConfig", "tabs:TabsManagementComponent", "tabs:TabsManagementConfig", "tabs:addScrollIndicators",
  "tabs:createTabIndicator", "tabs:createTabsState", "tabs:setupKeyboardNavigation", "tabs:updateTabPanels",
  "tabs:withDivider", "tabs:withIndicator", "tabs:withScrollable", "tabs:withTabsManagement",
];

describe("the component subpaths' exports (FLO-381)", () => {
  test("match the pinned lists: an added or removed name fails until the fixture is regenerated", async () => {
    const changes = diffComponentExports(await readPinned(), now);
    expect(changes, `Run \`bun run component-exports:update\` if intended:\n${changes.join("\n")}`).toEqual([]);
  });

  test("the internals 0.10.5 deprecated are gone", () => {
    const present = REMOVED.filter((entry) => {
      const [component, name] = entry.split(":");
      return now[component!]?.some((e) => e.name === name);
    });
    expect(present).toEqual([]);
  });

  test("DEFAULT_DATE_FORMAT leaves the datepicker index but stays public in its constants", async () => {
    const constants = await import("../src/components/datepicker/constants");
    expect(constants.DEFAULT_DATE_FORMAT).toBe("MM/DD/YYYY");
  });

  test("only the canonical names: the old spellings are gone from their subpaths (FLO-383)", () => {
    const names = (component: string) => now[component]?.map((e) => e.name) ?? [];
    for (const [component, old, to] of [["textfield", "TextfieldConfig", "TextFieldConfig"], ["textfield", "TextfieldComponent", "TextFieldComponent"],
      ["card", "CardSchema", "CardConfig"], ["top-app-bar", "TopAppBar", "TopAppBarComponent"], ["bottom-app-bar", "BottomAppBar", "BottomAppBarComponent"],
      ["textfield/constants", "TEXTFIELD_CLASSES", "TEXT_FIELD_CLASSES"]]) {
      expect(names(component!)).toContain(to);
      expect(names(component!)).not.toContain(old);
    }
    expect(Object.values(now).flat().filter((e) => e.note?.includes("FLO-383")).map((e) => e.name)).toEqual([]);
  });

  test("1.0 exports nothing deprecated: the constants 0.10.0 deprecated are gone from every subpath", () => {
    const gone = ["checkbox:CHECKBOX_VARIANTS", "radios:RADIO_VARIANTS", "radios:RADIO_LABEL_POSITIONS", "radios:RADIO_SIZES",
      "radios:RADIO_CLASSES", "timepicker:TIMEPICKER_DIAL", "timepicker:TIMEPICKER_Z_INDEX", "timepicker:TIMEPICKER_CLASSES"];
    const present = gone.flatMap((entry) => {
      const [component, name] = entry.split(":");
      return [component!, `${component}/constants`].filter((key) => now[key]?.some((e) => e.name === name)).map((key) => `${key}:${name}`);
    });
    expect(present).toEqual([]);
    expect(Object.entries(now).flatMap(([key, exports]) => exports.filter((e) => e.status === "deprecated").map((e) => `${key}:${e.name}`))).toEqual([]);
  });

  test("every component's variant type is exported from its subpath and from the root, as a public variant option's type", () => {
    const root = new Set(readRootExports().map((e) => e.name));
    const declared = componentNames().flatMap((component) => ["types", "constants"].flatMap((module) => {
      const file = join(ROOT, `src/components/${component}/${module}.ts`);
      if (!existsSync(file)) return [];
      return [...readFileSync(file, "utf8").matchAll(/^export type ([A-Z][A-Za-z]*Variant)\b/gm)].map((m) => [component, m[1]!] as const);
    }));
    expect(declared.length).toBe(21);
    expect(declared.filter(([component, name]) => !now[component]?.some((e) => e.name === name)).map(([c, n]) => `${c}:${n}`)).toEqual([]);
    expect(declared.filter(([, name]) => !root.has(name)).map(([, n]) => `root:${n}`)).toEqual([]);
  }, 60_000);

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
      status("tabs", "ResponsiveConfig"), status("tabs", "TabIndicator"), status("datepicker", "CalendarAPI"),
    ]).toEqual(["public", "public", "public", "public", "public", "public", "public", "public"]);
  });

  test("a chip's set-only options are not on the public ChipConfig", async () => {
    const types = await Bun.file(join(ROOT, "src/components/chips/types.ts")).text();
    const chipConfig = types.slice(types.indexOf("export interface ChipConfig"), types.indexOf("\n}\n", types.indexOf("export interface ChipConfig")));
    expect(chipConfig).not.toMatch(/managedSelection|\bcell\b/);
    expect(now.chips?.map((e) => e.name)).not.toContain("ChipOptions");
  });
});

describe("the manifest lists each component subpath (FLO-381)", () => {
  const keys = Object.keys(pkg.exports).filter((key) => key.startsWith("./components/"));

  test("no wildcard: a pattern would also expose the folders inside a component", () => {
    expect(keys.filter((key) => key.includes("*"))).toEqual([]);
  });

  test("one entry per component, and one per component with constants, exactly", () => {
    const expected = componentNames().flatMap((name) => [
      `./components/${name}`,
      ...(existsSync(join(ROOT, `src/components/${name}/constants.ts`)) ? [`./components/${name}/constants`] : []),
    ]);
    expect([...keys].sort()).toEqual(expected.sort());
  });

  test("each entry points at that component's built index or constants", () => {
    const wrong = keys.filter((key) => {
      const file = key.endsWith("/constants") ? key.slice("./".length) : `${key.slice("./".length)}/index`;
      const entry = pkg.exports[key];
      return entry.types !== `./dist/${file}.d.ts` || entry.import !== `./dist/${file}.js` || Object.keys(entry).length !== 2;
    });
    expect(wrong).toEqual([]);
  });
});
