// FLO-533: a chip destroyed directly (chip.destroy(), not the set's removeChip)
// must leave the set. Until it does, the set still counts it, so a single-select
// set can report two selected chips, and the arrows stop on the detached chip.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { createChips, type ChipsConfig, type ChipsComponent } from "../../../src/components/chips";

let dom: JSDOM;
let instances: ChipsComponent[];
beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><body></body>", { url: "http://localhost/", pretendToBeVisual: true });
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  });
  instances = [];
});
afterEach(() => {
  for (const chips of instances) {
    for (const chip of chips.getChips()) chip.destroy();
    chips.destroy();
  }
  dom.window.close();
});
const mount = (config: ChipsConfig) => {
  const chips = createChips(config);
  instances.push(chips);
  document.body.append(chips.element);
  return chips;
};
const press = (target: Element, key: string) =>
  target.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
const three = (multiSelect: boolean, selected: string[] = []): ChipsConfig => ({
  multiSelect,
  chips: ["a", "b", "c"].map(value => ({
    label: value.toUpperCase(),
    value,
    selected: selected.includes(value),
    ripple: false,
  })),
});
const values = (chips: ChipsComponent) => chips.getChips().map(chip => chip.getValue());
const focusedValue = () => (document.activeElement as HTMLElement | null)?.getAttribute("data-value") ?? null;

describe("a chip destroyed directly leaves a single-select set", () => {
  test("setSelected(true) on it, after another chip is selected, does not add a second selection", () => {
    const chips = mount(three(false, ["a"]));
    const [, b, c] = chips.getChips();
    b!.destroy();
    c!.setSelected(true);
    b!.setSelected(true);
    expect(chips.getSelectedChips().map(chip => chip.getValue())).toEqual(["c"]);
    expect(chips.getSelectedChips()).toHaveLength(1);
    expect(chips.getValue()).toBe("c");
    expect(chips.getSelectedValues()).toEqual(["c"]);
  });

  test("the set's list no longer contains it", () => {
    const chips = mount(three(false, ["a"]));
    const [, b] = chips.getChips();
    b!.destroy();
    expect(values(chips)).toEqual(["a", "c"]);
    expect(chips.getChips()).toHaveLength(2);
    expect(b!.element.isConnected).toBe(false);
  });

  test("getValue and getSelectedValues omit it when it was selected", () => {
    const chips = mount(three(false, ["a"]));
    chips.getChips()[0]!.destroy();
    expect(chips.getValue()).toBe(null);
    expect(chips.getSelectedValues()).toEqual([]);
    expect(chips.getSelectedChips()).toHaveLength(0);
    expect(values(chips)).toEqual(["b", "c"]);
  });

  test("arrow keys move across the gap", () => {
    const chips = mount(three(false, ["a"]));
    const [a, b, c] = chips.getChips();
    a!.focus();
    b!.destroy();
    press(a!.element, "ArrowRight");
    expect(focusedValue()).toBe(c!.getValue());
    press(c!.element, "ArrowLeft");
    expect(focusedValue()).toBe(a!.getValue());
  });
});

describe("a chip destroyed directly leaves a multi-select set", () => {
  test("getValue and getSelectedValues omit a selected chip", () => {
    const chips = mount(three(true, ["a", "b"]));
    chips.getChips()[1]!.destroy();
    expect(chips.getValue()).toEqual(["a"]);
    expect(chips.getSelectedValues()).toEqual(["a"]);
    expect(chips.getSelectedChips()).toHaveLength(1);
    expect(values(chips)).toEqual(["a", "c"]);
  });

  test("setSelected(true) on it does not add it to the selection", () => {
    const chips = mount(three(true, ["a"]));
    const [, b, c] = chips.getChips();
    b!.destroy();
    c!.setSelected(true);
    b!.setSelected(true);
    expect(chips.getSelectedValues()).toEqual(["a", "c"]);
    expect(chips.getValue()).toEqual(["a", "c"]);
    expect(chips.getSelectedChips()).toHaveLength(2);
  });

  test("arrow keys move across the gap", () => {
    const chips = mount(three(true, ["a"]));
    const [a, b, c] = chips.getChips();
    a!.focus();
    b!.destroy();
    press(a!.element, "ArrowRight");
    expect(focusedValue()).toBe(c!.getValue());
    press(c!.element, "ArrowLeft");
    expect(focusedValue()).toBe(a!.getValue());
  });
});

describe("what already holds when a chip is destroyed directly", () => {
  test("onChange, change and remove stay quiet, selected or not, single or multi", () => {
    for (const multiSelect of [false, true]) {
      for (const selected of [false, true]) {
        const callbacks: unknown[] = [];
        const events: string[] = [];
        const chips = mount({
          ...three(multiSelect, selected ? ["a"] : []),
          onChange: event => callbacks.push(event),
        });
        chips.on("change", () => events.push("change"));
        chips.on("remove", () => events.push("remove"));
        chips.getChips()[0]!.destroy();
        expect(callbacks).toEqual([]);
        expect(events).toEqual([]);
      }
    }
  });

  test("destroying an unselected chip leaves the current value", () => {
    const single = mount(three(false, ["a"]));
    single.getChips()[1]!.destroy();
    expect(single.getValue()).toBe("a");
    expect(single.getSelectedValues()).toEqual(["a"]);
    expect(single.getSelectedChips()).toHaveLength(1);

    const multi = mount(three(true, ["a"]));
    multi.getChips()[1]!.destroy();
    expect(multi.getValue()).toEqual(["a"]);
    expect(multi.getSelectedValues()).toEqual(["a"]);
    expect(multi.getSelectedChips()).toHaveLength(1);
  });

  test("setSelected on a chip that is still in the set replaces the single selection, silently", () => {
    const callbacks: unknown[] = [];
    const events: string[] = [];
    const chips = mount({
      ...three(false, ["a"]),
      onChange: event => callbacks.push(event),
    });
    chips.on("change", () => events.push("change"));
    const [a, b] = chips.getChips();
    a!.destroy();
    b!.setSelected(true);
    expect(chips.getSelectedChips().map(chip => chip.getValue())).toEqual(["b"]);
    expect(chips.getValue()).toBe("b");
    expect(chips.getSelectedValues()).toEqual(["b"]);
    expect(callbacks).toEqual([]);
    expect(events).toEqual([]);
  });

  test("destroying the set emits nothing and does not throw", () => {
    const events: string[] = [];
    const chips = mount({
      ...three(false, ["a"]),
      onChange: () => events.push("onChange"),
    });
    chips.on("change", () => events.push("change"));
    chips.on("remove", () => events.push("remove"));
    chips.on("add", () => events.push("add"));
    chips.getChips()[1]!.destroy();
    expect(() => chips.destroy()).not.toThrow();
    expect(events).toEqual([]);
  });

  test("removeChip still removes that one chip and emits remove once", () => {
    const chips = mount(three(false, ["a"]));
    const [, b] = chips.getChips();
    const removed: (string | null)[] = [];
    const changes: unknown[] = [];
    chips.on("remove", event => removed.push(event.chipValue));
    chips.on("change", event => changes.push(event));
    chips.removeChip(b!);
    expect(removed).toEqual(["b"]);
    expect(changes).toEqual([]);
    expect(values(chips)).toEqual(["a", "c"]);
    expect(chips.getValue()).toBe("a");
    b!.setSelected(true);
    expect(chips.getValue()).toBe("a");
    expect(removed).toEqual(["b"]);
  });
});
