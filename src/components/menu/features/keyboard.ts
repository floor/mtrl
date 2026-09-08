// src/components/menu/features/keyboard.ts

import { MenuItem } from "../types";

/**
 * Keyboard navigation handler for menus
 * Manages focus management and keyboard interactions for accessibility
 */
export const createKeyboardNavigation = (component) => {
  // Track tab navigation state
  let isTabNavigation = false;

  // Typeahead search state
  let typeaheadBuffer = "";
  let typeaheadTimeout: ReturnType<typeof setTimeout> | null = null;
  const TYPEAHEAD_DELAY = 500; // Reset buffer after 500ms of no typing

  // Add event listener to detect Tab key navigation
  const setupTabKeyDetection = () => {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      // Set flag when Tab key is pressed
      isTabNavigation = e.key === "Tab";

      // Reset flag after a short delay
      setTimeout(() => {
        isTabNavigation = false;
      }, 100);
    });
  };

  // Call setup once
  setupTabKeyDetection();

  /**
   * Gets all focusable elements in the document
   * Useful for Tab navigation management
   */
  const getFocusableElements = (): HTMLElement[] => {
    // Query all potentially focusable elements
    const focusableElementsString =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = document.querySelectorAll(
      focusableElementsString,
    ) as NodeListOf<HTMLElement>;

    // Convert to array and filter out hidden elements
    return Array.from(elements).filter((element) => {
      return (
        element.offsetParent !== null && !element.classList.contains("hidden")
      );
    });
  };

  /**
   * The item that opened a submenu. A submenu records the id of that item and
   * its own depth, so the item can be found one level up. This used to come
   * from `state.activeSubmenuItem`, which the controller's state never had.
   */
  const parentItemOf = (menuElement: HTMLElement): HTMLElement | null => {
    const parentId = menuElement.getAttribute("data-parent-item");
    if (!parentId) return null;
    const level = parseInt(menuElement.getAttribute("data-level") || "1", 10);
    const scope =
      level <= 1
        ? component.element
        : document.querySelector(
            `.${component.getClass("menu--submenu")}[data-level="${level - 1}"]`
          );
    return ((scope ?? document).querySelector(
      `.${component.getClass("menu-item")}[data-id="${parentId}"]`
    ) ?? null) as HTMLElement | null;
  };

  /**
   * Every item in a menu, disabled ones included. A disabled item can take
   * focus and be read out, it just cannot be chosen
   * (m3.material.io menu accessibility, "Interactability"), so it belongs in
   * the set focus moves through.
   */
  const menuItems = (menuElement: HTMLElement): HTMLElement[] =>
    Array.from(
      menuElement.querySelectorAll(`.${component.getClass("menu-item")}`)
    ) as HTMLElement[];

  /**
   * Resets the typeahead search buffer
   */
  const resetTypeahead = (): void => {
    typeaheadBuffer = "";
    if (typeaheadTimeout) {
      clearTimeout(typeaheadTimeout);
      typeaheadTimeout = null;
    }
  };

  /**
   * Sets up initial focus within the menu
   * @param menuElement - The menu element to set focus within
   * @param interactionType - How the menu was opened; focus lands on the
   *   first item either way, so this is kept only for callers
   */
  const handleInitialFocus = (
    menuElement: HTMLElement,
    interactionType: "keyboard" | "mouse",
  ): void => {
    // Reset typeahead when menu opens
    resetTypeahead();

    const items = menuItems(menuElement);

    // The first item is the way into the menu for the Tab order, whichever
    // way the menu was opened
    items.forEach((item) => item.setAttribute("tabindex", "-1"));
    if (items.length > 0) items[0].setAttribute("tabindex", "0");

    // Opened with a key: focus the first item, which is what the spec asks
    // for and what a person navigating by key expects to see marked
    // (m3.material.io menu accessibility, "Initial focus").
    if (interactionType === "keyboard" && items.length > 0) {
      items[0].focus();
      return;
    }

    // Opened with a pointer: focus the menu itself. Focus is still inside
    // the menu, so Escape works and a screen reader announces it, but no
    // item is marked, and the first arrow press then lands on the first
    // item rather than stepping past it to the second.
    menuElement.setAttribute("tabindex", "-1");
    menuElement.focus();
  };

  /**
   * Handles keydown events on the menu or submenu
   */
  const handleMenuKeydown = (
    e: KeyboardEvent,
    state: any,
    actions: {
      closeMenu: (event: Event, restoreFocus?: boolean) => void;
      closeSubmenu: (level: number) => void;
      findItemById: (id: string) => MenuItem | null;
      handleSubmenuClick: (
        item: MenuItem,
        index: number,
        itemElement: HTMLElement,
      ) => void;
      handleNestedSubmenuClick: (
        item: MenuItem,
        index: number,
        itemElement: HTMLElement,
      ) => void;
    },
  ): void => {
    // Which menu the key belongs to is read from the element the event came
    // from. It used to come from `state.activeSubmenu`, a field the
    // controller's state never had, so every key was handled against the
    // root menu: an arrow inside a submenu looked for the focused item among
    // the root's items, found nothing, and jumped to the root's first item.
    const target = e.target as HTMLElement | null;
    const targetMenu = (target?.closest?.(`.${component.getClass("menu")}`) ??
      null) as HTMLElement | null;
    const menuElement = targetMenu ?? component.element;
    const isSubmenu =
      !!targetMenu &&
      targetMenu.classList.contains(component.getClass("menu--submenu"));

    // Focus moves through every item, disabled ones included
    const items = menuItems(menuElement);

    if (items.length === 0) return;

    // Find the currently focused item
    const focusedElement = document.activeElement as HTMLElement;
    let focusedItemIndex = -1;

    if (focusedElement && items.includes(focusedElement)) {
      focusedItemIndex = items.indexOf(focusedElement);
    }

    // Simplified focus function
    const focusItem = (index: number) => {
      if (items[index]) {
        items[index].focus();
      }
    };

    // Handle typeahead search for printable characters
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();

      // Add character to buffer
      typeaheadBuffer += e.key.toLowerCase();

      // Clear existing timeout
      if (typeaheadTimeout) {
        clearTimeout(typeaheadTimeout);
      }

      // Set timeout to reset buffer
      typeaheadTimeout = setTimeout(() => {
        typeaheadBuffer = "";
        typeaheadTimeout = null;
      }, TYPEAHEAD_DELAY);

      // Find matching item
      const matchIndex = items.findIndex((item) => {
        const textElement = item.querySelector(
          `.${component.getClass("menu-item-text")}`,
        );
        const text = textElement?.textContent?.toLowerCase() || "";
        return text.startsWith(typeaheadBuffer);
      });

      if (matchIndex !== -1) {
        focusItem(matchIndex);
      } else if (typeaheadBuffer.length > 1) {
        // If no match with multiple chars, try just the last character
        const lastChar = typeaheadBuffer.slice(-1);
        const singleCharMatch = items.findIndex((item) => {
          const textElement = item.querySelector(
            `.${component.getClass("menu-item-text")}`,
          );
          const text = textElement?.textContent?.toLowerCase() || "";
          return text.startsWith(lastChar);
        });

        if (singleCharMatch !== -1) {
          typeaheadBuffer = lastChar; // Reset buffer to just this char
          focusItem(singleCharMatch);
        }
      }

      return;
    }

    switch (e.key) {
      case "ArrowDown":
      case "Down":
        e.preventDefault();
        e.stopPropagation();
        if (focusedItemIndex < 0) {
          focusItem(0);
        } else if (focusedItemIndex < items.length - 1) {
          focusItem(focusedItemIndex + 1);
        } else {
          focusItem(0); // Wrap to first
        }
        break;

      case "ArrowUp":
      case "Up":
        e.preventDefault();
        e.stopPropagation();
        if (focusedItemIndex < 0) {
          focusItem(items.length - 1);
        } else if (focusedItemIndex > 0) {
          focusItem(focusedItemIndex - 1);
        } else {
          focusItem(items.length - 1); // Wrap to last
        }
        break;

      case "Home":
        e.preventDefault();
        e.stopPropagation();
        focusItem(0);
        break;

      case "End":
        e.preventDefault();
        e.stopPropagation();
        focusItem(items.length - 1);
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        e.stopPropagation();
        if (focusedItemIndex >= 0) {
          items[focusedItemIndex].click();
        }
        break;

      case "ArrowRight":
      case "Right":
        e.preventDefault();
        e.stopPropagation();
        if (isSubmenu) {
          // In a submenu, right arrow opens nested submenus
          if (
            focusedItemIndex >= 0 &&
            items[focusedItemIndex].classList.contains(
              `${component.getClass("menu-item--submenu")}`,
            )
          ) {
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(
              itemElement.getAttribute("data-index"),
              10,
            );
            const parentMenu = itemElement.closest(
              `.${component.getClass("menu--submenu")}`,
            );
            const parentItemId = parentMenu?.getAttribute("data-parent-item");

            // Find the parent item in the items array to get its submenu
            const parentItem = actions.findItemById(parentItemId);
            if (parentItem && parentItem.submenu) {
              const itemData = parentItem.submenu[itemIndex] as MenuItem;
              actions.handleNestedSubmenuClick(
                itemData,
                itemIndex,
                itemElement,
              );
            }
          }
        } else {
          // In main menu, right arrow opens a submenu
          if (
            focusedItemIndex >= 0 &&
            items[focusedItemIndex].classList.contains(
              `${component.getClass("menu-item--submenu")}`,
            )
          ) {
            // Get the correct menu item data
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(
              itemElement.getAttribute("data-index"),
              10,
            );
            const itemData = state.items[itemIndex] as MenuItem;

            // Open submenu
            actions.handleSubmenuClick(itemData, itemIndex, itemElement);
          }
        }
        break;

      case "ArrowLeft":
      case "Left":
        e.preventDefault();
        e.stopPropagation();
        if (isSubmenu) {
          // In a submenu, left arrow returns to the parent menu
          {
            const parentItem = parentItemOf(menuElement);
            const currentLevel = parseInt(
              menuElement.getAttribute("data-level") || "1",
              10,
            );
            actions.closeSubmenu(currentLevel);
            if (parentItem) parentItem.focus();
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        if (isSubmenu) {
          // In a submenu, Escape closes just that submenu and goes back to
          // the item that opened it
          {
            const parentItem = parentItemOf(menuElement);
            const currentLevel = parseInt(
              menuElement.getAttribute("data-level") || "1",
              10,
            );
            actions.closeSubmenu(currentLevel);
            if (parentItem) parentItem.focus();
          }
        } else {
          // In main menu, Escape closes the entire menu and restores focus to opener
          actions.closeMenu(e, true);
        }
        break;

      case "Tab":
        // Clear typeahead buffer when closing
        typeaheadBuffer = "";
        if (typeaheadTimeout) {
          clearTimeout(typeaheadTimeout);
          typeaheadTimeout = null;
        }

        // Close the menu when tabbing out and move focus to next focusable element
        e.preventDefault();

        // Find the opener element
        const openerElement = component.opener?.getOpener?.();

        // Always close the menu
        actions.closeMenu(e, true); // Pass true to restore focus to opener

        // If we want to move to the next/previous focusable element after the opener:
        if (openerElement) {
          // Let the browser focus the opener first (happens because we passed true above)
          // Then we can optionally set a timeout to move to next element
          setTimeout(() => {
            // Optional: If you want to move focus to next/prev element after restoring to opener
            if (e.shiftKey) {
              // For shift+tab, we could let natural tabbing continue from the opener
            } else {
              // For tab, we could programmatically focus the next element
              const focusableElements = getFocusableElements();
              const openerIndex = focusableElements.indexOf(openerElement);
              if (
                openerIndex >= 0 &&
                openerIndex < focusableElements.length - 1
              ) {
                focusableElements[openerIndex + 1].focus();
              }
            }
          }, 0);
        }
        break;
    }
  };

  /**
   * Set up keydown handler for a menu element
   */
  const setupKeyboardHandlers = (
    menuElement: HTMLElement,
    state: any,
    actions: any,
  ) => {
    // Make all menu items focusable via keyboard navigation
    const items = menuElement.querySelectorAll(
      `.${component.getClass("menu-item")}:not(.${component.getClass(
        "menu-item--disabled",
      )})`,
    ) as NodeListOf<HTMLElement>;
    items.forEach((item) => {
      item.tabIndex = -1;
    });

    // Set first item as focusable
    if (items.length > 0) {
      items[0].tabIndex = 0;
    }

    menuElement.addEventListener("keydown", (e) =>
      handleMenuKeydown(e, state, actions),
    );
  };

  /**
   * Checks if current interaction is tab navigation
   */
  const isTabNavigationActive = () => isTabNavigation;

  // Return the public API
  return {
    handleInitialFocus,
    handleMenuKeydown,
    setupKeyboardHandlers,
    isTabNavigationActive,
    getFocusableElements,
    resetTypeahead,
  };
};

/**
 * Adds keyboard navigation functionality to the menu component
 *
 * @param config - Menu configuration
 * @returns Component enhancer with keyboard navigation functionality
 */
const withKeyboard = () => (component) => {
  if (!component.element) {
    return component;
  }

  // Create keyboard navigation controller
  const keyboard = createKeyboardNavigation(component);

  // Return enhanced component
  return {
    ...component,
    keyboard,
  };
};

export default withKeyboard;
