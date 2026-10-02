// test/components/checkable-values.test.ts
import { expect, test } from "bun:test";
import { callbacksFixture } from "./callbacks.fixture";
import createCheckbox from "../../src/components/checkbox";
import createSwitch from "../../src/components/switch";
import { createBase, withElement } from "../../src/core/compose/component";
import { withEvents } from "../../src/core/compose/features/events";
import { withInput } from "../../src/core/compose/features/input";
const mount = callbacksFixture();
for (const [name, create] of [["checkbox", createCheckbox], ["switch", createSwitch]] as const) {
  test(`${name} emits its boolean getter and keeps a mutable HTML token separate`, () => {
    const c = mount(create({ value: "yes", name: "choice" }));
    const seen: unknown[] = [];
    const emitter: { on(event: "change", handler: (payload: import("../../src/components/checkbox/types").CheckboxChangePayload) => void): unknown } = c;
    emitter.on("change", payload => seen.push({ ...payload, nativeEvent: payload.nativeEvent?.type, getter: c.getValue() }));
    c.input.click();
    c.setValueAttribute("no");
    c.input.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    expect(seen).toEqual([
      { checked: true, value: true, valueAttribute: "yes", nativeEvent: "change", getter: true },
      { checked: false, value: false, valueAttribute: "no", nativeEvent: "change", getter: false },
    ]);
    c.setValue(true); c.check(); c.uncheck(); c.toggle();
    c.disable(); c.input.click();
    c.input.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(seen).toHaveLength(2);
    expect(c.getValueAttribute()).toBe("no");
  });
}
test("standalone withInput is symmetric: change.value and getValue() are the checked boolean, the string is valueAttribute and getValueAttribute()", () => {
  const base = withEvents()(withElement({ tag: "div" })(createBase({ componentName: "checkbox" })));
  const c = withInput({ value: "token" })(base);
  document.body.append(c.element);
  const seen: unknown[] = [];
  c.on("change", payload => seen.push(payload));
  c.on("value", payload => seen.push(payload));
  const native: Event[] = [];
  c.input.addEventListener("change", event => native.push(event));
  c.input.click();
  expect(c.getValue()).toBe(true);
  expect(c.getValueAttribute()).toBe("token");
  expect(seen).toEqual([{ checked: true, value: true, valueAttribute: "token", nativeEvent: native[0] }]);
  // The setters are silent, as every setter is in 1.0: no change, and no value event
  c.setValueAttribute("next");
  expect(c.getValueAttribute()).toBe("next");
  c.setValue(false);
  expect(c.getValue()).toBe(false);
  expect(c.input.checked).toBe(false);
  expect(seen.length).toBe(1);
  c.element.remove();
});

import { checkboxElement } from "../../src/elements/checkbox";
import { switchElement } from "../../src/elements/switch";
for (const [name, create, definition] of [["checkbox", createCheckbox, checkboxElement], ["switch", createSwitch, switchElement]] as const) {
  test(`${name} element detail preserves the model, HTML token and original event`, () => {
    const c = mount(create({ value: "token" }));
    const seen: unknown[] = [];
    const emitter: { on(event: "change", handler: (payload: import("../../src/components/checkbox/types").CheckboxChangePayload) => void): unknown } = c;
    emitter.on("change", payload => {
      const detail = definition.spec.events!.change.detail!(payload) as { checked: boolean; value: boolean; valueAttribute: string; nativeEvent?: Event };
      seen.push({ checked: detail.checked, value: detail.value, valueAttribute: detail.valueAttribute,
        getter: c.getValue(), nativeIdentity: detail.nativeEvent === payload.nativeEvent });
    });
    c.input.click();
    expect(seen).toEqual([{ checked: true, value: true, valueAttribute: "token", getter: true, nativeIdentity: true }]);
  });
}
