// src/components/drawer/features/items.ts

import { DrawerConfig, DrawerItemConfig, DrawerSelectEvent } from "../types";
import { DRAWER_EVENTS } from "../constants";

/**
 * Component shape expected by withItems
 */
interface ItemsBaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit: (event: string, data?: unknown) => void;
  [key: string]: unknown;
}

/**
 * Creates a single navigation item element
 */
const createItemElement = (
  item: DrawerItemConfig,
  getClass: (name: string) => string,
): HTMLElement => {
  const el = document.createElement("button");
  el.className = getClass("drawer__item");
  el.setAttribute("role", "tab");
  el.setAttribute("tabindex", "-1");

  if (item.id) {
    el.dataset.id = item.id;
  }

  if (item.disabled) {
    el.disabled = true;
    el.setAttribute("aria-disabled", "true");
  }

  // Active indicator (background shape)
  const indicator = document.createElement("span");
  indicator.className = getClass("drawer__active-indicator");
  el.appendChild(indicator);

  // Icon (optional, placed before label)
  if (item.icon) {
    const iconEl = document.createElement("span");
    iconEl.className = getClass("drawer__item-icon");
    iconEl.innerHTML = item.icon;
    el.appendChild(iconEl);
  }

  // Label text
  if (item.label) {
    const labelEl = document.createElement("span");
    labelEl.className = getClass("drawer__item-label");
    labelEl.textContent = item.label;
    el.appendChild(labelEl);
  }

  // Badge (optional, placed after label)
  if (item.badge) {
    const badgeEl = document.createElement("span");
    badgeEl.className = getClass("drawer__item-badge");
    badgeEl.textContent = item.badge;
    el.appendChild(badgeEl);
  }

  // Active state
  if (item.active) {
    el.classList.add(`${getClass("drawer__item")}--active`);
    el.setAttribute("aria-selected", "true");
    el.setAttribute("tabindex", "0");
  } else {
    el.setAttribute("aria-selected", "false");
  }

  return el;
};

/**
 * Creates a divider element
 */
const createDividerElement = (
  getClass: (name: string) => string,
): HTMLElement => {
  const el = document.createElement("hr");
  el.className = getClass("drawer__divider");
  el.setAttribute("role", "separator");
  return el;
};

/**
 * Creates a section label element
 */
const createSectionElement = (
  item: DrawerItemConfig,
  getClass: (name: string) => string,
): HTMLElement => {
  const el = document.createElement("div");
  el.className = getClass("drawer__section-label");
  el.textContent = item.label || item.sectionLabel || "";
  return el;
};

/**
 * Adds item management functionality to the drawer component
 *
 * @param config - Drawer configuration
 * @returns Component enhancer function
 */
export const withItems =
  (config: DrawerConfig) =>
  (component: ItemsBaseComponent): ItemsBaseComponent => {
    let currentItems: DrawerItemConfig[] = config.items || [];
    let activeId: string | null = null;
    let itemsContainer: HTMLElement | null = null;

    // Find initial active item
    const initialActive = currentItems.find(
      (item) =>
        item.type !== "divider" && item.type !== "section" && item.active,
    );
    if (initialActive?.id) {
      activeId = initialActive.id;
    }

    /**
     * Renders all items into the items container
     */
    const renderItems = (): void => {
      if (!itemsContainer) return;

      // Clear existing items
      itemsContainer.innerHTML = "";

      let navIndex = 0;

      currentItems.forEach((item) => {
        const type = item.type || "item";

        if (type === "divider") {
          itemsContainer!.appendChild(createDividerElement(component.getClass));
          return;
        }

        if (type === "section") {
          itemsContainer!.appendChild(
            createSectionElement(item, component.getClass),
          );
          return;
        }

        // Navigation item
        const itemEl = createItemElement(item, component.getClass);
        itemEl.dataset.navIndex = String(navIndex);
        navIndex++;

        // Click handler
        itemEl.addEventListener("click", (e: Event) => {
          if (item.id && !item.disabled) {
            setActive(item.id);

            const selectEvent: DrawerSelectEvent = {
              id: item.id,
              label: item.label || "",
              index: parseInt(itemEl.dataset.navIndex || "0", 10),
              originalEvent: e,
            };

            component.emit(DRAWER_EVENTS.SELECT, selectEvent);

            if (config.onSelect) {
              config.onSelect(selectEvent);
            }
          }
        });

        itemsContainer!.appendChild(itemEl);
      });

      // Set first item as tabbable if no active item
      if (!activeId) {
        const firstItem = itemsContainer.querySelector(
          `.${component.getClass("drawer__item")}`,
        ) as HTMLElement;
        if (firstItem) {
          firstItem.setAttribute("tabindex", "0");
        }
      }
    };

    /**
     * Sets the active item by id
     */
    const setActive = (id: string): void => {
      if (!itemsContainer) return;

      const activeClass = `${component.getClass("drawer__item")}--active`;

      // Deactivate all items
      const allItems = itemsContainer.querySelectorAll(
        `.${component.getClass("drawer__item")}`,
      );
      allItems.forEach((el) => {
        el.classList.remove(activeClass);
        el.setAttribute("aria-selected", "false");
        el.setAttribute("tabindex", "-1");
      });

      // Clear or activate
      if (!id) {
        activeId = null;

        // Ensure first item is tabbable when nothing is active
        const firstItem = itemsContainer.querySelector(
          `.${component.getClass("drawer__item")}`,
        ) as HTMLElement;
        if (firstItem) {
          firstItem.setAttribute("tabindex", "0");
        }
      } else {
        // Activate the target item
        const targetItem = itemsContainer.querySelector(
          `[data-id="${id}"]`,
        ) as HTMLElement;
        if (targetItem) {
          targetItem.classList.add(activeClass);
          targetItem.setAttribute("aria-selected", "true");
          targetItem.setAttribute("tabindex", "0");
          activeId = id;
        }
      }

      // Update the items config to reflect new active state
      currentItems = currentItems.map((item) => ({
        ...item,
        active: item.id === id,
      }));
    };

    /**
     * Gets the active item id
     */
    const getActive = (): string | null => activeId;

    /**
     * Sets the items and re-renders
     */
    const setItems = (items: DrawerItemConfig[]): void => {
      currentItems = items;

      // Recalculate active id
      const active = items.find(
        (item) =>
          item.type !== "divider" && item.type !== "section" && item.active,
      );
      activeId = active?.id || null;

      renderItems();
    };

    /**
     * Gets the current items configuration
     */
    const getItems = (): DrawerItemConfig[] => currentItems;

    /**
     * Sets badge text on a specific item
     */
    const setBadge = (id: string, badge: string): void => {
      if (!itemsContainer) return;

      const itemEl = itemsContainer.querySelector(
        `[data-id="${id}"]`,
      ) as HTMLElement;
      if (!itemEl) return;

      let badgeEl = itemEl.querySelector(
        `.${component.getClass("drawer__item-badge")}`,
      ) as HTMLElement;

      if (badge) {
        if (!badgeEl) {
          badgeEl = document.createElement("span");
          badgeEl.className = component.getClass("drawer__item-badge");
          itemEl.appendChild(badgeEl);
        }
        badgeEl.textContent = badge;
      } else if (badgeEl) {
        badgeEl.remove();
      }

      // Update items config
      currentItems = currentItems.map((item) =>
        item.id === id ? { ...item, badge } : item,
      );
    };

    // Setup keyboard navigation within items
    const handleKeydown = (e: KeyboardEvent): void => {
      if (!itemsContainer) return;

      const items = Array.from(
        itemsContainer.querySelectorAll(
          `.${component.getClass("drawer__item")}:not([disabled])`,
        ),
      ) as HTMLElement[];

      if (!items.length) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      let nextIndex = -1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (currentIndex >= 0) {
            items[currentIndex].click();
          }
          return;
        default:
          return;
      }

      if (nextIndex >= 0 && nextIndex < items.length) {
        items.forEach((item) => item.setAttribute("tabindex", "-1"));
        items[nextIndex].setAttribute("tabindex", "0");
        items[nextIndex].focus();
      }
    };

    // Create the items container and render
    itemsContainer = document.createElement("div");
    itemsContainer.className = component.getClass("drawer__items");
    itemsContainer.setAttribute("role", "tablist");
    itemsContainer.setAttribute("aria-orientation", "vertical");
    itemsContainer.addEventListener("keydown", handleKeydown);

    renderItems();

    return {
      ...component,
      itemsContainer,
      drawerItems: {
        setActive,
        getActive,
        setItems,
        getItems,
        setBadge,
        renderItems,
      },
    };
  };
