// src/ssr/solid.ts
/**
 * Enable declarative shadow DOM for mtrl/solid in this server process.
 * The identity HTML policy is not a sanitizer; configure a synchronous sanitizer for untrusted markup.
 * @module ssr/solid
 */
import type { JSX } from "solid-js";
import { ssr, ssrElement } from "solid-js/web";
/**
 * The identity HTML policy is not a sanitizer; configure a synchronous sanitizer for untrusted markup.
 * @module ssr/solid
 */
import "./index";

const bridge = (globalThis as unknown as Record<symbol, {
  shadow: (tag: string, markup: string, prefix: string, renderedChildren?: boolean) => string;
  solid?: (
    tag: string,
    props: Record<string, unknown>,
    children: JSX.Element,
    prefix: string,
  ) => JSX.Element;
}>)[Symbol.for("mtrl.ssr")];

const TAG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

bridge.solid = (tag, props, children, prefix) => {
  if (!TAG.test(tag)) throw new TypeError(`Invalid tag: ${tag}`);
  // Let Solid escape and resolve the children exactly once, in the real page
  // context. A second render could create resources under the page's Suspense
  // owner that never resolve, or consume a different set of hydration keys.
  const hostProps = { ...props, children };
  const markup = ssrElement(tag, hostProps, undefined, false).t;
  const closing = `</${tag}>`;
  const openingLength = ssrElement(tag, hostProps, "", false).t.length - closing.length;
  const light = markup.slice(openingLength, -closing.length);

  // Nested adapters have already supplied their templates. Strip them only
  // from the shadow renderer's detached copy; feeding them back would declare
  // a shadow root twice. The page's original light DOM is kept byte for byte.
  const html = bridge.shadow(tag, markup, prefix, true);
  const template = html ? `<template shadowrootmode="open" shadowrootdelegatesfocus="">${html}</template>` : "";
  return ssr(template + light) as unknown as JSX.Element;
};
