/** Material chips: packed styles, native keyboard activation and removal. */
import assert from "node:assert/strict";
import { join } from "node:path";
import type { Page } from "playwright";
import type * as Chips from "../src/components/chips";

type ChipWindow = Window & {
  core: typeof Chips;
  chipCases: Chips.ChipComponent[];
  chipChanges: number;
  chipRemovals: number;
};
export async function checkChips(page: Page, artifacts: string): Promise<void> {
  await page.setViewportSize({ width: 920, height: 480 });
  await page.evaluate(() => {
    const state = window as unknown as ChipWindow;
    const { createAssistChip, createFilterChip, createInputChip, createSuggestionChip } = state.core;
    document.documentElement.setAttribute("data-theme", "material");
    document.documentElement.setAttribute("data-theme-mode", "light");
    state.chipChanges = 0; state.chipRemovals = 0;
    document.body.style.cssText = "display:flex; flex-wrap:wrap; align-content:flex-start; gap:24px; padding:32px";
    const icon = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>';
    state.chipCases = [
      createAssistChip({ label: "Assist", leadingIcon: icon }),
      createFilterChip({ label: "Filter", leadingIcon: icon, onChange: () => state.chipChanges++ }),
      createInputChip({ label: "Ada", onRemove: () => state.chipRemovals++ }),
      createSuggestionChip({ label: "Suggestion" }),
      createAssistChip({ label: "Elevated assist", elevated: true }),
      createFilterChip({ label: "Selected filter", selected: true }),
      createInputChip({ label: "Selected input", selected: true, disabled: true }),
      createInputChip({ label: "Avatar", avatar: icon, onRemove: () => {} }),
    ];
    state.chipCases.forEach((chip, index) => { chip.element.id = `chip-${index}`; document.body.append(chip.element); });
  });
  const geometry = await page.evaluate(() => (window as unknown as ChipWindow).chipCases.map(chip => {
    const style = getComputedStyle(chip.element);
    return { height: chip.element.getBoundingClientRect().height, radius: style.borderRadius, background: style.backgroundColor, border: style.borderTopWidth, shadow: style.boxShadow };
  }));
  for (const result of geometry) { assert.equal(result.height, 32); assert.equal(result.radius, "8px"); }
  for (const result of geometry.slice(0, 4)) { assert.equal(result.background, "rgba(0, 0, 0, 0)"); assert.equal(result.border, "1px"); }
  assert.notEqual(geometry[4].shadow, "none");
  assert.notEqual(geometry[5].background, "rgba(0, 0, 0, 0)");
  assert.notEqual(geometry[6].background, "rgba(0, 0, 0, 0)");
  assert.equal(await page.locator("#chip-7 .mtrl-chip__action").evaluate(el => getComputedStyle(el).paddingInlineStart), "4px");
  assert.deepEqual(await page.locator("#chip-0 .mtrl-chip__leading-icon").evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })), { width: 18, height: 18 });
  await page.locator("#chip-1 .mtrl-chip__action").focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#chip-1 .mtrl-chip__action").getAttribute("aria-checked"), "true");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#chip-1 .mtrl-chip__action").getAttribute("aria-checked"), "false");
  assert.equal(await page.evaluate(() => (window as unknown as ChipWindow).chipChanges), 2);
  await page.locator("#chip-2 .mtrl-chip__action").focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Remove Ada");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => (window as unknown as ChipWindow).chipRemovals), 1);
  assert.equal(await page.locator("#chip-2 .mtrl-chip__action").getAttribute("aria-checked"), "false");
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.screenshot({ path: join(artifacts, "chips-light.png"), animations: "disabled" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme-mode", "dark"));
  await page.screenshot({ path: join(artifacts, "chips-dark.png"), animations: "disabled" });
  const dark = await page.locator("#chip-5").evaluate(el => getComputedStyle(el).backgroundColor);
  assert.notEqual(dark, geometry[5].background, "Chip selection color must follow the dark theme");
  await page.evaluate(() => {
    const chip = (window as unknown as ChipWindow).chipCases[2];
    chip.element.style.maxWidth = "140px";
    chip.setLabel("A long recipient label that must truncate");
  });
  assert.equal(await page.locator("#chip-2").evaluate(el => el.scrollWidth <= el.clientWidth), true, "Long input labels must fit beside removal");
  assert.equal(await page.locator("#chip-2 .mtrl-chip__label").evaluate(el => el.scrollWidth > el.clientWidth), true);
  await page.evaluate(() => {
    for (const chip of (window as unknown as ChipWindow).chipCases) chip.destroy();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-mode");
  });
  assert.equal(await page.locator(".mtrl-chip").count(), 0);
  console.log("Passed packed Material chips: 32px geometry, flat/elevated/selected styles, icons/avatar, native keyboard toggle/removal and cleanup.");
}
