import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { createAssistChip, createFilterChip, createInputChip, createSuggestionChip, createChips, type ChipComponent, type ChipConfig } from "../../../src/components/chips";
import * as publicAPI from "../../../src";

let dom: JSDOM;
let chips: ChipComponent[];
let groups: ReturnType<typeof createChips>[];
beforeEach(() => {
  dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost/", pretendToBeVisual: true });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) });
  chips = []; groups = [];
});
afterEach(() => { for (const group of groups) group.destroy(); for (const chip of chips) chip.destroy(); dom.window.close(); });
const mount = (chip: ChipComponent) => { chips.push(chip); document.body.append(chip.element); return chip; };
const group = (items: ChipConfig[], multiSelect = true) => {
  const result = createChips({ chips: items, multiSelect });
  groups.push(result); document.body.append(result.element); return result;
};
const factories = { assist: createAssistChip, filter: createFilterChip, input: createInputChip, suggestion: createSuggestionChip } as const;
const ICON = '<svg viewBox="0 0 24 24"><path d="M1 1h10v10z"/></svg>';

describe("Material chip factories", () => {
  test("the four factories are exported; the generic factory and legacy variants are gone", () => {
    for (const [name, factory] of Object.entries(factories)) expect(publicAPI[`create${name[0].toUpperCase()}${name.slice(1)}Chip` as keyof typeof publicAPI]).toBe(factory);
    expect("createChip" in publicAPI).toBe(false);
  });
  for (const [type, factory] of Object.entries(factories)) {
    test(`${type}: a native, named action with fixed type and literal label text`, () => {
      const chip = mount(factory({ label: "<b>Label</b>", ripple: false }));
      expect(type).toBe(chip.getType());
      expect(chip.element.classList.contains(`mtrl-chip--${type}`)).toBe(true);
      expect(chip.element.classList.contains("mtrl-chip--filled")).toBe(false);
      expect(chip.action.tagName).toBe("BUTTON");
      expect(chip.action.type).toBe("button");
      expect(chip.action.textContent).toBe("<b>Label</b>");
      expect(chip.action.querySelector("b")).toBeNull();
      expect(chip.action.getAttribute("role")).toBe(["filter", "input"].includes(type) ? "checkbox" : null);
    });
    test(`${type}: disabled controls block activation and can be re-enabled`, () => {
      let calls = 0;
      const chip = mount(factory({ label: "Disabled", disabled: true, ripple: false, onClick: () => calls++ }));
      chip.action.click(); chip.element.click();
      expect(calls).toBe(0);
      expect(chip.isDisabled()).toBe(true);
      expect(chip.action.disabled).toBe(true);
      expect(chip.enable()).toBe(chip);
      chip.action.click();
      expect(calls).toBe(1);
      expect(chip.disable()).toBe(chip);
      chip.action.click();
      expect(calls).toBe(1);
    });
  }
  for (const factory of [createAssistChip, createSuggestionChip]) {
    test(`${factory.name} remains an action, never a selection`, () => {
      const chip = mount(factory({ label: "Action", ripple: false }));
      chip.action.click(); chip.setSelected(true).toggleSelected();
      expect(chip.isSelected()).toBe(false);
      expect(chip.action.hasAttribute("aria-checked")).toBe(false);
      expect(chip.element.hasAttribute("aria-selected")).toBe(false);
    });
  }
  for (const factory of [createFilterChip, createInputChip]) {
    test(`${factory.name} toggles once and reports the finished component`, () => {
      const callbacks: [boolean, ChipComponent][] = [];
      const events: boolean[] = [];
      const chip = mount(factory({ label: "Toggle", ripple: false, onChange: (selected, instance) => callbacks.push([selected, instance]) }));
      chip.on("change", payload => { expect(payload.chip).toBe(chip); events.push(payload.selected); });
      chip.action.click();
      expect(chip.action.getAttribute("aria-checked")).toBe("true");
      expect(chip.element.querySelector<HTMLElement>(".mtrl-chip__checkmark")?.hidden).toBe(false);
      chip.action.click();
      expect(callbacks).toEqual([[true, chip], [false, chip]]);
      expect(events).toEqual([true, false]);
      chip.setSelected(true);
      expect(events).toHaveLength(2);
    });
  }
  for (const factory of [createFilterChip, createInputChip]) test(`${factory.name}: selection replaces the leading icon instead of duplicating it`, () => {
    const chip = mount(factory({ label: "Selectable", leadingIcon: ICON, ripple: false }));
    const leading = chip.element.querySelector<HTMLElement>(".mtrl-chip__leading-icon")!;
    const check = chip.element.querySelector<HTMLElement>(".mtrl-chip__checkmark")!;
    expect(leading.hidden).toBe(false); expect(check.hidden).toBe(true);
    chip.setSelected(true);
    expect(leading.hidden).toBe(true); expect(check.hidden).toBe(false);
    chip.setSelected(false);
    expect(leading.hidden).toBe(false); expect(check.hidden).toBe(true);
  });
  test("input avatar takes precedence over the leading icon and survives selection", () => {
    const chip = mount(createInputChip({ label: "Ada", avatar: '<img src="ada.png" alt="">', leadingIcon: ICON, selected: true, ripple: false }));
    expect(chip.element.querySelector(".mtrl-chip__leading-icon img")).not.toBeNull();
    expect(chip.element.querySelector<HTMLElement>(".mtrl-chip__checkmark")?.hidden).toBe(true);
  });
  test("removal is a separate named button and does not activate or select the chip", () => {
    const requests: ChipComponent[] = [];
    let clicks = 0;
    const chip = mount(createInputChip({ label: "Ada", ripple: false, onClick: () => clicks++, onRemove: instance => requests.push(instance) }));
    const remove = chip.element.querySelector<HTMLButtonElement>(".mtrl-chip__remove")!;
    expect(remove.parentElement).toBe(chip.action.parentElement);
    expect(chip.action.contains(remove)).toBe(false);
    expect(remove.getAttribute("aria-label")).toBe("Remove Ada");
    remove.click();
    expect(requests).toEqual([chip]); expect(clicks).toBe(0); expect(chip.isSelected()).toBe(false);
    expect(chip.element.isConnected).toBe(true); // Removal is the owner's choice.
    chip.setLabel("Grace"); expect(remove.getAttribute("aria-label")).toBe("Remove Grace");
    chip.disable(); expect(remove.disabled).toBe(true); remove.click(); expect(requests).toHaveLength(1);
  });
  test("label/icon setters use the shared API, update existing nodes and retain explicit values", () => {
    const chip = mount(createAssistChip({ label: "First", value: "id", ripple: false }));
    expect(chip.setText("Second").setLeadingIcon(ICON).setTrailingIcon(ICON)).toBe(chip);
    expect(chip.getLabel()).toBe("Second"); expect(chip.getText()).toBe("Second"); expect(chip.getValue()).toBe("id");
    expect(chip.getIcon()).toBe(ICON);
    chip.setIcon("").setTrailingIcon("");
    expect(chip.element.querySelector<HTMLElement>(".mtrl-chip__leading-icon")?.hidden).toBe(true);
    expect(chip.element.querySelector<HTMLElement>(".mtrl-chip__trailing-icon")?.hidden).toBe(true);
    expect(chip.element.querySelectorAll(".mtrl-chip__label")).toHaveLength(1);
  });
  test("off and destroy release listeners, including removal callbacks", () => {
    let calls = 0;
    const chip = mount(createInputChip({ label: "Ada", ripple: false, onClick: () => calls++, onRemove: () => calls++ }));
    const listener = () => calls++;
    chip.on("change", listener).off("change", listener);
    chip.action.click(); expect(calls).toBe(1);
    const remove = chip.element.querySelector<HTMLButtonElement>(".mtrl-chip__remove")!;
    chip.destroy(); chip.action.click(); remove.click(); chip.element.click();
    expect(calls).toBe(1); expect(chip.element.isConnected).toBe(false);
  });
});

describe("chips-container integration", () => {
  test("mixed groups select only filter/input chips", () => {
    const set = group([{ type: "assist", label: "Action" }, { type: "suggestion", label: "Suggest" }, { type: "filter", label: "Filter" }, { type: "input", label: "Input" }]);
    for (const chip of set.getChips()) chip.action.click();
    expect(set.getSelectedValues()).toEqual(["filter", "input"]);
    for (const chip of set.getChips()) expect(chip.element.hasAttribute("aria-selected")).toBe(false);
  });
  test("a bubbled keyboard activation toggles once; input removal does not select", () => {
    const set = group([{ label: "Filter" }, { type: "input", label: "Input" }]);
    const [filter, input] = set.getChips();
    filter.focus();
    filter.action.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(set.getSelectedValues()).toEqual(["filter"]);
    input.element.querySelector<HTMLButtonElement>(".mtrl-chip__remove")!.click();
    expect(set.getChips()).toEqual([filter]);
    expect(set.getSelectedValues()).toEqual(["filter"]);
  });
  test("arrow navigation skips disabled native actions", () => {
    const set = group([{ label: "First" }, { label: "Disabled", disabled: true }, { label: "Last" }]);
    const [first, , last] = set.getChips();
    first.focus();
    first.action.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last.action);
    last.action.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first.action);
  });
  test("destroy tears down child chips and ignores retained DOM references", () => {
    let calls = 0;
    const set = group([{ label: "Filter", onClick: () => calls++ }]);
    const [chip] = set.getChips();
    set.on("change", () => calls++);
    set.destroy(); chip.action.click(); chip.element.click();
    expect(calls).toBe(0); expect(set.getChips()).toEqual([]);
  });
});
