#!/usr/bin/env bun
// mtrl/solid in a real browser.
//
// The same app (scripts/fixtures/solid-app.tsx), in Solid JSX compiled by
// babel-preset-solid as a Solid app's build compiles it, is rendered to a
// string with solid-js/web and no DOM, then hydrated in Chromium with Solid's
// development build. Runs against the build.
//
//   bun run build && bun run scripts/check-solid.ts

import assert from "node:assert/strict";
import { transformAsync } from "@babel/core";
import { chromium, type Page } from "playwright";
import type { BunPlugin } from "bun";
import { checkAdapterEventValues } from "./check-adapter-event-values";

const solid = (generate: "dom" | "ssr"): BunPlugin => ({
  name: "solid",
  setup(build) {
    build.onLoad({ filter: /fixtures\/solid-[a-z]+\.tsx$/ }, async ({ path }) => {
      const result = await transformAsync(await Bun.file(path).text(), {
        filename: path,
        presets: [["babel-preset-solid", { generate, hydratable: true }], "@babel/preset-typescript"],
      });
      return { contents: result?.code ?? "", loader: "js" };
    });
  },
});

const bundle = async (entry: string, target: "browser" | "bun"): Promise<string> => {
  const result = await Bun.build({
    entrypoints: [entry],
    target,
    plugins: [solid(target === "bun" ? "ssr" : "dom")],
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
    setControlled: (v: boolean) => void;
    setExtra: (v: boolean) => void;
    setOrder: (v: string[]) => void;
    setShow: (v: boolean) => void;
    setProgress: (v: number) => void;
    setDialog: (v: boolean) => void;
    setDialogText: (v: string) => void;
    setRail: (v: boolean) => void;
    element: () => (HTMLElement & { toggle: () => void; checked: boolean }) | undefined;
  };
};

const browser = await chromium.launch({ headless: true });
let checks = 0;

const run = async (): Promise<void> => {
  const check = (name: string): void => {
    checks++;
    console.log(`  ok solid: ${name}`);
  };

  // Server render in this process, no DOM.
  const server = await bundle("scripts/fixtures/solid-server.tsx", "bun");
  const serverPath = `${process.cwd()}/.check-solid.js`;
  await Bun.write(serverPath, server);
  let html: string;
  let head: string;
  try {
    const server = (await import(serverPath)) as { render: () => string; hydrationScript: () => string };
    html = server.render();
    head = server.hydrationScript();
  } finally {
    await Bun.file(serverPath).delete();
  }
  const tag = (id: string): string => html.match(new RegExp(`<m-[a-z]+[^>]*id="${id}"[^>]*>`))?.[0] ?? "";
  // A present boolean, bare (`checked`) as Solid writes it, or `checked=""`.
  assert.match(tag("u"), /\schecked(=""|\s|>)/);
  assert.match(tag("u"), /name="u"/);
  assert.match(tag("d"), /\sdisabled(=""|\s|>)/);
  assert.match(tag("d"), /supporting-text="Unavailable"/);
  assert.match(tag("t"), /value="t2"/);
  assert.match(tag("rd"), /value="m"/);
  assert.match(tag("b"), /variant="filled"/);
  assert.match(tag("b"), /class="save ?"/); // Solid's server renderer may leave a trailing space
  assert.match(tag("dg"), /^<m-dialog /);
  assert.doesNotMatch(tag("dg"), /\sopen/);
  assert.match(tag("dt"), /value="2026-09-10"/);
  assert.match(html, /<m-search [^>]*value="ap"[^>]*>.*?<m-search-suggestion [^>]*value="apple"[^>]*>(<!---->)?Apple<.*?<m-search-suggestion [^>]*value="apricot"[^>]*>(<!---->)?Apricot</s);
  assert.doesNotMatch(html, /<m-search-suggestion [^>]*value="banana"/);
  check("renders on a server without a DOM, attributes in the markup");

  const client = await bundle("scripts/fixtures/solid-client.tsx", "browser");
  const http = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/client.js") return new Response(client, { headers: { "Content-Type": "text/javascript" } });
      if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css">${head}</head>
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
    await page
      .waitForFunction(() => !!((window as unknown as Win).hydrated && (window as unknown as Win).api), undefined, { timeout: 10_000 })
      .catch((error: Error) => {
        throw new Error(`${error.message}\npage problems:\n${problems.join("\n")}`);
      });
    await page.waitForFunction(() => !!(document.getElementById("t") as HTMLElement & { component?: unknown }).component);

    // ------------------------------------------------------------- switch
    const uncontrolled = page.getByRole("switch", { name: "Uncontrolled", exact: true });
    assert.equal(await uncontrolled.isChecked(), true);
    assert.equal(await page.getByRole("switch", { name: "Controlled", exact: true }).isChecked(), false);
    check("hydrates: defaultChecked and controlled checked apply");

    await uncontrolled.click();
    assert.deepEqual(await page.evaluate(() => (window as unknown as Win).api.log), [
      { id: "u", detail: { checked: false, value: false, valueAttribute: "on", nativeEvent: { isTrusted: true } } },
    ]);
    assert.equal(await uncontrolled.isChecked(), false);
    check("uncontrolled: a click calls onChange with the typed detail");

    await page.getByRole("switch", { name: "Controlled", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("controlled")?.textContent === "true");
    assert.equal(await page.getByRole("switch", { name: "Controlled", exact: true }).isChecked(), true);
    check("controlled: onChange updates state, state updates the switch");

    // State set from outside reaches the element, without an event back.
    const pushed = await page.evaluate(async () => {
      const w = window as unknown as Win;
      const before = w.api.log.length;
      w.api.setControlled(false);
      await new Promise((r) => setTimeout(r, 50));
      const c = document.getElementById("c") as HTMLElement & { checked: boolean };
      return { checked: c.checked, events: w.api.log.length - before };
    });
    assert.deepEqual(pushed, { checked: false, events: 0 });
    assert.equal(await page.getByRole("switch", { name: "Controlled", exact: true }).isChecked(), false);
    check("controlled: state set from outside reaches the element");

    const disabled = await page.evaluate(() => {
      const d = document.getElementById("d") as HTMLElement;
      return { input: d.shadowRoot?.querySelector("input")?.disabled, text: d.shadowRoot?.textContent };
    });
    assert.equal(disabled.input, true);
    assert.match(disabled.text ?? "", /Unavailable/);
    check("boolean and dashed attributes reach the component");

    const ref = await page.evaluate(() => {
      const el = (window as unknown as Win).api.element();
      if (!el) return null;
      el.toggle();
      return { tag: el.localName, checked: el.checked };
    });
    assert.deepEqual(ref, { tag: "m-switch", checked: true });
    check("ref is the element, with its forwarded methods");

    // ------------------------------------------------------------- button
    const button = await page.evaluate(() => {
      const b = document.getElementById("b") as HTMLElement;
      // classList, not className: Solid's server markup can carry "save ".
      return { save: b.classList.contains("save"), data: b.dataset.test };
    });
    assert.deepEqual(button, { save: true, data: "1" });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    assert.equal(await page.evaluate(() => (window as unknown as Win).api.submits), 1);
    check("button: host props pass through, type=submit reaches onSubmit");

    // ------------------------------------------------------------- checkbox
    await page.getByRole("checkbox", { name: "Agree", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("agreed")?.textContent === "true");
    assert.equal(await page.getByRole("checkbox", { name: "Agree", exact: true }).isChecked(), true);
    check("checkbox: controlled checked and onChange");

    // ------------------------------------------------------------- slider
    await page.getByRole("slider", { name: "Level", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.getElementById("level")?.textContent === "51");
    assert.equal(await page.getByRole("slider", { name: "Level", exact: true }).getAttribute("aria-valuenow"), "51");
    check("slider: controlled value and onChange");
    // ------------------------------------------------------------- textfield
    await page.getByRole("textbox", { name: "Name", exact: true }).pressSequentially("Ada");
    await page.waitForFunction(() => document.getElementById("text")?.textContent === "Ada");
    assert.equal(await page.getByRole("textbox", { name: "Name", exact: true }).inputValue(), "Ada");
    check("textfield: controlled value and onInput");
    // ------------------------------------------------------------- radios
    const sizes = page.getByRole("radiogroup", { name: "Size" });
    assert.equal(await sizes.getByRole("radio", { name: "Medium", exact: true, checked: true }).count(), 1);
    await sizes.getByText("Large", { exact: true }).click();
    await page.waitForFunction(() => document.getElementById("size")?.textContent === "l");
    assert.equal(await sizes.getByRole("radio", { name: "Large", exact: true, checked: true }).count(), 1);
    check("radios: controlled value and onChange");
    // ------------------------------------------------------------- chips
    const diet = page.getByRole("grid", { name: "Diet" });
    assert.equal(await diet.getByRole("gridcell", { name: "Vegetarian", exact: true, selected: true }).count(), 1);
    await diet.getByRole("gridcell", { name: "Gluten free", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("diet")?.textContent === "veg,gf");
    assert.equal(await diet.getByRole("gridcell", { name: "Gluten free", exact: true, selected: true }).count(), 1);
    check("chips: controlled value and onChange");
    await checkAdapterEventValues(page);
    check("change/input handlers read boolean, string and array detail.value equal to the host model");

    // ------------------------------------------------------------- navigation rail
    const rail = page.getByRole("navigation", { name: "Main" });
    assert.equal(await rail.getByRole("button", { name: "Inbox", exact: true }).getAttribute("aria-current"), "page");
    await rail.getByRole("button", { name: "Sent", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("destination")?.textContent === "sent");
    assert.equal(await rail.getByRole("button", { name: "Sent", exact: true }).getAttribute("aria-current"), "page");
    check("navigation rail: controlled value and onChange");

    // ------------------------------------------------------------- list
    const fruits = page.getByRole("list", { name: "Fruits" });
    assert.equal(await fruits.getByRole("button", { name: "Banana", pressed: true }).count(), 1);
    await fruits.getByRole("button", { name: "Cherry" }).click();
    await page.waitForFunction(() => document.getElementById("fruit")?.textContent === "c");
    assert.equal(await fruits.getByRole("button", { name: "Cherry", pressed: true }).count(), 1);
    check("list: a click on an item updates the controlled value through onChange");
    // ------------------------------------------------------------- select
    const pet = page.getByRole("combobox", { name: "Pet", exact: true });
    assert.equal(await pet.inputValue(), "Cat");
    await page.locator("#se").click();
    await page.getByRole("option", { name: "Dog", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("pet")?.textContent === "dog");
    assert.equal(await pet.inputValue(), "Dog");
    check("select: choosing an option updates the controlled value");
    // ------------------------------------------------------------- datepicker
    assert.equal(await page.locator("#dt input").first().inputValue(), "09/10/2026");
    await page.locator('#dt [data-action="open"]').click();
    await page.locator('#dt dialog [data-date="2026-09-14"]').first().click();
    await page.locator('#dt dialog [data-action="confirm"]').click();
    await page.waitForFunction(() => document.getElementById("due")?.textContent === "2026-09-14");
    assert.equal(await page.locator("#dt input").first().inputValue(), "09/14/2026");
    check("datepicker: choosing a date and confirming updates the controlled value");

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
    check("search: typing updates the controlled value, the suggestions follow it, and choosing one updates it");

    // ------------------------------------------------------------- tabs
    assert.equal(await page.getByRole("tab", { name: "Trips", exact: true, selected: true }).count(), 1);
    await page.getByRole("tab", { name: "Flights", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("tab")?.textContent === "t1");
    assert.equal(await page.getByRole("tab", { name: "Flights", exact: true, selected: true }).count(), 1);
    check("tabs: controlled value and onChange");

    await page.evaluate(() => (window as unknown as Win).api.setExtra(true));
    await page.waitForFunction(() => document.getElementById("t")?.shadowRoot?.querySelectorAll('[role="tab"]').length === 3);
    assert.equal(await page.getByRole("tab", { name: "Flights", exact: true, selected: true }).count(), 1);
    check("tabs: a Tab rendered later is added, and the selection is kept");

    // Rendered in the browser, not on the server: Solid sets the Tab's value as a property.
    await page.getByRole("tab", { name: "Hotels", exact: true }).click();
    await page.waitForFunction(() => document.getElementById("tab")?.textContent === "t3");
    check("a Tab rendered in the browser reports its value, not its label");

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

    // Named slots as props reach the element's slots (FLO-333), each in a
    // wrapper carrying slot="…"; the headline's nodes are not its attribute.
    const slotted = await page.evaluate(() => {
      const host = document.getElementById("dg");
      const read = (name: string): string[] =>
        (host?.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${name}"]`)?.assignedElements() ?? [])
          .map((node) => node.querySelector("[id]")?.id ?? node.textContent?.trim() ?? "");
      return { headline: read("headline"), actions: read("actions"), attribute: host?.getAttribute("headline") ?? null };
    });
    assert.deepEqual(slotted, { headline: ["Discard draft?"], actions: ["dga"], attribute: null });
    check("dialog: headline and actions props reach their slots");

    // A change of the default slot's children keeps the named slots' wrappers
    // and their nodes (FLO-334): they are rebuilt only when their prop changes.
    const kept = await page.evaluate(async () => {
      const host = document.getElementById("dg") as HTMLElement;
      const before = { wrapper: host.querySelector('[slot="actions"]'), button: document.getElementById("dga") };
      (window as unknown as Win).api.setDialogText("Your draft will be deleted.");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return {
        text: host.textContent?.includes("Your draft will be deleted.") ?? false,
        wrapper: host.querySelector('[slot="actions"]') === before.wrapper,
        button: document.getElementById("dga") === before.button,
      };
    });
    assert.deepEqual(kept, { text: true, wrapper: true, button: true });
    check("dialog: new default children keep the named slots' wrappers and nodes");

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

    assert.deepEqual(problems, [], "no errors, hydration warnings or Solid warnings");
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

console.log(`solid: ${checks} checks passed`);
