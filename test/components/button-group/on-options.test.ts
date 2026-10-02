// test/components/button-group/on-options.test.ts
//
// The on map is registered. select, deselect and toggle stay silent; a click
// is what emits click and, on a selection group, change.
import { expect, test } from "bun:test";
import createButtonGroup from "../../../src/components/button-group/button-group";
import { callbacksFixture } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();

test("the on map's click, focus, blur and change handlers are the group's listeners", () => {
  const click = optionPair();
  const focus = optionPair();
  const blur = optionPair();
  const change = optionPair();
  const group = mount(createButtonGroup({
    selection: "single",
    buttons: [{ text: "A", value: "a" }, { text: "B", value: "b" }],
    on: {
      click: (event) => click.option(event),
      focus: (event) => focus.option(event),
      blur: (event) => blur.option(event),
      change: (event) => change.option(event),
    },
  }));
  group.on("click", (event) => click.listener(event));
  group.on("focus", (event) => focus.listener(event));
  group.on("blur", (event) => blur.listener(event));
  group.on("change", (event) => change.listener(event));
  const button = group.buttons[1].element;
  button.focus();
  button.click();
  button.blur();
  expectSameListener(click);
  expectSameListener(focus);
  expectSameListener(blur);
  expectSameListener(change);
  const payload = change.listenerCalls[0] as { value: string | string[] | null };
  expect(payload.value).toBe("b");
  const before = change.optionCalls.length;
  group.select("a");
  group.deselect("a");
  group.toggle("b");
  expect(change.optionCalls).toHaveLength(before);
  expect(change.listenerCalls).toHaveLength(before);
});

test("off removes an on.click handler, which is the registered function", () => {
  const seen: string[] = [];
  const onClick = () => { seen.push("click"); };
  const group = mount(createButtonGroup({
    buttons: [{ text: "A" }, { text: "B" }],
    on: { click: onClick },
  }));
  group.buttons[0].element.click();
  group.off("click", onClick);
  group.buttons[1].element.click();
  expect(seen).toEqual(["click"]);
});
