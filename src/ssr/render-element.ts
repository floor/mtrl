// src/ssr/render-element.ts
import { DOMParser } from "linkedom";
import { elements } from "../elements";
import { createElementClass, type ElementSpec, type ElementComponent } from "../elements/define";
import { isFallbackStyle } from "../elements/styles";
import { getComponentDefaults } from "../core/config/global";
import { setHTML } from "../core/dom/html";
import { withServerScope } from "./server-dom";
import { attributesText, serializeNode } from "./serialize";
import { renderStyles } from "./styles";

/** true emits an empty attribute; false, null and undefined omit it. Numbers must be finite. */
export type RenderAttributes = Readonly<Record<string, string | number | boolean | null | undefined>>;
/** Tag prefix defaults to "m". Link styles may flash while their CSS loads. */
export type RenderOptions = { prefix?: string } & (
  | { styles?: "inline" }
  | { styles: "link"; cssBase: string }
);
const specs = new Map<string, ElementSpec<ElementComponent>>(
  Object.values(elements).map(({ spec }) => [spec.name, spec as unknown as ElementSpec<ElementComponent>]),
);
const globals = new Set(("id class style title slot part exportparts role tabindex hidden inert lang dir draggable " +
  "accesskey contenteditable spellcheck translate autocapitalize autofocus name form").split(" "));

const validateAttributes = (attributes: RenderAttributes, spec: ElementSpec<ElementComponent>, skipUnknown = false): Map<string, string> => {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) throw new TypeError("Attributes must be a record");
  const result = new Map<string, string>();
  const seen = new Set<string>();
  for (const key of Reflect.ownKeys(attributes)) {
    if (typeof key !== "string") throw new TypeError("Attribute names must be strings");
    const name = key.toLowerCase();
    const allowed = /^[a-z][a-z0-9_.:-]*$/.test(name) && !/^on/.test(name) && name !== "srcdoc" &&
      (globals.has(name) || /^(data|aria)-[a-z0-9_.:-]+$/.test(name) ||
        Object.prototype.hasOwnProperty.call(spec.attributes ?? {}, name) || spec.slot?.attribute === name);
    // A bridge host is the framework's element, which already emits every
    // attribute. Names this factory does not read stay off this detached copy
    // so they cannot be serialized into the shadow markup. Duplicates of a
    // name the factory does read, and bad values of those names, still throw.
    // renderElement (skipUnknown false) rejects the unknown name itself.
    if (seen.has(name) || !allowed) {
      if (skipUnknown && !seen.has(name)) continue;
      throw new TypeError(`Invalid host attribute: ${key}`);
    }
    seen.add(name);
    const value = attributes[key];
    if (value === false || value === null || value === undefined) continue;
    if (!["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) {
      throw new TypeError(`Invalid value for attribute: ${key}`);
    }
    const text = value === true ? "" : String(value);
    if (text.includes("\0")) throw new TypeError(`NUL in attribute: ${key}`);
    result.set(name, text);
  }
  return result;
};

const validateOptions = (options: RenderOptions): string => {
  if (!options || typeof options !== "object" || Array.isArray(options)) throw new TypeError("Invalid render options");
  const prefix = options.prefix ?? "m";
  if (typeof prefix !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(prefix)) throw new TypeError("Invalid tag prefix");
  for (const key of Reflect.ownKeys(options)) {
    if (!["prefix", "styles", "cssBase"].includes(String(key))) throw new TypeError(`Invalid render option: ${String(key)}`);
  }
  if (options.styles !== undefined && options.styles !== "inline" && options.styles !== "link") throw new TypeError("Invalid styles mode");
  if (options.styles === "link") {
    const base = options.cssBase;
    // eslint-disable-next-line no-control-regex
    if (typeof base !== "string" || !base || /[\s\u0000-\u001f\u007f\\<>"'?#]/.test(base) || base.startsWith("//") ||
        (/^[^/]*:/.test(base) && !/^https?:\/\/[^/]+/i.test(base))) throw new TypeError("cssBase must be a relative or HTTP(S) URL base");
    if (/^https?:/i.test(base)) {
      const url = new URL(base);
      if (url.username || url.password) throw new TypeError("cssBase must not contain credentials");
    }
  } else if ("cssBase" in options) throw new TypeError("cssBase requires styles: link");
  return prefix;
};

/**
 * Render a registered tag to declarative shadow DOM, synchronously and detached.
 * Children are HTML processed by setHTML/configureHTML. The default policy is
 * identity: this function is NOT a sanitizer. Configure a synchronous sanitizer
 * for untrusted children or HTML-valued attributes. Which attributes take markup
 * is listed in the README under Markup and sanitizing.
 *
 * Each call owns a temporary DOM realm (zero layout, 1024×768 viewport).
 * The published mtrl/ssr entry registers element CSS automatically.
 * Hooks must be synchronous and must not reenter the renderer. Base/theme CSS belongs
 * in the page head. Every shadow root receives its own styles.
 * Specs may opt out with `ssr: false` or a synchronous `(host) => boolean`.
 * An opted-out element emits its authored host and light DOM without a
 * declarative root or shadow styles. Eligible light-DOM descendants still
 * render their own roots. Load mtrl/elements/preupgrade.css in the page to
 * preserve the host's box until normal browser upgrade.
 *
 * Carousel, FAB menu and toolbar opt out; menu and split-button opt out when
 * they declare nested submenus. Async button `showProgress` or card `buttons`
 * global defaults conservatively opt out every element in the call, since
 * those factories can also be created inside other components.
 * Invalid attributes/options, an existing declarative root, ambiguous HTML,
 * excessive nesting, missing CSS, reentrant rendering and failing synchronous
 * hooks still throw: returning markup for those inputs would be incorrect.
 */
export function renderElement(
  tag: string,
  attributes: RenderAttributes = {},
  children = "",
  options: RenderOptions = {},
): string {
  return render(tag, attributes, children, options).html;
}

/** Internal adapter entry: returns just the root shadow, before serializing light DOM. */
function renderShadow(tag: string, markup: string, prefix: string, renderedChildren = false): string {
  const host = new DOMParser().parseFromString(markup, "text/html").querySelector(tag) as unknown as Element;
  // Solid and Vue reuse the page's rendered children, including nested
  // adapters' templates. Remove those only from this detached copy before the
  // regular renderer audits it. Public renderElement still rejects authored roots.
  if (renderedChildren) {
    for (const template of Array.from(host.querySelectorAll("template[shadowrootmode]"))) template.remove();
  }
  const attributes = Object.fromEntries(Array.from(host.attributes, a => [a.name, a.value]));
  return render(tag, attributes, host.innerHTML, { prefix }, true).shadow;
}

function render(tag: string, attributes: RenderAttributes, children: string, options: RenderOptions, shadowOnly = false): { html: string; shadow: string } {
  const prefix = validateOptions(options);
  // Global defaults also reach factories created inside another component.
  // These paths start native promises/imports, outside the inert scheduler.
  const defaultsFor = getComponentDefaults as (name: string) => {
    showProgress?: boolean; buttons?: readonly unknown[];
  } | undefined;
  const asyncDefaults = !!(defaultsFor("button")?.showProgress || defaultsFor("card")?.buttons?.length);
  const resolve = (name: string): ElementSpec<ElementComponent> | undefined =>
    name.startsWith(`${prefix}-`) ? specs.get(name.slice(prefix.length + 1)) : undefined;
  const spec = typeof tag === "string" ? resolve(tag) : undefined;
  if (!spec) throw new TypeError(`Unknown renderable tag: ${String(tag)}`);
  const attrs = validateAttributes(attributes, spec, shadowOnly);
  if (typeof children !== "string") throw new TypeError("Children must be an HTML string");
  try {
    return withServerScope(scope => {
      const define = (entry: ElementSpec<ElementComponent>): void => {
        const name = `${prefix}-${entry.name}`;
        if (!customElements.get(name)) customElements.define(name, createElementClass(entry));
      };
      define(spec);
      const host = scope.document.createElement(tag);
      for (const [name, value] of attrs) host.setAttribute(name, value);
      setHTML(host, children);
      // linkedom parses textarea as raw text and keeps HTML's ignored first
      // newline. Repair only authored nodes, after the HTML policy has run.
      const normalize = (node: Element): void => {
        if (node.localName === "textarea") {
          const raw = (node.textContent ?? "").replace(/</g, "&lt;");
          const decoded = new DOMParser().parseFromString(`<span>${raw}</span>`, "text/html").firstElementChild!.textContent ?? "";
          node.textContent = decoded;
        }
        if (["textarea", "pre", "listing"].includes(node.localName) && node.firstChild?.nodeType === 3) {
          node.firstChild.textContent = (node.firstChild.textContent ?? "").replace(/^\n/, "");
        }
        const container = node.localName === "template" ? (node as HTMLTemplateElement).content : node;
        for (const child of Array.from(container.children)) normalize(child);
      };
      normalize(host);
      // Audit the entire authored tree before the first factory runs. Templates
      // are inert; their declarations are never mounted or interpreted here.
      const audit = (element: Element, depth: number): void => {
        if (element.localName === "template") return;
        const entry = resolve(element.localName);
        if (entry) {
          if (depth >= 64) throw new RangeError("SSR element nesting exceeds 64 levels");
          const raw = Object.fromEntries(Array.from(element.attributes, a => [a.name, a.value]));
          const kept = validateAttributes(raw, entry, shadowOnly);
          if (shadowOnly) {
            for (const attr of Array.from(element.attributes)) {
              if (!kept.has(attr.name.toLowerCase())) element.removeAttribute(attr.name);
            }
          }
          if (Array.from(element.children).some(child => child.localName === "template" && child.hasAttribute("shadowrootmode"))) {
            throw new TypeError("SSR host already declares a shadow root");
          }
          define(entry);
          // Parsed, detached and factory-generated hosts may predate their
          // definition. Upgrade only the audited node; templates stay inert.
          customElements.upgrade(element);
          depth++;
        }
        for (const child of Array.from(element.children)) audit(child, depth);
      };
      audit(host, 0);
      let rootShadow = "";
      const expand = (element: HTMLElement, depth: number): string | undefined => {
        const entry = resolve(element.localName);
        if (!entry) return undefined;
        audit(element, depth);
        const authored = Array.from(element.attributes, a => [a.name, a.value] as const);
        const ssr = !asyncDefaults && (typeof entry.ssr === "function" ? entry.ssr(element) : entry.ssr !== false);
        const light = Array.from(element.childNodes, node => node.cloneNode(true));
        if (!ssr) {
          const content = light.map(node => serializeNode(node, expand, depth + 1)).join("");
          return `<${element.localName}${attributesText(authored)}>${content}</${element.localName}>`;
        }
        const styles = renderStyles(entry, options);
        scope.mount(element);
        const shadow = Array.from(element.shadowRoot!.childNodes)
          .filter(node => !isFallbackStyle(node))
          .map(node => serializeNode(node, expand, depth + 1)).join("");
        if (depth === 0) rootShadow = styles + shadow;
        const content = shadowOnly && depth === 0 ? "" : light.map(node => serializeNode(node, expand, depth + 1)).join("");
        return `<${element.localName}${attributesText(authored)}><template shadowrootmode="open" shadowrootdelegatesfocus="">` +
          `${styles}${shadow}</template>${content}</${element.localName}>`;
      };
      const html = expand(host, 0)!;
      return { html, shadow: rootShadow };
    });
  } catch (cause) {
    const Failure = cause instanceof RangeError ? RangeError : cause instanceof TypeError ? TypeError : Error;
    const error = new Failure(`SSR <${tag}>: ${cause instanceof Error ? cause.message : String(cause)}`);
    Object.defineProperty(error, "cause", { value: cause, configurable: true });
    throw error;
  }
}

// Internal cross-bundle bridge, installed only when the server entry is loaded.
Object.assign(globalThis, { [Symbol.for("mtrl.ssr")]: { shadow: renderShadow } });
