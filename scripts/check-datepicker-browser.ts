/** Packed selective CSS, native dialog, date entry and real keyboard integration. */
import assert from "node:assert/strict";
import { join } from "node:path";
import type { Page } from "playwright";
import type createDatePicker from "../src/components/datepicker";

type PickerWindow = Window & { core: { createDatePicker: typeof createDatePicker }; picker: ReturnType<typeof createDatePicker>; dateChanges: string[]; dateCloses: number };
export async function checkDatePicker(page: Page, artifacts: string): Promise<void> {
  await page.setViewportSize({ width: 800, height: 850 });
  await page.evaluate(() => {
    const state = window as unknown as PickerWindow;
    document.documentElement.setAttribute('data-theme', 'material'); document.documentElement.setAttribute('data-theme-mode', 'light');
    document.body.replaceChildren(); document.body.style.cssText = 'padding:24px;margin:0';
    const outside = document.createElement('button'); outside.id = 'outside-date'; outside.textContent = 'Outside'; document.body.append(outside);
    state.dateChanges = []; state.dateCloses = 0;
    state.picker = state.core.createDatePicker({ variant: 'modal', label: 'Departure', value: '2024-01-31', minDate: '2024-01-01', maxDate: '2026-12-31' });
    document.body.append(state.picker.element);
    state.picker.on('change', value => state.dateChanges.push(value.formattedValue)); state.picker.on('close', () => state.dateCloses++);
  });
  const trigger = page.locator('[data-action="open"]'); await trigger.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Departure' });
  assert.equal(await dialog.evaluate(el => el.matches(':modal')), true);
  assert.equal(await dialog.evaluate(el => getComputedStyle(el).borderRadius), '28px');
  assert.equal(await dialog.evaluate(el => el.getBoundingClientRect().width), 360);
  assert.equal(await page.locator('.mtrl-datepicker__modal-header').evaluate(el => el.getBoundingClientRect().height), 120);
  assert.match(await dialog.evaluate(el => getComputedStyle(el, '::backdrop').backgroundColor), /(?:rgba\(0, 0, 0, 0\.32\)|color\(srgb 0 0 0 \/ 0\.32\))/);
  assert.equal(await page.locator('[data-date="2024-01-31"]').evaluate(el => getComputedStyle(el, '::before').width), '40px');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-date')), '2024-01-31');
  await page.keyboard.press('PageDown'); assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-date')), '2024-02-29');
  await page.keyboard.press('Enter'); assert.deepEqual(await page.evaluate(() => (window as unknown as PickerWindow).dateChanges), []);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(await page.evaluate(() => (window as unknown as PickerWindow).picker.getFormattedValue()), '01/31/2024');
  assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  await trigger.click(); await page.getByRole('button', { name: 'Switch to date input' }).click();
  const entry = page.getByLabel('Date', { exact: true }); await entry.fill('02/30/2024');
  assert.equal(await entry.getAttribute('aria-invalid'), 'true'); assert.equal(await page.getByRole('button', { name: 'OK', exact: true }).isDisabled(), true);
  await entry.fill('02/29/2024');
  await page.screenshot({ path: join(artifacts, 'datepicker-input-light.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => (window as unknown as PickerWindow).dateChanges), ['02/29/2024']);
  await trigger.click();
  await page.evaluate(() => document.getElementById('outside-date')?.focus());
  assert.equal(await page.locator('#outside-date').evaluate(el => el === document.activeElement), false, 'Native modal must prevent background focus');
  await page.getByRole('button', { name: 'OK', exact: true }).focus(); await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('button', { name: 'Switch to date input' }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab'); assert.equal(await page.getByRole('button', { name: 'OK', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.screenshot({ path: join(artifacts, 'datepicker-calendar-light.png'), animations: 'disabled' });
  const light = await dialog.evaluate(el => getComputedStyle(el).backgroundColor);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme-mode', 'dark'));
  assert.notEqual(await dialog.evaluate(el => getComputedStyle(el).backgroundColor), light);
  await page.screenshot({ path: join(artifacts, 'datepicker-calendar-dark.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 375, height: 667 });
  assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await page.screenshot({ path: join(artifacts, 'datepicker-mobile.png'), animations: 'disabled' });
  await page.mouse.click(2, 2); assert.equal(await dialog.count(), 0, 'Scrim dismissal should close the dialog');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  await trigger.click(); await page.keyboard.press('Escape'); assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  await page.evaluate(() => {
    const state = window as unknown as PickerWindow; state.picker.destroy();
    state.picker = state.core.createDatePicker({ variant: 'modal-input', selectionMode: 'range', value: ['2026-09-10', '2026-09-15'] }); document.body.append(state.picker.element); state.picker.open();
  });
  await page.getByLabel('End date', { exact: true }).fill('09/20/2026'); await page.getByRole('button', { name: 'OK', exact: true }).click();
  assert.equal(await page.evaluate(() => (window as unknown as PickerWindow).picker.getFormattedValue()), '09/10/2026 - 09/20/2026');
  await page.evaluate(() => {
    const state = window as unknown as PickerWindow; state.picker.destroy(); state.picker = state.core.createDatePicker({ value: '2026-09-15' }); document.body.append(state.picker.element);
  });
  await page.getByRole('textbox', { name: 'Select date', exact: true }).fill('09/25/2026'); await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => (window as unknown as PickerWindow).picker.getFormattedValue()), '09/25/2026');
  await page.locator('[data-action="open"]').click(); assert.equal(await page.locator('dialog').evaluate(el => el.matches(':modal')), false);
  await page.locator('[data-date="2026-09-26"]').click();
  assert.equal(await page.evaluate(() => (window as unknown as PickerWindow).picker.getFormattedValue()), '09/26/2026');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => (window as unknown as PickerWindow).picker.getFormattedValue()), '09/27/2026');
  await page.evaluate(() => (window as unknown as PickerWindow).picker.destroy());
  assert.equal(await page.locator('.mtrl-datepicker').count(), 0);
  console.log('Passed packed date picker: selective CSS, token geometry, native modal/scrim, focus, keyboard, input validation, draft/commit/cancel, range, themes, mobile and cleanup.');
}
