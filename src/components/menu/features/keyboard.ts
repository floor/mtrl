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
   * @param interactionType - Type of interaction that opened the menu
   */
  const handleInitialFocus = (
    menuElement: HTMLElement,
    interactionType: "keyboard" | "mouse",
  ): void => {
    // Reset typeahead when menu opens
    resetTypeahead();

    if (interactionType === "keyboard") {
      // Find all focusable items
      const items = Array.from(
        menuElement.querySelectorAll(
          `.${component.getClass("menu-item")}:not(.${component.getClass(
            "menu-item--disabled",
          )})`,
        ),
      ) as HTMLElement[];

      if (items.length > 0) {
        // Set tabindex on first item and focus it
        items[0].setAttribute("tabindex", "0");
        items[0].focus();
      } else {
        // If no items, focus the menu itself
        menuElement.setAttribute("tabindex", "0");
        menuElement.focus();
      }
    } else {
      // For mouse interaction, make the menu focusable but don't auto-focus
      menuElement.setAttribute("tabindex", "-1");

      // Still set up the first item as focusable
      const firstItem = menuElement.querySelector(
        `.${component.getClass("menu-item")}:not(.${component.getClass(
          "menu-item--disabled",
        )})`,
      ) as HTMLElement;
      if (firstItem) {
        firstItem.setAttribute("tabindex", "0");
      }
    }
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
    // Determine if this event is from the main menu or a submenu
    const isSubmenu =
      state.activeSubmenu && state.activeSubmenu.contains(e.target as Node);

    // Get the appropriate menu element
    const menuElement = isSubmenu ? state.activeSubmenu : component.element;

    // Get all non-disabled menu items from the current menu
    const items = Array.from(
      menuElement.querySelectorAll(
        `.${component.getClass("menu-item")}:not(.${component.getClass(
          "menu-item--disabled",
        )})`,
      ),
    ) as HTMLElement[];

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
          if (state.activeSubmenuItem) {
            // Store the reference to the parent item before closing the submenu
            const parentItem = state.activeSubmenuItem;

            // Get the current level
            const currentLevel = parseInt(
              menuElement.getAttribute("data-level") || "1",
              10,
            );

            // Close this level of submenu
            actions.closeSubmenu(currentLevel);

            // Focus the parent item after closing
            if (parentItem) {
              parentItem.focus();
            }
          } else {
            actions.closeSubmenu(1);
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        if (isSubmenu) {
          // In a submenu, Escape closes just the submenu
          if (state.activeSubmenuItem) {
            // Store the reference to the parent item before closing the submenu
            const parentItem = state.activeSubmenuItem;

            // Get the current level
            const currentLevel = parseInt(
              menuElement.getAttribute("data-level") || "1",
              10,
            );

            // Close this level of submenu
            actions.closeSubmenu(currentLevel);

            // Focus the parent item after closing
            if (parentItem) {
              parentItem.focus();
            }
          } else {
            actions.closeSubmenu(1);
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
