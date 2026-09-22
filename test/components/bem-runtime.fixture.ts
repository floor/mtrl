import { afterEach, beforeEach, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createButton from "../../src/components/button";
import { BUTTON_CLASSES } from "../../src/components/button/constants";
import createCheckbox from "../../src/components/checkbox";
import createSwitch from "../../src/components/switch";
import createTextfield from "../../src/components/textfield";
import { TEXTFIELD_CLASSES } from "../../src/components/textfield/constants";
import createMenu from "../../src/components/menu";
import createSegmentedButton from "../../src/components/segmented-button";

let dom: JSDOM;
let cleanup: (() => void)[];
beforeEach(() => {
  dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
  for (const name of ["window", "document", "HTMLElement", "HTMLInputElement", "HTMLButtonElement", "HTMLTextAreaElement", "Element", "Node", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "MutationObserver"]) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === "window" ? dom.window : Reflect.get(dom.window, name) });
  }
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  cleanup = [];
});
afterEach(() => { cleanup.reverse().forEach(destroy => destroy()); dom.window.close(); });

test("shared inputs expose the BEM classes their styles target", () => {
  const controls = [createCheckbox({ label: "Agree" }), createSwitch({ label: "Wi-Fi" }), createTextfield({ label: "Email" })];
  for (const [index, control] of controls.entries()) {
    cleanup.push(() => control.destroy());
    const block = ["checkbox", "switch", "textfield"][index];
    expect(control.input.classList.contains(`mtrl-${block}__input`)).toBe(true);
    expect(control.input.classList.contains(`mtrl-${block}-input`)).toBe(false);
  }
});

test("switch supporting text reuses the existing BEM content wrapper", () => {
  const control = createSwitch({ label: "Wi-Fi", supportingText: "Network access" });
  cleanup.push(() => control.destroy());
  control.setSupportingText("Updated");
  expect(control.element.querySelectorAll(".mtrl-switch__content")).toHaveLength(1);
  const content = control.element.querySelector(".mtrl-switch__content")!;
  expect(content.querySelector(".mtrl-switch__label")?.textContent).toBe("Wi-Fi");
  expect(content.querySelector(".mtrl-switch__helper")?.textContent).toBe("Updated");
  expect(control.element.querySelector(".mtrl-switch-content")).toBeNull();
});

test("textfield constants select live slots and their error state", () => {
  const field = createTextfield({ label: "Cost", prefixText: "$", suffixText: "USD", supportingText: "Required", error: true });
  cleanup.push(() => field.destroy());
  for (const [key, text] of [["PREFIX_TEXT", "$"], ["SUFFIX_TEXT", "USD"], ["SUPPORTING_TEXT", "Required"], ["SUPPORTING_TEXT_ERROR", "Required"]] as const) {
    expect(field.element.querySelector(`.mtrl-${TEXTFIELD_CLASSES[key]}`)?.textContent).toBe(text);
  }
  field.setError(false);
  expect(field.element.querySelector(`.mtrl-${TEXTFIELD_CLASSES.SUPPORTING_TEXT_ERROR}`)).toBeNull();
});

test("textfield icon setters add and remove BEM input modifiers", () => {
  const field = createTextfield();
  cleanup.push(() => field.destroy());
  field.setLeadingIcon("<svg></svg>"); field.setTrailingIcon("<svg></svg>");
  for (const side of ["leading", "trailing"]) {
    expect(field.input.classList.contains(`mtrl-textfield__input--with-${side}-icon`)).toBe(true);
    expect(field.input.classList.contains(`mtrl-textfield-input--with-${side}-icon`)).toBe(false);
  }
  field.removeLeadingIcon(); field.removeTrailingIcon();
  expect(field.input.className).toBe("mtrl-textfield__input");
});

test("button disabled constant follows the real disabled state", () => {
  const button = createButton({ text: "Save", disabled: true });
  cleanup.push(() => button.destroy());
  expect(button.element.classList.contains(`mtrl-${BUTTON_CLASSES.DISABLED}`)).toBe(true);
  button.enable();
  expect(button.element.classList.contains(`mtrl-${BUTTON_CLASSES.DISABLED}`)).toBe(false);
});

test("menu opener hook is BEM and is removed when the menu closes", async () => {
  const opener = document.createElement("div"); opener.tabIndex = 0; document.body.append(opener);
  const menu = createMenu({ opener, items: [{ id: "copy", text: "Copy" }] });
  cleanup.push(() => menu.destroy());
  menu.open();
  expect(opener.classList.contains("mtrl-menu__opener--active")).toBe(true);
  expect(opener.classList.contains("mtrl-menu-opener--active")).toBe(false);
  const closed = new Promise<void>(resolve => menu.on("close", () => resolve()));
  menu.close();
  await closed;
  expect(opener.classList.contains("mtrl-menu__opener--active")).toBe(false);
});

test("button active constant selects an active menu opener", async () => {
  const opener = document.createElement("button"); document.body.append(opener);
  const menu = createMenu({ opener, items: [{ id: "copy", text: "Copy" }] });
  cleanup.push(() => menu.destroy());
  menu.open();
  expect(opener.classList.contains(`mtrl-${BUTTON_CLASSES.ACTIVE}`)).toBe(true);
  const closed = new Promise<void>(resolve => menu.on("close", () => resolve()));
  menu.close();
  await closed;
  expect(opener.classList.contains(`mtrl-${BUTTON_CLASSES.ACTIVE}`)).toBe(false);
});

test("segmented buttons retain their independent button block and expose a BEM group hook", () => {
  const group = createSegmentedButton({ segments: [{ value: "day", text: "Day" }, { value: "week", text: "Week" }] });
  cleanup.push(() => group.destroy());
  for (const segment of group.segments) {
    expect(segment.element.classList.contains("mtrl-button")).toBe(true);
    expect(segment.element.classList.contains("mtrl-segmented-button__segment")).toBe(true);
    expect(segment.element.classList.contains("mtrl-segmented-button-segment")).toBe(false);
  }
  (group.segments[1].element as HTMLButtonElement).click();
  expect(group.getValue()).toEqual(["week"]);
});
