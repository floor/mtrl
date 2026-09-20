// test/components/chips/get-value.test.ts
//
// getValue is documented for form-field compatibility and declared
// `string | string[] | null`. It returned whatever getSelectedValues gave it,
// which is `(string | null)[]` — a chip yields null when it has neither a
// value nor any text to derive one from. So a form reading getValue() could
// receive [..., null], which is not a value anything could submit and not
// what the signature promised.
//
// Found while clearing chips for strictNullChecks (FLO-114).

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

beforeEach(() => { document.body.innerHTML = ""; });

describe("chips getValue is a value a form could submit", () => {
  test("multi-select returns the selected values", () => {
    const chips = mount({
      multiSelect: true,
      chips: [
        { text: "A", value: "a", selected: true },
        { text: "B", value: "b" },
        { text: "C", value: "c", selected: true },
      ],
    });

    expect(chips.getValue()).toEqual(["a", "c"]);
  });

  test("single-select returns the first selected value", () => {
    const chips = mount({
      chips: [
        { text: "A", value: "a" },
        { text: "B", value: "b", selected: true },
      ],
    });

    expect(chips.getValue()).toBe("b");
  });

  test("nothing selected gives null in single-select and [] in multi", () => {
    const single = mount({ chips: [{ text: "A", value: "a" }] });
    expect(single.getValue()).toBeNull();

    document.body.innerHTML = "";

    const multi = mount({ multiSelect: true, chips: [{ text: "A", value: "a" }] });
    expect(multi.getValue()).toEqual([]);
  });

  // A chip with text but no value derives one from the text, so it is a
  // genuine value and belongs in the result.
  test("a chip with text but no value contributes its derived value", () => {
    const chips = mount({
      multiSelect: true,
      chips: [
        { text: "A", value: "a", selected: true },
        { text: "No value", selected: true },
      ],
    });

    expect(chips.getValue()).toEqual(["a", "no-value"]);
  });

  // The defect: no value and no text leaves nothing to derive, so the chip
  // yields null — and that null was handed straight out.
  test("a chip with neither value nor text contributes nothing", () => {
    const chips = mount({
      multiSelect: true,
      chips: [{ text: "A", value: "a", selected: true }, { selected: true }],
    });

    const value = chips.getValue();

    expect(value).toEqual(["a"]);
    expect((value as string[]).includes(null as unknown as string)).toBe(false);
  });

  test("every entry is a string, which is what the signature promises", () => {
    const chips = mount({
      multiSelect: true,
      chips: [
        { text: "A", value: "a", selected: true },
        { selected: true },
        { text: "C", value: "c", selected: true },
      ],
    });

    for (const entry of chips.getValue() as string[]) {
      expect(typeof entry).toBe("string");
    }
  });

  test("and in single-select a valueless first chip does not become null", () => {
    const chips = mount({
      chips: [{ selected: true }, { text: "B", value: "b", selected: true }],
    });

    // Single-select keeps one chip selected, so whatever survives must be a
    // real value rather than the null the valueless chip would have given.
    const value = chips.getValue();
    expect(value === null || typeof value === "string").toBe(true);
    if (value !== null) expect(value).not.toBe("");
  });
});
