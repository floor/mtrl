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
  handleTabClick?: (event: unknown, tab: TabComponent) => void;
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

  // Fallback: check if component has tabs array
  if (Array.isArray(component.tabs)) {
    return component.tabs.find((tab) => tab.isActive && tab.isActive());
  }

  // If all else fails, return null
  return null;
}

/** Counter for generated tab-group ids */
let nextTabsGroupId = 0;

/**
 * Allocates a unique id for a tab group so two tablists can share values
 * @returns Generated group id
 */
export function allocateTabsGroupId(): string {
  return `tabs-${++nextTabsGroupId}`;
}

/**
 * Tab element id for a value inside a group
 * @param groupId - Tab group id
 * @param value - Tab value
 * @returns Element id
 */
function tabIdFor(groupId: string, value: string): string {
  return `tab-${groupId}-${value}`;
}

/**
 * Finds a tabpanel registered to this tab: labelled by its id, or carrying
 * the conventional `tabpanel-{groupId}-{value}` id.
 * @param tab - Tab element
 * @returns Registered panel or null
 */
const findRegisteredPanel = (tab: HTMLElement): Element | null => {
  const tabId = tab.id;
  if (!tabId) return null;

  const panels = document.querySelectorAll('[role="tabpanel"]');
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    if (panel.getAttribute("aria-labelledby") === tabId) {
      return panel;
    }
  }

  if (tabId.startsWith("tab-")) {
    const panel = document.getElementById(`tabpanel-${tabId.slice(4)}`);
    if (panel && panel.getAttribute("role") === "tabpanel") {
      return panel;
    }
  }

  return null;
};

/**
 * Points `aria-controls` at a registered panel, and only then.
 * @param element - Tab element
 */
export function syncTabControls(element: HTMLElement): void {
  const panel = findRegisteredPanel(element);
  if (panel && panel.id) {
    element.setAttribute("aria-controls", panel.id);
  } else {
    element.removeAttribute("aria-controls");
  }
}

/**
 * Sets a unique per-group tab id and wires `aria-controls` if a panel exists
 * @param element - Tab element
 * @param groupId - Tab group id
 * @param value - Tab value
 */
export function applyTabIdentity(
  element: HTMLElement,
  groupId: string,
  value: string,
): void {
  if (!value) {
    element.removeAttribute("id");
    element.removeAttribute("aria-controls");
    return;
  }
  element.setAttribute("id", tabIdFor(groupId, value));
  syncTabControls(element);
}

/**
 * Updates tab panels based on active tab
 * @param component - Component with tabs
 */
export function updateTabPanels(component: TabsHost): void {
  const tabs =
    typeof component.getTabs === "function"
      ? component.getTabs()
      : Array.isArray(component.tabs)
        ? component.tabs
        : [];
  const activeTab = getActiveTab(component);

  tabs.forEach((tab) => {
    syncTabControls(tab.element);
    const panel = findRegisteredPanel(tab.element);
    if (!panel) return;

    if (tab === activeTab) {
      panel.removeAttribute("hidden");
      panel.setAttribute("tabindex", "0");
    } else {
      panel.setAttribute("hidden", "true");
      panel.setAttribute("tabindex", "-1");
    }
  });
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
