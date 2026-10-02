// test/components/textfield/accessibility.test.ts
//
// FLO-301: a required field's asterisk, the error read when it appears, the
// leading icon hidden as decoration, and an interactive trailing icon as a
// button. M3's text field guidelines first, Compose second: the asterisk follows
// the label (Material Web appends it in the label's colour); the trailing slot
// holds an IconButton when it acts.

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLButtonElement",
  "HTMLTextAreaElement", "Element", "Node", "Event", "MouseEvent",
  "KeyboardEvent", "FocusEvent", "CustomEvent", "MutationObserver",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

// Frames run when the test says so
let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;
g.requestAnimationFrame = (callback: FrameRequestCallback) => {
  frames.set(nextFrame, callback);
  return nextFrame++;
};
g.cancelAnimationFrame = (id: number) => void frames.delete(id);
const flush = () => {
  const due = [...frames.values()];
  frames = new Map();
  for (const callback of due) callback(0);
};

import createTextField from "../../../src/components/textfield";

const mount = (config: Record<string, unknown> = {}) => {
  const field = createTextField({ label: "Name", ...config } as never);
  document.body.append(field.element);
  return field;
};
const label = (field: { element: HTMLElement }) => field.element.querySelector("label")!;
const asterisk = (field: { element: HTMLElement }) => field.element.querySelector<HTMLElement>(".mtrl-textfield__required");
const helper = (field: { element: HTMLElement }) => field.element.querySelector<HTMLElement>(".mtrl-textfield__helper");
const ICON = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

beforeEach(() => {
  document.body.innerHTML = "";
  frames = new Map();
});
afterAll(() => dom.window.close());

describe("the required asterisk (FLO-301)", () => {
  test("a required field's label ends in an asterisk hidden from screen readers; the input says required", () => {
    const field = mount({ required: true });
    expect(asterisk(field)?.textContent).toBe("*");
    expect(asterisk(field)?.getAttribute("aria-hidden")).toBe("true");
    expect(label(field).lastElementChild).toBe(asterisk(field));
    expect(field.input.required).toBe(true);
    expect(field.isRequired()).toBe(true);
  });

  test("an optional field has none, and noAsterisk leaves a required field without one", () => {
    expect(asterisk(mount())).toBeNull();
    const field = mount({ required: true, noAsterisk: true });
    expect(asterisk(field)).toBeNull();
    expect(field.input.required).toBe(true);
  });

  test("setLabel keeps the asterisk, and getLabel reads the label's text without it", () => {
    const field = mount({ required: true });
    field.setLabel("Email");
    expect(asterisk(field)).not.toBeNull();
    expect(field.getLabel()).toBe("Email");
  });

  test("setRequired adds and removes the asterisk with the input's required", () => {
    const field = mount();
    field.setRequired(true);
    expect([asterisk(field) !== null, field.input.required, field.isRequired()]).toEqual([true, true, true]);
    field.setRequired(false);
    expect([asterisk(field), field.input.required, field.isRequired()]).toEqual([null, false, false]);
  });
});

describe("the error is read when it appears (FLO-301)", () => {
  test("the supporting text is a polite live region the input is described by", () => {
    const field = mount({ supportingText: "We never share it" });
    expect(helper(field)?.getAttribute("aria-live")).toBe("polite");
    expect(field.input.getAttribute("aria-describedby")?.split(" ")).toContain(helper(field)!.id);
  });

  test("an error changes the text of the region already on screen, the same element", () => {
    const field = mount({ supportingText: "We never share it" });
    const region = helper(field);
    field.setError(true, "Invalid email");
    expect(helper(field)).toBe(region);
    expect([region?.textContent, field.input.getAttribute("aria-invalid")]).toEqual(["Invalid email", "true"]);
    expect(frames.size).toBe(0);
  });

  test("a region created at run time has its text at once, and writes it again on the next frame to be announced", () => {
    const field = mount();
    field.setError(true, "Required");
    const region = helper(field)!;
    expect(region.textContent).toBe("Required");
    const before = region.firstChild;
    expect(frames.size).toBe(1);
    flush();
    expect(region.textContent).toBe("Required");
    expect(region.firstChild).not.toBe(before);
    expect(field.input.getAttribute("aria-describedby")?.split(" ")).toContain(region.id);
  });

  test("clearing the error before its frame cancels the frame: no stale text comes back", () => {
    const field = mount();
    field.setError(true, "Required");
    field.setError(false, "");
    expect(helper(field)).toBeNull();
    expect(frames.size).toBe(0);
  });

  test("a new text before the frame is the one on screen after it", () => {
    const field = mount();
    field.setError(true, "Required");
    field.setError(true, "Too short");
    flush();
    expect(helper(field)?.textContent).toBe("Too short");
  });

  test("destroying the field before the frame cancels it: nothing is written after destroy", () => {
    const field = mount();
    field.setError(true, "Required");
    const region = helper(field)!;
    field.destroy();
    expect(frames.size).toBe(0);
    flush();
    expect(region.isConnected).toBe(false);
  });

  test("construction schedules no frame, error or not", () => {
    mount({ supportingText: "Help", error: true });
    expect(frames.size).toBe(0);
  });
});

describe("decorative icons are hidden (FLO-301)", () => {
  test("the leading icon is aria-hidden", () => {
    const field = mount({ leadingIcon: ICON });
    expect(field.leadingIcon?.getAttribute("aria-hidden")).toBe("true");
  });

  test("a trailing icon without a label is a decorative span, hidden from screen readers (1.0)", () => {
    const field = mount({ trailingIcon: ICON });
    expect(field.trailingIcon?.tagName).toBe("SPAN");
    expect(field.trailingIcon?.getAttribute("aria-hidden")).toBe("true");
  });

  test("a button made decorative again is hidden, and a span made a button is not", () => {
    const field = mount({ trailingIcon: ICON, trailingIconLabel: "Clear" });
    expect(field.trailingIcon?.hasAttribute("aria-hidden")).toBe(false);
    field.setTrailingIcon(ICON, "");
    expect(field.trailingIcon?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("an interactive trailing icon is a button (FLO-301)", () => {
  test("trailingIconLabel makes it a button with that name, out of any form's submit", () => {
    const field = mount({ trailingIcon: ICON, trailingIconLabel: "Clear" });
    const button = field.trailingIcon as HTMLButtonElement;
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Clear");
    expect(button.classList.contains("mtrl-textfield__trailing-icon")).toBe(true);
    expect(button.classList.contains("mtrl-textfield__trailing-icon--button")).toBe(true);
    expect(button.innerHTML).toContain("<svg");
  });

  test("activating it emits trailing once, with the value and the click; onTrailingClick is that listener", () => {
    const calls: string[] = [];
    const field = mount({
      trailingIcon: ICON, trailingIconLabel: "Clear", value: "abc",
      onTrailingClick: ({ value }: { value: string }) => calls.push(`option:${value}`),
    });
    field.on("trailing", ({ value, event }) => calls.push(`event:${value}:${event.type}`));
    (field.trailingIcon as HTMLButtonElement).click();
    expect(calls).toEqual(["option:abc", "event:abc:click"]);
  });

  test("it is disabled with the field, and a disabled field emits nothing", () => {
    const calls: string[] = [];
    const field = mount({ trailingIcon: ICON, trailingIconLabel: "Clear", disabled: true });
    field.on("trailing", () => calls.push("trailing"));
    const button = field.trailingIcon as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    field.enable();
    expect(button.disabled).toBe(false);
    field.disable();
    expect(button.disabled).toBe(true);
    expect(calls).toEqual([]);
  });

  test("setTrailingIcon with a label turns the span into a button in its place, and an empty label back", () => {
    const field = mount({ trailingIcon: ICON });
    const parent = field.trailingIcon!.parentElement;
    field.setTrailingIcon(ICON, "Show password");
    expect([field.trailingIcon?.tagName, field.trailingIcon?.getAttribute("aria-label")]).toEqual(["BUTTON", "Show password"]);
    expect(field.trailingIcon?.parentElement).toBe(parent);
    expect(field.element.querySelectorAll(".mtrl-textfield__trailing-icon").length).toBe(1);
    field.setTrailingIcon(ICON);
    expect(field.trailingIcon?.tagName).toBe("BUTTON");
    field.setTrailingIcon(ICON, "");
    expect(field.trailingIcon?.tagName).toBe("SPAN");
  });
});
