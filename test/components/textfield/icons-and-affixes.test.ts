// test/components/textfield/icons-and-affixes.test.ts
//
// The four decorating features — leading icon, trailing icon, prefix text and
// suffix text — had no real coverage at all. They came up because each
// returned `C & Partial<XComponent>`, and `Partial` widened the element
// property to include undefined, which put each setter's `this` at odds with
// the property it assigns once `noImplicitThis` was on. Each now returns the
// slice it actually installs.
//
// That change is type-only, so these tests are not proving it. They are here
// because four public features with no tests is how the `Partial` went
// unnoticed in the first place, and because the thing the types were confused
// about — that the property and the setters stay in step — is worth pinning.

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "HTMLInputElement",
  "HTMLTextAreaElement", "Element", "Node", "Event", "MouseEvent",
  "KeyboardEvent", "FocusEvent", "CustomEvent", "MutationObserver",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createTextfield from "../../../src/components/textfield";

const ICON = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

const mount = (config: Record<string, unknown> = {}) => {
  const field = createTextfield({ label: "Name", ...config } as never);
  document.body.append(field.element);
  return field;
};

beforeEach(() => { document.body.innerHTML = ""; });
afterAll(() => { dom.window.close(); });

describe("a decoration given in the config is there at creation", () => {
  const cases: Array<[string, string, string]> = [
    ["leadingIcon", "leadingIcon", "textfield-leading-icon"],
    ["trailingIcon", "trailingIcon", "textfield-trailing-icon"],
  ];

  for (const [option, member, className] of cases) {
    test(`${option} is rendered and reported`, () => {
      const field = mount({ [option]: ICON }) as never as Record<string, HTMLElement | null>;

      expect(field[member]).not.toBeNull();
      expect(field.element.querySelector(`.mtrl-${className}`)).not.toBeNull();
    });
  }

  test("prefixText is rendered and reported", () => {
    const field = mount({ prefixText: "$" }) as never as Record<string, HTMLElement | null>;

    expect(field.prefixTextElement).not.toBeNull();
    expect(field.prefixTextElement?.textContent).toBe("$");
  });

  test("suffixText is rendered and reported", () => {
    const field = mount({ suffixText: "kg" }) as never as Record<string, HTMLElement | null>;

    expect(field.suffixTextElement).not.toBeNull();
    expect(field.suffixTextElement?.textContent).toBe("kg");
  });
});

// The property and the setters have to stay in step: the property is plain
// (an accessor would be flattened by the next feature's spread) and each
// setter keeps it current through `this`. If they drift, the component reports
// one thing and renders another.
describe("the setters keep the reported element in step with the DOM", () => {
  test("setLeadingIcon adds one to a field that had none", () => {
    const field = mount() as never as Record<string, any>;
    expect(field.leadingIcon).toBeNull();

    field.setLeadingIcon(ICON);

    expect(field.leadingIcon).not.toBeNull();
    expect(field.element.contains(field.leadingIcon)).toBe(true);
  });

  test("removeLeadingIcon clears both the element and the report", () => {
    const field = mount({ leadingIcon: ICON }) as never as Record<string, any>;
    const icon = field.leadingIcon;
    expect(icon).not.toBeNull();

    field.removeLeadingIcon();

    expect(field.leadingIcon).toBeNull();
    expect(field.element.contains(icon)).toBe(false);
  });

  test("setPrefixText replaces the text and reports the same node", () => {
    const field = mount({ prefixText: "$" }) as never as Record<string, any>;

    field.setPrefixText("€");

    expect(field.prefixTextElement.textContent).toBe("€");
    expect(field.element.contains(field.prefixTextElement)).toBe(true);
  });

  test("removeSuffixText clears both", () => {
    const field = mount({ suffixText: "kg" }) as never as Record<string, any>;
    const node = field.suffixTextElement;

    field.removeSuffixText();

    expect(field.suffixTextElement).toBeNull();
    expect(field.element.contains(node)).toBe(false);
  });
});

describe("the setters return the field, so they chain", () => {
  test("each one hands back something carrying the field's own API", () => {
    const field = mount() as never as Record<string, any>;

    const chained = field
      .setLeadingIcon(ICON)
      .setTrailingIcon(ICON)
      .setPrefixText("$")
      .setSuffixText("kg");

    expect(typeof chained.setValue).toBe("function");
    expect(chained.leadingIcon).not.toBeNull();
    expect(chained.suffixTextElement?.textContent).toBe("kg");
  });
});
