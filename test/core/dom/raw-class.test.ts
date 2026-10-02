// test/core/dom/raw-class.test.ts
//
// 1.0 removed `rawClass` (FLO-117 made class and className unprefixed, so it
// did what they do), and no longer reserves the key. A 0.10 caller that still
// passes it gets no class: like any unknown option it is written out as an
// attribute, `rawclass`.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { createElement } from "../../../src/core/dom/create";

let dom: JSDOM;
beforeAll(() => {
  dom = new JSDOM("<!doctype html><body></body>");
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node });
});
afterAll(() => dom.window.close());

test("a leftover rawClass applies no class and is written out as a rawclass attribute; class is the way", () => {
  const element = createElement({ rawClass: "legacy-a legacy-b" } as Parameters<typeof createElement>[0]);
  expect(element.className).toBe("");
  expect(element.outerHTML).toBe('<div rawclass="legacy-a legacy-b"></div>');
  const list = createElement({ rawClass: ["a", "b"] } as Parameters<typeof createElement>[0]);
  expect(list.getAttribute("rawclass")).toBe("a,b");
  expect(createElement({ class: "legacy-a legacy-b" }).className).toBe("legacy-a legacy-b");
});
