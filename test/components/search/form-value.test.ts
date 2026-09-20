// test/components/search/form-value.test.ts
//
// Search declared no `name` option and its text input never got one, so a
// name given to the search landed on the root div and submitted nothing
// (N12). The name now goes on the real input.
//
// Everything goes through `new FormData(form)`, because what is being tested
// is whether the browser would actually submit the value.

import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.InputEvent = dom.window.InputEvent;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.FormData = dom.window.FormData;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createSearch from "../../../src/components/search";

/** A search inside a form, as a page would have it. */
const inForm = (config: Record<string, unknown>) => {
  const form = document.createElement("form");
  document.body.append(form);
  const search = createSearch(config as never);
  form.append(search.element);
  return { form, search, submitted: () => new dom.window.FormData(form) };
};

const inputOf = (form: HTMLElement) =>
  form.querySelector("input") as HTMLInputElement;

beforeEach(() => { document.body.innerHTML = ""; });

describe("a named search takes part in a form", () => {
  test("it submits its initial value", () => {
    const { submitted } = inForm({ name: "q", value: "shoes" });
    expect(submitted().get("q")).toBe("shoes");
  });

  // The precise shape of the defect: the name must be on the input, because
  // a name on the root div is not a form field at all.
  test("the name is on the input, not on the root", () => {
    const { form, search } = inForm({ name: "q", value: "shoes" });

    expect(inputOf(form).getAttribute("name")).toBe("q");
    expect(search.element.getAttribute("name")).toBeNull();
  });

  test("it submits the value after a programmatic change", () => {
    const { search, submitted } = inForm({ name: "q", value: "shoes" });

    search.setValue("boots");

    expect(submitted().get("q")).toBe("boots");
  });

  test("it submits what someone typed", () => {
    const { form, submitted } = inForm({ name: "q" });
    const input = inputOf(form);

    input.value = "boots";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));

    expect(submitted().get("q")).toBe("boots");
  });

  test("an empty search submits an empty value under its name", () => {
    const { submitted } = inForm({ name: "q" });
    expect(submitted().get("q")).toBe("");
  });

  test("without a name it submits nothing at all", () => {
    const { submitted } = inForm({ value: "shoes" });
    expect([...submitted().keys()]).toEqual([]);
  });

  test("a disabled search submits nothing", () => {
    const { submitted } = inForm({ name: "q", value: "shoes", disabled: true });
    expect(submitted().has("q")).toBe(false);
  });

  test("two searches in one form submit their own values", () => {
    const form = document.createElement("form");
    document.body.append(form);
    const first = createSearch({ name: "q", value: "shoes" } as never);
    const second = createSearch({ name: "where", value: "paris" } as never);
    form.append(first.element, second.element);

    const data = new dom.window.FormData(form);
    expect(data.get("q")).toBe("shoes");
    expect(data.get("where")).toBe("paris");
  });
});
