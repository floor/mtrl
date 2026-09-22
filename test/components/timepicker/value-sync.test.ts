import { beforeEach, describe, expect, test } from "bun:test";
import createTimePicker from "../../../src/components/timepicker";
import { TIME_FORMAT, TIME_PERIOD, TIME_PICKER_TYPE, type TimePickerConfig } from "../../../src/components/timepicker/types";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();
beforeEach(() => {
  // JSDOM has no canvas rendering; interaction uses the real canvas element.
  Object.defineProperty(document.createElement("canvas").constructor.prototype, "getContext", {
    configurable: true, value: () => null,
  });
});

const setup = (config: TimePickerConfig = {}) => {
  const changes: string[] = [];
  const callbacks: string[] = [];
  const confirms: string[] = [];
  const confirmCallbacks: string[] = [];
  const picker = mount(createTimePicker({
    value: "09:30", name: "appointment", type: TIME_PICKER_TYPE.INPUT, ...config,
    onChange: value => callbacks.push(value),
    onConfirm: value => confirmCallbacks.push(value),
  }));
  const form = document.createElement("form");
  document.body.append(form);
  form.append(picker.element);
  picker.on("change", value => {
    // Subscribers can read submission synchronously from inside the callback.
    expect(submitted()).toBe(value);
    changes.push(value);
  });
  picker.on("confirm", value => confirms.push(value));
  const submitted = () => new window.FormData(form).get("appointment");
  const field = (unit: string) => picker.dialogElement.querySelector<HTMLInputElement>(`[data-type="${unit}"]`)!;
  const period = (name: string) => picker.dialogElement.querySelector<HTMLElement>(`.mtrl-time-picker__period-${name}`)!;
  const edit = (unit: string, value: string) => {
    const input = field(unit);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const confirm = () => picker.dialogElement.querySelector<HTMLButtonElement>(".mtrl-time-picker__confirm")!.click();
  return { picker, submitted, field, period, edit, confirm, changes, callbacks, confirms, confirmCallbacks };
};

describe("one time value for the API, callbacks and form (FLO-237)", () => {
  for (const format of [TIME_FORMAT.AMPM, TIME_FORMAT.MILITARY]) {
    for (const showSeconds of [false, true]) {
      for (const value of ["00:05:07", "12:30:45", "23:59:59"]) {
        test(`${format}, seconds ${showSeconds}: ${value}`, () => {
          const p = setup({ format, showSeconds, value });
          const expected = showSeconds ? value : value.slice(0, 5);
          expect(p.picker.getValue()).toBe(expected);
          expect(p.submitted()).toBe(expected);
          p.confirm();
          expect(p.confirms).toEqual([expected]);
          expect(p.confirmCallbacks).toEqual([expected]);
        });
      }
    }
  }

  test("setValue and display format changes keep the same machine value", () => {
    const p = setup({ showSeconds: true });
    p.picker.setValue("14:45:07");
    expect(p.callbacks).toEqual(["14:45:07"]);
    p.picker.setFormat(TIME_FORMAT.MILITARY);
    p.picker.setFormat(TIME_FORMAT.AMPM);
    expect(p.changes).toEqual(["14:45:07", "14:45:07", "14:45:07"]);
    expect(p.submitted()).toBe(p.picker.getValue());
    expect(p.field("hour").value).toBe("02");
    expect(p.period("pm").getAttribute("aria-checked")).toBe("true");
  });

  test("AM/PM clicks synchronize even on the initial render, once per change", () => {
    const p = setup();
    p.period("pm").click();
    p.period("pm").click();
    expect(p.picker.getValue()).toBe("21:30");
    expect(p.submitted()).toBe("21:30");
    p.confirm();
    expect(p.confirms).toEqual(["21:30"]);
    p.period("am").click();
    expect(p.changes).toEqual(["21:30", "09:30"]);
    expect(p.callbacks).toEqual(p.changes);
  });

  test("period keyboard selection preserves focus and synchronizes noon/midnight", () => {
    const p = setup({ value: "00:30" });
    const am = p.period("am");
    const pm = p.period("pm");
    am.focus();
    am.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement === pm).toBe(true);
    expect(pm.getAttribute("aria-checked")).toBe("true");
    expect(pm.tabIndex).toBe(0);
    expect(p.submitted()).toBe("12:30");
    am.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    pm.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(p.changes).toEqual(["12:30", "00:30", "12:30"]);
    expect(p.callbacks).toEqual(p.changes);
  });

  test("input followed by blur commits each field once without replacing it", () => {
    const p = setup({ value: "14:30:10", showSeconds: true });
    const minutes = p.field("minute");
    minutes.focus();
    p.edit("minute", "45");
    expect(document.activeElement === minutes).toBe(true);
    p.edit("second", "7");
    p.edit("hour", "12");
    expect(p.changes).toEqual(["14:45:10", "14:45:07", "12:45:07"]);
    expect(p.callbacks).toEqual(p.changes);
    expect(p.field("second").value).toBe("07");
    p.confirm();
    expect(p.confirmCallbacks).toEqual(["12:45:07"]);
  });

  test("24-hour edits maintain the period when switching back to 12-hour display", () => {
    const p = setup({ format: TIME_FORMAT.MILITARY });
    p.edit("hour", "23");
    expect(p.picker.getTimeObject().period).toBe(TIME_PERIOD.PM);
    p.picker.setFormat(TIME_FORMAT.AMPM);
    expect(p.field("hour").value).toBe("11");
    expect(p.period("pm").getAttribute("aria-checked")).toBe("true");
    p.period("am").click();
    expect(p.submitted()).toBe("11:30");
  });

  test("committed inputs retain their hour wrapping and minute/second bounds", () => {
    const p = setup({ value: "14:30:10", showSeconds: true });
    p.edit("hour", "0");
    expect(p.field("hour").value).toBe("12");
    expect(p.submitted()).toBe("12:30:10");
    p.edit("hour", "13");
    p.edit("minute", "75");
    p.edit("second", "-1");
    expect(p.field("hour").value).toBe("01");
    expect(p.field("minute").value).toBe("59");
    expect(p.field("second").value).toBe("00");
    expect(p.submitted()).toBe("13:59:00");
    expect(p.callbacks).toEqual(["12:30:10", "13:30:10", "13:59:10", "13:59:00"]);
  });

  test("Enter commits and moves focus once, including a seconds field", () => {
    const p = setup({ showSeconds: true });
    for (const [unit, value, next] of [["hour", "10", "minute"], ["minute", "45", "second"]]) {
      const input = p.field(unit);
      input.value = value;
      input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
      expect(document.activeElement === p.field(next)).toBe(true);
    }
    expect(p.changes).toEqual(["10:30:00", "10:45:00"]);
  });

  test("dial edits synchronize hours, minutes and seconds once", () => {
    const p = setup({ type: TIME_PICKER_TYPE.DIAL, value: "14:30:10", showSeconds: true });
    const canvas = p.picker.dialogElement.querySelector("canvas")!;
    // The dial is 256px; a click at three o'clock selects 3 hours / 15 minutes.
    for (const unit of ["hour", "minute", "second"]) {
      p.field(unit).click();
      canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 228, clientY: 128 }));
    }
    expect(p.changes).toEqual(["15:30:10", "15:15:10", "15:15:15"]);
    expect(p.callbacks).toEqual(p.changes);
    expect(p.submitted()).toBe("15:15:15");
  });

  test("an immediate edit survives opening, with its focus and DOM node intact", async () => {
    const p = setup();
    p.picker.open();
    const minutes = p.field("minute");
    minutes.focus();
    minutes.value = "45";
    minutes.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(80);
    expect(p.field("minute") === minutes).toBe(true);
    expect(document.activeElement === minutes).toBe(true);
    expect(p.submitted()).toBe("09:45");
    expect(p.callbacks).toEqual(["09:45"]);
    p.period("pm").click();
    p.confirm();
    expect(p.confirmCallbacks).toEqual(["21:45"]);
  });
});
