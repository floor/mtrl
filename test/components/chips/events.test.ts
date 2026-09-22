import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { createChips, type ChipsConfig, type ChipsComponent, type ChipsEvents, type ChipComponent } from "../../../src/components/chips";

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
    // Destroy child instances explicitly: container lifecycle cleanup is separate from this contract.
    for (const chip of chips.getChips()) chip.destroy();
    chips.destroy();
  }
  dom.window.close();
});
const mount = (config: ChipsConfig = {}) => {
  const chips = createChips(config);
  instances.push(chips);
  document.body.append(chips.element);
  return chips;
};

describe("chips container events", () => {
  test("config add handlers receive each initial chip and later additions after insertion", () => {
    const added: ChipComponent[] = [];
    const parents: (HTMLElement | null)[] = [];
    const chips = mount({ chips: [{ value: "a", ripple: false }], on: { add: chip => {
      added.push(chip);
      parents.push(chip.element.parentElement);
    } } });
    expect(added).toEqual(chips.getChips());
    expect(chips.addChip({ value: "b", ripple: false })).toBe(chips);
    expect(added).toEqual(chips.getChips());
    expect(added.map(chip => chip.getValue())).toEqual(["a", "b"]);
    for (const parent of parents) expect(chips.element.contains(parent)).toBe(true);
  });

  test("click change passes both arguments, including valueless chips, and calls onChange", () => {
    const events: Parameters<ChipsEvents["change"]>[] = [];
    const callbacks: Parameters<ChipsEvents["change"]>[] = [];
    const chips = mount({ multiSelect: true, chips: [{ value: "a", ripple: false }, { ripple: false }],
      on: { change: (...args) => events.push(args) }, onChange: (...args) => callbacks.push(args) });
    const [a, blank] = chips.getChips();
    a.element.click();
    blank.element.click();
    a.element.click();
    expect(events).toEqual([[["a"], "a"], [["a", null], null], [[null], "a"]]);
    expect(callbacks).toEqual(events);
  });

  test("keyboard selection emits the same positional change contract", () => {
    const events: Parameters<ChipsEvents["change"]>[] = [];
    const chips = mount({ multiSelect: true, chips: [{ value: "a", ripple: false }] });
    chips.on("change", (...args) => events.push(args));
    chips.element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight" }));
    chips.element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter" }));
    expect(events).toEqual([[["a"], "a"]]);
  });

  test("programmatic selection and clearing emit null as the changed value", () => {
    const events: Parameters<ChipsEvents["change"]>[] = [];
    const chips = mount({ chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }] });
    chips.on("change", (...args) => events.push(args));
    chips.selectByValue("a").selectByValue("a").selectByValue("b").clearSelection().clearSelection();
    expect(events).toEqual([[["a"], null], [["b"], null], [[], null]]);
  });

  test("remove passes the live chip before destruction, by instance or index", () => {
    const chips = mount({ chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }] });
    const original = chips.getChips();
    const removed: ChipComponent[] = [];
    chips.on("remove", chip => {
      expect(chips.getChips()).toContain(chip);
      expect(chips.element.contains(chip.element)).toBe(true);
      removed.push(chip);
    });
    chips.removeChip(original[0]).removeChip(0).removeChip(0);
    expect(removed).toEqual(original);
    expect(chips.getChips()).toEqual([]);
    for (const chip of removed) expect(chip.element.isConnected).toBe(false);
  });

  test("on/off preserve chaining and remove only the requested listener", () => {
    const chips = mount();
    const first: ChipComponent[] = [];
    const second: ChipComponent[] = [];
    const handler: ChipsEvents["add"] = chip => first.push(chip);
    expect(chips.on("add", handler).on("add", chip => second.push(chip))).toBe(chips);
    chips.addChip({ value: "a", ripple: false });
    expect(chips.off("add", handler)).toBe(chips);
    chips.addChip({ value: "b", ripple: false });
    expect(first.map(chip => chip.getValue())).toEqual(["a"]);
    expect(second.map(chip => chip.getValue())).toEqual(["a", "b"]);
  });
});
