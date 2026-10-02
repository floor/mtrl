// test/components/textfield/on-options.test.ts
//
// onTrailingClick is the text field's trailing listener. The field has no
// method that activates the icon; the button does.
import { expect, test } from "bun:test";
import createTextField from "../../../src/components/textfield";
import { callbacksFixture } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();
const ICON = "<svg></svg>";

test("onTrailingClick matches its listener when the trailing button is activated", () => {
  const seen = optionPair();
  const field = mount(createTextField({
    trailingIcon: ICON,
    trailingIconLabel: "Clear",
    value: "abc",
    onTrailingClick: (event) => seen.option(event),
  }));
  field.on("trailing", (event) => seen.listener(event));
  (field.trailingIcon as HTMLButtonElement).click();
  expectSameListener(seen);
  const payload = seen.listenerCalls[0] as { value: string; event: Event };
  expect(payload.value).toBe("abc");
  expect(payload.event.type).toBe("click");
});

test("off(onTrailingClick) removes the config handler, which is the registered function", () => {
  const seen: string[] = [];
  const onTrailingClick = () => { seen.push("trailing"); };
  const field = mount(createTextField({
    trailingIcon: ICON,
    trailingIconLabel: "Clear",
    onTrailingClick,
  }));
  (field.trailingIcon as HTMLButtonElement).click();
  field.off("trailing", onTrailingClick);
  (field.trailingIcon as HTMLButtonElement).click();
  expect(seen).toEqual(["trailing"]);
});
