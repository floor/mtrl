// test/components/timepicker/draft.test.ts
//
// The time picker edits a draft (FLO-288). Every move of the dial was the
// value, with a `change` each time, and Cancel kept it; in M3, Cancel
// discards and OK commits, as the date picker already did.

import { describe, expect, test } from "bun:test";
import createTimePicker from "../../../src/components/timepicker";
import { TIME_PICKER_TYPE, type TimePickerConfig } from "../../../src/components/timepicker/types";
import { callbacksFixture } from "../callbacks.fixture";

const mount = callbacksFixture();

const setup = (config: TimePickerConfig = {}) => {
  const log: string[] = [];
  const picker = mount(createTimePicker({ value: "09:30", ...config }));
  for (const name of ["input", "change", "confirm", "cancel", "open", "close"] as const) {
    // Input keeps the draft separate from the committed value.
    picker.on(name, (payload?: { value: string; draftValue?: string }) => {
      const value = name === "input" ? payload?.draftValue : payload?.value;
      log.push(`${name}${value ? `:${value}` : ""}${name === "confirm" || name === "cancel" ? `@${picker.isOpen() ? "open" : "closed"}` : ""}`);
    });
  }
  const dialog = picker.dialogElement;
  // Nine o'clock on the dial is 3 o'clock's opposite; pick 3 by keyboard.
  const pickThree = () => dialog.querySelectorAll<HTMLElement>("[role=option]")[3].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  const button = (name: string) => dialog.querySelector<HTMLButtonElement>(`.mtrl-time-picker__${name}`)!;
  return { picker, log, dialog, pickThree, button };
};

describe("a draft until OK", () => {
  test("moves on the dial are `input`, not the value", () => {
    const p = setup();
    p.picker.open();
    p.pickThree();
    expect(p.log).toEqual(["open", "input:03:30"]);
    expect(p.picker.getValue()).toBe("09:30");
    expect(p.picker.getTimeObject().hours).toBe(9);
  });

  test("OK commits: one change, then confirm while open, then close", () => {
    const p = setup();
    p.picker.open();
    p.pickThree();
    p.button("confirm").click();
    expect(p.log).toEqual(["open", "input:03:30", "change:03:30", "confirm:03:30@open", "close"]);
    expect(p.picker.getValue()).toBe("03:30");
  });

  test("OK with nothing changed confirms without a change", () => {
    const p = setup();
    p.picker.open();
    p.button("confirm").click();
    expect(p.log).toEqual(["open", "confirm:09:30@open", "close"]);
  });

  for (const [how, dismiss] of [
    ["Cancel", (p: ReturnType<typeof setup>) => p.button("cancel").click()],
    ["Escape", (p: ReturnType<typeof setup>) => p.dialog.dispatchEvent(new Event("cancel", { cancelable: true }))],
  ] as const) {
    test(`${how} discards the draft and emits cancel while open`, () => {
      const p = setup();
      p.picker.open();
      p.pickThree();
      dismiss(p);
      expect(p.log).toEqual(["open", "input:03:30", "cancel@open", "close"]);
      expect(p.picker.getValue()).toBe("09:30");
    });
  }

  test("reopening starts from the committed value, not the discarded draft", () => {
    const p = setup({ type: TIME_PICKER_TYPE.INPUT });
    p.picker.open();
    const hours = p.dialog.querySelector<HTMLInputElement>('[data-type="hour"]')!;
    hours.value = "4";
    hours.dispatchEvent(new Event("change", { bubbles: true }));
    p.button("cancel").click();
    p.picker.open();
    expect(p.dialog.querySelector<HTMLInputElement>('[data-type="hour"]')!.value).toBe("09");
  });

  test("setValue commits directly, silently (FLO-328)", () => {
    const p = setup();
    p.picker.setValue("11:00");
    expect(p.picker.getValue()).toBe("11:00");
    expect(p.log).toEqual([]);
  });
});

describe("disabled", () => {
  test("a disabled picker does not open", () => {
    const p = setup({ disabled: true });
    p.picker.open();
    expect(p.picker.isOpen()).toBe(false);
    expect(p.picker.isDisabled()).toBe(true);
    expect(p.picker.element.getAttribute("aria-disabled")).toBe("true");
    expect(p.picker.element.classList.contains("mtrl-time-picker--disabled")).toBe(true);
  });

  test("disable() cancels an open picker; enable() lets it open", () => {
    const p = setup();
    p.picker.open();
    p.pickThree();
    expect(p.picker.disable()).toBe(p.picker);
    expect([p.picker.isOpen(), p.picker.getValue()]).toEqual([false, "09:30"]);
    p.picker.enable().open();
    expect(p.picker.isOpen()).toBe(true);
    expect(p.picker.element.hasAttribute("aria-disabled")).toBe(false);
  });
});

describe("the dialog in the component's tree", () => {
  test("it is inside the component's element", () => {
    const p = setup();
    expect(p.picker.element.contains(p.dialog)).toBe(true);
  });

  test("open() puts an element the app never placed into the page", () => {
    const picker = createTimePicker({ value: "09:30" });
    expect(picker.element.isConnected).toBe(false);
    picker.open();
    expect(picker.element.isConnected).toBe(true);
    picker.destroy();
  });

  test("Enter in a field does not submit a surrounding form", () => {
    const p = setup({ type: TIME_PICKER_TYPE.INPUT });
    const form = document.createElement("form");
    document.body.append(form);
    form.append(p.picker.element);
    const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    p.dialog.querySelector<HTMLInputElement>('[data-type="hour"]')!.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
  });
});
