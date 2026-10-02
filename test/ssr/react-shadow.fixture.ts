// test/ssr/react-shadow.fixture.ts
// Spawned by react-shadow.test.ts. No DOM shim: this process is the server.
import { expect, test } from "bun:test";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { buttonElement, cardElement, type ButtonElement, type ButtonSpec, type CardElement, type CardSpec } from "../../src/elements";
import { createComponent } from "../../src/react/create";
import { assertGlobalHost, GLOBAL_ATTRS_WITH_IS } from "../../scripts/fixtures/ssr-global-host";

const Button = createComponent<ButtonSpec, ButtonElement>(buttonElement.spec, () => "m-button", "MButton");
const Card = createComponent<CardSpec, CardElement>(cardElement.spec, () => "m-card", "MCard");

const hostProps: React.ComponentProps<typeof Button> = {
  id: "globals",
  label: "Save",
  disabled: true,
  popover: "auto",
  inputMode: "numeric",
  enterKeyHint: "send",
  itemProp: "name",
  nonce: "abc",
  is: "x-y",
};

const nestedHostProps: React.ComponentProps<typeof Button> = {
  id: "inner",
  popover: "auto",
  label: "Nested",
};

test("ordinary host attributes render through the React bridge and stay out of the shadow markup", async () => {
  const plain = renderToString(React.createElement(Button, hostProps));
  expect(plain).not.toContain("shadowrootmode");
  expect(plain).toContain('popover="auto"');
  expect(plain.toLowerCase()).toContain('inputmode="numeric"');

  await import("../../scripts/fixtures/ssr-css");
  await import("../../src/ssr/react");
  const { renderElement } = await import("../../src/ssr");
  expect(() => renderElement("m-button", { popover: "auto" })).toThrow(/Invalid host attribute: popover/);
  expect(() => renderElement("m-card", {}, '<m-button nonce="abc"></m-button>')).toThrow(/Invalid host attribute: nonce/);

  const html = renderToString(React.createElement(Button, hostProps));
  assertGlobalHost(html, GLOBAL_ATTRS_WITH_IS);
  expect(html).toContain("disabled");

  const nested = renderToString(React.createElement(Card, { id: "card" },
    React.createElement(Button, nestedHostProps)));
  expect(nested).toMatch(/<(?:m-button)[^>]*\bid="inner"[^>]*>/);
  const innerAt = nested.indexOf('id="inner"');
  const innerTemplate = nested.slice(innerAt).match(/<template shadowrootmode="open"[^>]*>([\s\S]*?)<\/template>/);
  expect(innerTemplate).not.toBeNull();
  expect(innerTemplate![1]).toContain("mtrl-button");
  expect(innerTemplate![1]).not.toContain("popover");
  expect(nested.slice(nested.lastIndexOf("<", innerAt), nested.indexOf("<template", innerAt))).toMatch(/popover="auto"/);
});
