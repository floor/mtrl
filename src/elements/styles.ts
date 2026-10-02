// src/elements/styles.ts
/**
 * Stylesheets for the shadow roots of the elements.
 *
 * Each element adopts the CSS of its component and the component's style
 * dependencies, the same entries the selective stylesheets are built from
 * (`scripts/style-manifest.ts`). One sheet per entry per page, shared by every
 * instance.
 *
 * @module elements
 */

/** The tag prefix: `<m-switch>`. The pre-upgrade CSS is built for it. */
export const DEFAULT_PREFIX = "m";

const sources = new Map<string, string>();
const fallbackStyles = new WeakSet<Node>();

/** Internal registry access; preserves application registrations and overrides. */
export const styleText = (name: string): string | undefined => sources.get(name);

/** Identifies only fallback nodes inserted by applyStyles, never authored styles. */
export const isFallbackStyle = (node: Node): boolean => fallbackStyles.has(node);

const sheets = new Map<string, CSSStyleSheet>();

/**
 * Registers the CSS text of style entries, keyed as in `componentStyles`.
 * Must run before the elements that use them are created.
 */
export const registerStyles = (css: Record<string, string>): void => {
  for (const [name, text] of Object.entries(css)) {
    sources.set(name, text);
    sheets.delete(name);
  }
};

/** Whether CSS is registered under a name. */
export const hasStyles = (name: string): boolean => sources.has(name);

const canAdopt = (): boolean =>
  typeof CSSStyleSheet === "function" &&
  "replaceSync" in CSSStyleSheet.prototype &&
  typeof ShadowRoot === "function" &&
  "adoptedStyleSheets" in ShadowRoot.prototype;

const sheetFor = (name: string, text: string): CSSStyleSheet => {
  let sheet = sheets.get(name);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    sheets.set(name, sheet);
  }
  return sheet;
};

// ---------------------------------------------------------------------------
// Pre-upgrade styles (ssr.md, Phase A): `:not(:defined)` rules in the page
// that give an element its box before its script upgrades it. Built for the
// default prefix; the CSS module of each element registers its own.

const PREUPGRADE_LAYER = "mtrl.preupgrade";
const preupgrade = new Map<string, string>();
const preupgradePrefixes = new Set<string>();
/** Where each document's rules go: an adopted sheet, or a `<style>` where sheets cannot be adopted. */
const preupgradeTargets = new WeakMap<Document, { sheet: CSSStyleSheet } | { style: HTMLStyleElement }>();

/**
 * Pre-upgrade CSS, built for the default prefix, for another one: every tag
 * selector `m-*` becomes `<prefix>-*`. The rules name tags only in selectors
 * (`m-tabs:not(:defined)>*`), and no value starts a word with `m-`.
 */
export const retagPreupgrade = (css: string, prefix: string): string =>
  prefix === DEFAULT_PREFIX ? css : css.replace(/(^|[\s,>+~({}])m-(?=[a-z])/g, `$1${prefix}-`);

/** The rules as one layered stylesheet, for each prefix. */
export const preupgradeSheet = (css: string, prefixes: Iterable<string> = [DEFAULT_PREFIX]): string =>
  `@layer ${PREUPGRADE_LAYER}{${Array.from(prefixes, (prefix) => retagPreupgrade(css, prefix)).join("")}}`;

const applyPreupgrade = (): void => {
  if (typeof document === "undefined" || !preupgradePrefixes.size) return;
  const doc = document;
  const text = preupgradeSheet(Array.from(preupgrade.values()).join(""), preupgradePrefixes);
  let target = preupgradeTargets.get(doc);
  if (!target) {
    if (typeof CSSStyleSheet === "function" && "replaceSync" in CSSStyleSheet.prototype && "adoptedStyleSheets" in doc) {
      const sheet = new CSSStyleSheet();
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      target = { sheet };
    } else {
      const style = doc.createElement("style");
      doc.head.append(style);
      target = { style };
    }
    preupgradeTargets.set(doc, target);
  }
  if ("sheet" in target) target.sheet.replaceSync(text);
  else target.style.textContent = text;
};

/**
 * Registers pre-upgrade rules by entry, and applies them to the document in a
 * browser, for the default prefix and those `usePreupgradePrefix` added. On a
 * server it only records them.
 */
export const registerPreupgrade = (css: Record<string, string>): void => {
  for (const [name, text] of Object.entries(css)) preupgrade.set(name, text);
  preupgradePrefixes.add(DEFAULT_PREFIX);
  applyPreupgrade();
};

/** Applies the registered pre-upgrade rules for another tag prefix too. */
export const usePreupgradePrefix = (prefix: string): void => {
  if (preupgradePrefixes.has(prefix)) return;
  preupgradePrefixes.add(prefix);
  if (preupgrade.size) applyPreupgrade();
};

/**
 * Applies the registered entries to a shadow root, in the given order.
 * Falls back to `<style>` elements where constructable stylesheets are missing.
 */
export const applyStyles = (root: ShadowRoot, names: readonly string[]): void => {
  const known = names.filter((name) => sources.has(name));
  if (canAdopt()) {
    root.adoptedStyleSheets = known.map((name) => sheetFor(name, sources.get(name) as string));
    return;
  }
  for (const name of known) {
    const style = document.createElement("style");
    style.textContent = sources.get(name) as string;
    fallbackStyles.add(style);
    root.append(style);
  }
};
