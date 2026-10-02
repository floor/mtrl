// test/ssr/svelte-shadow.fixture.ts
// Spawned by svelte-shadow.test.ts. No DOM shim: this process is the server.
import { expect, test } from "bun:test";
import { buttonElement, cardElement, carouselElement, tabsElement } from "../../src/elements";
import { adapter, shadowMarkup } from "../../src/svelte/runtime";

type Push = { push: (html: string) => void };

test("an unregistered server returns no template; registration renders one and opt-outs render none", async () => {
  const button = adapter(buttonElement.spec, () => "m-button");
  const props = { variant: "filled", disabled: true, onclick: () => undefined };
  expect(shadowMarkup(button, props, undefined, {})).toBe("");

  await import("../../scripts/fixtures/ssr-css");
  await import("../../src/ssr/svelte");
  const bridge = (globalThis as unknown as Record<symbol, { shadow?: unknown; svelte?: unknown }>)[Symbol.for("mtrl.ssr")];
  expect(typeof bridge.shadow).toBe("function");
  expect(typeof bridge.svelte).toBe("function");

  const html = shadowMarkup(button, props, undefined, {});
  expect(html.startsWith('<template shadowrootmode="open" shadowrootdelegatesfocus="">')).toBe(true);
  expect(html.endsWith("</template>")).toBe(true);
  expect(html).toContain("mtrl-button");
  expect(html).toContain("disabled");
  expect(html).not.toContain("onclick");

  const ordinary = {
    label: "Save",
    disabled: true,
    title: "Name",
    popover: "auto",
    inputmode: "numeric",
    enterkeyhint: "send",
    itemprop: "name",
    nonce: "abc",
    is: "x-y",
    onclick: "window.__xss=1",
    srcdoc: "<script>bad()</script>",
  };
  const spread = button.attributes(ordinary, {});
  expect(spread.popover).toBe("auto");
  expect(spread.inputmode).toBe("numeric");
  expect(spread.enterkeyhint).toBe("send");
  expect(spread.itemprop).toBe("name");
  expect(spread.nonce).toBe("abc");
  expect(spread.is).toBe("x-y");
  expect(spread.onclick).toBe("window.__xss=1");
  expect(spread.srcdoc).toContain("script");
  expect(spread.title).toBe("Name");
  const ordinaryHtml = shadowMarkup(button, ordinary, undefined, {});
  expect(ordinaryHtml).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus="">');
  expect(ordinaryHtml).toContain("mtrl-button");
  expect(ordinaryHtml).toContain("disabled");
  for (const token of ["popover", "inputmode", "enterkeyhint", "itemprop", "nonce", 'is="x-y"', "onclick", "srcdoc"]) {
    expect(ordinaryHtml, token).not.toContain(token);
  }
  expect(() => shadowMarkup(button, { title: "a\0b" }, undefined, {})).toThrow(/NUL/);

  const card = adapter(cardElement.spec, () => "m-card");
  const nestedLight = (renderer: Push) => { renderer.push('<m-button popover="auto" id="inner">Nested</m-button>'); };
  const nested = shadowMarkup(card, { id: "card" }, nestedLight as never, {});
  expect(nested).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus="">');
  expect(nested).not.toContain("popover");

  const light = (renderer: Push) => { renderer.push("<span>Light content</span>"); };
  const carousel = adapter(carouselElement.spec, () => "m-carousel");
  expect(shadowMarkup(carousel, { "aria-label": "Photos" }, light as never, {})).toBe("");

  const tabs = adapter(tabsElement.spec, () => "m-tabs");
  const tabsLight = (renderer: Push) => {
    renderer.push('<m-tab value="a">Flights</m-tab><m-tab value="b">Trips</m-tab>');
  };
  const tabsHtml = shadowMarkup(tabs, { value: "a" }, tabsLight as never, {});
  expect(tabsHtml).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus="">');
  expect(tabsHtml).toContain("Flights");
  expect(tabsHtml).toContain("Trips");
});

test("a detached child render failure omits the shadow and warns once per host in development", async () => {
  await import("../../scripts/fixtures/ssr-css");
  await import("../../src/ssr/svelte");
  const tabs = adapter(tabsElement.spec, () => "m-tabs");
  const original = console.warn;
  const warnings: string[] = [];
  console.warn = (...args) => { warnings.push(args.map(String).join(" ")); };
  try {
    const missing = (): never => { throw new Error("Required context is missing"); };
    expect(shadowMarkup(tabs, { id: "context-tabs" }, missing as never, {})).toBe("");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/<m-tabs id="context-tabs">.*no shadow root/i);
    expect(warnings[0]).toContain("Required context is missing");
  } finally { console.warn = original; }
});

test("an invalid spec slot escapes the detached render catch", async () => {
  await import("../../scripts/fixtures/ssr-css");
  await import("../../src/ssr/svelte");
  const bridge = (globalThis as unknown as Record<symbol, { svelte: (
    tag: string, attributes: Record<string, unknown>, children: undefined,
    slots: Array<[string, (renderer: Push) => void]>, prefix: string,
  ) => string }>)[Symbol.for("mtrl.ssr")];
  const snippet = (renderer: Push) => renderer.push("Invalid slot content");
  const original = console.warn;
  const warnings: string[] = [];
  console.warn = (...args) => { warnings.push(args.map(String).join(" ")); };
  try {
    expect(() => bridge.svelte("m-tabs", {}, undefined, [["bad slot", snippet]], "mtrl")).toThrow("Invalid slot: bad slot");
    expect(warnings).toHaveLength(0);
  } finally { console.warn = original; }
});
