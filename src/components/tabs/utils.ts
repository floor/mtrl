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

/**
 * Updates tab panels based on active tab
 * @param component - Component with tabs
 */
export function updateTabPanels(component: TabsHost): void {
  // Get active tab using our helper function
  const activeTab = getActiveTab(component);
  if (!activeTab) return;

  // Make sure getValue exists
  if (typeof activeTab.getValue !== "function") return;

  const activeValue = activeTab.getValue();

  // Find all tab panels in the document
  const tabPanels = document.querySelectorAll(`[role="tabpanel"]`);

  // Which values actually have a panel in the document right now. A page
  // supplies the panels, so this is the only place that knows.
  const linked = new Set<string>();

  tabPanels.forEach((panel) => {
    // Get the associated tab value
    const forTab = panel.getAttribute("aria-labelledby")?.replace("tab-", "");
    if (forTab) linked.add(forTab);

    if (forTab === activeValue) {
      panel.removeAttribute("hidden");
      panel.setAttribute("tabindex", "0");
    } else {
      panel.setAttribute("hidden", "true");
      panel.setAttribute("tabindex", "-1");
    }
  });

  // Point each tab at its panel, and only at a panel that exists. A tab whose
  // panel the page never supplied carries no `aria-controls` rather than a
  // reference that resolves to nothing. Panels added after the tabs are linked
  // here, which is why this cannot be decided once at creation.
  // Callers pass either the component or a plain `{ tabs, getActiveTab }`
  // literal — `features.ts` does the latter — so read the tabs from whichever
  // shape arrived rather than assuming the richer one.
  const allTabs =
    typeof component.getTabs === "function"
      ? component.getTabs()
      : (component as { tabs?: unknown[] }).tabs ?? [];

  {
    for (const tab of allTabs as Array<{ getValue?: () => string; element?: HTMLElement }>) {
      if (typeof tab?.getValue !== "function" || !tab.element) continue;
      const value = tab.getValue();
      const panelId = `tabpanel-${value}`;
      if (linked.has(value) && document.getElementById(panelId)) {
        tab.element.setAttribute("aria-controls", panelId);
      } else {
        tab.element.removeAttribute("aria-controls");
      }
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
