// test/components/navigation-rail/on-options.test.ts
//
// onSelect, onExpand and onCollapse are the rail's listeners. Expand and
// collapse receive { expanded }. A listener that destroys the rail used to
// skip the option, because the option ran after emit.
import { expect, test } from "bun:test";
import createNavigationRail from "../../../src/components/navigation-rail";
import type { NavigationRailConfig } from "../../../src/components/navigation-rail/types";
import { callbacksFixture } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();
const items = [
  { id: "home", label: "Home", icon: "<svg></svg>", active: true },
  { id: "mail", label: "Mail", icon: "<svg></svg>" },
];
const create = (config: NavigationRailConfig = {}) => mount(createNavigationRail({ items, ...config }));
const item = (rail: { element: HTMLElement }, id: string) =>
  rail.element.querySelector<HTMLElement>(`[data-id="${id}"]`)!;

test("onSelect matches its listener for a click, and setActive is silent", () => {
  const seen = optionPair();
  const rail = create({ onSelect: (event) => seen.option(event) });
  rail.on("select", (event) => seen.listener(event));
  item(rail, "mail").click();
  expectSameListener(seen);
  const payload = seen.listenerCalls[0] as { id: string; value: string; expanded?: boolean };
  expect(payload.id).toBe("mail");
  expect(payload.value).toBe("mail");
  rail.setActive("home");
  expect(seen.optionCalls).toHaveLength(1);
  expect(seen.listenerCalls).toHaveLength(1);
});

test("onExpand and onCollapse match their listeners for expand, collapse, toggle and the toggle button", () => {
  const expanded = optionPair();
  const collapsed = optionPair();
  const rail = create({
    onExpand: (event) => expanded.option(event),
    onCollapse: (event) => collapsed.option(event),
  });
  rail.on("expand", (event) => expanded.listener(event));
  rail.on("collapse", (event) => collapsed.listener(event));
  rail.expand();
  rail.expand();
  rail.collapse();
  rail.toggle();
  rail.element.querySelector<HTMLElement>(".mtrl-navigation-rail__toggle")!.click();
  expectSameListener(expanded);
  expectSameListener(collapsed);
  expect(expanded.optionCalls).toEqual([{ expanded: true }, { expanded: true }]);
  expect(collapsed.optionCalls).toEqual([{ expanded: false }, { expanded: false }]);
});

test("a listener that destroys the rail does not skip onSelect or onExpand", () => {
  const selected = optionPair();
  const rail = create({ onSelect: (event) => selected.option(event) });
  rail.on("select", (event) => {
    selected.listener(event);
    rail.destroy();
  });
  item(rail, "mail").click();
  expectSameListener(selected);

  const expanded = optionPair();
  const second = create({ onExpand: (event) => expanded.option(event) });
  second.on("expand", (event) => {
    expanded.listener(event);
    second.destroy();
  });
  second.expand();
  expectSameListener(expanded);
  expect(expanded.optionCalls).toEqual([{ expanded: true }]);
});

test("off(onSelect) removes the config handler, which is the registered function", () => {
  const seen: string[] = [];
  const onSelect = () => { seen.push("select"); };
  const rail = create({ onSelect });
  item(rail, "mail").click();
  rail.off("select", onSelect);
  item(rail, "home").click();
  expect(seen).toEqual(["select"]);
});
