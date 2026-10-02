// test/components/timepicker/on-options.test.ts
//
// onChange, onInput, onOpen, onClose, onCancel and onConfirm are the picker's
// listeners. onConfirm's argument is { value }, the confirm payload.
import { expect, test } from "bun:test";
import createTimePicker from "../../../src/components/timepicker";
import { TIMEPICKER_SELECTORS } from "../../../src/components/timepicker/constants";
import { TIME_PICKER_TYPE, type TimePickerConfig } from "../../../src/components/timepicker/types";
import { callbacksFixture } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();
const create = (config: TimePickerConfig = {}) => mount(createTimePicker({
  value: "09:30",
  type: TIME_PICKER_TYPE.INPUT,
  ...config,
}));
const minute = (root: { dialogElement: HTMLElement }) =>
  root.dialogElement.querySelector<HTMLInputElement>('[data-type="minute"]')!;
const click = (root: { dialogElement: HTMLElement }, selector: string) =>
  root.dialogElement.querySelector<HTMLButtonElement>(selector)!.click();
const editMinute = (root: { dialogElement: HTMLElement }) => {
  const field = minute(root);
  field.value = "45";
  field.dispatchEvent(new Event("input", { bubbles: true }));
};

test("onInput matches its listener when a field changes, and setValue is silent", () => {
  const seen = optionPair();
  const time = create({ onInput: (event) => seen.option(event) });
  time.on("input", (event) => seen.listener(event));
  editMinute(time);
  expectSameListener(seen);
  time.setValue("11:00");
  expect(seen.optionCalls).toHaveLength(1);
  expect(seen.listenerCalls).toHaveLength(1);
});

test("onChange matches its listener when OK commits a new time, and setValue is silent", () => {
  const changed = optionPair();
  const time = create({ onChange: (event) => changed.option(event) });
  time.on("change", (event) => changed.listener(event));
  editMinute(time);
  click(time, TIMEPICKER_SELECTORS.CONFIRM_BUTTON);
  expectSameListener(changed);
  expect(changed.listenerCalls[0]).toEqual({ value: "09:45" });
  time.setValue("12:00");
  expect(changed.optionCalls).toHaveLength(1);
  expect(changed.listenerCalls).toHaveLength(1);
});

test("onConfirm matches its listener when OK is pressed", () => {
  const confirmed = optionPair();
  const time = create({ onConfirm: (event) => confirmed.option(event) });
  time.on("confirm", (event) => confirmed.listener(event));
  editMinute(time);
  click(time, TIMEPICKER_SELECTORS.CONFIRM_BUTTON);
  expectSameListener(confirmed);
  const payload = confirmed.listenerCalls[0] as { value: string };
  expect(payload.value).toBe("09:45");
});

test("onOpen and onClose match their listeners for open and close", () => {
  const opened = optionPair();
  const closed = optionPair();
  const time = create({
    onOpen: opened.option,
    onClose: closed.option,
  });
  time.on("open", opened.listener);
  time.on("close", closed.listener);
  time.open();
  time.close();
  expectSameListener(opened);
  expectSameListener(closed);
  expect(opened.optionCalls).toEqual([undefined]);
  expect(closed.optionCalls).toEqual([undefined]);
});

test("onCancel matches its listener for the Cancel button, which also closes", () => {
  const cancelled = optionPair();
  const closed = optionPair();
  const time = create({
    onCancel: cancelled.option,
    onClose: closed.option,
  });
  time.on("cancel", cancelled.listener);
  time.on("close", closed.listener);
  time.open();
  click(time, TIMEPICKER_SELECTORS.CANCEL_BUTTON);
  expectSameListener(cancelled);
  expectSameListener(closed);
  expect(cancelled.optionCalls).toEqual([undefined]);
});

test("off(onOpen) removes the config handler, which is the registered function", () => {
  const seen: string[] = [];
  const onOpen = () => { seen.push("open"); };
  const time = create({ onOpen });
  time.open();
  time.off("open", onOpen);
  time.close();
  time.open();
  expect(seen).toEqual(["open"]);
});
