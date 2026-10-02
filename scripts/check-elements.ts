#!/usr/bin/env bun
// The elements in a real browser.
//
// Shadow roots, adopted stylesheets, form association, slots and accessible
// names need a browser: JSDOM has no layout, no ElementInternals and no
// accessibility tree. Each element is checked against the factory it wraps,
// rendered in light DOM with the full stylesheet, so a style that fails to
// cross into the shadow root shows as a difference.
//
//   bun run build && bun run scripts/check-elements.ts

import { checkCheckableValues } from "./check-checkable-values";
import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { checkDeclarativeUpgrade } from "./check-elements-ssr";
import { checkPickers } from "./check-elements-pickers";
import { checkRegistryEvents } from "./check-elements-registry";
import { DEFAULT_OFFSET } from "../src/components/tooltip/types";

// Runs against the build: `bun run build` first, as CI does.
const bundle = await Bun.build({
  entrypoints: ["scripts/fixtures/elements.ts"],
  target: "browser",
  minify: false,
});
assert(bundle.success, String(bundle.logs));
const js = await bundle.outputs[0].text();

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/elements.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
    if (path === "/styles.css") return new Response(Bun.file("dist/styles.css"));
    if (path === "/menu.css") return new Response(Bun.file("dist/styles/menu.css"));
    if (path === "/away") return new Response("<!doctype html><p>away</p>", { headers: { "Content-Type": "text/html" } });
    if (path === "/restore") {
      // no-store keeps the page out of the back/forward cache, so going back
      // reloads it and the browser restores the form's state into it.
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css"></head>
<body><form><m-switch id="r" name="r">Restored</m-switch>
<m-checkbox id="rc" name="rc">Restored checkbox</m-checkbox>
<m-textfield id="rt" name="rt" label="Restored text"></m-textfield></form><a id="go" href="/away">away</a>
<script type="module" src="/elements.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } }
      );
    }
    if (path === "/restore-slider") {
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css"></head>
<body><form><m-slider id="rs" name="rs" value="30" aria-label="Restored"></m-slider>
<m-slider id="rr" name="rr" range value="20" second-value="80" aria-label="Restored range"></m-slider></form>
<a id="go" href="/away">away</a><script type="module" src="/elements.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } }
      );
    }
    if (path === "/restore-select") {
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css"></head>
<body><form><m-select id="rs" name="rs" label="Restored select" value="a">
<m-select-option value="a">Alpha</m-select-option><m-select-option value="b">Beta</m-select-option></m-select></form>
<a id="go" href="/away">away</a><script type="module" src="/elements.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } }
      );
    }
    if (path === "/restore-radios") {
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css"></head>
<body><form><m-radios id="rr" name="rr" value="a" aria-label="Restored radios">
<m-radio value="a">Alpha</m-radio><m-radio value="b">Beta</m-radio></m-radios></form><a id="go" href="/away">away</a>
<script type="module" src="/elements.js"></script></body></html>`,
        { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } }
      );
    }
    return new Response(
      `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/styles.css">
<style>body{margin:0;font-family:sans-serif}section{padding:8px}.stage{position:relative;height:240px;overflow:auto}</style></head>
<body><main id="host"></main><script type="module" src="/elements.js"></script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  },
});

type Win = Window & Record<string, unknown>;
/** Icon markup for the icon-only elements, quoted with ' in attributes. */
const ICON = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h16v16H4z"/></svg>';
const browser = await chromium.launch({ headless: true });
let checks = 0;
const check = (name: string): void => {
  checks++;
  console.log(`  ok ${name}`);
};

/**
 * FLO-320: one handler reading `value` works on both flavours. Clicks the
 * shadow-root targets of element `id` in turn (a selector and the index of the
 * match) and returns what a factory handler (on the host's component) and a
 * DOM listener each read.
 */
const payloadParity = (page: Page, id: string, event: string, targets: Array<[string, number]>): Promise<{ factory: unknown[]; element: unknown[] }> =>
  page.evaluate(async ({ id, event, targets }) => {
    type Host = HTMLElement & { component: { on: (name: string, handler: (payload: { value: unknown }) => void) => unknown } };
    const host = document.getElementById(id) as Host;
    const read = { factory: [] as unknown[], element: [] as unknown[] };
    const value = (payload: { value: unknown }): void => void read.factory.push(payload.value);
    host.component.on(event, value);
    host.addEventListener(event, (e) => void read.element.push((e as CustomEvent<{ value: unknown }>).detail.value));
    for (const [selector, index] of targets) {
      (host.shadowRoot?.querySelectorAll(selector)[index] as HTMLElement).click();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    return read;
  }, { id, event, targets });

/**
 * The same proof for a pair of event names, or for an action that is not a
 * click (FLO-320 part 2): `act` runs in the page with `host` in scope, the
 * factory handler listens on `factory` (an expression of `host`), and reads
 * `field`, the element's `value` unless it has another name.
 */
const eventParity = (
  page: Page,
  id: string,
  options: { factoryEvent: string; elementEvent: string; act: string; factory?: string; field?: string },
): Promise<{ factory: unknown[]; element: unknown[] }> =>
  page.evaluate(async ({ id, factoryEvent, elementEvent, act, factory, field }) => {
    type Listener = { on: (name: string, handler: (payload: Record<string, unknown>) => void) => unknown };
    const host = document.getElementById(id) as HTMLElement & { component: unknown };
    const read = { factory: [] as unknown[], element: [] as unknown[] };
    const target = new Function("host", `return ${factory}`)(host) as Listener;
    target.on(factoryEvent, (payload) => void read.factory.push(payload[field]));
    host.addEventListener(elementEvent, (e) => void read.element.push((e as CustomEvent<{ value: unknown }>).detail.value));
    await (new Function("host", `return (async () => { ${act} })()`)(host) as Promise<void>);
    await new Promise((r) => setTimeout(r, 50));
    return read;
  }, { id, act: options.act, factoryEvent: options.factoryEvent, elementEvent: options.elementEvent, factory: options.factory ?? "host.component", field: options.field ?? "value" });

const fresh = async (page: Page, html: string): Promise<void> => {
  await page.evaluate((markup) => {
    const host = document.getElementById("host") as HTMLElement;
    host.innerHTML = markup;
  }, html);
  // connectedCallback runs synchronously; give observers and microtasks a turn
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
};

try {
  await checkDeclarativeUpgrade(browser);
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.port}`);
  await page.waitForFunction(() => (window as unknown as Win).ready === true);
  await checkCheckableValues(page, "element");
  await checkRegistryEvents(page, fresh, check);

  // FLO-380: each model payload agrees with the public getter during dispatch.
  await fresh(page, `<m-timepicker id="event-time"></m-timepicker>
    <m-select id="event-select" value="a"><m-select-option value="a">Alpha</m-select-option><m-select-option value="">None</m-select-option></m-select>
    <m-radios id="event-radios"><m-radio value="a">Alpha</m-radio><m-radio value="">None</m-radio></m-radios>`);
  {
    const values = await page.evaluate(() => {
      type TimeHost = HTMLElement & { value: string; component: {
        getValue: () => string;
        on: (name: string, handler: (event: { value: string; draftValue?: string }) => void) => void;
        picker: { getValue: () => string; setType: (type: string) => void; open: () => void; dialogElement: HTMLElement;
          on: (name: string, handler: (event: { value: string; draftValue?: string }) => void) => void };
      } };
      type ChoiceHost = HTMLElement & { value: string | null; component: {
        getValue: () => string | null; on: (name: string, handler: (event: { value: string | null }) => void) => void;
        menu?: { element: HTMLElement }; radios?: Array<{ input: HTMLInputElement }>;
      } };
      const time = document.getElementById("event-time") as TimeHost;
      const select = document.getElementById("event-select") as ChoiceHost;
      const radios = document.getElementById("event-radios") as ChoiceHost;
      const result = { timeFactoryInput: [] as Array<[unknown, unknown, unknown]>, timeInput: [] as Array<[unknown, unknown, unknown]>,
        timeConfirm: [] as Array<[unknown, unknown]>, timeEmptyConfirm: [] as Array<[unknown, unknown]>,
        timeEmptyChange: [] as Array<[unknown, unknown]>, selectFactory: [] as Array<[unknown, unknown]>,
        selectElement: [] as Array<[unknown, unknown]>, radiosFactory: [] as Array<[unknown, unknown]>,
        radiosElement: [] as Array<[unknown, unknown]> };
      const p = time.component.picker;
      p.on("input", (e) => result.timeFactoryInput.push([e.value, p.getValue(), e.draftValue]));
      time.addEventListener("input", (e) => { const d = (e as CustomEvent<{ value: string; draftValue: string }>).detail;
        result.timeInput.push([d.value, time.value, d.draftValue]); });
      time.addEventListener("confirm", (e) => { const d = (e as CustomEvent<{ value: string }>).detail;
        result.timeConfirm.push([d.value, time.value]); });
      select.component.on("change", (e) => result.selectFactory.push([e.value, select.component.getValue()]));
      select.addEventListener("change", (e) => result.selectElement.push([(e as CustomEvent<{ value: string | null }>).detail.value, select.value]));
      radios.component.on("change", (e) => result.radiosFactory.push([e.value, radios.component.getValue()]));
      radios.addEventListener("change", (e) => result.radiosElement.push([(e as CustomEvent<{ value: string | null }>).detail.value, radios.value]));
      p.setType("input");
      p.open();
      const hour = p.dialogElement.querySelector<HTMLInputElement>('[data-type="hour"]')!;
      hour.value = String((Number(hour.value) + 1) % 24);
      hour.dispatchEvent(new Event("change", { bubbles: true }));
      p.dialogElement.querySelector<HTMLElement>('[class$="time-picker__confirm"]')!.click();
      const untouched = document.createElement("m-timepicker") as TimeHost;
      document.getElementById("host")!.append(untouched);
      untouched.addEventListener("change", (e) => result.timeEmptyChange.push([(e as CustomEvent<{ value: string }>).detail.value, untouched.value]));
      untouched.addEventListener("confirm", (e) => result.timeEmptyConfirm.push([(e as CustomEvent<{ value: string }>).detail.value, untouched.value]));
      untouched.component.picker.open();
      untouched.component.picker.dialogElement.querySelector<HTMLElement>('[class$="time-picker__confirm"]')!.click();
      (select.component as unknown as Record<symbol, { element: HTMLElement }>)[Object.getOwnPropertySymbols(select.component).find((key) => key.description === "mtrl.menu")!].element.querySelector<HTMLElement>('[data-id=""]')!.click();
      radios.component.radios![0].input.click();
      radios.component.radios![1].input.click();
      return result;
    });
    assert.equal(values.timeFactoryInput.length, 1);
    assert.equal(values.timeFactoryInput[0][0], values.timeFactoryInput[0][1]);
    assert.notEqual(values.timeFactoryInput[0][2], values.timeFactoryInput[0][0]);
    assert.deepEqual(values.timeInput, [["", "", values.timeFactoryInput[0][2]]]);
    assert.equal(values.timeConfirm.length, 1);
    assert.equal(values.timeConfirm[0][0], values.timeConfirm[0][1]);
    assert.equal(values.timeEmptyChange.length, 1);
    assert.equal(values.timeEmptyChange[0][0], values.timeEmptyChange[0][1]);
    assert.deepEqual(values.timeEmptyConfirm, values.timeEmptyChange);
    assert.deepEqual(values.selectFactory, [[null, null]]);
    assert.deepEqual(values.selectElement, [[null, null]]);
    // 1.0: the factory reports null for the option without a value, as the element does
    assert.deepEqual(values.radiosFactory, [["a", "a"], [null, null]]);
    assert.deepEqual(values.radiosElement, [["a", "a"], [null, null]]);
    check("time input/confirm, select empty id and radio empty id match getters inside factory and element handlers");
  }

  // ---------------------------------------------------------------- registration
  {
    const result = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: Record<string, (o?: object) => string> };
      const again = w.mtrl.defineSwitch();
      const custom = w.mtrl.defineSwitch({ prefix: "x" });
      return {
        again,
        custom,
        m: !!customElements.get("m-switch"),
        x: !!customElements.get("x-switch"),
        tab: !!customElements.get("m-tab"),
      };
    });
    assert.deepEqual(result, { again: "m-switch", custom: "x-switch", m: true, x: true, tab: true });
    check("define is idempotent and takes a prefix");
  }

  // ---------------------------------------------------------------- switch
  await fresh(
    page,
    `<form id="f"><m-switch id="s" name="wifi" value="yes">Wi-Fi</m-switch>
     <label for="s" id="outer">Outer label</label>
     <m-switch id="d" name="bt" checked>Bluetooth</m-switch></form>
     <section id="factory"></section>`
  );
  {
    const sw = page.getByRole("switch", { name: "Wi-Fi" });
    assert.equal(await sw.count(), 1, "the slotted text names the inner switch");
    check("switch: slotted label is the accessible name");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("s")?.addEventListener("change", (e) => {
        (w.events as unknown[]).push({ detail: { ...(e as CustomEvent).detail, nativeEvent: (e as CustomEvent).detail.nativeEvent instanceof Event }, target: (e.target as Element).id });
      });
    });
    await sw.click();
    let state = await page.evaluate(() => {
      const w = window as unknown as Win;
      const s = document.getElementById("s") as HTMLElement & { checked: boolean };
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { events: w.events, checked: s.checked, wifi: form.get("wifi"), bt: form.get("bt") };
    });
    assert.deepEqual(state.events, [{ detail: { checked: true, value: true, valueAttribute: "yes", nativeEvent: true }, target: "s" }]);
    assert.equal(state.checked, true);
    assert.equal(state.wifi, "yes");
    assert.equal(state.bt, "on");
    check("switch: a click dispatches one change from the host, and the form sees the value");

    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const s = document.getElementById("s") as HTMLElement & { checked: boolean };
      s.checked = false;
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { events: w.events, checked: s.checked, wifi: form.get("wifi"), bt: form.get("bt") };
    });
    assert.deepEqual(state.events, []);
    assert.equal(state.checked, false);
    assert.equal(state.wifi, null);
    check("switch: setting the property fires no event and updates the form value");

    // FLO-328: the methods are silent too; the model still follows them
    // (form value, dirty) without the event, and reset returns to the default.
    const methods = await page.evaluate(() => {
      type Switch = HTMLElement & { checked: boolean; toggle(): void; check(): void; uncheck(): void };
      const d = document.getElementById("d") as Switch;
      const form = document.getElementById("f") as HTMLFormElement;
      const events: string[] = [];
      const listen = (e: Event): void => void events.push(e.type);
      for (const type of ["change", "input"]) d.addEventListener(type, listen);
      const state = (): [boolean, FormDataEntryValue | null] => [d.checked, new FormData(form).get("bt")];
      d.uncheck();
      const unchecked = state();
      d.toggle();
      const toggled = state();
      d.uncheck();
      // Dirty: the default no longer moves the live state.
      d.removeAttribute("checked");
      d.setAttribute("checked", "");
      const dirty = state();
      form.reset();
      const reset = state();
      for (const type of ["change", "input"]) d.removeEventListener(type, listen);
      return { events, unchecked, toggled, dirty, reset };
    });
    assert.deepEqual(methods, {
      events: [],
      unchecked: [false, null],
      toggled: [true, "on"],
      dirty: [false, null],
      reset: [true, "on"],
    });
    check("switch: toggle(), check() and uncheck() fire no event; the form value, dirty state and reset follow them");

    await page.click("#outer");
    assert.equal(await page.evaluate(() => (document.getElementById("s") as HTMLElement & { checked: boolean }).checked), true);
    check("switch: an outer <label for> toggles it");

    // FLO-328: the slot's attribute is a real property.
    const label = await page.evaluate(async () => {
      type Labelled = HTMLElement & { label: string | null };
      const slotted = document.getElementById("s") as Labelled;
      const named = document.createElement("m-switch") as Labelled;
      named.id = "named";
      named.setAttribute("label", "Before");
      document.getElementById("f")?.append(named);
      const read = { slotted: slotted.label, named: named.label };
      named.label = "Airplane mode";
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return { read, attribute: named.getAttribute("label"), own: Object.prototype.hasOwnProperty.call(named, "label") };
    });
    assert.deepEqual(label, { read: { slotted: "Wi-Fi", named: "Before" }, attribute: "Airplane mode", own: false });
    assert.equal(await page.getByRole("switch", { name: "Airplane mode" }).count(), 1);
    await page.evaluate(() => document.getElementById("named")?.remove());
    check("switch: the label property reads the label and sets the attribute and the text");

    const reset = await page.evaluate(() => {
      (document.getElementById("f") as HTMLFormElement).reset();
      const get = (id: string): boolean => (document.getElementById(id) as HTMLElement & { checked: boolean }).checked;
      return { s: get("s"), d: get("d") };
    });
    assert.deepEqual(reset, { s: false, d: true });
    check("switch: form.reset() restores the checked attribute");

    const validity = await page.evaluate(() => {
      const s = document.getElementById("s") as HTMLElement;
      s.setAttribute("required", "");
      const form = document.getElementById("f") as HTMLFormElement;
      const invalid = form.checkValidity();
      (s as HTMLElement & { checked: boolean }).checked = true;
      return { invalid, valid: form.checkValidity() };
    });
    assert.deepEqual(validity, { invalid: false, valid: true });
    check("switch: required reports validity to the form");

    const disabled = await page.evaluate(() => {
      const s = document.getElementById("s") as HTMLElement;
      s.setAttribute("disabled", "");
      return s.shadowRoot?.querySelector("input")?.disabled;
    });
    assert.equal(disabled, true);
    check("switch: the disabled attribute disables the inner input");

    // FLO-318: error updates through setError; supporting text never ends it
    const errors = await page.evaluate(() => {
      const s = document.getElementById("s") as HTMLElement & { component: { isError: () => boolean } };
      s.removeAttribute("disabled");
      const state = () => {
        const input = s.shadowRoot?.querySelector("input") as HTMLInputElement;
        const root = s.shadowRoot?.querySelector('[class*="mtrl-switch"]') as HTMLElement;
        return [s.component.isError(), root.className.includes("switch--error"), input.getAttribute("aria-invalid")];
      };
      const out: unknown[] = [state()];
      s.setAttribute("error", "");
      out.push(state());
      s.setAttribute("supporting-text", "Offline");
      out.push(state());
      s.setAttribute("supporting-text", "Still offline");
      out.push(state());
      s.removeAttribute("supporting-text");
      out.push(state());
      s.removeAttribute("error");
      out.push(state());
      return out;
    });
    assert.deepEqual(errors, [
      [false, false, null],
      [true, true, "true"],
      [true, true, "true"],
      [true, true, "true"],
      [true, true, "true"],
      [false, false, null],
    ]);
    check("switch: the error attribute sets and clears the error; changing or removing supporting-text keeps it");

    // Same look as the factory in light DOM with the full stylesheet.
    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createSwitch: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createSwitch({ label: "Bluetooth", checked: true });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("d") as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const track = root.querySelector('[class*="switch__track"]') as HTMLElement;
        const label = root.querySelector("label") as HTMLElement;
        const t = track.getBoundingClientRect();
        return {
          trackW: t.width, trackH: t.height,
          trackBg: getComputedStyle(track).backgroundColor,
          labelColor: getComputedStyle(label).color,
          labelFont: getComputedStyle(label).font,
        };
      };
      return { factory: measure(factory.element), element: measure(element) };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("switch: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- button
  await fresh(
    page,
    `<form id="f" onsubmit="event.preventDefault(); window.submits = (window.submits || 0) + 1">
       <m-button id="b" type="submit" variant="filled">Save</m-button>
       <m-button id="plain">Cancel</m-button>
       <m-button id="attr" label="From attribute" variant="outlined"></m-button>
     </form><section id="factory"></section>`
  );
  {
    assert.equal(await page.getByRole("button", { name: "Save" }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "From attribute" }).count(), 1);
    check("button: slotted and attribute labels are accessible names");

    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    assert.equal(await page.evaluate(() => (window as unknown as Win).submits), 1);
    check("button: type=submit submits the host's form; a plain button does not");

    await page.evaluate(() => document.getElementById("b")?.setAttribute("disabled", ""));
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    assert.equal(await page.evaluate(() => (window as unknown as Win).submits), 1);
    check("button: disabled does not submit");

    await page.evaluate(() => document.getElementById("attr")?.setAttribute("label", "Renamed"));
    assert.equal(await page.getByRole("button", { name: "Renamed" }).count(), 1);
    check("button: a label attribute change updates the name");

    // FLO-328: the slot's attribute is a real property, as `label` is on a native <option>.
    const label = await page.evaluate(async () => {
      type Labelled = HTMLElement & { label: string | null };
      const attr = document.getElementById("attr") as Labelled;
      const slotted = document.getElementById("plain") as Labelled;
      const read = { attr: attr.label, slotted: slotted.label };
      attr.label = "By property";
      const late = document.createElement("m-button") as Labelled;
      late.id = "late";
      document.getElementById("f")?.append(late);
      late.label = "Set late";
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return {
        read,
        own: Object.prototype.hasOwnProperty.call(attr, "label"),
        attribute: attr.getAttribute("label"),
        after: attr.label,
        late: late.getAttribute("label"),
      };
    });
    assert.deepEqual(label, {
      read: { attr: "Renamed", slotted: "Cancel" },
      own: false,
      attribute: "By property",
      after: "By property",
      late: "Set late",
    });
    assert.equal(await page.getByRole("button", { name: "By property" }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Set late" }).count(), 1);
    check("button: the label property reads the label and sets the attribute and the text, also on an empty button");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createButton: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createButton({ text: "Cancel" });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("plain") as HTMLElement).shadowRoot?.querySelector("button") as HTMLElement;
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, color: s.color, radius: s.borderRadius, font: s.font };
      };
      return { factory: measure(factory.element), element: measure(element) };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("button: renders as the factory does with the global stylesheet");

    // FLO-380: a toggle button's change crosses to the host with the button's value,
    // the getter's value read inside the listener. The element has no toggle
    // attribute yet, so the toggle comes from scoped global defaults.
    const toggled = await page.evaluate(() => {
      type Host = HTMLElement & { component: { getValue: () => string } };
      const w = window as unknown as Win & { mtrl: { setComponentDefaults: (name: string, config: object) => void } };
      w.mtrl.setComponentDefaults("button", { toggle: true });
      try {
        const host = document.createElement("m-button") as Host;
        host.setAttribute("value", "bold");
        host.textContent = "Bold";
        document.getElementById("factory")?.append(host);
        const seen: unknown[] = [];
        host.addEventListener("change", (e) => seen.push([(e as CustomEvent).detail, host.component.getValue()]));
        const inner = host.shadowRoot?.querySelector("button") as HTMLElement;
        inner.click();
        inner.click();
        host.remove();
        return seen;
      } finally {
        w.mtrl.setComponentDefaults("button", {});
      }
    });
    assert.deepEqual(toggled, [[{ selected: true, value: "bold" }, "bold"], [{ selected: false, value: "bold" }, "bold"]]);
    check("button: a toggle button's change reaches the host with { selected, value }, value as getValue() reads it (FLO-380)");
  }

  // ---------------------------------------------------------------- icon button
  await fresh(
    page,
    `<form id="f" onsubmit="event.preventDefault(); window.submits = (window.submits || 0) + 1">
       <m-icon-button id="ib" aria-label="Favorite" toggle value="fav" icon='${ICON}'></m-icon-button>
       <m-icon-button id="is" type="submit" aria-label="Send" icon='${ICON}'></m-icon-button>
       <m-icon-button id="ip" variant="filled" aria-label="Plain" icon='${ICON}'></m-icon-button>
       <m-icon-button id="iq" variant="filled" aria-label="Untouched" icon='${ICON}'></m-icon-button>
     </form><section id="factory"></section>`
  );
  {
    assert.equal(await page.getByRole("button", { name: "Favorite", pressed: false }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Send" }).count(), 1);
    check("icon button: aria-label is the accessible name, toggle sets aria-pressed");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      w.clicks = 0;
      const ib = document.getElementById("ib");
      // `change` (FLO-295). 1.0 dispatches no `toggle` beside it: the listener stays, to show it never fires.
      ib?.addEventListener("change", (e) => (w.events as unknown[]).push({ change: (e as CustomEvent).detail }));
      ib?.addEventListener("toggle", (e) => (w.events as unknown[]).push({ toggle: (e as CustomEvent).detail }));
      ib?.addEventListener("click", () => (w.clicks = (w.clicks as number) + 1));
    });
    await page.getByRole("button", { name: "Favorite" }).click();
    let state = await page.evaluate(() => {
      const w = window as unknown as Win;
      const ib = document.getElementById("ib") as HTMLElement & { selected: boolean };
      return { events: w.events, clicks: w.clicks, selected: ib.selected };
    });
    // FLO-380: change carries the button's value beside selected.
    assert.deepEqual(state, { events: [{ change: { selected: true, value: "fav" } }], clicks: 1, selected: true });
    assert.equal(await page.getByRole("button", { name: "Favorite", pressed: true }).count(), 1);
    check("icon button: a click dispatches one change from the host with { selected, value } and no toggle; click stays native");

    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const ib = document.getElementById("ib") as HTMLElement & { selected: boolean };
      ib.selected = false;
      return { events: w.events, clicks: w.clicks, selected: ib.selected };
    });
    assert.deepEqual(state, { events: [], clicks: 1, selected: false });
    assert.equal(await page.getByRole("button", { name: "Favorite", pressed: false }).count(), 1);
    check("icon button: setting selected fires no event");

    const updated = await page.evaluate(() => {
      const ib = document.getElementById("ib") as HTMLElement & { component: { element: HTMLElement } };
      const before = ib.component;
      ib.setAttribute("variant", "outlined");
      ib.setAttribute("aria-label", "Like");
      return { same: ib.component === before, outlined: ib.component.element.classList.contains("mtrl-icon-button--outlined") };
    });
    assert.deepEqual(updated, { same: true, outlined: true });
    assert.equal(await page.getByRole("button", { name: "Like" }).count(), 1);
    check("icon button: variant and aria-label attributes update the component in place");

    await page.evaluate(() => ((window as unknown as Win).submits = 0));
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByRole("button", { name: "Plain" }).click();
    assert.equal(await page.evaluate(() => (window as unknown as Win).submits), 1);
    check("icon button: type=submit submits the host's form; a plain one does not");

    const parity = await page.evaluate((icon) => {
      const w = window as unknown as Win & { mtrl: { createIconButton: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createIconButton({ icon, variant: "filled", ariaLabel: "Untouched" });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("iq") as HTMLElement).shadowRoot?.querySelector("button") as HTMLElement;
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const svg = el.querySelector("svg") as SVGElement;
        return {
          w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, color: s.color, radius: s.borderRadius,
          iconW: Math.round(svg.getBoundingClientRect().width),
        };
      };
      return { factory: measure(factory.element), element: measure(element) };
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("icon button: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- fab
  await fresh(
    page,
    `<form id="f" onsubmit="event.preventDefault(); window.submits = (window.submits || 0) + 1">
       <m-fab id="fb" aria-label="Compose" icon='${ICON}'></m-fab>
       <m-fab id="fs" type="submit" aria-label="Submit" icon='${ICON}'></m-fab>
       <m-fab id="fp" aria-label="Plain" icon='${ICON}'></m-fab>
     </form><section id="factory"></section>`
  );
  {
    assert.equal(await page.getByRole("button", { name: "Compose" }).count(), 1);
    check("fab: aria-label is the accessible name");

    const clicks = await page.evaluate(async () => {
      const fb = document.getElementById("fb") as HTMLElement;
      let count = 0;
      fb.addEventListener("click", () => count++);
      (fb.shadowRoot?.querySelector("button") as HTMLElement).click();
      return count;
    });
    assert.equal(clicks, 1);
    check("fab: a click reaches the host once, not re-dispatched");

    const updated = await page.evaluate(() => {
      const fb = document.getElementById("fb") as HTMLElement & { component: { element: HTMLButtonElement } };
      fb.setAttribute("variant", "tertiary");
      const tertiary = fb.component.element.classList.contains("mtrl-fab--tertiary");
      fb.setAttribute("disabled", "");
      return { tertiary, disabled: fb.component.element.disabled };
    });
    assert.deepEqual(updated, { tertiary: true, disabled: true });
    check("fab: a variant change recreates it, disabled disables the inner button");

    await page.evaluate(() => ((window as unknown as Win).submits = 0));
    await page.getByRole("button", { name: "Submit" }).click();
    assert.equal(await page.evaluate(() => (window as unknown as Win).submits), 1);
    check("fab: type=submit submits the host's form");

    const parity = await page.evaluate((icon) => {
      const w = window as unknown as Win & { mtrl: { createFab: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createFab({ icon, ariaLabel: "Plain" });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("fp") as HTMLElement).shadowRoot?.querySelector("button") as HTMLElement;
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, color: s.color, radius: s.borderRadius, shadow: s.boxShadow };
      };
      return { factory: measure(factory.element), element: measure(element) };
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("fab: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- extended fab
  await fresh(
    page,
    `<form id="f"><input id="txt" value="a">
       <m-extended-fab id="eb" icon='${ICON}'>Compose</m-extended-fab>
       <m-extended-fab id="ea" label="From attribute"></m-extended-fab>
       <m-extended-fab id="er" type="reset">Clear</m-extended-fab>
       <m-extended-fab id="ep">Untouched</m-extended-fab>
     </form><section id="factory"></section>`
  );
  {
    assert.equal(await page.getByRole("button", { name: "Compose" }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "From attribute" }).count(), 1);
    // #232: the factory no longer copies text into aria-label, so the inner
    // button carries none and is named by the slotted text itself.
    for (const [id, name] of [["eb", "Compose"], ["ep", "Untouched"]]) {
      assert.equal(
        await page.evaluate((id) => document.getElementById(id)?.shadowRoot?.querySelector("button")?.hasAttribute("aria-label"), id),
        false,
        `#${id}'s inner button has no aria-label`
      );
      assert.equal(await page.locator(`#${id}`).getByRole("button", { name, exact: true }).count(), 1);
    }
    check("extended fab: slotted and attribute labels are accessible names");

    await page.evaluate(() => document.getElementById("ea")?.setAttribute("label", "Renamed"));
    assert.equal(await page.getByRole("button", { name: "Renamed" }).count(), 1);
    const size = await page.evaluate(() => {
      const eb = document.getElementById("eb") as HTMLElement & { component: { element: HTMLElement } };
      eb.setAttribute("size", "large");
      return eb.component.element.classList.contains("mtrl-extended-fab--large");
    });
    assert.equal(size, true);
    check("extended fab: label and size attribute changes update it");

    await page.fill("#txt", "b");
    await page.getByRole("button", { name: "Clear" }).click();
    assert.equal(await page.inputValue("#txt"), "a");
    check("extended fab: type=reset resets the host's form");

    const clicks = await page.evaluate(() => {
      const eb = document.getElementById("eb") as HTMLElement;
      let count = 0;
      eb.addEventListener("click", () => count++);
      (eb.shadowRoot?.querySelector("button") as HTMLElement).click();
      return count;
    });
    assert.equal(clicks, 1);
    check("extended fab: a click reaches the host once, not re-dispatched");

    // FLO-319: collapse and expand leave the shadow root, from the host, once each
    const toggles = await page.evaluate(() => {
      const eb = document.getElementById("eb") as HTMLElement & { collapse: () => void; expand: () => void };
      const seen: string[] = [];
      for (const type of ["collapse", "expand"]) eb.addEventListener(type, (e) => seen.push(`${type}:${(e.target as Element).id}`));
      eb.collapse();
      eb.expand();
      return seen;
    });
    assert.deepEqual(toggles, ["collapse:eb", "expand:eb"]);
    check("extended fab: collapse and expand are dispatched from the host, once each");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createExtendedFab: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createExtendedFab({ text: "Untouched" });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("ep") as HTMLElement).shadowRoot?.querySelector("button") as HTMLElement;
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, color: s.color, radius: s.borderRadius, font: s.font };
      };
      return { factory: measure(factory.element), element: measure(element) };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("extended fab: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- checkbox
  await fresh(
    page,
    `<form id="f"><m-checkbox id="c" name="agree" value="yes">Agree</m-checkbox>
     <label for="c" id="outer">Outer label</label>
     <m-checkbox id="d" name="news" checked>News</m-checkbox></form>
     <section id="factory"></section>`
  );
  {
    const box = page.getByRole("checkbox", { name: "Agree" });
    assert.equal(await box.count(), 1, "the slotted text names the inner checkbox");
    check("checkbox: slotted label is the accessible name");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("c")?.addEventListener("change", (e) => {
        (w.events as unknown[]).push({ detail: { ...(e as CustomEvent).detail, nativeEvent: (e as CustomEvent).detail.nativeEvent instanceof Event }, target: (e.target as Element).id });
      });
    });
    await box.click();
    let state = await page.evaluate(() => {
      const w = window as unknown as Win;
      const c = document.getElementById("c") as HTMLElement & { checked: boolean };
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { events: w.events, checked: c.checked, agree: form.get("agree"), news: form.get("news") };
    });
    assert.deepEqual(state.events, [{ detail: { checked: true, value: true, valueAttribute: "yes", nativeEvent: true }, target: "c" }]);
    assert.equal(state.checked, true);
    assert.equal(state.agree, "yes");
    assert.equal(state.news, "on");
    check("checkbox: a click dispatches one change from the host, and the form sees the value");

    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const c = document.getElementById("c") as HTMLElement & { checked: boolean };
      c.checked = false;
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { events: w.events, checked: c.checked, agree: form.get("agree"), news: form.get("news") };
    });
    assert.deepEqual(state.events, []);
    assert.equal(state.checked, false);
    assert.equal(state.agree, null);
    check("checkbox: setting the property fires no event and updates the form value");

    const mixed = await page.evaluate(() => {
      const w = window as unknown as Win;
      const c = document.getElementById("c") as HTMLElement & { indeterminate: boolean };
      c.indeterminate = true;
      const input = c.shadowRoot?.querySelector("input") as HTMLInputElement;
      return { events: w.events, indeterminate: c.indeterminate, input: input.indeterminate };
    });
    assert.deepEqual(mixed, { events: [], indeterminate: true, input: true });
    await box.click();
    const cleared = await page.evaluate(() => {
      const c = document.getElementById("c") as HTMLElement & { indeterminate: boolean; checked: boolean };
      return { indeterminate: c.indeterminate, checked: c.checked };
    });
    assert.deepEqual(cleared, { indeterminate: false, checked: true });
    check("checkbox: indeterminate is a live property, cleared by a click");

    // FLO-316: Space on a mixed box activates it as a click does
    await page.evaluate(() => {
      const w = window as unknown as Win;
      const c = document.getElementById("c") as HTMLElement & { indeterminate: boolean; checked: boolean };
      c.checked = false;
      c.indeterminate = true;
      w.events = [];
    });
    await box.focus();
    await page.keyboard.press("Space");
    const keyed = await page.evaluate(() => {
      const w = window as unknown as Win;
      const c = document.getElementById("c") as HTMLElement & { indeterminate: boolean; checked: boolean };
      return {
        checked: c.checked,
        indeterminate: c.indeterminate,
        mixedClass: !!c.shadowRoot?.querySelector('[class*="checkbox--indeterminate"]'),
        events: w.events,
      };
    });
    assert.deepEqual(keyed, {
      checked: true, indeterminate: false, mixedClass: false,
      events: [{ detail: { checked: true, value: true, valueAttribute: "yes", nativeEvent: true }, target: "c" }],
    });
    check("checkbox: Space on a mixed box checks it, clears the mixed state and class, and dispatches one change");

    await page.evaluate(() => ((document.getElementById("c") as HTMLElement & { checked: boolean }).checked = false));
    await page.click("#outer");
    assert.equal(await page.evaluate(() => (document.getElementById("c") as HTMLElement & { checked: boolean }).checked), true);
    check("checkbox: an outer <label for> toggles it");

    const reset = await page.evaluate(() => {
      (document.getElementById("f") as HTMLFormElement).reset();
      const get = (id: string): boolean => (document.getElementById(id) as HTMLElement & { checked: boolean }).checked;
      return { c: get("c"), d: get("d") };
    });
    assert.deepEqual(reset, { c: false, d: true });
    check("checkbox: form.reset() restores the checked attribute");

    const validity = await page.evaluate(() => {
      const c = document.getElementById("c") as HTMLElement;
      c.setAttribute("required", "");
      const form = document.getElementById("f") as HTMLFormElement;
      const invalid = form.checkValidity();
      (c as HTMLElement & { checked: boolean }).checked = true;
      return { invalid, valid: form.checkValidity() };
    });
    assert.deepEqual(validity, { invalid: false, valid: true });
    check("checkbox: required reports validity to the form");

    const attributes = await page.evaluate(() => {
      const c = document.getElementById("c") as HTMLElement;
      c.setAttribute("error", "");
      c.setAttribute("disabled", "");
      const input = c.shadowRoot?.querySelector("input") as HTMLInputElement;
      return { invalid: input.getAttribute("aria-invalid"), disabled: input.disabled };
    });
    assert.deepEqual(attributes, { invalid: "true", disabled: true });
    check("checkbox: error and disabled attributes reach the inner input");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createCheckbox: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createCheckbox({ label: "News", checked: true });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("d") as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const input = root.querySelector("input") as HTMLElement;
        const icon = root.querySelector('[class*="checkbox__icon"]') as HTMLElement;
        const label = root.querySelector("label") as HTMLElement;
        const b = input.getBoundingClientRect();
        const l = label.getBoundingClientRect();
        return {
          boxW: b.width, boxH: b.height, labelW: Math.round(l.width), labelH: Math.round(l.height),
          boxBg: getComputedStyle(input).backgroundColor,
          boxBorder: getComputedStyle(input).border,
          iconColor: getComputedStyle(icon).color,
          labelColor: getComputedStyle(label).color,
          labelFont: getComputedStyle(label).font,
        };
      };
      return { factory: measure(factory.element), element: measure(element) };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("checkbox: renders as the factory does with the global stylesheet");

    // FLO-336: the check icon, built with DOM APIs, is the DOM its old markup
    // parsed to, in the browser too (the svg's xmlns in the XMLNS namespace).
    const icon = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createCheckbox: (c: object) => { element: HTMLElement } } };
      const built = w.mtrl.createCheckbox({ label: "Icon" }).element.querySelector('[class*="checkbox__icon"]') as HTMLElement;
      const reference = document.createElement("span");
      reference.className = built.className;
      reference.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M9.55 14.6L6.35 11.4l-1.9 1.9L9.55 18.4l10.9-10.9-1.9-1.9z"/>
    </svg>
  `;
      return built.isEqualNode(reference);
    });
    assert.equal(icon, true);
    check("checkbox: the check icon is the DOM its markup parsed to");

    // FLO-336: the form state stays exact and synchronous, while a checkbox
    // that stays valid does not set its validity again on every set.
    const sync = await page.evaluate(() => {
      const form = document.createElement("form");
      form.innerHTML = '<m-checkbox name="plain">Plain</m-checkbox><m-checkbox name="needed" required>Needed</m-checkbox>';
      document.body.append(form);
      const [plain, needed] = Array.from(form.children) as Array<HTMLElement & { checked: boolean }>;
      const proto = ElementInternals.prototype;
      const original = proto.setValidity;
      let calls = 0;
      proto.setValidity = function (this: ElementInternals, ...args: Parameters<ElementInternals["setValidity"]>) {
        calls++;
        return original.apply(this, args);
      };
      const reads: Array<[boolean, boolean, string | null, string | null]> = [];
      try {
        for (let i = 0; i < 20; i++) plain.checked = i % 2 === 0;
        const plainCalls = calls;
        for (const value of [true, false, true]) {
          needed.checked = value;
          // read at once, in the same task
          const data = new FormData(form);
          reads.push([!needed.matches(":invalid"), form.checkValidity(), data.get("needed") as string | null, data.get("plain") as string | null]);
        }
        return { plainCalls, reads };
      } finally {
        proto.setValidity = original;
        form.remove();
      }
    });
    assert.ok(sync.plainCalls <= 1, `a valid checkbox set its validity ${sync.plainCalls} times in 20 sets`);
    assert.deepEqual(sync.reads, [
      [true, true, "on", null],
      [false, false, null, null],
      [true, true, "on", null],
    ]);
    check("checkbox: a set leaves validity and FormData exact at once, and a valid one skips setting it again");
  }

  // ---------------------------------------------------------------- slider
  await fresh(
    page,
    `<form id="f"><m-slider id="s" name="volume" value="30" aria-label="Volume"></m-slider>
     <m-slider id="r" name="price" range value="20" second-value="80" aria-label="Price"></m-slider>
     <fieldset id="fs"><m-slider id="d" name="off" value="50" aria-label="Off"></m-slider></fieldset></form>
     <section id="factory"></section>`
  );
  {
    type Slider = HTMLElement & { value: number; secondValue: number | null };
    const volume = page.getByRole("slider", { name: "Volume", exact: true });
    assert.equal(await volume.count(), 1, "aria-label names the inner slider handle");
    assert.equal(await volume.getAttribute("aria-valuenow"), "30");
    check("slider: aria-label names the handle, which carries role and value");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      for (const id of ["s", "r"]) {
        for (const type of ["input", "change"]) {
          document.getElementById(id)?.addEventListener(type, (e) => {
            (w.events as unknown[]).push({ type, detail: (e as CustomEvent).detail, target: (e.target as Element).id });
          });
        }
      }
    });
    const read = (): Promise<Record<string, unknown>> =>
      page.evaluate(() => {
        const w = window as unknown as Win;
        const s = document.getElementById("s") as Slider;
        const form = new FormData(document.getElementById("f") as HTMLFormElement);
        const events = w.events;
        w.events = [];
        return { events, value: s.value, attribute: s.getAttribute("value"), volume: form.get("volume") };
      });

    await volume.focus();
    await page.keyboard.press("ArrowRight");
    assert.deepEqual(await read(), {
      events: [
        { type: "input", detail: { value: 31 }, target: "s" },
        { type: "change", detail: { value: 31 }, target: "s" },
      ],
      value: 31,
      attribute: "30",
      volume: "31",
    });
    check("slider: a key dispatches input then change from the host; the form sees the value, the attribute stays");

    const box = await page.evaluate(() => {
      const root = (document.getElementById("s") as HTMLElement).shadowRoot as ShadowRoot;
      const r = (root.querySelector('[class*="slider__container"]') as HTMLElement).getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await page.mouse.move(box.x + box.w * 0.6, box.y + box.h / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.w * 0.75, box.y + box.h / 2, { steps: 4 });
    await page.mouse.up();
    const dragged = await read();
    const events = dragged.events as Array<{ type: string; detail: { value: number } }>;
    assert.ok(events.length >= 3, "input on press and while moving, change on release");
    assert.ok(events.slice(0, -1).every((e) => e.type === "input"));
    const last = events[events.length - 1];
    assert.equal(last.type, "change");
    assert.equal(last.detail.value, dragged.value);
    assert.ok(Math.abs(Number(dragged.value) - 75) <= 2, `dragged to about 75, got ${dragged.value}`);
    assert.equal(dragged.volume, String(dragged.value));
    check("slider: a drag dispatches input while moving and change on release");

    await page.evaluate(() => ((document.getElementById("s") as Slider).value = 10));
    const set = await read();
    const now = await volume.getAttribute("aria-valuenow");
    assert.deepEqual({ ...set, now }, { events: [], value: 10, attribute: "30", volume: "10", now: "10" });
    check("slider: setting the value property fires no event and updates the handle and the form value");

    await page.evaluate(() => document.getElementById("s")?.setAttribute("max", "20"));
    assert.equal(await volume.getAttribute("aria-valuemax"), "20");
    await page.evaluate(() => document.getElementById("s")?.removeAttribute("max"));
    check("slider: min, max and step update in place");

    await page.evaluate(() => (document.getElementById("f") as HTMLFormElement).reset());
    assert.equal((await read()).value, 30);
    check("slider: form.reset() restores the value attribute");

    // Range: two handles, both ends in the form under the host's name.
    const min = page.getByRole("slider", { name: "Price minimum", exact: true });
    const max = page.getByRole("slider", { name: "Price maximum", exact: true });
    assert.deepEqual([await min.count(), await max.count()], [1, 1]);
    const prices = (): Promise<FormDataEntryValue[]> =>
      page.evaluate(() => new FormData(document.getElementById("f") as HTMLFormElement).getAll("price"));
    assert.deepEqual(await prices(), ["20", "80"]);
    await page.evaluate(() => ((document.getElementById("r") as Slider).secondValue = 70));
    assert.deepEqual(await prices(), ["20", "70"]);
    await max.focus();
    await page.keyboard.press("ArrowLeft");
    const range = await page.evaluate(() => {
      const w = window as unknown as Win;
      const r = document.getElementById("r") as Slider;
      const events = w.events;
      w.events = [];
      return { events, value: r.value, second: r.secondValue };
    });
    assert.deepEqual(range, {
      events: [
        { type: "input", detail: { value: 20, secondValue: 69 }, target: "r" },
        { type: "change", detail: { value: 20, secondValue: 69 }, target: "r" },
      ],
      value: 20,
      second: 69,
    });
    assert.deepEqual(await prices(), ["20", "69"]);
    await page.evaluate(() => (document.getElementById("f") as HTMLFormElement).reset());
    assert.deepEqual(await prices(), ["20", "80"]);
    check("slider: range names both handles, submits both ends under its name, and resets both");

    const toggled = await page.evaluate(() => {
      const s = document.getElementById("s") as Slider;
      s.value = 40;
      // The value is dirty now, so the second end's default only counts at creation.
      s.setAttribute("second-value", "90");
      s.setAttribute("range", "");
      const handles = s.shadowRoot?.querySelectorAll('[role="slider"]').length;
      const result = { handles, value: s.value, second: s.secondValue };
      s.removeAttribute("range");
      s.removeAttribute("second-value");
      return result;
    });
    assert.deepEqual(toggled, { handles: 2, value: 40, second: 90 });
    check("slider: the range attribute recreates it with a second handle, keeping the value");

    const disabled = await page.evaluate(() => {
      const d = document.getElementById("d") as Slider;
      const handle = (): HTMLElement => d.shadowRoot?.querySelector('[role="slider"]') as HTMLElement;
      const inForm = (): boolean => new FormData(document.getElementById("f") as HTMLFormElement).has("off");
      const before = { aria: handle().getAttribute("aria-disabled"), tab: handle().tabIndex, inForm: inForm() };
      (document.getElementById("fs") as HTMLFieldSetElement).disabled = true;
      const fieldset = { aria: handle().getAttribute("aria-disabled"), tab: handle().tabIndex, inForm: inForm() };
      (document.getElementById("fs") as HTMLFieldSetElement).disabled = false;
      d.setAttribute("disabled", "");
      const attribute = { aria: handle().getAttribute("aria-disabled"), tab: handle().tabIndex, inForm: inForm() };
      return { before, fieldset, attribute };
    });
    assert.deepEqual(disabled, {
      before: { aria: "false", tab: 0, inForm: true },
      fieldset: { aria: "true", tab: -1, inForm: false },
      attribute: { aria: "true", tab: -1, inForm: false },
    });
    await page.getByRole("slider", { name: "Off", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => (document.getElementById("d") as Slider).value), 50);
    check("slider: disabled by attribute or fieldset, it leaves the form and ignores keys");

    const parity = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createSlider: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createSlider({ value: 30, ticks: true, step: 10, size: "M", color: "tertiary" });
      document.getElementById("factory")?.append(factory.element);
      const s = document.getElementById("s") as Slider;
      s.setAttribute("ticks", "");
      s.setAttribute("step", "10");
      s.setAttribute("size", "m");
      s.setAttribute("color", "tertiary");
      s.value = 30;
      // Same width as the factory's, which sits in a padded section.
      s.style.width = `${factory.element.getBoundingClientRect().width}px`;
      const element = s.shadowRoot?.firstElementChild as HTMLElement;
      // The track measures its length once laid out, which a ResizeObserver reports
      // in the frame after the append; then the handle moves with a transition.
      const frame = () => new Promise((r) => requestAnimationFrame(r));
      await frame();
      await frame();
      await Promise.all([factory.element, element].flatMap((root) => root.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => a))));
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const handle = root.querySelector('[class*="slider__handle"]') as HTMLElement;
        const track = root.querySelector('[class*="slider__track"]') as HTMLElement;
        const active = root.querySelector('[class*="slider__segment--active"]') as HTMLElement;
        const origin = root.getBoundingClientRect();
        const h = handle.getBoundingClientRect();
        const a = active.getBoundingClientRect();
        return {
          rootW: origin.width, rootH: origin.height,
          handleX: h.x - origin.x, handleW: h.width, handleH: h.height,
          trackH: track.getBoundingClientRect().height, activeW: a.width,
          ticks: root.querySelectorAll('[class*="slider__tick"]').length,
          handleBg: getComputedStyle(handle, "::before").backgroundColor,
          activeBg: getComputedStyle(active).backgroundColor,
          trackRadius: getComputedStyle(track).borderRadius,
        };
      };
      return { factory: measure(factory.element), element: measure(element), host: s.getBoundingClientRect().height };
    });
    assert.deepEqual(parity.element, parity.factory);
    assert.equal(parity.host, parity.element.rootH, "the host is the slider's height");
    check("slider: renders as the factory does with the global stylesheet, after in-place attribute updates");

    const restorePage = await browser.newPage();
    await restorePage.goto(`http://127.0.0.1:${server.port}/restore-slider`);
    await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
    await restorePage.getByRole("slider", { name: "Restored", exact: true }).focus();
    await restorePage.keyboard.press("End");
    await restorePage.getByRole("slider", { name: "Restored range minimum", exact: true }).focus();
    await restorePage.keyboard.press("ArrowRight");
    await restorePage.click("#go");
    await restorePage.waitForURL(/\/away$/);
    await restorePage.goBack();
    await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
    const values = (): number[] =>
      ["rs", "rr"].flatMap((id) => {
        const s = document.getElementById(id) as HTMLElement & { value: number; secondValue: number | null };
        return s.secondValue === null ? [s.value] : [s.value, s.secondValue];
      });
    await restorePage.waitForFunction(() => {
      const s = document.getElementById("rs") as HTMLElement & { value: number };
      return s.value === 100;
    }, undefined, { timeout: 5_000 }).catch(() => undefined);
    const restored = await restorePage.evaluate(values);
    await restorePage.close();
    assert.deepEqual(restored, [100, 21, 80], "going back restores both sliders' values");
    check("slider: going back restores the value, and both ends of a range");
  }

  // ---------------------------------------------------------------- textfield
  await fresh(
    page,
    `<form id="f"><m-textfield id="t" name="email" label="Email" value="a@b.c" required></m-textfield>
     <label for="t" id="outer">Outer label</label>
     <m-textfield id="p" name="plain" label="Plain" value="first"></m-textfield>
     <m-textfield id="o" name="notes" label="Notes" variant="outlined" supporting-text="Optional"></m-textfield>
     <fieldset id="fs"><m-textfield id="in" name="inner" label="Inner"></m-textfield></fieldset></form>
     <section id="factory"></section>`
  );
  {
    const field = page.getByRole("textbox", { name: "Email", exact: true });
    assert.equal(await field.count(), 1, "the label attribute names the inner input");
    check("textfield: the label attribute is the accessible name");

    type TextHost = HTMLElement & { value: string; component: unknown };
    let state = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const t = document.getElementById("t") as HTMLElement & { value: string };
      for (const type of ["input", "change"]) {
        t.addEventListener(type, (e) => {
          (w.events as unknown[]).push({ type, custom: e instanceof CustomEvent, detail: (e as CustomEvent).detail });
        });
      }
      const before = t.value;
      t.value = "live@b.c";
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { before, value: t.value, attribute: t.getAttribute("value"), email: form.get("email"), events: w.events };
    });
    assert.deepEqual(state, { before: "a@b.c", value: "live@b.c", attribute: "a@b.c", email: "live@b.c", events: [] });
    check("textfield: the value attribute is the default, the value property the live value, set silently");

    await field.fill("");
    await page.evaluate(() => ((window as unknown as Win).events = []));
    await field.pressSequentially("hi");
    await field.press("Tab");
    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      const t = document.getElementById("t") as HTMLElement & { value: string };
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { value: t.value, email: form.get("email"), events: w.events } as typeof state;
    });
    assert.deepEqual(state.events, [
      { type: "input", custom: true, detail: { value: "h" } },
      { type: "input", custom: true, detail: { value: "hi" } },
      { type: "change", custom: true, detail: { value: "hi" } },
    ]);
    assert.equal(state.email, "hi");
    check("textfield: typing dispatches one input per keystroke and change on commit, and the form sees the value");

    const defaults = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement & { value: string };
      const p = document.getElementById("p") as HTMLElement & { value: string };
      t.setAttribute("value", "new@b.c");
      p.setAttribute("value", "second");
      return { t: t.value, p: p.value };
    });
    assert.deepEqual(defaults, { t: "hi", p: "second" });
    check("textfield: a new value attribute moves the value until the field is edited, as natively");

    const reset = await page.evaluate(() => {
      (document.getElementById("f") as HTMLFormElement).reset();
      const get = (id: string): string => (document.getElementById(id) as HTMLElement & { value: string }).value;
      return { t: get("t"), p: get("p") };
    });
    assert.deepEqual(reset, { t: "new@b.c", p: "second" });
    check("textfield: form.reset() restores the value attribute");

    // FLO-335: an autofill fills the input without an input event and starts
    // the stylesheet's onAutoFillStart animation; the label then floats, as
    // over a typed value. Simulated: the value set silently, the animation's
    // animationstart dispatched, as Chromium's :autofill would. The float
    // comes from the stylesheet (the value's :not(:placeholder-shown), and
    // :has(:autofill)), not from the script's autofill check, which only
    // reports it (unit-tested); this guards the behaviour, whatever drives it.
    const autofill = await page.evaluate(async () => {
      const make = (value: string): HTMLElement => {
        const host = document.createElement("m-textfield");
        host.setAttribute("label", "Autofill");
        if (value) host.setAttribute("value", value);
        document.body.append(host);
        return host;
      };
      const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
      const empty = make("");
      const filled = make("typed");
      await frame();
      const label = (host: HTMLElement): string => {
        const el = host.shadowRoot?.querySelector('[class*="textfield__label"]') as HTMLElement;
        const style = getComputedStyle(el);
        return `${style.transform} ${style.top}`;
      };
      const resting = label(empty);
      const input = empty.shadowRoot?.querySelector("input") as HTMLInputElement;
      input.value = "ada@example.com";
      input.dispatchEvent(new AnimationEvent("animationstart", { animationName: "onAutoFillStart" }));
      // past the label's float transition
      await new Promise((r) => setTimeout(r, 600));
      const result = { floated: label(empty) !== resting, likeTyped: label(empty) === label(filled) };
      empty.remove();
      filled.remove();
      return result;
    });
    assert.deepEqual(autofill, { floated: true, likeTyped: true });
    check("textfield: an autofill floats the label, as a typed value does");

    const validity = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement & { value: string };
      const form = document.getElementById("f") as HTMLFormElement;
      t.value = "";
      const missing = form.checkValidity();
      t.value = "x";
      const filled = form.checkValidity();
      t.removeAttribute("required");
      t.value = "";
      return { missing, filled, optional: form.checkValidity() };
    });
    assert.deepEqual(validity, { missing: false, filled: true, optional: true });
    await page.evaluate(() => document.getElementById("t")?.setAttribute("type", "email"));
    await field.fill("");
    await field.pressSequentially("nope");
    const typed = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement & { value: string };
      const form = document.getElementById("f") as HTMLFormElement;
      const invalid = form.checkValidity();
      const input = t.shadowRoot?.querySelector("input") as HTMLInputElement;
      return { invalid, type: input.type, value: t.value };
    });
    assert.deepEqual(typed, { invalid: false, type: "email", value: "nope" });
    check("textfield: required and type constraints report validity to the form, and type recreates keeping the value");

    await page.evaluate(() => ((document.getElementById("t") as HTMLElement & { value: string }).value = ""));
    await page.click("#outer");
    const focused = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement;
      return { host: document.activeElement === t, input: t.shadowRoot?.activeElement === t.shadowRoot?.querySelector("input") };
    });
    assert.deepEqual(focused, { host: true, input: true });
    await page.keyboard.type("ok");
    assert.equal(await page.evaluate(() => (document.getElementById("t") as HTMLElement & { value: string }).value), "ok");
    check("textfield: an outer <label for> focuses the input");

    const selected = await page.evaluate(() => {
      // Email inputs have no selection range: the plain field shows it.
      const p = document.getElementById("p") as HTMLElement & { select: () => void };
      p.select();
      const input = p.shadowRoot?.querySelector("input") as HTMLInputElement;
      return [input.selectionStart, input.selectionEnd];
    });
    assert.deepEqual(selected, [0, 6]);
    check("textfield: select() selects the text");

    await page.evaluate(() => {
      const p = document.getElementById("p") as HTMLElement;
      p.setAttribute("readonly", "");
      p.setAttribute("disabled", "");
    });
    const readonly = page.getByRole("textbox", { name: "Plain", exact: true });
    const disabled = await page.evaluate(() => {
      const p = document.getElementById("p") as HTMLElement;
      const input = p.shadowRoot?.querySelector("input") as HTMLInputElement;
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      const result = { disabled: input.disabled, readOnly: input.readOnly, submitted: form.has("plain") };
      p.removeAttribute("disabled");
      return result;
    });
    assert.deepEqual(disabled, { disabled: true, readOnly: true, submitted: false });
    await readonly.pressSequentially("zz");
    assert.equal(await page.evaluate(() => (document.getElementById("p") as HTMLElement & { value: string }).value), "second");
    const fieldset = await page.evaluate(() => {
      const fs = document.getElementById("fs") as HTMLFieldSetElement;
      const input = (document.getElementById("in") as HTMLElement).shadowRoot?.querySelector("input") as HTMLInputElement;
      fs.disabled = true;
      const off = input.disabled;
      fs.disabled = false;
      return { off, on: input.disabled };
    });
    assert.deepEqual(fieldset, { off: true, on: false });
    check("textfield: disabled, readonly and a disabled fieldset reach the inner input");

    const error = await page.evaluate(() => {
      const o = document.getElementById("o") as HTMLElement & { setError: (e: boolean, m?: string) => void };
      const root = o.shadowRoot?.firstElementChild as HTMLElement;
      const input = root.querySelector("input") as HTMLInputElement;
      const helper = (): string | null => root.querySelector('[class*="textfield__helper"]')?.className ?? null;
      o.setAttribute("error", "");
      const on = { invalid: input.getAttribute("aria-invalid"), root: root.className.includes("--error"), helper: helper() };
      o.setAttribute("supporting-text", "Required field");
      const text = { helper: helper(), content: root.querySelector('[class*="textfield__helper"]')?.textContent, root: root.className.includes("--error") };
      o.removeAttribute("supporting-text");
      const noText = { helper: helper(), root: root.className.includes("--error") };
      o.removeAttribute("error");
      const off = { invalid: input.getAttribute("aria-invalid"), root: root.className.includes("--error") };
      o.setError(true, "Bad");
      const message = root.querySelector('[class*="textfield__helper"]')?.textContent;
      o.setError(false);
      return { on, text, noText, off, message };
    });
    assert.deepEqual(error, {
      on: { invalid: "true", root: true, helper: "mtrl-textfield__helper mtrl-textfield__helper--error" },
      text: { helper: "mtrl-textfield__helper mtrl-textfield__helper--error", content: "Required field", root: true },
      noText: { helper: null, root: true },
      off: { invalid: null, root: false },
      message: "Bad",
    });
    check("textfield: the error attribute and setError() show the error state");

    const inPlace = await page.evaluate(async () => {
      const o = document.getElementById("o") as TextHost;
      const before = o.component;
      o.setAttribute("variant", "filled");
      o.setAttribute("prefix-text", "$");
      o.setAttribute("leading-icon", "<svg viewBox='0 0 24 24'></svg>");
      o.setAttribute("placeholder", "Write");
      o.setAttribute("maxlength", "5");
      const root = o.shadowRoot?.firstElementChild as HTMLElement;
      const input = root.querySelector("input") as HTMLInputElement;
      const updated = {
        kept: o.component === before,
        filled: root.className.includes("textfield--filled"),
        prefix: root.querySelector('[class*="textfield__prefix"]')?.textContent,
        icon: !!root.querySelector('[class*="textfield__leading-icon"] svg'),
        placeholder: input.placeholder,
        maxLength: input.maxLength,
      };
      o.value = "typed";
      o.setAttribute("label", "Remarks");
      return { ...updated, recreated: o.component !== before, value: o.value };
    });
    assert.deepEqual(inPlace, {
      kept: true, filled: true, prefix: "$", icon: true, placeholder: "Write", maxLength: 5, recreated: true, value: "typed",
    });
    assert.equal(await page.getByRole("textbox", { name: "Remarks", exact: true }).count(), 1);
    check("textfield: attributes with a setter update in place; label recreates keeping the value");

    const multiline = await page.evaluate(async () => {
      const host = document.getElementById("factory") as HTMLElement;
      host.innerHTML = `<m-textfield id="m" type="multiline" label="Bio" value="Hello"></m-textfield>`;
      const m = document.getElementById("m") as HTMLElement & { value: string };
      const area = m.shadowRoot?.querySelector("textarea") as HTMLTextAreaElement;
      const result = { value: m.value, area: area.value };
      host.innerHTML = "";
      return result;
    });
    assert.deepEqual(multiline, { value: "Hello", area: "Hello" });
    check("textfield: type=multiline renders a textarea with the default value");

    const parity = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createTextField: (c: object) => { element: HTMLElement } } };
      const host = document.getElementById("factory") as HTMLElement;
      host.innerHTML = `<m-textfield id="pf" label="Name" value="Ada" supporting-text="Help"></m-textfield>
        <m-textfield id="po" variant="outlined" label="Name" supporting-text="Help"></m-textfield>`;
      const filled = w.mtrl.createTextField({ label: "Name", value: "Ada", supportingText: "Help" });
      const outlined = w.mtrl.createTextField({ variant: "outlined", label: "Name", supportingText: "Help" });
      host.append(filled.element, outlined.element);
      await new Promise((r) => setTimeout(r, 50));
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const input = root.querySelector("input") as HTMLElement;
        const label = root.querySelector("label") as HTMLElement;
        const helper = root.querySelector('[class*="textfield__helper"]') as HTMLElement;
        const r = root.getBoundingClientRect();
        const i = input.getBoundingClientRect();
        const l = label.getBoundingClientRect();
        const style = getComputedStyle(input);
        return {
          w: Math.round(r.width), h: Math.round(r.height), inputH: Math.round(i.height),
          labelX: Math.round(l.left - r.left), labelY: Math.round(l.top - r.top),
          inputBg: style.backgroundColor, inputColor: style.color, inputFont: style.font, inputBorder: style.border,
          inputRadius: style.borderRadius, labelColor: getComputedStyle(label).color, labelFont: getComputedStyle(label).font,
          helperColor: getComputedStyle(helper).color, helperFont: getComputedStyle(helper).font,
        };
      };
      const shadow = (id: string): HTMLElement =>
        (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      return {
        filled: { factory: measure(filled.element), element: measure(shadow("pf")) },
        outlined: { factory: measure(outlined.element), element: measure(shadow("po")) },
      };
    });
    assert.deepEqual(parity.filled.element, parity.filled.factory);
    assert.deepEqual(parity.outlined.element, parity.outlined.factory);
    check("textfield: renders as the factory does with the global stylesheet, filled and outlined");

    // FLO-305: <m-navigation-bar> renders as the factory does with the global
    // stylesheet, and a click on a destination dispatches change once with its value
    const navBar = await page.evaluate(async (icon) => {
      const w = window as unknown as Win & { mtrl: { createNavigationBar: (c: object) => { element: HTMLElement; destroy: () => void } } };
      const host = document.getElementById("factory") as HTMLElement;
      host.innerHTML = `<div style="width:400px"><m-navigation-bar id="nb" value="home" aria-label="Main">
        <m-navigation-bar-item value="home" icon='${icon}' badge="3">Home</m-navigation-bar-item>
        <m-navigation-bar-item value="search" icon='${icon}'>Search</m-navigation-bar-item>
        <m-navigation-bar-item value="library" icon='${icon}' href="#library">Library</m-navigation-bar-item>
      </m-navigation-bar></div><div id="nbf" style="width:400px"></div>`;
      const factory = w.mtrl.createNavigationBar({ ariaLabel: "Main", items: [
        { id: "home", label: "Home", icon, badge: "3", active: true },
        { id: "search", label: "Search", icon },
        { id: "library", label: "Library", icon, href: "#library" },
      ] });
      (document.getElementById("nbf") as HTMLElement).append(factory.element);
      await new Promise((r) => setTimeout(r, 400));
      const measure = (root: HTMLElement) => {
        const r = root.getBoundingClientRect();
        return {
          landmark: [root.tagName, root.getAttribute("aria-label")],
          height: Math.round(r.height),
          items: [...root.querySelectorAll<HTMLElement>(".mtrl-navigation-bar__item")].map((item) => {
            const indicator = item.querySelector(".mtrl-navigation-bar__indicator")!.getBoundingClientRect();
            const label = item.querySelector(".mtrl-navigation-bar__label") as HTMLElement;
            return {
              tag: item.tagName, current: item.getAttribute("aria-current"), name: item.getAttribute("aria-label"),
              x: Math.round(item.getBoundingClientRect().left - r.left), indicator: [Math.round(indicator.width), Math.round(indicator.height)],
              label: [getComputedStyle(label).color, getComputedStyle(label).font],
            };
          }),
        };
      };
      const element = document.getElementById("nb") as HTMLElement;
      const inShadow = element.shadowRoot?.querySelector(".mtrl-navigation-bar") as HTMLElement;
      const result = { element: measure(inShadow), factory: measure(factory.element), changes: [] as string[] };
      element.addEventListener("change", (event) => result.changes.push((event as CustomEvent).detail.value));
      (inShadow.querySelector('[data-id="search"]') as HTMLElement).click();
      result.changes.push(`value:${(element as HTMLElement & { value: string }).value}`);
      factory.destroy();
      host.innerHTML = "";
      return result;
    }, ICON);
    assert.deepEqual(navBar.element, navBar.factory, "the element renders as the factory");
    assert.deepEqual(navBar.changes, ["search", "value:search"]);
    check("navigation bar: renders as the factory does with the global stylesheet; a click dispatches change with the value (FLO-305)");

    // FLO-354, FLO-355: inside the shadow root too, a resting label is all the
    // input area shows — no placeholder (even disabled), no prefix or suffix —
    // and the affixes appear once the label floats.
    const resting = await page.evaluate(async () => {
      const host = document.getElementById("factory") as HTMLElement;
      const attrs = 'label="Name" placeholder="Enter your name" prefix-text="$" suffix-text="USD" supporting-text="Help"';
      host.innerHTML = ["filled", "outlined"].flatMap((variant) => [
        `<m-textfield id="r-${variant}" variant="${variant}" ${attrs}></m-textfield>`,
        `<m-textfield id="d-${variant}" variant="${variant}" ${attrs} disabled></m-textfield>`,
        `<m-textfield id="v-${variant}" variant="${variant}" ${attrs} value="12"></m-textfield>`,
      ]).join("");
      await new Promise((r) => setTimeout(r, 300));
      const read = (id: string) => {
        const root = (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
        const input = root.querySelector("input") as HTMLInputElement;
        const opacity = (part: string) => Number(getComputedStyle(root.querySelector(`[class*="textfield__${part}"]`) as HTMLElement).opacity);
        return { placeholder: getComputedStyle(input, "::placeholder").webkitTextFillColor, prefix: opacity("prefix"), suffix: opacity("suffix") };
      };
      const ids = ["filled", "outlined"].flatMap((v) => [`r-${v}`, `d-${v}`, `v-${v}`]);
      const result = Object.fromEntries(ids.map((id) => [id, read(id)]));
      host.innerHTML = "";
      return result;
    });
    for (const variant of ["filled", "outlined"]) {
      for (const id of [`r-${variant}`, `d-${variant}`]) {
        assert.equal(resting[id]!.placeholder, "rgba(0, 0, 0, 0)", `${id}: the placeholder shows under the resting label`);
        assert.deepEqual([resting[id]!.prefix, resting[id]!.suffix], [0, 0], `${id}: the affixes show beside the resting label`);
      }
      assert.deepEqual([resting[`v-${variant}`]!.prefix, resting[`v-${variant}`]!.suffix], [1, 1], `v-${variant}: the floated label's affixes are hidden`);
    }
    check("textfield: a resting label shows alone, enabled or disabled; the prefix and suffix appear as it floats");

    // FLO-301: the required attribute moves the input's required and the label's asterisk together
    const required = await page.evaluate(() => {
      const host = document.getElementById("factory") as HTMLElement;
      host.innerHTML = '<m-textfield id="rq" label="Email"></m-textfield>';
      const element = document.getElementById("rq") as HTMLElement;
      const read = () => {
        const root = element.shadowRoot?.firstElementChild as HTMLElement;
        return [root.querySelector("input")!.required, !!root.querySelector('label [class*="textfield__required"]')];
      };
      const states = [read()];
      element.setAttribute("required", "");
      states.push(read());
      element.removeAttribute("required");
      states.push(read());
      host.innerHTML = "";
      return states;
    });
    assert.deepEqual(required, [[false, false], [true, true], [false, false]]);
    check("textfield: required toggles the input's required and the label's asterisk");

    // #234: the outline leaves a notch for the floated label. The label used
    // to be painted with a background copied from the nearest ancestor, which
    // found document.body from inside a shadow root and covered any surface
    // that is not one flat colour.
    await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createTextField: (c: object) => { element: HTMLElement } } };
      const host = document.getElementById("factory") as HTMLElement;
      host.innerHTML = `<div style="background: rgb(200, 230, 255); padding: 24px; display: grid; gap: 24px; width: 320px">
        <m-textfield id="na" variant="outlined" label="Element label" value="Ada"></m-textfield>
        <div id="nb"></div>
        <m-textfield id="nc" variant="outlined" label="Empty"></m-textfield>
        <div dir="rtl"><m-textfield id="nd" variant="outlined" label="Right to left" value="Ada"></m-textfield></div>
      </div>`;
      const factory = w.mtrl.createTextField({ variant: "outlined", label: "Factory label", value: "Ada" });
      (document.getElementById("nb") as HTMLElement).append(factory.element);
    });
    // placement, the label's float and the border-colour transition
    await page.waitForTimeout(500);
    type Box = { left: number; right: number; top: number; bottom: number; width: number };
    const notches = await page.evaluate(() => {
      // A missing segment measures as nothing, so the label is judged first
      const box = (el: Element | null): Box => {
        const { left, right, top, bottom, width } = el?.getBoundingClientRect() ?? new DOMRect();
        return { left, right, top, bottom, width };
      };
      const measure = (root: HTMLElement) => {
        const label = root.querySelector("label") as HTMLElement;
        const part = (name: string): HTMLElement | null => root.querySelector(`[class*="textfield__outline-${name}"]`);
        const color = (el: HTMLElement | null, side: "Top" | "Bottom"): string =>
          el ? getComputedStyle(el)[`border${side}Color`] : "missing";
        const notch = part("notch");
        return {
          root: box(root), label: box(label), notch: box(notch),
          labelBackground: getComputedStyle(label).backgroundColor,
          notchTop: color(notch, "Top"),
          notchBottom: color(notch, "Bottom"),
          leadingTop: color(part("leading"), "Top"),
          trailingTop: color(part("trailing"), "Top"),
        };
      };
      const shadow = (id: string): HTMLElement =>
        (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      const light = (document.getElementById("nb") as HTMLElement).firstElementChild as HTMLElement;
      return { element: measure(shadow("na")), factory: measure(light), empty: measure(shadow("nc")), rtl: measure(shadow("nd")) };
    });
    // Pixels on the top edge: in the notch's cutout padding, beside the
    // label, the card shows through; along the trailing segment the outline
    // is drawn.
    const png = (await page.screenshot()).toString("base64");
    const edge = (n: typeof notches.element, x: number): [number, number] => [x, Math.round(n.root.top)];
    const points = [
      edge(notches.element, notches.element.label.left - 2), edge(notches.element, notches.element.root.right - 30),
      edge(notches.factory, notches.factory.label.left - 2), edge(notches.factory, notches.factory.root.right - 30),
      edge(notches.rtl, notches.rtl.label.right + 2), edge(notches.rtl, notches.rtl.root.left + 30),
      edge(notches.empty, notches.empty.label.left),
    ];
    const pixels = await page.evaluate(async ({ png, points }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.drawImage(image, 0, 0);
      return points.map(([x, y]) => Array.from(context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data.slice(0, 3)).join(","));
    }, { png, points });
    const CARD = "200,230,255";
    const TRANSPARENT = "rgba(0, 0, 0, 0)";
    for (const [name, n] of [["element", notches.element], ["factory", notches.factory], ["rtl", notches.rtl]] as const) {
      assert.equal(n.labelBackground, TRANSPARENT, `${name}: nothing is painted behind the label`);
      assert.equal(n.notchTop, TRANSPARENT, `${name}: the notch is open`);
      assert.notEqual(n.leadingTop, TRANSPARENT, `${name}: the leading corner is drawn`);
      assert.notEqual(n.trailingTop, TRANSPARENT, `${name}: the trailing edge is drawn`);
      assert.notEqual(n.notchBottom, TRANSPARENT, `${name}: the bottom edge runs under the notch`);
      assert(n.notch.width >= n.label.width, `${name}: the notch (${n.notch.width}) is as wide as the label (${n.label.width})`);
      assert(n.notch.left <= n.label.left && n.notch.right >= n.label.right, `${name}: the notch spans the label`);
      assert(n.label.top < n.root.top && n.label.bottom > n.root.top, `${name}: the label sits on the top edge`);
    }
    // M3: the label starts 16dp in and the cutout adds 4dp on each side
    assert(Math.abs(notches.element.notch.left - notches.element.root.left - 12) < 0.5, "the notch starts 12dp in");
    assert(Math.abs(notches.element.label.left - notches.element.notch.left - 4) < 1, "4dp cutout before the label");
    assert(Math.abs(notches.element.notch.right - notches.element.label.right - 4) < 1, "4dp cutout after the label");
    assert(notches.rtl.label.left > notches.rtl.root.left + notches.rtl.root.width / 2, "rtl: the label is on the right");
    assert(Math.abs(notches.rtl.root.right - notches.rtl.notch.right - 12) < 0.5, "rtl: the notch starts 12dp from the right");
    assert.notEqual(notches.empty.notchTop, TRANSPARENT, "empty and unfocused: the notch is closed");
    assert.equal(notches.empty.notchTop, notches.empty.trailingTop, "empty and unfocused: the top edge is one colour");
    assert.deepEqual(pixels.slice(0, 6).map((p) => p === CARD), [true, false, true, false, true, false], `top-edge pixels ${pixels}`);
    assert.notEqual(pixels[6], CARD, "empty and unfocused: the top edge is drawn where the label would float");
    check("textfield: outlined leaves a notch for the floated label on a coloured card, in shadow DOM, light DOM and rtl, closed at rest");

    const focusNotch = await page.evaluate(async () => {
      const c = document.getElementById("nc") as HTMLElement;
      const root = c.shadowRoot?.firstElementChild as HTMLElement;
      const notch = root.querySelector('[class*="textfield__outline-notch"]') as HTMLElement;
      const label = root.querySelector("label") as HTMLElement;
      c.focus();
      await new Promise((r) => setTimeout(r, 400));
      const focused = { top: getComputedStyle(notch).borderTopColor, width: notch.getBoundingClientRect().width, label: label.getBoundingClientRect().width };
      c.blur();
      await new Promise((r) => setTimeout(r, 400));
      return { focused, blurred: getComputedStyle(notch).borderTopColor };
    });
    assert.equal(focusNotch.focused.top, TRANSPARENT, "focus opens the notch");
    assert(focusNotch.focused.width >= focusNotch.focused.label, "the notch fits the focused label");
    assert.notEqual(focusNotch.blurred, TRANSPARENT, "blur on an empty field closes it");
    await page.evaluate(() => ((document.getElementById("factory") as HTMLElement).innerHTML = ""));
    check("textfield: focus opens the notch of an empty outlined field and blur closes it");

    const layout = await page.evaluate(() => {
      const host = document.getElementById("factory") as HTMLElement;
      host.innerHTML = `<m-textfield id="w" label="Wide" style="width:400px"></m-textfield>`;
      const w = document.getElementById("w") as HTMLElement;
      const inline = getComputedStyle(w).display;
      const width = (w.shadowRoot?.firstElementChild as HTMLElement).getBoundingClientRect().width;
      w.focus();
      const focused = w.shadowRoot?.activeElement?.tagName;
      w.blur();
      const blurred = w.shadowRoot?.activeElement ?? null;
      host.innerHTML = "";
      return { inline, width, focused, blurred };
    });
    assert.deepEqual(layout, { inline: "inline-block", width: 400, focused: "INPUT", blurred: null });
    check("textfield: an inline-block host whose width the field fills; focus() and blur() reach the input");
  }

  // ---------------------------------------------------------------- tabs
  await fresh(
    page,
    `<m-tabs id="t" value="t2"><m-tab value="t1">Flights</m-tab><m-tab value="t2">Trips</m-tab>
     <m-tab value="t3" badge="3">Hotels</m-tab></m-tabs>`
  );
  {
    assert.equal(await page.getByRole("tab").count(), 3);
    assert.equal(await page.getByRole("tab", { name: "Trips", selected: true }).count(), 1);
    check("tabs: children declare the tabs, value selects one");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("t")?.addEventListener("change", (e) => (w.events as unknown[]).push((e as CustomEvent).detail));
    });
    await page.getByRole("tab", { name: "Flights" }).click();
    let state = await page.evaluate(() => ({
      events: (window as unknown as Win).events,
      value: (document.getElementById("t") as HTMLElement & { value: string }).value,
    }));
    assert.deepEqual(state, { events: [{ value: "t1" }], value: "t1" });
    check("tabs: a click dispatches change with the value");

    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const t = document.getElementById("t") as HTMLElement & { value: string };
      t.value = "t3";
      return { events: w.events, value: t.value };
    });
    assert.deepEqual(state, { events: [], value: "t3" });
    check("tabs: setting value fires no event");

    await page.evaluate(() => {
      const tab = document.createElement("m-tab");
      tab.setAttribute("value", "t4");
      tab.textContent = "Cars";
      document.getElementById("t")?.append(tab);
    });
    await page.waitForFunction(() => document.getElementById("t")?.shadowRoot?.querySelectorAll('[role="tab"]').length === 4);
    assert.equal(await page.getByRole("tab", { name: /Hotels/, selected: true }).count(), 1);
    check("tabs: a new child tab is added and the selection is kept");
  }

  // ---------------------------------------------------------------- sharing
  await fresh(page, `<section id="a"></section>`);
  {
    const shared = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: Record<string, (o?: object) => string> };
      const make = (): HTMLElement => {
        const el = document.createElement("m-switch");
        el.textContent = "Shared";
        document.getElementById("a")?.append(el);
        return el;
      };
      const a = make();
      // Framework adapters call define() on every mount.
      w.mtrl.defineSwitch();
      w.mtrl.defineSwitch();
      const b = make();
      const sheetsA = a.shadowRoot?.adoptedStyleSheets ?? [];
      const sheetsB = b.shadowRoot?.adoptedStyleSheets ?? [];
      return { count: sheetsA.length, same: sheetsA.length === sheetsB.length && sheetsA.every((sheet, i) => sheet === sheetsB[i]) };
    });
    assert.ok(shared.count > 0);
    assert.equal(shared.same, true, "every instance adopts the same stylesheet objects");
    check("styles: instances share one stylesheet per entry, however often define() runs");
  }

  // ---------------------------------------------------------------- tabs updates
  await fresh(
    page,
    `<m-tabs id="t" value="t1"><m-tab value="t1">Flights</m-tab><m-tab value="t2" badge="3">Trips</m-tab>
     <m-tab value="t3">Hotels</m-tab></m-tabs>`
  );
  {
    await page.getByRole("tab", { name: "Flights", exact: true }).focus();
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const before = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement & { component: unknown };
      (window as unknown as Record<string, unknown>).__tabs = { component: t.component, focused: t.shadowRoot?.activeElement };
      return t.shadowRoot?.activeElement?.textContent?.trim();
    });
    assert.equal(before, "Flights");

    await page.evaluate(() => {
      const tabs = document.querySelectorAll("#t m-tab");
      tabs[1].setAttribute("badge", "4");
      tabs[2].textContent = "Stays";
      tabs[2].setAttribute("disabled", "");
    });
    await settle();
    const after = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement & {
        component: { getTabs: () => Array<{ getBadge: () => string }> };
      };
      const kept = (window as unknown as Record<string, { component: unknown; focused: unknown }>).__tabs;
      const buttons = [...(t.shadowRoot?.querySelectorAll('[role="tab"]') ?? [])] as HTMLElement[];
      return {
        sameComponent: t.component === kept.component,
        sameFocus: t.shadowRoot?.activeElement === kept.focused,
        labels: buttons.map((b) => b.textContent?.replace(/\s+/g, " ").trim()),
        badges: t.component.getTabs().map((tab) => tab.getBadge()),
        disabled: buttons.map((b) => b.hasAttribute("disabled") || b.getAttribute("aria-disabled") === "true"),
      };
    });
    assert.deepEqual(after.sameComponent, true, "a child update does not rebuild the tabs");
    assert.deepEqual(after.sameFocus, true, "the focused tab keeps focus");
    assert.equal(after.labels[1], "Trips");
    assert.equal(after.badges[1], "4");
    assert.equal(after.labels[2], "Stays");
    assert.deepEqual(after.disabled, [false, false, true]);
    check("tabs: badge, text and disabled changes update in place and keep focus");

    await page.evaluate(() => {
      const tab = document.createElement("m-tab");
      tab.setAttribute("value", "t9");
      tab.textContent = "Cars";
      const t = document.getElementById("t") as HTMLElement;
      t.insertBefore(tab, t.children[1]);
      t.children[3].remove();
    });
    await settle();
    const reordered = await page.evaluate(() => {
      const t = document.getElementById("t") as HTMLElement & { value: string };
      const buttons = [...(t.shadowRoot?.querySelectorAll('[role="tab"]') ?? [])] as HTMLElement[];
      return { labels: buttons.map((b) => b.textContent?.replace(/\s*\d+$/, "").trim()), value: t.value };
    });
    assert.deepEqual(reordered, { labels: ["Flights", "Cars", "Trips"], value: "t1" });
    check("tabs: an insertion in the middle and a removal keep order and selection");

    // Frameworks that set a custom element's props as properties (Solid does, always)
    // must reach the attributes <m-tabs> reads.
    const declared = await page.evaluate(async () => {
      const tab = document.createElement("m-tab") as HTMLElement & { value: string; disabled: boolean; badge: string };
      tab.value = "t7";
      tab.badge = "2";
      tab.disabled = true;
      tab.textContent = "Trains";
      document.getElementById("t")?.append(tab);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const t = document.getElementById("t") as HTMLElement & {
        component: { getTabs: () => Array<{ getValue: () => string; getBadge: () => string }> };
      };
      const last = t.component.getTabs().at(-1);
      return { attributes: [tab.getAttribute("value"), tab.getAttribute("badge"), tab.hasAttribute("disabled")], value: last?.getValue(), badge: last?.getBadge() };
    });
    assert.deepEqual(declared, { attributes: ["t7", "2", true], value: "t7", badge: "2" });
    check("tabs: <m-tab> properties write the attributes the tabs read");

    // A framework that renders before the elements are defined (Solid on the client
    // registers them on mount) sets properties on plain, not yet upgraded elements.
    const early = await page.evaluate(async () => {
      const w = window as unknown as { mtrl: { defineTabs: (o?: object) => string } };
      const tabs = document.createElement("late-tabs") as HTMLElement & { value?: string };
      for (const [value, label] of [["first", "First"], ["second", "Second"]]) {
        const tab = document.createElement("late-tab") as HTMLElement & { value?: string };
        tab.value = value;
        tab.textContent = label;
        tabs.append(tab);
      }
      document.getElementById("host")?.append(tabs);
      w.mtrl.defineTabs({ prefix: "late" });
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const upgraded = tabs as HTMLElement & { component: { getTabs: () => Array<{ getValue: () => string }> } };
      return upgraded.component.getTabs().map((tab) => tab.getValue());
    });
    assert.deepEqual(early, ["first", "second"]);
    check("tabs: <m-tab> values set before the elements are defined are kept");
  }

  // ---------------------------------------------------------------- radios
  await fresh(
    page,
    `<form id="f"><m-radios id="g" name="size" value="m" aria-label="Size">
       <m-radio value="s">Small</m-radio><m-radio value="m">Medium</m-radio><m-radio value="l" label="Large"></m-radio>
     </m-radios>
     <fieldset id="fs"><m-radios id="o" name="other"><m-radio value="x">Ex</m-radio><m-radio value="y" disabled>Why</m-radio></m-radios></fieldset>
     </form><section id="factory"></section>`
  );
  {
    type Radios = HTMLElement & { value: string | null; component: unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const group = page.getByRole("radiogroup", { name: "Size" });
    assert.equal(await group.count(), 1);
    const radios = group.getByRole("radio");
    assert.equal(await radios.count(), 3);
    for (const [name, checked] of [["Small", false], ["Medium", true], ["Large", false]] as const) {
      assert.equal(await group.getByRole("radio", { name, exact: true, checked }).count(), 1, name);
    }
    check("radios: a radiogroup named by aria-label; children declare the radios, value checks one");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("g")?.addEventListener("change", (e) => {
        (w.events as unknown[]).push({ detail: (e as CustomEvent).detail, target: (e.target as Element).id });
      });
    });
    await group.getByText("Small", { exact: true }).click();
    let state = await page.evaluate(() => {
      const w = window as unknown as Win;
      const g = document.getElementById("g") as HTMLElement & { value: string | null };
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { events: w.events, value: g.value, attribute: g.getAttribute("value"), size: form.get("size"), other: form.get("other") };
    });
    assert.deepEqual(state, { events: [{ detail: { value: "s" }, target: "g" }], value: "s", attribute: "m", size: "s", other: null });
    check("radios: a click dispatches one change from the host; the live value moves, the attribute stays");

    await page.keyboard.press("ArrowDown");
    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      const g = document.getElementById("g") as HTMLElement & { value: string | null };
      const form = new FormData(document.getElementById("f") as HTMLFormElement);
      return { events: w.events, value: g.value, attribute: g.getAttribute("value"), size: form.get("size"), other: form.get("other") };
    });
    assert.deepEqual((state.events as unknown[]).at(-1), { detail: { value: "m" }, target: "g" });
    assert.equal(state.size, "m");
    assert.equal(await group.getByRole("radio", { name: "Medium", exact: true, checked: true }).count(), 1);
    check("radios: an arrow key moves the selection in the shadow root and dispatches change");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    const focused = await page.evaluate(() => {
      const g = document.getElementById("g") as HTMLElement;
      return { host: document.activeElement === g, value: (g.shadowRoot?.activeElement as HTMLInputElement | null)?.value };
    });
    assert.deepEqual(focused, { host: true, value: "m" }, "tabbing into the group lands on the checked radio");
    check("radios: the group is one tab stop, landing on the checked radio");

    const silent = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const g = document.getElementById("g") as HTMLElement & { value: string | null };
      g.value = "l";
      const after = { value: g.value, size: new FormData(document.getElementById("f") as HTMLFormElement).get("size") };
      g.value = null;
      return {
        events: w.events, after, cleared: g.value, attribute: g.getAttribute("value"),
        size: new FormData(document.getElementById("f") as HTMLFormElement).get("size"),
      };
    });
    assert.deepEqual(silent, { events: [], after: { value: "l", size: "l" }, cleared: null, attribute: "m", size: null });
    check("radios: setting value fires no event and updates the form value; null clears it");

    const reset = await page.evaluate(() => {
      (document.getElementById("f") as HTMLFormElement).reset();
      const value = (id: string): string | null => (document.getElementById(id) as HTMLElement & { value: string | null }).value;
      return { g: value("g"), o: value("o"), size: new FormData(document.getElementById("f") as HTMLFormElement).get("size") };
    });
    assert.deepEqual(reset, { g: "m", o: null, size: "m" });
    check("radios: form.reset() restores the value attribute");

    const validity = await page.evaluate(() => {
      const o = document.getElementById("o") as HTMLElement & { value: string | null };
      o.setAttribute("required", "");
      const form = document.getElementById("f") as HTMLFormElement;
      const invalid = form.checkValidity();
      const missing = (o as HTMLElement & { internals?: ElementInternals }).internals?.validity.valueMissing;
      o.value = "x";
      const valid = form.checkValidity();
      o.value = null;
      o.removeAttribute("required");
      return { invalid, missing, valid, released: form.checkValidity() };
    });
    assert.deepEqual(validity, { invalid: false, missing: true, valid: true, released: true });
    check("radios: required reports a missing value to the form until one is selected");

    const disabled = await page.evaluate(() => {
      const inputs = (id: string): boolean[] =>
        [...((document.getElementById(id) as HTMLElement).shadowRoot?.querySelectorAll("input") ?? [])].map((i) => i.disabled);
      const initial = inputs("o");
      const fieldset = document.getElementById("fs") as HTMLFieldSetElement;
      fieldset.disabled = true;
      const inFieldset = inputs("o");
      fieldset.disabled = false;
      const reenabled = inputs("o");
      const g = document.getElementById("g") as HTMLElement;
      g.setAttribute("disabled", "");
      const group = inputs("g");
      const submitted = new FormData(document.getElementById("f") as HTMLFormElement).get("size");
      g.removeAttribute("disabled");
      return { initial, inFieldset, reenabled, group, submitted, after: inputs("g") };
    });
    assert.deepEqual(disabled, {
      initial: [false, true], inFieldset: [true, true], reenabled: [false, true],
      group: [true, true, true], submitted: null, after: [false, false, false],
    });
    check("radios: a disabled child, the disabled attribute and a disabled fieldset reach the inputs");

    const before = await page.evaluate(() => {
      const g = document.getElementById("g") as Radios;
      (window as unknown as Record<string, unknown>).__radios = g.component;
      g.value = "l";
      const radios = g.querySelectorAll("m-radio");
      radios[0].textContent = "Tiny";
      radios[1].setAttribute("disabled", "");
      const extra = document.createElement("m-radio");
      extra.setAttribute("value", "xl");
      extra.textContent = "Huge";
      g.append(extra);
      radios[2].remove(); // the selected one
      return null;
    });
    assert.equal(before, null);
    await settle();
    const updated = await page.evaluate(() => {
      const g = document.getElementById("g") as Radios;
      const inputs = [...(g.shadowRoot?.querySelectorAll("input") ?? [])];
      return {
        same: g.component === (window as unknown as Record<string, unknown>).__radios,
        values: inputs.map((i) => i.value),
        disabled: inputs.map((i) => i.disabled),
        value: g.value,
        size: new FormData(document.getElementById("f") as HTMLFormElement).get("size"),
      };
    });
    assert.deepEqual(updated, { same: true, values: ["s", "m", "xl"], disabled: [false, true, false], value: null, size: null });
    for (const name of ["Tiny", "Medium", "Huge"]) assert.equal(await group.getByRole("radio", { name, exact: true }).count(), 1, name);
    check("radios: children relabelled, disabled, added and removed update the group in place; removing the selection clears the form value");

    const reordered = await page.evaluate(async () => {
      const g = document.getElementById("g") as Radios;
      g.value = "xl";
      g.prepend(g.children[2]);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const inputs = [...(g.shadowRoot?.querySelectorAll("input") ?? [])];
      return {
        rebuilt: g.component !== (window as unknown as Record<string, unknown>).__radios,
        values: inputs.map((i) => i.value), value: g.value, checked: inputs.map((i) => i.checked),
      };
    });
    assert.deepEqual(reordered, { rebuilt: true, values: ["xl", "s", "m"], value: "xl", checked: [true, false, false] });
    check("radios: a reorder rebuilds the group and keeps the selection");

    const declared = await page.evaluate(async () => {
      const g = document.getElementById("g") as Radios & { component: { radios: Array<{ config: { value: string; label: string; disabled?: boolean } }> } };
      const radio = document.createElement("m-radio") as HTMLElement & { value: string; label: string; disabled: boolean };
      radio.value = "xs";
      radio.label = "Extra small";
      radio.disabled = true;
      g.append(radio);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const last = g.component.radios.at(-1)?.config;
      return { attributes: [radio.getAttribute("value"), radio.getAttribute("label"), radio.hasAttribute("disabled")], last: { ...last } };
    });
    assert.deepEqual(declared, { attributes: ["xs", "Extra small", true], last: { value: "xs", label: "Extra small", disabled: true } });
    check("radios: <m-radio> properties write the attributes the group reads");

    const early = await page.evaluate(async () => {
      const w = window as unknown as { mtrl: { defineRadios: (o?: object) => string } };
      const radios = document.createElement("late-radios") as HTMLElement & { value?: string | null };
      for (const [value, label] of [["first", "First"], ["second", "Second"]]) {
        const radio = document.createElement("late-radio") as HTMLElement & { value?: string; label?: string };
        radio.value = value;
        radio.label = label;
        radios.append(radio);
      }
      radios.value = "second";
      document.getElementById("host")?.append(radios);
      w.mtrl.defineRadios({ prefix: "late" });
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const upgraded = radios as HTMLElement & { value: string | null; component: { radios: Array<{ config: { value: string; label: string } }> } };
      return { options: upgraded.component.radios.map((r) => `${r.config.value}:${r.config.label}`), value: upgraded.value };
    });
    assert.deepEqual(early, { options: ["first:First", "second:Second"], value: "second" });
    check("radios: <m-radio> and <m-radios> properties set before the elements are defined are kept");

    const parity = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createRadios: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createRadios({
        name: "parity", value: "x", options: [{ value: "x", label: "Ex" }, { value: "y", label: "Why", disabled: true }],
      });
      document.getElementById("factory")?.append(factory.element);
      // Built checked, as the factory is: a selection made afterwards is mid-transition.
      const element = document.createElement("m-radios");
      element.setAttribute("value", "x");
      element.innerHTML = '<m-radio value="x">Ex</m-radio><m-radio value="y" disabled>Why</m-radio>';
      document.getElementById("factory")?.before(element);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const root = element.shadowRoot?.firstElementChild as HTMLElement;
      const measure = (group: HTMLElement): Array<Record<string, string | number>> =>
        [...group.querySelectorAll('[class*="radios__item"]')].map((item) => {
          const circle = item.querySelector('[class*="radios__circle"]') as HTMLElement;
          const text = item.querySelector('[class*="radios__text"]') as HTMLElement;
          // The label, not the item, which stretches to its container's width.
          const box = (item.querySelector("label") as HTMLElement).getBoundingClientRect();
          const c = circle.getBoundingClientRect();
          return {
            w: Math.round(box.width), h: Math.round(box.height), circleW: c.width, circleH: c.height,
            border: getComputedStyle(circle).borderColor,
            dot: getComputedStyle(circle, "::after").backgroundColor,
            textColor: getComputedStyle(text).color, font: getComputedStyle(text).font,
          };
        });
      return { factory: measure(factory.element), element: measure(root) };
    });
    assert.equal(parity.element.length, 2);
    assert.deepEqual(parity.element, parity.factory);
    check("radios: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- button group
  await fresh(
    page,
    `<m-button-group id="al" selection="single" value="b" aria-label="Alignment">
       <m-button-group-item value="a">Left</m-button-group-item>
       <m-button-group-item value="b">Center</m-button-group-item>
       <m-button-group-item value="c" label="Right"></m-button-group-item>
     </m-button-group>
     <m-button-group id="fm" selection="multi" aria-label="Format">
       <m-button-group-item value="bold" selected>Bold</m-button-group-item>
       <m-button-group-item value="italic">Italic</m-button-group-item>
       <m-button-group-item value="under" icon="${ICON}" aria-label="Underline"></m-button-group-item>
     </m-button-group>
     <m-button-group id="ac" aria-label="Actions">
       <m-button-group-item value="copy">Copy</m-button-group-item>
       <m-button-group-item value="paste" disabled>Paste</m-button-group-item>
     </m-button-group>
     <section id="factory"></section>`
  );
  {
    type Group = HTMLElement & { value: string | string[] | null; component: unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const alignment = page.getByRole("group", { name: "Alignment" });
    assert.equal(await alignment.count(), 1);
    for (const [name, pressed] of [["Left", false], ["Center", true], ["Right", false]] as const) {
      assert.equal(await alignment.getByRole("button", { name, exact: true, pressed }).count(), 1, name);
    }
    const format = page.getByRole("group", { name: "Format" });
    assert.equal(await format.getByRole("button", { name: "Bold", pressed: true }).count(), 1);
    assert.equal(await format.getByRole("button", { name: "Underline", pressed: false }).count(), 1, "an icon item is named by aria-label");
    check("button group: a group named by aria-label; items declare the buttons, value and selected press them");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      for (const id of ["al", "fm", "ac"]) {
        for (const type of ["change", "action"]) {
          document.getElementById(id)?.addEventListener(type, (e) => {
            (w.events as unknown[]).push({ type, detail: (e as CustomEvent).detail, target: (e.target as Element).id });
          });
        }
      }
    });
    const events = (): Promise<unknown[]> =>
      page.evaluate(() => {
        const w = window as unknown as Win;
        const list = w.events as unknown[];
        w.events = [];
        return list;
      });
    const live = (id: string): Promise<{ value: unknown; attribute: string | null }> =>
      page.evaluate((id) => {
        const g = document.getElementById(id) as Group;
        return { value: g.value, attribute: g.getAttribute("value") };
      }, id);

    await alignment.getByRole("button", { name: "Left" }).click();
    assert.deepEqual(await events(), [
      { type: "action", detail: { value: "a", index: 0 }, target: "al" },
      { type: "change", detail: { value: "a" }, target: "al" },
    ]);
    assert.deepEqual(await live("al"), { value: "a", attribute: "b" });
    check("button group: a click dispatches action and change from the host; the live value moves, the attribute stays");

    await alignment.getByRole("button", { name: "Right" }).focus();
    await page.keyboard.press("Enter");
    assert.deepEqual(await events(), [
      { type: "action", detail: { value: "c", index: 2 }, target: "al" },
      { type: "change", detail: { value: "c" }, target: "al" },
    ]);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Space");
    assert.deepEqual((await events()).at(-1), { type: "change", detail: { value: "b" }, target: "al" });
    assert.equal(await alignment.getByRole("button", { name: "Center", pressed: true }).count(), 1);
    check("button group: Enter and Space press the focused button in the shadow root");

    await format.getByRole("button", { name: "Italic" }).click();
    assert.deepEqual((await events()).at(-1), { type: "change", detail: { value: ["bold", "italic"] }, target: "fm" });
    assert.deepEqual((await live("fm")).value, ["bold", "italic"]);
    check("button group: a multi group's value is an array");

    await page.getByRole("group", { name: "Actions" }).getByRole("button", { name: "Copy" }).click();
    assert.deepEqual(await events(), [{ type: "action", detail: { value: "copy", index: 0 }, target: "ac" }]);
    assert.equal((await live("ac")).value, null, "a group without selection has no value");
    check("button group: without selection a press dispatches action only");

    const silent = await page.evaluate(() => {
      const al = document.getElementById("al") as Group;
      const fm = document.getElementById("fm") as Group;
      al.value = "a";
      const one = al.value;
      al.value = null;
      fm.value = ["under", "bold"];
      const pressed = [...(fm.shadowRoot?.querySelectorAll("button") ?? [])].map((b) => b.getAttribute("aria-pressed"));
      return { one, cleared: al.value, multi: fm.value, pressed };
    });
    assert.deepEqual(silent, { one: "a", cleared: null, multi: ["bold", "under"], pressed: ["true", "false", "true"] });
    assert.deepEqual(await events(), []);
    check("button group: setting value fires no event; null clears a single group, an array sets a multi one");

    const disabled = await page.evaluate(() => {
      const ac = document.getElementById("ac") as HTMLElement;
      const states = (): boolean[] => [...(ac.shadowRoot?.querySelectorAll("button") ?? [])].map((b) => b.disabled);
      const initial = states();
      ac.setAttribute("disabled", "");
      const group = states();
      ac.removeAttribute("disabled");
      return { initial, group, after: states() };
    });
    assert.deepEqual(disabled, { initial: [false, true], group: [true, true], after: [false, true] });
    await page.getByRole("group", { name: "Actions" }).getByRole("button", { name: "Paste" }).click({ force: true });
    assert.deepEqual(await events(), [], "a disabled button dispatches nothing");
    await page.evaluate(() => document.querySelector('#ac [value="paste"]')?.removeAttribute("disabled"));
    await settle();
    const reenabled = await page.evaluate(() => {
      const ac = document.getElementById("ac") as HTMLElement;
      const states = (): boolean[] => [...(ac.shadowRoot?.querySelectorAll("button") ?? [])].map((b) => b.disabled);
      const item = states();
      ac.setAttribute("disabled", "");
      ac.removeAttribute("disabled");
      return { item, group: states() };
    });
    // The factory's enable() would disable Paste again: it was disabled at creation.
    assert.deepEqual(reenabled, { item: [false, false], group: [false, false] });
    check("button group: a disabled item and the disabled attribute reach the buttons, and enabling keeps each item's own state");

    const inPlace = await page.evaluate(async () => {
      const al = document.getElementById("al") as Group;
      (window as unknown as Record<string, unknown>).__group = al.component;
      al.value = "c";
      const items = al.querySelectorAll("m-button-group-item");
      items[0].textContent = "Start";
      items[1].setAttribute("disabled", "");
      items[2].setAttribute("icon", '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const buttons = [...(al.shadowRoot?.querySelectorAll("button") ?? [])];
      return {
        same: al.component === (window as unknown as Record<string, unknown>).__group,
        disabled: buttons.map((b) => b.disabled),
        icon: !!buttons[2].querySelector("svg"),
        value: al.value,
      };
    });
    assert.deepEqual(inPlace, { same: true, disabled: [false, true, false], icon: true, value: "c" });
    assert.equal(await alignment.getByRole("button", { name: "Start", exact: true }).count(), 1);
    check("button group: items relabelled, disabled and given an icon update the group in place");

    const rebuilt = await page.evaluate(async () => {
      const al = document.getElementById("al") as Group;
      const item = document.createElement("m-button-group-item");
      item.setAttribute("value", "j");
      item.textContent = "Justify";
      al.append(item);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const added = {
        rebuilt: al.component !== (window as unknown as Record<string, unknown>).__group,
        labels: [...(al.shadowRoot?.querySelectorAll("button") ?? [])].map((b) => b.textContent?.trim()),
        value: al.value,
      };
      al.querySelector('[value="a"]')?.remove();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const buttons = [...(al.shadowRoot?.querySelectorAll("button") ?? [])];
      return { added, count: buttons.length, value: al.value, pressed: buttons.map((b) => b.getAttribute("aria-pressed")) };
    });
    assert.deepEqual(rebuilt, {
      added: { rebuilt: true, labels: ["Start", "Center", "Right", "Justify"], value: "c" },
      count: 3,
      value: "c",
      pressed: ["false", "true", "false"],
    });
    assert.deepEqual(await events(), []);
    check("button group: items added and removed rebuild the group, keeping the live selection, without events");

    const declared = await page.evaluate(async () => {
      const al = document.getElementById("al") as Group;
      const item = document.createElement("m-button-group-item") as HTMLElement & { value: string; label: string; disabled: boolean };
      item.value = "x";
      item.label = "Extra";
      item.disabled = true;
      al.append(item);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const last = [...(al.shadowRoot?.querySelectorAll("button") ?? [])].at(-1) as HTMLButtonElement;
      return { attributes: [item.getAttribute("value"), item.getAttribute("label"), item.hasAttribute("disabled")], last: [last.textContent?.trim(), last.disabled] };
    });
    assert.deepEqual(declared, { attributes: ["x", "Extra", true], last: ["Extra", true] });
    check("button group: <m-button-group-item> properties write the attributes the group reads");

    const early = await page.evaluate(async () => {
      const w = window as unknown as { mtrl: { defineButtonGroup: (o?: object) => string } };
      const group = document.createElement("late-button-group") as HTMLElement & { value?: unknown; selection?: string };
      for (const [value, label] of [["first", "First"], ["second", "Second"]]) {
        const item = document.createElement("late-button-group-item") as HTMLElement & { value?: string; label?: string };
        item.value = value;
        item.label = label;
        group.append(item);
      }
      group.setAttribute("selection", "single");
      group.value = "second";
      document.getElementById("host")?.append(group);
      w.mtrl.defineButtonGroup({ prefix: "late" });
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const buttons = [...(group.shadowRoot?.querySelectorAll("button") ?? [])];
      return { labels: buttons.map((b) => b.textContent?.trim()), value: (group as Group).value };
    });
    assert.deepEqual(early, { labels: ["First", "Second"], value: "second" });
    check("button group: item and group properties set before the elements are defined are kept");

    const dirty = await page.evaluate(async () => {
      const frame = (): Promise<unknown> => new Promise((r) => requestAnimationFrame(() => r(null)));
      const host = document.getElementById("host") as HTMLElement;
      const make = (): Group => {
        const g = document.createElement("m-button-group") as Group;
        g.setAttribute("selection", "multi");
        g.setAttribute("aria-label", "Dirty group");
        g.innerHTML = '<m-button-group-item value="p">P</m-button-group-item><m-button-group-item value="q">Q</m-button-group-item>';
        host.replaceChildren(g);
        return g;
      };
      let g = make();
      g.setAttribute("value", "p,q");
      const clean = g.value;
      g.querySelector("m-button-group-item")?.setAttribute("selected", "");
      g.removeAttribute("value");
      await frame();
      const byItem = g.value;
      (g.shadowRoot?.querySelectorAll("button")[1] as HTMLButtonElement).click();
      g.setAttribute("value", "q");
      const afterUser = g.value;
      g.querySelectorAll("m-button-group-item")[1].setAttribute("selected", "");
      await frame();
      const afterItem = g.value;
      g = make();
      g.value = ["q"];
      g.setAttribute("value", "p");
      return { clean, byItem, afterUser, afterItem, afterScript: g.value };
    });
    assert.deepEqual(dirty, { clean: ["p", "q"], byItem: ["p"], afterUser: ["p", "q"], afterItem: ["p", "q"], afterScript: ["q"] });
    check("button group: value and selected are defaults, until the user or a script changes the selection");

    await fresh(page, `<section id="factory"></section>`);
    const parity = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createButtonGroup: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createButtonGroup({
        selection: "single", variant: "tonal", ariaLabel: "Factory",
        buttons: [{ value: "a", text: "Left", selected: true }, { value: "b", text: "Center" }, { value: "c", text: "Right", disabled: true }],
      });
      document.getElementById("factory")?.append(factory.element);
      const element = document.createElement("m-button-group");
      element.setAttribute("selection", "single");
      element.setAttribute("variant", "tonal");
      element.setAttribute("value", "a");
      element.innerHTML = '<m-button-group-item value="a">Left</m-button-group-item><m-button-group-item value="b">Center</m-button-group-item><m-button-group-item value="c" disabled>Right</m-button-group-item>';
      document.getElementById("factory")?.before(element);
      await new Promise((r) => setTimeout(r, 400));
      const measure = (group: HTMLElement): Array<Record<string, string | number>> =>
        [...group.querySelectorAll("button")].map((button) => {
          const box = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return {
            w: Math.round(box.width), h: Math.round(box.height), background: style.backgroundColor, color: style.color,
            radius: style.borderRadius, font: style.font,
          };
        });
      const root = element.shadowRoot?.firstElementChild as HTMLElement;
      return { factory: measure(factory.element), element: measure(root) };
    });
    assert.equal(parity.element.length, 3);
    assert.deepEqual(parity.element, parity.factory);
    check("button group: renders as the factory does with the global stylesheet");

    await fresh(
      page,
      `<m-button-group id="ps" selection="single" value="a" aria-label="Single">
         <m-button-group-item value="a">A</m-button-group-item><m-button-group-item value="b">B</m-button-group-item>
       </m-button-group>
       <m-button-group id="pm" selection="multi" aria-label="Multi">
         <m-button-group-item value="a">A</m-button-group-item><m-button-group-item value="b">B</m-button-group-item>
       </m-button-group>`
    );
    const single = await payloadParity(page, "ps", "change", [["button", 1], ["button", 0]]);
    assert.deepEqual(single, { factory: ["b", "a"], element: ["b", "a"] });
    const multi = await payloadParity(page, "pm", "change", [["button", 1], ["button", 0], ["button", 1]]);
    assert.deepEqual(multi, { factory: [["b"], ["a", "b"], ["a"]], element: [["b"], ["a", "b"], ["a"]] });
    check("button group: a change handler reading value reads the same on the factory and the element (FLO-320)");
  }

  // ---------------------------------------------------------------- button group press, the neighbour's label (FLO-552)
  // A held end button widens by 15% of its width and asks its only neighbour
  // for up to the 24px compression limit. The neighbour's facing content
  // padding is 12px at xs and 16px at s (src/styles/abstract/_variables.scss,
  // padding-xs and padding-s), so a pressed button wide enough to reach the
  // limit takes more than the padding can give and the rest comes off the
  // neighbour's label box: the label is narrower than its text for as long as
  // the pointer is held. Sample every frame of a real hold, then check the
  // neighbour's label on each one.
  {
    type HeldFrame = { width: number; padding: number; scroll: number; client: number };
    type Hold = { rest: HeldFrame; frames: HeldFrame[]; done: boolean };
    const first = "Bookmark everything on this page";
    const failures: string[] = [];
    for (const size of ["xs", "s"] as const) {
      await fresh(
        page,
        `<m-button-group id="hold" variant="outlined" size="${size}" aria-label="Actions">
           <m-button-group-item value="a">${first}</m-button-group-item>
           <m-button-group-item value="b">Add to favourites</m-button-group-item>
           <m-button-group-item value="c">Share</m-button-group-item>
         </m-button-group>`
      );
      await page.evaluate(() => {
        const host = document.getElementById("hold") as HTMLElement;
        const buttons = [...(host.shadowRoot?.querySelectorAll("button") ?? [])] as HTMLButtonElement[];
        // The second button is the pressed button's only neighbour.
        const labelOf = (button: HTMLButtonElement): HTMLElement =>
          (button.querySelector('[class*="__text"]') as HTMLElement | null) ?? button;
        const sample = (): HeldFrame => {
          const box = buttons[1].getBoundingClientRect();
          const style = getComputedStyle(buttons[1]);
          return {
            width: box.width,
            padding: parseFloat(style.paddingLeft),
            scroll: labelOf(buttons[1]).scrollWidth,
            client: labelOf(buttons[1]).clientWidth,
          };
        };
        const state: Hold = { rest: sample(), frames: [], done: false };
        (window as unknown as Win).__flo552 = state;
        buttons[0].addEventListener("pointerdown", () => {
          const start = performance.now();
          const loop = (): void => {
            state.frames.push(sample());
            if (performance.now() - start < 320) requestAnimationFrame(loop);
            else state.done = true;
          };
          requestAnimationFrame(loop);
        }, { once: true });
      });
      const target = page.locator("#hold").getByRole("button", { name: first, exact: true });
      const box = await target.boundingBox();
      assert.ok(box, `no box for the ${size} group's first button`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForFunction(() => ((window as unknown as Win).__flo552 as Hold | undefined)?.done === true);
      await page.mouse.up();
      const held = await page.evaluate(() => (window as unknown as Win).__flo552 as Hold);
      const short = held.frames.filter((frame) => frame.scroll > frame.client);
      const worst = held.frames.reduce((max, frame) => Math.max(max, frame.scroll - frame.client), 0);
      const last = held.frames[held.frames.length - 1];
      console.log(
        `  flo552 ${size}: neighbour ${held.rest.width.toFixed(1)}px (padding ${held.rest.padding}px) -> ${last.width.toFixed(1)}px (padding ${last.padding}px); ` +
        `label ${held.rest.scroll}px in ${held.rest.client}px at rest, ${last.scroll}px in ${last.client}px while held; ` +
        `short by ${worst}px in ${short.length} of ${held.frames.length} held frames`
      );
      if (short.length > 0) {
        failures.push(
          `${size}: the neighbour's label is short by ${worst}px in ${short.length} of ${held.frames.length} held frames ` +
          `(neighbour ${last.width.toFixed(1)}px, padding-left ${last.padding}px, label ${last.scroll}px in ${last.client}px)`
        );
      }
    }
    assert.equal(failures.length, 0, `button group press (FLO-552):\n${failures.join("\n")}`);
    check("button group: a held end button never makes its neighbour's label narrower than its text, at xs and s (FLO-552)");
  }

  // ---------------------------------------------------------------- chips
  await fresh(
    page,
    `<button id="before">before</button>
     <m-chips id="ch" aria-label="Filters" value="veg,fish">
       <m-chip value="veg">Vegetarian</m-chip>
       <m-chip value="fish">Fish</m-chip>
       <m-chip value="gf" label="Gluten free"></m-chip>
       <m-chip value="na" disabled>Unavailable</m-chip>
     </m-chips>
     <button id="after">after</button>
     <m-chips id="so" selection="single" aria-label="Sort">
       <m-chip value="new" selected>Newest</m-chip><m-chip value="old">Oldest</m-chip>
     </m-chips>
     <m-chips id="ss" selection="single" aria-label="Single selection">
       <m-chip value="first" selected>First</m-chip><m-chip value="last" selected>Last</m-chip>
     </m-chips>
     <m-chips id="to" aria-label="Recipients" value="ada,bob">
       <m-chip variant="input" value="ada">Ada</m-chip><m-chip variant="input" value="bob">Bob</m-chip>
     </m-chips>
     <section id="factory"></section>`
  );
  {
    type Chips = HTMLElement & { value: string | string[] | null; component: unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const filters = page.getByRole("grid", { name: "Filters" });
    assert.equal(await filters.count(), 1);
    for (const [name, selected] of [["Vegetarian", true], ["Fish", true], ["Gluten free", false], ["Unavailable", false]] as const) {
      assert.equal(await filters.getByRole("gridcell", { name, exact: true, selected }).count(), 1, name);
    }
    const sort = page.getByRole("grid", { name: "Sort" });
    assert.equal(await sort.getByRole("gridcell", { name: "Newest", selected: true }).count(), 1);
    const single = page.getByRole("grid", { name: "Single selection" });
    assert.equal(await single.getByRole("gridcell", { name: "First", selected: false }).count(), 1);
    assert.equal(await single.getByRole("gridcell", { name: "Last", selected: true }).count(), 1);
    assert.equal(await page.evaluate(() => (document.getElementById("ss") as Chips).value), "last");
    check("chips: the last selected declaration wins in a single-select set (FLO-518)");
    check("chips: a grid named by aria-label; chips declare the cells, value and selected select them");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      for (const id of ["ch", "so", "to"]) {
        for (const type of ["change", "remove"]) {
          document.getElementById(id)?.addEventListener(type, (e) => {
            const target = e.target as Chips;
            (w.events as unknown[]).push(type === "remove"
              ? { type, detail: (e as CustomEvent).detail, target: target.id, currentValue: target.value }
              : { type, detail: (e as CustomEvent).detail, target: target.id });
          });
        }
      }
    });
    const events = (): Promise<unknown[]> =>
      page.evaluate(() => {
        const w = window as unknown as Win;
        const list = w.events as unknown[];
        w.events = [];
        return list;
      });
    const live = (id: string): Promise<{ value: unknown; attribute: string | null }> =>
      page.evaluate((id) => {
        const c = document.getElementById(id) as Chips;
        return { value: c.value, attribute: c.getAttribute("value") };
      }, id);

    await filters.getByRole("gridcell", { name: "Gluten free" }).click();
    assert.deepEqual(await events(), [{ type: "change", detail: { value: ["veg", "fish", "gf"] }, target: "ch" }]);
    assert.deepEqual(await live("ch"), { value: ["veg", "fish", "gf"], attribute: "veg,fish" });
    const ring = await page.evaluate(() => {
      const cell = (document.getElementById("ch") as HTMLElement).shadowRoot?.activeElement as HTMLElement;
      return { cell: cell.getAttribute("role"), pointer: [...cell.classList].some((c) => c.endsWith("chip--pointer-focus")) };
    });
    assert.deepEqual(ring, { cell: "gridcell", pointer: true }, "a click focuses the cell without the keyboard ring");
    check("chips: a click dispatches one change from the host, draws no focus ring; the live value moves, the attribute stays");

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Space");
    assert.deepEqual(await events(), [{ type: "change", detail: { value: ["veg", "gf"] }, target: "ch" }]);
    const keyboard = await page.evaluate(() => {
      const cell = (document.getElementById("ch") as HTMLElement).shadowRoot?.activeElement as HTMLElement;
      return [...cell.classList].some((c) => c.endsWith("chip--pointer-focus"));
    });
    assert.equal(keyboard, false, "keyboard focus shows the ring");
    check("chips: the arrows move between cells and Space toggles the focused one");

    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    const entered = await page.evaluate(() => (document.getElementById("ch") as HTMLElement).shadowRoot?.activeElement?.textContent);
    await page.keyboard.press("Tab");
    const left = await page.evaluate(() => document.activeElement?.id);
    assert.deepEqual({ entered, left }, { entered: "Fish", left: "after" });
    check("chips: the set is one tab stop, landing on the last focused chip");

    await sort.getByRole("gridcell", { name: "Oldest" }).click();
    assert.deepEqual(await events(), [{ type: "change", detail: { value: "old" }, target: "so" }]);
    assert.equal((await live("so")).value, "old");
    check("chips: a single-select set's value is one value");

    const silent = await page.evaluate(() => {
      const ch = document.getElementById("ch") as Chips;
      const so = document.getElementById("so") as Chips;
      ch.value = ["gf", "veg"];
      so.value = null;
      const cleared = so.value;
      so.value = "new";
      return { multi: ch.value, cleared, single: so.value };
    });
    assert.deepEqual(silent, { multi: ["veg", "gf"], cleared: null, single: "new" });
    assert.deepEqual(await events(), []);
    check("chips: setting value fires no event; null clears the selection");

    await filters.getByRole("gridcell", { name: "Unavailable" }).click({ force: true });
    await page.evaluate(() => document.querySelector('#ch [value="na"]')?.removeAttribute("disabled"));
    await settle();
    const enabled = await filters.getByRole("gridcell", { name: "Unavailable" }).getAttribute("aria-disabled");
    await page.evaluate(() => document.querySelector('#ch [value="na"]')?.setAttribute("disabled", ""));
    await settle();
    assert.deepEqual({ events: await events(), enabled }, { events: [], enabled: "false" });
    assert.equal(await filters.getByRole("gridcell", { name: "Unavailable" }).getAttribute("aria-disabled"), "true");
    check("chips: a disabled chip dispatches nothing; disabled updates in place");

    const recipients = page.getByRole("grid", { name: "Recipients" });
    await recipients.getByRole("button", { name: "Remove Bob" }).click();
    assert.deepEqual(await events(), [{ type: "remove", detail: { value: ["ada"], chipValue: "bob" }, target: "to", currentValue: ["ada"] }]);
    await page.evaluate(() => {
      const ada = document.querySelector('#to [value="ada"]') as HTMLElement;
      ada.textContent = "Ada L.";
    });
    await settle();
    const lingering = await page.evaluate(() => [...(document.getElementById("to")?.shadowRoot?.querySelectorAll('[role="gridcell"]') ?? [])].map((c) => c.textContent));
    assert.deepEqual(lingering, ["Ada L."], "a removed chip stays removed while its <m-chip> is there");
    await recipients.getByRole("button", { name: "Remove Ada L." }).focus();
    await page.keyboard.press("Delete");
    assert.deepEqual(await events(), [{ type: "remove", detail: { value: [], chipValue: "ada" }, target: "to", currentValue: [] }]);
    const readded = await page.evaluate(async () => {
      const to = document.getElementById("to") as HTMLElement;
      to.replaceChildren();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      to.innerHTML = '<m-chip variant="input" value="bob">Bob</m-chip>';
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return [...(to.shadowRoot?.querySelectorAll('[role="gridcell"]') ?? [])].map((c) => c.textContent);
    });
    assert.deepEqual(readded, ["Bob"]);
    assert.deepEqual(await events(), [], "declarations removing chips dispatch no remove");
    check("chips: removing an input chip, by its button or Delete, dispatches remove; a new <m-chip> brings it back");

    const inPlace = await page.evaluate(async () => {
      const ch = document.getElementById("ch") as Chips;
      (window as unknown as Record<string, unknown>).__chips = ch.component;
      const chips = ch.querySelectorAll("m-chip");
      chips[0].textContent = "Veggie";
      chips[2].setAttribute("icon", '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
      const extra = document.createElement("m-chip");
      extra.setAttribute("value", "nuts");
      extra.textContent = "Nut free";
      ch.append(extra);
      chips[2].remove(); // a selected one
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return {
        same: ch.component === (window as unknown as Record<string, unknown>).__chips,
        cells: [...(ch.shadowRoot?.querySelectorAll('[role="gridcell"]') ?? [])].map((c) => c.textContent),
        value: ch.value,
      };
    });
    assert.deepEqual(inPlace, { same: true, cells: ["Veggie", "Fish", "Unavailable", "Nut free"], value: ["veg"] });
    assert.equal(await filters.getByRole("gridcell", { name: "Veggie", exact: true, selected: true }).count(), 1, "a relabelled cell is named by its new label");
    assert.deepEqual(await events(), []);
    check("chips: chips relabelled, added and removed update the set in place, without events");

    const reordered = await page.evaluate(async () => {
      const ch = document.getElementById("ch") as Chips;
      ch.value = ["nuts"];
      ch.prepend(ch.children[3]);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return {
        rebuilt: ch.component !== (window as unknown as Record<string, unknown>).__chips,
        cells: [...(ch.shadowRoot?.querySelectorAll('[role="gridcell"]') ?? [])].map((c) => c.textContent),
        value: ch.value,
      };
    });
    assert.deepEqual(reordered, { rebuilt: true, cells: ["Nut free", "Veggie", "Fish", "Unavailable"], value: ["nuts"] });
    check("chips: a reorder rebuilds the set and keeps the selection");

    const declared = await page.evaluate(async () => {
      const ch = document.getElementById("ch") as Chips;
      const chip = document.createElement("m-chip") as HTMLElement & { value: string; label: string; variant: string; elevated: boolean };
      chip.value = "tip";
      chip.label = "Tip";
      chip.variant = "assist";
      chip.elevated = true;
      ch.append(chip);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const last = [...(ch.shadowRoot?.querySelectorAll('[role="gridcell"]') ?? [])].at(-1) as HTMLElement;
      return {
        attributes: [chip.getAttribute("value"), chip.getAttribute("label"), chip.getAttribute("variant"), chip.hasAttribute("elevated")],
        classes: ["chip--assist", "chip--elevated"].map((name) => [...last.classList].some((c) => c.endsWith(name))),
      };
    });
    assert.deepEqual(declared, { attributes: ["tip", "Tip", "assist", true], classes: [true, true] });
    check("chips: <m-chip> properties write the attributes the set reads");

    const early = await page.evaluate(async () => {
      const w = window as unknown as { mtrl: { defineChips: (o?: object) => string } };
      const set = document.createElement("late-chips") as HTMLElement & { value?: unknown };
      for (const [value, label] of [["first", "First"], ["second", "Second"]]) {
        const chip = document.createElement("late-chip") as HTMLElement & { value?: string; label?: string };
        chip.value = value;
        chip.label = label;
        set.append(chip);
      }
      set.value = ["second"];
      document.getElementById("host")?.append(set);
      w.mtrl.defineChips({ prefix: "late" });
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const cells = [...(set.shadowRoot?.querySelectorAll('[role="gridcell"]') ?? [])];
      return { labels: cells.map((c) => c.textContent), value: (set as Chips).value };
    });
    assert.deepEqual(early, { labels: ["First", "Second"], value: ["second"] });
    check("chips: <m-chip> and <m-chips> properties set before the elements are defined are kept");

    const layout = await page.evaluate(() => {
      const ch = document.getElementById("ch") as HTMLElement;
      const root = ch.shadowRoot?.firstElementChild as HTMLElement;
      const component = (ch as Chips).component;
      ch.setAttribute("scrollable", "");
      ch.setAttribute("label", "Diet");
      ch.setAttribute("aria-label", "Diet filters");
      const classes = ["chips--scrollable", "chips--with-label"].map((name) => [...root.classList].some((c) => c.endsWith(name)));
      return { classes, labelled: !!root.getAttribute("aria-labelledby"), same: (ch as Chips).component === component };
    });
    assert.deepEqual(layout, { classes: [true, true], labelled: true, same: true });
    check("chips: scrollable, label and aria-label update the set in place");

    // FLO-550: a refused deselect changes nothing, so the host dispatches nothing.
    const refusedDeselect = await page.evaluate(async () => {
      const frame = (): Promise<unknown> => new Promise((r) => requestAnimationFrame(() => r(null)));
      const host = document.createElement("m-chips") as Chips;
      host.setAttribute("selection-required", "");
      host.setAttribute("aria-label", "Required");
      host.innerHTML = `<m-chip value="only" selected>Only</m-chip>`;
      const seen: string[] = [];
      for (const type of ["change", "click"]) host.addEventListener(type, () => seen.push(type));
      document.body.append(host);
      await frame();
      (host.shadowRoot?.querySelector('[role="gridcell"]') as HTMLElement).click();
      await frame();
      const result = { seen, value: host.value };
      host.remove();
      return result;
    });
    assert.deepEqual(refusedDeselect, { seen: ["click"], value: ["only"] });
    check("chips: a refused deselect in a selection-required set dispatches no change");

    const dirty = await page.evaluate(async () => {
      const frame = (): Promise<unknown> => new Promise((r) => requestAnimationFrame(() => r(null)));
      const host = document.getElementById("host") as HTMLElement;
      const make = (): Chips => {
        const c = document.createElement("m-chips") as Chips;
        c.setAttribute("aria-label", "Dirty chips");
        c.innerHTML = '<m-chip value="p">P</m-chip><m-chip value="q">Q</m-chip>';
        host.replaceChildren(c);
        return c;
      };
      let c = make();
      c.setAttribute("value", "p,q");
      const clean = c.value;
      c.querySelector("m-chip")?.setAttribute("selected", "");
      c.removeAttribute("value");
      await frame();
      const byChip = c.value;
      (c.shadowRoot?.querySelectorAll('[role="gridcell"]')[1] as HTMLElement).click();
      c.setAttribute("value", "q");
      const afterUser = c.value;
      c.querySelectorAll("m-chip")[1].setAttribute("selected", "");
      await frame();
      const afterChip = c.value;
      c = make();
      c.value = ["q"];
      c.setAttribute("value", "p");
      return { clean, byChip, afterUser, afterChip, afterScript: c.value };
    });
    assert.deepEqual(dirty, { clean: ["p", "q"], byChip: ["p"], afterUser: ["p", "q"], afterChip: ["p", "q"], afterScript: ["q"] });
    check("chips: value and selected are defaults, until the user or a script changes the selection");

    await fresh(
      page,
      `<m-chips id="cs" selection="single" aria-label="Single"><m-chip value="a" selected>A</m-chip><m-chip value="b">B</m-chip></m-chips>
       <m-chips id="cm" aria-label="Multi"><m-chip value="a">A</m-chip><m-chip value="b">B</m-chip></m-chips>`
    );
    const chipsSingle = await payloadParity(page, "cs", "change", [['[data-value="b"]', 0], ['[data-value="a"]', 0]]);
    assert.deepEqual(chipsSingle, { factory: ["b", "a"], element: ["b", "a"] });
    const chipsMulti = await payloadParity(page, "cm", "change", [['[data-value="b"]', 0], ['[data-value="a"]', 0], ['[data-value="b"]', 0]]);
    assert.deepEqual(chipsMulti, { factory: [["b"], ["a", "b"], ["a"]], element: [["b"], ["a", "b"], ["a"]] });
    check("chips: a change handler reading value reads the same on the factory and the element (FLO-320)");

    await fresh(page, `<section id="factory"></section>`);
    const parity = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createChips: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createChips({
        ariaLabel: "Factory",
        chips: [
          { value: "a", label: "Alpha", selected: true }, { value: "b", label: "Beta" },
          { type: "assist", value: "c", label: "Gamma", elevated: true }, { type: "input", value: "d", label: "Delta" },
          { value: "e", label: "Epsilon", disabled: true },
        ],
      });
      document.getElementById("factory")?.append(factory.element);
      const element = document.createElement("m-chips");
      element.setAttribute("value", "a");
      element.innerHTML = '<m-chip value="a">Alpha</m-chip><m-chip value="b">Beta</m-chip>' +
        '<m-chip variant="assist" value="c" elevated>Gamma</m-chip><m-chip variant="input" value="d">Delta</m-chip>' +
        '<m-chip value="e" disabled>Epsilon</m-chip>';
      document.getElementById("factory")?.before(element);
      await new Promise((r) => setTimeout(r, 400));
      const measure = (set: HTMLElement): Array<Record<string, string | number>> =>
        [...set.querySelectorAll('[role="gridcell"]')].map((chip) => {
          const box = chip.getBoundingClientRect();
          const style = getComputedStyle(chip);
          const label = chip.querySelector('[class*="chip__label"]') as HTMLElement;
          return {
            w: Math.round(box.width), h: Math.round(box.height), background: style.backgroundColor, border: style.borderColor,
            shadow: style.boxShadow, radius: style.borderRadius, color: getComputedStyle(label).color, font: getComputedStyle(label).font,
          };
        });
      const root = element.shadowRoot?.firstElementChild as HTMLElement;
      return { factory: measure(factory.element), element: measure(root) };
    });
    assert.equal(parity.element.length, 5);
    assert.deepEqual(parity.element, parity.factory);
    check("chips: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- progress
  await fresh(
    page,
    `<section><m-progress id="p" value="30" aria-label="Uploading photo"></m-progress></section>
     <section><m-progress id="pc" variant="circular" indeterminate aria-label="Syncing"></m-progress></section>
     <section id="factory"></section>`
  );
  {
    const inner = (id: string): Promise<Record<string, string | null>> =>
      page.evaluate((id) => {
        const root = (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
        return { now: root.getAttribute("aria-valuenow"), max: root.getAttribute("aria-valuemax") };
      }, id);
    assert.equal(await page.getByRole("progressbar", { name: "Uploading photo" }).count(), 1);
    assert.equal(await page.getByRole("progressbar", { name: "Syncing" }).count(), 1);
    assert.deepEqual(await inner("p"), { now: "30", max: "100" });
    assert.deepEqual(await inner("pc"), { now: null, max: "100" });
    check("progress: a progressbar named by aria-label, with the value attributes the factory sets");

    await page.evaluate(() => document.getElementById("p")?.setAttribute("value", "60"));
    assert.equal((await inner("p")).now, "60");
    assert.equal(await page.evaluate(() => (document.getElementById("p") as HTMLElement & { value: number }).value), 60);
    check("progress: a value attribute change updates aria-valuenow and the live value");

    const live = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const p = document.getElementById("p") as HTMLElement & { value: number; indeterminate: boolean };
      for (const name of ["change", "complete"]) p.addEventListener(name, (e) => (w.events as unknown[]).push(e.type));
      const root = p.shadowRoot?.firstElementChild as HTMLElement;
      p.value = 80;
      const now = root.getAttribute("aria-valuenow");
      p.indeterminate = true;
      const indeterminate = root.getAttribute("aria-valuenow");
      p.indeterminate = false;
      return { now, indeterminate, back: root.getAttribute("aria-valuenow"), value: p.value, events: w.events };
    });
    assert.deepEqual(live, { now: "80", indeterminate: null, back: "80", value: 80, events: [] });
    check("progress: setting value and indeterminate updates it and fires no event");

    await page.evaluate(() => document.getElementById("p")?.setAttribute("aria-label", "Downloading"));
    assert.equal(await page.getByRole("progressbar", { name: "Downloading" }).count(), 1);
    assert.equal((await inner("p")).now, "80");
    check("progress: an aria-label change renames it and keeps the live value");

    const parity = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createProgress: (c: object) => { element: HTMLElement } } };
      const linear = w.mtrl.createProgress({ value: 80 });
      const circular = w.mtrl.createProgress({ variant: "circular", indeterminate: true });
      document.getElementById("factory")?.append(linear.element, circular.element);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const measure = (root: HTMLElement): Record<string, string | number> => {
        // Not `display`: the circular root is a flex item of the host, so it computes as `flex`.
        const r = root.getBoundingClientRect();
        const c = (root.querySelector("canvas") as HTMLCanvasElement).getBoundingClientRect();
        return { w: r.width, h: r.height, color: getComputedStyle(root).color, canvasW: c.width, canvasH: c.height };
      };
      const shadow = (id: string): HTMLElement =>
        (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      return {
        factory: [measure(linear.element), measure(circular.element)],
        element: [measure(shadow("p")), measure(shadow("pc"))],
      };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("progress: linear and circular render as the factory does with the global stylesheet");

    // FLO-338: the indeterminate circular indicator keeps its track. Its
    // colour is read from a determinate indicator at 0, all track; the
    // indeterminate one, element and factory, must show pixels of it.
    const track = await page.evaluate(async () => {
      const w = window as unknown as Win & { mtrl: { createProgress: (c: object) => { element: HTMLElement } } };
      const empty = w.mtrl.createProgress({ variant: "circular", value: 0 });
      const spinning = w.mtrl.createProgress({ variant: "circular", indeterminate: true });
      document.getElementById("factory")?.append(empty.element, spinning.element);
      await new Promise((r) => setTimeout(r, 300));
      const pixels = (canvas: HTMLCanvasElement): Uint8ClampedArray =>
        (canvas.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, canvas.width, canvas.height).data;
      const read = (): { trackColor: string; factory: number; element: number } => {
      // The most frequent opaque colour of the empty ring is its track
      const counts = new Map<string, number>();
      const ring = pixels(empty.element.querySelector("canvas") as HTMLCanvasElement);
      for (let i = 0; i < ring.length; i += 4) {
        if (ring[i + 3]! < 250) continue;
        const key = `${ring[i]},${ring[i + 1]},${ring[i + 2]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const trackColor = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      const count = (canvas: HTMLCanvasElement): number => {
        const data = pixels(canvas);
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3]! >= 250 && `${data[i]},${data[i + 1]},${data[i + 2]}` === trackColor) n++;
        }
        return n;
      };
      const inShadow = (id: string): HTMLCanvasElement =>
        (document.getElementById(id) as HTMLElement).shadowRoot?.querySelector("canvas") as HTMLCanvasElement;
      return { trackColor, factory: count(spinning.element.querySelector("canvas") as HTMLCanvasElement), element: count(inShadow("pc")) };
      };
      // A detached factory keeps its fallback colours until a ResizeObserver reports
      // it, and the canvas is drawn in a frame after that: 300ms was only long
      // enough for both. Read again, for 5s at most, until the track is drawn; the
      // assertion below reports the last reading.
      let result = read();
      for (let i = 0; i < 100 && !(result.trackColor !== "" && result.factory > 20 && result.element > 20); i++) {
        await new Promise((r) => setTimeout(r, 50));
        result = read();
      }
      empty.element.remove();
      spinning.element.remove();
      return result;
    });
    assert.notEqual(track.trackColor, "", "the empty ring has a track colour");
    assert.ok(track.factory > 20 && track.element > 20, `track pixels in the indeterminate indicator: ${JSON.stringify(track)}`);
    check("progress: the indeterminate circular indicator shows its track, factory and element");
  }

  // ---------------------------------------------------------------- loading indicator
  await fresh(
    page,
    `<m-loading-indicator id="li" aria-label="Loading results"></m-loading-indicator>
     <m-loading-indicator id="lc" contained size="64"></m-loading-indicator><section id="factory"></section>`
  );
  {
    assert.equal(await page.getByRole("progressbar", { name: "Loading results" }).count(), 1);
    assert.equal(await page.getByRole("progressbar", { name: "Loading", exact: true }).count(), 1, "the factory's default name");
    check("loading indicator: a progressbar named by aria-label");

    const updated = await page.evaluate(() => {
      const li = document.getElementById("li") as HTMLElement & { component: unknown };
      const before = li.component;
      const root = li.shadowRoot?.firstElementChild as HTMLElement;
      li.setAttribute("size", "96");
      li.setAttribute("value", "0.5");
      const determinate = root.getAttribute("aria-valuenow");
      li.removeAttribute("value");
      li.setAttribute("aria-label", "Loading more");
      return {
        size: root.getBoundingClientRect().width,
        determinate,
        indeterminate: root.getAttribute("aria-valuenow"),
        same: li.component === before,
      };
    });
    assert.deepEqual(updated, { size: 96, determinate: "50", indeterminate: null, same: true });
    assert.equal(await page.getByRole("progressbar", { name: "Loading more" }).count(), 1);
    check("loading indicator: size, value and aria-label changes update it in place");

    const live = await page.evaluate(() => {
      const li = document.getElementById("li") as HTMLElement & {
        value: number | null; stop: () => unknown; component: { isRunning: () => boolean };
      };
      li.value = 0.25;
      const now = li.shadowRoot?.firstElementChild?.getAttribute("aria-valuenow");
      li.stop();
      return { now, running: li.component.isRunning() };
    });
    assert.deepEqual(live, { now: "25", running: false });
    check("loading indicator: the value property and the stop method reach the component");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createLoadingIndicator: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createLoadingIndicator({ contained: true, size: 64 });
      document.getElementById("factory")?.append(factory.element);
      const host = document.getElementById("lc") as HTMLElement;
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { w: r.width, h: r.height, bg: s.backgroundColor, color: s.color, radius: s.borderRadius };
      };
      return {
        factory: measure(factory.element),
        element: measure(host.shadowRoot?.firstElementChild as HTMLElement),
        host: host.getBoundingClientRect().height,
      };
    });
    assert.deepEqual(parity.element, parity.factory);
    assert.equal(parity.host, 64, "the host is exactly the indicator's size");
    check("loading indicator: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------- canvas theme (FLO-389)
  // A theme set on a section, with :root light: the canvases draw the
  // section's colours, factory and element, and follow a theme change on it.
  await fresh(
    page,
    `<div id="themed" data-theme="baseline" data-theme-mode="dark">
       <m-progress id="tl" value="50"></m-progress>
       <m-progress id="tli" indeterminate></m-progress>
       <m-progress id="tc" variant="circular" value="50"></m-progress>
       <m-progress id="tci" variant="circular" indeterminate></m-progress>
       <m-loading-indicator id="tload"></m-loading-indicator>
       <section id="factory"></section>
     </div>`
  );
  {
    type Palette = { primary: string; track: string; canvases: Record<string, Record<string, number>> };
    const sample = (): Promise<Palette> =>
      page.evaluate(async () => {
        await new Promise((r) => setTimeout(r, 300));
        const themed = document.getElementById("themed") as HTMLElement;
        const probe = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
        const hex = (name: string): string => {
          probe.fillStyle = "#000";
          probe.fillStyle = getComputedStyle(themed).getPropertyValue(name).trim();
          return probe.fillStyle;
        };
        const histogram = (canvas: HTMLCanvasElement): Record<string, number> => {
          const data = (canvas.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, canvas.width, canvas.height).data;
          const counts: Record<string, number> = {};
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3]! < 250) continue;
            const key = `#${[data[i]!, data[i + 1]!, data[i + 2]!].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
            counts[key] = (counts[key] ?? 0) + 1;
          }
          return counts;
        };
        const canvases: Record<string, Record<string, number>> = {};
        for (const id of ["tl", "tli", "tc", "tci", "tload"]) {
          canvases[`element ${id}`] = histogram((document.getElementById(id) as HTMLElement).shadowRoot?.querySelector("canvas") as HTMLCanvasElement);
        }
        for (const [name, el] of Object.entries((window as unknown as { factories: Record<string, HTMLElement> }).factories)) {
          canvases[`factory ${name}`] = histogram(el.querySelector("canvas") as HTMLCanvasElement);
        }
        return { primary: hex("--mtrl-sys-color-primary"), track: hex("--mtrl-sys-color-secondary-container"), canvases };
      });
    await page.evaluate(() => {
      const w = window as unknown as Win & {
        mtrl: { createProgress: (c: object) => { element: HTMLElement }; createLoadingIndicator: (c: object) => { element: HTMLElement } };
      };
      const factories: Record<string, HTMLElement> = {
        tl: w.mtrl.createProgress({ value: 50 }).element,
        tli: w.mtrl.createProgress({ indeterminate: true }).element,
        tc: w.mtrl.createProgress({ variant: "circular", value: 50 }).element,
        tci: w.mtrl.createProgress({ variant: "circular", indeterminate: true }).element,
        tload: w.mtrl.createLoadingIndicator({}).element,
      };
      document.getElementById("factory")?.append(...Object.values(factories));
      (window as unknown as { factories: Record<string, HTMLElement> }).factories = factories;
    });
    const light = await page.evaluate(() => {
      const probe = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
      const hex = (name: string): string => {
        probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return probe.fillStyle;
      };
      return { primary: hex("--mtrl-sys-color-primary"), track: hex("--mtrl-sys-color-secondary-container") };
    });
    const expectPalette = (palette: Palette, not: { primary: string; track: string }, when: string): void => {
      assert.notEqual(palette.primary, not.primary, `${when}: the section's primary differs from the other theme's`);
      for (const [name, counts] of Object.entries(palette.canvases)) {
        const what = `${when}, ${name}: ${JSON.stringify(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4))}`;
        assert.ok((counts[palette.primary] ?? 0) > 10, `${what} draws the section's primary ${palette.primary}`);
        assert.equal(counts[not.primary] ?? 0, 0, `${what} draws no ${not.primary}`);
        if (name.endsWith("tload")) continue; // a loading indicator has no track
        assert.ok((counts[palette.track] ?? 0) > 10, `${what} draws the section's track ${palette.track}`);
        assert.equal(counts[not.track] ?? 0, 0, `${what} draws no ${not.track}`);
      }
    };
    // The factories were appended just before: their colours arrive from a
    // ResizeObserver and their pixels in a frame after it. Sample again, for 5s at
    // most, until the section's colours are drawn; the last failure is the one reported.
    const dark = await (async (): Promise<Palette> => {
      for (const end = Date.now() + 5000; ;) {
        const palette = await sample();
        try {
          expectPalette(palette, light, "dark section");
          return palette;
        } catch (error) {
          if (Date.now() > end) throw error;
        }
      }
    })();
    check("canvas theme: progress (linear, circular, determinate, indeterminate) and loading indicator draw a dark section's colours with :root light, factory and element");

    await page.evaluate(() => document.getElementById("themed")?.setAttribute("data-theme-mode", "light"));
    expectPalette(await sample(), dark, "section switched to light");
    await page.evaluate(() => document.getElementById("themed")?.setAttribute("data-theme-mode", "dark"));
    expectPalette(await sample(), light, "section switched back to dark");
    check("canvas theme: a theme change on the section redraws them in its new colours");
  }

  // ---------------------------------------------------------------- badge
  await fresh(
    page,
    `<m-badge id="b1" max="99">120</m-badge> <m-badge id="b2" label="New" color="primary"></m-badge>
     <m-badge id="b3" variant="small"></m-badge><section id="factory"></section>`
  );
  {
    const shown = (): Promise<Record<string, string | null>> =>
      page.evaluate(() => {
        const text = (id: string): string | null =>
          (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild?.textContent ?? null;
        return { b1: text("b1"), b2: text("b2") };
      });
    assert.equal(await page.getByRole("status").count(), 2);
    assert.deepEqual(await shown(), { b1: "99+", b2: "New" });
    assert.equal(
      await page.evaluate(() => document.getElementById("b3")?.shadowRoot?.firstElementChild?.getAttribute("aria-hidden")),
      "true"
    );
    check("badge: text or label attribute is the label, max caps it; large is a status, small is hidden");

    const updated = await page.evaluate(async () => {
      const b1 = document.getElementById("b1") as HTMLElement & { component: unknown };
      const before = b1.component;
      b1.textContent = "5";
      document.getElementById("b2")?.setAttribute("label", "Hot");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return { same: b1.component === before };
    });
    assert.deepEqual(updated, { same: true });
    assert.deepEqual(await shown(), { b1: "5", b2: "Hot" });
    check("badge: text and label attribute changes update the label in place");

    const live = await page.evaluate(async () => {
      const b2 = document.getElementById("b2") as HTMLElement & { visible: boolean };
      const root = b2.shadowRoot?.firstElementChild as HTMLElement;
      b2.visible = false;
      const hidden = getComputedStyle(root).display;
      // An unrelated change leaves the visibility alone.
      b2.setAttribute("color", "tertiary");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const kept = b2.visible;
      b2.visible = true;
      return { hidden, kept, visible: b2.visible, display: getComputedStyle(root).display };
    });
    assert.deepEqual(live, { hidden: "none", kept: false, visible: true, display: "flex" });
    check("badge: the visible property hides and shows it; other changes keep it");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createBadge: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createBadge({ label: "Hot", color: "tertiary" });
      document.getElementById("factory")?.append(factory.element);
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { w: r.width, h: r.height, bg: s.backgroundColor, color: s.color, radius: s.borderRadius, font: s.font };
      };
      const element = (document.getElementById("b2") as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      return { factory: measure(factory.element), element: measure(element) };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("badge: renders as the factory does with the global stylesheet");

    // FLO-329: baseline declared no status roles, so these had no background.
    const status = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createBadge: (c: object) => { element: HTMLElement } } };
      return Object.fromEntries(["success", "warning", "info"].map((color) => {
        const badge = w.mtrl.createBadge({ label: "1", color });
        document.getElementById("factory")?.append(badge.element);
        const s = getComputedStyle(badge.element);
        return [color, { bg: s.backgroundColor, color: s.color }];
      }));
    });
    assert.deepEqual(status, {
      success: { bg: "rgb(0, 108, 78)", color: "rgb(255, 255, 255)" },
      warning: { bg: "rgb(151, 72, 0)", color: "rgb(255, 255, 255)" },
      info: { bg: "rgb(0, 97, 164)", color: "rgb(255, 255, 255)" },
    });
    check("badge: the success, warning and info colours have their background under baseline");
  }

  // ---------------------------------------------------------------- divider
  await fresh(
    page,
    `<section><m-divider id="d1"></m-divider></section><section><m-divider id="d2" variant="inset"></m-divider></section>
     <section><m-divider id="d3"></m-divider></section><m-divider id="dv" orientation="vertical"></m-divider>
     <section id="factory"></section>`
  );
  {
    assert.equal(await page.getByRole("separator").count(), 4);
    assert.equal(
      await page.evaluate(() => document.getElementById("dv")?.shadowRoot?.firstElementChild?.getAttribute("aria-orientation")),
      "vertical"
    );
    check("divider: a separator, vertical when oriented so");

    const updated = await page.evaluate(() => {
      const d3 = document.getElementById("d3") as HTMLElement & { component: unknown; thickness: number };
      const before = d3.component;
      const root = d3.shadowRoot?.firstElementChild as HTMLElement;
      d3.setAttribute("variant", "middle-inset");
      const margins = [getComputedStyle(root).marginLeft, getComputedStyle(root).marginRight];
      d3.thickness = 2;
      return { margins, height: root.getBoundingClientRect().height, same: d3.component === before };
    });
    assert.deepEqual(updated, { margins: ["16px", "16px"], height: 2, same: true });
    check("divider: variant and thickness changes update it in place");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createDivider: (c: object) => { element: HTMLElement } } };
      const full = w.mtrl.createDivider({});
      const inset = w.mtrl.createDivider({ variant: "inset" });
      document.getElementById("factory")?.append(full.element, inset.element);
      const measure = (el: HTMLElement): Record<string, string | number> => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { w: r.width, h: r.height, bg: s.backgroundColor, margin: s.margin };
      };
      const shadow = (id: string): HTMLElement =>
        (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      return { factory: [measure(full.element), measure(inset.element)], element: [measure(shadow("d1")), measure(shadow("d2"))] };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("divider: full-width and inset render as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- navigation rail
  await fresh(
    page,
    `<m-navigation-rail id="nr" value="b" aria-label="Main">
       <m-navigation-rail-item value="a" icon='${ICON}'>Inbox</m-navigation-rail-item>
       <m-navigation-rail-item value="b" icon='${ICON}' badge="3" badge-label="3 new">Sent</m-navigation-rail-item>
       <m-navigation-rail-item value="c" icon='${ICON}' href="#starred">Starred</m-navigation-rail-item>
       <m-navigation-rail-item value="d" icon='${ICON}' disabled>Trash</m-navigation-rail-item>
     </m-navigation-rail><section id="factory"></section>`
  );
  {
    type Rail = HTMLElement & { value: string | null; component: unknown; expanded: boolean };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const nav = page.getByRole("navigation", { name: "Main" });
    assert.equal(await nav.count(), 1);
    assert.equal(await nav.getByRole("button", { name: "Inbox", exact: true }).count(), 1);
    assert.equal(await nav.getByRole("button", { name: "Sent, 3 new", exact: true }).getAttribute("aria-current"), "page");
    assert.equal(await nav.getByRole("link", { name: "Starred", exact: true }).getAttribute("href"), "#starred");
    assert.equal(await nav.getByRole("button", { name: "Trash", exact: true }).isDisabled(), true);
    assert.equal(await nav.locator('[aria-current="page"]').count(), 1);
    check("navigation rail: a navigation landmark named by aria-label; items are buttons or links, value is aria-current");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("nr")?.addEventListener("change", (e) => {
        (w.events as unknown[]).push({ detail: (e as CustomEvent).detail, target: (e.target as Element).id });
      });
    });
    const state = (): Promise<{ events: unknown; value: string | null; attribute: string | null; current: string | undefined }> =>
      page.evaluate(() => {
        const r = document.getElementById("nr") as Rail;
        const current = r.shadowRoot?.querySelector('[aria-current="page"]') as HTMLElement | null;
        return { events: (window as unknown as Win).events, value: r.value, attribute: r.getAttribute("value"), current: current?.dataset.id };
      });
    await nav.getByRole("button", { name: "Inbox", exact: true }).click();
    assert.deepEqual(await state(), { events: [{ detail: { value: "a" }, target: "nr" }], value: "a", attribute: "b", current: "a" });
    check("navigation rail: a click dispatches one change from the host; the live value moves, the attribute stays");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.deepEqual((await state()).events, [
      { detail: { value: "a" }, target: "nr" },
      { detail: { value: "b" }, target: "nr" },
    ]);
    assert.equal((await state()).current, "b");
    check("navigation rail: arrow keys move focus and Enter selects, dispatching change");

    const silent = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const r = document.getElementById("nr") as Rail;
      r.value = "c";
      const after = r.value;
      r.value = "d"; // disabled: not selectable
      return { events: w.events, after, disabled: r.value };
    });
    assert.deepEqual(silent, { events: [], after: "c", disabled: "c" });
    check("navigation rail: setting value fires no event; a disabled item cannot be selected");

    await nav.getByRole("button", { name: "Trash", exact: true }).dispatchEvent("click");
    assert.deepEqual(await state(), { events: [], value: "c", attribute: "b", current: "c" });
    check("navigation rail: a click on a disabled item does nothing");

    await nav.getByRole("button", { name: "Inbox", exact: true }).focus();
    await page.evaluate(() => {
      const r = document.getElementById("nr") as Rail;
      (window as unknown as Record<string, unknown>).__rail = r.component;
      const items = r.querySelectorAll("m-navigation-rail-item");
      items[0].textContent = "Mail";
      items[1].setAttribute("badge", "7");
      items[1].removeAttribute("badge-label");
      items[3].remove();
      const added = document.createElement("m-navigation-rail-item") as HTMLElement & { value: string; icon: string };
      added.value = "e";
      added.icon = items[0].getAttribute("icon") ?? "";
      added.textContent = "Archive";
      r.append(added);
    });
    await settle();
    const updated = await page.evaluate(() => {
      const r = document.getElementById("nr") as Rail;
      const items = [...(r.shadowRoot?.querySelectorAll("[data-id]") ?? [])] as HTMLElement[];
      return {
        same: r.component === (window as unknown as Record<string, unknown>).__rail,
        names: items.map((item) => item.getAttribute("aria-label")),
        value: r.value,
        focused: (r.shadowRoot?.activeElement as HTMLElement | null)?.dataset.id,
      };
    });
    assert.deepEqual(updated, { same: true, names: ["Mail", "Sent, 7", "Starred", "Archive"], value: "c", focused: "a" });
    check("navigation rail: children added, removed and relabelled update in place, keeping selection and focus");

    await nav.getByRole("button", { name: "Expand navigation" }).click();
    let expanded = await page.evaluate(() => {
      const r = document.getElementById("nr") as Rail;
      return { attribute: r.hasAttribute("expanded"), property: r.expanded };
    });
    assert.deepEqual(expanded, { attribute: true, property: true });
    await page.evaluate(() => document.getElementById("nr")?.removeAttribute("expanded"));
    expanded = await page.evaluate(() => {
      const r = document.getElementById("nr") as Rail & { component: { isExpanded: () => boolean } };
      return { attribute: r.hasAttribute("expanded"), property: r.component.isExpanded() };
    });
    assert.deepEqual(expanded, { attribute: false, property: false });
    check("navigation rail: the menu button reflects expanded, and the attribute collapses it");

    await page.evaluate(() => {
      const fab = document.createElement("button");
      fab.slot = "header";
      fab.textContent = "Compose";
      document.getElementById("nr")?.prepend(fab);
    });
    await settle();
    const header = await page.evaluate(() => {
      const r = document.getElementById("nr") as Rail;
      const slot = r.querySelector("button")?.assignedSlot;
      return { region: slot?.parentElement?.className, value: r.value, items: r.shadowRoot?.querySelectorAll("[data-id]").length };
    });
    assert.match(header.region ?? "", /navigation-rail__header/);
    assert.deepEqual({ value: header.value, items: header.items }, { value: "c", items: 4 });
    check("navigation rail: slot=header content goes in the header, below the menu button");

    const parity = await page.evaluate((icon) => {
      const w = window as unknown as Win & { mtrl: { createNavigationRail: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createNavigationRail({
        items: [{ id: "a", label: "Inbox", icon, active: true }, { id: "b", label: "Sent", icon }],
      });
      document.getElementById("factory")?.append(factory.element);
      const host = document.createElement("m-navigation-rail");
      host.setAttribute("value", "a");
      host.innerHTML = `<m-navigation-rail-item value="a">Inbox</m-navigation-rail-item><m-navigation-rail-item value="b">Sent</m-navigation-rail-item>`;
      host.querySelectorAll("m-navigation-rail-item").forEach((item) => item.setAttribute("icon", icon));
      document.getElementById("factory")?.append(host);
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const item = root.querySelector('[class*="navigation-rail__item"]') as HTMLElement;
        const indicator = root.querySelector('[class*="navigation-rail__indicator"]') as HTMLElement;
        const label = root.querySelector('[class*="navigation-rail__label"]') as HTMLElement;
        const r = root.getBoundingClientRect();
        const i = item.getBoundingClientRect();
        return {
          width: r.width, itemW: i.width, itemH: i.height,
          bg: getComputedStyle(root).backgroundColor,
          indicator: getComputedStyle(indicator).backgroundColor,
          labelColor: getComputedStyle(label).color, labelFont: getComputedStyle(label).font,
        };
      };
      return { factory: measure(factory.element), element: measure(host.shadowRoot?.firstElementChild as HTMLElement) };
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("navigation rail: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- drawer
  await fresh(
    page,
    `<m-drawer id="dr" open headline="Mail" value="inbox">
       <m-drawer-item value="inbox" icon='${ICON}' badge="24">Inbox</m-drawer-item>
       <m-drawer-item value="sent" icon='${ICON}'>Sent</m-drawer-item>
       <m-drawer-item type="divider"></m-drawer-item>
       <m-drawer-item type="section">Labels</m-drawer-item>
       <m-drawer-item value="family" disabled>Family</m-drawer-item>
     </m-drawer><section id="factory"></section>`
  );
  {
    type Drawer = HTMLElement & { value: string | null; component: unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const nav = page.getByRole("navigation", { name: "Mail" });
    assert.equal(await nav.count(), 1);
    assert.equal(await nav.getByRole("button", { name: /^Inbox/ }).getAttribute("aria-current"), "page");
    assert.equal(await nav.getByRole("button", { name: "Family" }).isDisabled(), true);
    const structure = await page.evaluate(() => {
      const root = document.getElementById("dr")?.shadowRoot as ShadowRoot;
      return {
        headline: root.querySelector('[class*="drawer__headline"]')?.textContent,
        separators: root.querySelectorAll('hr[role="separator"]').length,
        section: root.querySelector('[class*="drawer__section-label"]')?.textContent,
      };
    });
    assert.deepEqual(structure, { headline: "Mail", separators: 1, section: "Labels" });
    check("drawer: a navigation landmark named by its headline; items, a divider and a section headline; value is aria-current");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("dr")?.addEventListener("change", (e) => {
        (w.events as unknown[]).push({ detail: (e as CustomEvent).detail, target: (e.target as Element).id });
      });
    });
    const state = (): Promise<{ events: unknown; value: string | null; attribute: string | null; current: string | undefined }> =>
      page.evaluate(() => {
        const d = document.getElementById("dr") as Drawer;
        const current = d.shadowRoot?.querySelector('[aria-current="page"]') as HTMLElement | null;
        return { events: (window as unknown as Win).events, value: d.value, attribute: d.getAttribute("value"), current: current?.dataset.id };
      });
    await nav.getByRole("button", { name: "Sent", exact: true }).click();
    assert.deepEqual(await state(), { events: [{ detail: { value: "sent" }, target: "dr" }], value: "sent", attribute: "inbox", current: "sent" });
    check("drawer: a click dispatches one change from the host; the live value moves, the attribute stays");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    assert.deepEqual(((await state()).events as unknown[]).at(-1), { detail: { value: "inbox" }, target: "dr" });
    assert.equal(((await state()).events as unknown[]).length, 2);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(" ");
    assert.deepEqual(await state(), {
      events: [
        { detail: { value: "sent" }, target: "dr" },
        { detail: { value: "inbox" }, target: "dr" },
        { detail: { value: "sent" }, target: "dr" },
      ],
      value: "sent", attribute: "inbox", current: "sent",
    });
    check("drawer: arrow keys move focus and Enter or Space selects, dispatching change once");

    const silent = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const d = document.getElementById("dr") as Drawer;
      d.value = "inbox";
      const after = d.value;
      d.value = "family"; // disabled: not selectable
      const disabled = d.value;
      d.value = null;
      return { events: w.events, after, disabled, cleared: d.value };
    });
    assert.deepEqual(silent, { events: [], after: "inbox", disabled: "inbox", cleared: null });
    await nav.getByRole("button", { name: "Family" }).dispatchEvent("click");
    assert.deepEqual((await state()).events, []);
    check("drawer: setting value fires no event and null clears; a disabled item cannot be selected");

    await page.evaluate(() => ((document.getElementById("dr") as Drawer).value = "sent"));
    await nav.getByRole("button", { name: "Sent", exact: true }).focus();
    await page.evaluate(() => {
      const d = document.getElementById("dr") as Drawer;
      (window as unknown as Record<string, unknown>).__drawer = d.component;
      const items = d.querySelectorAll("m-drawer-item");
      items[1].textContent = "Outbox";
      items[0].setAttribute("badge", "25");
      items[4].remove();
      const added = document.createElement("m-drawer-item") as HTMLElement & { value: string };
      added.value = "work";
      added.textContent = "Work";
      d.append(added);
    });
    await settle();
    const updated = await page.evaluate(() => {
      const d = document.getElementById("dr") as Drawer;
      const items = [...(d.shadowRoot?.querySelectorAll("[data-id]") ?? [])] as HTMLElement[];
      return {
        same: d.component === (window as unknown as Record<string, unknown>).__drawer,
        labels: items.map((item) => item.textContent),
        value: d.value,
        focused: (d.shadowRoot?.activeElement as HTMLElement | null)?.dataset.id,
      };
    });
    assert.deepEqual(updated, { same: true, labels: ["Inbox25", "Outbox", "Work"], value: "sent", focused: "sent" });
    check("drawer: children added, removed and relabelled update in place, keeping selection and focus");

    const open = await page.evaluate(() => {
      const d = document.getElementById("dr") as Drawer & { component: { isOpen: () => boolean } };
      const root = d.shadowRoot?.firstElementChild as HTMLElement;
      d.removeAttribute("open");
      const closed = { open: d.component.isOpen(), inert: root.hasAttribute("inert") };
      d.setAttribute("open", "");
      d.setAttribute("headline", "Post");
      return { closed, open: d.component.isOpen(), inert: root.hasAttribute("inert"), same: d.component === (window as unknown as Record<string, unknown>).__drawer };
    });
    assert.deepEqual(open, { closed: { open: false, inert: true }, open: true, inert: false, same: true });
    assert.equal(await page.getByRole("navigation", { name: "Post" }).count(), 1);
    check("drawer: open and headline apply in place");

    const parity = await page.evaluate(async (icon) => {
      const w = window as unknown as Win & { mtrl: { createDrawer: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createDrawer({
        open: true, headline: "Mail",
        items: [{ id: "inbox", label: "Inbox", icon, active: true }, { id: "sent", label: "Sent", icon }],
      });
      document.getElementById("factory")?.append(factory.element);
      const host = document.createElement("m-drawer");
      host.setAttribute("open", "");
      host.setAttribute("headline", "Mail");
      host.setAttribute("value", "inbox");
      host.innerHTML = `<m-drawer-item value="inbox">Inbox</m-drawer-item><m-drawer-item value="sent">Sent</m-drawer-item>`;
      host.querySelectorAll("m-drawer-item").forEach((item) => item.setAttribute("icon", icon));
      document.getElementById("factory")?.append(host);
      await new Promise((r) => setTimeout(r, 700)); // the width spring
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const sheet = root.querySelector('[class*="drawer__sheet"]') as HTMLElement;
        const item = root.querySelector('[class*="drawer__item"]') as HTMLElement;
        const indicator = root.querySelector('[class*="drawer__active-indicator"]') as HTMLElement;
        const headline = root.querySelector('[class*="drawer__headline"]') as HTMLElement;
        const r = root.getBoundingClientRect();
        const i = item.getBoundingClientRect();
        return {
          width: r.width, itemW: i.width, itemH: i.height,
          bg: getComputedStyle(sheet).backgroundColor,
          indicator: getComputedStyle(indicator).backgroundColor,
          itemColor: getComputedStyle(item).color,
          headline: getComputedStyle(headline).font,
        };
      };
      return { factory: measure(factory.element), element: measure(host.shadowRoot?.firstElementChild as HTMLElement) };
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("drawer: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- top app bar
  await fresh(
    page,
    `<div class="stage" id="tstage"><m-top-app-bar id="tb" headline="Fallback" aria-label="Mail bar">
       <m-icon-button slot="leading" aria-label="Menu" icon='${ICON}'></m-icon-button>
       Inbox
       <m-icon-button slot="trailing" aria-label="Search" icon='${ICON}'></m-icon-button>
       <m-icon-button slot="trailing" aria-label="More" icon='${ICON}'></m-icon-button>
     </m-top-app-bar></div>
     <div class="stage" id="scroller"><div class="stage"></div><div class="stage"></div></div>
     <div class="stage" id="fstage"></div>`
  );
  {
    type Bar = HTMLElement & { component: unknown; setScrollState: (scrolled: boolean) => unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const banner = page.getByRole("banner", { name: "Mail bar" });
    assert.equal(await banner.count(), 1);
    assert.equal(await page.getByRole("heading", { level: 1, name: "Inbox" }).count(), 1);
    const regions = await page.evaluate(() => {
      const bar = document.getElementById("tb") as Bar;
      const region = (label: string): string | undefined =>
        bar.querySelector(`[aria-label="${label}"]`)?.assignedSlot?.parentElement?.className;
      const fallback = bar.shadowRoot?.querySelector("h1 span") as HTMLElement;
      return { menu: region("Menu"), search: region("Search"), more: region("More"), fallbackHidden: fallback.hidden };
    });
    assert.match(regions.menu ?? "", /top-app-bar__leading/);
    assert.match(regions.search ?? "", /top-app-bar__trailing/);
    assert.match(regions.more ?? "", /top-app-bar__trailing/);
    assert.equal(regions.fallbackHidden, true);
    check("top app bar: a banner; leading, headline and trailing content in their regions");

    await page.evaluate(() => {
      const bar = document.getElementById("tb") as Bar;
      for (const node of [...bar.childNodes]) if (node.nodeType === Node.TEXT_NODE) node.remove();
    });
    await settle();
    assert.equal(await page.getByRole("heading", { level: 1, name: "Fallback" }).count(), 1);
    await page.evaluate(() => document.getElementById("tb")?.setAttribute("headline", "Updated"));
    assert.equal(await page.getByRole("heading", { level: 1, name: "Updated" }).count(), 1);
    check("top app bar: headline is the text while there is no headline content, and updates in place");

    const type = await page.evaluate(() => {
      const bar = document.getElementById("tb") as Bar;
      const before = bar.component;
      bar.setAttribute("type", "large");
      const root = bar.shadowRoot?.firstElementChild as HTMLElement;
      const rows = root.querySelectorAll('[class*="top-app-bar__row"]').length;
      const menu = bar.querySelector('[aria-label="Menu"]')?.assignedSlot?.parentElement?.className;
      return { same: bar.component === before, large: root.className.includes("top-app-bar--large"), rows, menu, height: root.getBoundingClientRect().height };
    });
    assert.equal(type.same, true);
    assert.equal(type.large, true);
    assert.equal(type.rows, 2);
    assert.match(type.menu ?? "", /top-app-bar__leading/);
    check("top app bar: type changes in place and keeps the slotted content");

    const scrolled = await page.evaluate(async () => {
      const bar = document.getElementById("tb") as Bar;
      bar.setAttribute("type", "small");
      bar.setAttribute("scroll-target", "scroller");
      const root = (): HTMLElement => bar.shadowRoot?.firstElementChild as HTMLElement;
      const is = (): boolean => root().className.includes("top-app-bar--scrolled");
      const before = is();
      const scroller = document.getElementById("scroller") as HTMLElement;
      // The bar follows the `scroll` event, which the browser sends in its next
      // rendering step, not at the assignment: 5s at most for it, then the reading
      // is asserted below.
      const until = async (ready: () => boolean): Promise<void> => {
        for (let i = 0; i < 250 && !ready(); i++) await new Promise((r) => setTimeout(r, 20));
      };
      scroller.scrollTop = 100;
      await until(() => is());
      const down = is();
      scroller.scrollTop = 0;
      await until(() => !is());
      const up = is();
      bar.setScrollState(true);
      return { before, down, up, manual: is() };
    });
    assert.deepEqual(scrolled, { before: false, down: true, up: false, manual: true });
    check("top app bar: scroll-target follows an element's scroll; setScrollState() drives it by script");

    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createTopAppBar: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createTopAppBar({ title: "Inbox", scrollable: false });
      document.getElementById("fstage")?.append(factory.element);
      const bar = document.getElementById("tb") as Bar;
      bar.remove();
      const host = document.createElement("m-top-app-bar");
      host.setAttribute("no-scroll", "");
      host.textContent = "Inbox";
      document.getElementById("tstage")?.append(host);
      const measure = (root: HTMLElement): Record<string, string | number> => {
        const headline = root.querySelector("h1") as HTMLElement;
        const r = root.getBoundingClientRect();
        const h = headline.getBoundingClientRect();
        return {
          width: r.width, height: r.height, headlineH: h.height,
          bg: getComputedStyle(root).backgroundColor,
          color: getComputedStyle(headline).color, font: getComputedStyle(headline).font,
        };
      };
      return { factory: measure(factory.element), element: measure(host.shadowRoot?.firstElementChild as HTMLElement) };
    });
    assert.deepEqual(parity.element, parity.factory);
    check("top app bar: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- bottom app bar
  await fresh(
    page,
    `<div class="stage"><m-bottom-app-bar id="bb" aria-label="Actions">
       <m-icon-button aria-label="Archive" icon='${ICON}'></m-icon-button>
       <m-icon-button aria-label="Delete" icon='${ICON}'></m-icon-button>
       <m-fab slot="fab" aria-label="Compose" icon='${ICON}'></m-fab>
     </m-bottom-app-bar></div><div class="stage" id="fstage"></div>`
  );
  {
    type Bar = HTMLElement & { component: unknown; hide: () => unknown; show: () => unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const toolbar = page.getByRole("toolbar", { name: "Actions" });
    assert.equal(await toolbar.count(), 1);
    const regions = await page.evaluate(() => {
      const bar = document.getElementById("bb") as Bar;
      const region = (label: string): string | undefined =>
        bar.querySelector(`[aria-label="${label}"]`)?.assignedSlot?.parentElement?.className;
      const root = bar.shadowRoot?.firstElementChild as HTMLElement;
      return { archive: region("Archive"), del: region("Delete"), fab: region("Compose"), withFab: root.className.includes("--with-fab") };
    });
    assert.match(regions.archive ?? "", /bottom-app-bar__actions/);
    assert.match(regions.del ?? "", /bottom-app-bar__actions/);
    assert.match(regions.fab ?? "", /bottom-app-bar__fab-container/);
    assert.equal(regions.withFab, true);
    check("bottom app bar: a toolbar; actions and the FAB in their regions");

    await page.evaluate(() => document.querySelector("#bb m-fab")?.remove());
    await settle();
    const without = await page.evaluate(() => {
      const bar = document.getElementById("bb") as Bar;
      return (bar.shadowRoot?.firstElementChild as HTMLElement).className.includes("--with-fab");
    });
    assert.equal(without, false);
    check("bottom app bar: the bar follows whether a FAB is slotted");

    const methods = await page.evaluate(() => {
      const bar = document.getElementById("bb") as Bar;
      const root = (): HTMLElement => bar.shadowRoot?.firstElementChild as HTMLElement;
      bar.hide();
      const hidden = root().className.includes("--hidden");
      bar.show();
      const shown = !root().className.includes("--hidden");
      const before = bar.component;
      bar.setAttribute("fab-position", "center");
      return { hidden, shown, recreated: bar.component !== before, center: root().className.includes("--fab-center") };
    });
    assert.deepEqual(methods, { hidden: true, shown: true, recreated: true, center: true });
    check("bottom app bar: hide() and show(); fab-position recreates the bar");

    const parity = await page.evaluate((icon) => {
      const w = window as unknown as Win & {
        mtrl: {
          createBottomAppBar: (c: object) => { element: HTMLElement; addAction: (e: HTMLElement) => unknown; addFab: (e: HTMLElement) => unknown };
          createIconButton: (c: object) => { element: HTMLElement };
          createFab: (c: object) => { element: HTMLElement };
        };
      };
      const factory = w.mtrl.createBottomAppBar({});
      factory.addAction(w.mtrl.createIconButton({ icon, ariaLabel: "Archive" }).element);
      factory.addFab(w.mtrl.createFab({ icon, ariaLabel: "Compose" }).element);
      document.getElementById("fstage")?.append(factory.element);
      const bar = document.getElementById("bb") as Bar;
      bar.removeAttribute("fab-position");
      const fab = document.createElement("m-fab");
      fab.slot = "fab";
      fab.setAttribute("icon", icon);
      fab.setAttribute("aria-label", "Compose");
      bar.append(fab);
      return new Promise<{ factory: Record<string, string | number>; element: Record<string, string | number> }>((resolve) =>
        requestAnimationFrame(() => {
          const measure = (root: HTMLElement): Record<string, string | number> => {
            const r = root.getBoundingClientRect();
            const style = getComputedStyle(root);
            return { width: r.width, height: r.height, bg: style.backgroundColor, radius: style.borderTopLeftRadius, shadow: style.boxShadow };
          };
          resolve({ factory: measure(factory.element), element: measure(bar.shadowRoot?.firstElementChild as HTMLElement) });
        })
      );
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("bottom app bar: renders as the factory does with the global stylesheet");
  }

  // ---------------------------------------------------------------- toolbar (FLO-304)
  await fresh(
    page,
    `<div class="stage"><button id="before">Before</button>
     <m-toolbar id="tb" variant="floating" color="vibrant" aria-label="Formatting">
       <m-icon-button aria-label="Bold" icon='${ICON}' toggle selected></m-icon-button>
       <m-icon-button aria-label="Italic" icon='${ICON}'></m-icon-button>
       <m-icon-button aria-label="Strike" icon='${ICON}' disabled></m-icon-button>
       <m-icon-button aria-label="Underline" icon='${ICON}'></m-icon-button>
       <m-fab slot="fab" aria-label="Compose" icon='${ICON}'></m-fab>
       <m-menu slot="overflow"><m-menu-item value="a">Align</m-menu-item></m-menu>
     </m-toolbar><button id="after">After</button></div><div class="stage" id="fstage"></div>`
  );
  {
    type Tb = HTMLElement & { component: { overflowButton: HTMLElement | null } | null; hide: () => unknown; show: () => unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    assert.equal(await page.getByRole("toolbar", { name: "Formatting" }).count(), 1);
    // Where focus is: an item's host, the FAB's, or the overflow button inside the toolbar.
    const focused = (): Promise<string | null> =>
      page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active?.id === "tb") return `overflow:${active.shadowRoot?.activeElement?.getAttribute("aria-label")}`;
        return active?.getAttribute("aria-label") ?? active?.id ?? null;
      });
    await settle();

    await page.focus("#before");
    await page.keyboard.press("Tab");
    assert.equal(await focused(), "Bold");
    await page.keyboard.press("ArrowRight");
    assert.equal(await focused(), "Italic");
    await page.keyboard.press("ArrowRight");
    assert.equal(await focused(), "Underline", "the disabled item is skipped");
    await page.keyboard.press("End");
    assert.equal(await focused(), "overflow:More options");
    await page.keyboard.press("Home");
    assert.equal(await focused(), "Bold");
    await page.keyboard.press("ArrowRight");
    check("toolbar: one tab stop over <m-icon-button> hosts; arrows, Home and End; disabled skipped");

    await page.keyboard.press("Tab");
    assert.equal(await focused(), "Compose", "Tab leaves the toolbar for the FAB");
    await page.keyboard.press("Tab");
    assert.equal(await focused(), "after");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    assert.equal(await focused(), "Italic", "Shift+Tab comes back to the item focused last");
    await page.focus("#tb m-fab");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await focused(), "Compose", "the FAB is outside the toolbar's arrows");
    check("toolbar: the FAB is its own tab stop; the toolbar keeps the one focused last");

    const overflow = await page.evaluate(async () => {
      const tb = document.getElementById("tb") as Tb;
      const menu = tb.querySelector("m-menu") as HTMLElement & { anchor: unknown };
      const button = tb.component?.overflowButton ?? null;
      const anchored = !!button && menu.anchor === button;
      button?.click();
      await new Promise((r) => setTimeout(r, 100));
      // The menu marks its anchor itself ("true", which ARIA reads as "menu")
      const popup = button?.getAttribute("aria-haspopup");
      return { anchored, popup: popup === "true" || popup === "menu", open: menu.hasAttribute("open") };
    });
    assert.deepEqual(overflow, { anchored: true, popup: true, open: true });
    // The menu handles keys once it has taken focus, about 120ms after it opens,
    // later than the 100ms above. Escape used to be sent regardless, with nothing
    // asserted, and a menu left open reached the checks that follow.
    // (Focus is read in the menu's shadow root: its host does not match :focus-within
    // while the surface is in the top layer.)
    const overflowMenu = (): Promise<{ focused: boolean; open: boolean }> => page.evaluate(() => {
      const menu = (document.getElementById("tb") as HTMLElement).querySelector("m-menu") as HTMLElement;
      return { focused: !!menu.shadowRoot?.activeElement?.closest('[role="menu"]'), open: menu.hasAttribute("open") };
    });
    for (const end = Date.now() + 5000; Date.now() < end && !(await overflowMenu()).focused;) await settle();
    assert.equal((await overflowMenu()).focused, true, "toolbar: the open overflow menu takes focus");
    await page.keyboard.press("Escape");
    for (const end = Date.now() + 5000; Date.now() < end && (await overflowMenu()).open;) await settle();
    assert.equal((await overflowMenu()).open, false, "toolbar: Escape closes the overflow menu");
    check("toolbar: slot=overflow's <m-menu> is anchored to the overflow button, opens from it and closes on Escape");

    const colours = await page.evaluate(() => {
      const tb = document.getElementById("tb") as Tb;
      const inner = (label: string): HTMLElement =>
        (tb.querySelector(`[aria-label="${label}"]`) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
      const bar = tb.shadowRoot?.querySelector(".mtrl-toolbar__bar") as HTMLElement;
      const role = (name: string): string => {
        const probe = document.createElement("div");
        probe.style.color = `var(--mtrl-sys-color-${name})`;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      return {
        container: getComputedStyle(bar).backgroundColor === role("primary-container"),
        standard: getComputedStyle(inner("Italic")).color === role("on-primary-container"),
        selected: getComputedStyle(inner("Bold")).color === role("on-surface"),
        selectedContainer: getComputedStyle(inner("Bold")).backgroundColor === role("surface-container"),
      };
    });
    assert.deepEqual(colours, { container: true, standard: true, selected: true, selectedContainer: true });
    check("toolbar: vibrant colours reach the <m-icon-button> shadow roots");

    const visibility = await page.evaluate(async () => {
      const tb = document.getElementById("tb") as Tb;
      const seen: string[] = [];
      tb.addEventListener("hide", () => seen.push("hide"));
      tb.addEventListener("show", () => seen.push("show"));
      tb.hide();
      const root = tb.shadowRoot?.firstElementChild as HTMLElement;
      const inert = root.hasAttribute("inert");
      tb.show();
      tb.setAttribute("flat", "");
      const flat = !root.className.includes("--elevated");
      tb.removeAttribute("flat");
      return { seen, inert, flat, elevated: root.className.includes("--elevated") };
    });
    assert.deepEqual(visibility, { seen: ["hide", "show"], inert: true, flat: true, elevated: true });
    check("toolbar: hide() and show() dispatch hide and show; flat removes the elevation in place");

    const parity = await page.evaluate((icon) => {
      const w = window as unknown as Win & {
        mtrl: {
          createToolbar: (c: object) => { element: HTMLElement; bar: HTMLElement };
          createFab: (c: object) => { element: HTMLElement };
        };
      };
      const factory = w.mtrl.createToolbar({
        variant: "floating",
        color: "vibrant",
        items: ["Bold", "Italic", "Strike", "Underline"].map((ariaLabel) => ({ icon, ariaLabel })),
        fab: w.mtrl.createFab({ icon, ariaLabel: "Compose" }),
        overflow: () => null,
      });
      document.getElementById("fstage")?.append(factory.element);
      const tb = document.getElementById("tb") as Tb;
      return new Promise<{ factory: Record<string, string | number>; element: Record<string, string | number> }>((resolve) =>
        requestAnimationFrame(() => {
          const measure = (root: HTMLElement): Record<string, string | number> => {
            const bar = root.querySelector(".mtrl-toolbar__bar") as HTMLElement;
            const r = root.getBoundingClientRect();
            const b = bar.getBoundingClientRect();
            const style = getComputedStyle(bar);
            return { width: r.width, height: r.height, barWidth: b.width, bg: style.backgroundColor, radius: style.borderTopLeftRadius, shadow: style.boxShadow, padding: style.padding, gap: style.gap };
          };
          resolve({ factory: measure(factory.element), element: measure(tb.shadowRoot?.firstElementChild as HTMLElement) });
        })
      );
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("toolbar: renders as the factory does with the global stylesheet");
  }

  // FLO-387: the rows the roving rule must get right. Read in the same turn as
  // connect, before the browser's own slotchange microtask.
  {
    const roving = await page.evaluate((icon) => {
      const host = document.getElementById("host")!;
      host.replaceChildren();
      const tb = document.createElement("m-toolbar") as HTMLElement & {
        component: { overflowButton: HTMLElement | null } | null;
      };
      tb.id = "roving";
      tb.setAttribute("aria-label", "Roving");
      tb.innerHTML =
        `<m-menu id="overflow" slot="overflow"><m-menu-item value="a">Align</m-menu-item></m-menu>` +
        `<m-icon-button id="disabled" aria-label="First" icon='${icon}' disabled></m-icon-button>` +
        `<div id="wrap"><button id="inner" type="button">Inner</button></div>` +
        `<span id="plain">Note</span>`;
      host.append(tb);
      const attr = (id: string): string | null => document.getElementById(id)?.getAttribute("tabindex") ?? null;
      const seen = [tb, ...Array.from(tb.querySelectorAll("*")), ...Array.from(tb.shadowRoot?.querySelectorAll("*") ?? [])];
      return {
        menu: attr("overflow"),
        disabled: attr("disabled"),
        wrap: attr("wrap"),
        inner: attr("inner"),
        plain: attr("plain"),
        overflowButton: tb.component?.overflowButton?.getAttribute("tabindex") ?? null,
        zeros: seen.filter((node) => node.getAttribute("tabindex") === "0").map((node) => node.id || node.localName),
      };
    }, ICON);
    assert.equal(roving.menu, null, "the overflow menu carries no tabindex the toolbar wrote");
    assert.equal(roving.wrap, null, "the wrapper carries no tabindex the toolbar wrote");
    assert.equal(roving.plain, null, "the span carries no tabindex the toolbar wrote");
    assert.equal(roving.disabled, "-1", "the disabled item is -1");
    assert.equal(roving.inner, "0", "the first enabled control is the tab stop");
    assert.equal(roving.overflowButton, "-1", "the overflow button is a target and not the tab stop");
    assert.deepEqual(roving.zeros, ["inner"], "exactly one tab stop");
    check("toolbar: one tab stop on the first enabled control; overflow, wrapper and text are not targets");
  }

  // ---------------------------------------------------------------- list
  await fresh(
    page,
    `<m-list id="l" aria-label="Fruits" value="b">
       <m-list-item value="a" supporting-text="Red" leading-icon='${ICON}'>Apple</m-list-item>
       <m-list-item value="b" overline="Yellow">Banana</m-list-item>
       <m-list-item value="c" trailing-text="100+" disabled>Cherry</m-list-item>
     </m-list>
     <m-list id="m" selection="multiple" aria-label="Multi">
       <m-list-item value="x" selected>Ex</m-list-item><m-list-item value="y">Why</m-list-item><m-list-item value="z" selected>Zed</m-list-item>
     </m-list>
     <m-list id="n" selection="none" aria-label="Plain">
       <m-list-item>One</m-list-item><m-list-item kind="divider"></m-list-item>
       <m-list-item kind="subheader">Section</m-list-item><m-list-item>Two</m-list-item>
     </m-list>
     <section id="factory"></section>`
  );
  {
    type List = HTMLElement & { value: string | null; values: string[]; component: unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const fruits = page.getByRole("list", { name: "Fruits" });
    assert.equal(await fruits.count(), 1);
    assert.equal(await fruits.getByRole("listitem").count(), 3);
    assert.equal(await fruits.getByRole("button", { name: "Banana", pressed: true }).count(), 1);
    assert.equal(await fruits.getByRole("button", { name: "Apple", pressed: false }).count(), 1);
    assert.equal(await fruits.getByRole("button", { name: "Cherry" }).isDisabled(), true);
    const anatomy = await page.evaluate(() => {
      const root = (document.getElementById("l") as HTMLElement).shadowRoot as ShadowRoot;
      const text = (selector: string): string | undefined => root.querySelector(selector)?.textContent ?? undefined;
      return {
        supporting: text('[class*="list__supporting"]'),
        overline: text('[class*="list__overline"]'),
        trailing: text('[class*="list__trailing--text"]'),
        icon: !!root.querySelector('[class*="list__leading--icon"] svg'),
      };
    });
    assert.deepEqual(anatomy, { supporting: "Red", overline: "Yellow", trailing: "100+", icon: true });
    check("list: a list named by aria-label; children declare rows with their anatomy, value selects one");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      for (const type of ["activate", "change"]) {
        document.getElementById("l")?.addEventListener(type, (e) => {
          (w.events as unknown[]).push({ type, detail: (e as CustomEvent).detail, target: (e.target as Element).id });
        });
      }
    });
    await fruits.getByRole("button", { name: "Apple" }).click();
    let state = await page.evaluate(() => {
      const l = document.getElementById("l") as List;
      return { events: (window as unknown as Win).events, value: l.value, values: l.values, attribute: l.getAttribute("value") };
    });
    assert.deepEqual(state, {
      events: [
        { type: "activate", detail: { value: "a" }, target: "l" },
        { type: "change", detail: { value: "a", values: ["a"] }, target: "l" },
      ],
      value: "a", values: ["a"], attribute: "b",
    });
    check("list: a click dispatches activate, then change with the moved selection; the attribute stays");

    await page.keyboard.press("ArrowDown");
    const focused = await page.evaluate(() => (document.getElementById("l")?.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute("aria-labelledby"));
    assert.ok(focused);
    await page.evaluate(() => ((window as unknown as Win).events = []));
    await page.keyboard.press("Space");
    state = await page.evaluate(() => {
      const l = document.getElementById("l") as List;
      return { events: (window as unknown as Win).events, value: l.value, values: l.values, attribute: l.getAttribute("value") };
    });
    assert.deepEqual((state.events as unknown[]).at(-1), { type: "change", detail: { value: "b", values: ["b"] }, target: "l" });
    assert.equal(await fruits.getByRole("button", { name: "Banana", pressed: true }).count(), 1);
    check("list: an arrow key moves focus to the next row and Space selects it");

    await page.evaluate(() => ((window as unknown as Win).events = []));
    await fruits.getByRole("button", { name: "Cherry" }).click({ force: true });
    assert.deepEqual(await page.evaluate(() => [(window as unknown as Win).events, (document.getElementById("l") as List).value]), [[], "b"]);
    check("list: a disabled row dispatches nothing");

    const silent = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const l = document.getElementById("l") as List;
      l.value = "a";
      const single = l.values;
      l.values = ["b", "a"];
      const first = l.value;
      l.value = null;
      return { events: w.events, single, first, cleared: [l.value, l.values] };
    });
    assert.deepEqual(silent, { events: [], single: ["a"], first: "b", cleared: [null, []] });
    check("list: setting value or values fires no event; a single list keeps the first value");

    const disabled = await page.evaluate(async () => {
      const l = document.getElementById("l") as List;
      const before = l.component;
      const read = (): boolean[] => [...(l.shadowRoot?.querySelectorAll("button") ?? [])].map((b) => b.disabled);
      l.setAttribute("disabled", "");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const on = read();
      l.removeAttribute("disabled");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return { on, off: read(), same: l.component === before };
    });
    assert.deepEqual(disabled, { on: [true, true, true], off: [false, false, true], same: true });
    check("list: disabled disables every row in place, and its removal keeps the rows' own");

    const multi = page.getByRole("list", { name: "Multi" });
    assert.deepEqual(await page.evaluate(() => (document.getElementById("m") as List).values), ["x", "z"]);
    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("m")?.addEventListener("change", (e) => (w.events as unknown[]).push((e as CustomEvent).detail));
    });
    await multi.getByRole("button", { name: "Why" }).click();
    await multi.getByRole("button", { name: "Ex" }).click();
    const picked = await page.evaluate(() => ({ events: (window as unknown as Win).events, value: (document.getElementById("m") as List).value }));
    assert.deepEqual(picked, {
      events: [{ value: "x", values: ["x", "y", "z"] }, { value: "y", values: ["y", "z"] }],
      value: "y",
    });
    check("list: selection=multiple toggles rows; items' selected are the default, values come in row order");

    const plain = page.getByRole("list", { name: "Plain" });
    assert.equal(await plain.getByRole("button").count(), 0);
    assert.equal(await plain.getByRole("separator").count(), 1);
    assert.equal(await plain.getByRole("listitem").count(), 2);
    assert.equal(await plain.getByText("Section", { exact: true }).count(), 1);
    check("list: selection=none renders rows that are not interactive, with a divider and a subheader");

    const updated = await page.evaluate(async () => {
      const l = document.getElementById("l") as List;
      l.value = "b";
      const before = l.component;
      const item = document.createElement("m-list-item") as HTMLElement & { value: string; supportingText: string };
      item.value = "d";
      item.supportingText = "Brown";
      item.textContent = "Date";
      l.append(item);
      l.querySelector('[value="a"]')?.remove();
      const banana = l.querySelector('[value="b"]') as HTMLElement;
      banana.textContent = "Blueberry";
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const buttons = [...(l.shadowRoot?.querySelectorAll('[role="listitem"]') ?? [])].map((row) => row.querySelector('[class*="list__headline"]')?.textContent);
      return { same: l.component === before, buttons, value: l.value, supporting: item.getAttribute("supporting-text") };
    });
    assert.deepEqual(updated, { same: true, buttons: ["Blueberry", "Cherry", "Date"], value: "b", supporting: "Brown" });
    assert.equal(await fruits.getByRole("button", { name: "Blueberry", pressed: true }).count(), 1);
    check("list: items added, removed and changed update in place and keep the selection");

    const removed = await page.evaluate(async () => {
      const l = document.getElementById("l") as List;
      l.querySelector('[value="b"]')?.remove();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return l.value;
    });
    assert.equal(removed, null);
    check("list: removing the selected item clears it from the selection");

    await settle();
    const renamed = await page.evaluate(() => {
      const l = document.getElementById("l") as List;
      const before = l.component;
      l.setAttribute("aria-label", "Produce");
      return l.component === before;
    });
    assert.equal(renamed, true);
    assert.equal(await page.getByRole("list", { name: "Produce" }).count(), 1);
    check("list: aria-label updates in place");

    // Same look as the factory in light DOM with the full stylesheet.
    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createList: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createList({
        ariaLabel: "Factory",
        items: [{ id: "x", headline: "Ex" }, { id: "y", headline: "Why", supportingText: "Two" }, { id: "z", headline: "Zed" }],
        multiSelect: true,
        initialSelection: ["x", "z"],
      });
      document.getElementById("factory")?.append(factory.element);
      const element = (document.getElementById("m") as HTMLElement & { values: string[] });
      element.values = ["x", "z"];
      element.querySelector('[value="y"]')?.setAttribute("supporting-text", "Two");
      return new Promise<{ factory: string[][]; element: string[][] }>((resolve) =>
        requestAnimationFrame(() => {
          const look = (root: ParentNode): string[][] =>
            [...root.querySelectorAll('[role="listitem"]')].map((row) => {
              const style = getComputedStyle(row);
              const headline = getComputedStyle(row.querySelector('[class*="list__headline"]') as HTMLElement);
              return [String(row.getBoundingClientRect().height), style.backgroundColor, style.paddingLeft, headline.color, headline.fontSize, headline.lineHeight];
            });
          resolve({ factory: look(factory.element), element: look(element.shadowRoot as ShadowRoot) });
        })
      );
    });
    assert.equal(parity.element.length, 3);
    assert.deepEqual(parity.element, parity.factory);
    check("list: rows match the factory's size and colours, selected and not");
  }

  // ---------------------------------------------------------------- list defaults
  {
    type List = HTMLElement & { value: string | null; values: string[]; component: unknown };
    const markup = `<m-list id="x" aria-label="Dirty"><m-list-item value="a">Alpha</m-list-item>
      <m-list-item value="b">Beta</m-list-item><m-list-item value="c">Gamma</m-list-item></m-list>`;
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const live = (): Promise<string | null> => page.evaluate(() => (document.getElementById("x") as List).value);
    const attribute = (value: string): Promise<string | null> =>
      page.evaluate((v) => {
        const x = document.getElementById("x") as List;
        x.setAttribute("value", v);
        return x.value;
      }, value);
    const selectItem = async (value: string): Promise<string | null> => {
      await page.evaluate((v) => {
        const x = document.getElementById("x") as HTMLElement;
        for (const item of x.querySelectorAll("m-list-item")) item.toggleAttribute("selected", item.getAttribute("value") === v);
      }, value);
      await settle();
      return live();
    };

    await fresh(page, markup);
    assert.equal(await attribute("b"), "b");
    assert.equal(await selectItem("c"), "b", "the value attribute wins over an item's selected in a single list");
    await page.evaluate(() => document.getElementById("x")?.removeAttribute("value"));
    await settle();
    assert.equal(await selectItem("a"), "a", "a clean list follows its items' selected");
    check("list: before any interaction, the value attribute and the items' selected move the selection");

    await page.getByRole("list", { name: "Dirty" }).getByRole("button", { name: "Gamma" }).click();
    assert.equal(await live(), "c");
    assert.equal(await attribute("b"), "c");
    assert.equal(await selectItem("b"), "c");
    check("list: after a user interaction, neither the value attribute nor an item's selected moves it");

    await fresh(page, markup);
    await page.evaluate(() => ((document.getElementById("x") as List).values = ["b"]));
    assert.equal(await attribute("c"), "b");
    assert.equal(await selectItem("a"), "b");
    check("list: after a values set, the defaults do not move it");

    const recreated = await page.evaluate(async () => {
      const x = document.getElementById("x") as List;
      const before = x.component;
      x.setAttribute("selection", "multiple");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return { rebuilt: x.component !== before, values: x.values };
    });
    assert.deepEqual(recreated, { rebuilt: true, values: ["b"] });
    check("list: selection recreates the list and keeps a dirty selection");
  }

  // ---------------------------------------------------------------- card
  await fresh(
    page,
    `<section id="a"><m-card id="c" variant="outlined" headline="Fallback">
       <span slot="headline">Trip to Lisbon</span><span slot="subhead">Three days</span>
       <p>Walks and trams.</p><button slot="actions">Book</button>
     </m-card>
     <m-card id="k" clickable headline="Open me">Body</m-card></section>
     <section id="factory"></section>`
  );
  {
    type Card = HTMLElement & { component: unknown };
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const regions = (id: string): Promise<Record<string, string | number>> =>
      page.evaluate((cardId) => {
        const root = (document.getElementById(cardId) as HTMLElement).shadowRoot as ShadowRoot;
        const card = root.firstElementChild as HTMLElement;
        const assigned = (name: string): number =>
          (root.querySelector(name ? `slot[name="${name}"]` : "slot:not([name])") as HTMLSlotElement | null)?.assignedElements().length ?? -1;
        return {
          regions: [...card.children].map((child) => child.className.replace(/^.*card__(\w[\w-]*).*$/, "$1")).join(" "),
          headline: assigned("headline"), subhead: assigned("subhead"), content: assigned(""), actions: assigned("actions"),
          outlined: card.className.includes("card--outlined") ? 1 : 0,
        };
      }, id);
    assert.deepEqual(await regions("c"), { regions: "header content actions", headline: 1, subhead: 1, content: 1, actions: 1, outlined: 1 });
    assert.equal(await page.getByRole("article", { name: "Trip to Lisbon" }).count(), 1);
    assert.equal(await page.locator("#c").getByRole("group").count(), 1, "the actions row is a group");
    assert.equal(await page.getByRole("button", { name: "Book" }).count(), 1);
    check("card: children fill the header, content and actions slots; the headline names the card");

    const clickable = page.getByRole("button", { name: "Open me" });
    assert.equal(await clickable.count(), 1);
    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("k")?.addEventListener("click", (e) => (w.events as unknown[]).push((e.target as Element).id));
    });
    await clickable.click();
    await clickable.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    assert.deepEqual(await page.evaluate(() => (window as unknown as Win).events), ["k", "k", "k"]);
    check("card: clickable is a button named by its headline; a click, Enter and Space each click the host once");

    const disabled = await page.evaluate(() => {
      const k = document.getElementById("k") as Card;
      k.setAttribute("disabled", "");
      const card = k.shadowRoot?.firstElementChild as HTMLElement;
      return { aria: card.getAttribute("aria-disabled"), tabindex: card.getAttribute("tabindex"), opacity: getComputedStyle(card).opacity };
    });
    assert.deepEqual(disabled, { aria: "true", tabindex: null, opacity: "0.38" });
    await page.evaluate(() => ((window as unknown as Win).events = []));
    await page.locator("#k").click({ force: true });
    assert.deepEqual(await page.evaluate(() => (window as unknown as Win).events), []);
    await page.evaluate(() => document.getElementById("k")?.removeAttribute("disabled"));
    assert.equal(await page.evaluate(() => document.getElementById("k")?.shadowRoot?.firstElementChild?.getAttribute("tabindex")), "0");
    check("card: disabled dims the card, takes it out of the tab order and stops clicks");

    const changed = await page.evaluate(async () => {
      const c = document.getElementById("c") as Card;
      const before = c.component;
      (c.querySelector('[slot="headline"]') as HTMLElement).textContent = "Trip to Porto";
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return c.component === before;
    });
    assert.equal(changed, true);
    assert.equal(await page.getByRole("article", { name: "Trip to Porto" }).count(), 1);
    check("card: a change inside a region is the slot's, with no recreation");

    const regrown = await page.evaluate(async () => {
      const c = document.getElementById("c") as Card;
      const before = c.component;
      c.querySelector('[slot="actions"]')?.remove();
      const media = document.createElement("div");
      media.slot = "media";
      media.textContent = "Photo";
      c.prepend(media);
      const avatar = document.createElement("span");
      avatar.slot = "avatar";
      avatar.textContent = "AL";
      c.append(avatar);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return c.component !== before;
    });
    assert.equal(regrown, true);
    assert.deepEqual(await regions("c"), { regions: "media header content", headline: 1, subhead: 1, content: 1, actions: -1, outlined: 1 });
    assert.equal(await page.evaluate(() => !!document.getElementById("c")?.shadowRoot?.querySelector('[class*="card__header-avatar"] slot[name="avatar"]')), true);
    check("card: a region added or emptied recreates the card with the regions it now has");

    await page.evaluate(() => document.getElementById("c")?.setAttribute("aria-label", "Holiday"));
    assert.equal(await page.getByRole("article", { name: "Holiday" }).count(), 1);
    await page.evaluate(() => document.getElementById("c")?.removeAttribute("aria-label"));
    assert.equal(await page.getByRole("article", { name: "Trip to Porto" }).count(), 1);
    check("card: aria-label replaces the headline's name in place, and its removal gives it back");

    await page.evaluate(() => document.getElementById("k")?.setAttribute("headline", "Open this"));
    await settle();
    assert.equal(await page.getByRole("button", { name: "Open this" }).count(), 1);
    check("card: the headline attribute is the slot's fallback text");

    // Same look as the factory in light DOM with the full stylesheet.
    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createCard: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createCard({ variant: "outlined", header: { title: "Trip to Porto", subtitle: "Three days" }, content: { text: "Walks and trams." } });
      document.getElementById("factory")?.append(factory.element);
      const element = document.getElementById("c") as HTMLElement;
      element.querySelector('[slot="media"]')?.remove();
      element.querySelector('[slot="avatar"]')?.remove();
      return new Promise<{ factory: string[]; element: string[] }>((resolve) =>
        requestAnimationFrame(() => {
          const look = (card: HTMLElement): string[] => {
            const style = getComputedStyle(card);
            const title = getComputedStyle(card.querySelector('[class*="card__header-title"]') as HTMLElement);
            const content = getComputedStyle(card.querySelector('[class*="card__content"]') as HTMLElement);
            return [
              String(card.getBoundingClientRect().width), style.backgroundColor, style.borderTopColor, style.borderRadius,
              title.color, title.fontSize, content.paddingLeft, content.paddingTop,
            ];
          };
          resolve({ factory: look(factory.element), element: look(element.shadowRoot?.firstElementChild as HTMLElement) });
        })
      );
    });
    assert.deepEqual(parity.element, parity.factory);
    check("card: matches the factory's size, colours, shape and padding");
  }

  // ---------------------------------------------------------------- carousel
  // The carousel fills its container's height, as the factory's does: the page sizes it.
  await page.addStyleTag({ content: ".tall{height:240px}.tall>m-carousel{height:100%}" });
  const slide = (value: string, label: string): string =>
    `<m-carousel-item value="${value}" src="/photo-${value}" alt="Photo ${label}" description="About ${label}">${label}</m-carousel-item>`;
  await fresh(
    page,
    `<section id="a" class="tall"><m-carousel id="r" aria-label="Photos" index="1" item-width="200">
       ${[["a", "Alpha"], ["b", "Beta"], ["c", "Gamma"], ["d", "Delta"], ["e", "Epsilon"]].map(([v, l]) => slide(v, l)).join("")}
     </m-carousel></section><section id="factory" class="tall"></section>`
  );
  {
    type Carousel = HTMLElement & { index: number; component: unknown };
    const settle = (): Promise<unknown> =>
      page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));
    await settle();
    const photos = page.getByRole("region", { name: "Photos" });
    assert.equal(await photos.count(), 1);
    assert.equal(await photos.getAttribute("aria-roledescription"), "carousel");
    assert.equal(await photos.getByRole("group").count(), 5);
    assert.equal(await photos.getByRole("group", { name: "2 of 5" }).getByText("Beta", { exact: true }).count(), 1);
    assert.equal(await photos.getByRole("img", { name: "Photo Beta" }).count(), 1);
    assert.equal(await page.evaluate(() => (document.getElementById("r") as Carousel).index), 1);
    check("carousel: a region named by aria-label; children declare the items, index sets the current one");

    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      document.getElementById("r")?.addEventListener("change", (e) => {
        (w.events as unknown[]).push({ detail: (e as CustomEvent).detail, target: (e.target as Element).id });
      });
    });
    await photos.getByRole("group", { name: "2 of 5" }).focus();
    await page.keyboard.press("ArrowRight");
    let state = await page.evaluate(() => ({ events: (window as unknown as Win).events, index: (document.getElementById("r") as Carousel).index }));
    // FLO-380: value is the model (the index). 1.0 dropped the doubled detail.index.
    assert.deepEqual(state, { events: [{ detail: { value: 2 }, target: "r" }], index: 2 });
    check("carousel: an arrow key moves to the next item and dispatches change");

    await page.evaluate(() => ((window as unknown as Win).events = []));
    await photos.getByRole("group", { name: "4 of 5" }).click();
    state = await page.evaluate(() => ({ events: (window as unknown as Win).events, index: (document.getElementById("r") as Carousel).index }));
    assert.deepEqual(state, { events: [{ detail: { value: 3 }, target: "r" }], index: 3 });
    check("carousel: a click on an item makes it current and dispatches change");

    state = await page.evaluate(() => {
      const w = window as unknown as Win;
      w.events = [];
      const r = document.getElementById("r") as Carousel;
      r.index = 1;
      return { events: w.events, index: r.index };
    });
    assert.deepEqual(state, { events: [], index: 1 });
    check("carousel: setting index fires no event");

    const updated = await page.evaluate(async () => {
      const r = document.getElementById("r") as Carousel;
      const before = r.component;
      const item = document.createElement("m-carousel-item") as HTMLElement & { value: string; description: string };
      item.value = "f";
      item.description = "About Zeta";
      item.textContent = "Zeta";
      r.append(item);
      r.querySelector('[value="b"]')?.remove();
      (r.querySelector('[value="c"]') as HTMLElement).setAttribute("label", "Gamma ray");
      r.prepend(r.querySelector('[value="e"]') as HTMLElement);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const items = [...(r.shadowRoot?.querySelectorAll('[role="group"]') ?? [])] as HTMLElement[];
      return {
        same: r.component === before,
        titles: items.map((el) => el.querySelector('[class*="carousel__title"]')?.textContent),
        labels: items.map((el) => el.getAttribute("aria-label")),
      };
    });
    assert.deepEqual(updated, {
      same: true,
      titles: ["Epsilon", "Alpha", "Gamma ray", "Delta", "Zeta"],
      labels: ["1 of 5", "2 of 5", "3 of 5", "4 of 5", "5 of 5"],
    });
    check("carousel: items added, removed, moved and changed update in place");

    const renamed = await page.evaluate(() => {
      const r = document.getElementById("r") as Carousel;
      const before = r.component;
      r.setAttribute("aria-label", "Pictures");
      return r.component === before;
    });
    assert.equal(renamed, true);
    assert.equal(await page.getByRole("region", { name: "Pictures" }).count(), 1);
    check("carousel: aria-label updates in place");

    const relaid = await page.evaluate(async () => {
      const r = document.getElementById("r") as Carousel;
      const before = r.component;
      r.setAttribute("variant", "hero");
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      return { rebuilt: r.component !== before, hero: r.shadowRoot?.firstElementChild?.className.includes("carousel--hero"), index: r.index };
    });
    assert.deepEqual(relaid, { rebuilt: true, hero: true, index: 1 });
    check("carousel: variant recreates the carousel and keeps a dirty index");

    // Same layout as the factory in light DOM with the full stylesheet.
    await fresh(
      page,
      `<section id="a" class="tall"><m-carousel id="r" aria-label="Photos" item-width="200">
         ${[["a", "Alpha"], ["b", "Beta"], ["c", "Gamma"], ["d", "Delta"], ["e", "Epsilon"]].map(([v, l]) => slide(v, l)).join("")}
       </m-carousel></section><section id="factory" class="tall"></section>`
    );
    await settle();
    const parity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createCarousel: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createCarousel({
        ariaLabel: "Factory",
        itemWidth: 200,
        slides: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((title, i) => ({
          image: `/photo-${"abcde"[i]}`, alt: `Photo ${title}`, title, description: `About ${title}`,
        })),
      });
      document.getElementById("factory")?.append(factory.element);
      return new Promise<{ factory: string[][]; element: string[][] }>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const look = (root: ParentNode): string[][] =>
              [...root.querySelectorAll('[role="group"]')].map((item) => {
                const style = getComputedStyle(item);
                const title = getComputedStyle(item.querySelector('[class*="carousel__title"]') as HTMLElement);
                return [style.width, style.clipPath, style.transform, title.color, title.fontSize];
              });
            resolve({ factory: look(factory.element), element: look(document.getElementById("r")?.shadowRoot as ShadowRoot) });
          })
        )
      );
    });
    assert.equal(parity.element.length, 5);
    assert.deepEqual(parity.element, parity.factory);
    check("carousel: items match the factory's sizes, masks, positions and colours");
  }

  // FLO-395: declarative opt-in and toggling without recreating the factory.
  await fresh(page, `<m-carousel id="wheel-carousel" wheel item-width="200" style="width:600px;height:240px">
    ${Array.from({ length: 8 }, (_, i) => slide(String(i), `Slide ${i}`)).join("")}
  </m-carousel>`);
  {
    const host = page.locator("#wheel-carousel");
    const scroller = host.locator('[part="scroller"]');
    await page.waitForFunction(() => {
      const el = document.querySelector("#wheel-carousel")?.shadowRoot?.querySelector('[part="scroller"]');
      return el && el.scrollWidth > el.clientWidth;
    });
    const wheel = () => scroller.evaluate(element => {
      const event = new WheelEvent("wheel", { deltaY: 160, cancelable: true, bubbles: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    assert.equal(await wheel(), true, "wheel attribute enables scrolling at creation");
    await page.waitForTimeout(700);
    assert((await scroller.evaluate(el => el.scrollLeft)) > 0);
    assert.equal(await host.evaluate(el => {
      const host = el as HTMLElement & { component: unknown };
      const before = host.component;
      host.removeAttribute("wheel");
      return host.component === before;
    }), true, "removing wheel keeps the component");
    await page.waitForTimeout(200);
    const position = await scroller.evaluate(el => el.scrollLeft);
    assert.equal(await wheel(), false, "removing wheel disables interception");
    assert.equal(await scroller.evaluate(el => el.scrollLeft), position);
    assert.equal(await host.evaluate(el => {
      const host = el as HTMLElement & { component: unknown };
      const before = host.component;
      host.setAttribute("wheel", "");
      return host.component === before;
    }), true, "adding wheel keeps the component");
    assert.equal(await wheel(), true, "adding wheel enables interception again");
    await page.waitForTimeout(700);
    assert((await scroller.evaluate(el => el.scrollLeft)) > position);
    check("carousel: wheel attribute scrolls horizontally and toggles in place");
  }

  // ---------------------------------------------------------------- carousel defaults
  {
    type Carousel = HTMLElement & { index: number };
    const markup = `<section class="tall"><m-carousel id="x" aria-label="Dirty" item-width="200">
      ${[["a", "Alpha"], ["b", "Beta"], ["c", "Gamma"], ["d", "Delta"]].map(([v, l]) => slide(v, l)).join("")}</m-carousel></section>`;
    const live = (): Promise<number> => page.evaluate(() => (document.getElementById("x") as Carousel).index);
    const attribute = (value: number): Promise<number> =>
      page.evaluate((v) => {
        const x = document.getElementById("x") as Carousel;
        x.setAttribute("index", String(v));
        return x.index;
      }, value);

    await fresh(page, markup);
    assert.equal(await live(), 0);
    assert.equal(await attribute(2), 2);
    check("carousel: before any interaction, the index attribute moves the current item");

    await page.getByRole("group", { name: "3 of 4" }).focus();
    await page.keyboard.press("ArrowLeft");
    assert.equal(await live(), 1);
    assert.equal(await attribute(3), 1);
    check("carousel: after a user interaction, the index attribute does not move it");

    await fresh(page, markup);
    await page.evaluate(() => ((document.getElementById("x") as Carousel).index = 1));
    assert.equal(await attribute(3), 1);
    check("carousel: after a property set, the index attribute does not move it");
  }

  // ---------------------------------------------------------------- model attributes are defaults
  // The native rule (dirty checkedness and value flags): the model's attribute
  // moves the live state until the user or script changes it; form.reset()
  // returns to the attribute and makes the element clean again.
  {
    type Live = string | number | boolean | null;
    interface DefaultCase {
      name: string;
      markup: string;
      attribute: string;
      property: string;
      /** Attribute values as live values, each different from the live state before it. */
      a: Live;
      b: Live;
      c: Live;
      /** A property value, then an attribute value, on a fresh element. */
      set: Live;
      after: Live;
      /** A user interaction that moves the live state away from `b`. */
      user: () => Promise<void>;
      /** Not form-associated: no reset. */
      noForm?: true;
    }
    const cases: DefaultCase[] = [
      ...(["switch", "checkbox"] as const).map((name) => ({
        name,
        markup: `<m-${name} id="x" name="x">Dirty</m-${name}>`,
        attribute: "checked",
        property: "checked",
        a: true, b: true, c: false, set: true, after: false,
        user: () => page.getByRole(name, { name: "Dirty" }).click(),
      })),
      {
        name: "icon button",
        markup: `<m-icon-button id="x" toggle aria-label="Dirty" icon="${ICON}"></m-icon-button>`,
        attribute: "selected",
        property: "selected",
        a: true, b: true, c: false, set: true, after: false,
        user: () => page.getByRole("button", { name: "Dirty" }).click(),
      },
      {
        name: "radios",
        markup: `<m-radios id="x" name="x" aria-label="Dirty"><m-radio value="a">Alpha</m-radio>
          <m-radio value="b">Beta</m-radio><m-radio value="c">Gamma</m-radio></m-radios>`,
        attribute: "value",
        property: "value",
        a: "b", b: "c", c: "a", set: "b", after: "c",
        user: () => page.getByRole("radiogroup", { name: "Dirty" }).getByText("Alpha", { exact: true }).click(),
      },
      {
        name: "tabs",
        markup: `<m-tabs id="x"><m-tab value="t1">One</m-tab><m-tab value="t2">Two</m-tab>
          <m-tab value="t3">Three</m-tab></m-tabs>`,
        attribute: "value",
        property: "value",
        a: "t2", b: "t3", c: "t1", set: "t2", after: "t3",
        user: () => page.getByRole("tab", { name: "One" }).click(),
        noForm: true,
      },
      {
        name: "navigation rail",
        markup: `<m-navigation-rail id="x" aria-label="Dirty"><m-navigation-rail-item value="r1" icon='${ICON}'>One</m-navigation-rail-item>
          <m-navigation-rail-item value="r2" icon='${ICON}'>Two</m-navigation-rail-item>
          <m-navigation-rail-item value="r3" icon='${ICON}'>Three</m-navigation-rail-item></m-navigation-rail>`,
        attribute: "value",
        property: "value",
        a: "r2", b: "r3", c: "r1", set: "r2", after: "r3",
        user: () => page.getByRole("navigation", { name: "Dirty" }).getByRole("button", { name: "One" }).click(),
        noForm: true,
      },
      {
        name: "drawer",
        markup: `<m-drawer id="x" open aria-label="Dirty"><m-drawer-item value="d1">One</m-drawer-item>
          <m-drawer-item value="d2">Two</m-drawer-item><m-drawer-item value="d3">Three</m-drawer-item></m-drawer>`,
        attribute: "value",
        property: "value",
        a: "d2", b: "d3", c: "d1", set: "d2", after: "d3",
        user: () => page.getByRole("navigation", { name: "Dirty" }).getByRole("button", { name: "One" }).click(),
        noForm: true,
      },
      {
        name: "slider value",
        markup: `<m-slider id="x" name="x" aria-label="Dirty"></m-slider>`,
        attribute: "value",
        property: "value",
        a: 30, b: 50, c: 60, set: 70, after: 20,
        user: async () => {
          await page.getByRole("slider", { name: "Dirty" }).focus();
          await page.keyboard.press("ArrowRight");
        },
      },
      {
        name: "slider second-value",
        markup: `<m-slider id="x" name="x" range value="20" second-value="80" aria-label="Dirty"></m-slider>`,
        attribute: "second-value",
        property: "secondValue",
        a: 70, b: 90, c: 85, set: 75, after: 60,
        user: async () => {
          await page.getByRole("slider", { name: "Dirty maximum" }).focus();
          await page.keyboard.press("ArrowLeft");
        },
      },
      {
        name: "textfield",
        markup: `<m-textfield id="x" name="x" label="Dirty"></m-textfield>`,
        attribute: "value",
        property: "value",
        a: "a", b: "b", c: "c", set: "p", after: "d",
        user: async () => {
          await page.getByRole("textbox", { name: "Dirty" }).press("End");
          await page.keyboard.type("z");
        },
      },
    ];

    /**
     * Sets the attribute for a live value (a boolean is present or absent) and
     * reads the live state. An attribute already there goes through another
     * value first, so the element always sees a change.
     */
    const attribute = (spec: DefaultCase, value: Live): Promise<Live> =>
      page.evaluate(
        ({ name, property, value }) => {
          const x = document.getElementById("x") as HTMLElement & Record<string, Live>;
          const target = value === false || value === null ? null : value === true ? "" : String(value);
          const apply = (v: string | null): void => (v === null ? x.removeAttribute(name) : x.setAttribute(name, v));
          if (x.getAttribute(name) === target) apply(target === null ? "" : null);
          apply(target);
          return x[property];
        },
        { name: spec.attribute, property: spec.property, value }
      );
    const live = (spec: DefaultCase): Promise<Live> =>
      page.evaluate((property) => (document.getElementById("x") as HTMLElement & Record<string, Live>)[property], spec.property);
    // The slider binds its handles a task after creation.
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => setTimeout(r, 0)));

    for (const spec of cases) {
      await fresh(page, `<form id="df">${spec.markup}</form>`);
      await settle();
      assert.notEqual(await live(spec), spec.a);
      assert.equal(await attribute(spec, spec.a), spec.a, `${spec.name}: a clean element follows its attribute`);
      check(`${spec.name}: before any interaction, the ${spec.attribute} attribute moves the live state`);

      await spec.user();
      const moved = await live(spec);
      assert.notEqual(moved, spec.a, `${spec.name}: the interaction changes the state`);
      assert.notEqual(moved, spec.b);
      assert.equal(await attribute(spec, spec.b), moved, `${spec.name}: the user's state stays`);
      check(`${spec.name}: after a user interaction, the ${spec.attribute} attribute does not move it`);

      if (!spec.noForm) {
        await page.evaluate(() => (document.getElementById("df") as HTMLFormElement).reset());
        await settle();
        assert.equal(await live(spec), spec.b, `${spec.name}: reset returns to the current attribute`);
        assert.equal(await attribute(spec, spec.c), spec.c, `${spec.name}: reset makes it clean again`);
        check(`${spec.name}: form.reset() returns to the ${spec.attribute} attribute and clears the dirty flag`);
      }

      await fresh(page, `<form id="df">${spec.markup}</form>`);
      await settle();
      await page.evaluate(
        ({ property, value }) => {
          (document.getElementById("x") as HTMLElement & Record<string, Live>)[property] = value;
        },
        { property: spec.property, value: spec.set }
      );
      assert.equal(await live(spec), spec.set);
      assert.equal(await attribute(spec, spec.after), spec.set, `${spec.name}: the script's state stays`);
      check(`${spec.name}: after a property set, the ${spec.attribute} attribute does not move it`);
    }

    // A recreation (label has no setter) keeps both the live value and the flag.
    const field = cases.find((spec) => spec.name === "textfield") as DefaultCase;
    await fresh(page, `<form id="df"><m-textfield id="x" name="x" label="Dirty" value="a"></m-textfield></form>`);
    const relabel = (label: string): Promise<void> =>
      page.evaluate((text) => document.getElementById("x")?.setAttribute("label", text), label);
    await relabel("Clean");
    assert.equal(await attribute(field, "b"), "b", "still clean after a recreation");
    await page.getByRole("textbox", { name: "Clean" }).press("End");
    await page.keyboard.type("z");
    await relabel("Dirty");
    assert.equal(await live(field), "bz");
    assert.equal(await attribute(field, "c"), "bz", "still dirty after a recreation");
    check("textfield: a recreation keeps the live value and whether it is dirty");
  }

  // ---------------------------------------------------------------- lifecycle
  await fresh(page, `<section id="a"><m-switch id="s" checked>Moved</m-switch></section><section id="b"></section>`);
  {
    const moved = await page.evaluate(async () => {
      const s = document.getElementById("s") as HTMLElement & { component: unknown; checked: boolean };
      const before = s.component;
      s.checked = false;
      document.getElementById("b")?.append(s);
      await Promise.resolve();
      await Promise.resolve();
      return { same: s.component === before, checked: s.checked };
    });
    assert.deepEqual(moved, { same: true, checked: false });
    check("lifecycle: a moved element keeps its component and state");

    const removed = await page.evaluate(async () => {
      const s = document.getElementById("s") as HTMLElement & { component: unknown };
      s.remove();
      await Promise.resolve();
      await Promise.resolve();
      const destroyed = s.component === null && s.shadowRoot?.childElementCount === 0;
      document.body.append(s);
      const back = s.component !== null;
      s.remove();
      return { destroyed, back };
    });
    assert.deepEqual(removed, { destroyed: true, back: true });
    check("lifecycle: removal destroys the component, and reconnection rebuilds it");

    const upgraded = await page.evaluate(() => {
      const el = document.createElement("m-late") as HTMLElement & { checked?: boolean };
      el.checked = true;
      document.getElementById("host")?.append(el);
      const w = window as unknown as Win & { mtrl: { switchElement: { element: CustomElementConstructor } } };
      customElements.define("m-late", class extends w.mtrl.switchElement.element {});
      return (el as HTMLElement & { checked: boolean }).checked;
    });
    assert.equal(upgraded, true);
    check("lifecycle: a property set before upgrade is kept");
  }

  // ---------------------------------------------------------------- form restore
  {
    const restorePage = await browser.newPage();
    await restorePage.goto(`http://127.0.0.1:${server.port}/restore`);
    await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
    await restorePage.getByRole("switch", { name: "Restored", exact: true }).click();
    await restorePage.getByRole("checkbox", { name: "Restored checkbox", exact: true }).click();
    await restorePage.getByRole("textbox", { name: "Restored text", exact: true }).fill("kept");
    await restorePage.click("#go");
    await restorePage.waitForURL(/\/away$/);
    await restorePage.goBack();
    await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
    const checked = (): Record<string, boolean> =>
      Object.fromEntries(["r", "rc"].map((id) => [id, (document.getElementById(id) as HTMLElement & { checked: boolean }).checked]));
    await restorePage.waitForFunction(() => ["r", "rc"].every((id) => (document.getElementById(id) as HTMLElement & { checked: boolean }).checked), undefined, { timeout: 5_000 })
      .catch(() => undefined);
    const restored = await restorePage.evaluate(checked);
    const restoredText = await restorePage.evaluate(() => (document.getElementById("rt") as HTMLElement & { value: string }).value);
    await restorePage.close();
    assert.equal(restored.r, true, "going back restores the switch the user turned on");
    check("forms: going back restores a switch's state");
    assert.equal(restored.rc, true, "going back restores the checkbox the user checked");
    check("forms: going back restores a checkbox's state");
    assert.equal(restoredText, "kept", "going back restores the text the user typed");
    check("forms: going back restores a text field's value");
  }

  {
    const restorePage = await browser.newPage();
    await restorePage.goto(`http://127.0.0.1:${server.port}/restore-radios`);
    await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
    await restorePage.getByRole("radiogroup", { name: "Restored radios" }).getByText("Beta", { exact: true }).click();
    await restorePage.click("#go");
    await restorePage.waitForURL(/\/away$/);
    await restorePage.goBack();
    await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
    const value = (): string | null => (document.getElementById("rr") as HTMLElement & { value: string | null }).value;
    await restorePage.waitForFunction(() => (document.getElementById("rr") as HTMLElement & { value: string | null }).value === "b", undefined, { timeout: 5_000 })
      .catch(() => undefined);
    const restored = await restorePage.evaluate(value);
    await restorePage.close();
    assert.equal(restored, "b", "going back restores the radio the user selected over the value attribute");
    check("forms: going back restores a radio group's selection");
  }

  // ---------------------------------------------------------------- focus in a shadow root (#244)
  // The factories found the focused item with document.activeElement, which
  // is the shadow host when focus is inside a shadow root. The rail and the
  // drawer carried their own key handlers for it; these run on the factories'.
  {
    const settle = (): Promise<unknown> => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const focusedIn = (id: string): Promise<string | null | undefined> =>
      page.evaluate((id) => {
        const active = document.getElementById(id)?.shadowRoot?.activeElement as HTMLElement | null | undefined;
        return active?.dataset.id ?? active?.textContent?.trim();
      }, id);
    const changes = (id: string): Promise<unknown[]> =>
      page.evaluate((id) => {
        const w = window as unknown as Win;
        w.events = [];
        document.getElementById(id)?.addEventListener("change", (e) => (w.events as unknown[]).push((e as CustomEvent).detail));
        return [];
      }, id);
    const events = (): Promise<unknown> => page.evaluate(() => (window as unknown as Win).events);

    await fresh(
      page,
      `<m-navigation-rail id="kr" aria-label="Keys">
         <m-navigation-rail-item value="a" icon='${ICON}'>Inbox</m-navigation-rail-item>
         <m-navigation-rail-item value="b" icon='${ICON}'>Sent</m-navigation-rail-item>
         <m-navigation-rail-item value="c" icon='${ICON}' disabled>Trash</m-navigation-rail-item>
         <m-navigation-rail-item value="d" icon='${ICON}'>Spam</m-navigation-rail-item>
       </m-navigation-rail>`
    );
    await changes("kr");
    await page.getByRole("navigation", { name: "Keys" }).getByRole("button", { name: "Inbox", exact: true }).focus();
    const rail: unknown[] = [];
    for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowUp", "End", "Home", "ArrowUp"]) {
      await page.keyboard.press(key);
      rail.push(await focusedIn("kr"));
    }
    assert.deepEqual(rail, ["b", "d", "a", "d", "d", "a", "d"], "arrows skip the disabled item and wrap; Home and End");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    assert.deepEqual(await events(), [{ value: "d" }, { value: "b" }]);
    check("focus in a shadow root: the rail's own arrows, Home and End move focus; Space and Enter select");

    await fresh(
      page,
      `<m-drawer id="kd" open aria-label="Keys">
         <m-drawer-item value="inbox">Inbox</m-drawer-item>
         <m-drawer-item value="sent">Sent</m-drawer-item>
         <m-drawer-item value="spam" disabled>Spam</m-drawer-item>
         <m-drawer-item value="trash">Trash</m-drawer-item>
       </m-drawer>`
    );
    await changes("kd");
    await page.getByRole("navigation", { name: "Keys" }).getByRole("button", { name: "Inbox", exact: true }).focus();
    const drawer: unknown[] = [];
    for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowUp", "End", "Home"]) {
      await page.keyboard.press(key);
      drawer.push(await focusedIn("kd"));
    }
    assert.deepEqual(drawer, ["sent", "trash", "inbox", "trash", "trash", "inbox"], "arrows skip the disabled item and wrap; Home and End");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.deepEqual(await events(), [{ value: "inbox" }, { value: "sent" }]);
    check("focus in a shadow root: the drawer's own arrows, Home and End move focus; Space and Enter select once");

    await fresh(
      page,
      `<m-chips id="kc" aria-label="People">
         <m-chip variant="input" value="a">Ann</m-chip><m-chip variant="input" value="b">Ben</m-chip><m-chip variant="input" value="c">Cy</m-chip>
       </m-chips>
       <m-chips id="kf" aria-label="Kinds"><m-chip value="x">Ex</m-chip><m-chip value="y">Why</m-chip></m-chips>`
    );
    await changes("kf");
    const people = page.getByRole("grid", { name: "People" });
    await people.getByRole("gridcell", { name: "Ben" }).locator("button").first().focus();
    const beforeDelete = await focusedIn("kc");
    await page.keyboard.press("Delete");
    await settle();
    assert.deepEqual({ beforeDelete, afterDelete: await focusedIn("kc") }, { beforeDelete: "Ben", afterDelete: "Cy" });
    await page.getByRole("grid", { name: "Kinds" }).getByRole("gridcell", { name: "Ex" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    assert.deepEqual(await events(), [{ value: ["y"] }, { value: ["x", "y"] }]);
    check("focus in a shadow root: chips' arrows move focus, Space and Enter toggle, a removed chip hands focus on");

    await fresh(
      page,
      `<m-list id="kl" aria-label="Keys"><m-list-item value="a">Alpha</m-list-item>
         <m-list-item value="b">Beta</m-list-item><m-list-item value="c">Gamma</m-list-item></m-list>`
    );
    await changes("kl");
    const rowName = (): Promise<string | undefined> =>
      page.evaluate(() => {
        const root = document.getElementById("kl")?.shadowRoot;
        const active = root?.activeElement;
        return active ? root?.getElementById(active.getAttribute("aria-labelledby") ?? "")?.textContent?.trim() : undefined;
      });
    await page.getByRole("list", { name: "Keys" }).getByRole("button", { name: "Alpha" }).focus();
    const list: unknown[] = [];
    for (const key of ["ArrowDown", "End", "Home"]) {
      await page.keyboard.press(key);
      list.push(await rowName());
    }
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.deepEqual(list, ["Beta", "Gamma", "Alpha"]);
    assert.deepEqual(((await events()) as { value: string }[]).map((e) => e.value), ["b", "c"]);
    await page.evaluate(() => document.querySelector('#kl [value="a"]')?.setAttribute("supporting-text", "First"));
    await settle();
    assert.equal(await rowName(), "Gamma", "the list renders again and keeps the focused row");
    check("focus in a shadow root: the list's arrows, Home and End move focus, Space and Enter select; a render keeps focus");
  }

  // ---------------------------------------------------------------- factories in a shadow root (#244)
  // The factories with no element yet, mounted in a plain shadow root: an
  // open one with the stylesheet, a text before and an opener after it, so
  // focus handed to the host (not focusable) or to its first control shows.
  {
    const stage = async (): Promise<void> => {
      await fresh(page, `<div id="shadow"></div>`);
      await page.evaluate(() => {
        const root = (document.getElementById("shadow") as HTMLElement).attachShadow({ mode: "open" });
        root.innerHTML = `<link rel="stylesheet" href="/styles.css"><input id="first" aria-label="First">
          <button id="opener" type="button">Open</button><div id="mount"></div>`;
      });
      await page.waitForFunction(() => !!document.getElementById("shadow")?.shadowRoot?.querySelector("link")?.sheet);
    };
    type Factories = Record<string, (config: object) => Record<string, (...args: unknown[]) => unknown> & { element: HTMLElement }>;
    const inShadow = (): Promise<string | null | undefined> =>
      page.evaluate(() => {
        const active = document.getElementById("shadow")?.shadowRoot?.activeElement as HTMLElement | null | undefined;
        return active ? active.id || active.textContent?.trim() : null;
      });
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);

    // Menus, dialogs, the search and the drawer move focus, or close, on timers and
    // frames of their own. The fixed waits of this section were only long enough for
    // them; `until` then waits, 5s at most, for the state the next step reads or
    // sends keys to. It does not fail by itself: the assertion that follows names
    // the step and reports what was found.
    const until = async (ready: () => Promise<boolean>): Promise<void> => {
      for (const end = Date.now() + 5000; Date.now() < end && !(await ready());) await wait(20);
    };
    await stage();
    await page.evaluate(() => {
      const root = document.getElementById("shadow")?.shadowRoot as ShadowRoot;
      const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
      const menu = mtrl.createMenu({
        opener: root.getElementById("opener") as HTMLElement,
        container: root.getElementById("mount") as HTMLElement,
        items: [{ id: "cut", text: "Cut" }, { id: "copy", text: "Copy" }, { id: "paste", text: "Paste" }],
      });
      (window as unknown as Win).__menu = menu;
    });
    await page.evaluate(() => (document.getElementById("shadow")?.shadowRoot?.getElementById("opener") as HTMLElement).focus());
    await page.keyboard.press("ArrowDown");
    await wait(350);
    await until(async () => (await inShadow()) === "Cut");
    const menu: unknown[] = [await inShadow()];
    for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowUp"]) {
      await page.keyboard.press(key);
      menu.push(await inShadow());
    }
    assert.deepEqual(menu, ["Cut", "Copy", "Paste", "Cut", "Paste"], "opens on the first item; the arrows move and wrap");
    check("factories in a shadow root: menu arrows move focus between items");

    await stage();
    await page.evaluate(() => {
      const root = document.getElementById("shadow")?.shadowRoot as ShadowRoot;
      const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
      const select = mtrl.createSelect({
        label: "Fruit",
        options: [{ id: "a", text: "Apple" }, { id: "b", text: "Banana" }],
      });
      (root.getElementById("mount") as HTMLElement).append(select.element);
      (window as unknown as Win).__select = select;
    });
    const field = page.locator("#shadow").getByRole("combobox", { name: "Fruit" }).or(page.locator("#shadow").getByRole("textbox", { name: "Fruit" }));
    await field.first().focus();
    await page.keyboard.press("ArrowDown");
    await wait(350);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await wait(350);
    // The menu's "close" comes with Enter (FLO-548; it came 50ms after), and the select
    // looks at its focused styling again 10ms after that: read once the menu has closed
    // and that turn has passed, or the class read is the one left from the open menu.
    await until(() => page.evaluate(() =>
      ((window as unknown as Win).__select as { element: HTMLElement }).element.querySelector("[aria-expanded]")?.getAttribute("aria-expanded") === "false"));
    await wait(50);
    const select = await page.evaluate(() => {
      const s = (window as unknown as Win).__select as { element: HTMLElement; getValue: () => unknown };
      const root = document.getElementById("shadow")?.shadowRoot as ShadowRoot;
      return {
        value: s.getValue(),
        focused: s.element.contains(root.activeElement),
        styled: [...s.element.querySelectorAll("*"), s.element].some((el) => [...el.classList].some((c) => c.endsWith("textfield--focused"))),
      };
    });
    assert.deepEqual(select, { value: "b", focused: true, styled: true });
    check("factories in a shadow root: select keeps its focused styling when the menu closes onto it");

    const returnsFocus = async (name: string, create: string): Promise<void> => {
      await stage();
      await page.evaluate((create) => {
        const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
        const factory = mtrl[create];
        const component = create === "createDialog"
          ? factory({ title: "Shadow", content: "Inside", closeOnEscape: true })
          : factory({ title: "Shadow", content: "Inside", variant: "modal" });
        (window as unknown as Win).__overlay = component;
        const opener = document.getElementById("shadow")?.shadowRoot?.getElementById("opener") as HTMLElement;
        opener.addEventListener("click", () => void component.open());
      }, create);
      await page.locator("#shadow").getByRole("button", { name: "Open", exact: true }).click();
      await wait(400);
      await until(async () => (await inShadow()) === null);
      const moved = await inShadow();
      await page.evaluate(() => void ((window as unknown as Win).__overlay as { close: () => unknown }).close());
      await wait(400);
      await until(async () => (await inShadow()) === "opener");
      assert.deepEqual({ moved, back: await inShadow() }, { moved: null, back: "opener" }, `${name}: focus returns to the opener`);
    };
    await returnsFocus("dialog", "createDialog");
    check("factories in a shadow root: a dialog returns focus to its opener inside the shadow root");

    // The event that opened an overlay never dismisses it (FLO-548). A dialog
    // opened from an Escape keydown gets its Escape listener (or, in the top
    // layer, becomes the browser's topmost modal) while that key press is
    // still being handled. Both layers are read before the assertion, so a
    // failure shows whether they agree; each with the page never touched (the
    // button focused by script) and after a real click on it, which gives the
    // page a user activation.
    const opensOnEscape = async (layer: "top" | undefined, clicked: boolean): Promise<{ afterTheKeyThatOpenedIt: boolean; afterTheNextEscape: boolean }> => {
      await fresh(page, `<button id="opener" type="button">Discard</button>`);
      await page.evaluate((layer) => {
        const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
        const dialog = mtrl.createDialog({ title: "Discard draft?", content: "Your changes will be lost.", closeOnEscape: true, ...(layer ? { layer } : {}) });
        (window as unknown as Win).__overlay = dialog;
        (document.getElementById("opener") as HTMLElement).addEventListener("keydown", (event) => {
          if (event.key === "Escape") dialog.open();
        });
      }, layer);
      const isOpen = (): Promise<boolean> =>
        page.evaluate(() => ((window as unknown as Win).__overlay as { isOpen: () => boolean }).isOpen());
      if (clicked) await page.click("#opener");
      await page.focus("#opener");
      await page.keyboard.press("Escape");
      await wait(400);
      const afterTheKeyThatOpenedIt = await isOpen();
      await page.keyboard.press("Escape");
      await until(async () => !(await isOpen()));
      const afterTheNextEscape = await isOpen();
      await page.evaluate(() => void ((window as unknown as Win).__overlay as { destroy: () => unknown }).destroy());
      return { afterTheKeyThatOpenedIt, afterTheNextEscape };
    };
    const held = { afterTheKeyThatOpenedIt: true, afterTheNextEscape: false };
    assert.deepEqual(
      {
        default: await opensOnEscape(undefined, false),
        top: await opensOnEscape("top", false),
        defaultAfterAClick: await opensOnEscape(undefined, true),
        topAfterAClick: await opensOnEscape("top", true),
      },
      { default: held, top: held, defaultAfterAClick: held, topAfterAClick: held },
      "a dialog opened from an Escape keydown: open after that key press, closed by the next one, in both layers",
    );
    check("dialog: the Escape key press that opened it does not close it, and the next one does, in both layers");

    // Escape is handled as a key press, in both layers (FLO-548 family 6,
    // FLO-556): prevented, so the browser sends a top-layer dialog no `cancel`
    // and never forces one closed. With focus on a child and on the body; a
    // dialog that refuses, by option and by beforeclose, for five presses (the
    // browser forced the third); a menu open inside it, which takes the key;
    // and, in the top layer, a close the browser makes without asking, after
    // which the page must be as a normal close leaves it. Both layers are read
    // before the assertion.
    const dialogEscapes = async (layer?: "top"): Promise<Record<string, unknown>> => {
      await fresh(page, `<button id="opener" type="button">Open</button>`);
      const build = (config: { closeOnEscape?: boolean }, refuses: boolean): Promise<void> =>
        page.evaluate(({ config, refuses, layer }) => {
          const w = window as unknown as Win & { mtrl: Factories };
          (w.__overlay as { destroy?: () => void } | undefined)?.destroy?.();
          const dialog = w.mtrl.createDialog({
            title: "Discard draft?",
            content: `<button id="inside" type="button">Inside</button>`,
            ...config,
            ...(layer ? { layer } : {}),
          });
          const counts = { beforeclose: 0, close: 0 };
          dialog.on("beforeclose", (event: { preventDefault: () => void }) => {
            counts.beforeclose++;
            if (refuses) event.preventDefault();
          });
          dialog.on("close", () => { counts.close++; });
          w.__overlay = dialog;
          w.__counts = counts;
        }, { config, refuses, layer });
      const open = async (): Promise<void> => {
        await page.focus("#opener");
        await page.evaluate(() => void ((window as unknown as Win).__overlay as { open: () => unknown }).open());
        await wait(500);
      };
      const read = (): Promise<{ open: boolean; visible: boolean; beforeclose: number; close: number }> =>
        page.evaluate(() => {
          const w = window as unknown as Win;
          const dialog = w.__overlay as { isOpen: () => boolean; element: HTMLElement };
          const counts = w.__counts as { beforeclose: number; close: number };
          return { open: dialog.isOpen(), visible: dialog.element.classList.contains("mtrl-dialog--visible"), ...counts };
        });
      const escape = async (times = 1): Promise<void> => {
        for (let i = 0; i < times; i++) {
          await page.keyboard.press("Escape");
          await wait(80);
        }
        await wait(400);
      };
      const result: Record<string, unknown> = {};

      await build({}, false);
      await open();
      await page.focus("#inside");
      await escape();
      result.fromAChild = await read();
      await open();
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      result.focusOnBody = await page.evaluate(() => document.activeElement === document.body);
      await escape();
      result.fromTheBody = await read();

      await build({ closeOnEscape: false }, false);
      await open();
      await escape(5);
      result.refusedByOption = await read();

      await build({}, true);
      await open();
      await escape(5);
      result.refusedByBeforeclose = await read();

      // Closed by the browser without asking: the native close(), as a forced
      // close request ends. Only a <dialog> can be.
      if (layer) {
        await page.evaluate(() => ((window as unknown as Win).__overlay as { element: HTMLDialogElement }).element.close());
        await wait(500);
        result.forced = {
          ...(await read()),
          ...(await page.evaluate(() => ({
            overflow: document.body.style.overflow,
            inert: document.querySelectorAll("[inert]").length,
            focus: (document.activeElement as HTMLElement | null)?.id ?? null,
          }))),
        };
        result.opensAgain = await page.evaluate(async () => {
          const dialog = (window as unknown as Win).__overlay as { open: () => unknown; isOpen: () => boolean; element: HTMLDialogElement };
          dialog.open();
          await new Promise((r) => setTimeout(r, 500));
          return { open: dialog.isOpen(), native: dialog.element.open, modal: dialog.element.matches(":modal") };
        });
      }

      await build({}, false);
      await open();
      await page.evaluate(() => {
        const w = window as unknown as Win & { mtrl: Factories };
        w.__menu = w.mtrl.createMenu({ opener: document.getElementById("inside") as HTMLElement, items: [{ id: "copy", text: "Copy" }] });
      });
      await wait(100);
      await page.click("#inside");
      await wait(500);
      const withMenu = (): Promise<{ dialog: boolean; menu: boolean }> =>
        page.evaluate(() => {
          const w = window as unknown as Win;
          return { dialog: (w.__overlay as { isOpen: () => boolean }).isOpen(), menu: (w.__menu as { isOpen: () => boolean }).isOpen() };
        });
      result.menuOpened = await withMenu();
      await escape();
      result.afterOneEscape = await withMenu();
      await escape();
      result.afterTwoEscapes = await withMenu();
      await page.evaluate(() => {
        const w = window as unknown as Win;
        (w.__menu as { destroy: () => void }).destroy();
        (w.__overlay as { destroy: () => void }).destroy();
      });
      return result;
    };
    const escapesExpected = {
      fromAChild: { open: false, visible: false, beforeclose: 1, close: 1 },
      focusOnBody: true,
      fromTheBody: { open: false, visible: false, beforeclose: 2, close: 2 },
      refusedByOption: { open: true, visible: true, beforeclose: 0, close: 0 },
      refusedByBeforeclose: { open: true, visible: true, beforeclose: 5, close: 0 },
      menuOpened: { dialog: true, menu: true },
      afterOneEscape: { dialog: true, menu: false },
      afterTwoEscapes: { dialog: false, menu: false },
    };
    assert.deepEqual(
      { default: await dialogEscapes(), top: await dialogEscapes("top") },
      {
        default: escapesExpected,
        top: {
          ...escapesExpected,
          forced: { open: false, visible: false, beforeclose: 5, close: 1, overflow: "", inert: 0, focus: "opener" },
          opensAgain: { open: true, native: true, modal: true },
        },
      },
      "a dialog's Escape as a key press: from a child and from the body, refused for five presses, a menu inside it first, a forced close, in both layers",
    );
    check("dialog: Escape closes it from a child and from the body, a refusal holds for five presses, a menu inside takes the key first, and a forced close leaves the page clean");

    // Which event is "the one that opened it" (FLO-548): the one whose dispatch
    // had begun when open() ran, told by a capture listener on the window that
    // numbers events, not by time or by the task. Each form opens a dialog from
    // an Escape keydown and then sends a second one in the same task: the first
    // must leave it open, the second must close it. From a child, from the
    // body, from the page's own window listener in both phases, from inside a
    // shadow root; after a promise (nothing is in flight: the first key closes);
    // and a second and a third dialog opened while another is open. The keys
    // are dispatched by script, which follows the same dispatch as a real one;
    // real key presses are the case above and the adapters' checks.
    const openingEvent = (layer?: "top"): Promise<Record<string, unknown>> =>
      page.evaluate(async (layer) => {
        const w = window as unknown as Win & { mtrl: Factories };
        type Dialog = { open: () => unknown; isOpen: () => boolean; destroy: () => void; element: HTMLElement };
        const key = (): KeyboardEvent => new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true });
        const make = (): Dialog =>
          w.mtrl.createDialog({ title: "Discard draft?", content: `<button type="button">Inside</button>`, ...(layer ? { layer } : {}) }) as unknown as Dialog;
        const opener = document.getElementById("opener") as HTMLElement;
        const result: Record<string, unknown> = {};
        const from = (name: string, arrange: (open: () => void) => EventTarget): void => {
          const dialog = make();
          arrange(() => void dialog.open()).dispatchEvent(key());
          const afterTheKeyThatOpenedIt = dialog.isOpen();
          document.body.dispatchEvent(key());
          result[name] = { afterTheKeyThatOpenedIt, afterAKeyInTheSameTask: dialog.isOpen() };
          dialog.destroy();
        };
        from("aChild", (open) => { opener.addEventListener("keydown", open, { once: true }); return opener; });
        from("theBody", (open) => { document.body.addEventListener("keydown", open, { once: true }); return document.body; });
        from("theWindowInCapture", (open) => { window.addEventListener("keydown", open, { once: true, capture: true }); return opener; });
        from("theWindowInBubble", (open) => { window.addEventListener("keydown", open, { once: true }); return opener; });
        const host = document.body.appendChild(document.createElement("div"));
        const inner = host.attachShadow({ mode: "open" }).appendChild(document.createElement("button"));
        from("aShadowRoot", (open) => { inner.addEventListener("keydown", open, { once: true }); return inner; });
        host.remove();

        // Opened late: the key press is over when the dialog opens
        const late = make();
        opener.addEventListener("keydown", () => void Promise.resolve().then(() => new Promise((r) => setTimeout(r, 0))).then(() => late.open()), { once: true });
        opener.dispatchEvent(key());
        await new Promise((r) => setTimeout(r, 50));
        const lateOpened = late.isOpen();
        document.body.dispatchEvent(key());
        result.afterAPromise = { opened: lateOpened, afterTheFirstKey: late.isOpen() };
        late.destroy();

        // A second and a third, each opened by a key while the others are open
        const stack = [make(), make(), make()];
        const states = (): boolean[] => stack.map((dialog) => dialog.isOpen());
        stack[0].open();
        const steps: boolean[][] = [];
        for (const next of [stack[1], stack[2]]) {
          opener.addEventListener("keydown", () => void next.open(), { once: true });
          opener.dispatchEvent(key());
          steps.push(states());
        }
        for (let i = 0; i < 3; i++) {
          document.body.dispatchEvent(key());
          steps.push(states());
        }
        result.stacked = steps;
        stack.forEach((dialog) => dialog.destroy());
        return result;
      }, layer);
    const opened = { afterTheKeyThatOpenedIt: true, afterAKeyInTheSameTask: false };
    const openingExpected = {
      aChild: opened, theBody: opened, theWindowInCapture: opened, theWindowInBubble: opened, aShadowRoot: opened,
      afterAPromise: { opened: true, afterTheFirstKey: false },
      stacked: [[true, true, false], [true, true, true], [true, true, false], [true, false, false], [false, false, false]],
    };
    await fresh(page, `<button id="opener" type="button">Open</button>`);
    assert.deepEqual(
      { default: await openingEvent(), top: await openingEvent("top") },
      { default: openingExpected, top: openingExpected },
      "the event that opened a dialog is the only one it ignores, in both layers",
    );
    check("dialog: only the event in flight when open() ran is ignored: from a child, the body, the window's listeners, a shadow root, after a promise, and with other dialogs open");

    // The same for the modal sheets and the modal drawer (FLO-548 family 6 B):
    // Escape as a key press, from wherever focus is; a refusal held for five
    // presses; the key press that opened it; and, in the top layer, a close
    // the browser makes without asking, after which it opens again. Every
    // kind and layer is read before the assertion.
    const modalEscapes = async (kind: "createBottomSheet" | "createSideSheet" | "createDrawer", layer?: "top"): Promise<Record<string, unknown>> => {
      await fresh(page, `<button id="opener" type="button">Open</button>`);
      const build = (refuses: boolean): Promise<void> =>
        page.evaluate(({ kind, layer, refuses }) => {
          const w = window as unknown as Win & { mtrl: Factories };
          (w.__overlay as { destroy?: () => void } | undefined)?.destroy?.();
          const refusal = kind === "createDrawer" ? { dismissible: false } : { closeOnEscape: false };
          const modal = w.mtrl[kind]({
            ...(kind === "createDrawer" ? { variant: "modal", items: [{ id: "a", label: "Inbox" }] } : { title: "Share" }),
            ...(layer ? { layer } : {}),
            ...(refuses ? refusal : {}),
          });
          if (!modal.element.isConnected) document.body.append(modal.element);
          w.__overlay = modal;
        }, { kind, layer, refuses });
      const isOpen = (): Promise<boolean> =>
        page.evaluate(() => ((window as unknown as Win).__overlay as { isOpen: () => boolean }).isOpen());
      const open = async (): Promise<void> => {
        await page.focus("#opener");
        await page.evaluate(() => void ((window as unknown as Win).__overlay as { open: () => unknown }).open());
        await wait(500);
      };
      const escape = async (times = 1): Promise<void> => {
        for (let i = 0; i < times; i++) {
          await page.keyboard.press("Escape");
          await wait(80);
        }
        await wait(400);
      };
      const result: Record<string, unknown> = {};

      await build(false);
      await open();
      await escape();
      result.whereFocusLanded = await isOpen();
      await open();
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await escape();
      result.fromTheBody = await isOpen();

      await build(true);
      await open();
      await escape(5);
      result.refusedFiveTimes = await isOpen();

      if (layer) {
        await page.evaluate(() => ((window as unknown as Win).__overlay as { element: HTMLDialogElement }).element.close());
        await wait(500);
        result.forced = { open: await isOpen(), overflow: await page.evaluate(() => document.body.style.overflow) };
        await open();
        result.opensAgain = await isOpen();
      }

      await build(false);
      await page.evaluate(() => {
        const modal = (window as unknown as Win).__overlay as { open: () => unknown };
        (document.getElementById("opener") as HTMLElement).addEventListener("keydown", (event) => {
          if (event.key === "Escape") modal.open();
        }, { once: true });
      });
      await page.focus("#opener");
      await escape();
      result.afterTheKeyThatOpenedIt = await isOpen();
      await escape();
      result.afterTheNextEscape = await isOpen();
      await page.evaluate(() => void ((window as unknown as Win).__overlay as { destroy: () => unknown }).destroy());
      return result;
    };
    const modalExpected = { whereFocusLanded: false, fromTheBody: false, refusedFiveTimes: true, afterTheKeyThatOpenedIt: true, afterTheNextEscape: false };
    const modalTopExpected = { ...modalExpected, forced: { open: false, overflow: "" }, opensAgain: true };
    const modalResults: Record<string, unknown> = {};
    const modalWanted: Record<string, unknown> = {};
    for (const kind of ["createBottomSheet", "createSideSheet", "createDrawer"] as const) {
      modalResults[kind] = await modalEscapes(kind);
      modalResults[`${kind}, top`] = await modalEscapes(kind, "top");
      modalWanted[kind] = modalExpected;
      modalWanted[`${kind}, top`] = modalTopExpected;
    }
    assert.deepEqual(modalResults, modalWanted, "Escape as a key press for the modal sheets and the modal drawer, in both layers");
    check("sheets and drawer: Escape closes a modal one from wherever focus is, a refusal holds for five presses, the key press that opened it does not close it, and a forced close is followed");

    // The same sentence for the menu (FLO-548): its click-outside and Escape
    // listeners are added inside open(). A button that is not the menu's
    // opener opens it by code, from a click and from an Escape keydown: that
    // event is still on its way up to the document. Every form is read before
    // the assertion, so a failure shows which ones disagree.
    const menuOpenedBy = async (how: "click" | "Escape", layer?: "top"): Promise<{ afterTheEventThatOpenedIt: boolean; afterTheNextOne: boolean }> => {
      await fresh(page, `<button id="opener" type="button">More</button><button id="other" type="button">Other</button>`);
      await page.evaluate(({ how, layer }) => {
        const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
        const menu = mtrl.createMenu({
          opener: document.getElementById("opener") as HTMLElement,
          items: [{ id: "copy", text: "Copy" }, { id: "paste", text: "Paste" }],
          ...(layer ? { layer } : {}),
        });
        (window as unknown as Win).__overlay = menu;
        const other = document.getElementById("other") as HTMLElement;
        if (how === "click") other.addEventListener("click", () => void menu.open());
        else other.addEventListener("keydown", (event) => { if (event.key === "Escape") menu.open(event); });
      }, { how, layer });
      const isOpen = (): Promise<boolean> =>
        page.evaluate(() => ((window as unknown as Win).__overlay as { isOpen: () => boolean }).isOpen());
      if (how === "click") await page.click("#other");
      else {
        await page.focus("#other");
        await page.keyboard.press("Escape");
      }
      await wait(400);
      const afterTheEventThatOpenedIt = await isOpen();
      // The next one: a click on the page beside the menu, or Escape again
      if (how === "click") await page.mouse.click(700, 600);
      else await page.keyboard.press("Escape");
      await until(async () => !(await isOpen()));
      const afterTheNextOne = await isOpen();
      await page.evaluate(() => void ((window as unknown as Win).__overlay as { destroy: () => unknown }).destroy());
      return { afterTheEventThatOpenedIt, afterTheNextOne };
    };
    const stayed = { afterTheEventThatOpenedIt: true, afterTheNextOne: false };
    assert.deepEqual(
      {
        click: await menuOpenedBy("click"),
        clickTop: await menuOpenedBy("click", "top"),
        escape: await menuOpenedBy("Escape"),
        escapeTop: await menuOpenedBy("Escape", "top"),
      },
      { click: stayed, clickTop: stayed, escape: stayed, escapeTop: stayed },
      "a menu opened by code from a click or an Escape keydown: open after that event, closed by the next one, in both layers",
    );
    check("menu: the click or the key press that opened it does not dismiss it, and the next one does, in both layers");
    await returnsFocus("bottom sheet", "createBottomSheet");
    check("factories in a shadow root: a modal bottom sheet returns focus to its opener inside the shadow root");
    await returnsFocus("side sheet", "createSideSheet");
    check("factories in a shadow root: a modal side sheet returns focus to its opener inside the shadow root");

    await stage();
    await page.evaluate(() => {
      const root = document.getElementById("shadow")?.shadowRoot as ShadowRoot;
      const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
      const search = mtrl.createSearch({ placeholder: "Search", collapseOnBlur: true });
      (root.getElementById("mount") as HTMLElement).append(search.element);
      (window as unknown as Win).__search = search;
    });
    const input = page.locator("#shadow input:not(#first)").first();
    const isExpanded = (): Promise<boolean> => page.evaluate(() => ((window as unknown as Win).__search as { isExpanded: () => boolean }).isExpanded());
    await input.focus();
    await wait(50);
    // Expanding puts focus back on the input in the next frame: let that frame run
    // before focus is moved away on purpose.
    await until(isExpanded);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    // Focus leaves and comes back within the collapse delay: still expanded.
    await page.locator("#shadow #first").focus();
    await input.focus();
    await wait(300);
    const expanded = await page.evaluate(() => ((window as unknown as Win).__search as { isExpanded: () => boolean }).isExpanded());
    await page.locator("#shadow #first").focus();
    await wait(300);
    await until(async () => !(await isExpanded()));
    const collapsed = await page.evaluate(() => !((window as unknown as Win).__search as { isExpanded: () => boolean }).isExpanded());
    assert.deepEqual({ expanded, collapsed }, { expanded: true, collapsed: true });
    check("factories in a shadow root: search stays expanded when focus comes back in time, and collapses when it leaves");

    // Focus by item id, then id, then text: where Tab lands inside the shadow root.
    const landed = (): Promise<string | null | undefined> =>
      page.evaluate(() => {
        const active = document.getElementById("shadow")?.shadowRoot?.activeElement as HTMLElement | null | undefined;
        return active ? active.dataset.id || active.id || active.getAttribute("aria-label") || active.textContent?.trim() : null;
      });
    const tabs = async (keys: string[]): Promise<unknown[]> => {
      const seen: unknown[] = [];
      for (const key of keys) {
        await page.keyboard.press(key);
        seen.push(await landed());
      }
      return seen;
    };

    await stage();
    await page.evaluate(() => {
      const root = document.getElementById("shadow")?.shadowRoot as ShadowRoot;
      const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
      const drawer = mtrl.createDrawer({
        variant: "modal",
        items: [{ id: "a", label: "Inbox" }, { id: "b", label: "Sent" }, { id: "c", label: "Trash" }],
      });
      (root.getElementById("mount") as HTMLElement).append(drawer.element);
      (window as unknown as Win).__overlay = drawer;
      (root.getElementById("opener") as HTMLElement).addEventListener("click", () => void drawer.open());
    });
    await page.locator("#shadow").getByRole("button", { name: "Open", exact: true }).click();
    await wait(100);
    await until(async () => (await landed()) === "a");
    const drawerTabs = [await landed(), ...(await tabs(["Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab"]))];
    await page.evaluate(() => void ((window as unknown as Win).__overlay as { close: () => unknown }).close());
    await wait(100);
    await until(async () => (await landed()) === "opener");
    assert.deepEqual({ drawerTabs, back: await landed() }, { drawerTabs: ["a", "b", "c", "a", "c", "b"], back: "opener" });
    check("factories in a shadow root: a modal drawer keeps Tab inside and returns focus to its opener");

    await stage();
    await page.evaluate((icon) => {
      const root = document.getElementById("shadow")?.shadowRoot as ShadowRoot;
      const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
      const rail = mtrl.createNavigationRail({
        layout: "modal",
        items: [{ id: "a", label: "Inbox", icon }, { id: "b", label: "Sent", icon }],
      });
      (root.getElementById("mount") as HTMLElement).append(rail.element);
      (window as unknown as Win).__overlay = rail;
      rail.expand();
    }, ICON);
    await wait(100);
    const railStops = await page.evaluate(() => {
      const rail = (window as unknown as Win).__overlay as { element: HTMLElement };
      return [...rail.element.querySelectorAll<HTMLElement>("button, a[href]")].filter((el) => el.tabIndex >= 0).length;
    });
    await page.evaluate(() => {
      const rail = (window as unknown as Win).__overlay as { element: HTMLElement };
      (rail.element.querySelector("[data-id='a']") as HTMLElement).focus();
    });
    // Tab past the last stop and back: it wraps to the first, and Shift+Tab to the last.
    const railTabs = await tabs(Array.from({ length: railStops }, () => "Tab"));
    const railBack = await tabs(["Shift+Tab"]);
    assert.equal(railTabs.at(-1), "a", `Tab wraps to the first stop: ${JSON.stringify(railTabs)}`);
    assert.deepEqual(railBack, [railTabs.at(-2)], "Shift+Tab goes back to the last stop");
    check("factories in a shadow root: a modal rail keeps Tab inside");

    await stage();
    await page.evaluate(() => {
      const mtrl = (window as unknown as { mtrl: Factories }).mtrl;
      const snackbar = mtrl.createSnackbar({ message: "Archived", action: "Undo", duration: 10_000 });
      (window as unknown as Win).__overlay = snackbar;
      const opener = document.getElementById("shadow")?.shadowRoot?.getElementById("opener") as HTMLElement;
      opener.addEventListener("click", () => void snackbar.show());
    });
    await page.locator("#shadow").getByRole("button", { name: "Open", exact: true }).click();
    await wait(100);
    const undo = page.getByRole("button", { name: "Undo", exact: true });
    await undo.focus();
    const reached = await page.evaluate(() => document.activeElement?.textContent?.trim());
    await page.keyboard.press("Enter");
    await wait(100);
    assert.deepEqual({ reached, back: await landed() }, { reached: "Undo", back: "opener" });
    check("factories in a shadow root: a snackbar's action takes focus and hands it back to the opener");
  }

  // ---------------------------------------------------------------- menu in the top layer
  // `layer: "top"` renders the menu next to its opener and shows it as a
  // popover: inside the opener's shadow root, with that root's adopted menu
  // CSS, above a z-index 9999 sibling, out of a clipping parent, and at the
  // place a menu without a layer opens. Checked in a shadow root and in light DOM.
  {
    type TopMenu = {
      element: HTMLElement;
      open: (event?: Event) => unknown;
      close: () => unknown;
      isOpen: () => boolean;
      destroy: () => void;
      on: (name: string, handler: (event: unknown) => void) => unknown;
    };
    type TopWin = Win & {
      mtrl: {
        createMenu: (config: object) => TopMenu;
        registerStyles: (css: Record<string, string>) => void;
        applyStyles: (root: ShadowRoot, names: string[]) => void;
      };
      __tl: { menu: TopMenu; closes: number; root: Document | ShadowRoot };
    };
    const menuCss = await (await fetch(`http://127.0.0.1:${server.port}/menu.css`)).text();
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);

    const stage = async (shadow: boolean): Promise<void> => {
      await fresh(page, `<div style="height: 500px"></div><div id="tl"></div><div style="height: 2000px"></div>`);
      await page.evaluate(({ shadow, css }) => {
        const w = window as unknown as TopWin;
        const host = document.getElementById("tl") as HTMLElement;
        let root: ShadowRoot | HTMLElement = host;
        if (shadow) {
          root = host.attachShadow({ mode: "open" });
          w.mtrl.registerStyles({ menu: css });
          w.mtrl.applyStyles(root, ["menu"]);
        }
        // The opener in a clipping parent, and after it a sibling on z-index 9999
        // where the menu opens
        root.innerHTML = `<div style="position: relative; overflow: hidden; height: 48px; z-index: 1">
            <button id="tl-opener" type="button" style="margin-left: 40px">Open</button></div>
          <div id="tl-cover" style="position: relative; z-index: 9999; height: 400px; background: rgb(255, 0, 0)"></div>
          <button id="tl-outside" type="button">Outside</button>`;
        window.scrollTo(0, 300);
      }, { shadow, css: menuCss });
    };

    const ITEMS = [
      { id: "share", text: "Share", hasSubmenu: true, submenu: [{ id: "link", text: "Copy link" }, { id: "mail", text: "Email" }] },
      { id: "copy", text: "Copy" },
      { id: "paste", text: "Paste" },
    ];

    /** Mounts a menu on the stage's opener; the top layer when asked. */
    const mount = (layer: "top" | undefined, items = ITEMS): Promise<void> =>
      page.evaluate(({ layer, items }) => {
        const w = window as unknown as TopWin;
        const host = document.getElementById("tl") as HTMLElement;
        const root = host.shadowRoot ?? document;
        const opener = (host.shadowRoot ?? host).querySelector("#tl-opener") as HTMLElement;
        w.__tl?.menu.destroy();
        const menu = w.mtrl.createMenu({ opener, items, ...(layer ? { layer } : {}) });
        w.__tl = { menu, closes: 0, root };
        menu.on("close", () => void w.__tl.closes++);
      }, { layer, items });

    // The menu finishes what it starts on timers and frames of its own: it takes focus
    // 120ms after it opens, gives it back to the opener in the frame after "close",
    // leaves the document 350ms after closing, and a submenu takes focus a frame and
    // 300ms after it opens. The fixed waits in this block were only long enough for
    // those; on a runner that paused, the read or the next key came first. Each fixed
    // wait stays (it also lets a second, unwanted close show), and `eventually` then
    // waits for the state the next step depends on, for 5s at most. When that state
    // never comes, the failure says where, what was awaited and what was there
    // instead, as the assertion's own diff would have.
    let place = "";
    const eventually = async (what: string, ready: () => Promise<boolean>): Promise<void> => {
      for (const end = Date.now() + 5000; !(await ready());) {
        if (Date.now() > end) {
          const found = { ...(await state()), item: await focusedItem(), submenus: await submenus() };
          // What the state above cannot tell (FLO-551: open and connected, with no focus):
          // whether the surface is shown and focusable, and whether the page reported errors.
          const surface = await page.evaluate(() => {
            const element = (window as unknown as TopWin).__tl.menu.element;
            const style = getComputedStyle(element);
            let inert: string | null = null;
            for (let node: Element | null = element; node && !inert; node = node.parentElement ?? (node.getRootNode() as Partial<ShadowRoot>).host ?? null) {
              if (node.hasAttribute("inert")) inert = node.id || node.localName;
            }
            return {
              popoverOpen: element.matches(":popover-open"), visibleClass: element.classList.contains("mtrl-menu--visible"),
              ariaHidden: element.getAttribute("aria-hidden"), inline: element.style.cssText, tabindex: element.getAttribute("tabindex"),
              display: style.display, visibility: style.visibility, opacity: style.opacity, inert,
              documentHasFocus: document.hasFocus(), active: document.activeElement?.localName ?? null,
            };
          });
          throw new Error(`menu top layer ${place}: still waiting after 5s for ${what}; found ${JSON.stringify(found)}; surface ${JSON.stringify(surface)}; page errors ${JSON.stringify(errors)}`);
        }
        await wait(20);
      }
    };
    const openMenu = async (): Promise<void> => {
      await page.evaluate(() => void (window as unknown as TopWin).__tl.menu.open());
      // Positioned on a timer, then the 300ms open transition
      await wait(450);
      await eventually("the open menu to take focus", () => page.evaluate(() => {
        const { element } = (window as unknown as TopWin).__tl.menu;
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return !!active && element.contains(active);
      }));
    };
    const state = (): Promise<{ open: boolean; closes: number; connected: boolean; focus: string | null }> =>
      page.evaluate(() => {
        const { menu, closes } = (window as unknown as TopWin).__tl;
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return { open: menu.isOpen(), closes, connected: menu.element.isConnected, focus: active?.id || null };
      });
    const focusedItem = (): Promise<string | null> =>
      page.evaluate(() => {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return active?.getAttribute("data-id") ?? null;
      });
    const submenus = (): Promise<number> =>
      page.evaluate(() => (window as unknown as TopWin).__tl.root.querySelectorAll('[class*="menu--submenu"]').length);
    /** The closed state a step expects, once the menu's own timers and frame have run. */
    const settled = (wanted: Partial<Awaited<ReturnType<typeof state>>>): Promise<void> =>
      eventually(`the menu to settle as ${JSON.stringify(wanted)}`, async () => {
        const now = await state();
        return (Object.keys(wanted) as (keyof typeof wanted)[]).every(key => now[key] === wanted[key]);
      });
    const center = (selector: string): Promise<{ x: number; y: number }> =>
      page.evaluate((selector) => {
        const { root, menu } = (window as unknown as TopWin).__tl;
        const el = (selector === "menu" ? menu.element : root.querySelector(selector)) as HTMLElement;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, selector);

    for (const shadow of [true, false]) {
      const where = shadow ? "in a shadow root" : "in light DOM";
      place = where;

      // Where a menu without a layer opens, the global stylesheet on the body
      await stage(shadow);
      await mount(undefined);
      await openMenu();
      const expected = await page.evaluate(() => {
        const { element } = (window as unknown as TopWin).__tl.menu;
        const { top, left, width, height } = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { top, left, width, height, background: style.backgroundColor, shadow: style.boxShadow };
      });
      await page.evaluate(() => void (window as unknown as TopWin).__tl.menu.close());
      await wait(450);

      await mount("top");
      await openMenu();
      const shown = await page.evaluate(() => {
        const { menu, root } = (window as unknown as TopWin).__tl;
        const element = menu.element;
        const r = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const hit = root.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const opener = root.querySelector("#tl-opener") as HTMLElement;
        return {
          inRoot: element.getRootNode() === root,
          besideOpener: opener.nextElementSibling === element,
          popoverOpen: element.matches(":popover-open"),
          rect: { top: r.top, left: r.left, width: r.width, height: r.height },
          background: style.backgroundColor,
          shadow: style.boxShadow,
          border: style.borderTopWidth,
          margin: style.marginTop,
          aboveCover: !!hit && element.contains(hit),
          scrolled: window.scrollY,
        };
      });
      assert.equal(shown.inRoot, true, `${where}: the surface is in the opener's root`);
      assert.equal(shown.besideOpener, true, `${where}: the surface is next to its opener`);
      assert.equal(shown.popoverOpen, true, `${where}: the surface is :popover-open`);
      assert.equal(shown.scrolled, 300, "the page is scrolled");
      for (const key of ["top", "left", "width", "height"] as const) {
        assert.ok(Math.abs(shown.rect[key] - expected[key]) <= 1, `${where}: ${key} ${shown.rect[key]} is the unlayered menu's ${expected[key]}`);
      }
      assert.deepEqual(
        { background: shown.background, shadow: shown.shadow, border: shown.border, margin: shown.margin },
        { background: expected.background, shadow: expected.shadow, border: "0px", margin: "0px" },
        `${where}: the menu's own colour and elevation, not the popover defaults`
      );
      assert.notEqual(shown.shadow, "none", "the elevation is drawn");
      assert.equal(shown.aboveCover, true, `${where}: the menu is above the z-index 9999 sibling`);
      check(`menu top layer ${where}: in its opener's root, styled, at the unlayered position with the page scrolled, above z-index 9999`);

      // A click outside: on the cover, beside the menu
      const cover = await page.evaluate(() => {
        const { root, menu } = (window as unknown as TopWin).__tl;
        const r = (root.querySelector("#tl-cover") as HTMLElement).getBoundingClientRect();
        return { x: menu.element.getBoundingClientRect().right + 100, y: r.top + 150 };
      });
      await page.mouse.click(cover.x, cover.y);
      await wait(450);
      await settled({ closes: 1, connected: false });
      assert.deepEqual(await state(), { open: false, closes: 1, connected: false, focus: null }, `${where}: a click outside`);

      // Escape, focus back on the opener
      await openMenu();
      await page.keyboard.press("Escape");
      await wait(450);
      await settled({ connected: false, focus: "tl-opener" });
      assert.deepEqual(await state(), { open: false, closes: 2, connected: false, focus: "tl-opener" }, `${where}: Escape`);

      // An item
      await openMenu();
      const copy = await center('[data-id="copy"]');
      await page.mouse.click(copy.x, copy.y);
      await wait(450);
      await settled({ connected: false, focus: "tl-opener" });
      assert.deepEqual(await state(), { open: false, closes: 3, connected: false, focus: "tl-opener" }, `${where}: an item`);

      // Two dismissals at once: the opener has focus when the pointer goes
      // down outside, so its blur and the click both close the menu
      await openMenu();
      await page.evaluate(() => {
        const { root } = (window as unknown as TopWin).__tl;
        (root.querySelector("#tl-opener") as HTMLElement).focus();
      });
      const outside = await center("#tl-outside");
      await page.mouse.click(outside.x, outside.y, { delay: 70 });
      await wait(450);
      await settled({ closes: 4, connected: false });
      assert.deepEqual(await state(), { open: false, closes: 4, connected: false, focus: "tl-outside" }, `${where}: blur and click`);

      // Taken out of the top layer by something else
      await openMenu();
      await page.evaluate(() => (window as unknown as TopWin).__tl.menu.element.hidePopover());
      await wait(450);
      await settled({ closes: 5, open: false });
      assert.deepEqual((await state()).closes, 5, `${where}: hidePopover from outside`);
      assert.equal((await state()).open, false);
      check(`menu top layer ${where}: a click outside, Escape, an item, blur with a click and hidePopover each close it once`);

      // A submenu: above the menu and the cover, the menu still open; Escape
      // closes the submenu, then the menu
      await openMenu();
      const share = await center('[data-id="share"]');
      await page.mouse.click(share.x, share.y);
      await wait(450);
      // Escape below goes to whatever has focus: the submenu's first item, once it has it.
      await eventually("the submenu to take focus", async () => (await focusedItem()) === "link");
      const nested = await page.evaluate(() => {
        const { menu, root } = (window as unknown as TopWin).__tl;
        const submenu = root.querySelector('[class*="menu--submenu"]') as HTMLElement | null;
        if (!submenu) return null;
        const r = submenu.getBoundingClientRect();
        const hit = root.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const style = getComputedStyle(submenu);
        return {
          inRoot: submenu.getRootNode() === root,
          open: [menu.element.matches(":popover-open"), submenu.matches(":popover-open")],
          above: !!hit && submenu.contains(hit),
          styled: style.backgroundColor === getComputedStyle(menu.element).backgroundColor && style.boxShadow !== "none",
          beside: Math.round(r.left) >= Math.round(menu.element.getBoundingClientRect().right),
        };
      });
      assert.deepEqual(nested, { inRoot: true, open: [true, true], above: true, styled: true, beside: true }, `${where}: the submenu`);
      await page.keyboard.press("Escape");
      await wait(300);
      await eventually("the submenu to close", async () => (await submenus()) === 0);
      const afterOne = await page.evaluate(() => {
        const { menu, root } = (window as unknown as TopWin).__tl;
        return { menu: menu.isOpen(), submenus: root.querySelectorAll('[class*="menu--submenu"]').length };
      });
      assert.deepEqual(afterOne, { menu: true, submenus: 0 }, `${where}: Escape closes the submenu only`);
      await page.keyboard.press("Escape");
      await wait(450);
      await settled({ connected: false, focus: "tl-opener" });
      assert.deepEqual(await state(), { open: false, closes: 6, connected: false, focus: "tl-opener" }, `${where}: then the menu`);

      // An item of the submenu closes both, once
      await openMenu();
      await page.mouse.click(share.x, share.y);
      await wait(450);
      const link = await center('[data-id="link"]');
      await page.mouse.click(link.x, link.y);
      await wait(450);
      await settled({ connected: false, focus: "tl-opener" });
      const both = await page.evaluate(() => (window as unknown as TopWin).__tl.root.querySelectorAll('[class*="mtrl-menu"]').length);
      assert.deepEqual({ ...(await state()), both }, { open: false, closes: 7, connected: false, focus: "tl-opener", both: 0 }, `${where}: a submenu item`);
      check(`menu top layer ${where}: a submenu opens above it, Escape closes it then the menu, and its item closes both once`);

      // By key and by hover. The submenu is a feature the menu loads on
      // demand (FLO-310); each way in must reach it. Opened by key, Share
      // has focus: ArrowRight opens its submenu on the first item, ArrowLeft
      // closes it and goes back to Share. Resting the pointer on Share opens it.
      await page.evaluate(() => void (window as unknown as TopWin).__tl.menu.open(new KeyboardEvent("keydown")));
      await wait(450);
      await eventually("focus on Share, the first item", async () => (await focusedItem()) === "share");
      assert.equal(await focusedItem(), "share", `${where}: opened by key, Share has focus`);
      await page.keyboard.press("ArrowRight");
      await wait(450);
      await eventually("focus on the submenu's first item", async () => (await focusedItem()) === "link");
      assert.deepEqual({ submenus: await submenus(), focus: await focusedItem() }, { submenus: 1, focus: "link" }, `${where}: ArrowRight`);
      await page.keyboard.press("ArrowLeft");
      await wait(300);
      await eventually("the submenu to close and focus to return to Share", async () => (await submenus()) === 0 && (await focusedItem()) === "share");
      assert.deepEqual({ submenus: await submenus(), focus: await focusedItem() }, { submenus: 0, focus: "share" }, `${where}: ArrowLeft`);
      await page.keyboard.press("Escape");
      await wait(450);
      await settled({ open: false, connected: false });
      assert.equal((await state()).open, false, `${where}: Escape closes the menu`);
      await openMenu();
      const hovered = await center('[data-id="share"]');
      await page.mouse.move(hovered.x, hovered.y);
      // The hover intent, then the transition
      await wait(550);
      await eventually("the hovered item's submenu", async () => (await submenus()) === 1);
      assert.equal(await submenus(), 1, `${where}: a hover on Share opens its submenu`);
      await page.mouse.move(0, 0);
      check(`menu top layer ${where}: ArrowRight opens the submenu on its first item, ArrowLeft returns to Share, a hover opens it`);

      // An item id is data, including characters with meaning in CSS selectors.
      const quoted = 'share"quoted';
      await mount("top", [{ ...ITEMS[0], id: quoted }, ...ITEMS.slice(1)]);
      await page.evaluate(() => void (window as unknown as TopWin).__tl.menu.open(new KeyboardEvent("keydown")));
      await wait(450);
      await eventually("focus on the quoted id, the first item", async () => (await focusedItem()) === quoted);
      assert.equal(await focusedItem(), quoted, `${where}: quoted parent id has focus`);
      await page.keyboard.press("ArrowRight");
      await wait(450);
      await eventually("focus on the submenu's first item", async () => (await focusedItem()) === "link");
      assert.deepEqual({ submenus: await submenus(), focus: await focusedItem() }, { submenus: 1, focus: "link" }, `${where}: quoted id opens its submenu`);
      await page.keyboard.press("ArrowLeft");
      await wait(300);
      await eventually("the submenu to close and focus to return to the quoted id", async () => (await submenus()) === 0 && (await focusedItem()) === quoted);
      assert.deepEqual({ submenus: await submenus(), focus: await focusedItem() }, { submenus: 0, focus: quoted }, `${where}: ArrowLeft returns to the quoted id`);
      check(`menu top layer ${where}: quoted item id survives ArrowRight and ArrowLeft`);

      // ArrowUp on the opener opens the menu on its last item (FLO-524), for the
      // factory, in a shadow root and in light DOM. The opener puts focus there
      // 100ms after the key; the menu's own initial focus, 20ms later, used to move
      // it to the first item. The fixed wait is the assertion: focus is still on the
      // last item once every opening timer has run.
      await mount("top");
      await page.evaluate(() => ((window as unknown as TopWin).__tl.root.querySelector("#tl-opener") as HTMLElement).focus());
      await page.keyboard.press("ArrowUp");
      await wait(450);
      assert.deepEqual({ open: (await state()).open, focus: await focusedItem() }, { open: true, focus: "paste" }, `${where}: ArrowUp on the opener opens on the last item, and focus stays there`);
      await page.keyboard.press("Escape");
      await wait(450);
      assert.equal((await state()).open, false, `${where}: Escape closes the menu opened with ArrowUp`);
      check(`menu top layer ${where}: ArrowUp on the opener opens it on the last item`);

      await page.evaluate(() => (window as unknown as TopWin).__tl.menu.destroy());
    }
  }

  // ---------------------------------------------------------------- FAB menu (FLO-306)
  await fresh(
    page,
    `<div class="stage" style="padding-top:260px"><button id="fm-before">Before</button>
     <m-fab-menu id="fm" presentation="list" icon='${ICON}' aria-label="Compose">
       <m-fab-menu-item value="reply" icon='${ICON}'>Reply</m-fab-menu-item>
       <m-fab-menu-item value="forward">Forward</m-fab-menu-item>
       <m-fab-menu-item value="archive">Archive</m-fab-menu-item>
     </m-fab-menu>
     <m-fab-menu id="fm2" presentation="menu" icon='${ICON}' aria-label="New">
       <m-fab-menu-item value="doc">Document</m-fab-menu-item>
       <m-fab-menu-item value="sheet">Sheet</m-fab-menu-item>
     </m-fab-menu></div><div class="stage" id="fmstage"></div>`
  );
  {
    type Fm = HTMLElement & { show: () => void; hide: () => void };
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);
    /** The focused element inside a FAB menu: the FAB, an item's text, or the host's id when outside. */
    const focused = (): Promise<string | null> =>
      page.evaluate(() => {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        if (active?.classList.contains("mtrl-fab-menu__fab")) return `fab:${active.getAttribute("aria-label")}`;
        return active ? active.id || (active.textContent ?? "").trim() : null;
      });

    const button = page.getByRole("button", { name: "Compose" });
    assert.equal(await button.getAttribute("aria-haspopup"), "menu");
    assert.equal(await button.getAttribute("aria-expanded"), "false");
    await button.click();
    await wait(500);
    const opened = await page.evaluate(() => {
      const fm = document.getElementById("fm") as Fm;
      const list = fm.shadowRoot?.querySelector("[role=menu]") as HTMLElement;
      const item = list.querySelector("[role=menuitem]") as HTMLElement;
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--mtrl-sys-color-primary-container)";
      document.body.append(probe);
      const container = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        open: fm.hasAttribute("open"),
        visible: getComputedStyle(list).visibility,
        items: list.querySelectorAll("[role=menuitem]").length,
        colour: getComputedStyle(item).backgroundColor === container,
      };
    });
    assert.deepEqual(opened, { open: true, visible: "visible", items: 3, colour: true });
    assert.equal(await focused(), "fab:Compose", "focus stays on the close button");
    assert.equal(await page.getByRole("menuitem", { name: "Reply" }).count(), 1);
    check("FAB menu: the FAB opens a menu of menuitems; open reflects; focus stays on the close button");

    await page.keyboard.press("ArrowDown");
    assert.equal(await focused(), "Reply");
    await page.keyboard.press("ArrowUp");
    assert.equal(await focused(), "Archive", "the arrows wrap");
    await page.keyboard.press("Escape");
    assert.equal(await focused(), "fab:Compose");
    assert.equal(await page.evaluate(() => document.getElementById("fm")!.hasAttribute("open")), false);
    await page.keyboard.press("Enter");
    await wait(100);
    await page.keyboard.press("Tab");
    assert.equal(await focused(), "Reply", "Tab goes into the open list");
    await page.keyboard.press("Tab");
    assert.equal(await focused(), "fab:Compose", "Tab out closes it on the FAB");
    check("FAB menu: arrows and Tab into the list, wrapping; Escape and Tab out close it on the FAB");

    const chosen = await page.evaluate(async () => {
      const fm = document.getElementById("fm") as Fm;
      const seen: unknown[] = [];
      fm.addEventListener("select", (e) => seen.push((e as CustomEvent<{ value: string }>).detail.value));
      fm.show();
      await new Promise((r) => setTimeout(r, 100));
      (fm.shadowRoot?.querySelectorAll("[role=menuitem]")[1] as HTMLElement).click();
      return { seen, open: fm.hasAttribute("open") };
    });
    assert.deepEqual(chosen, { seen: ["forward"], open: false });
    check("FAB menu: choosing an item dispatches select with its value and closes");

    await page.getByRole("button", { name: "New" }).click();
    await wait(400);
    const menu = await page.evaluate(() => {
      const fm = document.getElementById("fm2") as Fm;
      const surface = fm.shadowRoot?.querySelector(".mtrl-menu") as HTMLElement | null;
      const fab = fm.shadowRoot?.querySelector(".mtrl-fab-menu__fab") as HTMLElement;
      if (!surface) return null;
      const s = surface.getBoundingClientRect();
      const f = fab.getBoundingClientRect();
      return {
        open: fm.hasAttribute("open"),
        visible: getComputedStyle(surface).visibility,
        styled: getComputedStyle(surface).backgroundColor !== "rgba(0, 0, 0, 0)",
        gap: Math.round(f.top - s.bottom),
        expanded: fab.getAttribute("aria-expanded"),
      };
    });
    assert.deepEqual(menu, { open: true, visible: "visible", styled: true, gap: 4, expanded: "true" });
    const picked = await page.evaluate(async () => {
      const fm = document.getElementById("fm2") as Fm;
      const seen: unknown[] = [];
      fm.addEventListener("select", (e) => seen.push((e as CustomEvent<{ value: string }>).detail.value));
      (fm.shadowRoot?.querySelectorAll(".mtrl-menu__item")[1] as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 400));
      // The menu's "close" comes with the click since FLO-548 (it came on a 50ms timer),
      // so this loop should find the attribute gone at once; it stays as the guard it
      // was. The assertion below reports an `open` that stayed.
      for (const end = Date.now() + 5000; fm.hasAttribute("open") && Date.now() < end;) await new Promise((r) => setTimeout(r, 20));
      return { seen, open: fm.hasAttribute("open") };
    });
    assert.deepEqual(picked, { seen: ["sheet"], open: false });
    check("FAB menu: presentation=menu loads the baseline menu into its shadow root, 4px above the FAB");

    // FLO-548: `open` by attribute or property is applied in the attribute
    // callback and dispatches nothing; show() and hide() dispatch one event
    // each, and the state and the attribute are there when they return. In the
    // menu presentation too, where the surface comes from a module of its own.
    const openState = await page.evaluate(async () => {
      type Opens = HTMLElement & { open: boolean; show: () => void; hide: () => void; component: { isOpen: () => boolean } };
      const pause = (): Promise<unknown> => new Promise((r) => setTimeout(r, 400));
      const result: Record<string, unknown> = {};
      for (const id of ["fm", "fm2"]) {
        const fm = document.getElementById(id) as Opens;
        const events: string[] = [];
        const note = (e: Event): void => void events.push(e.type);
        fm.addEventListener("open", note);
        fm.addEventListener("close", note);
        fm.setAttribute("open", "");
        const set = fm.component.isOpen();
        fm.removeAttribute("open");
        const removed = fm.component.isOpen();
        fm.open = true;
        const property = fm.component.isOpen();
        fm.open = false;
        await pause();
        const quiet = [...events];
        fm.show();
        const shown = { open: fm.component.isOpen(), attribute: fm.hasAttribute("open") };
        await pause();
        fm.hide();
        const hidden = { open: fm.component.isOpen(), attribute: fm.hasAttribute("open") };
        await pause();
        fm.removeEventListener("open", note);
        fm.removeEventListener("close", note);
        result[id] = { set, removed, property, quiet, shown, hidden, events };
      }
      return result;
    });
    const openExpected = {
      set: true, removed: false, property: true, quiet: [],
      shown: { open: true, attribute: true }, hidden: { open: false, attribute: false }, events: ["open", "close"],
    };
    assert.deepEqual(openState, { fm: openExpected, fm2: openExpected });
    check("FAB menu: the open attribute and property open and close it at once, with no event; show() and hide() with one each, in both presentations");

    const parity = await page.evaluate((icon) => {
      const w = window as unknown as Win & { mtrl: { createFabMenu: (c: object) => { element: HTMLElement; fab: HTMLElement } } };
      const factory = w.mtrl.createFabMenu({ icon, ariaLabel: "Compose", presentation: "list", items: [{ id: "a", text: "A" }, { id: "b", text: "B" }] });
      document.getElementById("fmstage")?.append(factory.element);
      const fm = document.getElementById("fm") as Fm;
      const measure = (fab: HTMLElement): Record<string, string | number> => {
        const r = fab.getBoundingClientRect();
        const style = getComputedStyle(fab);
        return { width: r.width, height: r.height, bg: style.backgroundColor, radius: style.borderTopLeftRadius, shadow: style.boxShadow };
      };
      return { factory: measure(factory.fab), element: measure(fm.shadowRoot?.querySelector(".mtrl-fab-menu__fab") as HTMLElement) };
    }, ICON);
    assert.deepEqual(parity.element, parity.factory);
    check("FAB menu: renders as the factory does with the global stylesheet");

    // FLO-348: the motion, frame by frame. The transitions are paused and seeked,
    // so every frame is read exactly, whatever the machine's speed.
    const motion = await page.evaluate(async () => {
      const fm = document.getElementById("fm") as Fm;
      const root = fm.shadowRoot?.querySelector(".mtrl-fab-menu") as HTMLElement;
      const fab = root.querySelector(".mtrl-fab-menu__fab") as HTMLElement;
      const items = [...root.querySelectorAll<HTMLElement>(".mtrl-fab-menu__item")];
      const rgb = (value: string) => (value.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
      const frame = async (): Promise<unknown[]> => {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const animations = root.getAnimations({ subtree: true });
        const out: unknown[] = [];
        for (let t = 0; t <= 700; t += 20) {
          for (const a of animations) { a.pause(); a.currentTime = t; }
          const style = getComputedStyle(fab);
          out.push({
            radius: parseFloat(style.borderTopLeftRadius),
            bg: rgb(style.backgroundColor),
            items: items.map((item) => {
              const box = item.getBoundingClientRect();
              const content = (item.firstElementChild as HTMLElement).getBoundingClientRect();
              return { width: box.width, height: box.height, radius: parseFloat(getComputedStyle(item).borderTopLeftRadius), endGap: Math.round(box.right - content.right) };
            }),
          });
        }
        for (const a of animations) a.finish();
        return out;
      };
      const closedBg = rgb(getComputedStyle(fab).backgroundColor);
      fm.show();
      const opening = await frame();
      const openBg = rgb(getComputedStyle(fab).backgroundColor);
      fm.hide();
      const closing = await frame();
      return { opening, closing, closedBg, openBg };
    });
    type Frame = { radius: number; bg: number[]; items: { width: number; height: number; radius: number; endGap: number }[] };
    const frames = [...(motion.opening as Frame[]), ...(motion.closing as Frame[])];
    const radii = frames.map((f) => f.radius);
    // 16 → 28dp and back, with the spring's overshoot: never round-by-9999, never square
    assert.ok(Math.min(...radii) >= 14 && Math.max(...radii) <= 30, `close button radius ${Math.min(...radii)}..${Math.max(...radii)}`);
    // Colours stay between their endpoints (the clamped spring)
    for (const channel of [0, 1, 2]) {
      const low = Math.min(motion.closedBg[channel]!, motion.openBg[channel]!) - 1;
      const high = Math.max(motion.closedBg[channel]!, motion.openBg[channel]!) + 1;
      for (const f of frames) assert.ok(f.bg[channel]! >= low && f.bg[channel]! <= high, `colour channel ${channel}: ${f.bg[channel]} outside ${low}..${high}`);
    }
    // Mid-reveal, an item is a pill (radius at least half its height) with its content anchored to the end
    const midway = (motion.opening as Frame[]).flatMap((f) => f.items).filter((item) => item.width > 20 && item.width < 100);
    assert.ok(midway.length > 0, "no item caught mid-reveal");
    for (const item of midway) {
      assert.ok(item.radius >= item.height / 2, `item radius ${item.radius} at width ${item.width}`);
      assert.equal(item.endGap, 0);
    }
    // The width overshoots past the content, as Compose's FastSpatial spring does
    const finals = (motion.opening as Frame[]).at(-1)!.items.map((item) => item.width);
    const peaks = finals.map((_, index) => Math.max(...(motion.opening as Frame[]).map((f) => f.items[index]!.width)));
    assert.ok(peaks.every((peak, index) => peak > finals[index]! * 1.05), `width peaks ${peaks} against ${finals}`);
    check("FAB menu: the close corner lerps to 28px, colours stay in range, items reveal as end-anchored pills with overshoot");
  }

  // ---------------------------------------------------------------- chips right to left (FLO-343 follow-up)
  // <m-chips> renders its chips in a shadow root: a `dir="rtl"` above the host
  // reverses Left and Right there too, which closest("[dir]") did not see.
  await fresh(
    page,
    `<div class="stage" dir="rtl"><m-chips id="rtl-chips" aria-label="Filters">
       <m-chip value="a">Alpha</m-chip><m-chip value="b">Beta</m-chip><m-chip value="c">Gamma</m-chip>
     </m-chips></div>`
  );
  {
    const deep = (): Promise<string> =>
      page.evaluate(() => {
        let active: Element | null = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return (active?.textContent ?? "").trim();
      });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    await page.keyboard.press("Tab");
    await page.evaluate(() => {
      const host = document.getElementById("rtl-chips") as HTMLElement;
      (host.shadowRoot?.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus();
    });
    assert.match(await deep(), /Alpha/);
    await page.keyboard.press("ArrowLeft");
    assert.match(await deep(), /Beta/, "right to left, ArrowLeft moves to the next chip");
    await page.keyboard.press("ArrowRight");
    assert.match(await deep(), /Alpha/);
    check("chips: in a right-to-left page, the arrows follow the reading direction inside <m-chips>");
  }

  // ---------------------------------------------------------------- closed menu out of the tab order
  // <m-menu> keeps its closed menu in its shadow root; its first item was a
  // tab stop there, so Tab stopped inside a menu nobody could see.
  await fresh(
    page,
    `<div class="stage"><button id="m-before">Before</button><m-menu><m-menu-item value="a">Align</m-menu-item></m-menu><button id="m-after">After</button></div>`
  );
  {
    await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    await page.focus("#m-before");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "m-after");
    const hidden = await page.evaluate(() => {
      const surface = document.querySelector("m-menu")?.shadowRoot?.querySelector(".mtrl-menu") as HTMLElement;
      return getComputedStyle(surface).visibility;
    });
    assert.equal(hidden, "hidden");
    check("menu: a closed <m-menu> is not a tab stop, and is hidden from assistive technology");
  }

  // ---------------------------------------------------------------- menus: menu, select, split button
  // The menu family's elements open their surface in the top layer, inside
  // their own shadow root: styled by the adopted CSS, above a z-index 9999
  // sibling, dismissed once, with focus back on the opener. Declarations
  // update in place, and the closed triggers render as the factories do.
  {
    type Host = HTMLElement & Record<string, unknown> & { component: Record<string, unknown> | null };
    type MenuWin = Win & { __log: Array<{ type: string; detail: unknown }> };
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);
    /** Records the events of an element, and the closes of its factory menu. */
    const listen = (id: string, types: string[]): Promise<void> =>
      page.evaluate(({ id, types }) => {
        const w = window as unknown as MenuWin;
        w.__log = [];
        const el = document.getElementById(id) as Host;
        for (const type of types) {
          el.addEventListener(type, (e) => w.__log.push({ type, detail: e instanceof CustomEvent ? e.detail : null }));
        }
      }, { id, types });
    const log = (): Promise<Array<{ type: string; detail: unknown }>> =>
      page.evaluate(() => (window as unknown as MenuWin).__log.splice(0));
    /** The deepest focused element: a combobox, or its id, name or text. */
    const focused = (): Promise<string | null> =>
      page.evaluate(() => {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        if (active?.getAttribute("role") === "combobox") return "combobox";
        return active ? active.id || active.getAttribute("aria-label") || (active.textContent ?? "").trim() : null;
      });
    /** The open surface of an element: where it is and how it looks. */
    const surface = (id: string, selector: string): Promise<Record<string, unknown> | null> =>
      page.evaluate(({ id, selector }) => {
        const el = document.getElementById(id) as HTMLElement;
        const root = el.shadowRoot as ShadowRoot;
        const menu = root.querySelector(selector) as HTMLElement | null;
        if (!menu) return null;
        const r = menu.getBoundingClientRect();
        const style = getComputedStyle(menu);
        const hit = root.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const cover = document.getElementById("cover") as HTMLElement;
        const c = cover.getBoundingClientRect();
        return {
          inRoot: menu.getRootNode() === root,
          popoverOpen: menu.matches(":popover-open"),
          styled: style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "rgb(255, 0, 0)" && style.boxShadow !== "none",
          overCover: r.bottom > c.top && r.top < c.bottom,
          above: !!hit && menu.contains(hit),
        };
      }, { id, selector });
    const OPEN = { inRoot: true, popoverOpen: true, styled: true, overCover: true, above: true };
    const center = (id: string, selector: string): Promise<{ x: number; y: number }> =>
      page.evaluate(({ id, selector }) => {
        const root = (document.getElementById(id) as HTMLElement).shadowRoot as ShadowRoot;
        const r = (root.querySelector(selector) as HTMLElement).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, { id, selector });
    const clickIn = async (id: string, selector: string): Promise<void> => {
      const { x, y } = await center(id, selector);
      await page.mouse.click(x, y);
    };
    const outside = async (): Promise<void> => {
      await page.getByRole("button", { name: "Outside", exact: true }).click();
    };
    // The surface opens on a timer, then its 300ms transition
    const settle = (): Promise<unknown> => wait(450);
    // `settle()` is the menu's open or close transition. What the next step needs
    // comes on the menu's own timers and frames (focus 120ms after opening, the
    // "close" event with a dismissal since FLO-548, focus back on the anchor a frame later, a
    // submenu's focus a frame and 300ms after it opens), and on a runner that paused
    // the fixed wait ended first. `eventually` waits for that state, after the fixed
    // wait, for 5s at most. When it never comes, the failure says at which step,
    // what was awaited and what was found instead: the focused element, and whatever
    // `found` adds. The helpers are called at many steps; `step` is what tells them
    // apart in a CI log.
    const eventually = async (step: string, what: string, ready: () => Promise<boolean>, found: () => Promise<object> = async () => ({})): Promise<void> => {
      for (const end = Date.now() + 5000; !(await ready());) {
        if (Date.now() > end) {
          throw new Error(`menus, ${step}: still waiting after 5s for ${what}; found ${JSON.stringify({ focus: await focused(), ...(await found()) })}`);
        }
        await wait(20);
      }
    };
    const focusIs = (step: string, label: string): Promise<void> => eventually(step, `focus on "${label}"`, async () => (await focused()) === label);
    /** A menu opened with the pointer takes focus itself, and only then handles keys. */
    const menuFocused = (step: string): Promise<void> => eventually(step, "the open menu to take focus", () => page.evaluate(() => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      return active?.getAttribute("role") === "menu";
    }));
    const COVER = `<div id="cover" style="position: relative; z-index: 9999; height: 300px; background: rgb(255, 0, 0)"></div>
      <button id="out" type="button">Outside</button>`;

    // ------------------------------------------------------------ <m-menu>
    await fresh(
      page,
      `<div style="position: relative; overflow: hidden; height: 48px; z-index: 1"><button id="mb" type="button">Actions</button></div>
       ${COVER}
       <m-menu id="mm" anchor="mb" aria-label="Actions">
         <m-menu-item value="copy" icon='${ICON}'>Copy</m-menu-item>
         <m-menu-item value="cut" disabled>Cut</m-menu-item>
         <m-menu-item divider></m-menu-item>
         <m-menu-item value="share">Share<m-menu-item value="link">Copy link</m-menu-item><m-menu-item value="mail">Email</m-menu-item></m-menu-item>
         <m-menu-item value="paste" shortcut="Ctrl+V">Paste</m-menu-item>
       </m-menu>`
    );
    await listen("mm", ["open", "close", "select"]);
    const closed = (step: string): Promise<void> => eventually(step, "<m-menu> to close", async () => {
      const now = await menuState();
      return !now.open && !now.attribute;
    }, menuState);
    const menuState = (): Promise<{ open: boolean; attribute: boolean }> =>
      page.evaluate(() => {
        const el = document.getElementById("mm") as Host;
        return { open: (el.component?.isOpen as () => boolean)(), attribute: el.hasAttribute("open") };
      });

    await page.click("#mb");
    await settle();
    await menuFocused("opened with the pointer");
    assert.deepEqual(await surface("mm", '[role="menu"]'), OPEN, "menu: the surface");
    assert.deepEqual(await menuState(), { open: true, attribute: true });
    assert.deepEqual(await log(), [{ type: "open", detail: {} }]);
    check("menu: the anchor opens it in its shadow root, :popover-open, styled, above z-index 9999; open reflects");

    // Opened by pointer, focus is on the menu: arrows step over the divider
    // (a disabled item takes focus, as the factory has it), a letter jumps,
    // Enter chooses
    const moves: Array<string | null> = [];
    for (const key of ["ArrowDown", "ArrowDown", "p"]) {
      await page.keyboard.press(key);
      moves.push(await focused());
    }
    assert.deepEqual(moves, ["Copy", "Cut", "PasteCtrl+V"]);
    await page.keyboard.press("Enter");
    await settle();
    await closed("Enter on an item");
    await focusIs("Enter on an item", "mb");
    assert.deepEqual(await log(), [{ type: "select", detail: { value: "paste" } }, { type: "close", detail: {} }]);
    assert.deepEqual(await menuState(), { open: false, attribute: false });
    assert.equal(await focused(), "mb", "focus is back on the anchor");
    check("menu: arrows, typeahead and Enter select once, close once, and return focus to the anchor");

    // A menu opened with a key puts focus on its first item on a timer, about 120ms
    // after the key. A fixed wait is not that moment: on a runner whose main thread
    // paused for a third of a second, the keys below got there first, were handled
    // with no item focused, and focus ended one item short (FLO-423).
    const focusOn = async (label: string): Promise<void> => {
      for (const end = Date.now() + 5000; Date.now() < end && (await focused()) !== label;) await wait(20);
    };
    await page.focus("#mb");
    await page.keyboard.press("Enter");
    await focusOn("Copy");
    assert.equal(await focused(), "Copy", "opened with a key, the first item has focus");
    await page.keyboard.press("Escape");
    await settle();
    await closed("Escape, opened with Enter");
    await focusIs("Escape, opened with Enter", "mb");
    assert.deepEqual(await log(), [{ type: "open", detail: {} }, { type: "close", detail: {} }]);
    assert.equal(await focused(), "mb");
    check("menu: Enter on the anchor focuses the first item; Escape closes once and returns focus");

    // ArrowUp on the anchor opens the menu on its last item (FLO-524). The anchor puts
    // focus there 100ms after the key, and the menu's own initial focus, which runs
    // 20ms later, used to move it to the first item. The fixed wait is the assertion:
    // focus is still on the last item once every opening timer has run.
    await page.focus("#mb");
    await page.keyboard.press("ArrowUp");
    await focusOn("PasteCtrl+V");
    await settle();
    assert.equal(await focused(), "PasteCtrl+V", "opened with ArrowUp, the last item has focus, and keeps it");
    await page.keyboard.press("Escape");
    await settle();
    await closed("Escape, opened with ArrowUp");
    await focusIs("Escape, opened with ArrowUp", "mb");
    assert.deepEqual(await log(), [{ type: "open", detail: {} }, { type: "close", detail: {} }]);
    assert.equal(await focused(), "mb");
    check("menu: ArrowUp on the anchor opens it on the last item");

    await page.click("#mb");
    await settle();
    await clickIn("mm", '[data-id="cut"]');
    await wait(150);
    assert.equal((await menuState()).open, true, "a click inside the surface, on a disabled item, keeps it open");
    await outside();
    await settle();
    await closed("a click outside");
    assert.deepEqual(await log(), [{ type: "open", detail: {} }, { type: "close", detail: {} }]);
    assert.deepEqual(await menuState(), { open: false, attribute: false });
    check("menu: a click in the surface keeps it open, a click outside closes it once");

    await page.click("#mb");
    await settle();
    await clickIn("mm", '[data-id="share"]');
    await settle();
    const submenu = await page.evaluate(() => {
      const root = (document.getElementById("mm") as HTMLElement).shadowRoot as ShadowRoot;
      const sub = root.querySelector('[class*="menu--submenu"]');
      return sub ? { open: sub.matches(":popover-open"), items: [...sub.querySelectorAll("[data-id]")].map((i) => i.getAttribute("data-id")) } : null;
    });
    assert.deepEqual(submenu, { open: true, items: ["link", "mail"] }, "nested items are the submenu, in the shadow root");
    await clickIn("mm", '[data-id="link"]');
    await settle();
    await closed("a click on a submenu item");
    assert.deepEqual(await log(), [
      { type: "open", detail: {} }, { type: "select", detail: { value: "link" } }, { type: "close", detail: {} },
    ]);
    check("menu: nested items open a submenu in the top layer; its item selects and closes once");

    // By key and by hover, as the factory: the submenu is loaded on demand
    // (FLO-310), and each way in must reach it
    const openSubmenus = (): Promise<number> =>
      page.evaluate(() =>
        ((document.getElementById("mm") as HTMLElement).shadowRoot as ShadowRoot).querySelectorAll('[class*="menu--submenu"]').length);
    await page.focus("#mb");
    await page.keyboard.press("Enter");
    await focusOn("Copy");
    assert.equal(await focused(), "Copy", "opened with a key, the first item has focus");
    for (const key of ["ArrowDown", "ArrowDown"]) await page.keyboard.press(key);
    assert.equal(await focused(), "Share", "Copy, Cut (disabled, focusable), then Share");
    await page.keyboard.press("ArrowRight");
    await settle();
    await focusIs("ArrowRight on Share", "Copy link");
    assert.deepEqual({ submenus: await openSubmenus(), focus: await focused() }, { submenus: 1, focus: "Copy link" }, "ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await wait(300);
    await eventually("ArrowLeft in the submenu", "<m-menu>'s submenu to close and focus to return to Share", async () => (await openSubmenus()) === 0 && (await focused()) === "Share", async () => ({ submenus: await openSubmenus() }));
    assert.deepEqual({ submenus: await openSubmenus(), focus: await focused() }, { submenus: 0, focus: "Share" }, "ArrowLeft");
    await page.keyboard.press("Escape");
    await settle();
    await closed("Escape after the submenu");
    await page.click("#mb");
    await settle();
    const share = await center("mm", '[data-id="share"]');
    await page.mouse.move(share.x, share.y);
    // The hover intent, then the transition
    await wait(550);
    await eventually("a hover on Share", "<m-menu>'s submenu under the hovered item", async () => (await openSubmenus()) === 1, async () => ({ submenus: await openSubmenus() }));
    assert.equal(await openSubmenus(), 1, "a hover on Share opens its submenu");
    await page.keyboard.press("Escape");
    await settle();
    await closed("Escape after the hover");
    await page.mouse.move(0, 0);
    assert.deepEqual((await log()).map((e) => e.type), ["open", "close", "open", "close"]);
    assert.deepEqual(await menuState(), { open: false, attribute: false });
    check("menu: ArrowRight opens the submenu on its first item, ArrowLeft returns to Share, a hover opens it");

    // FLO-515's acceptance: arrows pressed before the menu's initial focus are not
    // undone by it. A menu opened with a key focuses its first item on a 100ms
    // timer; here that timer is held until the arrows have been handled, the order
    // fast keys (or a paused page) produce. Today the timer then puts focus back
    // on the first item.
    await (async () => {
      await page.evaluate(() => {
        const timeout = window.setTimeout, clear = window.clearTimeout;
        const held = new Map<number, () => void>();
        let next = -1;
        // Every 100ms timer the page sets during this case is held; the menu's own
        // are 0, 20 and 100ms, and the 100ms one is its initial focus. A held timer
        // has an id of its own and can be cleared, so a fix that cancels the
        // initial focus is seen as one, like a fix that guards it.
        window.setTimeout = ((callback: () => void, delay?: number, ...rest: unknown[]) => {
          if (delay !== 100) return timeout(callback, delay, ...rest);
          held.set(next, callback);
          return next--;
        }) as typeof window.setTimeout;
        window.clearTimeout = ((id?: number) => { if (id === undefined || !held.delete(id)) clear(id); }) as typeof window.clearTimeout;
        Object.assign(window, { releaseTimers: () => {
          window.setTimeout = timeout;
          window.clearTimeout = clear;
          delete (window as unknown as { releaseTimers?: unknown }).releaseTimers;
          for (const callback of [...held.values()]) callback();
          held.clear();
        } });
      });
      let before: string | null;
      try {
        await page.focus("#mb");
        await page.keyboard.press("Enter");
        // The menu is placed and shown 20ms after the key; its focus timer is held.
        // (Not `wait(100)`: that is a 100ms timer in the page, and would be held too.)
        await wait(60);
        assert.equal((await menuState()).open, true, "the menu opened with Enter");
        for (const key of ["ArrowDown", "ArrowDown"]) await page.keyboard.press(key);
        before = await focused();
        assert.notEqual(before, "mb", "the arrows moved focus into the menu");
      } finally {
        await page.evaluate(() => (window as unknown as { releaseTimers: () => void }).releaseTimers());
      }
      await wait(50);
      const after = await focused();
      await page.keyboard.press("Escape");
      await settle();
      await log();
      // The known bug is this one move, back to the first item. Any other change of
      // focus is not FLO-515 and fails as usual.
      assert(!(after === "Copy" && before !== "Copy"), "FLO-515: the menu's initial focus moved focus back to the first item, after arrows had moved it on");
      assert.equal(after, before, "focus stays where the arrows put it once the menu's initial focus has run");
    })();

    await page.evaluate(() => (document.getElementById("mm") as Host & { show: () => void }).show());
    await settle();
    assert.deepEqual(await menuState(), { open: true, attribute: true });
    await page.evaluate(() => (document.getElementById("mm") as Host & { hide: () => void }).hide());
    await settle();
    await closed("hide()");
    // The attribute, and the property that reflects it, are applied in the
    // attribute callback (FLO-548): the menu is open, or closed, on the next
    // line, and nothing is dispatched. It was applied a microtask later, and
    // dispatched `open` and `close`.
    const byAttribute = await page.evaluate(() => {
      const el = document.getElementById("mm") as Host & { open: boolean };
      const isOpen = (): boolean => (el.component?.isOpen as () => boolean)();
      el.setAttribute("open", "");
      const set = isOpen();
      el.removeAttribute("open");
      const removed = isOpen();
      el.open = true;
      return { set, removed, property: isOpen(), attribute: el.hasAttribute("open") };
    });
    assert.deepEqual(byAttribute, { set: true, removed: false, property: true, attribute: true });
    await settle();
    assert.deepEqual(await menuState(), { open: true, attribute: true });
    await page.evaluate(() => document.getElementById("mm")?.removeAttribute("open"));
    await settle();
    await closed("the open attribute removed");
    assert.deepEqual(await menuState(), { open: false, attribute: false });
    await page.evaluate(() => (document.getElementById("mm") as Host & { toggle: () => void }).toggle());
    await settle();
    await page.evaluate(() => (document.getElementById("mm") as Host & { toggle: () => void }).toggle());
    await settle();
    await closed("toggle(), the second");
    // show() and hide(), then toggle() twice: one event each. The attribute and the
    // property in between dispatched none.
    assert.deepEqual((await log()).map((e) => e.type), ["open", "close", "open", "close"]);
    check("menu: show(), hide() and toggle() open and close it, each with its event; the open attribute and property do it at once, with none");

    const declared = await page.evaluate(async () => {
      const el = document.getElementById("mm") as Host;
      const before = el.component;
      const frame = (): Promise<unknown> => new Promise((r) => requestAnimationFrame(() => r(null)));
      const texts = (): string[] =>
        [...(el.shadowRoot as ShadowRoot).querySelectorAll('[role="menuitem"]')].map((i) => (i.textContent ?? "").trim());
      const added = document.createElement("m-menu-item");
      added.setAttribute("value", "delete");
      added.textContent = "Delete";
      el.append(added);
      await frame();
      const afterAdd = texts();
      el.querySelector('[value="cut"]')?.remove();
      await frame();
      const afterRemove = texts();
      (el.querySelector('[value="copy"]') as HTMLElement).setAttribute("label", "Duplicate");
      await frame();
      return { same: el.component === before, afterAdd, afterRemove, afterRelabel: texts() };
    });
    assert.deepEqual(declared, {
      same: true,
      afterAdd: ["Copy", "Cut", "Share", "PasteCtrl+V", "Delete"],
      afterRemove: ["Copy", "Share", "PasteCtrl+V", "Delete"],
      afterRelabel: ["Duplicate", "Share", "PasteCtrl+V", "Delete"],
    });
    check("menu: items added, removed and relabelled in place");

    // The anchor as a property, and an id in the menu's own shadow root
    await page.evaluate(() => {
      const other = document.createElement("button");
      other.id = "mb2";
      other.type = "button";
      other.textContent = "Other";
      document.getElementById("mm")?.before(other);
      (document.getElementById("mm") as Host).anchor = other;
    });
    await page.click("#mb2");
    await settle();
    await menuFocused("opened from an anchor set as a property");
    const byProperty = await menuState();
    await page.keyboard.press("Escape");
    await settle();
    await closed("Escape, anchor as a property");
    await focusIs("Escape, anchor as a property", "mb2");
    assert.equal(await focused(), "mb2");
    await page.evaluate(() => {
      const shadow = document.createElement("div");
      shadow.id = "mshadow";
      document.getElementById("host")?.append(shadow);
      shadow.attachShadow({ mode: "open" }).innerHTML =
        `<button id="mb" type="button">Inner</button><m-menu id="inner" anchor="mb"><m-menu-item value="x">Ex</m-menu-item></m-menu>`;
    });
    await page.getByRole("button", { name: "Inner", exact: true }).click();
    await settle();
    const inRoot = await page.evaluate(() => {
      const inner = (document.getElementById("mshadow") as HTMLElement).shadowRoot?.getElementById("inner") as Host;
      return { open: (inner.component?.isOpen as () => boolean)(), outer: (document.getElementById("mm") as Host).hasAttribute("open") };
    });
    assert.deepEqual({ byProperty, inRoot }, { byProperty: { open: true, attribute: true }, inRoot: { open: true, outer: false } });
    await page.keyboard.press("Escape");
    await settle();
    check("menu: the anchor property takes an element; an anchor id resolves in the menu's own root first");

    // ------------------------------------------------------------ <m-select>
    await fresh(
      page,
      `<form id="sf"><label for="ms" id="sl">Pick</label>
         <div><m-select id="ms" name="fruit" label="Fruit" value="b" required style="width: 280px">
           <m-select-option value="a">Apple</m-select-option>
           <m-select-option value="b">Banana</m-select-option>
           <m-select-option value="c" disabled>Cherry</m-select-option>
           <m-select-option value="d">Date</m-select-option>
         </m-select></div></form>
       ${COVER}
       <div id="sfactory" style="width: 280px"></div>`
    );
    await listen("ms", ["change"]);
    await page.evaluate(() => {
      const el = document.getElementById("ms") as Host;
      const w = window as unknown as MenuWin & { __closes: number };
      w.__closes = 0;
      (el.component?.on as (n: string, h: () => void) => void)("close", () => void w.__closes++);
    });
    const selectState = (): Promise<Record<string, unknown>> =>
      page.evaluate(() => {
        const el = document.getElementById("ms") as Host & { value: string | null };
        const form = document.getElementById("sf") as HTMLFormElement;
        return {
          value: el.value,
          form: new FormData(form).get("fruit"),
          text: (el.shadowRoot?.querySelector("input") as HTMLInputElement).value,
          open: (el.component?.isOpen as () => boolean)(),
          closes: (window as unknown as { __closes: number }).__closes,
        };
      });
    assert.deepEqual(await selectState(), { value: "b", form: "b", text: "Banana", open: false, closes: 0 });
    check("select: the value attribute is the default and the form value");

    // The input lets the pointer through to the field
    const combobox = page.getByRole("combobox", { name: "Fruit" });
    const field = page.locator("#ms");
    await field.click();
    await settle();
    assert.deepEqual(await surface("ms", ".mtrl-menu"), OPEN, "select: the listbox");
    check("select: the listbox opens in its shadow root, :popover-open, styled, above z-index 9999");

    await clickIn("ms", '[data-id="c"]');
    await wait(150);
    assert.equal((await selectState()).open, true, "a click on a disabled option keeps it open");
    await outside();
    await settle();
    assert.deepEqual(await selectState(), { value: "b", form: "b", text: "Banana", open: false, closes: 1 });
    check("select: a click inside the listbox keeps it open, a click outside closes it once");

    await combobox.focus();
    await page.keyboard.press("ArrowDown");
    await settle();
    const active = (): Promise<string | null> =>
      page.evaluate(() => {
        const root = (document.getElementById("ms") as HTMLElement).shadowRoot as ShadowRoot;
        const id = root.querySelector("input")?.getAttribute("aria-activedescendant");
        return id ? (root.getElementById(id)?.getAttribute("data-id") ?? null) : null;
      });
    const path = [await active()];
    await page.keyboard.press("ArrowDown");
    path.push(await active());
    await page.keyboard.press("a");
    path.push(await active());
    await page.keyboard.press("End");
    path.push(await active());
    assert.deepEqual(path, ["b", "d", "a", "d"], "the selected option, then Cherry skipped, typeahead, End");
    await page.keyboard.press("Enter");
    await settle();
    assert.deepEqual(await log(), [{ type: "change", detail: { value: "d" } }]);
    assert.deepEqual(await selectState(), { value: "d", form: "d", text: "Date", open: false, closes: 2 });
    assert.equal(await focused(), "combobox", "focus stays on the combobox");
    await page.keyboard.press("ArrowDown");
    await settle();
    await page.keyboard.press("Escape");
    await settle();
    assert.deepEqual(await selectState(), { value: "d", form: "d", text: "Date", open: false, closes: 3 });
    assert.deepEqual(await log(), []);
    check("select: arrows, typeahead and Enter change it once and close once; Escape closes; focus stays on the combobox");

    await field.click();
    await settle();
    await clickIn("ms", '[data-id="a"]');
    await settle();
    assert.deepEqual(await log(), [{ type: "change", detail: { value: "a" } }]);
    assert.deepEqual(await selectState(), { value: "a", form: "a", text: "Apple", open: false, closes: 4 });
    assert.equal(await focused(), "combobox");
    check("select: a click on an option changes it once and closes once");

    const validity = await page.evaluate(() => {
      const el = document.getElementById("ms") as Host & { value: string | null; internals: ElementInternals };
      const form = document.getElementById("sf") as HTMLFormElement;
      form.reset();
      const reset = el.value;
      el.value = null;
      const empty = { missing: el.internals.validity.valueMissing, valid: form.checkValidity(), invalid: el.matches(":invalid"), form: new FormData(form).get("fruit") };
      el.value = "d";
      return { reset, empty, filled: form.checkValidity() };
    });
    assert.deepEqual(validity, { reset: "b", empty: { missing: true, valid: false, invalid: true, form: null }, filled: true });
    check("select: a reset returns to the value attribute; required reports valueMissing while empty");

    await page.click("#sl");
    assert.equal(await focused(), "combobox", "a <label for> focuses the combobox");
    check("select: <label for> focuses the combobox");

    // FLO-543: the attribute reaches the select's menu, which has no public
    // member for it; the menu is under mtrl's symbol, found by its description.
    const placed = await page.evaluate(() => {
      const el = document.getElementById("ms") as Host;
      const menu = (): { getPosition: () => string } =>
        (el.component as unknown as Record<symbol, { getPosition: () => string }>)[Object.getOwnPropertySymbols(el.component).find((key) => key.description === "mtrl.menu")!];
      el.setAttribute("placement", "top-start");
      const set = { position: menu().getPosition(), member: "menu" in (el.component as object) };
      el.removeAttribute("placement");
      return { set, removed: menu().getPosition() };
    });
    assert.deepEqual(placed, { set: { position: "top-start", member: false }, removed: "bottom-start" });
    check("select: placement set after creation reaches its menu, which is not a member");

    const options = await page.evaluate(async () => {
      const el = document.getElementById("ms") as Host & { value: string | null };
      const before = el.component;
      const frame = (): Promise<unknown> => new Promise((r) => requestAnimationFrame(() => r(null)));
      const text = (): string => (el.shadowRoot?.querySelector("input") as HTMLInputElement).value;
      const options = (): string[] => ((el.component?.getOptions as () => Array<{ text: string }>)()).map((o) => o.text);
      const added = document.createElement("m-select-option");
      added.setAttribute("value", "e");
      added.textContent = "Elderberry";
      el.append(added);
      await frame();
      const afterAdd = options();
      (el.querySelector('[value="d"]') as HTMLElement).textContent = "Dates";
      await frame();
      const relabelled = { text: text(), value: el.value };
      el.querySelector('[value="d"]')?.remove();
      await frame();
      return { same: el.component === before, afterAdd, relabelled, removed: { options: options(), value: el.value, text: text() } };
    });
    assert.deepEqual(options, {
      same: true,
      afterAdd: ["Apple", "Banana", "Cherry", "Date", "Elderberry"],
      relabelled: { text: "Dates", value: "d" },
      removed: { options: ["Apple", "Banana", "Cherry", "Elderberry"], value: null, text: "" },
    });
    check("select: options added, removed and relabelled in place; the selected option's new text shows");

    // The closed field against the factory's, in light DOM
    const selectParity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createSelect: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createSelect({ label: "Fruit", value: "a", options: [{ id: "a", text: "Apple" }] });
      (document.getElementById("sfactory") as HTMLElement).append(factory.element);
      const el = document.getElementById("ms") as Host & { value: string | null };
      el.value = "a";
      const read = (field: HTMLElement): Record<string, unknown> => {
        const r = field.getBoundingClientRect();
        const input = field.querySelector("input") as HTMLInputElement;
        const label = field.querySelector('[class*="textfield__label"]') as HTMLElement;
        const icon = field.querySelector('[class*="trailing-icon"]') as HTMLElement;
        return {
          width: Math.round(r.width), height: Math.round(r.height),
          background: getComputedStyle(field).backgroundColor,
          font: getComputedStyle(input).font, color: getComputedStyle(input).color,
          label: getComputedStyle(label).font, icon: Math.round(icon.getBoundingClientRect().left - r.left),
        };
      };
      return { element: read(el.shadowRoot?.firstElementChild as HTMLElement), factory: read(factory.element) };
    });
    assert.deepEqual(selectParity.element, selectParity.factory);
    check("select: the closed field renders as the factory's in light DOM");

    // FLO-272: a long list stays in the viewport, scrolling, on the side of
    // the field with room: near the bottom it opens above, near the top
    // below; the factory's in-field menu and the element's top-layer one.
    const long = await page.evaluate(async () => {
      type Opener = { open: () => unknown; close: () => unknown };
      const w = window as unknown as Win & { mtrl: { createSelect: (c: object) => Opener & { element: HTMLElement } } };
      const options = Array.from({ length: 250 }, (_, i) => ({ id: `o${i}`, text: `Option ${i}` }));
      const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
      const measure = (menu: HTMLElement, field: HTMLElement): Record<string, unknown> => {
        const m = menu.getBoundingClientRect();
        const f = field.getBoundingClientRect();
        const scrolls = [menu, ...menu.querySelectorAll<HTMLElement>("*")].some((n) => n.scrollHeight > n.clientHeight + 1 && getComputedStyle(n).overflowY !== "visible");
        return {
          inViewport: m.top >= 0 && m.bottom <= innerHeight && m.height > 0,
          scrolls,
          side: m.bottom <= f.top + 1 ? "above" : m.top >= f.bottom - 1 ? "below" : "overlap",
        };
      };
      const run = async (kind: "factory" | "element", where: "top" | "bottom"): Promise<Record<string, unknown>> => {
        const box = document.createElement("div");
        box.style.cssText = `position: fixed; left: 20px; ${where}: 8px; width: 280px; z-index: 1`;
        document.body.append(box);
        let opener: Opener, field: HTMLElement, menu: () => HTMLElement;
        if (kind === "factory") {
          const select = w.mtrl.createSelect({ label: "Country", options });
          box.append(select.element);
          opener = select;
          field = select.element;
          menu = () => select.element.querySelector('[class~="mtrl-menu"]') as HTMLElement;
        } else {
          const el = document.createElement("m-select") as HTMLElement & { component: Opener };
          el.setAttribute("label", "Country");
          el.innerHTML = options.map((o) => `<m-select-option value="${o.id}">${o.text}</m-select-option>`).join("");
          box.append(el);
          await wait(50);
          opener = el.component;
          field = el;
          menu = () => el.shadowRoot?.querySelector('[class~="mtrl-menu"]') as HTMLElement;
        }
        opener.open();
        await wait(400);
        const result = measure(menu(), field);
        opener.close();
        await wait(300);
        box.remove();
        return result;
      };
      return {
        factoryBottom: await run("factory", "bottom"),
        factoryTop: await run("factory", "top"),
        elementBottom: await run("element", "bottom"),
        elementTop: await run("element", "top"),
      };
    });
    assert.deepEqual(long, {
      factoryBottom: { inViewport: true, scrolls: true, side: "above" },
      factoryTop: { inViewport: true, scrolls: true, side: "below" },
      elementBottom: { inViewport: true, scrolls: true, side: "above" },
      elementTop: { inViewport: true, scrolls: true, side: "below" },
    });
    check("select: a long list stays in the viewport and scrolls, above the field near the bottom and below it near the top");

    // FLO-272: an open menu follows its field when a panel around it
    // scrolls, not only the window; the menu's own list scrolling does not move it.
    const follows = await page.evaluate(async () => {
      type Opener = { open: () => unknown; close: () => unknown; element: HTMLElement };
      const w = window as unknown as Win & { mtrl: { createSelect: (c: object) => Opener } };
      const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
      const panel = document.createElement("div");
      panel.style.cssText = "position: fixed; left: 20px; top: 60px; width: 320px; height: 300px; overflow: auto; z-index: 1";
      panel.innerHTML = '<div style="height: 40px"></div>';
      const select = w.mtrl.createSelect({
        label: "Country",
        menu: { container: document.body },
        options: Array.from({ length: 40 }, (_, i) => ({ id: `o${i}`, text: `Option ${i}` })),
      });
      panel.append(select.element);
      const spacer = document.createElement("div");
      spacer.style.height = "800px";
      panel.append(spacer);
      document.body.append(panel);
      select.open();
      await wait(400);
      const menu = document.body.querySelector(':scope > [class~="mtrl-menu"]') as HTMLElement;
      const gap = (): number => Math.round(menu.getBoundingClientRect().top - select.element.getBoundingClientRect().bottom);
      const before = gap();
      const fieldBefore = select.element.getBoundingClientRect().top;
      panel.scrollTop = 30;
      await wait(100);
      const afterPanel = gap();
      const fieldMoved = Math.round(fieldBefore - select.element.getBoundingClientRect().top);
      const list = [menu, ...menu.querySelectorAll<HTMLElement>("*")].find((n) => n.scrollHeight > n.clientHeight + 1) ?? menu;
      const top = menu.getBoundingClientRect().top;
      list.scrollTop = 60;
      await wait(100);
      const afterList = Math.round(menu.getBoundingClientRect().top - top);
      select.close();
      await wait(300);
      panel.remove();
      return { fieldMoved, followed: afterPanel === before, listScrollMoved: afterList };
    });
    assert.deepEqual(follows, { fieldMoved: 30, followed: true, listScrollMoved: 0 });
    check("select: an open menu follows its field as a panel around it scrolls, and not its own list");

    // Going back restores the chosen option over the value attribute
    {
      const restorePage = await browser.newPage();
      await restorePage.goto(`http://127.0.0.1:${server.port}/restore-select`);
      await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
      await restorePage.locator("#rs").click();
      await restorePage.waitForTimeout(450);
      await restorePage.getByRole("option", { name: "Beta", exact: true }).click();
      await restorePage.click("#go");
      await restorePage.waitForURL(/\/away$/);
      await restorePage.goBack();
      await restorePage.waitForFunction(() => (window as unknown as Win).ready === true);
      const value = (): string | null => (document.getElementById("rs") as HTMLElement & { value: string | null }).value;
      await restorePage.waitForFunction(() => (document.getElementById("rs") as HTMLElement & { value: string | null }).value === "b", undefined, { timeout: 5_000 })
        .catch(() => undefined);
      const restored = await restorePage.evaluate(value);
      await restorePage.close();
      assert.equal(restored, "b", "going back restores the option the user chose over the value attribute");
      check("select: going back restores the chosen option");
    }

    // ------------------------------------------------------------ <m-split-button>
    await fresh(
      page,
      `<m-split-button id="sb">Save<m-menu-item value="draft">Save draft</m-menu-item><m-menu-item value="pdf">Export PDF</m-menu-item></m-split-button>
       ${COVER}
       <div id="bfactory"></div>`
    );
    await listen("sb", ["click", "select"]);
    await page.evaluate(() => {
      const el = document.getElementById("sb") as Host;
      const w = window as unknown as { __closes: number };
      w.__closes = 0;
      // The inner menu is not a member (FLO-543): it is under mtrl's symbol, found by its description
      const menu = (el.component as unknown as Record<symbol, { on: (n: string, h: () => void) => void }>)[Object.getOwnPropertySymbols(el.component).find((key) => key.description === "mtrl.menu")!];
      menu.on("close", () => void w.__closes++);
    });
    const splitState = (): Promise<{ open: boolean; closes: number }> =>
      page.evaluate(() => {
        const el = document.getElementById("sb") as Host;
        return {
          open: (el.component as unknown as Record<symbol, { isOpen: () => boolean }>)[Object.getOwnPropertySymbols(el.component).find((key) => key.description === "mtrl.menu")!].isOpen(),
          closes: (window as unknown as { __closes: number }).__closes,
        };
      });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("button", { name: "More options", exact: true }).click();
    await settle();
    assert.deepEqual((await log()).map((e) => e.type), ["click"], "the leading button's click only");
    assert.deepEqual(await surface("sb", '[role="menu"]'), OPEN, "split button: the menu");
    check("split button: click is the leading action's; the trailing button opens the menu in its shadow root, above z-index 9999");

    await page.keyboard.press("ArrowDown");
    assert.equal(await focused(), "Save draft");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await settle();
    assert.deepEqual(await log(), [{ type: "select", detail: { value: "pdf" } }]);
    assert.deepEqual(await splitState(), { open: false, closes: 1 });
    assert.equal(await focused(), "More options", "focus is back on the trailing button");
    await page.keyboard.press("Enter");
    await settle();
    await page.keyboard.press("Escape");
    await settle();
    assert.deepEqual(await splitState(), { open: false, closes: 2 });
    assert.equal(await focused(), "More options");
    check("split button: arrows and Enter select once, close once and return focus; Escape closes");

    await page.getByRole("button", { name: "More options", exact: true }).click();
    await settle();
    await outside();
    await settle();
    await page.getByRole("button", { name: "More options", exact: true }).click();
    await settle();
    await page.evaluate(() => {
      const w = window as unknown as Win & { __splitValues: unknown[] };
      w.__splitValues = [];
      const component = (document.getElementById("sb") as Host).component as { on: (n: string, h: (p: { value: unknown }) => void) => void };
      component.on("select", (payload) => void w.__splitValues.push(payload.value));
    });
    await clickIn("sb", '[data-id="draft"]');
    await settle();
    assert.deepEqual(await log(), [{ type: "select", detail: { value: "draft" } }], "no click event from the menu");
    assert.deepEqual(await page.evaluate(() => (window as unknown as Win).__splitValues), ["draft"], "a factory select handler reads the same value (FLO-320)");
    assert.deepEqual(await splitState(), { open: false, closes: 4 });
    check("split button: a click outside closes it once; a click on an item selects once");

    const splitDeclared = await page.evaluate(async () => {
      const el = document.getElementById("sb") as Host;
      const before = el.component;
      const frame = (): Promise<unknown> => new Promise((r) => requestAnimationFrame(() => r(null)));
      const menu = (): { getItems: () => Array<{ text?: string }> } => el.component as { getItems: () => Array<{ text?: string }> };
      const added = document.createElement("m-menu-item");
      added.setAttribute("value", "png");
      added.textContent = "Export PNG";
      el.append(added);
      await frame();
      const afterAdd = menu().getItems().map((i) => i.text);
      el.querySelector('[value="draft"]')?.remove();
      (el.querySelector('[value="pdf"]') as HTMLElement).setAttribute("label", "PDF");
      el.firstChild!.textContent = "Keep";
      await frame();
      return {
        same: el.component === before,
        afterAdd,
        after: menu().getItems().map((i) => i.text),
        label: (el.component as { getText: () => string }).getText(),
      };
    });
    assert.deepEqual(splitDeclared, {
      same: true,
      afterAdd: ["Save draft", "Export PDF", "Export PNG"],
      after: ["PDF", "Export PNG"],
      label: "Keep",
    });
    check("split button: items added, removed and relabelled, and the label changed, in place");

    // After the trailing button's shape has settled from the last close
    await wait(600);
    const splitParity = await page.evaluate(() => {
      const w = window as unknown as Win & { mtrl: { createSplitButton: (c: object) => { element: HTMLElement } } };
      const factory = w.mtrl.createSplitButton({ text: "Keep", items: [{ id: "x", text: "X" }] });
      (document.getElementById("bfactory") as HTMLElement).append(factory.element);
      const el = document.getElementById("sb") as Host;
      const read = (group: HTMLElement): Record<string, unknown> => {
        const [leading, trailing] = [...group.querySelectorAll("button")];
        const box = (b: HTMLElement): unknown => {
          const r = b.getBoundingClientRect();
          const s = getComputedStyle(b);
          return { width: Math.round(r.width), height: Math.round(r.height), background: s.backgroundColor, color: s.color, radius: s.borderRadius, font: s.font };
        };
        return { leading: box(leading), trailing: box(trailing), gap: Math.round(trailing.getBoundingClientRect().left - leading.getBoundingClientRect().right) };
      };
      return { element: read(el.shadowRoot?.firstElementChild as HTMLElement), factory: read(factory.element) };
    });
    assert.deepEqual(splitParity.element, splitParity.factory);
    check("split button: the closed button renders as the factory's in light DOM");
  }

  // ---------------------------------------------------------------- tooltip placement during the entrance transition (FLO-535)
  {
    type Direction = "top" | "bottom" | "left" | "right";
    type Case = { name: string; position: Direction; x: number; y: number; text: string; layer?: "top"; edge?: boolean; wrapped?: boolean };
    const cases: Case[] = [
      { name: "top", position: "top", x: 430, y: 330, text: "A tooltip with enough content to measure" },
      { name: "bottom", position: "bottom", x: 430, y: 330, text: "A tooltip with enough content to measure" },
      { name: "left", position: "left", x: 430, y: 330, text: "A tooltip with enough content to measure" },
      { name: "right", position: "right", x: 430, y: 330, text: "A tooltip with enough content to measure" },
      { name: "left edge", position: "bottom", x: 2, y: 330, text: "A tooltip with enough content to measure", edge: true },
      { name: "right edge", position: "bottom", x: 858, y: 330, text: "A tooltip with enough content to measure", edge: true },
      { name: "wrapped", position: "bottom", x: 430, y: 330, text: "This tooltip has enough words to wrap across three lines near its target", wrapped: true },
      { name: "top layer", position: "bottom", x: 430, y: 330, text: "A tooltip with enough content to measure", layer: "top" },
    ];
    type Measurement = {
      targetCenter: { x: number; y: number }; tooltipCenter: { x: number; y: number };
      target: { top: number; bottom: number; left: number; right: number };
      tooltip: { top: number; bottom: number; left: number; right: number };
      arrowCenter: { x: number; y: number }; widthShown: number; widthReadWhenPlaced: number;
      layoutWidth: number; naturalWidth: number; lineCount: number; margin: number; reducedMotion: boolean; transitionDuration: string;
      popoverOpen: boolean;
    };
    const failures: string[] = [];
    // This block explicitly enables motion; the rest of the check retains its
    // normal media setting. A layout read before show() starts the real scale
    // transition, even when the fixture was created in the same task.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const scenario of cases) {
      await fresh(page, `<button id="tooltip-geometry-target" type="button" style="position:fixed;left:${scenario.x}px;top:${scenario.y}px;width:40px;height:40px">Target</button>`);
      const setup = await page.evaluate(({ text, position, layer }) => {
        type Tip = { element: HTMLElement; show: (immediate?: boolean) => void; destroy: () => void };
        const w = window as unknown as Win & { mtrl: { createTooltip: (config: object) => Tip }; __geometryTip: Tip; __geometryWidthRead: number };
        const target = document.getElementById("tooltip-geometry-target") as HTMLElement;
        const tip = w.mtrl.createTooltip({ target, text, position, layer });
        w.__geometryTip = tip;
        let naturalWidth = tip.element.offsetWidth;
        const rect = tip.element.getBoundingClientRect.bind(tip.element);
        const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth")?.get;
        if (!offsetWidth) throw new Error("HTMLElement.offsetWidth is unavailable");
        Object.defineProperty(tip.element, "offsetWidth", {
          configurable: true,
          get() {
            const measured = offsetWidth.call(tip.element) as number;
            w.__geometryWidthRead = measured;
            return measured;
          },
        });
        tip.element.getBoundingClientRect = () => {
          const measured = rect();
          w.__geometryWidthRead = measured.width;
          return measured;
        };
        tip.show(true);
        const widthReadWhenPlaced = w.__geometryWidthRead;
        Reflect.deleteProperty(tip.element, "offsetWidth");
        // A closed top-layer popover has no layout box until show() opens it.
        if (!naturalWidth) naturalWidth = tip.element.offsetWidth;
        tip.element.getBoundingClientRect = rect;
        return { widthReadWhenPlaced, naturalWidth, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches };
      }, scenario);
      await page.waitForFunction(() => {
        const tip = (window as unknown as { __geometryTip: { element: HTMLElement } }).__geometryTip;
        const surface = tip.element;
        const style = getComputedStyle(surface);
        return surface.classList.contains("mtrl-tooltip--visible") &&
          surface.getAnimations().every((animation) => animation.playState === "finished") &&
          Math.abs(surface.getBoundingClientRect().width - surface.offsetWidth) < 0.01 &&
          style.opacity === "1";
      });
      const measured: Measurement = await page.evaluate(({ widthReadWhenPlaced, naturalWidth, reducedMotion, position }) => {
        const w = window as unknown as { __geometryTip: { element: HTMLElement; destroy: () => void } };
        const surface = w.__geometryTip.element;
        const target = document.getElementById("tooltip-geometry-target") as HTMLElement;
        const t = target.getBoundingClientRect();
        const r = surface.getBoundingClientRect();
        const arrow = (surface.querySelector('[class*="__arrow"]') as HTMLElement).getBoundingClientRect();
        const style = getComputedStyle(surface);
        const lineCount = (surface.offsetHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / parseFloat(style.lineHeight);
        const marginName = ({ top: "marginBottom", bottom: "marginTop", left: "marginRight", right: "marginLeft" } as const)[position];
        const result = {
          targetCenter: { x: t.left + t.width / 2, y: t.top + t.height / 2 },
          tooltipCenter: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
          target: { top: t.top, bottom: t.bottom, left: t.left, right: t.right },
          tooltip: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
          arrowCenter: { x: arrow.left + arrow.width / 2, y: arrow.top + arrow.height / 2 },
          widthShown: r.width, widthReadWhenPlaced, layoutWidth: surface.offsetWidth, naturalWidth,
          lineCount, margin: parseFloat(style[marginName]),
          reducedMotion, transitionDuration: style.transitionDuration, popoverOpen: surface.matches(":popover-open"),
        };
        w.__geometryTip.destroy();
        return result;
      }, { ...setup, position: scenario.position });
      console.log(`  tooltip geometry ${scenario.name}: ${JSON.stringify(measured)}`);
      const cross = scenario.position === "top" || scenario.position === "bottom" ? "x" : "y";
      if (!scenario.edge) {
        const delta = measured.tooltipCenter[cross] - measured.targetCenter[cross];
        if (Math.abs(delta) > 1) failures.push(`${scenario.name}: cross-axis centre delta ${delta.toFixed(2)} px`);
        const arrowDelta = measured.arrowCenter[cross] - measured.targetCenter[cross];
        if (Math.abs(arrowDelta) > 1) failures.push(`${scenario.name}: arrow delta ${arrowDelta.toFixed(2)} px`);
        const gap = ({
          top: measured.target.top - measured.tooltip.bottom,
          bottom: measured.tooltip.top - measured.target.bottom,
          left: measured.target.left - measured.tooltip.right,
          right: measured.tooltip.left - measured.target.right,
        } as const)[scenario.position];
        const expectedGap = DEFAULT_OFFSET + ((scenario.position === "bottom" || scenario.position === "right") ? measured.margin : 0);
        if (Math.abs(gap - expectedGap) > 1) failures.push(`${scenario.name}: main-axis gap ${gap.toFixed(2)} px, expected ${expectedGap} px`);
      }
      if (scenario.edge && (measured.tooltip.left < -1 || measured.tooltip.right > 901 || Math.abs(measured.widthShown - measured.naturalWidth) > 1 || Math.abs(measured.widthShown - measured.layoutWidth) > 1)) {
        failures.push(`${scenario.name}: viewport bounds ${measured.tooltip.left.toFixed(2)}..${measured.tooltip.right.toFixed(2)}, shown/initial layout/current layout width ${measured.widthShown.toFixed(2)}/${measured.naturalWidth}/${measured.layoutWidth} px`);
      }
      if (scenario.wrapped && Math.abs(measured.lineCount - 3) > 0.1) failures.push(`${scenario.name}: ${measured.lineCount} lines, expected 3`);
      if (scenario.layer && !measured.popoverOpen) failures.push(`${scenario.name}: popover is closed`);
      if (measured.reducedMotion || !measured.transitionDuration.includes("0.15s")) failures.push(`${scenario.name}: entrance motion is disabled`);
      if (Math.abs(measured.widthReadWhenPlaced - measured.naturalWidth) > 1) failures.push(`${scenario.name}: placement width ${measured.widthReadWhenPlaced.toFixed(2)} differs from layout width ${measured.naturalWidth}`);
    }
    await page.emulateMedia({ reducedMotion: null });
    assert.equal(failures.length, 0, `tooltip placement (FLO-535):\n${failures.join("\n")}`);
    check("tooltip: motion-on placement, wrapped text, viewport clamps and top layer");
  }

  // ---------------------------------------------------------------- tooltip and snackbar in the top layer
  // <m-tooltip> and <m-snackbar> render their surface in their own shadow
  // root, with its adopted CSS, and show it as a popover (`layer: "top"`):
  // above a z-index 9999 sibling and a modal dialog, where the factory
  // without a layer puts it, and styled as the factory in light DOM is.
  {
    type Tip = { element: HTMLElement; target: HTMLElement | null; show: (now?: boolean) => unknown; destroy: () => void };
    type Snack = { element: HTMLElement; show: () => unknown; hide: () => unknown; destroy: () => void };
    type Host = HTMLElement & { component: { element: HTMLElement } | null; show: (now?: boolean) => unknown; target: HTMLElement | null };
    type PopWin = Win & {
      mtrl: { createTooltip: (config: object) => Tip; createSnackbar: (config: object) => Snack };
      __pop: { root: ShadowRoot; events: string[] };
    };
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);
    const client = await page.context().newCDPSession(page);

    /** The description Chrome computes, and whether Playwright's own matches the text. */
    const description = async (selector: string, name: string, text: string): Promise<{ chrome: unknown; playwright: boolean }> => {
      const locator = page.locator(selector);
      const { nodes } = (await client.send("Accessibility.getFullAXTree")) as {
        nodes: Array<{ role?: { value: string }; name?: { value: string }; description?: { value: string } }>;
      };
      const button = nodes.find((n) => n.role?.value === "button" && n.name?.value === name);
      // What `expect(locator).toHaveAccessibleDescription()` runs; `playwright`
      // has the matcher without the test runner's expect
      const matcher = locator as unknown as {
        _expect: (name: string, options: object) => Promise<{ matches: boolean }>;
      };
      const { matches } = await matcher._expect("to.have.accessible.description", {
        expectedText: [{ string: text, normalizeWhiteSpace: true }],
        isNot: false,
        timeout: 1000,
      });
      return { chrome: button?.description?.value, playwright: matches };
    };

    // ------------------------------------------------ tooltip
    await fresh(page, `<div style="height: 500px"></div><div id="pt"></div><div style="height: 2000px"></div>`);
    await page.evaluate(() => {
      const host = document.getElementById("pt") as HTMLElement;
      const root = host.attachShadow({ mode: "open" });
      // The target in a clipping parent, and below it a sibling on z-index
      // 9999 where the tooltip opens
      root.innerHTML = `<div style="position: relative; overflow: hidden; height: 48px; z-index: 1">
          <button id="pt-save" type="button" style="margin-left: 40px">Save</button>
          <button id="pt-share" type="button">Share</button>
          <m-tooltip id="pt-tip" for="pt-save">Save the file</m-tooltip></div>
        <div id="pt-cover" style="position: relative; z-index: 9999; height: 300px; background: rgb(255, 0, 0)"></div>
        <button id="pt-outside" type="button">Outside</button>`;
      (window as unknown as PopWin).__pop = { root, events: [] };
      // At once: the document may scroll smoothly
      window.scrollTo({ top: 300, behavior: "instant" });
    });

    // Where the factory without a layer puts it, on the body with the global
    // stylesheet, hovered on the same target alongside the element's. That
    // tooltip is `position: fixed` at page coordinates, so with the page
    // scrolled it sits the scroll offset below its place: the top-layer one
    // is compared with it less the scroll.
    await page.evaluate(() => {
      const w = window as unknown as PopWin & { __unlayered: Tip };
      w.__unlayered = w.mtrl.createTooltip({ target: w.__pop.root.getElementById("pt-save"), text: "Save the file" });
    });
    const unlayered = (): Promise<{ rect: Record<"top" | "left" | "width" | "height", number>; style: Record<string, string>; classes: string }> =>
      page.evaluate(() => {
        const tip = (window as unknown as { __unlayered: Tip }).__unlayered;
        const { top, left, width, height } = tip.element.getBoundingClientRect();
        const style = getComputedStyle(tip.element);
        const result = {
          rect: { top: top - window.scrollY, left, width, height },
          style: { background: style.backgroundColor, color: style.color, shadow: style.boxShadow, margin: style.marginTop, font: style.font, padding: style.padding },
          classes: [...tip.element.classList].sort().join(" "),
        };
        tip.destroy();
        return result;
      });

    const tipState = (): Promise<{ open: boolean; visible: boolean }> =>
      page.evaluate(() => {
        const tip = (window as unknown as PopWin).__pop.root.getElementById("pt-tip") as Host;
        const surface = tip.component?.element as HTMLElement;
        return { open: surface.matches(":popover-open"), visible: surface.className.includes("tooltip--visible") };
      });
    const centerOf = (id: string): Promise<{ x: number; y: number }> =>
      page.evaluate((id) => {
        const r = ((window as unknown as PopWin).__pop.root.getElementById(id) as HTMLElement).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, id);

    // Hover shows it after the delay
    const save = await centerOf("pt-save");
    await page.mouse.move(save.x, save.y);
    await wait(450);
    const expected = await unlayered();
    const shown = await page.evaluate(() => {
      const { root } = (window as unknown as PopWin).__pop;
      const tip = root.getElementById("pt-tip") as Host;
      const surface = tip.component?.element as HTMLElement;
      const r = surface.getBoundingClientRect();
      const style = getComputedStyle(surface);
      const hit = (surface.getRootNode() as ShadowRoot).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        inRoot: surface.getRootNode() === tip.shadowRoot,
        popoverOpen: surface.matches(":popover-open"),
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        style: { background: style.backgroundColor, color: style.color, shadow: style.boxShadow, margin: style.marginTop, font: style.font, padding: style.padding },
        border: style.borderTopWidth,
        classes: [...surface.classList].sort().join(" "),
        aboveCover: !!hit && surface.contains(hit),
        scrolled: window.scrollY,
      };
    });
    assert.equal(shown.inRoot, true, "the tooltip's surface is in the element's shadow root");
    assert.equal(shown.popoverOpen, true, "the tooltip's surface is :popover-open");
    assert.equal(shown.scrolled, 300, "the page is scrolled");
    for (const key of ["top", "left", "width", "height"] as const) {
      assert.ok(Math.abs(shown.rect[key] - expected.rect[key]) <= 1, `tooltip ${key} ${shown.rect[key]} is the unlayered tooltip's ${expected.rect[key]}`);
    }
    assert.deepEqual(shown.style, expected.style, "the tooltip's own colours, font, padding and margin, as the factory's in light DOM");
    assert.equal(shown.border, "0px", "no popover border");
    assert.equal(shown.classes, expected.classes, "the factory's classes");
    assert.equal(shown.aboveCover, true, "the tooltip is above the z-index 9999 sibling");
    check("tooltip top layer in a shadow root: shown on hover in its element's root, styled, at the unlayered position with the page scrolled, above z-index 9999");

    // Leaving hides it: the hide delay, then the exit transition
    const outside = await centerOf("pt-outside");
    await page.mouse.move(outside.x, outside.y);
    await wait(400);
    const left = await tipState();
    // Focus shows it, blur hides it
    await page.evaluate(() => ((window as unknown as PopWin).__pop.root.getElementById("pt-save") as HTMLElement).focus());
    await wait(450);
    const focused = await tipState();
    await page.evaluate(() => ((window as unknown as PopWin).__pop.root.getElementById("pt-outside") as HTMLElement).focus());
    await wait(400);
    const blurred = await tipState();
    // Escape hides it at once, focus staying on the target
    await page.evaluate(() => ((window as unknown as PopWin).__pop.root.getElementById("pt-save") as HTMLElement).focus());
    await wait(450);
    await page.keyboard.press("Escape");
    await wait(250);
    const escaped = await tipState();
    const stayed = await page.evaluate(() => (window as unknown as PopWin).__pop.root.activeElement?.id);
    const off = { open: false, visible: false };
    assert.deepEqual(
      { left, focused, blurred, escaped, stayed },
      { left: off, focused: { open: true, visible: true }, blurred: off, escaped: off, stayed: "pt-save" }
    );
    check("tooltip top layer in a shadow root: shown on focus, hidden on leave, blur and Escape, out of the top layer after");

    const described = await description("#pt-save", "Save", "Save the file");
    assert.deepEqual(described, { chrome: "Save the file", playwright: true }, "the target is described by the tooltip text");
    check("tooltip: the target's accessible description is the text, in Chrome and in Playwright");

    // Attributes: text in place, for in place, variant recreates
    const tipChanges = await page.evaluate(async () => {
      const { root } = (window as unknown as PopWin).__pop;
      const tip = root.getElementById("pt-tip") as Host;
      const before = tip.component;
      tip.setAttribute("text", "Save to disk");
      const text = { same: tip.component === before, text: tip.component?.element.textContent };
      tip.setAttribute("for", "pt-share");
      const moved = {
        same: tip.component === before,
        share: root.getElementById("pt-share")?.getAttribute("aria-describedby"),
        save: root.getElementById("pt-save")?.getAttribute("aria-describedby"),
      };
      tip.setAttribute("variant", "plain");
      const variant = {
        recreated: tip.component !== before,
        plain: !!tip.component?.element.className.includes("tooltip--plain"),
        target: tip.target?.id,
      };
      const share = root.getElementById("pt-save") as HTMLElement;
      tip.target = share;
      return { text, moved, variant, property: tip.target?.id, save: share.getAttribute("aria-describedby") };
    });
    assert.deepEqual(tipChanges, {
      text: { same: true, text: "Save to disk" },
      moved: { same: true, share: "pt-tip", save: null },
      variant: { recreated: true, plain: true, target: "pt-share" },
      property: "pt-save",
      save: "pt-tip",
    });
    assert.deepEqual(await description("#pt-save", "Save", "Save to disk"), { chrome: "Save to disk", playwright: true });
    check("tooltip: text and for change in place, variant recreates, the target property wins, the description follows");

    // ------------------------------------------------ snackbar
    // The factory without a layer in light DOM, for its place and style
    await fresh(page, `<div id="ps"></div><dialog id="ps-modal" style="width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0">
      <button id="ps-save" type="button">Save</button>
      <div style="position: fixed; left: 0; right: 0; bottom: 0; height: 160px; z-index: 2147483647; background: rgb(255, 0, 0)"></div></dialog>`);
    const snackExpected = await page.evaluate(async () => {
      const w = window as unknown as PopWin;
      const snack = w.mtrl.createSnackbar({ message: "Archived", action: "Undo", duration: 0 });
      snack.show();
      await new Promise((r) => setTimeout(r, 500));
      const { top, left, width, height } = snack.element.getBoundingClientRect();
      const style = getComputedStyle(snack.element);
      const result = {
        rect: { top, left, width, height },
        style: { background: style.backgroundColor, color: style.color, shadow: style.boxShadow, radius: style.borderRadius, padding: style.padding, font: style.font },
        classes: [...snack.element.classList].sort().join(" "),
      };
      snack.destroy();
      return result;
    });
    await wait(300);

    await page.evaluate(() => {
      const host = document.getElementById("ps") as HTMLElement;
      const root = host.attachShadow({ mode: "open" });
      root.innerHTML = `<m-snackbar id="ps-bar" action="Undo" duration="0">Archived</m-snackbar>`;
      const w = window as unknown as PopWin;
      w.__pop = { root, events: [] };
      const bar = root.getElementById("ps-bar") as HTMLElement;
      for (const type of ["open", "action", "close"]) {
        bar.addEventListener(type, (event) => {
          const reason = (event as CustomEvent<{ reason?: string } | null>).detail?.reason;
          w.__pop.events.push(reason ? `${type}:${reason}` : type);
        });
      }
      // Save, inside the modal dialog, shows the snackbar
      (document.getElementById("ps-save") as HTMLElement).addEventListener("click", () => void (bar as Host).show());
    });
    const snackState = (): Promise<{ open: boolean; home: boolean; events: string[] }> =>
      page.evaluate(() => {
        const { root, events } = (window as unknown as PopWin).__pop;
        const bar = root.getElementById("ps-bar") as Host;
        const surface = bar.component?.element as HTMLElement;
        return { open: surface.matches(":popover-open"), home: surface.getRootNode() === bar.shadowRoot, events: [...events] };
      });

    // Shown on its own: in its root, where the factory puts it, styled
    await page.evaluate(() => void ((window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host).show());
    await wait(500);
    const alone = await page.evaluate(() => {
      const bar = (window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host;
      const surface = bar.component?.element as HTMLElement;
      const { top, left, width, height } = surface.getBoundingClientRect();
      const style = getComputedStyle(surface);
      return {
        inRoot: surface.getRootNode() === bar.shadowRoot,
        popoverOpen: surface.matches(":popover-open"),
        rect: { top, left, width, height },
        style: { background: style.backgroundColor, color: style.color, shadow: style.boxShadow, radius: style.borderRadius, padding: style.padding, font: style.font },
        classes: [...surface.classList].sort().join(" "),
      };
    });
    assert.deepEqual({ inRoot: alone.inRoot, popoverOpen: alone.popoverOpen }, { inRoot: true, popoverOpen: true });
    for (const key of ["top", "left", "width", "height"] as const) {
      assert.ok(Math.abs(alone.rect[key] - snackExpected.rect[key]) <= 1, `snackbar ${key} ${alone.rect[key]} is the unlayered snackbar's ${snackExpected.rect[key]}`);
    }
    assert.deepEqual(alone.style, snackExpected.style, "the snackbar's own colours, elevation, shape and font, as the factory's in light DOM");
    assert.equal(alone.classes, snackExpected.classes, "the factory's classes");
    await page.evaluate(() => void ((window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host & { hide: () => unknown }).hide());
    await wait(500);
    assert.deepEqual(await snackState(), { open: false, home: true, events: ["open", "close:api"] });
    check("snackbar top layer in a shadow root: shown in its element's root at the unlayered place, styled as the factory in light DOM");

    // Over a modal dialog: Save inside it shows the snackbar, which opens
    // inside the dialog, above it, and takes the action
    await page.evaluate(() => {
      (window as unknown as PopWin).__pop.events.length = 0;
      (document.getElementById("ps-modal") as HTMLDialogElement).showModal();
    });
    await page.locator("#ps-save").click();
    await wait(500);
    const overModal = await page.evaluate(() => {
      const bar = (window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host;
      const surface = bar.component?.element as HTMLElement;
      const action = surface.querySelector("button") as HTMLElement;
      const r = action.getBoundingClientRect();
      const hit = (surface.getRootNode() as ShadowRoot).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const style = getComputedStyle(surface);
      return {
        popoverOpen: surface.matches(":popover-open"),
        above: !!hit && action.contains(hit),
        inModal: (document.getElementById("ps-modal") as HTMLElement).contains((surface.getRootNode() as ShadowRoot).host),
        styled: style.backgroundColor,
      };
    });
    assert.deepEqual(overModal, { popoverOpen: true, above: true, inModal: true, styled: snackExpected.style.background });
    check("snackbar top layer: above an open modal dialog and a z-index sibling in it, inside it and styled");

    // The action by keyboard: `action` once, `close` once, focus back on Save
    await page.getByRole("button", { name: "Undo", exact: true }).focus();
    await page.keyboard.press("Enter");
    await wait(600);
    const acted = await snackState();
    const focus = await page.evaluate(() => document.activeElement?.id);
    assert.deepEqual({ ...acted, focus }, { open: false, home: true, events: ["open", "action", "close:action"], focus: "ps-save" });
    await page.evaluate(() => (document.getElementById("ps-modal") as HTMLDialogElement).close());
    check("snackbar: its action dispatches action once and closes once, focus returns, and it goes back to its root");

    // duration in place: it hides on its own after it
    await page.evaluate(() => {
      const { root, events } = (window as unknown as PopWin).__pop;
      events.length = 0;
      const bar = root.getElementById("ps-bar") as Host;
      bar.setAttribute("duration", "600");
      bar.show();
    });
    await wait(400);
    const during = (await snackState()).open;
    await wait(800);
    assert.deepEqual({ during, after: await snackState() }, { during: true, after: { open: false, home: true, events: ["open", "close:timeout"] } });
    check("snackbar: it hides after its duration, closing once");

    // message in place, action recreates
    const snackChanges = await page.evaluate(() => {
      const bar = (window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host;
      const before = bar.component;
      bar.textContent = "Moved";
      return new Promise((resolve) =>
        queueMicrotask(() => {
          const text = { same: bar.component === before, text: bar.component?.element.querySelector('[class*="snackbar__text"]')?.textContent };
          bar.setAttribute("message", "Deleted");
          const message = { same: bar.component === before, text: bar.component?.element.querySelector('[class*="snackbar__text"]')?.textContent };
          bar.setAttribute("action", "Restore");
          const action = { recreated: bar.component !== before, label: bar.component?.element.querySelector("button")?.textContent?.trim() };
          resolve({ text, message, action });
        })
      );
    });
    assert.deepEqual(snackChanges, {
      text: { same: true, text: "Moved" },
      message: { same: true, text: "Deleted" },
      action: { recreated: true, label: "Restore" },
    });
    check("snackbar: its text and message change in place, action recreates");

    // FLO-548: a snackbar shown behind another is queued, not open. Its state
    // turns visible and `open` is dispatched together, at its turn.
    const queued = await page.evaluate(async () => {
      type Bar = HTMLElement & { open: boolean; show: () => void; hide: () => void; component: { state: string } };
      const make = (text: string): Bar => {
        const bar = document.createElement("m-snackbar") as Bar;
        bar.setAttribute("duration", "0");
        bar.textContent = text;
        document.body.append(bar);
        return bar;
      };
      const first = make("First");
      const second = make("Second");
      const seen: string[] = [];
      second.addEventListener("open", () => seen.push(`open ${second.component.state} ${second.open}`));
      first.show();
      second.show();
      const waiting = { first: first.open, state: second.component.state, open: second.open, events: seen.length };
      first.hide();
      await new Promise((resolve) => setTimeout(resolve, 900));
      const turn = { state: second.component.state, open: second.open, seen: [...seen] };
      second.hide();
      first.remove();
      second.remove();
      return { waiting, turn };
    });
    assert.deepEqual(queued, {
      waiting: { first: true, state: "queued", open: false, events: 0 },
      turn: { state: "visible", open: true, seen: ["open visible true"] },
    });
    check("snackbar: one shown behind another is queued; visible and open come together at its turn");

    // The modals move while the snackbar shows. They are plain dialogs in
    // another element's open shadow root, as <m-dialog> renders one: the
    // snackbar is not their descendant, so it finds them by focus.
    await fresh(page, `<div id="ps"></div><div id="ps-other"></div><button id="ps-page" type="button">Page</button>`);
    await page.evaluate(() => {
      const w = window as unknown as PopWin & { __modals: Record<string, HTMLDialogElement> };
      const root = (document.getElementById("ps") as HTMLElement).attachShadow({ mode: "open" });
      root.innerHTML = `<m-snackbar id="ps-bar" action="Undo" duration="0">Archived</m-snackbar>`;
      const other = (document.getElementById("ps-other") as HTMLElement).attachShadow({ mode: "open" });
      const full = "width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0";
      other.innerHTML = `<dialog id="outer" style="${full}"><button type="button">Outer</button>
          <dialog id="inner" style="${full}"><button type="button">Inner</button></dialog></dialog>`;
      w.__modals = { outer: other.getElementById("outer") as HTMLDialogElement, inner: other.getElementById("inner") as HTMLDialogElement };
      w.__pop = { root, events: [] };
      const bar = root.getElementById("ps-bar") as HTMLElement;
      for (const type of ["open", "action", "close"]) {
        bar.addEventListener(type, (event) => {
          const reason = (event as CustomEvent<{ reason?: string } | null>).detail?.reason;
          w.__pop.events.push(reason ? `${type}:${reason}` : type);
        });
      }
    });
    const modals = (fn: "outer" | "inner" | "closeOuter" | "closeInner"): Promise<void> =>
      page.evaluate((fn) => {
        const { outer, inner } = (window as unknown as { __modals: Record<string, HTMLDialogElement> }).__modals;
        ({
          outer: () => outer.showModal(),
          inner: () => inner.showModal(),
          closeOuter: () => outer.close(),
          closeInner: () => inner.close(),
        })[fn]();
      }, fn);
    /** Where the surface is, whether it is on top at its action, and whether Chrome exposes its live region */
    const where = async (): Promise<{ open: boolean; place: string; above: boolean; live: boolean; events: string[] }> => {
      const state = await page.evaluate(() => {
        const { root, events } = (window as unknown as PopWin).__pop;
        const bar = root.getElementById("ps-bar") as Host;
        const surface = bar.component?.element as HTMLElement;
        const action = surface.querySelector("button") as HTMLElement;
        const r = action.getBoundingClientRect();
        const hit = (surface.getRootNode() as ShadowRoot).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        let place = "home";
        for (let node: Node | null = surface; node; node = node.parentNode ?? (node as ShadowRoot).host ?? null) {
          if (node instanceof HTMLDialogElement) {
            place = node.id;
            break;
          }
        }
        return { open: surface.matches(":popover-open"), place, above: !!hit && action.contains(hit), events: [...events] };
      });
      const { nodes } = (await client.send("Accessibility.getFullAXTree")) as {
        nodes: Array<{ role?: { value: string }; ignored?: boolean }>;
      };
      // Asked only while it shows: a closed one's node may linger in the tree
      return { ...state, live: state.open && nodes.some((n) => n.role?.value === "status" && !n.ignored) };
    };

    // 1. The modal it opened in closes: it goes home, still open and on top,
    // and its duration runs on from the start, closing once
    await modals("outer");
    await page.evaluate(() => {
      const bar = (window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host;
      bar.setAttribute("duration", "1500");
      bar.show();
    });
    await wait(400);
    const inModal = await where();
    await modals("closeOuter");
    await wait(200);
    const backHome = await where();
    await wait(600);
    const stillOpen = (await where()).open;
    await wait(800);
    assert.deepEqual(
      { inModal, backHome, stillOpen, after: await where() },
      {
        inModal: { open: true, place: "outer", above: true, live: true, events: ["open"] },
        backHome: { open: true, place: "home", above: true, live: true, events: ["open"] },
        stillOpen: true,
        after: { open: false, place: "home", above: false, live: false, events: ["open", "close:timeout"] },
      }
    );
    check("snackbar: the modal it is in closing sends it home, still on top, its timer running on, closing once");

    // 2. A modal opens while it shows: it moves in, clickable, its live region
    // still exposed (not announced again: its text has not changed)
    await page.evaluate(() => {
      const { root, events } = (window as unknown as PopWin).__pop;
      events.length = 0;
      const bar = root.getElementById("ps-bar") as Host;
      bar.setAttribute("duration", "0");
      bar.show();
    });
    await wait(400);
    const before = await where();
    await modals("outer");
    await wait(100);
    const opened = await where();
    assert.deepEqual(
      { before, opened },
      {
        before: { open: true, place: "home", above: true, live: true, events: ["open"] },
        opened: { open: true, place: "outer", above: true, live: true, events: ["open"] },
      }
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await wait(600);
    const undone = await where();
    await modals("closeOuter");
    assert.deepEqual(undone, { open: false, place: "home", above: false, live: false, events: ["open", "action", "close:action"] });
    check("snackbar: a modal opening while it shows takes it in, clickable, its live region exposed, the action once");

    // 3. Nested modals: the topmost wins, and closing it hands the snackbar
    // to the one below
    await page.evaluate(() => void ((window as unknown as PopWin).__pop.events.length = 0));
    await modals("outer");
    await modals("inner");
    await page.evaluate(() => void ((window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host).show());
    await wait(400);
    const top = await where();
    await modals("closeInner");
    await wait(100);
    const below = await where();
    await modals("closeOuter");
    await wait(100);
    const out = await where();
    await page.evaluate(() => void ((window as unknown as PopWin).__pop.root.getElementById("ps-bar") as Host & { hide: () => unknown }).hide());
    await wait(600);
    assert.deepEqual(
      { top, below, out, events: (await where()).events },
      {
        top: { open: true, place: "inner", above: true, live: true, events: ["open"] },
        below: { open: true, place: "outer", above: true, live: true, events: ["open"] },
        out: { open: true, place: "home", above: true, live: true, events: ["open"] },
        events: ["open", "close:api"],
      }
    );
    check("snackbar: of nested modals the topmost takes it, then the one below, then home");
  }

  // ---------------------------------------------------------------- modal surfaces in the top layer
  // <m-dialog>, the modal sheets, the modal drawer and the modal rail are a
  // native <dialog> in their shadow root, shown with showModal() (the
  // factories' layer: "top"). Each is checked inside another shadow root that
  // holds its opener, with a button on the page outside it: :modal and
  // styled, the page inert (#249: a drawer in a shadow root made only its own
  // root inert), Tab kept inside, Escape and a backdrop click closing once,
  // focus back on the opener, slotted content in its region, and the same
  // surface and scrim as the factory's without a layer.
  {
    type Host = HTMLElement & { component: { on: (event: string, handler: () => void) => unknown } | null };
    type ModalWin = Win & {
      __modal: { closes: number; outside: number };
      mtrl: Record<string, (config: object) => { element: HTMLElement; open?: () => unknown; expand?: () => unknown; destroy: () => void }>;
    };
    interface ModalCase {
      name: string;
      markup: string;
      /** How the opener opens it: a method, or the attribute it reflects. */
      opens: "show" | "open" | "expanded";
      /** The painted surface, in the element's shadow root and in the factory's element. */
      surface: string;
      /** Slot name ("" for the default) to the region class it must sit in. */
      regions: Record<string, string>;
      factory: string;
      config: object;
      /** The factory's scrim without a layer, which the ::backdrop must match. */
      scrim: string;
      /** A backdrop point: beside the surface, off the outside button. */
      beside: { x: number; y: number };
    }
    const ITEMS = [{ id: "a", label: "Inbox", icon: ICON }, { id: "b", label: "Sent", icon: ICON }];
    const cases: ModalCase[] = [
      {
        name: "dialog",
        markup: `<m-dialog id="m"><span slot="headline">Discard draft?</span>Your changes will be lost.
          <m-button slot="actions" variant="text">Keep</m-button><m-button slot="actions" variant="text">Discard</m-button></m-dialog>`,
        opens: "show",
        surface: '[class~="mtrl-dialog"]',
        regions: { headline: "dialog__header-title", "": "dialog__content", actions: "dialog__footer" },
        factory: "createDialog",
        config: { title: "Discard draft?", content: "Your changes will be lost.", buttons: [{ text: "Keep" }, { text: "Discard" }] },
        scrim: '[class~="mtrl-dialog__overlay"]',
        beside: { x: 30, y: 650 },
      },
      {
        name: "bottom sheet",
        markup: `<m-bottom-sheet id="m" modal><span slot="headline">Share</span><button type="button">Copy link</button><button type="button">Email</button></m-bottom-sheet>`,
        opens: "show",
        surface: '[class~="mtrl-bottom-sheet__container"]',
        regions: { headline: "bottom-sheet__title", "": "bottom-sheet__content" },
        factory: "createBottomSheet",
        config: { title: "Share", content: '<button type="button">Copy link</button><button type="button">Email</button>' },
        scrim: '[class~="mtrl-bottom-sheet__scrim"]',
        beside: { x: 30, y: 100 },
      },
      {
        name: "side sheet",
        markup: `<m-side-sheet id="m" modal><span slot="headline">Filters</span><button type="button">Recent</button><button type="button">Starred</button></m-side-sheet>`,
        opens: "show",
        surface: '[class~="mtrl-side-sheet__container"]',
        regions: { headline: "side-sheet__title", "": "side-sheet__content" },
        factory: "createSideSheet",
        config: { title: "Filters", content: '<button type="button">Recent</button><button type="button">Starred</button>' },
        scrim: '[class~="mtrl-side-sheet__scrim"]',
        beside: { x: 30, y: 650 },
      },
      {
        name: "drawer",
        markup: `<m-drawer id="m" modal aria-label="Mail"><m-drawer-item value="a">Inbox</m-drawer-item>
          <m-drawer-item value="b">Sent</m-drawer-item></m-drawer>`,
        opens: "open",
        surface: '[class~="mtrl-drawer__sheet"]',
        regions: {},
        factory: "createDrawer",
        config: { variant: "modal", ariaLabel: "Mail", items: [{ id: "a", label: "Inbox" }, { id: "b", label: "Sent" }] },
        scrim: '[class~="mtrl-drawer__scrim"]',
        beside: { x: 870, y: 650 },
      },
      {
        name: "navigation rail",
        markup: `<m-navigation-rail id="m" layout="modal" aria-label="Main">
          <m-navigation-rail-item value="a" icon='${ICON}'>Inbox</m-navigation-rail-item>
          <m-navigation-rail-item value="b" icon='${ICON}'>Sent</m-navigation-rail-item></m-navigation-rail>`,
        opens: "expanded",
        surface: '[class~="mtrl-navigation-rail"]',
        regions: {},
        factory: "createNavigationRail",
        config: { layout: "modal", ariaLabel: "Main", items: ITEMS },
        // The factory's modal rail is a <dialog> already: its own ::backdrop
        scrim: "::backdrop",
        beside: { x: 870, y: 650 },
      },
    ];
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);

    const stage = async (item: ModalCase): Promise<void> => {
      await fresh(page, `<button id="outside" type="button" style="position:fixed;top:8px;left:400px">Outside</button>
        <div id="wrap"></div><section id="factory"></section>`);
      await page.evaluate(({ markup, opens }) => {
        const w = window as unknown as ModalWin;
        w.__modal = { closes: 0, outside: 0 };
        document.getElementById("outside")?.addEventListener("click", () => void w.__modal.outside++);
        const root = (document.getElementById("wrap") as HTMLElement).attachShadow({ mode: "open" });
        root.innerHTML = `<button id="opener" type="button">Open</button>${markup}`;
        const host = root.getElementById("m") as Host & Record<string, () => unknown>;
        (root.getElementById("opener") as HTMLElement).addEventListener("click", () => {
          if (opens === "show") host.show();
          else host.setAttribute(opens, "");
        });
        if (host.localName === "m-navigation-rail") host.component?.on("collapse", () => void w.__modal.closes++);
        else host.addEventListener("close", () => void w.__modal.closes++);
      }, { markup: item.markup, opens: item.opens });
      await page.waitForFunction(() => {
        const host = document.getElementById("wrap")?.shadowRoot?.getElementById("m") as Host | null;
        return !!host?.component;
      });
    };
    const openIt = async (): Promise<void> => {
      await page.locator("#wrap").getByRole("button", { name: "Open", exact: true }).click();
      await wait(700);
    };
    /** The inner <dialog>, whether it is open and modal, and the host's reflected state. */
    const state = (opens: string): Promise<{ modal: boolean; open: boolean; reflected: boolean; closes: number; outside: number }> =>
      page.evaluate((opens) => {
        const host = document.getElementById("wrap")?.shadowRoot?.getElementById("m") as Host;
        const dialog = host.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
        const { closes, outside } = (window as unknown as ModalWin).__modal;
        return {
          modal: dialog.matches(":modal"),
          open: dialog.open,
          reflected: host.hasAttribute(opens === "expanded" ? "expanded" : "open"),
          closes,
          outside,
        };
      }, opens);
    /** Where focus is, and whether it is inside the element (its light DOM or its shadow root). */
    const focus = (): Promise<{ inside: boolean; opener: boolean; label: string }> =>
      page.evaluate(() => {
        const host = document.getElementById("wrap")?.shadowRoot?.getElementById("m") as HTMLElement;
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        let node: Node | null = active;
        while (node && node !== host) node = node.parentNode instanceof ShadowRoot ? node.parentNode.host : node.parentNode;
        return {
          inside: node === host,
          opener: active?.id === "opener",
          // A button in a shadow root takes its text from its host's slot
          label: (active?.textContent?.trim() || ((active?.getRootNode() as ShadowRoot).host?.textContent ?? "")).trim(),
        };
      });

    for (const item of cases) {
      await stage(item);
      await openIt();
      // The page outside is inert: it takes no focus, and a click on it lands
      // on the backdrop (checked with the backdrop click below).
      // Checked first: without showModal() this is what fails
      // Focus is not taken at all, not taken and pulled back: the modal
      // drawer's own focus handler would pull it back without the platform.
      const outsideFocus = await page.evaluate(() => {
        const outside = document.getElementById("outside") as HTMLElement;
        let focused = 0;
        outside.addEventListener("focus", () => void focused++);
        outside.focus();
        return { focused, active: document.activeElement === outside };
      });
      assert.deepEqual(outsideFocus, { focused: 0, active: false }, `${item.name}: a button on the page outside cannot be focused`);
      const opened = await state(item.opens);
      const styled = await page.evaluate((selector) => {
        const host = document.getElementById("wrap")?.shadowRoot?.getElementById("m") as HTMLElement;
        const root = host.shadowRoot as ShadowRoot;
        const dialog = root.querySelector("dialog") as HTMLDialogElement;
        const surface = (dialog.matches(selector) ? dialog : dialog.querySelector(selector)) as HTMLElement;
        const box = surface.getBoundingClientRect();
        return {
          painted: getComputedStyle(surface).backgroundColor !== "rgba(0, 0, 0, 0)" && box.width > 0 && box.height > 0,
          inShadow: dialog.getRootNode() === root,
        };
      }, item.surface);
      assert.deepEqual(
        { ...opened, ...styled },
        { modal: true, open: true, reflected: true, closes: 0, outside: 0, painted: true, inShadow: true },
        `${item.name}: open`
      );
      check(`${item.name} in the top layer: a :modal <dialog> in its shadow root, painted, its state reflected`);


      const stops: Array<{ inside: boolean; label: string }> = [];
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab");
        stops.push(await focus());
      }
      assert.ok(
        stops.every((stop) => stop.inside) && new Set(stops.map((stop) => stop.label)).size >= 2,
        `${item.name}: Tab moves between its stops and stays inside ${JSON.stringify(stops)}`
      );
      check(`${item.name} in the top layer: the page outside takes no focus, and Tab stays inside`);

      await page.keyboard.press("Escape");
      await wait(400);
      const escaped = await state(item.opens);
      const back = await focus();
      assert.deepEqual(
        { ...escaped, opener: back.opener },
        { modal: false, open: false, reflected: false, closes: 1, outside: 0, opener: true },
        `${item.name}: Escape`
      );
      check(`${item.name} in the top layer: Escape closes it once and focus returns to the opener in the shadow root`);

      await openIt();
      const outside = await page.evaluate(() => {
        const box = (document.getElementById("outside") as HTMLElement).getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      });
      await page.mouse.click(outside.x, outside.y);
      await wait(400);
      const clicked = await state(item.opens);
      assert.deepEqual(
        { outside: clicked.outside, closes: clicked.closes, open: clicked.open, opener: (await focus()).opener },
        { outside: 0, closes: 2, open: false, opener: true },
        `${item.name}: a click on the outside button`
      );
      await openIt();
      await page.mouse.click(item.beside.x, item.beside.y);
      await wait(400);
      const beside = await state(item.opens);
      assert.deepEqual({ closes: beside.closes, open: beside.open }, { closes: 3, open: false }, `${item.name}: backdrop click`);
      check(`${item.name} in the top layer: a click on the page's button reaches the backdrop, not the button, and closes it once, as the factory's scrim does`);

      if (Object.keys(item.regions).length) {
        const regions = await page.evaluate((regions) => {
          const host = document.getElementById("wrap")?.shadowRoot?.getElementById("m") as HTMLElement;
          const root = host.shadowRoot as ShadowRoot;
          const result: Record<string, boolean> = {};
          for (const [name, region] of Object.entries(regions)) {
            const slot = root.querySelector(name ? `slot[name="${name}"]` : "slot:not([name])") as HTMLSlotElement;
            result[name] = !!slot.closest(`[class~="mtrl-${region}"]`) && slot.assignedNodes().some((n) => (n.textContent ?? "").trim() !== "");
          }
          return result;
        }, item.regions);
        assert.deepEqual(regions, Object.fromEntries(Object.keys(item.regions).map((name) => [name, true])), `${item.name}: regions`);
        check(`${item.name} in the top layer: slotted content renders in its regions`);
      }

      // Factory parity: the same surface and scrim as the factory's own
      // without a layer, in light DOM with the global stylesheet.
      await openIt();
      const measure = (): Promise<Record<string, string | number>> =>
        page.evaluate((selector) => {
          const host = document.getElementById("wrap")?.shadowRoot?.getElementById("m") as HTMLElement;
          const dialog = host.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
          const surface = (dialog.matches(selector) ? dialog : dialog.querySelector(selector)) as HTMLElement;
          const box = surface.getBoundingClientRect();
          const style = getComputedStyle(surface);
          const backdrop = getComputedStyle(dialog, "::backdrop");
          return {
            width: Math.round(box.width),
            height: Math.round(box.height),
            left: Math.round(box.left),
            top: Math.round(box.top),
            radius: style.borderRadius,
            background: style.backgroundColor,
            scrim: backdrop.backgroundColor,
            scrimOpacity: backdrop.opacity,
          };
        }, item.surface);
      const layered = await measure();
      const factory = await page.evaluate(({ name, config, surface, scrim }) => {
        const w = window as unknown as ModalWin;
        const component = w.mtrl[name](config);
        if (!component.element.isConnected) (document.getElementById("factory") as HTMLElement).append(component.element);
        (component.open ?? component.expand)?.call(component);
        return new Promise<Record<string, string | number>>((resolve) =>
          setTimeout(() => {
            const root = component.element;
            const surfaceElement = (root.matches(surface) ? root : root.querySelector(surface)) as HTMLElement;
            const box = surfaceElement.getBoundingClientRect();
            const style = getComputedStyle(surfaceElement);
            const scrimStyle = scrim === "::backdrop"
              ? getComputedStyle(root, "::backdrop")
              : getComputedStyle((root.closest(scrim) ?? root.querySelector(scrim)) as HTMLElement);
            const result = {
              width: Math.round(box.width),
              height: Math.round(box.height),
              left: Math.round(box.left),
              top: Math.round(box.top),
              radius: style.borderRadius,
              background: style.backgroundColor,
              scrim: scrimStyle.backgroundColor,
              scrimOpacity: scrimStyle.opacity,
            };
            component.destroy();
            resolve(result);
          }, 700)
        );
      }, { name: item.factory, config: item.config, surface: item.surface, scrim: item.scrim });
      // Within a pixel: slotted text lays out its line box a rounding apart
      const near = (a: Record<string, string | number>): Record<string, string | number> =>
        Object.fromEntries(Object.entries(a).map(([k, v]) => [k, typeof v === "number" && Math.abs(v - (factory[k] as number)) <= 1 ? factory[k] : v]));
      assert.deepEqual(near(layered), factory, `${item.name}: the same surface and scrim as the factory's`);
      check(`${item.name} in the top layer: the factory's size, place, corners and colours, and its scrim colour on ::backdrop`);
      await page.keyboard.press("Escape");
    }

    // <m-dialog>: the headline attribute names it without a slotted headline,
    // aria-label in place of one, and a refused cancel keeps it open.
    await fresh(page, `<m-dialog id="named" headline="Delete file?">It goes for good.</m-dialog>`);
    await page.evaluate(() => {
      const host = document.getElementById("named") as HTMLElement & { show: () => unknown };
      host.addEventListener("cancel", (event) => event.preventDefault(), { once: true });
      host.show();
    });
    await wait(600);
    const named = await page.getByRole("alertdialog", { name: "Delete file?" }).count();
    await page.keyboard.press("Escape");
    await wait(100);
    const refused = await page.evaluate(() => document.getElementById("named")?.hasAttribute("open"));
    await page.keyboard.press("Escape");
    await wait(100);
    const closed = await page.evaluate(() => !document.getElementById("named")?.hasAttribute("open"));
    await page.evaluate(() => {
      const host = document.getElementById("named") as HTMLElement;
      host.setAttribute("aria-label", "Confirm");
      host.setAttribute("open", "");
    });
    await wait(600);
    const labelled = await page.getByRole("alertdialog", { name: "Confirm" }).count();
    await page.evaluate(() => document.getElementById("named")?.removeAttribute("open"));
    await wait(100);
    assert.deepEqual({ named, refused, closed, labelled }, { named: 1, refused: true, closed: true, labelled: 1 });
    check("dialog element: the headline attribute or aria-label names it; a refused cancel keeps it open");

    // FLO-386: <m-dialog>'s action buttons (here from the global defaults) and
    // its dividers are mtrl buttons and dividers drawn in its shadow root. Their
    // sheets used to be missing there, so the buttons rendered unstyled: 70
    // computed properties apart from the same button in the page.
    const nested = await page.evaluate(async () => {
      const w = window as unknown as { mtrl: Record<string, (...args: unknown[]) => { element: HTMLElement; destroy?: () => void }> & {
        setComponentDefaults: (name: string, config: object) => void; clearGlobalDefaults: () => void;
      } };
      w.mtrl.setComponentDefaults("dialog", { buttons: [{ text: "Save", variant: "text" }] });
      const host = document.getElementById("host") as HTMLElement;
      host.innerHTML = '<m-dialog id="nested" open divider headline="Title">Content</m-dialog>';
      await new Promise((r) => setTimeout(r, 400));
      const root = (document.getElementById("nested") as HTMLElement).shadowRoot as ShadowRoot;
      const props = ["border-radius", "height", "padding-left", "padding-right", "font-size", "font-weight", "color", "background-color", "cursor", "display"];
      const read = (el: Element) => Object.fromEntries(props.map((p) => [p, getComputedStyle(el).getPropertyValue(p)]));
      const inDialog = root.querySelector(".mtrl-button") as HTMLElement;
      const divider = root.querySelector(".mtrl-divider") as HTMLElement;
      // The same parts in the page, under the global stylesheet
      const button = w.mtrl.createButton({ text: "Save", variant: "text" });
      const line = w.mtrl.createDivider();
      const page = document.createElement("div");
      page.append(button.element, line.element);
      document.body.append(page);
      const dividerProps = ["height", "background-color", "border-top-width", "border-top-style"];
      const readLine = (el: Element) => Object.fromEntries(dividerProps.map((p) => [p, getComputedStyle(el).getPropertyValue(p)]));
      const result = {
        button: { inDialog: read(inDialog), inPage: read(button.element) },
        divider: { inDialog: readLine(divider), inPage: readLine(line.element) },
      };
      page.remove();
      w.mtrl.clearGlobalDefaults();
      host.innerHTML = "";
      return result;
    });
    assert.deepEqual(nested.button.inDialog, nested.button.inPage, "the dialog's button is styled as a button in the page");
    assert.deepEqual(nested.divider.inDialog, nested.divider.inPage, "the dialog's divider is styled as a divider in the page");
    check("dialog element: its buttons and dividers carry their own sheets in its shadow root (FLO-386)");

    // A snackbar shown while a modal is open goes into the topmost <dialog>, in a
    // display:contents wrapper: its action is a Tab stop, its fixed box is placed
    // against the viewport, the slots keep their regions, and closes still come once.
    for (const tag of ["m-dialog", "m-bottom-sheet", "m-side-sheet"]) {
      await fresh(page, `<${tag} id="guest" modal headline="Host"><button type="button">Own</button></${tag}>`);
      await page.evaluate(() => {
        const w = window as unknown as ModalWin;
        w.__modal = { closes: 0, outside: 0 };
        const host = document.getElementById("guest") as HTMLElement & { show: () => unknown };
        host.addEventListener("close", () => void w.__modal.closes++);
        host.show();
      });
      await wait(600);
      const guest = await page.evaluate(() => {
        const dialog = document.getElementById("guest")?.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
        const wrapper = document.createElement("div");
        wrapper.style.display = "contents";
        wrapper.innerHTML = '<div id="bar" style="position:fixed;left:0;bottom:0;width:100px;height:20px"><button type="button" id="undo">Undo</button></div>';
        dialog.append(wrapper);
        const bar = (wrapper.firstElementChild as HTMLElement).getBoundingClientRect();
        return { left: Math.round(bar.left), bottom: Math.round(bar.bottom), viewport: window.innerHeight };
      });
      const reached: string[] = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        reached.push(await page.evaluate(() => {
          let active = document.activeElement;
          while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
          return active?.id || active?.textContent?.trim() || "";
        }));
      }
      const regions = await page.evaluate(() => {
        const root = document.getElementById("guest")?.shadowRoot as ShadowRoot;
        const slot = root.querySelector("slot:not([name])") as HTMLSlotElement;
        return slot.assignedElements().map((el) => el.textContent);
      });
      await page.keyboard.press("Escape");
      await wait(300);
      const closes = await page.evaluate(() => (window as unknown as ModalWin).__modal.closes);
      assert.deepEqual(
        { left: guest.left, bottom: guest.bottom, undo: reached.includes("undo"), own: reached.includes("Own"), regions, closes },
        { left: 0, bottom: guest.viewport, undo: true, own: true, regions: ["Own"], closes: 1 },
        `${tag}: a snackbar in its <dialog> ${JSON.stringify(reached)}`
      );
    }
    check("modal elements: a snackbar appended to the open <dialog> is reachable by Tab, placed on the viewport, and changes no region or close");
  }

  // ---------------------------------------------------------------- API gaps (#257, #247)
  // State events (`expand`, `collapse`, `open`, `close`) leave the model
  // clean; the attributes md3.io's generated code needs; a rail's default
  // value kept when its items are completed after upgrade.
  {
    type GapHost = HTMLElement & Record<string, unknown> & { component: Record<string, unknown> | null };
    type GapWin = Win & { __gaps: Array<{ type: string; attribute?: boolean }> };
    const wait = (ms: number): Promise<unknown> => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms);
    /** Records the host's events, with whether `attribute` was set as each was dispatched. */
    const record = (id: string, events: string[], attribute?: string): Promise<void> =>
      page.evaluate(({ id, events, attribute }) => {
        const w = window as unknown as GapWin;
        w.__gaps = [];
        const host = document.getElementById(id) as HTMLElement;
        for (const type of events) {
          host.addEventListener(type, () =>
            w.__gaps.push(attribute ? { type, attribute: host.hasAttribute(attribute) } : { type })
          );
        }
      }, { id, events, attribute });
    const recorded = (): Promise<Array<{ type: string; attribute?: boolean }>> =>
      page.evaluate(() => (window as unknown as GapWin).__gaps.splice(0));

    // ------------------------------------------------ navigation rail: expand and collapse
    await fresh(
      page,
      `<m-navigation-rail id="gr" value="a" aria-label="Gaps">
         <m-navigation-rail-item value="a" icon='${ICON}'>Inbox</m-navigation-rail-item>
         <m-navigation-rail-item value="b" icon='${ICON}'>Sent</m-navigation-rail-item>
         <m-navigation-rail-item value="c" icon='${ICON}'>Starred</m-navigation-rail-item>
       </m-navigation-rail>`
    );
    await record("gr", ["expand", "collapse", "change"], "expanded");
    const railValue = (): Promise<unknown> => page.evaluate(() => (document.getElementById("gr") as GapHost).value);
    await page.getByRole("navigation", { name: "Gaps" }).getByRole("button", { name: "Expand navigation" }).click();
    await wait(50);
    const byUser = await recorded();
    await page.evaluate(() => (document.getElementById("gr") as GapHost & { collapse: () => unknown }).collapse());
    const byMethod = await recorded();
    await page.evaluate(() => (document.getElementById("gr") as GapHost & { expand: () => unknown }).expand());
    await recorded();
    await page.evaluate(() => document.getElementById("gr")?.removeAttribute("expanded"));
    await page.evaluate(() => document.getElementById("gr")?.setAttribute("expanded", ""));
    const byAttribute = await recorded();
    await page.evaluate(() => document.getElementById("gr")?.setAttribute("value", "b"));
    const moved = await railValue();
    assert.deepEqual(
      { byUser, byMethod, byAttribute, moved },
      {
        byUser: [{ type: "expand", attribute: true }],
        byMethod: [{ type: "collapse", attribute: false }],
        byAttribute: [],
        moved: "b",
      },
      "rail: expand and collapse are state events"
    );
    check("navigation rail: expand and collapse are dispatched by the user and by a method, after expanded reflects, not by the attribute");
    check("navigation rail: after expand, a value attribute change still moves the clean rail");

    // #247: items completed after upgrade, as frameworks set the icons after
    // creating the child
    await fresh(page, "");
    await page.evaluate(() => {
      const host = document.getElementById("host") as HTMLElement;
      host.innerHTML = `<m-navigation-rail id="late" value="b" aria-label="Late">
        <m-navigation-rail-item value="a">Inbox</m-navigation-rail-item>
        <m-navigation-rail-item value="b">Sent</m-navigation-rail-item></m-navigation-rail>`;
    });
    await wait(50);
    const before = await page.evaluate(() => document.getElementById("late")?.shadowRoot?.querySelectorAll("[data-id]").length);
    await page.evaluate((icon) => {
      document.querySelectorAll("#late m-navigation-rail-item").forEach((item) => item.setAttribute("icon", icon));
    }, ICON);
    await wait(50);
    const late = await page.evaluate(() => (document.getElementById("late") as GapHost).value);
    const current = await page.getByRole("navigation", { name: "Late" }).getByRole("button", { name: "Sent" }).getAttribute("aria-current");
    // A dirty rail keeps its own value when items change
    await page.getByRole("navigation", { name: "Late" }).getByRole("button", { name: "Inbox" }).click();
    await page.evaluate((icon) => {
      const item = document.createElement("m-navigation-rail-item");
      item.setAttribute("value", "c");
      item.setAttribute("icon", icon);
      item.textContent = "Starred";
      document.getElementById("late")?.append(item);
    }, ICON);
    await wait(50);
    const dirty = await page.evaluate(() => (document.getElementById("late") as GapHost).value);
    assert.deepEqual({ before, late, current, dirty }, { before: 0, late: "b", current: "page", dirty: "a" }, "rail #247");
    check("navigation rail: items without icons, completed after upgrade, take the default value (#247); a dirty rail keeps its own");

    // ------------------------------------------------ drawer: open and close leave it clean; closing refused
    await fresh(
      page,
      `<m-drawer id="gd" modal open value="a" aria-label="Gaps drawer">
         <m-drawer-item value="a">Inbox</m-drawer-item><m-drawer-item value="b">Sent</m-drawer-item>
       </m-drawer>`
    );
    await wait(400);
    await record("gd", ["open", "close"]);
    await page.keyboard.press("Escape");
    await wait(300);
    const drawerClosed = await recorded();
    await page.evaluate(() => document.getElementById("gd")?.setAttribute("value", "b"));
    const drawerValue = await page.evaluate(() => (document.getElementById("gd") as GapHost).value);
    assert.deepEqual({ drawerClosed, drawerValue }, { drawerClosed: [{ type: "close" }], drawerValue: "b" }, "drawer clean");
    check("drawer: closing dispatches close and leaves the drawer clean: the value attribute still moves it");

    /** Keeps the current component, to tell an in-place change from a recreation. */
    const keep = (id: string): Promise<void> =>
      page.evaluate((id) => void ((window as unknown as Win).__kept = (document.getElementById(id) as GapHost).component), id);
    const isKept = (id: string): Promise<boolean> =>
      page.evaluate((id) => (document.getElementById(id) as GapHost).component === (window as unknown as Win).__kept, id);

    // Each attribute refuses its own way of closing and leaves the other; set
    // on the open drawer, in place. Refused, Escape does not reach the
    // factory's cancel listener, as with <m-dialog>'s refused cancel.
    const drawerOpen = (): Promise<boolean> =>
      page.evaluate(() => !!(document.getElementById("gd")?.shadowRoot?.querySelector("dialog") as HTMLDialogElement).open);
    const reopen = async (): Promise<void> => {
      await page.evaluate(() => document.getElementById("gd")?.setAttribute("open", ""));
      await wait(400);
    };
    const dismissals: Record<string, { escape: boolean; scrim: boolean; same: boolean }> = {};
    for (const refused of [["no-close-on-scrim-click"], ["no-close-on-escape"], ["no-close-on-scrim-click", "no-close-on-escape"]]) {
      await fresh(
        page,
        `<m-drawer id="gd" modal open aria-label="Gaps drawer"><m-drawer-item value="a">Inbox</m-drawer-item></m-drawer>`
      );
      await wait(400);
      await keep("gd");
      await page.evaluate((refused) => {
        const host = document.getElementById("gd") as HTMLElement;
        for (const name of refused) host.setAttribute(name, "");
      }, refused);
      await page.keyboard.press("Escape");
      await wait(300);
      const escape = !(await drawerOpen());
      await reopen();
      await page.mouse.click(870, 650);
      await wait(300);
      const scrim = !(await drawerOpen());
      dismissals[refused.join(" ")] = { escape, scrim, same: await isKept("gd") };
    }
    assert.deepEqual(
      dismissals,
      {
        "no-close-on-scrim-click": { escape: true, scrim: false, same: true },
        "no-close-on-escape": { escape: false, scrim: true, same: true },
        "no-close-on-scrim-click no-close-on-escape": { escape: false, scrim: false, same: true },
      },
      "drawer no-close-on-*"
    );
    check("drawer: no-close-on-scrim-click alone, no-close-on-escape alone and both refuse only their own closing, in place");

    // ------------------------------------------------ drawer: default value when items complete late
    // A drawer item needs a label, not an icon: icons set late change
    // nothing, a label set late (a framework setting the prop after creating
    // the child) is the #247 case.
    const lateDrawer = async (items: string, complete: (icon: string) => void): Promise<{ before: number; value: unknown; current: string | null }> => {
      await fresh(page, "");
      await page.evaluate((items) => {
        (document.getElementById("host") as HTMLElement).innerHTML =
          `<m-drawer id="ld" open value="b" aria-label="Late drawer">${items}</m-drawer>`;
      }, items);
      await wait(50);
      const before = await page.evaluate(() => document.getElementById("ld")?.shadowRoot?.querySelectorAll("[data-id]").length ?? 0);
      await page.evaluate(complete, ICON);
      await wait(50);
      return {
        before,
        value: await page.evaluate(() => (document.getElementById("ld") as GapHost).value),
        current: await page.getByRole("navigation", { name: "Late drawer" }).getByRole("button", { name: "Sent" }).getAttribute("aria-current"),
      };
    };
    const iconsLate = await lateDrawer(
      '<m-drawer-item value="a">Inbox</m-drawer-item><m-drawer-item value="b">Sent</m-drawer-item>',
      (icon) => document.querySelectorAll("#ld m-drawer-item").forEach((item) => item.setAttribute("icon", icon))
    );
    const labelsLate = await lateDrawer(
      '<m-drawer-item value="a"></m-drawer-item><m-drawer-item value="b"></m-drawer-item>',
      () => document.querySelectorAll("#ld m-drawer-item").forEach((item, i) => item.setAttribute("label", ["Inbox", "Sent"][i]))
    );
    // A dirty drawer keeps its own value when items change
    await page.getByRole("navigation", { name: "Late drawer" }).getByRole("button", { name: "Inbox" }).click();
    await page.evaluate(() => {
      const item = document.createElement("m-drawer-item");
      item.setAttribute("value", "c");
      item.textContent = "Starred";
      document.getElementById("ld")?.append(item);
    });
    await wait(50);
    const dirtyDrawer = await page.evaluate(() => (document.getElementById("ld") as GapHost).value);
    assert.deepEqual(
      { iconsLate, labelsLate, dirtyDrawer },
      {
        iconsLate: { before: 2, value: "b", current: "page" },
        labelsLate: { before: 0, value: "b", current: "page" },
        dirtyDrawer: "a",
      },
      "drawer default value"
    );
    check("drawer: items completed after upgrade (icons, or labels) take the default value; a dirty drawer keeps its own");

    // ------------------------------------------------ dialog
    await fresh(
      page,
      `<m-dialog id="gdl" headline="Title" subtitle="More" size="small" divider footer-alignment="center">Body
         <m-button slot="actions" variant="text">OK</m-button></m-dialog>`
    );
    const dialogParts = (): Promise<Record<string, unknown>> =>
      page.evaluate(() => {
        const host = document.getElementById("gdl") as GapHost;
        const root = host.shadowRoot as ShadowRoot;
        const dialog = root.querySelector("dialog") as HTMLElement;
        const footer = root.querySelector('[class~="mtrl-dialog__footer"]') as HTMLElement;
        return {
          size: [...dialog.classList].filter((c) => /dialog--(small|large|fullwidth|fullscreen)$/.test(c)),
          subtitle: root.querySelector('[class~="mtrl-dialog__header-subtitle"]')?.textContent ?? null,
          dividers: [...root.querySelectorAll('[class~="mtrl-dialog__divider"]')].map((d) =>
            d.classList.contains("mtrl-dialog__header-divider") ? "header" : "footer"
          ),
          alignment: getComputedStyle(footer).justifyContent,
          close: !!root.querySelector('[class~="mtrl-dialog__header-close"]'),
        };
      });
    const first = await dialogParts();
    await keep("gdl");
    await page.evaluate(() => {
      const host = document.getElementById("gdl") as HTMLElement;
      host.setAttribute("subtitle", "Less");
      host.setAttribute("footer-alignment", "space-between");
    });
    const inPlace = await dialogParts();
    const kept = await isKept("gdl");
    await page.evaluate(() => {
      const host = document.getElementById("gdl") as HTMLElement;
      host.removeAttribute("subtitle");
      host.setAttribute("size", "large");
      host.setAttribute("close-button", "");
      host.removeAttribute("divider");
    });
    const recreated = await dialogParts();
    assert.deepEqual(
      [first, inPlace, recreated],
      [
        { size: ["mtrl-dialog--small"], subtitle: "More", dividers: ["header", "footer"], alignment: "center", close: false },
        { size: ["mtrl-dialog--small"], subtitle: "Less", dividers: ["header", "footer"], alignment: "space-between", close: false },
        { size: ["mtrl-dialog--large"], subtitle: null, dividers: [], alignment: "space-between", close: true },
      ],
      "dialog attributes"
    );
    assert.equal(kept, true, "subtitle and footer-alignment are applied in place");
    assert.equal(await isKept("gdl"), false, "size, close-button and divider recreate it");
    check("dialog: size, close-button and divider recreate it; subtitle and footer-alignment apply in place");

    await fresh(page, `<m-dialog id="gdk" headline="Stay" no-close-on-escape no-close-on-scrim-click>Body</m-dialog>`);
    await record("gdk", ["cancel", "close"]);
    await page.evaluate(() => (document.getElementById("gdk") as GapHost & { show: () => unknown }).show());
    await wait(600);
    await page.keyboard.press("Escape");
    await wait(200);
    await page.mouse.click(20, 680);
    await wait(300);
    const stayed = await page.evaluate(() => document.getElementById("gdk")?.hasAttribute("open"));
    const dialogEvents = await recorded();
    await page.evaluate(() => {
      const host = document.getElementById("gdk") as HTMLElement;
      host.removeAttribute("no-close-on-escape");
      host.setAttribute("open", "");
    });
    await wait(600);
    await page.keyboard.press("Escape");
    await wait(300);
    const escaped = await page.evaluate(() => !document.getElementById("gdk")?.hasAttribute("open"));
    assert.deepEqual({ stayed, dialogEvents, escaped }, { stayed: true, dialogEvents: [{ type: "cancel" }], escaped: true }, "dialog no-close-on-*");
    check("dialog: no-close-on-escape and no-close-on-scrim-click keep it open; cancel is still dispatched");

    // ------------------------------------------------ bottom sheet: expanded
    await fresh(page, `<m-bottom-sheet id="gbs" headline="Share"><p style="height:900px">Tall</p></m-bottom-sheet>`);
    await record("gbs", ["open", "close", "expand", "collapse"], "expanded");
    type Sheet = GapHost & { show: () => unknown; close: () => unknown; expand: () => unknown; collapse: () => unknown };
    const sheetState = (): Promise<{ state: string; expanded: boolean; open: boolean }> =>
      page.evaluate(() => {
        const host = document.getElementById("gbs") as GapHost;
        return {
          state: (host.component?.getState as () => string)(),
          expanded: host.hasAttribute("expanded"),
          open: host.hasAttribute("open"),
        };
      });
    const call = (method: string): Promise<void> =>
      page.evaluate((method) => void ((document.getElementById("gbs") as Sheet)[method] as () => unknown)(), method);
    await call("show");
    await wait(400);
    const shown = { state: await sheetState(), events: await recorded() };
    await call("expand");
    const expanded = { state: await sheetState(), events: await recorded() };
    await call("collapse");
    const collapsed = { state: await sheetState(), events: await recorded() };
    // The user drags the handle up
    await wait(400);
    const handle = await page.evaluate(() => {
      const el = document.getElementById("gbs")?.shadowRoot?.querySelector('[class~="mtrl-bottom-sheet__handle"]') as HTMLElement;
      const box = el.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x, handle.y - 200, { steps: 4 });
    await page.mouse.up();
    const dragged = { state: await sheetState(), events: await recorded() };
    await call("close");
    const closed = { state: await sheetState(), events: await recorded() };
    // By attribute: expanded then open opens it expanded; silently
    await page.evaluate(() => {
      const host = document.getElementById("gbs") as HTMLElement;
      host.setAttribute("expanded", "");
      host.setAttribute("open", "");
    });
    const byAttributes = { state: await sheetState(), events: await recorded() };
    await page.evaluate(() => document.getElementById("gbs")?.removeAttribute("expanded"));
    const unexpanded = { state: await sheetState(), events: await recorded() };
    assert.deepEqual(
      { shown, expanded, collapsed, dragged, closed, byAttributes, unexpanded },
      {
        shown: { state: { state: "partial", expanded: false, open: true }, events: [{ type: "open", attribute: false }] },
        expanded: { state: { state: "expanded", expanded: true, open: true }, events: [{ type: "expand", attribute: true }] },
        collapsed: { state: { state: "partial", expanded: false, open: true }, events: [{ type: "collapse", attribute: false }] },
        dragged: { state: { state: "expanded", expanded: true, open: true }, events: [{ type: "expand", attribute: true }] },
        closed: {
          state: { state: "hidden", expanded: false, open: false },
          events: [{ type: "collapse", attribute: false }, { type: "close", attribute: false }],
        },
        byAttributes: { state: { state: "expanded", expanded: true, open: true }, events: [] },
        unexpanded: { state: { state: "partial", expanded: false, open: true }, events: [] },
      },
      "bottom sheet expanded"
    );
    check("bottom sheet: expanded reflects the full height; expand and collapse come from the user and methods, not the attributes");

    // peek-height is the partial height; without it, half the screen
    const partialHeight = async (markup: string): Promise<number> => {
      await fresh(page, markup);
      await page.evaluate(() => (document.getElementById("gph") as GapHost & { show: () => unknown }).show());
      await wait(500);
      return page.evaluate(() => {
        const container = document.getElementById("gph")?.shadowRoot?.querySelector('[class~="mtrl-bottom-sheet__container"]') as HTMLElement;
        return Math.round(container.getBoundingClientRect().height);
      });
    };
    const peeked = await partialHeight(`<m-bottom-sheet id="gph" peek-height="120"><p style="height:900px">Tall</p></m-bottom-sheet>`);
    const half = await partialHeight(`<m-bottom-sheet id="gph"><p style="height:900px">Tall</p></m-bottom-sheet>`);
    const viewport = await page.evaluate(() => window.innerHeight);
    assert.deepEqual({ peeked, half }, { peeked: 120, half: Math.round(viewport / 2) }, "bottom sheet peek-height");
    check("bottom sheet: peek-height sets the partial height, which is half the screen without it");

    // ------------------------------------------------ sheets: closing refused; side sheet width
    for (const tag of ["m-bottom-sheet", "m-side-sheet"]) {
      await fresh(page, `<${tag} id="gsk" modal headline="Stay" no-close-on-escape no-close-on-scrim-click><button type="button">In</button></${tag}>`);
      await page.evaluate(() => (document.getElementById("gsk") as GapHost & { show: () => unknown }).show());
      await wait(500);
      await page.keyboard.press("Escape");
      await wait(200);
      await page.mouse.click(20, 20);
      await wait(300);
      const stays = await page.evaluate(() => document.getElementById("gsk")?.hasAttribute("open"));
      await page.evaluate(() => {
        const host = document.getElementById("gsk") as HTMLElement;
        host.removeAttribute("no-close-on-scrim-click");
      });
      await wait(500);
      await page.mouse.click(20, 20);
      await wait(300);
      const scrim = await page.evaluate(() => !document.getElementById("gsk")?.hasAttribute("open"));
      assert.deepEqual({ stays, scrim }, { stays: true, scrim: true }, `${tag} no-close-on-*`);
    }
    check("sheets: no-close-on-escape and no-close-on-scrim-click keep a modal sheet open");

    await fresh(page, `<m-side-sheet id="gss" width="320" headline="Wide" open>Body</m-side-sheet>`);
    await wait(400);
    const sheetWidth = (): Promise<number> =>
      page.evaluate(() => {
        const container = document.getElementById("gss")?.shadowRoot?.querySelector('[class~="mtrl-side-sheet__container"]') as HTMLElement;
        return Math.round(container.getBoundingClientRect().width);
      });
    const wide = await sheetWidth();
    await page.evaluate(() => document.getElementById("gss")?.setAttribute("width", "280"));
    await wait(400);
    assert.deepEqual({ wide, narrow: await sheetWidth() }, { wide: 320, narrow: 280 });
    check("side sheet: width sets the container's width, and a change recreates it");

    // ------------------------------------------------ menu: color, gap items, no-close-on-select
    await fresh(
      page,
      `<button id="gmb" type="button">More</button>
       <m-menu id="gm" anchor="gmb" variant="vertical" color="vibrant" no-close-on-select aria-label="More">
         <m-menu-item value="a">Alpha</m-menu-item><m-menu-item gap></m-menu-item><m-menu-item value="b">Beta</m-menu-item>
       </m-menu>`
    );
    await record("gm", ["select", "close"]);
    await page.click("#gmb");
    await wait(400);
    const menu = await page.evaluate(() => {
      const root = document.getElementById("gm")?.shadowRoot as ShadowRoot;
      const surface = root.querySelector('[role="menu"]') as HTMLElement;
      return {
        vibrant: surface.classList.contains("mtrl-menu--vibrant"),
        groups: [...root.querySelectorAll('[class~="mtrl-menu__group"]')].map((g) => [...g.querySelectorAll("[data-id]")].map((i) => i.getAttribute("data-id"))),
      };
    });
    await page.evaluate(() => {
      const item = document.getElementById("gm")?.shadowRoot?.querySelector('[data-id="b"]') as HTMLElement;
      item.click();
    });
    await wait(200);
    const keptOpen = await page.evaluate(() => document.getElementById("gm")?.hasAttribute("open"));
    assert.deepEqual(
      { ...menu, keptOpen, events: await recorded() },
      { vibrant: true, groups: [["a"], ["b"]], keptOpen: true, events: [{ type: "select" }] },
      "menu attributes"
    );
    check("menu: color is the factory's, a gap item splits the groups, no-close-on-select keeps it open after a choice");

    // ------------------------------------------------ tooltip: triggers
    for (const [attribute, hover, focus] of [["no-show-on-hover", false, true], ["no-show-on-focus", true, false]] as const) {
      await fresh(page, `<button id="gtb" type="button">Save</button><m-tooltip id="gt" for="gtb" ${attribute} show-delay="0">Save it</m-tooltip>`);
      const visible = (): Promise<boolean> =>
        page.evaluate(() => (((document.getElementById("gt") as GapHost).component?.element as HTMLElement).className.includes("tooltip--visible")));
      await page.hover("#gtb");
      await wait(300);
      const hovered = await visible();
      await page.mouse.move(600, 600);
      await wait(400);
      await page.focus("#gtb");
      await wait(300);
      const focused = await visible();
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      assert.deepEqual({ hovered, focused }, { hovered: hover, focused: focus }, `tooltip ${attribute}`);
    }
    check("tooltip: no-show-on-hover and no-show-on-focus turn off each trigger");

    // ------------------------------------------------ options (#263)
    // The dialog's animation is where it comes from: the transform its
    // opening transition starts at
    await fresh(page, `<m-dialog id="gan" headline="Motion" animation="fade">Body</m-dialog>`);
    const motion = (): Promise<{ classes: string[]; from: string; open: boolean }> =>
      page.evaluate(async () => {
        const host = document.getElementById("gan") as GapHost & { show: () => unknown; close: () => unknown };
        const dialog = host.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
        host.show();
        const transition = dialog
          .getAnimations()
          .find((a): a is CSSTransition => a instanceof CSSTransition && a.transitionProperty === "transform");
        const from = transition ? String((transition.effect as KeyframeEffect).getKeyframes()[0].transform) : "none";
        await Promise.all(dialog.getAnimations().map((a) => a.finished));
        // Opened, it is in place whatever it came from
        const settled = getComputedStyle(dialog).transform;
        const open = dialog.open && (settled === "none" || settled === "matrix(1, 0, 0, 1, 0, 0)");
        host.close();
        await new Promise((r) => setTimeout(r, 300));
        return { classes: [...dialog.classList].filter((c) => /dialog--(scale|slide-up|slide-down|fade)$/.test(c)), from, open };
      });
    const fade = await motion();
    await keep("gan");
    await page.evaluate(() => document.getElementById("gan")?.setAttribute("animation", "slide-up"));
    const slideUp = { ...(await motion()), recreated: !(await isKept("gan")) };
    await page.evaluate(() => document.getElementById("gan")?.removeAttribute("animation"));
    const grown = await motion();
    assert.deepEqual(
      { fade, slideUp, grown },
      {
        fade: { classes: ["mtrl-dialog--fade"], from: "none", open: true },
        slideUp: { classes: ["mtrl-dialog--slide-up"], from: "translateY(24px) scaleY(0.35)", open: true, recreated: true },
        grown: { classes: [], from: "translateY(-50px) scaleY(0.35)", open: true },
      },
      "dialog animation"
    );
    check("dialog: animation is the factory's, fade or slide-up from their own closed state; a change recreates it");

    // The bottom sheet's max-width; 640 without it
    await fresh(page, `<m-bottom-sheet id="gmw" max-width="400" open headline="Narrow">Body</m-bottom-sheet>`);
    await wait(400);
    const sheetBox = (): Promise<{ width: number; centred: boolean; open: boolean }> =>
      page.evaluate(() => {
        const container = document.getElementById("gmw")?.shadowRoot?.querySelector('[class~="mtrl-bottom-sheet__container"]') as HTMLElement;
        const box = container.getBoundingClientRect();
        return {
          width: Math.round(box.width),
          centred: Math.abs(box.left - (window.innerWidth - box.right)) <= 1,
          open: !!document.getElementById("gmw")?.hasAttribute("open"),
        };
      });
    const narrow = await sheetBox();
    await keep("gmw");
    await page.evaluate(() => document.getElementById("gmw")?.removeAttribute("max-width"));
    await wait(400);
    const standard = { ...(await sheetBox()), recreated: !(await isKept("gmw")) };
    assert.deepEqual(
      { narrow, standard },
      { narrow: { width: 400, centred: true, open: true }, standard: { width: 640, centred: true, open: true, recreated: true } },
      "bottom sheet max-width"
    );
    check("bottom sheet: max-width is the widest it grows, centred, 640 without it; a change recreates it");

    // The rail's ripple, on a press of an item
    await fresh(
      page,
      `<m-navigation-rail id="grr" value="a" aria-label="Ripple" no-ripple>
         <m-navigation-rail-item value="a" icon='${ICON}'>Inbox</m-navigation-rail-item>
         <m-navigation-rail-item value="b" icon='${ICON}'>Sent</m-navigation-rail-item>
       </m-navigation-rail>`
    );
    const ripples = (): Promise<number> =>
      page.evaluate(() => {
        const root = document.getElementById("grr")?.shadowRoot as ShadowRoot;
        const item = root.querySelector('[class~="mtrl-navigation-rail__item"]') as HTMLElement;
        const box = item.getBoundingClientRect();
        item.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, button: 0, clientX: box.left + 4, clientY: box.top + 4 }));
        return root.querySelectorAll('[class~="mtrl-navigation-rail__ripple"]').length;
      });
    const withoutRipple = await ripples();
    await keep("grr");
    await page.evaluate(() => document.getElementById("grr")?.removeAttribute("no-ripple"));
    await wait(50);
    const withRipple = { count: await ripples(), recreated: !(await isKept("grr")) };
    assert.deepEqual({ withoutRipple, withRipple }, { withoutRipple: 0, withRipple: { count: 1, recreated: true } }, "rail no-ripple");
    check("navigation rail: no-ripple drops the items' ripple; a change recreates the rail");
  }

  // ---------------------------------------------------------------- events beside the model
  // `activate` and `action` report a press, not a change of the selection,
  // which `change` carries: they leave the element clean. A removed input
  // chip is different: it changes the selected values and no `change` comes
  // with it, so `remove` still marks the set dirty.
  {
    type Model = HTMLElement & { value: unknown };
    interface ModelCase {
      name: string;
      markup: string;
      /** The user doing it, then the events expected. */
      event: () => Promise<unknown>;
      eventTypes: string[];
      /** A value attribute set after the event, and the live value then: moved while clean, kept once dirty. */
      after: { attribute: string; value: unknown };
      /** A real change of the model by the user. */
      change: () => Promise<unknown>;
      /** A value attribute set after the change, which must not move it. */
      ignored: string;
    }
    const cases: ModelCase[] = [
      {
        name: "list activate",
        markup: `<m-list id="x" value="a" aria-label="Events"><m-list-item value="a">Apple</m-list-item>
          <m-list-item value="b">Banana</m-list-item><m-list-item value="c">Cherry</m-list-item></m-list>`,
        // Every activation of a row toggles it, so the factory never
        // activates without a change: the element's own dispatch stands in
        event: () =>
          page.evaluate(() => {
            document.getElementById("x")?.dispatchEvent(new CustomEvent("activate", { detail: { value: "a" }, bubbles: true, composed: true }));
          }),
        eventTypes: ["activate"],
        after: { attribute: "b", value: "b" },
        change: () => page.getByRole("list", { name: "Events" }).getByRole("button", { name: "Cherry" }).click(),
        ignored: "a",
      },
      {
        name: "button group action",
        markup: `<m-button-group id="x" selection="single" required value="a" aria-label="Events">
          <m-button-group-item value="a">Left</m-button-group-item><m-button-group-item value="b">Center</m-button-group-item>
          <m-button-group-item value="c">Right</m-button-group-item></m-button-group>`,
        // The selected button again, which `required` keeps selected
        event: () => page.getByRole("group", { name: "Events" }).getByRole("button", { name: "Left" }).click(),
        eventTypes: ["action"],
        after: { attribute: "b", value: "b" },
        change: () => page.getByRole("group", { name: "Events" }).getByRole("button", { name: "Right" }).click(),
        ignored: "a",
      },
      {
        name: "chips remove",
        markup: `<m-chips id="x" value="ada,bob" aria-label="Events"><m-chip variant="input" value="ada">Ada</m-chip>
          <m-chip variant="input" value="bob">Bob</m-chip><m-chip variant="input" value="cy">Cy</m-chip></m-chips>`,
        // Removing a selected chip changes the selection without a change event
        event: () => page.getByRole("grid", { name: "Events" }).getByRole("button", { name: "Remove Ada" }).click(),
        eventTypes: ["remove"],
        after: { attribute: "cy", value: ["bob"] },
        change: () => page.getByRole("grid", { name: "Events" }).getByRole("checkbox", { name: "Cy", exact: true }).click({ position: { x: 10, y: 10 } }),
        ignored: "ada",
      },
    ];
    const value = (): Promise<unknown> => page.evaluate(() => (document.getElementById("x") as Model).value);
    const setValue = async (attribute: string): Promise<unknown> => {
      await page.evaluate((attribute) => document.getElementById("x")?.setAttribute("value", attribute), attribute);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
      return value();
    };
    const results: Record<string, unknown> = {};
    const expected: Record<string, unknown> = {};
    for (const item of cases) {
      await fresh(page, item.markup);
      await page.evaluate(() => {
        const w = window as unknown as Win & { __model: string[] };
        w.__model = [];
        for (const type of ["activate", "action", "remove", "change"]) {
          document.getElementById("x")?.addEventListener(type, () => w.__model.push(type));
        }
      });
      await item.event();
      const types = await page.evaluate(() => (window as unknown as Win & { __model: string[] }).__model.splice(0));
      const afterEvent = await setValue(item.after.attribute);
      await item.change();
      const changeTypes = await page.evaluate(() => (window as unknown as Win & { __model: string[] }).__model.filter((t) => t === "change"));
      const live = await value();
      const afterChange = await setValue(item.ignored);
      results[item.name] = { types, afterEvent, changed: changeTypes.length > 0, kept: JSON.stringify(afterChange) === JSON.stringify(live) };
      expected[item.name] = { types: item.eventTypes, afterEvent: item.after.value, changed: true, kept: true };
    }
    assert.deepEqual(results, expected, "events beside the model");
    check("list activate and button group action leave the element clean: the value attribute still moves it, and not after a change");
    check("chips: removing a selected input chip changes the selection and marks the set dirty; a change does too");
  }
  // ---------------------------------------------------------------- date and time pickers
  await checkPickers({ page, browser, js, fresh, check });
  // ---------------------------------------------------------------- <m-search>
  const { checkSearch } = await import("./check-elements-search");
  await checkSearch({ browser, page, origin: `http://127.0.0.1:${server.port}`, check, fresh });

  // ---------------------------------------------------------------- pickers and search: open and close are state
  // Opening and closing without a choice leaves the element clean: its value
  // attribute still moves it (state events, #257).
  await fresh(
    page,
    `<m-datepicker id="sd" variant="modal" label="Due" value="2026-09-10"></m-datepicker>
     <m-timepicker id="st" value="09:30"></m-timepicker>
     <m-search id="ss" aria-label="Query" value="ap"></m-search>`
  );
  {
    const moved = await page.evaluate(async () => {
      type Host = HTMLElement & { value: string; show: () => void; close: () => void };
      const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
      const cases: Array<[string, string]> = [["sd", "2026-09-20"], ["st", "10:45"], ["ss", "apr"]];
      const result: Record<string, string> = {};
      for (const [id, next] of cases) {
        const host = document.getElementById(id) as Host;
        host.show();
        await frame();
        host.close();
        await frame();
        host.setAttribute("value", next);
        result[id] = host.value;
      }
      return result;
    });
    assert.deepEqual(moved, { sd: "2026-09-20", st: "10:45", ss: "apr" });
    check("date picker, time picker and search: opening and closing leave the value attribute in charge");
  }

  // ---------------------------------------------------------------- named slots (FLO-325)
  // Each element's `slots` are the named slots it reads, and no other: given
  // a child per declared name, its shadow root has exactly those named
  // <slot>s, and each child is assigned to one.
  await fresh(page, `<section id="slots"></section>`);
  {
    const slots = await page.evaluate(async () => {
      type Spec = { name: string; slots?: readonly string[] };
      const registry = (window as unknown as { mtrl: { elements: Record<string, { spec: Spec }> } }).mtrl.elements;
      const section = document.getElementById("slots") as HTMLElement;
      const hosts = Object.values(registry).map(({ spec }) => {
        const host = document.createElement(`m-${spec.name}`);
        for (const name of spec.slots ?? []) {
          const child = document.createElement("span");
          child.slot = name;
          child.textContent = name;
          host.append(child);
        }
        section.append(host);
        return { spec, host };
      });
      await new Promise((r) => setTimeout(r, 300));
      return hosts.map(({ spec, host }) => ({
        name: spec.name,
        declared: [...(spec.slots ?? [])].sort(),
        rendered: [...new Set([...(host.shadowRoot?.querySelectorAll<HTMLSlotElement>("slot[name]") ?? [])].map((slot) => slot.name))].sort(),
        unassigned: [...host.children].filter((child) => !child.assignedSlot).map((child) => child.slot),
      }));
    });
    const wrong = slots.filter(({ declared, rendered, unassigned }) => declared.join() !== rendered.join() || unassigned.length > 0);
    assert.deepEqual(wrong, [], "an element reads a slot it does not declare, or declares one it does not read");
    assert.ok(slots.filter(({ declared }) => declared.length > 0).length >= 7);
    check(`named slots: every element's declared slots are the ones it renders and assigns (${slots.length} elements)`);
  }

  // ---------------------------------------------------------------- parts
  // FLO-328: every piece is a part named after its BEM class without the
  // prefix; the element holding the slot is also the slot attribute's part.
  await fresh(
    page,
    `<style>
       m-button::part(label) { color: rgb(1, 2, 3); }
       m-button::part(icon) { color: rgb(4, 5, 6); }
       m-switch::part(track) { outline: 3px solid rgb(7, 8, 9); }
       m-switch::part(helper) { color: rgb(10, 11, 12); }
       m-tabs::part(indicator) { background-color: rgb(13, 14, 15); }
     </style>
     <m-button id="pb" icon="${ICON.replace(/"/g, "'")}">Styled</m-button>
     <m-switch id="ps">Parts</m-switch>
     <m-tabs id="pt" value="a"><m-tab value="a">A</m-tab><m-tab value="b">B</m-tab></m-tabs>`
  );
  {
    const parts = await page.evaluate(async () => {
      const shadow = (id: string): ShadowRoot => (document.getElementById(id) as HTMLElement).shadowRoot as ShadowRoot;
      const style = (id: string, part: string): CSSStyleDeclaration =>
        getComputedStyle(shadow(id).querySelector(`[part~="${part}"]`) as Element);
      const names = (id: string): string[] =>
        Array.from(shadow(id).querySelectorAll("[part]"), (node) => node.getAttribute("part") as string);
      // A piece the component adds later is named too.
      document.getElementById("ps")?.setAttribute("supporting-text", "Later");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return {
        button: names("pb"),
        label: style("pb", "label").color,
        icon: style("pb", "icon").color,
        track: style("ps", "track").outlineColor,
        helper: style("ps", "helper").color,
        indicator: style("pt", "indicator").backgroundColor,
        tabs: names("pt").filter((name) => name.includes("tab")),
      };
    });
    assert.deepEqual(parts.button, ["button", "icon", "text label", "ripple"]);
    assert.equal(parts.label, "rgb(1, 2, 3)");
    assert.equal(parts.icon, "rgb(4, 5, 6)");
    assert.equal(parts.track, "rgb(7, 8, 9)");
    assert.equal(parts.helper, "rgb(10, 11, 12)");
    assert.equal(parts.indicator, "rgb(13, 14, 15)");
    assert.deepEqual(parts.tabs, ["tabs", "button tab", "button tab"]);
    check("parts: page CSS styles m-button::part(label) and (icon), m-switch::part(track) and a helper added later, m-tabs::part(indicator)");
  }

  // ---------------------------------------------------------------- FLO-320: payload parity, part 2
  await fresh(
    page,
    `<m-navigation-rail id="pr" aria-label="Rail" value="a">
       <m-navigation-rail-item value="a" icon='${ICON}'>A</m-navigation-rail-item><m-navigation-rail-item value="b" icon='${ICON}'>B</m-navigation-rail-item>
     </m-navigation-rail>
     <m-drawer id="pd" aria-label="Drawer" value="a"><m-drawer-item value="a">A</m-drawer-item><m-drawer-item value="b">B</m-drawer-item></m-drawer>
     <m-list id="pl" aria-label="List"><m-list-item value="a">A</m-list-item><m-list-item value="b">B</m-list-item></m-list>
     <m-menu id="pm" aria-label="Menu"><m-menu-item value="a">A</m-menu-item><m-menu-item value="b">B</m-menu-item></m-menu>
     <m-search id="ps" aria-label="Search"></m-search>
     <m-datepicker id="pdp" label="Date" value="2026-09-10"></m-datepicker>
     <m-timepicker id="ptp" value="09:30"></m-timepicker>`
  );
  {
    const click = 'host.shadowRoot.querySelector(\'[data-id="b"]\').click();';
    assert.deepEqual(await eventParity(page, "pr", { factoryEvent: "select", elementEvent: "change", act: click }), { factory: ["b"], element: ["b"] }, "navigation rail");
    assert.deepEqual(await eventParity(page, "pd", { factoryEvent: "select", elementEvent: "change", act: click }), { factory: ["b"], element: ["b"] }, "drawer");
    assert.deepEqual(await eventParity(page, "pl", { factoryEvent: "select", elementEvent: "activate", act: click }), { factory: ["b"], element: ["b"] }, "list");
    assert.deepEqual(
      await eventParity(page, "pm", {
        factoryEvent: "select", elementEvent: "select",
        act: 'host.component.open(); await new Promise((r) => setTimeout(r, 300)); host.shadowRoot.querySelector(\'[data-id="b"]\').click();',
      }),
      { factory: ["b"], element: ["b"] }, "menu",
    );
    assert.deepEqual(
      await eventParity(page, "ps", {
        factoryEvent: "submit", elementEvent: "change",
        act: `const input = host.shadowRoot.querySelector("input");
          input.value = "apple"; input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));`,
      }),
      { factory: ["apple"], element: ["apple"] }, "search",
    );
    // The factory's `value` stays a Date: its `iso` is the element's `value`,
    // and the element's `date` is the factory's Date.
    // Entered by hand: setValue is silent (FLO-328).
    const enter = (text: string): string =>
      `const input = host.shadowRoot.querySelector("input"); input.value = "${text}"; input.dispatchEvent(new Event("change", { bubbles: true }));`;
    const date = enter("09/12/2026");
    assert.deepEqual(await eventParity(page, "pdp", { factoryEvent: "change", elementEvent: "change", act: date, field: "iso" }), { factory: ["2026-09-12"], element: ["2026-09-12"] }, "date picker");
    const dates = await page.evaluate(() => {
      const host = document.getElementById("pdp") as HTMLElement;
      const seen: string[] = [];
      host.addEventListener("change", (e) => void seen.push(((e as CustomEvent<{ date: Date }>).detail.date).toDateString()));
      const input = host.shadowRoot?.querySelector("input") as HTMLInputElement;
      input.value = "09/14/2026";
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return seen;
    });
    assert.deepEqual(dates, [new Date(2026, 8, 14).toDateString()], "date picker: the element's date");
    assert.deepEqual(
      await eventParity(page, "ptp", {
        factoryEvent: "change", elementEvent: "change", factory: "host.component.picker",
        // Committed by OK: setValue is silent (FLO-328).
        act: `const p = host.component.picker; p.setType("input"); p.open();
          const set = (type, v) => { const f = p.dialogElement.querySelector('[data-type="' + type + '"]'); f.value = v; f.dispatchEvent(new Event("change", { bubbles: true })); };
          set("hour", "10"); set("minute", "45");
          p.dialogElement.querySelector('[class$="time-picker__confirm"]').click();`,
      }),
      { factory: ["10:45"], element: ["10:45"] }, "time picker",
    );
    check("rail, drawer, list, menu, search and both pickers: a handler reading value reads the same on the factory and the element (FLO-320)");
  }

  // ---------------------------------------------------------------- theme
  await fresh(page, `<m-switch id="s" checked>Theme</m-switch><section id="factory"></section>`);
  {
    const colors = await page.evaluate(() => {
      const track = (): string => {
        const root = (document.getElementById("s") as HTMLElement).shadowRoot as ShadowRoot;
        // The token, not the painted colour, which is mid-transition right after the switch.
        return getComputedStyle(root.querySelector('[class*="switch__track"]') as HTMLElement)
          .getPropertyValue("--mtrl-sys-color-primary").trim();
      };
      const before = track();
      document.documentElement.dataset.theme = "ocean";
      const after = track();
      document.documentElement.dataset.theme = "baseline";
      return { before, after };
    });
    assert.notEqual(colors.before, colors.after);
    check("theme: a theme on the document reaches the shadow root");
  }

  // FLO-330: the typeface and the corners are tokens, the compiled values their
  // fallback. Unset, a button and a card render as before; set on the document,
  // the tokens reach an element's shadow root and a factory alike.
  await fresh(
    page,
    `<m-button id="tb">Save</m-button> <m-button id="tq" shape="square">Square</m-button><section id="factory"></section>`
  );
  {
    const read = (): Promise<Record<string, string>> =>
      page.evaluate(() => {
        const w = window as unknown as Win & { mtrl: Record<string, (c: object) => { element: HTMLElement }> };
        const factory = document.getElementById("factory") as HTMLElement;
        if (!factory.firstElementChild) {
          factory.append(w.mtrl.createButton({ text: "Save" }).element);
          factory.append(w.mtrl.createButton({ text: "Square", shape: "square" }).element);
          factory.append(w.mtrl.createCard({ variant: "filled" }).element);
        }
        const [button, square, card] = Array.from(factory.children) as HTMLElement[];
        const inner = (id: string): HTMLElement =>
          (document.getElementById(id) as HTMLElement).shadowRoot?.firstElementChild as HTMLElement;
        const style = (el: HTMLElement): CSSStyleDeclaration => getComputedStyle(el);
        return {
          elementFont: style(inner("tb")).fontFamily,
          factoryFont: style(button!).fontFamily,
          elementSquare: style(inner("tq")).borderTopLeftRadius,
          factorySquare: style(square!).borderTopLeftRadius,
          card: style(card!).borderTopLeftRadius,
        };
      });
    const unset = await read();
    assert.deepEqual(unset, {
      elementFont: "Roboto, sans-serif",
      factoryFont: "Roboto, sans-serif",
      elementSquare: "12px",
      factorySquare: "12px",
      card: "12px",
    });
    check("tokens: unset, the typeface and corners are the compiled values");

    await page.evaluate(() => {
      document.documentElement.style.setProperty("--mtrl-ref-typeface-plain", "Georgia");
      document.documentElement.style.setProperty("--mtrl-sys-shape-corner-medium", "3px");
    });
    // the square button eases its corner; wait past the transition
    await page.waitForTimeout(600);
    const set = await read();
    await page.evaluate(() => {
      document.documentElement.style.removeProperty("--mtrl-ref-typeface-plain");
      document.documentElement.style.removeProperty("--mtrl-sys-shape-corner-medium");
    });
    assert.deepEqual(set, {
      elementFont: "Georgia",
      factoryFont: "Georgia",
      elementSquare: "3px",
      factorySquare: "3px",
      card: "3px",
    });
    check("tokens: --mtrl-ref-typeface-plain and --mtrl-sys-shape-corner-medium reach <m-button> and the factories");
  }

  assert.deepEqual(errors, [], "no page errors");
  check("no page errors");
} finally {
  await browser.close();
  server.stop(true);
}

console.log(`elements: ${checks} checks passed`);
