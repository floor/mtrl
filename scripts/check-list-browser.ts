/** Packed Material list anatomy and native keyboard/control integration. */
import assert from "node:assert/strict";
import { join } from "node:path";
import type { Page } from "playwright";
import type createList from "../src/components/list";

type ListWindow = Window & { core: { createList: typeof createList }; materialList: ReturnType<typeof createList>; listChanges: number; controlClicks: number };
export async function checkList(page: Page, artifacts: string): Promise<void> {
  await page.setViewportSize({ width: 620, height: 900 });
  await page.evaluate(() => {
    const state = window as unknown as ListWindow;
    document.body.style.cssText = "display:block;padding:24px;margin:0";
    document.documentElement.setAttribute("data-theme", "material");
    document.documentElement.setAttribute("data-theme-mode", "light");
    state.listChanges = 0; state.controlClicks = 0;
    const icon = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>';
    const more = document.createElement("button"); more.textContent = "More"; more.id = "list-more"; more.style.color = "inherit"; more.style.font = "inherit";
    more.addEventListener("click", () => state.controlClicks++);
    state.materialList = state.core.createList({ ariaLabel: "Material list anatomy", items: [
      { kind: "subheader", headline: "People and places" },
      { id: "one", headline: "One line", leading: { type: "icon", content: icon }, trailing: { type: "text", content: "5 min" } },
      { id: "two", headline: "Two lines", supportingText: "Supporting text", leading: { type: "avatar", content: "AB" }, trailing: { type: "icon", content: icon } },
      { id: "three", headline: "Three lines", overline: "OVERLINE", supportingText: "Supporting text", leading: { type: "image", content: icon } },
      { kind: "divider", inset: true },
      { id: "video", headline: "Video", supportingText: "A small preview", leading: { type: "video", content: icon } },
      { id: "large", headline: "Large video", lines: 3, supportingText: "This supporting text can occupy two lines within the available space.", leading: { type: "video", content: icon } },
      { id: "control", headline: "Independent action", trailing: { type: "control", content: more } },
      { id: "disabled", headline: "Disabled", disabled: true },
      { id: "long", headline: "A long headline that must truncate within this list without causing horizontal overflow", supportingText: "Detail" },
    ] });
    state.materialList.element.id = "material-list";
    document.body.append(state.materialList.element);
    state.materialList.on("select", () => state.listChanges++);
  });
  const geometry = await page.locator("#material-list .mtrl-list__item").evaluateAll(elements => elements.map(element => ({ height: element.getBoundingClientRect().height, padding: getComputedStyle(element).paddingInlineStart, gap: getComputedStyle(element).gap })));
  assert.deepEqual(geometry.map(row => row.height), [56, 72, 88, 72, 88, 56, 56, 72]);
  geometry.forEach(row => { assert.equal(row.padding, "16px"); assert.equal(row.gap, "16px"); });
  for (const [name, width, height] of [["icon", 24, 24], ["avatar", 40, 40], ["image", 56, 56], ["video", 100, 56]] as const) {
    const bounds = await page.locator(`#material-list .mtrl-list__leading--${name}`).first().boundingBox();
    assert.equal(bounds?.width, width); assert.equal(bounds?.height, height);
  }
  assert.equal(await page.locator('[data-id="large"] .mtrl-list__leading--video').evaluate(el => el.getBoundingClientRect().width), 114);
  assert.equal(await page.locator(".mtrl-list__divider--inset").evaluate(el => getComputedStyle(el).marginInlineStart), "72px");
  assert.equal(await page.getByRole("button", { name: "Disabled", exact: true }).count(), 1, "Disabled rows must remain in the accessibility tree");
  const primary = page.locator('[data-id="one"] .mtrl-list__action');
  await primary.focus(); await page.keyboard.press("Space");
  assert.equal(await primary.getAttribute("aria-pressed"), "true");
  await page.keyboard.press("Enter"); assert.equal(await primary.getAttribute("aria-pressed"), "false");
  assert.equal(await page.evaluate(() => (window as unknown as ListWindow).listChanges), 2);
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.evaluate(() => document.activeElement?.parentElement?.getAttribute("data-id")), "two");
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => document.activeElement?.parentElement?.getAttribute("data-id")), "long");
  await page.keyboard.press("ArrowUp");
  assert.equal(await page.evaluate(() => document.activeElement?.parentElement?.getAttribute("data-id")), "control");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "list-more");
  await page.keyboard.press("Enter"); await page.locator("#list-more").click();
  assert.equal(await page.evaluate(() => (window as unknown as ListWindow).controlClicks), 2);
  assert.equal(await page.evaluate(() => (window as unknown as ListWindow).listChanges), 2);
  assert.equal(await page.locator("#material-list").evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await page.evaluate(async () => { const state = window as unknown as ListWindow; state.materialList.selectItem("two"); await state.materialList.refresh(); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  assert.equal(await page.locator('[data-id="two"] .mtrl-list__action').getAttribute("aria-pressed"), "true");
  await page.screenshot({ path: join(artifacts, "list-light.png"), animations: "disabled" });
  const light = await page.locator('[data-id="two"]').evaluate(el => getComputedStyle(el).backgroundColor);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme-mode", "dark"));
  await page.screenshot({ path: join(artifacts, "list-dark.png"), animations: "disabled" });
  assert.notEqual(await page.locator('[data-id="two"]').evaluate(el => getComputedStyle(el).backgroundColor), light);
  await page.evaluate(() => (window as unknown as ListWindow).materialList.destroy());
  assert.equal(await page.locator("#material-list").count(), 0);
  console.log("Passed packed Material list: 56/72/88px anatomy, media slots, dividers, themes, native keyboard selection, independent controls, refresh and cleanup.");
}
