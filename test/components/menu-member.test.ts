// test/components/menu-member.test.ts
//
// FLO-543: the menu inside a select or a split button is not a member of
// either. A leftover `.menu` in JavaScript reads undefined; what a caller did
// through it has a method on the component.
import { expect, test } from "bun:test";
import createSelect from "../../src/components/select";
import createSplitButton from "../../src/components/split-button";
import { innerMenu } from "../../src/components/menu/inner";
import { callbacksFixture, wait } from "./callbacks.fixture";

const mount = callbacksFixture();
const leftover = (component: object): unknown => (component as { menu?: unknown }).menu;

test("select.menu and splitButton.menu are not there; the menu is behind the internal handle", () => {
  const select = mount(createSelect({ options: [{ id: "a", text: "Alpha" }] }));
  const split = mount(createSplitButton({ text: "Export", items: [{ id: "pdf", text: "PDF" }] }));
  const plain = mount(createSplitButton({ text: "Export" }));
  expect(leftover(select)).toBeUndefined();
  expect(leftover(split)).toBeUndefined();
  expect("menu" in select).toBe(false);
  expect("menu" in split).toBe(false);
  expect(Object.keys(select)).not.toContain("menu");
  // A plain symbol: nothing can spell the key
  expect((select as unknown as Record<symbol, unknown>)[Symbol.for("mtrl.menu")]).toBeUndefined();
  expect(typeof innerMenu(select)?.setPosition).toBe("function");
  expect(typeof innerMenu(split)?.setItems).toBe("function");
  expect(innerMenu(plain)).toBeUndefined();
});

test("a placement set on a closed select is applied to its menu, as <m-select placement> sets it", async () => {
  const select = mount(createSelect({ options: [{ id: "a", text: "Alpha" }] }));
  await wait();
  innerMenu(select)!.setPosition("top-start");
  expect(innerMenu(select)!.getPosition()).toBe("top-start");
  expect(select.isOpen()).toBe(false);
});

test("split button setItems replaces the menu's items and getItems reads them", async () => {
  const split = mount(createSplitButton({ text: "Export", items: [{ id: "pdf", text: "PDF" }] }));
  await wait();
  expect(split.getItems().map(item => "id" in item ? item.id : null)).toEqual(["pdf"]);
  expect(split.setItems([{ id: "csv", text: "CSV" }, { id: "json", text: "JSON" }])).toBe(split);
  expect(split.getItems().map(item => "id" in item ? item.id : null)).toEqual(["csv", "json"]);
  const selected: unknown[] = [];
  split.on("select", event => { selected.push(event.value); });
  split.expand();
  await wait();
  innerMenu(split)!.element.querySelector<HTMLElement>('[data-id="json"]')!.click();
  await wait();
  expect(selected).toEqual(["json"]);
});

test("setItems on a split button created without items creates its menu, which then works as one created with items", async () => {
  const split = mount(createSplitButton({ text: "Export" }));
  const made = mount(createSplitButton({ text: "Export", items: [{ id: "csv", text: "CSV" }] }));
  await wait();
  expect(split.getItems()).toEqual([]);
  expect(innerMenu(split)).toBeUndefined();
  expect(split.setItems([{ id: "csv", text: "CSV" }, { id: "json", text: "JSON" }])).toBe(split);
  expect(split.getItems().map(item => "id" in item ? item.id : null)).toEqual(["csv", "json"]);
  expect(split.trailingElement.getAttribute("aria-haspopup")).toBe(made.trailingElement.getAttribute("aria-haspopup"));
  expect(split.trailingElement.getAttribute("aria-haspopup")).toBe("menu");
  expect(split.isExpanded()).toBe(false);

  const selected: unknown[] = [];
  const seen: string[] = [];
  split.on("select", event => { selected.push(event.value); });
  for (const name of ["expand", "collapse"] as const) split.on(name, () => { seen.push(name); });
  // One menu is open at a time, and opening one closes the other in that call
  // (FLO-548): the two are expanded in turn. They used to overlap for the
  // 50ms a close took.
  made.expand();
  await wait();
  const madeControls = made.trailingElement.hasAttribute("aria-controls");
  made.collapse();
  split.expand();
  await wait();
  const menu = innerMenu(split)!;
  expect(menu.isOpen()).toBe(true);
  expect(split.trailingElement.getAttribute("aria-controls")).not.toBeNull();
  expect(split.trailingElement.hasAttribute("aria-controls")).toBe(madeControls);
  expect([...menu.element.querySelectorAll<HTMLElement>("[data-id]")].map(item => item.dataset.id)).toEqual(["csv", "json"]);
  menu.element.querySelector<HTMLElement>('[data-id="json"]')!.click();
  await wait(250);
  expect(selected).toEqual(["json"]);
  // The menu closing brings the split button back with it, as for one created with items
  expect(split.isExpanded()).toBe(false);
  expect(seen).toEqual(["expand", "collapse"]);
});

test("setItems on an expanded split button without a menu opens the menu it creates", async () => {
  const split = mount(createSplitButton({ text: "Export" }));
  await wait();
  split.expand();
  expect(split.isExpanded()).toBe(true);
  split.setItems([{ id: "csv", text: "CSV" }]);
  expect(innerMenu(split)!.isOpen()).toBe(true);
});

test("setItems after destroy() creates no menu", () => {
  const split = mount(createSplitButton({ text: "Export" }));
  split.destroy();
  expect(split.setItems([{ id: "csv", text: "CSV" }])).toBe(split);
  expect(innerMenu(split)).toBeUndefined();
  expect(split.getItems()).toEqual([]);
  expect(document.querySelector(".mtrl-menu")).toBeNull();
});

test("setItems([]) empties the menu and keeps it; on a split button without a menu it creates none", async () => {
  const split = mount(createSplitButton({ text: "Export" }));
  await wait();
  split.setItems([]);
  expect(innerMenu(split)).toBeUndefined();
  expect(split.getItems()).toEqual([]);
  split.setItems([{ id: "csv", text: "CSV" }]);
  const menu = innerMenu(split);
  split.setItems([]);
  expect(split.getItems()).toEqual([]);
  expect(innerMenu(split)).toBe(menu);
  expect(split.trailingElement.getAttribute("aria-haspopup")).toBe("menu");
  split.setItems([{ id: "json", text: "JSON" }]);
  expect(innerMenu(split)).toBe(menu);
  expect(split.getItems().map(item => "id" in item ? item.id : null)).toEqual(["json"]);
});
