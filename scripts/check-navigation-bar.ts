#!/usr/bin/env bun
// scripts/check-navigation-bar.ts
//
// The navigation bar (FLO-305), measured in Chromium against Compose's
// ShortNavigationBar tokens (NavigationBarTokens, NavigationBarVerticalItemTokens
// and NavigationBarHorizontalItemTokens v0_11_0), with the full stylesheet and
// with the selective one: geometry, colours, badge, the container query, the
// keyboard (as the rail's: every destination a tab stop, arrows along the bar),
// hide on scroll with and without reduced motion, and teardown.
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import type { NavigationBarComponent, NavigationBarConfig } from "../src/components/navigation-bar/types";

declare global {
  interface Window {
    bar: NavigationBarComponent;
    selected: string[];
    mountBar: (config: NavigationBarConfig, width: string, dir?: string) => void;
  }
}

const build = await Bun.build({ entrypoints: [resolve("dist/components/navigation-bar/index.js")], target: "browser", minify: true });
assert(build.success, String(build.logs));
const js = await build.outputs[0].text();
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/bar.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
    if (url.pathname === "/full.css") return new Response(Bun.file("dist/styles.css"));
    if (url.pathname === "/base.css") return new Response(Bun.file("dist/styles/base.css"));
    if (url.pathname === "/bar.css") return new Response(Bun.file("dist/styles/navigation-bar.css"));
    const styles = url.searchParams.has("selective")
      ? '<link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/bar.css">'
      : '<link rel="stylesheet" href="/full.css">';
    return new Response(`<!doctype html><html data-theme="baseline"><head>${styles}<style>body{margin:0}#tall{height:3000px}</style></head>
<body><div id="host"></div><div id="tall"></div><script type="module">
  import createNavigationBar from '/bar.js';
  const icon = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';
  window.selected = [];
  window.mountBar = (config, width, dir = 'ltr') => {
    window.bar?.destroy();
    const host = document.getElementById('host');
    host.style.width = width;
    host.dir = dir;
    window.bar = createNavigationBar({
      items: [
        { id: 'home', label: 'Home', icon, active: true, badge: 3 },
        { id: 'search', label: 'Search', icon, badge: true, badgeLabel: 'New results' },
        { id: 'off', label: 'Off', icon, disabled: true },
        { id: 'library', label: 'Library', icon, href: '/library' },
      ],
      onSelect: (event) => { event.originalEvent.preventDefault(); window.selected.push(event.value); },
      ...config,
    });
    host.replaceChildren(window.bar.element);
  };
</script></body></html>`, { headers: { "Content-Type": "text/html" } });
  },
});

type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };
const measure = (page: Page) => page.evaluate(() => {
  const box = (el: Element): Box => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  const root = window.bar.element;
  const items = [...root.querySelectorAll<HTMLElement>(".mtrl-navigation-bar__item")];
  const part = (item: Element, name: string) => item.querySelector(`.mtrl-navigation-bar__${name}`)!;
  const style = (el: Element) => getComputedStyle(el);
  const role = (name: string) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--mtrl-sys-color-${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  };
  return {
    bar: box(root),
    background: style(root).backgroundColor,
    surfaceContainer: role("surface-container"),
    items: items.map((item) => ({
      box: box(item),
      indicator: box(part(item, "indicator")),
      fill: getComputedStyle(part(item, "indicator"), "::before").opacity,
      icon: box(part(item, "icon")),
      iconColor: style(part(item, "icon")).color,
      label: box(part(item, "label")),
      labelColor: style(part(item, "label")).color,
      labelFont: [style(part(item, "label")).fontSize, style(part(item, "label")).lineHeight],
      badge: item.querySelector(".mtrl-navigation-bar__badge") ? box(item.querySelector(".mtrl-navigation-bar__badge")!) : null,
      current: item.getAttribute("aria-current"),
      name: item.getAttribute("aria-label"),
      tag: item.tagName,
    })),
    roles: Object.fromEntries(["secondary", "on-secondary-container", "on-surface-variant"].map((name) => [name, role(name)])),
    landmark: [root.tagName, root.getAttribute("aria-label")],
  };
});

const near = (actual: number, expected: number, label: string, tolerance = 0.5) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} (expected ${expected})`);

const browser = await chromium.launch();
try {
  for (const stylesheet of ["full", "selective"]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    await page.goto(`${server.url.href}${stylesheet === "selective" ? "?selective" : ""}`);
    await page.waitForFunction(() => typeof window.mountBar === "function");

    // Vertical, the compact bar: 6 + 32 + 4 + 16 + 6 = 64
    await page.evaluate(() => window.mountBar({}, "400px"));
    await page.waitForTimeout(400);
    let m = await measure(page);
    assert.deepEqual(m.landmark, ["NAV", "Primary navigation"], `${stylesheet}: a named nav landmark`);
    near(m.bar.height, 64, `${stylesheet}: the bar is 64dp (ContainerHeight)`);
    assert.equal(m.background, m.surfaceContainer, `${stylesheet}: surface container`);
    for (const item of m.items) near(item.box.width, 100, `${stylesheet}: equal widths`);
    const [home, search] = m.items;
    near(home!.indicator.width, 56, `${stylesheet}: indicator width (ActiveIndicatorWidth)`);
    near(home!.indicator.height, 32, `${stylesheet}: indicator height (ActiveIndicatorHeight)`);
    near(home!.indicator.top - m.bar.top, 6, `${stylesheet}: 6dp above the indicator (ContainerBetweenSpace)`);
    near(home!.icon.top - home!.indicator.top, 4, `${stylesheet}: the icon centred in the indicator`);
    near(home!.icon.left + 12, home!.indicator.left + 28, `${stylesheet}: horizontally too`);
    near(home!.label.top - home!.indicator.bottom, 4, `${stylesheet}: 4dp from the indicator to the label`);
    near(m.bar.bottom - home!.label.bottom, 6, `${stylesheet}: 6dp under the label`);
    assert.deepEqual(home!.labelFont, ["12px", "16px"], `${stylesheet}: LabelMedium`);
    assert.equal(home!.iconColor, m.roles["on-secondary-container"], `${stylesheet}: active icon`);
    assert.equal(home!.labelColor, m.roles.secondary, `${stylesheet}: active label (ItemActiveLabelTextColor)`);
    assert.equal(search!.labelColor, m.roles["on-surface-variant"], `${stylesheet}: inactive label`);
    assert.equal(search!.iconColor, m.roles["on-surface-variant"], `${stylesheet}: inactive icon`);
    assert.deepEqual([home!.fill, search!.fill], ["1", "0"], `${stylesheet}: only the active item's indicator is filled`);
    assert.deepEqual(m.items.map((i) => i.current), ["page", null, null, null], `${stylesheet}: aria-current on the active destination`);
    assert.deepEqual(m.items.map((i) => i.tag), ["BUTTON", "BUTTON", "BUTTON", "A"], `${stylesheet}: buttons, and a link for href`);
    assert.deepEqual([home!.name, search!.name], ["Home, 3", "Search, New results"], `${stylesheet}: the badge is in the name`);
    // BadgedBox: a large badge from the icon's end less 12dp, its bottom 14dp under the icon's top; the dot at the icon's end less 6dp
    near(home!.badge!.left, home!.icon.right - 12, `${stylesheet}: large badge start`);
    near(home!.badge!.bottom, home!.icon.top + 14, `${stylesheet}: large badge bottom`);
    near(search!.badge!.left, search!.icon.right - 6, `${stylesheet}: dot start`);
    near(search!.badge!.top, search!.icon.top, `${stylesheet}: dot top`);

    // 'auto' at 800px: the bar's own width crosses 600, so items lie horizontally and centred
    await page.evaluate(() => window.mountBar({}, "800px"));
    await page.waitForTimeout(400);
    m = await measure(page);
    near(m.bar.height, 64, `${stylesheet}: horizontal bar height`);
    const h = m.items[0]!;
    near(h.indicator.height, 40, `${stylesheet}: horizontal indicator (ActiveIndicatorHeight 40)`);
    near(h.icon.left - h.indicator.left, 16, `${stylesheet}: 16dp leading space`);
    near(h.label.left - h.icon.right, 4, `${stylesheet}: 4dp from icon to label`);
    near(h.indicator.right - h.label.right, 16, `${stylesheet}: 16dp trailing space`);
    // Centered: ((100 - 10 * (4 + 3)) / 2)% = 15% of 800 on each side
    near(m.items[0]!.box.left - m.bar.left, 120, `${stylesheet}: centred arrangement`, 1);
    near(m.bar.right - m.items[3]!.box.right, 120, `${stylesheet}: centred arrangement, end`, 1);
    assert.equal(h.labelColor, m.roles["on-secondary-container"], `${stylesheet}: horizontal active label`);

    // The same width in a narrow container stays vertical; a forced layout wins either way
    await page.evaluate(() => window.mountBar({ itemLayout: "vertical" }, "800px"));
    await page.waitForTimeout(200);
    near((await measure(page)).items[0]!.indicator.height, 32, `${stylesheet}: vertical forced at 800px`);
    await page.evaluate(() => window.mountBar({ itemLayout: "horizontal" }, "400px"));
    await page.waitForTimeout(200);
    near((await measure(page)).items[0]!.indicator.height, 40, `${stylesheet}: horizontal forced at 400px`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 400, height: 600 } });
  await page.goto(server.url.href);
  await page.waitForFunction(() => typeof window.mountBar === "function");

  // Keyboard, as the rail's: arrows along the bar (mirrored under RTL), Home and End, disabled skipped, each a tab stop
  const focused = () => page.evaluate(() => (document.activeElement as HTMLElement)?.dataset.id ?? null);
  for (const dir of ["ltr", "rtl"]) {
    await page.evaluate((d) => window.mountBar({}, "400px", d), dir);
    await page.focus(".mtrl-navigation-bar__item[data-id='home']");
    const next = dir === "ltr" ? "ArrowRight" : "ArrowLeft", previous = dir === "ltr" ? "ArrowLeft" : "ArrowRight";
    await page.keyboard.press(next); assert.equal(await focused(), "search", `${dir}: next`);
    await page.keyboard.press(next); assert.equal(await focused(), "library", `${dir}: the disabled item skipped`);
    await page.keyboard.press(previous); assert.equal(await focused(), "search", `${dir}: previous`);
    await page.keyboard.press("End"); assert.equal(await focused(), "library", `${dir}: End`);
    await page.keyboard.press("Home"); assert.equal(await focused(), "home", `${dir}: Home`);
  }
  await page.keyboard.press("Tab");
  assert.equal(await focused(), "search", "every destination is a tab stop");
  await page.keyboard.press("Enter");
  assert.deepEqual(await page.evaluate(() => [window.selected, window.bar.getActive()]), [["search"], "search"], "Enter selects once");
  await page.click(".mtrl-navigation-bar__item[data-id='off']", { force: true });
  assert.deepEqual(await page.evaluate(() => [window.selected.length, window.bar.getActive()]), [1, "search"], "a disabled destination is not selected");

  // Hide on scroll, sliding out; focus inside brings it back
  await page.evaluate(() => {
    window.mountBar({ hideOnScroll: true }, "400px");
    Object.assign(window.bar.element.style, { position: "fixed", bottom: "0", left: "0", width: "400px" });
  });
  const state = () => page.evaluate(() => ({ hidden: window.bar.isHidden(), transform: getComputedStyle(window.bar.element).transform, transition: getComputedStyle(window.bar.element).transitionDuration }));
  // The bar follows `scroll` events, which the browser sends in its next rendering
  // step, not at the call, and it slides for 450ms. The fixed waits here (50, 500 and
  // 100ms) were only long enough for that: 500ms for an event and a 450ms slide leaves
  // little, and a late frame has the transform read mid-slide.
  // The page scrolls smoothly (`html { scroll-behavior: smooth }`), so one scrollTo is a
  // stream of scroll events over about 400ms, and the bar answers each of them: a
  // step taken before the last one is undone by the next. `scrolled` returns when the
  // scroll has arrived where it was sent (its listener is added after the bar's, so
  // the bar has seen that last event), 5s at most, with the position it reached.
  // `until` then waits, 5s at most, for the state asserted right after, and says at
  // which step it gave up and what it found.
  const scrolled = (y: number): Promise<{ arrived: boolean; y: number }> => page.evaluate(y => new Promise<{ arrived: boolean; y: number }>(resolve => {
    const done = (arrived: boolean): void => { window.removeEventListener("scroll", onScroll); clearTimeout(timer); resolve({ arrived, y: Math.round(window.scrollY) }); };
    const onScroll = (): void => { if (Math.round(window.scrollY) === y) done(true); };
    const timer = setTimeout(() => done(false), 5000);
    window.addEventListener("scroll", onScroll);
    window.scrollTo(0, y);
  }), y);
  const until = async (step: string, what: string, ready: (now: Awaited<ReturnType<typeof state>>) => boolean): Promise<void> => {
    for (const end = Date.now() + 5000; ;) {
      const now = await state();
      if (ready(now)) return;
      if (Date.now() > end) throw new Error(`${step}: still waiting after 5s for ${what}; found ${JSON.stringify(now)}`);
      await page.waitForTimeout(20);
    }
  };
  assert.deepEqual(await scrolled(50), { arrived: true, y: 50 }, "the first scroll arrived");
  assert.deepEqual(await scrolled(400), { arrived: true, y: 400 }, "and the second");
  await until("scrolling down", "the bar hidden and slid down its height", now => now.hidden && now.transform.endsWith(", 64)"));
  const down = await state();
  assert.equal(down.hidden, true, "hidden scrolling down");
  assert.ok(down.transform.endsWith(", 64)"), `slid down its height: ${down.transform}`);
  assert.notEqual(down.transition, "0s", "it slides");
  assert.deepEqual(await scrolled(100), { arrived: true, y: 100 }, "the scroll up arrived");
  await until("scrolling up", "the bar shown again", now => !now.hidden);
  assert.equal((await state()).hidden, false, "shown scrolling up");
  await page.evaluate(() => window.bar.hide());
  await page.focus(".mtrl-navigation-bar__item[data-id='home']");
  assert.equal((await state()).hidden, false, "focus inside shows it");

  // Reduced motion: hidden without the slide
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.bar.hide());
  const reduced = await state();
  assert.deepEqual([reduced.hidden, reduced.transition], [true, "0s"], "reduced motion: hidden at once");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Teardown: no listener left behind
  await page.evaluate(() => { window.bar.destroy(); window.scrollTo(0, 0); window.scrollTo(0, 800); });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.waitForTimeout(100);
  assert.deepEqual(errors, []);
  await page.close();
  console.log("Passed navigation bar: ShortNavigationBar geometry and colours with full and selective CSS, badges, the container query and forced layouts, the keyboard in both directions, hide on scroll with and without reduced motion, teardown.");
} finally {
  await browser.close();
  server.stop(true);
}
