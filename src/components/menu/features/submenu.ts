// src/components/menu/features/submenu.ts

import { createMenuTasks } from "./tasks";
import { MenuConfig, MenuItem } from "../types";

/**
 * Adds submenu functionality to the menu component
 * Manages creation, positioning, and interaction with nested submenus
 *
 * @param config - Menu configuration
 * @returns Component enhancer with submenu functionality
 */
const withSubmenu = (config: MenuConfig) => (component) => {
  if (!component.element) {
    console.warn("Cannot initialize menu submenu: missing element");
    return component;
  }

  const tasks = createMenuTasks();

  // Includes elements fading out after they leave activeSubmenus.
  const ownedElements = new Set<HTMLElement>();
  const removeSubmenu = (element: HTMLElement) => {
    component.keyboard?.removeKeyboardHandlers(element);
    element.remove();
    ownedElements.delete(element);
  };

  // Initialize submenu state
  const state = {
    activeSubmenu: null as HTMLElement,
    activeSubmenuItem: null as HTMLElement,
    submenuLevel: 0, // Track nesting level of submenus
    activeSubmenus: [] as Array<{
      element: HTMLElement;
      menuItem: HTMLElement;
      level: number;
      isOpening: boolean; // Track if submenu is in opening transition
    }>,
    submenuTimer: null,
    hoverIntent: {
      timer: null,
      activeItem: null,
    },
    component,
  };

  /**
   * Clean up hover intent timer
   */
  const clearHoverIntent = () => {
    if (state.hoverIntent.timer) {
      tasks.clearTimeout(state.hoverIntent.timer);
      state.hoverIntent.timer = null;
      state.hoverIntent.activeItem = null;
    }
  };

  /**
   * Clear submenu close timer
   */
  const clearSubmenuTimer = () => {
    if (state.submenuTimer) {
      tasks.clearTimeout(state.submenuTimer);
      state.submenuTimer = null;
    }
  };

  /**
   * Handles hover on a submenu item
   */
  const handleSubmenuHover = (
    item: MenuItem,
    index: number,
    itemElement: HTMLElement
  ): void => {
    if (!config.openSubmenuOnHover || !item.hasSubmenu) return;

    // Clear any existing timers
    clearHoverIntent();
    clearSubmenuTimer();

    // Set hover intent
    state.hoverIntent.activeItem = itemElement;
    state.hoverIntent.timer = tasks.setTimeout(() => {
      const isCurrentlyHovered = itemElement.matches(":hover");
      if (isCurrentlyHovered) {
        // Only close and reopen if this is a different submenu item
        if (state.activeSubmenuItem !== itemElement) {
          openSubmenu(item, index, itemElement);
        }
      }
      state.hoverIntent.timer = null;
    }, 100);
  };

  /**
   * Handles mouse leave from submenu
   */
  const handleSubmenuLeave = (): void => {
    // Clear hover intent
    clearHoverIntent();

    // Don't close immediately to allow moving to submenu
    clearSubmenuTimer();

    // Set a timer to close the submenu if not re-entered
    state.submenuTimer = tasks.setTimeout(() => {
      // Check if mouse is over the submenu or the parent menu item
      const submenuElement = state.activeSubmenu;
      const menuItemElement = state.activeSubmenuItem;

      if (submenuElement && menuItemElement) {
        const overSubmenu = submenuElement.matches(":hover");
        const overMenuItem = menuItemElement.matches(":hover");

        if (!overSubmenu && !overMenuItem) {
          closeSubmenu(state.submenuLevel);
        }
      }

      state.submenuTimer = null;
    }, 300);
  };

  /**
   * Handles click on a submenu item
   */
  const handleSubmenuClick = (
    item: MenuItem,
    index: number,
    itemElement: HTMLElement
  ): void => {
    if (tasks.destroyed || !item.submenu || !item.hasSubmenu) return;

    // Check if the submenu is already open
    const isOpen = itemElement.getAttribute("aria-expanded") === "true";

    // Find if any submenu is currently in opening transition
    const anySubmenuTransitioning = state.activeSubmenus.some(
      (s) => s.isOpening
    );

    // Completely ignore clicks during any submenu transition
    if (anySubmenuTransitioning) {
      return;
    }

    if (isOpen) {
      // Close submenu - only if fully open
      // Find the closest submenu level
      const currentLevel = parseInt(
        itemElement
          .closest(`.${component.getClass("menu--submenu")}`)
          ?.getAttribute("data-level") || "0",
        10
      );

      // Close this level + 1 and deeper
      closeSubmenu(currentLevel + 1);

      // Reset expanded state
      itemElement.setAttribute("aria-expanded", "false");
    } else {
      // Open new submenu
      openSubmenu(item, index, itemElement);
    }
  };

  /**
   * Handles keyboard-triggered nested submenu click
   */
  /**
   * Finds an item anywhere in the tree by its id, so a submenu's keyboard
   * handler can reach the same data the main menu's does.
   */
  /**
   * The item list to search. This feature is composed before the controller,
   * so `component.menu` is not there yet at that point; the configured items
   * are, and the live list is used once the controller has published it.
   */
  const currentItems = (): unknown[] =>
    ((component.menu?.getItems?.() as unknown[]) ?? config.items ?? []) as unknown[];

  const findItemById = (id: string): MenuItem | null => {
    const search = (list: unknown[]): MenuItem | null => {
      for (const entry of list) {
        const item = entry as MenuItem;
        if (!item || typeof item !== "object") continue;
        if (item.id === id) return item;
        if (Array.isArray(item.submenu)) {
          const found = search(item.submenu);
          if (found) return found;
        }
      }
      return null;
    };
    return search(currentItems());
  };

  const handleNestedSubmenuClick = (
    item: MenuItem,
    index: number,
    itemElement: HTMLElement
  ): void => {
    if (tasks.destroyed || !item.submenu || !item.hasSubmenu) return;

    // Check if the submenu is already open
    const isOpen = itemElement.getAttribute("aria-expanded") === "true";

    // Find if any submenu is currently in opening transition
    const anySubmenuTransitioning = state.activeSubmenus.some(
      (s) => s.isOpening
    );

    // Completely ignore clicks during any submenu transition
    if (anySubmenuTransitioning) {
      return;
    }

    if (isOpen) {
      // Find the closest submenu level
      const currentLevel = parseInt(
        itemElement
          .closest(`.${component.getClass("menu--submenu")}`)
          ?.getAttribute("data-level") || "1",
        10
      );

      // Close submenus at and deeper than the next level
      closeSubmenu(currentLevel + 1);
    } else {
      // Open the nested submenu
      openSubmenu(item, index, itemElement);
    }
  };

  /**
   * Opens a submenu with proper animation and positioning
   */
  /**
   * Marks which menu is the active one. While a submenu is open, the menu it
   * came from steps back to a smaller corner and the submenu takes a larger
   * one, which is the expressive active state the vertical menu describes
   * (m3.material.io menu specs, "States"; SegmentedMenuTokens
   * ActiveContainerShape and InactiveContainerShape).
   */
  const markActiveMenu = (active: HTMLElement | null): void => {
    const activeClass = component.getClass("menu--active");
    const inactiveClass = component.getClass("menu--inactive");
    const menus: HTMLElement[] = [
      component.element,
      ...state.activeSubmenus.map((entry) => entry.element),
    ];

    for (const menu of menus) {
      if (!menu) continue;
      const isActive = menu === active;
      menu.classList.toggle(activeClass, isActive);
      // Only the menus behind the active one step back; a menu on its own
      // keeps the shape it started with
      menu.classList.toggle(inactiveClass, active !== null && !isActive);
    }
  };

  const openSubmenu = (
    item: MenuItem,
    index: number,
    itemElement: HTMLElement
  ): void => {
    if (tasks.destroyed || !item.submenu || !item.hasSubmenu) return;

    // Get current level of the submenu we're opening
    const currentLevel = itemElement.closest(
      `.${component.getClass("menu--submenu")}`
    )
      ? parseInt(
          itemElement
            .closest(`.${component.getClass("menu--submenu")}`)
            .getAttribute("data-level") || "0",
          10
        ) + 1
      : 1;

    // Close any deeper level submenus first, preserving the current level
    closeSubmenu(currentLevel);

    // Check if this submenu is already in opening state - if so, do nothing
    const existingSubmenuIndex = state.activeSubmenus.findIndex(
      (s) => s.menuItem === itemElement && s.isOpening
    );
    if (existingSubmenuIndex >= 0) {
      return; // Already opening this submenu, don't restart the process
    }

    // Set expanded state
    itemElement.setAttribute("aria-expanded", "true");

    // Create submenu element with proper classes and attributes
    const submenuElement = document.createElement("div");
    submenuElement.className = `${component.getClass(
      "menu"
    )} ${component.getClass("menu--submenu")}`;

    // A submenu carries its parent's variant and colour, so the two match
    for (const variantClass of ["menu--vertical", "menu--vibrant", "menu--dense"]) {
      const name = component.getClass(variantClass);
      if (component.element.classList.contains(name)) {
        submenuElement.classList.add(name);
      }
    }
    submenuElement.setAttribute("role", "menu");
    submenuElement.setAttribute("tabindex", "-1");
    submenuElement.setAttribute("data-level", currentLevel.toString());
    submenuElement.setAttribute("data-parent-item", item.id);

    // Increase z-index for each level of submenu
    submenuElement.style.zIndex = `${1000 + currentLevel * 10}`;

    // Create submenu list
    const submenuList = document.createElement("ul");
    submenuList.className = `${component.getClass("menu-list")}`;

    // Create submenu items
    const submenuItems = [];

    // Use event to get menu items created properly
    component.emit("create-menu-items", {
      items: item.submenu,
      container: submenuList,
      level: currentLevel,
      onItemCreated: (itemElement) => {
        if (
          !itemElement.classList.contains(
            `${component.getClass("menu-item--disabled")}`
          )
        ) {
          submenuItems.push(itemElement);
        }
      },
    });

    submenuElement.appendChild(submenuList);

    // Add to DOM to enable measurement and transitions
    document.body.appendChild(submenuElement);
    ownedElements.add(submenuElement);

    // Position the submenu using position component
    if (component.position && component.position.positionSubmenu) {
      component.position.positionSubmenu(
        submenuElement,
        itemElement,
        currentLevel
      );
    }

    // Setup keyboard navigation if available
    if (component.keyboard && component.keyboard.setupKeyboardHandlers) {
      // The submenu's handler needs the same actions the main menu's gets.
      // It used to receive two of the five, so a right arrow inside a
      // submenu reached for `findItemById` and found nothing.
      component.keyboard.setupKeyboardHandlers(
        submenuElement,
        {
          activeSubmenus: state.activeSubmenus,
          items: currentItems(),
        },
        {
          closeSubmenu,
          handleNestedSubmenuClick,
          handleSubmenuClick,
          findItemById,
          closeMenu: (event?: Event, restoreFocus?: boolean) =>
            component.menu?.close(event, restoreFocus),
        }
      );
    }

    // Add mouseenter event to prevent closing
    submenuElement.addEventListener("mouseenter", () => {
      clearSubmenuTimer();
    });

    // Add mouseleave event to handle closing
    submenuElement.addEventListener("mouseleave", () => {
      handleSubmenuLeave();
    });

    // Update state with active submenu
    state.activeSubmenu = submenuElement;
    state.activeSubmenuItem = itemElement;

    // Add to active submenus array to maintain hierarchy
    state.activeSubmenus.push({
      element: submenuElement,
      menuItem: itemElement,
      level: currentLevel,
      isOpening: true, // Mark as in opening transition
    });

    // Update submenu level
    state.submenuLevel = currentLevel;
    markActiveMenu(submenuElement);

    // Add document events for this submenu
    document.addEventListener("click", handleDocumentClickForSubmenu);
    window.addEventListener("resize", handleWindowResizeForSubmenu, {
      passive: true,
    });
    window.addEventListener("scroll", handleWindowScrollForSubmenu, {
      passive: true,
    });

    // Make visible with animation
    tasks.requestAnimationFrame(() => {
      submenuElement.classList.add(`${component.getClass("menu--visible")}`);

      // Wait for transition to complete before marking as fully opened
      tasks.setTimeout(() => {
        // Find this submenu in the active submenus array and update its state
        const index = state.activeSubmenus.findIndex(
          (s) => s.element === submenuElement
        );
        if (index !== -1) {
          state.activeSubmenus[index].isOpening = false;
        }

        if (index === -1) return;

        // Focus the first item in the submenu if keyboard navigation is being used
        if (submenuItems.length > 0) {
          // If we're at level 2 or above, we should always focus the first item
          if (currentLevel >= 2 || document.activeElement === itemElement) {
            submenuItems[0].setAttribute("tabindex", "0");
            submenuItems[0].focus();
          }
        }
      }, 300); // Adjust to match your transition duration
    });

    // Emit event for other features to react
    component.emit("submenu-opened", {
      submenuElement,
      parentItem: itemElement,
      level: currentLevel,
      item,
    });
  };

  /**
   * Closes submenus at or deeper than the specified level
   * @param level - The level to start closing from
   */
  const closeSubmenu = (level: number): void => {
    // Clear any hover intent or submenu timers
    clearHoverIntent();
    clearSubmenuTimer();

    // Find submenus at or deeper than the specified level
    const submenuIndicesToRemove = [];

    // Identify which submenus to remove, working from deepest level first
    for (let i = state.activeSubmenus.length - 1; i >= 0; i--) {
      if (state.activeSubmenus[i].level >= level) {
        const submenuToClose = state.activeSubmenus[i];

        // Set aria-expanded attribute to false on the parent menu item
        if (submenuToClose.menuItem) {
          submenuToClose.menuItem.setAttribute("aria-expanded", "false");
        }

        // Hide with animation
        submenuToClose.element.classList.remove(
          `${component.getClass("menu--visible")}`
        );

        // Schedule for removal
        tasks.setTimeout(() => {
          removeSubmenu(submenuToClose.element);
        }, 200);

        // Mark for removal from state
        submenuIndicesToRemove.push(i);
      }
    }

    // Remove the closed submenus from state
    submenuIndicesToRemove.forEach((index) => {
      state.activeSubmenus.splice(index, 1);
    });

    // Update active submenu references based on what's left
    if (state.activeSubmenus.length > 0) {
      const deepestRemaining =
        state.activeSubmenus[state.activeSubmenus.length - 1];
      state.activeSubmenu = deepestRemaining.element;
      state.activeSubmenuItem = deepestRemaining.menuItem;
      state.submenuLevel = deepestRemaining.level;

      // If the parent menu item still has focus, keep it focused
      if (deepestRemaining.menuItem) {
        deepestRemaining.menuItem.focus();
      }
      markActiveMenu(deepestRemaining.element);
    } else {
      state.activeSubmenu = null;
      state.activeSubmenuItem = null;
      state.submenuLevel = 0;
      document.removeEventListener("click", handleDocumentClickForSubmenu);
      window.removeEventListener("resize", handleWindowResizeForSubmenu);
      window.removeEventListener("scroll", handleWindowScrollForSubmenu);
    }

    // Emit event for other features to react
    component.emit("submenu-closed", { level });
  };

  /**
   * Closes all submenus
   */
  const closeAllSubmenus = (): void => {
    // Nothing is nested any more: the menu goes back to its own shape
    markActiveMenu(null);

    // Clear timers
    clearHoverIntent();
    clearSubmenuTimer();

    document.removeEventListener("click", handleDocumentClickForSubmenu);
    window.removeEventListener("resize", handleWindowResizeForSubmenu);
    window.removeEventListener("scroll", handleWindowScrollForSubmenu);

    if (state.activeSubmenus.length === 0) return;

    // Close all active submenus
    [...state.activeSubmenus].forEach((submenu) => {
      // Remove expanded state from parent item
      if (submenu.menuItem) {
        submenu.menuItem.setAttribute("aria-expanded", "false");
      }

      // Remove submenu element with animation
      submenu.element.classList.remove(
        `${component.getClass("menu--visible")}`
      );

      // Remove after animation
      tasks.setTimeout(() => {
        removeSubmenu(submenu.element);
      }, 200);
    });

    // Clear state
    state.activeSubmenu = null;
    state.activeSubmenuItem = null;
    state.activeSubmenus = [];
    state.submenuLevel = 0;

    // Emit event for other features to react
    component.emit("all-submenus-closed", {});
  };

  /**
   * Handles document click for submenu
   */
  const handleDocumentClickForSubmenu = (e: MouseEvent): void => {
    if (!state.activeSubmenu) return;

    const submenuElement = state.activeSubmenu;
    const menuItemElement = state.activeSubmenuItem;

    // Check if click was inside submenu or parent menu item
    if (
      submenuElement.contains(e.target as Node) ||
      (menuItemElement && menuItemElement.contains(e.target as Node))
    ) {
      return;
    }

    // Close submenu if clicked outside
    closeAllSubmenus();
  };

  /**
   * Handles window resize for submenu
   */
  const handleWindowResizeForSubmenu = (): void => {
    // Reposition open submenu on resize
    if (state.activeSubmenu && state.activeSubmenuItem && component.position) {
      component.position.positionSubmenu(
        state.activeSubmenu,
        state.activeSubmenuItem,
        state.submenuLevel
      );
    }
  };

  /**
   * Handles window scroll for submenu
   */
  const handleWindowScrollForSubmenu = (): void => {
    // Use requestAnimationFrame to optimize scroll performance
    tasks.requestAnimationFrame(() => {
      // Only reposition if we have an active submenu
      if (
        state.activeSubmenu &&
        state.activeSubmenuItem &&
        component.position
      ) {
        component.position.positionSubmenu(
          state.activeSubmenu,
          state.activeSubmenuItem,
          state.submenuLevel
        );
      }
    });
  };

  /**
   * Checks if any submenu is currently open
   */
  const hasOpenSubmenu = (): boolean => {
    return state.activeSubmenus.length > 0;
  };

  /**
   * Gets current submenu nesting level
   */
  const getSubmenuLevel = (): number => {
    return state.submenuLevel;
  };

  /**
   * Gets currently active submenu elements
   */
  const getActiveSubmenus = (): Array<{
    element: HTMLElement;
    menuItem: HTMLElement;
    level: number;
    isOpening: boolean;
  }> => {
    return [...state.activeSubmenus];
  };

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      if (tasks.destroyed) return;
      tasks.destroy();
      // Clean up timers
      clearHoverIntent();
      clearSubmenuTimer();

      // Clean up submenu event listeners
      document.removeEventListener("click", handleDocumentClickForSubmenu);
      window.removeEventListener("resize", handleWindowResizeForSubmenu);
      window.removeEventListener("scroll", handleWindowScrollForSubmenu);

      // Clean up submenu elements
      state.activeSubmenus.forEach((submenu) => {
        submenu.menuItem?.setAttribute("aria-expanded", "false");
      });
      ownedElements.forEach(removeSubmenu);
      state.activeSubmenus = [];
      state.activeSubmenu = null;
      state.activeSubmenuItem = null;
      state.submenuLevel = 0;
      originalDestroy.call(component.lifecycle);
    };
  }

  // Listen for menu close event to also close submenus
  component.on("menu-closing", () => {
    closeAllSubmenus();
  });

  // Return enhanced component
  return {
    ...component,
    submenu: {
      openSubmenu,
      closeSubmenu,
      closeAllSubmenus,
      handleSubmenuClick,
      handleNestedSubmenuClick,
      handleSubmenuHover,
      handleSubmenuLeave,
      hasOpenSubmenu,
      getSubmenuLevel,
      getActiveSubmenus,
    },
  };
};

export default withSubmenu;
