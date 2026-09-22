/** Verify Time Picker's packed markup, selectors and BEM stylesheet together. */
import assert from "node:assert/strict";
import { join } from "node:path";
import type { Page } from "playwright";
import { TIME_FORMAT, TIME_PICKER_ORIENTATION } from "../src/components/timepicker/types";
import type createTimePicker from "../src/components/timepicker";

type TimePickerWindow = Window & {
  createTimePicker: typeof createTimePicker;
  timePicker: ReturnType<typeof createTimePicker>;
  confirmedTime: string | undefined;
  openingInput: HTMLInputElement;
  timeChanges: string[];
};

export async function checkTimePicker(page: Page, artifacts: string): Promise<void> {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => {
    const state = window as unknown as TimePickerWindow;
    document.body.replaceChildren();
    document.documentElement.setAttribute("data-theme", "material");
    document.documentElement.setAttribute("data-theme-mode", "light");
    state.confirmedTime = undefined;
    state.timePicker = state.createTimePicker({ title: "Appointment", value: "09:30", name: "appointment" });
    const form = document.createElement("form");
    form.append(state.timePicker.element);
    document.body.append(form);
    state.timeChanges = [];
    state.timePicker.on("change", value => { state.timeChanges.push(value); });
    state.timePicker.on("confirm", value => { state.confirmedTime = value; });
    state.timePicker.open();
    // Edit in the same task as open(), before the former 50ms redraw.
    state.openingInput = state.timePicker.dialogElement.querySelector<HTMLInputElement>('[data-type="minute"]')!;
    state.openingInput.focus();
    state.openingInput.value = "35";
    state.openingInput.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Cross the old redraw deadline and verify the actual input survives.
  await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(() => {
    const state = window as unknown as TimePickerWindow;
    return {
      connected: state.openingInput.isConnected,
      focused: document.activeElement === state.openingInput,
      value: state.timePicker.getValue(),
      submitted: new FormData(document.querySelector("form")!).get("appointment"),
      changes: state.timeChanges,
    };
  }), { connected: true, focused: true, value: "09:35", submitted: "09:35", changes: ["09:35"] });
  const dialog = page.locator(".mtrl-time-picker__dialog");
  await dialog.waitFor();
  const styles = await dialog.evaluate(element => {
    const style = (selector: string) => getComputedStyle(element.querySelector(selector)!);
    return {
      dialog: getComputedStyle(element).display,
      radius: getComputedStyle(element).borderRadius,
      content: style(".mtrl-time-picker__content").display,
      inputs: style(".mtrl-time-picker__input-container").display,
      canvasWidth: style(".mtrl-time-picker__dial-canvas").width,
      periodDirection: style(".mtrl-time-picker__period").flexDirection,
      actions: style(".mtrl-time-picker__actions").display,
      buttons: style(".mtrl-time-picker__action-buttons").gap,
    };
  });
  assert.deepEqual(styles, { dialog: "flex", radius: "28px", content: "flex", inputs: "flex", canvasWidth: "256px", periodDirection: "column", actions: "flex", buttons: "8px" });
  await dialog.locator(".mtrl-time-picker__toggle-type").click();
  assert.equal(await dialog.locator(".mtrl-time-picker__dial-canvas").isVisible(), false);
  assert.equal(await dialog.locator(".mtrl-time-picker__hours").evaluate(element => getComputedStyle(element).width), "96px");
  const minutes = dialog.locator(".mtrl-time-picker__minutes");
  await minutes.fill("45");
  await minutes.press("Tab");
  assert.equal(await page.locator('input[name="appointment"]').inputValue(), "09:45");
  await dialog.locator(".mtrl-time-picker__period-pm").click();
  assert.equal(await dialog.locator(".mtrl-time-picker__period-pm").getAttribute("aria-checked"), "true");
  assert.equal(await dialog.locator(".mtrl-time-picker__period--selected").textContent(), "PM");
  await page.screenshot({ path: join(artifacts, "timepicker-bem.png"), animations: "disabled" });
  await dialog.locator(".mtrl-time-picker__confirm").click();
  assert.equal(await page.evaluate(() => (window as unknown as TimePickerWindow).confirmedTime), "21:45");
  assert.deepEqual(await page.evaluate(() => {
    const state = window as unknown as TimePickerWindow;
    return {
      value: state.timePicker.getValue(),
      submitted: new FormData(document.querySelector("form")!).get("appointment"),
      changes: state.timeChanges,
    };
  }), { value: "21:45", submitted: "21:45", changes: ["09:35", "09:45", "21:45"] });
  await page.evaluate(({ format, orientation }) => {
    const picker = (window as unknown as TimePickerWindow).timePicker;
    picker.setFormat(format).setOrientation(orientation).setTitle("Updated").open();
  }, { format: TIME_FORMAT.MILITARY, orientation: TIME_PICKER_ORIENTATION.HORIZONTAL });
  assert.equal(await dialog.locator(".mtrl-time-picker__title").textContent(), "Updated");
  assert.equal(await dialog.evaluate(element => getComputedStyle(element).minWidth), "520px");
  assert.equal(await dialog.locator(".mtrl-time-picker__period").count(), 0);
  assert.deepEqual(await page.locator('[class*="mtrl-time-picker"]').evaluateAll(elements => elements.flatMap(element => [...element.classList].filter(name => /^mtrl-time-picker-[^-]/.test(name)))), []);
  await dialog.locator(".mtrl-time-picker__cancel").click();
  await page.evaluate(() => (window as unknown as TimePickerWindow).timePicker.destroy());
  assert.equal(await page.locator(".mtrl-time-picker__modal").count(), 0);
  console.log("Passed packed Time Picker: BEM layout, dial/input switching, AM/PM, input edits, form value, format/orientation and teardown.");
}
