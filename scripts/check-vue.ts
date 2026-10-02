#!/usr/bin/env bun
// mtrl/vue in a real browser.
//
// The same app (scripts/fixtures/vue-app.ts) is rendered to a string with
// Vue's server renderer, with no DOM, then hydrated in Chromium: the adapter
// must import safely on a server, produce markup that hydrates without a
// mismatch, and keep v-model in step with the element. Runs against the build.
//
//   bun run build && bun run scripts/check-vue.ts

import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { checkAdapterEventValues } from "./check-adapter-event-values";

// Development builds, so Vue reports hydration mismatches and warnings.
const defines = {
  "process.env.NODE_ENV": '"development"',
  __VUE_OPTIONS_API__: "true",
  __VUE_PROD_DEVTOOLS__: "false",
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "true",
};

const bundle = async (entry: string, target: "browser" | "bun"): Promise<string> => {
  const result = await Bun.build({ entrypoints: [entry], target, define: defines });
  assert(result.success, String(result.logs));
  return result.outputs[0].text();
};

type Win = Window & {
  hydrated?: boolean;
  api: {
    log: Array<{ id: string; detail: unknown }>;
    submits: number;
    model: { value: boolean };
    extra: { value: boolean };
    order: { value: string[] };
    show: { value: boolean };
    progress: { value: number };
    setDialog: (v: boolean) => void;
    setRail: (v: boolean) => void;
    switchRef: { value: { element: (HTMLElement & { toggle: () => void; checked: boolean }) | null } | null };
  };
};

const browser = await chromium.launch({ headless: true });
let checks = 0;

const run = async (): Promise<void> => {
  const check = (name: string): void => {
    checks++;
    console.log(`  ok vue: ${name}`);
  };

  // Server render in this process, no DOM.
  const server = await bundle("scripts/fixtures/vue-server.ts", "bun");
  const serverPath = `${process.cwd()}/.check-vue.js`;
  await Bun.write(serverPath, server);
  let html: string;
  try {
    const { render } = (await import(serverPath)) as { render: () => Promise<string> };
    html = await render();
  } finally {
    await Bun.file(serverPath).delete();
  }
  assert.match(html, /<m-switch checked name="u" id="u">Uncontrolled<\/m-switch>/);
  assert.match(html, /<m-switch disabled supporting-text="Unavailable" id="d">/);
  assert.match(html, /<m-tabs value="t2" id="t">/);
  assert.match(html, /<m-radios [^>]*value="m"[^>]*>.*<m-radio value="s">Small<\/m-radio>/s);
  assert.match(html, /<m-chips [^>]*value="veg"[^>]*>.*<m-chip value="veg">Vegetarian<\/m-chip>/s);
  assert.match(html, /<m-select [^>]*value="cat"[^>]*>.*<m-select-option value="cat">Cat<\/m-select-option>/s);
  assert.match(html, /<m-datepicker [^>]*value="2026-09-10"/);
  assert.match(html, /<m-search [^>]*value="ap"[^>]*>.*?<m-search-suggestion [^>]*value="apple"[^>]*>(<!---->)?Apple<.*?<m-search-suggestion [^>]*value="apricot"[^>]*>(<!---->)?Apricot</s);
  assert.doesNotMatch(html, /<m-search-suggestion [^>]*value="banana"/);
  assert.match(html, /<m-button variant="filled" type="submit" id="b" class="save" data-test="1">Save<\/m-button>/);
  assert.match(html, /<m-dialog [^>]*id="dg"[^>]*>/);
  assert.doesNotMatch(html, /<m-dialog [^>]*open/);
  check("renders on a server without a DOM, attributes in the markup");

  const client = await bundle("scripts/fixtures/vue-client.ts", "browser");
  const http = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/client.js") return new Response(client, { headers: { "Content-Type": "text/javascript" } });
      if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css"></head>
<body><div id="root">${html}</div><script type="module" src="/client.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    },
  });

  const page: Page = await browser.newPage();
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
  });

  try {
    await page.goto(`http://127.0.0.1:${http.port}`);
    await page.waitForFunction(() => (window as unknown as Win).hydrated && (window as unknown as Win).api);
    await page.waitForFunction(() => !!(document.getElementById("t") as HTMLElement & { component?: unknown }).component);

    // ------------------------------------------------------------- switch
    const uncontrolled = page.getByRole("switch", { name: "Uncontrolled", exact: true });
    assert.equal(await uncontrolled.isChecked(), true);
    assert.equal(await page.getByRole("switch", { name: "Model", exact: true }).isChecked(), false);
    check("hydrates: defaultChecked and v-model apply");

    await uncontrolled.click();
    assert.deepEqual(await page.evaluate(() => (window as unknown as Win).api.log), [
      { id: "u", detail: { checked: false, value: false, valueAttribute: "on", nativeEvent: { isTrusted: true } } },
    ]);
    assert.equal(await uncontrolled.isChecked(), false);
    check("uncontrolled: a click calls onChange with the typed detail");

    await page.getByRole("switch", { name: "Model", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("model")?.textContent === "true");
    check("v-model: a click updates the bound state");

    await page.getByRole("switch", { name: "Named", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("named")?.textContent === "true");
    check("v-model:checked: a click updates the bound state");

    // State set from outside reaches the element, without an event back.
    const pushed = await page.evaluate(async () => {
      const w = window as unknown as Win;
      const before = w.api.log.length;
      w.api.model.value = false;
      await new Promise((r) => setTimeout(r, 50));
      const m = document.getElementById("m") as HTMLElement & { checked: boolean };
      return { checked: m.checked, events: w.api.log.length - before };
    });
    assert.deepEqual(pushed, { checked: false, events: 0 });
    assert.equal(await page.getByRole("switch", { name: "Model", exact: true }).isChecked(), false);
    check("v-model: state set from outside reaches the element");

    const disabled = await page.evaluate(() => {
      const d = document.getElementById("d") as HTMLElement;
      return { input: d.shadowRoot?.querySelector("input")?.disabled, text: d.shadowRoot?.textContent };
    });
    assert.equal(disabled.input, true);
    assert.match(disabled.text ?? "", /Unavailable/);
    check("boolean and dashed attributes reach the component");

    const ref = await page.evaluate(() => {
      const el = (window as unknown as Win).api.switchRef.value?.element;
      if (!el) return null;
      el.toggle();
      return { tag: el.localName, checked: el.checked };
    });
    assert.deepEqual(ref, { tag: "m-switch", checked: true });
    check("the template ref exposes the element, with its forwarded methods");

    // ------------------------------------------------------------- button
    const button = await page.evaluate(() => {
      const b = document.getElementById("b") as HTMLElement;
      return { className: b.className, data: b.dataset.test };
    });
    assert.deepEqual(button, { className: "save", data: "1" });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    assert.equal(await page.evaluate(() => (window as unknown as Win).api.submits), 1);
    check("button: attributes fall through to the host, type=submit reaches @submit");

    // ------------------------------------------------------------- checkbox
    await page.getByRole("checkbox", { name: "Agree", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("agreed")?.textContent === "true");
    assert.equal(await page.getByRole("checkbox", { name: "Agree", exact: true }).isChecked(), true);
    check("checkbox: v-model");

    // ------------------------------------------------------------- slider
    await page.getByRole("slider", { name: "Level", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.getElementById("level")?.textContent === "51");
    assert.equal(await page.getByRole("slider", { name: "Level", exact: true }).getAttribute("aria-valuenow"), "51");
    check("slider: v-model");
    // ------------------------------------------------------------- textfield
    await page.getByRole("textbox", { name: "Name", exact: true }).pressSequentially("Ada");
    await page.waitForFunction(() => document.getElementById("text")?.textContent === "Ada");
    assert.equal(await page.getByRole("textbox", { name: "Name", exact: true }).inputValue(), "Ada");
    check("textfield: v-model");
    // ------------------------------------------------------------- radios
    const sizes = page.getByRole("radiogroup", { name: "Size" });
    assert.equal(await sizes.getByRole("radio", { name: "Medium", exact: true, checked: true }).count(), 1);
    await sizes.getByText("Large", { exact: true }).click();
    await page.waitForFunction(() => document.getElementById("size")?.textContent === "l");
    assert.equal(await sizes.getByRole("radio", { name: "Large", exact: true, checked: true }).count(), 1);
    check("radios: v-model");
    // ------------------------------------------------------------- chips
    const diet = page.getByRole("grid", { name: "Diet" });
    assert.equal(await diet.getByRole("gridcell", { name: "Vegetarian", exact: true, selected: true }).count(), 1);
    await diet.getByRole("gridcell", { name: "Gluten free", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("diet")?.textContent === "veg,gf");
    assert.equal(await diet.getByRole("gridcell", { name: "Gluten free", exact: true, selected: true }).count(), 1);
    check("chips: v-model");
    await checkAdapterEventValues(page);
    check("change/input handlers read boolean, string and array detail.value equal to the host model");

    // ------------------------------------------------------------- navigation rail
    const rail = page.getByRole("navigation", { name: "Main" });
    assert.equal(await rail.getByRole("button", { name: "Inbox", exact: true }).getAttribute("aria-current"), "page");
    await rail.getByRole("button", { name: "Sent", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("destination")?.textContent === "sent");
    assert.equal(await rail.getByRole("button", { name: "Sent", exact: true }).getAttribute("aria-current"), "page");
    check("navigation rail: v-model");

    // ------------------------------------------------------------- list
    const fruits = page.getByRole("list", { name: "Fruits" });
    assert.equal(await fruits.getByRole("button", { name: "Banana", pressed: true }).count(), 1);
    await fruits.getByRole("button", { name: "Cherry" }).click();
    await page.waitForFunction(() => document.getElementById("fruit")?.textContent === "c");
    assert.equal(await fruits.getByRole("button", { name: "Cherry", pressed: true }).count(), 1);
    check("list: a click on an item updates v-model");
    // ------------------------------------------------------------- select
    const pet = page.getByRole("combobox", { name: "Pet", exact: true });
    assert.equal(await pet.inputValue(), "Cat");
    await page.locator("#se").click();
    await page.getByRole("option", { name: "Dog", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("pet")?.textContent === "dog");
    assert.equal(await pet.inputValue(), "Dog");
    check("select: choosing an option updates the v-model value");
    // ------------------------------------------------------------- datepicker
    assert.equal(await page.locator("#dt input").first().inputValue(), "09/10/2026");
    await page.locator('#dt [data-action="open"]').click();
    await page.locator('#dt dialog [data-date="2026-09-14"]').first().click();
    await page.locator('#dt dialog [data-action="confirm"]').click();
    await page.waitForFunction(() => document.getElementById("due")?.textContent === "2026-09-14");
    assert.equal(await page.locator("#dt input").first().inputValue(), "09/14/2026");
    check("datepicker: choosing a date and confirming updates the v-model value");

    // ------------------------------------------------------------- search
    const query = page.getByRole("combobox", { name: "Query", exact: true });
    assert.equal(await query.inputValue(), "ap");
    await query.click();
    await page.keyboard.type("r");
    await page.waitForFunction(() => document.getElementById("query")?.textContent === "apr");
    // The app filters its suggestions by the query: the element redraws them in place
    await page.waitForFunction(() => document.getElementById("sq")?.shadowRoot?.querySelectorAll('[role="option"]').length === 1);
    await page.getByRole("option", { name: "Apricot", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("query")?.textContent === "apricot");
    assert.equal(await query.inputValue(), "apricot");
    check("search: typing updates the v-model value, the suggestions follow it, and choosing one updates it");

    // ------------------------------------------------------------- tabs
    assert.equal(await page.getByRole("tab", { name: "Trips", exact: true, selected: true }).count(), 1);
    await page.getByRole("tab", { name: "Flights", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("tab")?.textContent === "t1");
    assert.equal(await page.getByRole("tab", { name: "Flights", exact: true, selected: true }).count(), 1);
    check("tabs: v-model");

    await page.evaluate(() => {
      (window as unknown as Win).api.extra.value = true;
    });
    await page.waitForFunction(() => document.getElementById("t")?.shadowRoot?.querySelectorAll('[role="tab"]').length === 3);
    assert.equal(await page.getByRole("tab", { name: "Flights", exact: true, selected: true }).count(), 1);
    check("tabs: a Tab rendered later is added, and the selection is kept");

    const late = await page.evaluate(() => {
      const el = document.getElementById("late") as HTMLElement & { checked: boolean };
      return { checked: el.checked, attribute: el.getAttribute("checked"), disabled: el.shadowRoot?.querySelector("input")?.disabled };
    });
    assert.deepEqual(late, { checked: true, attribute: "", disabled: true });
    check("a component mounted after hydration takes defaultChecked and booleans");

    // ------------------------------------------------------------- progress
    const valueNow = (): Promise<string | null | undefined> =>
      page.evaluate(() => document.getElementById("pg")?.shadowRoot?.firstElementChild?.getAttribute("aria-valuenow"));
    assert.equal(await valueNow(), "30");
    await page.evaluate(() => {
      (window as unknown as Win).api.progress.value = 70;
    });
    await page.waitForFunction(() => document.getElementById("pg")?.shadowRoot?.firstElementChild?.getAttribute("aria-valuenow") === "70");
    assert.equal(await valueNow(), "70");
    check("progress: the value prop sets aria-valuenow, and a new value updates it");

    // ------------------------------------------------------------- dialog
    // Controlled: state opens the dialog in the top layer, Escape closes it
    // and the close handler puts the state in step; state closes it again.
    const modal = (): Promise<boolean> =>
      page.evaluate(() => !!document.getElementById("dg")?.shadowRoot?.querySelector("dialog")?.matches(":modal"));
    assert.equal(await modal(), false);
    await page.evaluate(() => (window as unknown as Win).api.setDialog(true));
    await page.waitForFunction(() => !!document.getElementById("dg")?.shadowRoot?.querySelector("dialog")?.matches(":modal"));
    assert.equal(await page.evaluate(() => document.getElementById("dg")?.hasAttribute("open")), true);
    // Temporary (FLO-548, family 6). The dialog ignores a key delivered in the task that opened
    // it: a flag cleared by a 0 ms timer, and a runner can deliver the key before that timer.
    // One timer task in the page, queued after the dialog's, orders the two: not a fixed wait.
    // Remove it when the guard reads the event's timestamp, so that this check proves it.
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.getElementById("dialog")?.textContent === "false");
    assert.deepEqual(
      await page.evaluate(() => ({ modal: !!document.getElementById("dg")?.shadowRoot?.querySelector("dialog")?.open, open: document.getElementById("dg")?.hasAttribute("open") })),
      { modal: false, open: false }
    );
    await page.evaluate(() => (window as unknown as Win).api.setDialog(true));
    await page.waitForFunction(() => !!document.getElementById("dg")?.shadowRoot?.querySelector("dialog")?.matches(":modal"));
    await page.evaluate(() => (window as unknown as Win).api.setDialog(false));
    await page.waitForFunction(() => !document.getElementById("dg")?.shadowRoot?.querySelector("dialog")?.open);
    assert.equal(await modal(), false);
    check("dialog: open follows the state; Escape closes it and the close handler updates the state");

    // Named slots reach the element's slots (FLO-325): text is wrapped to
    // carry slot="headline", a component carries slot="actions" itself.
    const slotted = await page.evaluate(() => {
      const root = document.getElementById("dg")?.shadowRoot;
      const read = (name: string): string[] =>
        (root?.querySelector<HTMLSlotElement>(`slot[name="${name}"]`)?.assignedElements() ?? []).map((node) => node.id || node.textContent?.trim() || "");
      return { headline: read("headline"), actions: read("actions") };
    });
    assert.deepEqual(slotted, { headline: ["Discard draft?"], actions: ["dga"] });
    check("dialog: named slots reach the headline and actions slots");

    // ------------------------------------------------------------- navigation rail: expanded
    // Controlled: state expands the modal rail in the top layer, Escape
    // collapses it and the collapse handler puts the state in step; state
    // collapses it again.
    const railModal = (): Promise<boolean> =>
      page.evaluate(() => !!document.getElementById("mr")?.shadowRoot?.querySelector("dialog")?.matches(":modal"));
    assert.equal(await railModal(), false);
    await page.evaluate(() => (window as unknown as Win).api.setRail(true));
    await page.waitForFunction(() => !!document.getElementById("mr")?.shadowRoot?.querySelector("dialog")?.matches(":modal"));
    assert.equal(await page.evaluate(() => document.getElementById("mr")?.hasAttribute("expanded")), true);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.getElementById("rail")?.textContent === "false");
    assert.deepEqual(
      await page.evaluate(() => ({ modal: !!document.getElementById("mr")?.shadowRoot?.querySelector("dialog")?.open, expanded: document.getElementById("mr")?.hasAttribute("expanded") })),
      { modal: false, expanded: false }
    );
    await page.evaluate(() => (window as unknown as Win).api.setRail(true));
    await page.waitForFunction(() => !!document.getElementById("mr")?.shadowRoot?.querySelector("dialog")?.matches(":modal"));
    await page.evaluate(() => (window as unknown as Win).api.setRail(false));
    await page.waitForFunction(() => !document.getElementById("mr")?.shadowRoot?.querySelector("dialog")?.open);
    assert.equal(await railModal(), false);
    check("navigation rail: expanded follows the state; Escape collapses it and the collapse handler updates the state");

    // ------------------------------------------------------------- lifecycle
    const reordered = await page.evaluate(async () => {
      const w = window as unknown as Win;
      const a = document.getElementById("oa") as HTMLElement & { checked: boolean; component: unknown };
      a.checked = true;
      const before = a.component;
      w.api.order.value = ["b", "a"];
      await new Promise((r) => setTimeout(r, 50));
      const after = document.getElementById("oa") as HTMLElement & { checked: boolean; component: unknown };
      return {
        same: after === a && after.component === before,
        checked: after.checked,
        order: [...document.querySelectorAll('[id^="o"]')].map((e) => e.id),
      };
    });
    assert.deepEqual(reordered, { same: true, checked: true, order: ["ob", "oa"] });
    check("a keyed reorder moves the element and keeps its state");

    const unmounted = await page.evaluate(async () => {
      const w = window as unknown as Win;
      const gone = document.getElementById("gone") as HTMLElement & { component: unknown };
      w.api.show.value = false;
      await new Promise((r) => setTimeout(r, 50));
      return { removed: !gone.isConnected, destroyed: gone.component === null };
    });
    assert.deepEqual(unmounted, { removed: true, destroyed: true });
    check("unmounting destroys the component");

    assert.deepEqual(problems, [], "no errors, hydration warnings or Vue warnings");
    check("no errors or warnings, hydration included");
  } finally {
    await page.close();
    http.stop(true);
  }
};

try {
  await run();
} finally {
  await browser.close();
}

console.log(`vue: ${checks} checks passed`);
