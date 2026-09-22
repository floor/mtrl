/** Verify shared input builders produce the selectors their packed CSS styles. */
import assert from "node:assert/strict";
import type { Page } from "playwright";
import type createCheckbox from "../src/components/checkbox";
import type createSwitch from "../src/components/switch";
import type createTextfield from "../src/components/textfield";

type InputWindow = Window & {
  inputs: { createCheckbox: typeof createCheckbox; createSwitch: typeof createSwitch; createTextfield: typeof createTextfield };
  inputControls: { destroy: () => void }[];
};

export async function checkInputBEM(page: Page): Promise<void> {
  await page.evaluate(() => {
    const state = window as unknown as InputWindow;
    const { createCheckbox, createSwitch, createTextfield } = state.inputs;
    const checkbox = createCheckbox({ label: "Agree" });
    const control = createSwitch({ label: "Wi-Fi", supportingText: "Network access" });
    const field = createTextfield({ label: "Name", value: "Ada" });
    state.inputControls = [checkbox, control, field];
    document.body.append(checkbox.element, control.element, field.element);
    field.element.style.width = "240px";
    document.documentElement.setAttribute("data-theme", "material");
    document.documentElement.setAttribute("data-theme-mode", "light");
    control.setSupportingText("Updated");
  });
  for (const block of ["checkbox", "switch"]) {
    const input = page.locator(`.mtrl-${block}__input`);
    assert.equal(await input.count(), 1);
    assert.equal(await input.evaluate(element => Math.abs(parseFloat(getComputedStyle(element).width) - element.parentElement!.clientWidth) < 1), true);
    assert.equal(await input.evaluate(element => getComputedStyle(element).zIndex), "1");
    await input.focus(); await page.keyboard.press("Space");
    assert.equal(await input.isChecked(), true);
  }
  assert.equal(await page.locator(".mtrl-switch__content").count(), 1);
  assert.equal(await page.locator(".mtrl-switch__content .mtrl-switch__helper").textContent(), "Updated");
  const field = page.locator(".mtrl-textfield__input");
  assert.equal(await field.evaluate(element => getComputedStyle(element).fontSize), "16px");
  assert.equal(await field.evaluate(element => element.getBoundingClientRect().height), 56);
  await field.fill("Grace");
  assert.equal(await field.inputValue(), "Grace");
  await page.evaluate(() => (window as unknown as InputWindow).inputControls.forEach(control => control.destroy()));
  console.log("Passed packed BEM native inputs: CSS geometry, focus, keyboard toggle, Switch content reuse and text entry.");
}
