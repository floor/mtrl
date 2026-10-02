// FLO-553: scrollToChip leaves the scroll behaviour to the stylesheet. It
// passed `behavior: "smooth"`, which overrides CSS: under reduced motion the
// reset's `scroll-behavior: auto` was ignored and the set still glided.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { compileString } from "sass";
import { createChips, type ChipsComponent } from "../../../src/components/chips";

let dom: JSDOM;
let set: ChipsComponent;
let calls: ScrollToOptions[];
beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><body></body>", { url: "http://localhost/", pretendToBeVisual: true });
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  });
  calls = [];
  // JSDOM has no layout and no scrollTo: record what the set asks for
  dom.window.HTMLElement.prototype.scrollTo = function (options?: ScrollToOptions | number) {
    if (typeof options === "object") calls.push(options);
  } as typeof HTMLElement.prototype.scrollTo;
});
afterEach(() => {
  for (const chip of set.getChips()) chip.destroy();
  set.destroy();
  dom.window.close();
});
const make = (vertical: boolean): ChipsComponent => {
  set = createChips({ scrollable: true, vertical, chips: [{ value: "a", ripple: false }, { value: "b", ripple: false }] });
  document.body.append(set.element);
  return set;
};

describe("scrollToChip", () => {
  test("scrolls the container to the chip and names no behaviour, horizontally and vertically", () => {
    make(false).scrollToChip(1);
    expect(calls).toHaveLength(1);
    expect(Object.keys(calls[0]!)).toEqual(["left"]);
    expect(typeof calls[0]!.left).toBe("number");
    for (const chip of set.getChips()) chip.destroy();
    set.destroy();
    calls = [];
    make(true).scrollToChip(set.getChips()[1]!);
    expect(calls).toHaveLength(1);
    expect(Object.keys(calls[0]!)).toEqual(["top"]);
  });

  test("the stylesheets scroll the chips, the tabs and the search suggestions smoothly, and the reset stops it under reduced motion", () => {
    const chips = compileString(`@use 'components/chips';`, { loadPaths: ["src/styles"], style: "compressed" }).css;
    expect(chips).toMatch(/\.mtrl-chips--scrollable \.mtrl-chips__container\{[^}]*scroll-behavior:smooth/);
    // The tabs' and the search's scrollers, whose scripts name no behaviour either
    const tabs = compileString(`@use 'components/tabs';`, { loadPaths: ["src/styles"], style: "compressed" }).css;
    expect(tabs).toMatch(/\.mtrl-tabs__scroll\{[^}]*scroll-behavior:smooth/);
    const search = compileString(`@use 'components/search';`, { loadPaths: ["src/styles"], style: "compressed" }).css;
    expect(search).toMatch(/\.mtrl-search__suggestions\{[^}]*scroll-behavior:smooth/);
    const reset = compileString(`@use 'base/reset';`, { loadPaths: ["src/styles"], style: "compressed" }).css;
    expect(reset).toMatch(/@media\(prefers-reduced-motion: reduce\)\{.*?\*,\*::before,\*::after\{[^}]*scroll-behavior:auto !important/);
  });
});
