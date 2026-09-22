import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createList from "../../../src/components/list";
import type { ListComponent, ListConfig, ListItem } from "../../../src/components/list/types";

let dom: JSDOM;
let lists: ListComponent<ListItem>[];
beforeEach(() => {
  dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent });
  lists = [];
});
afterEach(() => { lists.forEach(list => list.destroy()); dom.window.close(); });
const mount = (items: ListItem[], config: Partial<ListConfig<ListItem>> = {}) => {
  const list = createList({ ...config, items }); lists.push(list); document.body.append(list.element); return list;
};
const row = (list: ListComponent<ListItem>, index = 0) => list.element.querySelectorAll<HTMLElement>(".mtrl-list__item")[index];
const action = (list: ListComponent<ListItem>, index = 0) => row(list, index).querySelector<HTMLButtonElement>(".mtrl-list__action")!;
const icon = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';

describe("Material list anatomy", () => {
  test("one-, two- and three-line rows expose headline, overline and supporting text", () => {
    const list = mount([{ headline: "One" }, { headline: "Two", supportingText: "Detail" }, { headline: "Three", overline: "Category", supportingText: "Detail" }, { headline: "Wrap", supportingText: "Two lines of details", lines: 3 }]);
    expect(Array.from(list.element.querySelectorAll("[data-lines]"), el => el.getAttribute("data-lines"))).toEqual(["1", "2", "3", "3"]);
    expect(row(list, 2).querySelector(".mtrl-list__overline")?.textContent).toBe("Category");
    expect(row(list, 2).querySelector(".mtrl-list__headline")?.textContent).toBe("Three");
    expect(row(list, 2).querySelector(".mtrl-list__supporting")?.textContent).toBe("Detail");
    expect(row(list, 3).classList.contains("mtrl-list__item--three-line")).toBe(true);
  });
  test("labels and metadata are literal text; icon HTML uses the shared sink", () => {
    const list = mount([{ headline: "<b>Headline</b>", supportingText: "<i>Text</i>", leading: { type: "icon", content: icon }, trailing: { type: "text", content: "<b>5 min</b>" } }]);
    expect(row(list).querySelector("b, i")).toBeNull();
    expect(row(list).querySelector(".mtrl-list__leading svg")).not.toBeNull();
    expect(row(list).querySelector(".mtrl-list__trailing")?.textContent).toBe("<b>5 min</b>");
  });
  for (const type of ["avatar", "image", "video"] as const) test(`${type} has a dedicated leading slot`, () => {
    const list = mount([{ headline: type, leading: { type, content: '<img src="media.png" alt="">' } }]);
    expect(row(list).querySelector(`.mtrl-list__leading--${type} img`)).not.toBeNull();
  });
  test("subheaders and dividers have their own anatomy and cannot be selected", () => {
    const list = mount([{ kind: "subheader", headline: "People", id: "heading" }, { id: "ada", headline: "Ada" }, { kind: "divider", inset: true, id: "separator" }, { headline: "Grace" }]);
    expect(list.element.querySelector(".mtrl-list__subheader")?.textContent).toBe("People");
    expect(list.element.querySelector('[role="separator"]')?.classList.contains("mtrl-list__divider--inset")).toBe(true);
    expect(list.element.querySelectorAll('[role="list"]')).toHaveLength(0); // Root owns the one list role.
    expect(list.element.getAttribute("role")).toBe("list");
    expect(list.element.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    list.setSelection(["heading", "separator", "ada"]);
    expect(list.getSelectedItemIds()).toEqual(["ada"]);
  });
  test("owned classes use BEM and labels are unique across two lists", () => {
    const first = mount([{ headline: "First", supportingText: "Detail" }]);
    const second = mount([{ headline: "Second", supportingText: "Detail" }]);
    expect(action(first).getAttribute("aria-labelledby")).not.toBe(action(second).getAttribute("aria-labelledby"));
    for (const list of [first, second]) for (const attribute of ["aria-labelledby", "aria-describedby"]) {
      const id = action(list).getAttribute(attribute)!;
      expect(list.element.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
    const custom = mount([{ headline: "Custom", leading: { type: "icon", content: icon } }], { class: "people-list" });
    expect(custom.element.querySelector(".mtrl-list__item .mtrl-list__headline")?.textContent).toBe("Custom");
    expect(custom.element.classList.contains("people-list")).toBe(true);
  });
  test("configuration is not mutated; zero and quoted IDs survive selection and scrolling", () => {
    const items = [{ id: 0, headline: "Zero" }, { id: 'a"b]', headline: "Quoted" }];
    const config = { items };
    const list = createList(config); lists.push(list); document.body.append(list.element);
    expect("renderItem" in config).toBe(false);
    list.selectItem(0).selectItem('a"b]');
    expect(list.getSelectedItems()).toEqual(items);
    expect(row(list).getAttribute("data-id")).toBe("0");
    let called = false; row(list, 1).scrollIntoView = () => { called = true; };
    list.scrollToItem('a"b]'); expect(called).toBe(true);
  });
  test("custom renderers retain their nodes and independent controls", () => {
    const control = document.createElement("button"); control.textContent = "More";
    let calls = 0; control.addEventListener("click", () => calls++);
    const list = mount([{ headline: "Custom" }], { renderItem: () => { const el = document.createElement("div"); el.append(control); return el; } });
    expect(row(list).contains(control)).toBe(true);
    control.click(); expect(calls).toBe(1); expect(list.getSelectedItems()).toEqual([]);
  });
  test("an interactive custom root is never wrapped inside another button", () => {
    const button = document.createElement("button"); button.textContent = "Custom action";
    const list = mount([{ headline: "Row" }], { renderItem: () => button });
    expect(row(list).contains(button)).toBe(true);
    expect(button.contains(action(list))).toBe(false);
    expect(action(list).contains(button)).toBe(false);
    button.click(); expect(list.getSelectedItemIds()).toEqual([]);
  });
  test("duplicate IDs are rejected without replacing an existing render", async () => {
    const items: ListItem[] = [{ id: "a", headline: "A" }];
    const list = mount(items); const original = row(list);
    items.push({ id: "a", headline: "Duplicate" });
    await expect(list.refresh()).rejects.toThrow("Duplicate list item ID: a");
    expect(row(list)).toBe(original);
  });
  test("refresh drops removed selections and keeps a focused row focused", async () => {
    const items: ListItem[] = [{ id: "a", headline: "A" }, { id: "b", headline: "B" }];
    const list = mount(items); list.selectItem("a"); action(list, 1).focus();
    items.shift(); await list.refresh();
    expect(list.getSelectedItemIds()).toEqual([]);
    expect(document.activeElement).toBe(action(list));
    expect(row(list).getAttribute("data-id")).toBe("b");
  });
  test("an empty item still has a named primary action", () => {
    const list = mount([{}]);
    expect(action(list).hasAttribute("aria-labelledby")).toBe(false);
    expect(action(list).getAttribute("aria-label")).toBe("Select item");
  });
  test("empty and non-selectable lists render without a redundant focus stop", () => {
    const empty = mount([]); expect(empty.element.textContent).toBe("No items");
    const list = mount([{ headline: "Static" }], { trackSelection: false });
    expect(list.element.hasAttribute("tabindex")).toBe(false);
    expect(row(list).querySelector("button")).toBeNull();
    row(list).click(); list.selectItem(0); expect(list.getSelectedItemIds()).toEqual([]);
  });
});

describe("real list selection and lifecycle", () => {
  test("selection is immediately reflected and refresh preserves it", async () => {
    const list = mount([{ id: "a", headline: "A", selected: true }, { id: "b", headline: "B" }]);
    expect(action(list).getAttribute("aria-pressed")).toBe("true");
    action(list, 1).click(); expect(list.getSelectedItemIds()).toEqual(["b"]);
    expect(action(list).getAttribute("aria-pressed")).toBe("false");
    await list.refresh(); expect(action(list, 1).getAttribute("aria-pressed")).toBe("true");
  });
  test("select events are cancellable, receive this final API, and off works", () => {
    const list = mount([{ id: "a", headline: "A" }]);
    let calls = 0;
    const handler = (event: { component: ListComponent<ListItem>; preventDefault(): void }) => { calls++; expect(event.component).toBe(list); event.preventDefault(); };
    list.on("select", handler); action(list).click(); expect(calls).toBe(1); expect(list.getSelectedItems()).toEqual([]);
    list.off("select", handler); action(list).click(); expect(list.getSelectedItemIds()).toEqual(["a"]);
  });
  test("multi-selection toggles independently; unknown IDs never create phantom selections", () => {
    const list = mount([{ id: "a", headline: "A" }, { id: "b", headline: "B" }], { multiSelect: true, initialSelection: ["missing"] });
    expect(list.getSelectedItemIds()).toEqual([]);
    action(list).click(); action(list, 1).click(); action(list).click(); expect(list.getSelectedItemIds()).toEqual(["b"]);
    list.selectItem("missing"); expect(list.getSelectedItemIds()).toEqual(["b"]);
  });
  test("disabled rows reject user activation but remain selectable by code", () => {
    const list = mount([{ id: "a", headline: "Disabled", disabled: true }]);
    expect(action(list).disabled).toBe(true);
    expect(row(list).hasAttribute("inert")).toBe(false);
    expect(row(list).getAttribute("aria-disabled")).toBe("true");
    row(list).click(); expect(list.getSelectedItems()).toEqual([]);
    list.selectItem("a"); expect(action(list).getAttribute("aria-pressed")).toBe("true");
  });
  test("slot controls keep their own listeners without selecting the row", async () => {
    const button = document.createElement("button"); button.textContent = "More";
    let calls = 0; button.addEventListener("click", () => calls++);
    const list = mount([{ headline: "Row", trailing: { type: "control", content: button } }]);
    expect(action(list).contains(button)).toBe(false);
    button.click(); await list.refresh(); button.click(); expect(calls).toBe(2); expect(list.getSelectedItems()).toEqual([]);
  });
  test("arrow and boundary navigation skips disabled rows and structural entries", () => {
    const list = mount([{ headline: "First" }, { kind: "divider" }, { headline: "Disabled", disabled: true }, { headline: "Last" }]);
    action(list).focus();
    action(list).dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(action(list, 2));
    action(list, 2).dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(action(list));
  });
  test("destroy releases retained row listeners and refresh cannot recreate destroyed content", async () => {
    const first = mount([{ headline: "First" }]); const second = mount([{ headline: "Second" }]);
    const retained = action(first); let calls = 0; first.on("select", () => calls++);
    first.destroy(); retained.click(); await first.refresh(); expect(calls).toBe(0); expect(first.element.querySelector(".mtrl-list__item")).toBeNull();
    action(second).click(); expect(second.getSelectedItemIds()).toEqual(["0"]);
  });
});
