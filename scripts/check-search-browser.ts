/** Search in the packed build: the open view's place in the page and the top layer (FLO-285). */
import assert from "node:assert/strict";
import type { Page } from "playwright";
import type createSearch from "../src/components/search";

type SearchWindow = Window & { searchEvents: string[]; createSearch: typeof createSearch; search: ReturnType<typeof createSearch> };

/** Mounts a search between two paragraphs, optionally in a clipping parent. */
const mount = (page: Page, config: Parameters<typeof createSearch>[0], clip = false) => page.evaluate(({ config, clip }) => {
  const state = window as unknown as SearchWindow;
  state.search?.destroy();
  document.body.replaceChildren();
  const before = document.createElement("p"); before.textContent = "Before";
  const after = document.createElement("p"); after.id = "after"; after.textContent = "After";
  const holder = document.createElement("div");
  if (clip) holder.style.cssText = "overflow:hidden;height:60px;transform:translateZ(0)";
  state.search = state.createSearch(config);
  holder.append(state.search.element);
  document.body.append(before, holder, after);
}, { config, clip });

const layout = (page: Page) => page.evaluate(() => {
  const root = document.querySelector<HTMLElement>(".mtrl-search")!;
  // Before FLO-285 there was no surface: the root was the view.
  const surface = root.querySelector<HTMLElement>(".mtrl-search__surface") ?? root;
  const content = root.querySelector<HTMLElement>(".mtrl-search__content");
  const r = root.getBoundingClientRect(), s = surface.getBoundingClientRect();
  const probe = document.createElement("i"); probe.style.color = "color-mix(in srgb, var(--mtrl-sys-color-scrim) 32%, transparent)"; document.body.append(probe);
  const scrim = getComputedStyle(probe).color; probe.remove();
  const hit = content && content.getBoundingClientRect().height ? document.elementFromPoint(s.left + 20, content.getBoundingClientRect().top + 30) : null;
  return {
    state: root.classList.contains("mtrl-search--view") ? "view" : "bar",
    root: [Math.round(r.top), Math.round(r.height)],
    surface: [Math.round(s.left), Math.round(s.top), Math.round(s.width), Math.round(s.height)],
    bar: [Math.round(r.left), Math.round(r.top), Math.round(r.width)],
    after: Math.round(document.getElementById("after")!.getBoundingClientRect().top),
    topLayer: surface.matches(":popover-open"),
    popover: surface.hasAttribute("popover"),
    scrim: getComputedStyle(surface, "::backdrop").backgroundColor === scrim,
    content: content?.isConnected ? Math.round(content.getBoundingClientRect().height) : 0,
    reachable: hit ? root.contains(hit) : null,
    modal: [surface.tagName, surface.matches(":modal"), surface.getAttribute("role")],
    viewport: [innerWidth, innerHeight],
  };
});

/**
 * The view is open and its opening is over. Opening puts focus back on the input in
 * the next animation frame (`expandToView`). Until that frame has run the view is not
 * settled: a press or a Tab that gets there first is followed by that focus, which
 * re-opens a view just dismissed (the 30s timeout of FLO-420) or takes focus back from
 * the control it moved to. A frame requested now runs after the one the view asked for.
 */
const opened = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => document.querySelector(".mtrl-search--view"));
  await page.evaluate(() => new Promise(requestAnimationFrame));
};

/**
 * FLO-514's acceptance: a view dismissed before its opening frame has run stays
 * dismissed. Opening defers `input.focus()` to the next animation frame; here that
 * frame is held until the scrim has been pressed, the order a slow frame produces.
 * Today the late focus opens the view again.
 */
const dismissedBeforeItsOpeningFrame = async (page: Page): Promise<void> => {
  await mount(page, { placeholder: "Search messages", suggestions: ["Apple", "Banana", "Cherry"] });
  // Frames the page asks for while a view is open wait for `releaseFrames()`. A held
  // frame has an id of its own and can be cancelled, so a fix that cancels the
  // deferred focus is seen as one, like a fix that guards it.
  await page.evaluate(() => {
    const raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
    const held = new Map<number, FrameRequestCallback>();
    let next = -1;
    window.requestAnimationFrame = callback => {
      if (!document.querySelector(".mtrl-search--view")) return raf.call(window, callback);
      held.set(next, callback);
      return next--;
    };
    window.cancelAnimationFrame = id => { if (!held.delete(id)) cancel.call(window, id); };
    Object.assign(window, { releaseFrames: () => {
      window.requestAnimationFrame = raf;
      window.cancelAnimationFrame = cancel;
      delete (window as unknown as { releaseFrames?: unknown }).releaseFrames;
      for (const callback of [...held.values()]) callback(performance.now());
      held.clear();
    } });
  });
  try {
    await page.locator(".mtrl-search__input").click();
    await page.waitForFunction(() => document.querySelector(".mtrl-search--view"));
    const surface = (await layout(page)).surface;
    await page.mouse.click(surface[0] + surface[2] + 100, 700);
    assert.equal(await page.evaluate(() => !!document.querySelector(".mtrl-search--bar")), true, "the press on the scrim closes the view, its opening frame still pending");
  } finally {
    await page.evaluate(() => (window as unknown as { releaseFrames: () => void }).releaseFrames());
  }
  // Past the opening's frame, and past the 150ms a blur takes to close a view.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
  assert.equal(await page.evaluate(() => document.querySelector(".mtrl-search--view") ? "view" : "bar"), "bar",
    "FLO-514: a view dismissed before its opening frame stays dismissed");
};

export async function checkSearch(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  // Initial content is present before the construction task ends.
  const immediate = await page.evaluate(() => {
    document.body.replaceChildren();
    const state = window as unknown as SearchWindow;
    state.search = state.createSearch({ value: "ap", suggestions: ["Apple", "Banana"], collapseOnBlur: false });
    const count = state.search.element.querySelectorAll('[role="option"]').length;
    state.searchEvents = [];
    state.search.on("submit", () => state.searchEvents.push("submit"));
    state.search.on("suggestionSelect", () => state.searchEvents.push("select"));
    document.body.append(state.search.element);
    return count;
  });
  assert.equal(immediate, 2, "suggestions are ready in the construction task");
  await page.locator(".mtrl-search__input").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".mtrl-search__input").inputValue(), "Apple", "keyboard selection still works");
  assert.deepEqual(await page.evaluate(() => (window as unknown as SearchWindow).searchEvents), ["select"], "Enter selects without submitting the query");
  // Consumers can filter immediately or supply suggestions after an async source resolves.
  await page.evaluate(() => {
    const search = (window as unknown as SearchWindow).search;
    search.on("input", event => search.setSuggestions(["Apple", "Banana"].filter(text => text.toLowerCase().includes(event.value.toLowerCase()))));
  });
  await page.locator(".mtrl-search__input").fill("ban");
  assert.deepEqual(await page.locator('[role="option"]').allTextContents(), ["Banana"]);
  await page.evaluate(async () => {
    const search = (window as unknown as SearchWindow).search;
    search.setSuggestions(await Promise.resolve(["Async result"]));
    search.collapse();
    search.expand();
  });
  assert.deepEqual(await page.locator('[role="option"]').allTextContents(), ["Async result"], "reopening preserves async results");

  // Docked: the page does not move; the bar and results show over it, in the
  // top layer, placed on the bar, over a 0.32 scrim.
  await mount(page, { placeholder: "Search messages", suggestions: ["Apple", "Banana", "Cherry"] });
  const closed = await layout(page);
  assert.deepEqual([closed.state, closed.root[1], closed.popover], ["bar", 56, false], "docked: a 56dp bar in the page");
  await page.locator(".mtrl-search__input").click();
  await opened(page);
  const docked = await layout(page);
  assert.equal(docked.after, closed.after, "docked: opening does not push the page down");
  assert.equal(docked.root[1], 56, "docked: the bar's place is kept");
  assert.deepEqual([docked.topLayer, docked.scrim], [true, true], "docked: in the top layer, over a 0.32 scrim");
  assert.deepEqual(docked.surface.slice(0, 3), docked.bar, "docked: placed on the bar, its width");
  assert.ok(docked.content >= 240, `docked: results at least 240dp tall (${docked.content})`);
  assert.deepEqual(docked.modal, ["DIALOG", false, "none"], "docked: not modal, and not announced as a dialog");
  // A press on the scrim closes it, in the press itself. Read at once, not waited
  // for: the input also loses focus to that click, and its blur closes the view
  // 150ms later whether or not the scrim is handled.
  await page.mouse.click(docked.surface[0] + docked.surface[2] + 100, 700);
  assert.equal(await page.evaluate(() => !!document.querySelector(".mtrl-search--bar")), true, "the press on the scrim closes it, without waiting for the blur");
  const dismissed = await layout(page);
  assert.deepEqual([dismissed.popover, dismissed.after], [false, closed.after], "the scrim closes it, back in the page");

  await dismissedBeforeItsOpeningFrame(page);

  // In a parent that clips, the results still show: the top layer escapes it.
  await mount(page, { suggestions: ["Apple", "Banana"] }, true);
  await page.locator(".mtrl-search__input").click();
  await opened(page);
  assert.equal((await layout(page)).reachable, true, "a clipping parent does not hide the results");

  // Full screen: a bar in the page until it opens; then the viewport, modal,
  // with Tab kept inside; Escape returns it to the page.
  await mount(page, { placeholder: "Search", viewMode: "fullscreen", suggestions: ["One"] });
  const bar = await layout(page);
  assert.deepEqual([bar.root[1], bar.surface[3], bar.after > bar.root[0]], [56, 56, true], "full screen, closed: a bar in the page, not covering it");
  await page.locator(".mtrl-search__input").click();
  await opened(page);
  const full = await layout(page);
  assert.deepEqual(full.surface, [0, 0, ...full.viewport], "full screen: the viewport");
  assert.deepEqual(full.modal, ["DIALOG", true, null], "full screen: a modal dialog (showModal)");
  assert.equal(await page.evaluate(() => document.activeElement?.className), "mtrl-search__input", "full screen: the input keeps focus as the dialog opens");
  assert.equal(await page.evaluate(() => { const outside = document.createElement("button"); document.body.append(outside); outside.focus(); const inert = document.activeElement !== outside; outside.remove(); return inert; }), true, "full screen: the page behind is inert");
  // The list opened under the pointer, where the bar was, and the pointer moves
  // over it: hovering is not choosing.
  await page.mouse.move(40, 120);
  assert.equal(await page.evaluate(() => document.querySelectorAll(".mtrl-search__suggestion-item--selected").length), 0, "a list opening under the pointer highlights nothing");
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => [document.activeElement?.className, !!document.querySelector(".mtrl-search--view")]), ["mtrl-search__leading-icon", true], "full screen: moving to the back button does not close the view");
  // Escape from the back button is the dialog's cancel.
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector(".mtrl-search--bar"));
  await page.locator(".mtrl-search__input").click();
  await opened(page);
  await page.locator(".mtrl-search__input").focus();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector(".mtrl-search--bar"));
  const back = await layout(page);
  assert.deepEqual([back.surface[3], back.after, back.popover], [56, bar.after, false], "Escape: back to a bar in the page");

  await checkSearchTokens(page);
  await checkSearchVariants(page);
  await page.evaluate(() => { (window as unknown as SearchWindow).search.destroy(); document.body.replaceChildren(); });
  console.log("Passed packed search: the open view over the page in the top layer (docked under the bar with a scrim, full screen as a modal dialog), the bar's place kept, a clipping parent escaped, scrim and Escape dismissal (FLO-285); 48dp tap targets, the focus ring, state layers, combobox semantics with a live count, the outline divider and 56dp suggestions (FLO-286); the contained default and the divided variant, docked and full screen, and the results' reveal (FLO-287); minWidth and maxWidth (FLO-290).");
}

/** FLO-286: tap targets, focus ring, state layers, combobox semantics, divider and list items. */
async function checkSearchTokens(page: Page): Promise<void> {
  const avatar = '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">';
  const icon = '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/></svg>';
  await mount(page, { placeholder: "Search messages", value: "an", suggestions: ["Apple", "Banana", "Cherry"], trailingItems: [{ id: "mic", type: "icon", content: icon, ariaLabel: "Voice search" }, { id: "me", type: "avatar", content: avatar }] });
  await page.mouse.move(0, 0);
  const geometry = await page.evaluate(() => {
    const q = (s: string) => document.querySelector<HTMLElement>(s)!.getBoundingClientRect();
    const bar = q(".mtrl-search__container"), lead = q(".mtrl-search__leading-icon"), glyph = q(".mtrl-search__leading-icon svg"), input = q(".mtrl-search__input");
    const img = q(".mtrl-search__avatar img"), box = q(".mtrl-search__avatar");
    return {
      targets: [".mtrl-search__leading-icon", ".mtrl-search__clear-button", ".mtrl-search__trailing-icon", ".mtrl-search__avatar"].map(s => `${q(s).width}x${q(s).height}`),
      iconCentre: glyph.left + glyph.width / 2 - bar.left,
      textStart: input.left - bar.left,
      lastCentre: bar.right - (box.left + box.width / 2),
      avatar: img.width,
      lead: lead.width,
    };
  });
  assert.deepEqual(geometry.targets, ["48x48", "48x48", "48x48", "48x48"], "48dp tap targets for every icon and the avatar");
  assert.deepEqual([geometry.iconCentre, geometry.textStart, geometry.lastCentre, geometry.avatar], [28, 56, 28, 30], "icons centred 28dp in, text at 56dp, a 30dp avatar");
  const colour = (css: string) => page.evaluate((css) => { const i = document.createElement("i"); i.style.color = css; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); const x = document.createElement("canvas").getContext("2d")!; x.fillStyle = c; x.fillRect(0, 0, 1, 1); return x.getImageData(0, 0, 1, 1).data.join(); }, css);
  const painted = (selector: string, property = "backgroundColor") => page.locator(selector).evaluate((el, property) => { const c = (getComputedStyle(el) as unknown as Record<string, string>)[property]; const x = document.createElement("canvas").getContext("2d")!; x.fillStyle = c; x.fillRect(0, 0, 1, 1); return x.getImageData(0, 0, 1, 1).data.join(); }, property);
  await page.locator(".mtrl-search__container").hover({ position: { x: 300, y: 28 } });
  await page.waitForTimeout(300); // the layer eases in
  assert.equal(await painted(".mtrl-search__container"), await colour("color-mix(in srgb, var(--mtrl-sys-color-on-surface) 8%, var(--mtrl-sys-color-surface-container-high))"), "the bar's hover layer: on-surface at 8%");
  await page.mouse.move(0, 0);
  // Keyboard focus on the leading icon: the 3dp secondary ring.
  await page.evaluate(() => { const b = document.createElement("button"); b.id = "before-search"; document.body.prepend(b); b.focus(); });
  await page.keyboard.press("Tab");
  await page.waitForTimeout(300); // the ring's colour eases in
  const ring = await page.locator(".mtrl-search__leading-icon").evaluate(el => { const c = getComputedStyle(el); return [c.outlineWidth, c.outlineStyle, c.outlineOffset]; });
  assert.deepEqual(ring, ["3px", "solid", "2px"], "the icon buttons' focus ring: 3dp, 2dp out");
  assert.equal(await painted(".mtrl-search__leading-icon", "outlineColor"), await colour("var(--mtrl-sys-color-secondary)"), "the focus ring is secondary");
  // The combobox: expanded with the view, controlling the listbox, pointing at
  // the option the arrows reach; the count announced.
  const combobox = () => page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>(".mtrl-search__input")!;
    const list = document.getElementById(input.getAttribute("aria-controls") ?? "");
    const active = document.getElementById(input.getAttribute("aria-activedescendant") ?? "");
    return { role: input.getAttribute("role"), autocomplete: input.getAttribute("aria-autocomplete"), expanded: input.getAttribute("aria-expanded"), list: list?.getAttribute("role") ?? null, active: active?.textContent ?? null, status: document.querySelector('.mtrl-search [role="status"]')?.textContent ?? null };
  });
  assert.deepEqual(await combobox(), { role: "combobox", autocomplete: "list", expanded: "false", list: "listbox", active: null, status: "" }, "a combobox controlling the listbox, collapsed, announcing nothing");
  await page.locator(".mtrl-search__input").focus();
  await opened(page);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  assert.deepEqual(await combobox(), { role: "combobox", autocomplete: "list", expanded: "true", list: "listbox", active: "Banana", status: "3 suggestions" }, "expanded, pointing at the option the arrows reach");
  await page.waitForTimeout(300); // the layer eases in
  assert.equal(await painted(".mtrl-search__suggestion-item--selected"), await colour("color-mix(in srgb, var(--mtrl-sys-color-on-surface) 10%, transparent)"), "the reached option looks focused: on-surface at 10%");
  assert.equal(await page.locator(".mtrl-search__suggestion-item--selected").evaluate(el => getComputedStyle(el).outlineWidth), "3px", "with the focus ring");
  const item = await page.locator(".mtrl-search__suggestion-item").first().evaluate(el => { const c = getComputedStyle(el); return [el.getBoundingClientRect().height, `${c.fontSize}/${c.lineHeight}`, c.paddingLeft]; });
  assert.deepEqual(item, [56, "16px/24px", "16px"], "56dp one-line suggestions, Body Large, 16dp in");
  assert.equal(await painted(".mtrl-search__divider"), await colour("var(--mtrl-sys-color-outline)"), "the divider is outline");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector(".mtrl-search--bar"));
  assert.deepEqual([(await combobox()).expanded, (await combobox()).active], ["false", null], "collapsed, the combobox points at nothing");
}

/** FLO-287: contained (the default) and divided, docked and full screen, and the reveal. */
async function checkSearchVariants(page: Page): Promise<void> {
  // FLO-290: minWidth and maxWidth apply; the M3 360-720dp by default.
  const width = (config: Parameters<typeof createSearch>[0]) => mount(page, config).then(() => page.locator(".mtrl-search").evaluate(el => el.getBoundingClientRect().width));
  assert.deepEqual([await width({}), await width({ maxWidth: 480 })], [720, 480], "maxWidth applies; 720dp by default");
  const open = async (config: Parameters<typeof createSearch>[0]) => {
    await mount(page, { suggestions: ["Apple", "Banana"], ...config });
    await page.locator(".mtrl-search__input").click();
    await opened(page);
    await page.waitForTimeout(350);
  };
  const shape = () => page.evaluate(() => {
    const q = (s: string) => document.querySelector<HTMLElement>(s)!;
    const px = (css: string) => { const i = document.createElement("i"); i.style.color = css; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c; };
    const role = (c: string) => ["surface-container-low", "surface-container-high", "outline"].find(r => px(`var(--mtrl-sys-color-${r})`) === c) ?? c;
    const bar = q(".mtrl-search__container").getBoundingClientRect(), content = q(".mtrl-search__content").getBoundingClientRect();
    return {
      variant: q(".mtrl-search").classList.contains("mtrl-search--contained") ? "contained" : "divided",
      barRadius: getComputedStyle(q(".mtrl-search__container")).borderTopLeftRadius + " " + getComputedStyle(q(".mtrl-search__container")).borderBottomLeftRadius,
      bar: [Math.round(bar.left), Math.round(bar.top), Math.round(bar.height)],
      gap: Math.round(content.top - bar.bottom),
      contentRadius: getComputedStyle(q(".mtrl-search__content")).borderTopLeftRadius,
      divider: getComputedStyle(q(".mtrl-search__divider")).display,
      surface: role(getComputedStyle(q(".mtrl-search__surface")).backgroundColor),
    };
  });
  // Contained, docked (the default): the bar keeps its pill; the results are
  // their own container, 2dp below, with 12dp corners; no divider.
  await open({});
  const docked = await shape();
  assert.deepEqual([docked.variant, docked.barRadius.split(" ")[0] === docked.barRadius.split(" ")[1], docked.gap, docked.contentRadius, docked.divider], ["contained", true, 2, "12px", "none"], "contained, docked: a pill bar, the results 2dp below with 12dp corners, no divider");
  // Contained, full screen: surface-container-low, the pill bar inset 12dp.
  await open({ viewMode: "fullscreen" });
  const full = await shape();
  assert.deepEqual([full.surface, full.bar, full.divider], ["surface-container-low", [12, 12, 56], "none"], "contained, full screen: surface-container-low with the bar inset 12dp");
  // Divided: the bar squares off, a divider, docked 28dp corners below.
  await open({ variant: "divided" });
  const divided = await shape();
  assert.deepEqual([divided.variant, divided.barRadius, divided.gap, divided.divider], ["divided", "28px 0px", 1, "block"], "divided, docked: the bar squares off above a divider");
  await open({ variant: "divided", viewMode: "fullscreen" });
  const dividedFull = await shape();
  assert.deepEqual([dividedFull.surface, dividedFull.bar, dividedFull.barRadius], ["surface-container-high", [0, 0, 72], "0px 0px"], "divided, full screen: a 72dp header, no corners");
  // setVariant switches in place.
  await page.evaluate(() => (window as unknown as SearchWindow).search.setVariant("contained"));
  assert.equal((await shape()).variant, "contained", "setVariant switches the variant");
  // The results reveal on the emphasized decelerate curve, unless motion is reduced.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open({});
  const reveal = await page.locator(".mtrl-search__content").evaluate(el => { const c = getComputedStyle(el); return [c.animationName, c.animationDuration, c.animationTimingFunction]; });
  assert.deepEqual(reveal, ["mtrl-search-reveal", "0.3s", "cubic-bezier(0.05, 0.7, 0.1, 1)"], "the results reveal: 300ms, emphasized decelerate");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open({});
  assert.equal(await page.locator(".mtrl-search__content").evaluate(el => getComputedStyle(el).animationName), "none", "no reveal with reduced motion");
}
