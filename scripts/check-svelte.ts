#!/usr/bin/env bun
// mtrl/svelte in a real browser.
//
// The same app (scripts/fixtures/svelte-app.svelte) is compiled with the
// Svelte compiler, rendered to a string with svelte/server and no DOM, then
// hydrated in Chromium in development mode, so Svelte reports mismatches. The
// components are the .svelte files the build writes to dist/svelte, compiled
// as an app would compile them. Runs against the build.
//
//   bun run build && bun run scripts/check-svelte.ts

import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { compile } from "svelte/compiler";
import type { BunPlugin } from "bun";
import { checkAdapterEventValues } from "./check-adapter-event-values";

const svelte = (generate: "client" | "server"): BunPlugin => ({
  name: "svelte",
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await Bun.file(path).text(), { filename: path, generate, dev: true }).js.code,
      loader: "js",
    }));
  },
});

const bundle = async (entry: string, target: "browser" | "bun"): Promise<string> => {
  const result = await Bun.build({
    entrypoints: [entry],
    target,
    plugins: [svelte(target === "bun" ? "server" : "client")],
    conditions: ["development"],
  });
  assert(result.success, String(result.logs));
  return result.outputs[0].text();
};

type Win = Window & {
  hydrated?: boolean;
  api: {
    log: Array<{ id: string; detail: unknown }>;
    submits: number;
    setBound: (v: boolean) => void;
    setExtra: (v: boolean) => void;
    setOrder: (v: string[]) => void;
    setShow: (v: boolean) => void;
    setProgress: (v: number) => void;
    setDialog: (v: boolean) => void;
    setRail: (v: boolean) => void;
    ref: HTMLElement | null;
    renderCalls: number;
  };
};

const browser = await chromium.launch({ headless: true });
let checks = 0;

const run = async (): Promise<void> => {
  const check = (name: string): void => {
    checks++;
    console.log(`  ok svelte: ${name}`);
  };

  // The generated declarations compile on their own, as an app's TypeScript sees them.
  const declarations = [...new Bun.Glob("dist/svelte/*.d.ts").scanSync()];
  const tsc = Bun.spawnSync([
    "bunx", "tsc", "--noEmit", "--strict", "--moduleResolution", "bundler", "--module", "esnext",
    "--target", "es2022", "--lib", "es2022,dom", ...declarations,
  ], { stdout: "pipe", stderr: "pipe" });
  assert.equal(tsc.exitCode, 0, tsc.stdout.toString() + tsc.stderr.toString());
  check("the generated declarations compile");

  // FLO-383: the text field is TextField (and TextField.svelte); the old spelling is gone in 1.0
  for (const file of ["dist/svelte/index.js", "dist/svelte/index.d.ts"]) {
    const index = await Bun.file(file).text();
    assert.match(index, /export \{ default as TextField \} from "\.\/TextField\.svelte";/, file);
    assert.doesNotMatch(index, /Textfield/, file);
  }
  check("the text field is TextField, and only TextField (FLO-383)");

  // Server render in this process, no DOM.
  const server = await bundle("scripts/fixtures/svelte-server.ts", "bun");
  const serverPath = `${process.cwd()}/.check-svelte.js`;
  await Bun.write(serverPath, server);
  let html: string;
  try {
    const { render } = (await import(serverPath)) as { render: () => string };
    html = render();
  } finally {
    await Bun.file(serverPath).delete();
  }
  assert.match(html, /<m-switch id="u" name="u" checked="">/);
  assert.match(html, /<m-switch id="d" disabled="" supporting-text="Unavailable">/);
  assert.match(html, /<m-tabs id="t" value="t2">/);
  // `{#if shadow}` leaves an empty branch marker before children when no
  // renderer is registered (FLO-375). Comments are not elements.
  const between = String.raw`(?:\s|<!--[\s\S]*?-->)*`;
  assert.match(html, new RegExp(String.raw`<m-radios [^>]*value="m"[^>]*>${between}<m-radio value="s">`));
  assert.match(html, new RegExp(String.raw`<m-chips [^>]*value="veg"[^>]*>${between}<m-chip value="veg">`));
  assert.match(html, new RegExp(String.raw`<m-select [^>]*value="cat"[^>]*>${between}<m-select-option value="cat">`));
  assert.match(html, /<m-datepicker [^>]*value="2026-09-10"/);
  assert.match(html, /<m-search [^>]*value="ap"[^>]*>.*?<m-search-suggestion [^>]*value="apple"[^>]*>(<!---->)?Apple<.*?<m-search-suggestion [^>]*value="apricot"[^>]*>(<!---->)?Apricot</s);
  assert.doesNotMatch(html, /<m-search-suggestion [^>]*value="banana"/);
  assert.match(html, /<m-button id="b" type="submit" variant="filled" class="save" data-test="1">/);
  assert.match(html, /<m-dialog [^>]*id="dg"[^>]*>/);
  assert.doesNotMatch(html, /<m-dialog [^>]*open/);
  check("renders on a server without a DOM, attributes in the markup");

  const client = await bundle("scripts/fixtures/svelte-client.ts", "browser");
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
    assert.equal(await page.getByRole("switch", { name: "Bound", exact: true }).isChecked(), false);
    check("hydrates: defaultChecked and bind:checked apply");

    await uncontrolled.click();
    assert.deepEqual(await page.evaluate(() => (window as unknown as Win).api.log), [
      { id: "u", detail: { checked: false, value: false, valueAttribute: "on", nativeEvent: { isTrusted: true } } },
    ]);
    assert.equal(await uncontrolled.isChecked(), false);
    check("uncontrolled: a click calls onchange with the typed detail");

    await page.getByRole("switch", { name: "Bound", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("bound")?.textContent === "true");
    check("bind:checked: a click updates the bound state");

    // State set from outside reaches the element, without an event back.
    const pushed = await page.evaluate(async () => {
      const w = window as unknown as Win;
      const before = w.api.log.length;
      w.api.setBound(false);
      await new Promise((r) => setTimeout(r, 50));
      const m = document.getElementById("m") as HTMLElement & { checked: boolean };
      return { checked: m.checked, events: w.api.log.length - before };
    });
    assert.deepEqual(pushed, { checked: false, events: 0 });
    assert.equal(await page.getByRole("switch", { name: "Bound", exact: true }).isChecked(), false);
    check("bind:checked: state set from outside reaches the element");

    const disabled = await page.evaluate(() => {
      const d = document.getElementById("d") as HTMLElement;
      return { input: d.shadowRoot?.querySelector("input")?.disabled, text: d.shadowRoot?.textContent };
    });
    assert.equal(disabled.input, true);
    assert.match(disabled.text ?? "", /Unavailable/);
    check("boolean and dashed attributes reach the component");


    // ------------------------------------------------------------- button
    const button = await page.evaluate(() => {
      const b = document.getElementById("b") as HTMLElement;
      return { className: b.className, data: b.dataset.test };
    });
    assert.deepEqual(button, { className: "save", data: "1" });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    assert.equal(await page.evaluate(() => (window as unknown as Win).api.submits), 1);
    check("button: host attributes pass through, type=submit reaches onsubmit");

    // ------------------------------------------------------------- checkbox
    await page.getByRole("checkbox", { name: "Agree", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("agreed")?.textContent === "true");
    assert.equal(await page.getByRole("checkbox", { name: "Agree", exact: true }).isChecked(), true);
    check("checkbox: bind:checked");

    // ------------------------------------------------------------- slider
    await page.getByRole("slider", { name: "Level", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.getElementById("level")?.textContent === "51");
    assert.equal(await page.getByRole("slider", { name: "Level", exact: true }).getAttribute("aria-valuenow"), "51");
    check("slider: bind:value");
    // ------------------------------------------------------------- textfield
    await page.getByRole("textbox", { name: "Name", exact: true }).pressSequentially("Ada");
    await page.waitForFunction(() => document.getElementById("text")?.textContent === "Ada");
    assert.equal(await page.getByRole("textbox", { name: "Name", exact: true }).inputValue(), "Ada");
    check("textfield: bind:value");
    // ------------------------------------------------------------- radios
    const sizes = page.getByRole("radiogroup", { name: "Size" });
    assert.equal(await sizes.getByRole("radio", { name: "Medium", exact: true, checked: true }).count(), 1);
    await sizes.getByText("Large", { exact: true }).click();
    await page.waitForFunction(() => document.getElementById("size")?.textContent === "l");
    assert.equal(await sizes.getByRole("radio", { name: "Large", exact: true, checked: true }).count(), 1);
    check("radios: bind:value");
    // ------------------------------------------------------------- chips
    const diet = page.getByRole("grid", { name: "Diet" });
    assert.equal(await diet.getByRole("gridcell", { name: "Vegetarian", exact: true, selected: true }).count(), 1);
    await diet.getByRole("gridcell", { name: "Gluten free", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("diet")?.textContent === "veg,gf");
    assert.equal(await diet.getByRole("gridcell", { name: "Gluten free", exact: true, selected: true }).count(), 1);
    check("chips: bind:value");
    await checkAdapterEventValues(page);
    check("change/input handlers read boolean, string and array detail.value equal to the host model");

    // ------------------------------------------------------------- navigation rail
    const rail = page.getByRole("navigation", { name: "Main" });
    assert.equal(await rail.getByRole("button", { name: "Inbox", exact: true }).getAttribute("aria-current"), "page");
    await rail.getByRole("button", { name: "Sent", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("destination")?.textContent === "sent");
    assert.equal(await rail.getByRole("button", { name: "Sent", exact: true }).getAttribute("aria-current"), "page");
    check("navigation rail: bind:value");

    // ------------------------------------------------------------- list
    const fruits = page.getByRole("list", { name: "Fruits" });
    assert.equal(await fruits.getByRole("button", { name: "Banana", pressed: true }).count(), 1);
    await fruits.getByRole("button", { name: "Cherry" }).click();
    await page.waitForFunction(() => document.getElementById("fruit")?.textContent === "c");
    assert.equal(await fruits.getByRole("button", { name: "Cherry", pressed: true }).count(), 1);
    check("list: a click on an item updates bind:value");
    // ------------------------------------------------------------- select
    const pet = page.getByRole("combobox", { name: "Pet", exact: true });
    assert.equal(await pet.inputValue(), "Cat");
    await page.locator("#se").click();
    await page.getByRole("option", { name: "Dog", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("pet")?.textContent === "dog");
    assert.equal(await pet.inputValue(), "Dog");
    check("select: choosing an option updates the bound value");
    // ------------------------------------------------------------- datepicker
    assert.equal(await page.locator("#dt input").first().inputValue(), "09/10/2026");
    await page.locator('#dt [data-action="open"]').click();
    await page.locator('#dt dialog [data-date="2026-09-14"]').first().click();
    await page.locator('#dt dialog [data-action="confirm"]').click();
    await page.waitForFunction(() => document.getElementById("due")?.textContent === "2026-09-14");
    assert.equal(await page.locator("#dt input").first().inputValue(), "09/14/2026");
    check("datepicker: choosing a date and confirming updates the bound value");

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
    check("search: typing updates the bound value, the suggestions follow it, and choosing one updates it");

    // ------------------------------------------------------------- tabs
    assert.equal(await page.getByRole("tab", { name: "Trips", exact: true, selected: true }).count(), 1);
    await page.getByRole("tab", { name: "Flights", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("tab")?.textContent === "t1");
    assert.equal(await page.getByRole("tab", { name: "Flights", exact: true, selected: true }).count(), 1);
    check("tabs: bind:value");

    await page.evaluate(() => {
      (window as unknown as Win).api.setExtra(true);
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
      (window as unknown as Win).api.setProgress(70);
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

    // A named snippet is the headline slot's content (FLO-325): the slot the
    // element renders the headline into is assigned the snippet's text.
    const headline = await page.evaluate(() => {
      const slot = document.getElementById("dg")?.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="headline"]');
      return (slot?.assignedNodes({ flatten: true }) ?? []).map((node) => node.textContent).join("").trim();
    });
    assert.equal(headline, "Discard draft?", "the dialog headline");
    const actions = await page.evaluate(() =>
      (document.getElementById("dg")?.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="actions"]')?.assignedElements() ?? [])
        .map((node) => node.querySelector("[id]")?.id ?? node.id));
    assert.deepEqual(actions, ["dga"], "the dialog actions");
    check("dialog: headline and actions snippets reach their slots");

    // bind:this gives the component, whose `element` is the element; an
    // attachment runs on the element (FLO-325).
    assert.equal(await page.evaluate(() => (window as unknown as Win).api.ref === document.getElementById("bt")), true, "bind:this");
    assert.equal(await page.evaluate(() => document.getElementById("at")?.dataset.attached), "yes", "{@attach}");
    check("bind:this reads the element, and {@attach} reaches it");

    // Only a prop named after a declared slot is a snippet: a camelCase
    // handler and a spread callback are never called by rendering, and render
    // no slot wrapper (FLO-334).
    assert.deepEqual(await page.evaluate(() => ({
      calls: (window as unknown as Win).api.renderCalls,
      wrappers: document.getElementById("cbk")?.querySelectorAll("[slot]").length,
    })), { calls: 0, wrappers: 0 });
    check("callback props that are not slots are not rendered as snippets");

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
      w.api.setOrder(["b", "a"]);
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
      w.api.setShow(false);
      await new Promise((r) => setTimeout(r, 50));
      return { removed: !gone.isConnected, destroyed: gone.component === null };
    });
    assert.deepEqual(unmounted, { removed: true, destroyed: true });
    check("unmounting destroys the component");

    assert.deepEqual(problems, [], "no errors, hydration warnings or Svelte warnings");
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

console.log(`svelte: ${checks} checks passed`);
