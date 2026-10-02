// src/ssr/svelte.ts
/**
 * Enable declarative shadow DOM for mtrl/svelte in this server process.
 * The identity HTML policy is not a sanitizer; configure a synchronous sanitizer for untrusted markup.
 * The server-rendered shadow root is built in a separate render, without the context of providers above the component.
 * The page's own render (the light DOM) sees the provided value. Until upgrade, a child reading context with a default shows that default in the painted shadow root; a child requiring its context leaves this component without a declarative shadow root while the page still renders. In development, a warning names the element.
 * The Vue and Solid bridges see the provided value in both the shadow root and light DOM. React has this same context limit.
 * Pass the resolved string as a prop or attribute, or accept client-rendered text until upgrade. A fix is planned for 1.1 (FLO-517).
 * @module ssr/svelte
 */
import type { Component } from "svelte";
import { render } from "svelte/server";
/**
 * The identity HTML policy is not a sanitizer; configure a synchronous sanitizer for untrusted markup.
 * @module ssr/svelte
 */
import "./index";

/** What a compiled Svelte 5 server snippet pushes into. The real object is Svelte's renderer. */
interface MarkupRenderer {
  push(html: string): void;
  component(renderBody: (renderer: MarkupRenderer) => void, owner?: unknown): void;
}

type ServerSnippet = (renderer: MarkupRenderer, ...args: unknown[]) => void;

const bridge = (globalThis as unknown as Record<symbol, {
  shadow: (tag: string, markup: string, prefix: string) => string;
  svelte?: (
    tag: string,
    attributes: Record<string, unknown>,
    children: ServerSnippet | undefined,
    slots: Array<[string, ServerSnippet]>,
    prefix: string,
  ) => string;
}>)[Symbol.for("mtrl.ssr")];

let serializingChildren = false;
const TAG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const NAME = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;
const SLOT = /^[a-z][a-z0-9-]*$/;

const isDevelopment = (): boolean => {
  try {
    return typeof process !== "undefined" && process.env != null && process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
};

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Host attributes as HTML. Functions and unsafe names stay out of the string the bridge parses. */
const attributeText = (attributes: Record<string, unknown>): string => {
  let text = "";
  for (const [name, value] of Object.entries(attributes)) {
    if (!NAME.test(name)) continue;
    if (typeof value === "string") text += ` ${name}="${escapeAttr(value)}"`;
    else if (typeof value === "number" && Number.isFinite(value)) text += ` ${name}="${value}"`;
    else if (value === true) text += ` ${name}=""`;
  }
  return text;
};

/**
 * Light DOM the element factory reads, without nested declarative roots.
 * Snippets run against a real renderer so dev-mode element checks have a component context.
 */
const childrenMarkup = (children: ServerSnippet | undefined, slots: Array<[string, ServerSnippet]>): string => {
  const Capture = (renderer: MarkupRenderer, props: { children?: ServerSnippet; slots: Array<[string, ServerSnippet]> }): void => {
    renderer.component((target) => {
      props.children?.(target);
      for (const [slot, snippet] of props.slots) {
        target.push(`<span style="display: contents" slot="${slot}">`);
        snippet(target);
        target.push("</span>");
      }
    }, Capture);
  };
  return render(Capture as unknown as Component<{ children?: ServerSnippet; slots: Array<[string, ServerSnippet]> }>, {
    props: { children, slots },
  }).body;
};

bridge.svelte = (tag, attributes, children, slots, prefix) => {
  // Nested components emit their own roots in the outer tree. Serializing them
  // again would declare a shadow root twice, which the renderer rejects.
  if (serializingChildren) return "";
  if (!TAG.test(tag)) throw new TypeError(`Invalid tag: ${tag}`);
  for (const [slot] of slots) if (!SLOT.test(slot)) throw new TypeError(`Invalid slot: ${slot}`);
  let light: string;
  serializingChildren = true;
  try {
    // The detached renderer has no access to providers above this host. The
    // page renders these snippets again in its own tree, where a real child
    // error still escapes through Svelte's normal server render.
    light = childrenMarkup(children, slots);
  } catch (error) {
    if (isDevelopment()) {
      const id = typeof attributes.id === "string" && attributes.id ? ` id=${JSON.stringify(attributes.id)}` : "";
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[mtrl] <${tag}${id}> child snapshot failed, often because it needs ancestor context; this response has no shadow root for it: ${message}`);
    }
    return "";
  } finally {
    serializingChildren = false;
  }
  const markup = `<${tag}${attributeText(attributes)}>${light}</${tag}>`;
  // An opted-out host has no shadow content and must not get an empty template.
  const html = bridge.shadow(tag, markup, prefix);
  return html ? `<template shadowrootmode="open" shadowrootdelegatesfocus="">${html}</template>` : "";
};
