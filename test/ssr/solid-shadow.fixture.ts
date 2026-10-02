// test/ssr/solid-shadow.fixture.ts
// Spawned by solid-shadow.test.ts. No DOM shim: this process is the server.
import { expect, test } from "bun:test";
import { createComponent as createSolid, type ComponentProps } from "solid-js";
import { renderToString } from "solid-js/web";
import { buttonElement, cardElement, carouselElement, tabsElement, type ButtonElement, type ButtonSpec, type CardElement, type CardSpec } from "../../src/elements";
import { createComponent } from "../../src/solid/create";
import { assertGlobalHost, GLOBAL_ATTRS_WITH_IS } from "../../scripts/fixtures/ssr-global-host";

const render = (spec: Parameters<typeof createComponent>[0], props: Record<string, unknown>): string => {
  const Component = createComponent(spec, () => "m-host");
  return renderToString(() => createSolid(Component, props));
};

test("an unregistered server returns no template; registration renders one and opt-outs render none", async () => {
  const buttonProps = { variant: "filled", disabled: true, children: "Save", onClick: () => undefined };
  const plain = render(buttonElement.spec, buttonProps);
  expect(plain).not.toContain("shadowrootmode");
  expect(plain).toContain("disabled");
  expect(plain).toContain("Save");

  await import("../../scripts/fixtures/ssr-css");
  await import("../../src/ssr/solid");
  const bridge = (globalThis as unknown as Record<symbol, { shadow?: unknown; solid?: unknown }>)[Symbol.for("mtrl.ssr")];
  expect(typeof bridge.shadow).toBe("function");
  expect(typeof bridge.solid).toBe("function");

  const html = render(buttonElement.spec, buttonProps);
  expect(html).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus="">');
  expect(html).toMatch(/<m-button[^>]*>\s*<template shadowrootmode="open"/);
  expect(html).toContain("mtrl-button");
  expect(html).toContain("disabled");
  expect(html).toContain("Save");
  expect(html).not.toContain("onClick");

  const ordinary = render(buttonElement.spec, {
    id: "globals",
    label: "Save",
    disabled: true,
    popover: "auto",
    inputMode: "numeric",
    enterKeyHint: "send",
    itemProp: "name",
    nonce: "abc",
    is: "x-y",
    onclick: "window.__xss=1",
  });
  assertGlobalHost(ordinary, GLOBAL_ATTRS_WITH_IS);
  expect(ordinary).toContain("disabled");
  const shadow = ordinary.slice(ordinary.indexOf('<template shadowrootmode="open"'), ordinary.indexOf("</template>"));
  expect(shadow).not.toContain("onclick");
  expect(shadow).not.toContain("__xss");

  const Card = createComponent<CardSpec, CardElement>(cardElement.spec, () => "m-card");
  const Inner = createComponent<ButtonSpec, ButtonElement>(buttonElement.spec, () => "m-button");
  const nestedHostProps: ComponentProps<typeof Inner> = {
    id: "inner",
    popover: "auto",
    label: "Nested",
  };
  const nested = renderToString(() => createSolid(Card, {
    id: "card",
    children: createSolid(Inner, nestedHostProps),
  }));
  const innerAt = nested.indexOf('id="inner"');
  expect(innerAt).toBeGreaterThan(-1);
  const innerTemplate = nested.slice(innerAt).match(/<template shadowrootmode="open"[^>]*>([\s\S]*?)<\/template>/);
  expect(innerTemplate).not.toBeNull();
  expect(innerTemplate![1]).toContain("mtrl-button");
  expect(innerTemplate![1]).not.toContain("popover");

  const carousel = render(carouselElement.spec, { ariaLabel: "Photos", children: "Light content" });
  expect(carousel).not.toContain("shadowrootmode");
  expect(carousel).toContain("Light content");
  expect(carousel).toContain("aria-label=\"Photos\"");

  const tabs = render(tabsElement.spec, {
    value: "a",
    children: '<m-tab value="a">Flights</m-tab><m-tab value="b">Trips</m-tab>',
  });
  expect(tabs).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus="">');
  expect(tabs).toContain("Flights");
  expect(tabs).toContain("Trips");
});
