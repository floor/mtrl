// src/elements/tabs.ts
/**
 * `<m-tabs>` with `<m-tab>` children.
 *
 * Each `<m-tab>` declares one tab (`value`, `icon`, `badge`, `disabled`, and its
 * text as content). The tabs element reads them into the factory's config and
 * rebuilds when they change; the children stay where the framework put them.
 * `value` on `<m-tabs>` is the default selection, which moves the live one
 * until the user or script changes it; the `value` property is the live
 * selection.
 *
 * Parts: `tabs`, `scroll`, `tab`, `button`, `icon`, `text`, `ripple`, `indicator`, `divider`.
 *
 * @module elements
 */

import createTabs from "../components/tabs";
import type { TabConfig, TabsComponent, TabsConfig } from "../components/tabs/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementInstance, type ElementSpec,
} from "./define";

const declaredTabs = (host: HTMLElement): TabConfig[] => {
  const tabTag = host.localName.replace(/tabs$/, "tab");
  const active = host.getAttribute("value");
  const tabs: TabConfig[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== tabTag) continue;
    const text = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    const value = child.getAttribute("value") ?? text;
    const badge = child.getAttribute("badge");
    tabs.push({
      text,
      value,
      icon: child.getAttribute("icon") ?? undefined,
      badge: badge ?? undefined,
      disabled: child.hasAttribute("disabled"),
      state: value === active ? "active" : undefined,
    });
  }
  return tabs;
};

const readTabs = (host: HTMLElement): Config => ({ tabs: declaredTabs(host) }) satisfies TabsConfig;

/**
 * Applies the declared tabs to the component in place: text, icon, badge and
 * disabled changes, removals, and tabs added at the end. Keeps the component,
 * its selection and focus. Returns false for what the tabs API cannot do in
 * place (a reorder, an insertion before existing tabs, a repeated value), so
 * the element rebuilds instead.
 */
const updateTabs = (host: HTMLElement, component: TabsComponent): boolean => {
  const declared = declaredTabs(host);
  const values = declared.map((tab) => tab.value ?? "");
  if (new Set(values).size !== values.length) return false;
  const current = component.getTabs();
  const existing = new Set(current.map((tab) => tab.getValue()));
  const kept = current.map((tab) => tab.getValue()).filter((value) => values.includes(value));
  const firstNew = values.findIndex((value) => !existing.has(value));
  const declaredKept = (firstNew === -1 ? values : values.slice(0, firstNew)).filter((value) => existing.has(value));
  // Everything already there must come first, in the same order.
  if (kept.join("\u0000") !== declaredKept.join("\u0000")) return false;
  if (firstNew !== -1 && values.slice(firstNew).some((value) => existing.has(value))) return false;

  for (const tab of current) if (!values.includes(tab.getValue())) component.removeTab(tab);
  for (const config of declared) {
    const tab = component.getTabs().find((candidate) => candidate.getValue() === config.value);
    if (!tab) {
      component.addTab({ ...config, state: undefined });
      continue;
    }
    if (tab.getText() !== (config.text ?? "")) tab.setText(config.text ?? "");
    if (tab.getIcon() !== (config.icon ?? "")) tab.setIcon(config.icon ?? "");
    if (config.badge !== undefined) {
      if (tab.getBadge() !== String(config.badge)) tab.setBadge(config.badge);
      else tab.showBadge();
    } else {
      tab.hideBadge();
    }
    if (config.disabled) tab.disable();
    else tab.enable();
  }
  return true;
};

const tabsSpec = {
  name: "tabs",
  create: (config) => createTabs(config as TabsConfig),
  styles: ["badge", "progress", "button", "tabs"],
  hostStyles: ":host{display:block}",
  attributes: {
    variant: { type: "string", config: "variant" },
    value: { type: "string" },
  },
  properties: {
    value: {
      get: (c) => c.getActiveTab()?.getValue() ?? null,
      set: (c, v) => void (v === null || v === undefined ? undefined : c.setActiveTab(String(v))),
    },
  },
  model: "value" as const,
  events: {
    change: {
      detail: (payload) => ({ value: (payload as { value: string | null }).value }),
    },
  },
  config: readTabs,
  observeChildren: updateTabs,
} satisfies ElementSpec<TabsComponent>;

export const tabsElement = defineElement<TabsComponent>(tabsSpec);
export type TabsSpec = typeof tabsSpec;
/** `<m-tabs>` as a ref or a query returns it. */
export type TabsElement = ElementInstance<TabsSpec, TabsComponent>;

/**
 * `<m-tab>` declares one tab and renders nothing. Its text content is the
 * label unless `label` is set.
 */
export const tabDeclaration = {
  name: "tab",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string" },
    badge: { type: "string" },
    disabled: { type: "boolean" },
  },
} as const;
export type TabAttributes = ElementAttributes<typeof tabDeclaration>;

/** Registers `<m-tabs>` and `<m-tab>` (or with another prefix). */
export const defineTabs = (options?: DefineOptions): string => {
  const tabTag = `${options?.prefix ?? DEFAULT_PREFIX}-${tabDeclaration.name}`;
  // A tab only declares data: it renders nothing, and its properties write the
  // attributes the tabs read. Defined first, so tabs already in the page are
  // upgraded before the tabs element reads them.
  if (!customElements.get(tabTag)) customElements.define(tabTag, createDeclarationClass(tabDeclaration.attributes));
  return tabsElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-tabs": TabsElement;
    "m-tab": HTMLElement & TabAttributes;
  }
}
