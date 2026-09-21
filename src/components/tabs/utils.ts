// src/components/tabs/utils.ts
import { TabComponent } from "./types";

/**
 * Tabs members read by these helpers; each one is checked before use
 */
interface TabsHost {
  element?: HTMLElement;
  tabs?: TabComponent[];
  getTabs?: () => TabComponent[];
  getActiveTab?: () => TabComponent | null;
  setActiveTab?: (tabOrValue: TabComponent | string) => unknown;
  handleTabClick?: (event: Event | null, tab: TabComponent) => void;
}

/**
 * Gets the active tab from a component
 * @param component - Component with tabs
 * @returns Active tab or null
 */
export function getActiveTab(component: TabsHost): TabComponent | null {
  // First try the standard method
  if (typeof component.getActiveTab === "function") {
    return component.getActiveTab();
  }

  // Fallback: check if component has tabs array. `find` yields undefined when
  // nothing matches, and this function promises null — a caller comparing
  // `=== null` would otherwise have been wrong about "no active tab".
  if (Array.isArray(component.tabs)) {
    return component.tabs.find((tab) => tab.isActive && tab.isActive()) ?? null;
  }

  // If all else fails, return null
  return null;
}

/** Counter behind {@link allocateTabsGroupId}. */
let nextTabsGroupId = 0;

/**
 * A fresh id for a tab group, so two tablists can share tab values.
 *
 * FLO-229. A tab's id was `tab-<value>`, which meant two groups on one page
 * with a value in common produced duplicate ids -- and, because panels were
 * resolved across the whole document, each group showed and hid the other's
 * panels. The group id is what makes both unique.
 */
export function allocateTabsGroupId(): string {
  return `tabs-${++nextTabsGroupId}`;
}

/** A tab's element id within its group. */
export function tabIdFor(groupId: string, value: string): string {
  return `tab-${groupId}-${value}`;
}

/** The panel id a group looks for when a page does not label its panels. */
export function tabPanelIdFor(groupId: string, value: string): string {
  return `tabpanel-${groupId}-${value}`;
}

/**
 * The panel registered to a tab, or null.
 *
 * A page registers a panel either by labelling it with the tab's own id, or
 * by giving it the conventional `tabpanel-<groupId>-<value>` id. Both are
 * keyed on the tab's id, so a panel can only ever belong to one group.
 */
export function findRegisteredPanel(tab: HTMLElement): HTMLElement | null {
  const tabId = tab.id;
  if (!tabId || typeof document === "undefined") return null;

  const labelled = document.querySelector<HTMLElement>(
    `[role="tabpanel"][aria-labelledby="${tabId}"]`
  );
  if (labelled) return labelled;

  // `tab-<groupId>-<value>` -> `tabpanel-<groupId>-<value>`
  if (tabId.startsWith("tab-")) {
    const byConvention = document.getElementById(`tabpanel-${tabId.slice(4)}`);
    if (byConvention?.getAttribute("role") === "tabpanel") return byConvention;
  }

  return null;
}

/**
 * Points a tab's `aria-controls` at its panel, and only at one that exists.
 *
 * A tab whose panel the page never supplied carries no `aria-controls` rather
 * than a reference resolving to nothing. Panels added after the tabs are
 * linked when this runs again, which is why it cannot be decided once at
 * creation.
 */
export function syncTabControls(element: HTMLElement): void {
  const panel = findRegisteredPanel(element);
  if (panel?.id) {
    element.setAttribute("aria-controls", panel.id);
  } else {
    element.removeAttribute("aria-controls");
  }
}

/**
 * Updates tab panels based on active tab
 * @param component - Component with tabs
 */
export function updateTabPanels(component: TabsHost): void {
  // Only this group's tabs, and only the panels registered to them. This read
  // every `[role="tabpanel"]` in the document and matched by stripping `tab-`
  // off each panel's aria-labelledby, so two groups sharing a value showed and
  // hid each other's panels -- a visible defect, not only an accessibility
  // one. FLO-229.
  //
  // Callers pass either the component or a plain `{ tabs, getActiveTab }`
  // literal -- features.ts does the latter -- so read the tabs from whichever
  // shape arrived.
  const tabs = (
    typeof component.getTabs === "function"
      ? component.getTabs()
      : (component as { tabs?: unknown[] }).tabs ?? []
  ) as Array<{ element?: HTMLElement }>;

  const activeTab = getActiveTab(component);

  for (const tab of tabs) {
    if (!tab?.element) continue;
    syncTabControls(tab.element);

    const panel = findRegisteredPanel(tab.element);
    if (!panel) continue;

    if (tab === (activeTab as unknown)) {
      panel.removeAttribute("hidden");
      panel.setAttribute("tabindex", "0");
    } else {
      panel.setAttribute("hidden", "true");
      panel.setAttribute("tabindex", "-1");
    }
  }
}

/**
 * Gives the tablist a single tab stop: the active tab, or the first enabled
 * one when none is active. Every other tab takes tabindex -1 and is reached
 * with the arrow keys (WAI-ARIA tabs pattern).
 * @param component - Tabs component
 */
export function syncTabStops(component: TabsHost): void {
  if (typeof component.getTabs !== "function") return;
  const tabs = component.getTabs();
  const enabled = tabs.filter((tab) => !(tab.element as HTMLButtonElement).disabled);
  const active = getActiveTab(component);
  const stop = active && enabled.includes(active) ? active : enabled[0];
  tabs.forEach((tab) => tab.element.setAttribute("tabindex", tab === stop ? "0" : "-1"));
}

/**
 * Sets up keyboard navigation for tabs
 * @param component - Tabs component
 */
export function setupKeyboardNavigation(component: TabsHost): void {
  // Skip if element is missing
  if (!component.element) return;
  const tablist = component.element;

  syncTabStops(component);

  tablist.addEventListener("keydown", (event: KeyboardEvent) => {
    // The key lands on the focused tab, never on the tablist itself
    const tabElement = (event.target as Element | null)?.closest?.('[role="tab"]');
    if (!tabElement || !tablist.contains(tabElement)) return;

    if (typeof component.getTabs !== "function") return;

    // Disabled tabs are skipped rather than focused
    const tabs = component
      .getTabs()
      .filter((tab) => !(tab.element as HTMLButtonElement).disabled);
    const currentIndex = tabs.findIndex((tab) => tab.element === tabElement);
    if (currentIndex === -1) return;

    // Left and right follow the reading direction
    const rtl = getComputedStyle(tablist).direction === "rtl";
    const last = tabs.length - 1;
    let newIndex: number;

    switch (event.key) {
      case "ArrowRight":
        newIndex = rtl
          ? (currentIndex > 0 ? currentIndex - 1 : last)
          : (currentIndex < last ? currentIndex + 1 : 0);
        break;

      case "ArrowLeft":
        newIndex = rtl
          ? (currentIndex < last ? currentIndex + 1 : 0)
          : (currentIndex > 0 ? currentIndex - 1 : last);
        break;

      case "Home":
        newIndex = 0;
        break;

      case "End":
        newIndex = last;
        break;

      default:
        return; // Don't handle other keys
    }

    event.preventDefault();
    const target = tabs[newIndex];
    if (target === tabs[currentIndex]) return;

    // Focus follows the key and selects, through the same path as a click
    target.element.focus();
    if (typeof component.handleTabClick === "function") {
      component.handleTabClick(null, target);
    } else if (typeof component.setActiveTab === "function") {
      component.setActiveTab(target);
    }
    syncTabStops(component);
  });
}
