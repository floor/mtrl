// src/core/navigation/destinations.ts
/**
 * Navigation destinations, shared by the navigation rail and the navigation
 * bar (FLO-305): each is a link (`href`) or a button with an indicator pill,
 * an icon, a label and an optional badge; one at most is active and carries
 * `aria-current="page"`. The arrow keys move focus between them along the
 * component's axis; every destination stays a tab stop, as links in a `nav`.
 * Internal: core/navigation has no index, so it is no public subpath.
 */
import { safeUrl } from "../utils/url";
import { setHTML } from "../dom/html";
import { activeElementOf } from "../dom/focus";

/** One destination, as both components take it. */
export interface DestinationConfig {
  id: string;
  label: string;
  /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  icon: string;
  /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Shown while this destination is active. */
  activeIcon?: string;
  href?: string;
  /** A count, a short text, or `true` for the dot */
  badge?: string | number | boolean;
  badgeLabel?: string;
  active?: boolean;
  disabled?: boolean;
}

/** The component's class for a part: `__item`, `__badge`, … */
export type PartClass = (part: string) => string;

/** A copy of the items with unique ids, labels and icons, and one active at most. */
export const copyDestinations = <T extends DestinationConfig>(items: T[], component: string): T[] => {
  const ids = new Set<string>();
  let selected = false;
  return items.map((item) => {
    if (!item.id || !item.label || !item.icon || ids.has(item.id))
      throw new Error(`${component} destinations require unique IDs, labels, and icons`);
    ids.add(item.id);
    const active = !!item.active && !item.disabled && !selected;
    selected ||= active;
    return { ...item, active };
  });
};

/** Shows, updates or removes the item's badge, and names the destination with it. */
export const updateBadge = (item: DestinationConfig, element: HTMLElement, cls: PartClass): void => {
  let badge = element.querySelector<HTMLElement>(`.${cls("__badge")}`);
  const visible = item.badge !== undefined && item.badge !== false && item.badge !== "";
  if (!visible) {
    badge?.remove();
    element.classList.remove(cls("__item--badged"));
    element.setAttribute("aria-label", item.label);
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = cls("__badge");
    badge.setAttribute("aria-hidden", "true");
    element.querySelector(`.${cls("__content")}`)!.append(badge);
  }
  badge.classList.toggle(cls("__badge--dot"), item.badge === true);
  badge.textContent = item.badge === true ? "" : String(item.badge);
  element.classList.toggle(cls("__item--badged"), item.badge !== true);
  element.setAttribute("aria-label", `${item.label}, ${item.badgeLabel || (item.badge === true ? "New activity" : String(item.badge))}`);
};

/** The destination's element: a link or a button, its indicator, icon, label and badge. */
export const createDestination = (item: DestinationConfig, cls: PartClass): HTMLElement => {
  const element = document.createElement(item.href ? "a" : "button");
  if (item.href) {
    if (!item.disabled) element.setAttribute("href", safeUrl(item.href));
    else {
      element.setAttribute("role", "link");
      element.tabIndex = -1;
    }
  } else {
    element.setAttribute("type", "button");
    if (item.disabled) element.setAttribute("disabled", "");
  }
  if (item.disabled) element.setAttribute("aria-disabled", "true");
  element.className = cls("__item");
  element.dataset.id = item.id;
  const indicator = document.createElement("span");
  indicator.className = cls("__indicator");
  indicator.setAttribute("aria-hidden", "true");
  const icon = document.createElement("span");
  icon.className = cls("__icon");
  icon.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = cls("__label");
  label.textContent = item.label;
  const content = document.createElement("span");
  content.className = cls("__content");
  content.append(indicator, icon, label);
  element.append(content);
  updateBadge(item, element, cls);
  return element;
};

/** Marks the active destination, and shows its active icon. */
export const updateSelection = (items: DestinationConfig[], nodes: Map<string, HTMLElement>, cls: PartClass): void => {
  for (const item of items) {
    const element = nodes.get(item.id)!;
    element.classList.toggle(cls("__item--active"), !!item.active);
    if (item.active) element.setAttribute("aria-current", "page");
    else element.removeAttribute("aria-current");
    const icon = element.querySelector<HTMLElement>(`.${cls("__icon")}`)!;
    setHTML(icon, item.active && item.activeIcon ? item.activeIcon : item.icon);
  }
};

/**
 * Moves focus between the enabled destinations: `next` and `previous` are the
 * arrow keys of the component's axis, Home and End go to the ends. Returns
 * whether it moved.
 */
export const moveDestinationFocus = (
  event: KeyboardEvent,
  nodes: Map<string, HTMLElement>,
  container: HTMLElement,
  keys: { next: string; previous: string },
): boolean => {
  const enabled = [...nodes.values()].filter((element) => !element.hasAttribute("aria-disabled"));
  const index = enabled.indexOf(activeElementOf(container) as HTMLElement);
  if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return false;
  let next: number;
  switch (event.key) {
    case keys.next: next = (index + 1) % enabled.length; break;
    case keys.previous: next = (index + enabled.length - 1) % enabled.length; break;
    case "Home": next = 0; break;
    case "End": next = enabled.length - 1; break;
    default: return false;
  }
  event.preventDefault();
  enabled[next]!.focus();
  return true;
};
