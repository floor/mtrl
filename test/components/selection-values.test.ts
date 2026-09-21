// test/components/selection-values.test.ts
//
// One rule for setting a selection by code, across the four components that
// hold one by value. FLO-106, and the decision recorded there is the spec:
//
//   - a disabled option CAN be selected by code -- `disabled` blocks the user,
//     not the application, which is how native select and radio inputs behave;
//   - a value no option carries CLEARS the selection, warns once outside
//     production, and emits `change` once with the cleared value.
//
// The four are tested together in one file on purpose. The finding was not
// that any single component was wrong -- each was defensible alone -- but that
// the four disagreed, and a rule that lives in four separate suites is the
// same failure again. A component added to this table has to answer the same
// questions.
//
// Measured before the change: radios already did both; select selected a
// disabled option but kept the previous one for an unknown value; tabs refused
// a disabled tab and kept the previous one; segmented button refused both.

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.requestAnimationFrame = (fn: (t: number) => void) => setTimeout(() => fn(0), 0);
class TestResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
g.ResizeObserver = TestResizeObserver;

import createRadios from "../../src/components/radios";
import createSelect from "../../src/components/select";
import createTabs from "../../src/components/tabs";
import createSegmentedButton from "../../src/components/segmented-button";

beforeEach(() => {
  document.body.innerHTML = "";
});

/** Collects console.warn while a call runs, and restores it afterwards. */
const warnings: string[] = [];
const realWarn = console.warn;
beforeEach(() => {
  warnings.length = 0;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(" "));
  };
});
afterEach(() => {
  console.warn = realWarn;
});

const mtrlWarnings = () => warnings.filter((line) => line.startsWith("[mtrl]"));

describe("a disabled option can be selected by code", () => {
  test("radios", () => {
    const radios = createRadios({
      name: "size",
      options: [
        { value: "s", label: "S" },
        { value: "l", label: "L", disabled: true },
      ],
      value: "s",
    } as never);
    document.body.append(radios.element);

    radios.setValue("l");

    expect(radios.getValue()).toBe("l");
    // The user still cannot: the input stays disabled.
    const input = radios.element.querySelector<HTMLInputElement>('input[value="l"]')!;
    expect(input.disabled).toBe(true);
    expect(input.checked).toBe(true);
    expect(mtrlWarnings()).toEqual([]);
  });

  test("select", () => {
    const select = createSelect({
      label: "Size",
      options: [
        { id: "a", text: "A" },
        { id: "c", text: "C", disabled: true },
      ],
      value: "a",
    } as never);
    document.body.append(select.element);

    select.setValue("c");

    expect(select.getValue()).toBe("c");
    expect(mtrlWarnings()).toEqual([]);
  });

  test("tabs", () => {
    const tabs = createTabs({
      tabs: [
        { value: "one", text: "One" },
        { value: "three", text: "Three", disabled: true },
      ],
    } as never);
    document.body.append(tabs.element);
    tabs.setActiveTab("one");

    tabs.setActiveTab("three");

    expect(tabs.getActiveTab()?.getValue()).toBe("three");
    // The user still cannot: the button it renders as stays disabled.
    const button = tabs.getActiveTab()!.element as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(mtrlWarnings()).toEqual([]);
  });

  test("segmented button", () => {
    const group = createSegmentedButton({
      segments: [
        { value: "x", text: "X" },
        { value: "z", text: "Z", disabled: true },
      ],
    } as never);
    document.body.append(group.element);

    group.select("z");

    expect(group.getValue()).toEqual(["z"]);
    expect(mtrlWarnings()).toEqual([]);
  });
});

describe("a value no option carries clears the selection", () => {
  test("radios clears, warns once, and emits change once with the cleared value", () => {
    const radios = createRadios({
      name: "size",
      options: [
        { value: "s", label: "S" },
        { value: "m", label: "M" },
      ],
      value: "s",
    } as never);
    document.body.append(radios.element);

    const events: unknown[] = [];
    radios.on("change", (event: unknown) => events.push(event));

    radios.setValue("nope");

    expect(radios.getValue()).toBe("");
    expect([...radios.element.querySelectorAll<HTMLInputElement>("input")].some((i) => i.checked)).toBe(false);
    expect(mtrlWarnings()).toEqual(['[mtrl] radios: no option with value "nope"']);
    expect(events).toHaveLength(1);
    expect((events[0] as { value: string }).value).toBe("");
  });

  test("select clears, warns once, and emits change once with the cleared value", () => {
    const select = createSelect({
      label: "Size",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
      value: "a",
    } as never);
    document.body.append(select.element);

    const events: unknown[] = [];
    select.on("change", (event: unknown) => events.push(event));

    select.setValue("nope");

    expect(select.getValue()).toBeNull();
    expect(mtrlWarnings()).toEqual(['[mtrl] select: no option with value "nope"']);
    expect(events).toHaveLength(1);
    expect((events[0] as { value: string | null }).value).toBeNull();
  });

  test("tabs clears, warns once, and emits change once with the cleared value", () => {
    const tabs = createTabs({
      tabs: [
        { value: "one", text: "One" },
        { value: "two", text: "Two" },
      ],
    } as never);
    document.body.append(tabs.element);
    tabs.setActiveTab("one");

    const events: unknown[] = [];
    tabs.on("change", (event: unknown) => events.push(event));

    tabs.setActiveTab("nope");

    expect(tabs.getActiveTab()).toBeNull();
    expect(mtrlWarnings()).toEqual(['[mtrl] tabs: no option with value "nope"']);
    expect(events).toHaveLength(1);
    expect((events[0] as { value: string | null }).value).toBeNull();
  });

  test("segmented button clears, warns once, and emits change once with the cleared value", () => {
    const group = createSegmentedButton({
      segments: [
        { value: "x", text: "X" },
        { value: "y", text: "Y" },
      ],
    } as never);
    document.body.append(group.element);

    const events: unknown[] = [];
    group.on("change", (event: unknown) => events.push(event));

    group.select("nope");

    expect(group.getValue()).toEqual([]);
    expect(mtrlWarnings()).toEqual(['[mtrl] segmented button: no option with value "nope"']);
    expect(events).toHaveLength(1);
    expect((events[0] as { value: string[] }).value).toEqual([]);
  });
});

// The rule is about the programmatic route only. If allowing code to select a
// disabled option had been implemented by dropping the guard everywhere, a
// click would select one too -- which is the mistake this asserts against.
describe("the user still cannot select a disabled option", () => {
  test("clicking a disabled tab does not activate it", () => {
    const tabs = createTabs({
      tabs: [
        { value: "one", text: "One" },
        { value: "three", text: "Three", disabled: true },
      ],
    } as never);
    document.body.append(tabs.element);
    tabs.setActiveTab("one");

    const disabled = tabs.getTabs().find((tab) => tab.getValue() === "three")!;
    disabled.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(tabs.getActiveTab()?.getValue()).toBe("one");
  });

  test("clicking a disabled segment does not select it", () => {
    const group = createSegmentedButton({
      segments: [
        { value: "x", text: "X" },
        { value: "z", text: "Z", disabled: true },
      ],
    } as never);
    document.body.append(group.element);

    const disabled = group.segments.find((segment) => segment.value === "z")!;
    disabled.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(group.getValue()).toEqual(["x"]);
  });
});
