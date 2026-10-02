// test/components/navigation-bar/on-options.test.ts
//
// onSelect is the bar's select listener. A listener that destroys the bar used
// to skip the option, because the option ran after emit.
import { expect, test } from "bun:test";
import createNavigationBar from "../../../src/components/navigation-bar";
import type { NavigationBarConfig } from "../../../src/components/navigation-bar/types";
import { callbacksFixture } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();
const icon = "<svg></svg>";
const create = (config: NavigationBarConfig = {}) => mount(createNavigationBar({
  items: [
    { id: "home", label: "Home", icon, active: true },
    { id: "search", label: "Search", icon },
  ],
  ...config,
}));
const item = (bar: { element: HTMLElement }, id: string) =>
  bar.element.querySelector<HTMLElement>(`[data-id="${id}"]`)!;

test("onSelect matches its listener for a click, and setActive is silent", () => {
  const seen = optionPair();
  const bar = create({ onSelect: (event) => seen.option(event) });
  bar.on("select", (event) => seen.listener(event));
  item(bar, "search").click();
  expectSameListener(seen);
  const payload = seen.listenerCalls[0] as { id: string; value: string; index: number };
  expect(payload).toMatchObject({ id: "search", value: "search", index: 1 });
  bar.setActive("home");
  expect(seen.optionCalls).toHaveLength(1);
  expect(seen.listenerCalls).toHaveLength(1);
});

test("a listener that destroys the bar does not skip onSelect", () => {
  const seen = optionPair();
  const bar = create({ onSelect: (event) => seen.option(event) });
  bar.on("select", (event) => {
    seen.listener(event);
    bar.destroy();
  });
  item(bar, "search").click();
  expectSameListener(seen);
});

test("off(onSelect) removes the config handler, which is the registered function", () => {
  const seen: string[] = [];
  const onSelect = () => { seen.push("select"); };
  const bar = create({ onSelect });
  item(bar, "search").click();
  bar.off("select", onSelect);
  item(bar, "home").click();
  expect(seen).toEqual(["select"]);
});
