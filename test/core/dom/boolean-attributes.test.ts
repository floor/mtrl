// test/core/dom/boolean-attributes.test.ts
//
// FLO-240. An HTML boolean attribute is true whenever it is present, whatever
// its value: `disabled="false"` is a disabled control, exactly like
// `disabled=""` or `disabled="disabled"`. Every path that wrote an attribute
// did `String(value)`, so asking for `disabled: false` produced the opposite
// of what was asked.
//
// Measured before the fix:
//
//   createElement({ tag: "button", disabled: false })
//     attribute : "false"
//     .disabled : true
//     outerHTML : <button disabled="false"></button>
//
// It was not a datepicker problem, though that is where it was noticed --
// md3.io carries a MutationObserver stripping the attribute back off every
// selectable calendar day, and ships that observer in the code it invites
// users to copy.
//
// The two families deliberately left alone are asserted here too, because a
// rule of "drop any false" would take both with it: `aria-hidden="false"` is
// meaningful and differs from absent, and `data-x="false"` is an ordinary
// string an application may read back.

import { describe, test, expect, beforeAll } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

beforeAll(() => {
  const g = global as any;
  const w = dom.window as any;
  for (const key of ["document", "window", "Element", "HTMLElement", "Node", "Event", "CustomEvent", "SVGElement"]) {
    if (w[key] !== undefined) g[key] = w[key];
  }
  g.document = w.document;
  g.window = w;
});

const { createElement } = await import("../../../src/core/dom/create");
const { setAttributes, batchAttributes } = await import("../../../src/core/dom/attributes");
const { BOOLEAN_ATTRIBUTES } = await import("../../../src/core/utils/attributes");

describe("a boolean attribute given false is left off", () => {
  test("disabled: false leaves the control enabled", () => {
    const el = createElement({ tag: "button", disabled: false } as never) as HTMLButtonElement;

    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.disabled).toBe(false);
    expect(el.outerHTML).toBe("<button></button>");
  });

  test("disabled: true still disables it", () => {
    const el = createElement({ tag: "button", disabled: true } as never) as HTMLButtonElement;

    expect(el.hasAttribute("disabled")).toBe(true);
    expect(el.disabled).toBe(true);
  });

  // The whole set, so adding a name to BOOLEAN_ATTRIBUTES without covering it
  // is not possible silently.
  test("every attribute in the set behaves the same way", () => {
    for (const name of BOOLEAN_ATTRIBUTES) {
      const off = createElement({ tag: "input", [name]: false } as never);
      const on = createElement({ tag: "input", [name]: true } as never);

      expect(off.hasAttribute(name), `${name}: false should be omitted`).toBe(false);
      expect(on.hasAttribute(name), `${name}: true should be present`).toBe(true);
    }
  });
});

describe("what is deliberately not dropped", () => {
  // aria-hidden="false" is not the same as no aria-hidden: it says "this is
  // exposed", overriding an ancestor that hid it.
  test("an aria attribute keeps its false", () => {
    const el = createElement({ tag: "div", "aria-hidden": false } as never);

    expect(el.getAttribute("aria-hidden")).toBe("false");
  });

  test("a data attribute keeps its false", () => {
    const el = createElement({ tag: "div", "data-open": false } as never);

    expect(el.getAttribute("data-open")).toBe("false");
  });

  // A caller passing the *string* asked for that string, and it is not the
  // value the rule is about.
  test("the string \"false\" on a boolean attribute is still written", () => {
    const el = createElement({ tag: "button", disabled: "false" } as never);

    expect(el.getAttribute("disabled")).toBe("false");
  });

  test("an unrelated attribute given false keeps it", () => {
    const el = createElement({ tag: "div", "data-x": false, title: "t" } as never);

    expect(el.getAttribute("data-x")).toBe("false");
    expect(el.getAttribute("title")).toBe("t");
  });
});

// Four paths wrote attributes from a value, and closing only the one the
// finding named would have left the others open.
describe("every path that writes an attribute agrees", () => {
  test("setAttributes, among other attributes", () => {
    const el = document.createElement("input");

    setAttributes(el, { id: "a", disabled: false, required: true });

    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.hasAttribute("required")).toBe(true);
    expect(el.getAttribute("id")).toBe("a");
  });

  // setAttributes has a separate single-key fast path, which would otherwise
  // stay broken for exactly the call that passes one attribute on its own.
  test("setAttributes on the single-attribute fast path", () => {
    const el = document.createElement("button") as HTMLButtonElement;

    setAttributes(el, { disabled: false });

    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.disabled).toBe(false);
  });

  test("batchAttributes, and its siblings are still written", () => {
    const el = document.createElement("input");

    batchAttributes(el, [
      { action: "set", key: "disabled", value: false },
      { action: "set", key: "checked", value: true },
      { action: "set", key: "data-x", value: "1" },
    ]);

    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.hasAttribute("checked")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
  });

  test("createElement's structured attributes take the same route", () => {
    const el = createElement({
      tag: "button",
      attributes: { disabled: false, "aria-hidden": false },
    } as never) as HTMLButtonElement;

    expect(el.disabled).toBe(false);
    expect(el.hasAttribute("disabled")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("false");
  });
});
