// test/components/chips/select-by-value.test.ts
//
// selectByValue is public and had no coverage at all. It is also where the two
// null comparisons live that FLO-114 had to make explicit: a chip yields null
// from getValue() when it has neither a value nor text to derive one from, and
// the code asked `valueArray.includes(chipValue)` with that null in hand.
//
// `["a"].includes(null)` is false, so the guard says what the runtime already
// did — these tests are what says so out loud, and what would notice if
// someone "simplified" the guard into something that matches null.

import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "Element", "Node",
  "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "CustomEvent",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import { createChips } from "../../../src/components/chips";

const mount = (config: Record<string, unknown>) => {
  const chips = createChips(config as never);
  document.body.append(chips.element);
  return chips;
};

const THREE = [
  { text: "Red", value: "red" },
  { text: "Green", value: "green" },
  { text: "Blue", value: "blue" },
];

beforeEach(() => { document.body.innerHTML = ""; });

describe("selectByValue", () => {
  test("selects the chip carrying that value", () => {
    const chips = mount({ chips: THREE, multiSelect: true });

    chips.selectByValue("green");

    expect(chips.getSelectedValues()).toEqual(["green"]);
  });

  test("takes an array and selects each one", () => {
    const chips = mount({ chips: THREE, multiSelect: true });

    chips.selectByValue(["red", "blue"]);

    expect(chips.getSelectedValues().sort()).toEqual(["blue", "red"]);
  });

  test("a value no chip carries selects nothing", () => {
    const chips = mount({ chips: THREE, multiSelect: true });

    chips.selectByValue("magenta");

    expect(chips.getSelectedValues()).toEqual([]);
  });

  // Exclusive is the default for a single-select chip set: selecting one
  // clears whatever was selected before.
  test("selecting replaces the previous selection by default", () => {
    const chips = mount({ chips: THREE });

    chips.selectByValue("red");
    chips.selectByValue("blue");

    expect(chips.getSelectedValues()).toEqual(["blue"]);
  });

  test("and in multiSelect the earlier one is dropped too, unless asked for both", () => {
    const chips = mount({ chips: THREE, multiSelect: true });

    chips.selectByValue(["red", "green"]);

    expect(chips.getSelectedValues().sort()).toEqual(["green", "red"]);
  });

  test("selecting nothing clears the selection", () => {
    const chips = mount({ chips: THREE });
    chips.selectByValue("red");

    chips.selectByValue([]);

    expect(chips.getSelectedValues()).toEqual([]);
  });
});

// A chip with neither a value nor text has no value to match on. It must not
// be swept up by a selectByValue for something else, and it must not be
// matched by an empty request.
describe("a chip with no value of its own", () => {
  const WITH_A_BLANK = [
    { text: "Red", value: "red" },
    {},
    { text: "Blue", value: "blue" },
  ];

  test("is never selected by a value another chip carries", () => {
    const chips = mount({ chips: WITH_A_BLANK, multiSelect: true });

    chips.selectByValue("red");

    expect(chips.getSelectedValues()).toEqual(["red"]);
  });

  test("and selecting the others leaves it alone", () => {
    const chips = mount({ chips: WITH_A_BLANK, multiSelect: true });

    chips.selectByValue(["red", "blue"]);

    const selected = chips.getSelectedValues();
    expect(selected.sort()).toEqual(["blue", "red"]);
    expect(selected).not.toContain(null);
  });
});
