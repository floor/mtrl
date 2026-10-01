// spike/ssr/render-element.ts — THROWAWAY prototype of `mtrl/ssr`'s renderElement.
//
// Runs the real custom element class (src/elements, defineElement) on the
// installed server DOM: the element is parsed into a server document and
// connected, so its own #config() (the spec's attribute → config mapping, the
// slot, spec.config(host)) builds the factory exactly as in a browser. The
// shadow root is then serialised into a declarative <template>, with the
// element's styles as <link rel="stylesheet"> instead of adopted sheets.
//
// installDom() must have run before this module is imported.

import { defineAll, elements, SHADOW_BASE_STYLES } from "../../src/elements";

export const kebab = (name: string): string => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

let defined = false;
export const ensureDefined = (): void => {
  if (defined) return;
  defined = true;
  const warn = console.warn;
  console.warn = () => {}; // "no CSS for …": the server links CSS instead
  try {
    defineAll();
  } finally {
    console.warn = warn;
  }
};

export interface RenderOptions {
  /** Where the element CSS files are served: `${base}/${entry}.css`. */
  cssBase?: string;
  /** Leave the element connected (to inspect it). */
  keep?: boolean;
  /**
   * Never connect the host to the document: call connectedCallback directly,
   * then destroy the component synchronously. Nothing is left for the
   * element's deferred (microtask) teardown, which would run after a scoped
   * render has restored the globals.
   */
  detached?: boolean;
}

/** The style entries an element's shadow root uses, in cascade order. */
export const styleEntries = (name: string): string[] => {
  const spec = Object.values(elements).find((e) => e.spec.name === name)?.spec;
  if (!spec) throw new Error(`no element ${name}`);
  return [`host-${name}`, ...SHADOW_BASE_STYLES, ...spec.styles];
};

/**
 * Renders host HTML (`<m-button variant="filled">Save</m-button>`) into the
 * host with a declarative shadow root. Returns the HTML and the shadow
 * root's own serialisation (for parity checks).
 */
const elementTags = (): Set<string> => new Set(Object.values(elements).map((e) => `m-${e.spec.name}`));
const escText = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

const serializeLight = (node: Node, options: RenderOptions): string => {
  if (node.nodeType === 3) return escText(node.textContent ?? "");
  if (node.nodeType === 8) return `<!--${node.textContent}-->`;
  if (node.nodeType !== 1) return "";
  const el = node as Element;
  if (elementTags().has(el.localName)) return renderHost(el.outerHTML, options).html;
  const attrs = Array.from(el.attributes, (a) => (a.value === "" ? ` ${a.name}` : ` ${a.name}="${escAttr(a.value)}"`)).join("");
  if (VOID.has(el.localName)) return `<${el.localName}${attrs}>`;
  return `<${el.localName}${attrs}>${Array.from(el.childNodes, (n) => serializeLight(n, options)).join("")}</${el.localName}>`;
};

export const renderHost = (hostHtml: string, options: RenderOptions = {}): { html: string; shadow: string; inner: string; host: Element } => {
  ensureDefined();
  const container = document.createElement("div");
  container.innerHTML = hostHtml; // not connected yet: no factory runs
  // The host as authored: what the element adds to its host or light DOM on
  // upgrade is the client's to add.
  const authored = container.firstElementChild as Element;
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const open = `<${authored.localName}${Array.from(authored.attributes, (a) => (a.value === "" ? ` ${a.name}` : ` ${a.name}="${esc(a.value)}"`)).join("")}>`;
  // Nested elements in the light DOM (a toolbar's <m-icon-button>s) are
  // rendered with their own declarative roots, recursively.
  const light = Array.from(authored.childNodes, (n) => serializeLight(n, options)).join("");
  if (options.detached) (container.firstElementChild as unknown as { connectedCallback: () => void }).connectedCallback();
  else document.body.append(container); // connectedCallback: the factory runs here
  const host = container.firstElementChild as Element;
  const root = host.shadowRoot;
  if (!root) throw new Error(`<${host.localName}> has no shadow root after connection`);
  // applyStyles' <style> fallback (no constructable sheets on the server) is dropped.
  for (const style of Array.from(root.querySelectorAll("style"))) style.remove();
  // linkedom keeps a cleared inline property as `display:` (and `right:;`), where
  // a browser removes it, and keeps style="" once all are cleared.
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const style = el.getAttribute("style");
    if (style === null) continue;
    const kept = style
      .split(";")
      .filter((d) => d.trim() && !/^\s*[-\w]+\s*:\s*$/.test(d))
      .join(";");
    if (kept) el.setAttribute("style", kept);
    else el.removeAttribute("style");
  }
  const shadow = root.innerHTML;
  const name = host.localName.replace(/^m-/, "");
  const links = styleEntries(name)
    .map((entry) => `<link rel="stylesheet" href="${options.cssBase ?? "/elements/css"}/${entry}.css">`)
    .join("");
  const inner = `${links}${shadow}`;
  const html = `${open}<template shadowrootmode="open" shadowrootdelegatesfocus>${inner}</template>${light}</${host.localName}>`;
  if (options.detached) (host as unknown as { component: { destroy: () => void } | null }).component?.destroy();
  else if (!options.keep) container.remove();
  return { html, shadow, inner, host };
};

/** The API the spec proposes: renderElement(tag, attributes, children). */
export const renderElement = (
  tag: string,
  attributes: Record<string, string | boolean> = {},
  children = "",
  options: RenderOptions = {}
): string => {
  const attrs = Object.entries(attributes)
    .filter(([, v]) => v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`))
    .join("");
  return renderHost(`<${tag}${attrs}>${children}</${tag}>`, options).html;
};

export { elements };
