// src/components/menu/features/controller.ts

import { createMenuTasks } from "./tasks";
import {
  MenuConfig,
  MenuItem,
  MenuDivider,
  MenuContent,
  MenuControllerApi,
  MenuFeatureHost,
  MenuPosition,
} from "../types";
import { menuOpened, menuClosed } from "./registry";

import { setHTML } from "../../../core/dom/html";
/**
 * Adds controller functionality to the menu component
 * Manages state, rendering, positioning, and event handling
 *
 * @param config - Menu configuration
 * @returns Component enhancer with menu controller functionality
 */
const withController =
  (config: MenuConfig) =>
  // Generic, so the accumulated pipeline type survives (see #109).
  <C extends MenuFeatureHost>(component: C): C & { menu: MenuControllerApi } => {
  // There used to be a `if (!component.element)` guard here, warning and
  // returning the component untouched. withElement runs before this in the
  // only pipe that calls it, so it could not fire -- and it made the return
  // type a union of enhanced and not, which collapsed to C and erased this
  // feature from the pipeline type. The host type requires the element.
  const tasks = createMenuTasks();

  // As the listbox of a combobox, options need ids the combobox can point at
  // with aria-activedescendant, and nothing inside may take focus from it
  const listbox = config.listbox === true;
  const optionIdPrefix = `${component.getClass("menu")}-${Math.random().toString(36).slice(2, 9)}`;
  if (listbox) {
    // Pressing an option would otherwise move focus off the combobox
    component.element.addEventListener("mousedown", (e: MouseEvent) => e.preventDefault());
  }

  // Initialize state
  const state = {
    visible: config.visible || false,
    items: config.items || [],
    position: config.position,
    selectedItemId: null as string | null,
    activeItemIndex: -1,
    component,
  };

  // Create event helpers
  const eventHelpers = {
    // Generic over the payload, so a caller's data is part of the returned
    // type. Declared as a plain Record it was erased, and the callers had to
    // cast their own data back in.
    triggerEvent<TData extends Record<string, unknown>>(
      eventName: string,
      data: TData = {} as TData,
      originalEvent?: Event,
    ) {
      const eventData = {
        menu: state.component,
        ...data,
        originalEvent,
        preventDefault: () => {
          eventData.defaultPrevented = true;
        },
        defaultPrevented: false,
      };

      component.emit(eventName, eventData);
      return eventData;
    },
  };

  /**
   * Gets the opener element from config
   */
  const getOpenerElement = (): HTMLElement | null => {
    // First try to get the resolved opener from the opener feature
    if (component.opener && typeof component.opener.getOpener === "function") {
      return component.opener.getOpener();
    }

    // Fall back to config opener for initial positioning
    const { opener } = config;

    if (typeof opener === "string") {
      const element = document.querySelector(opener);
      if (!element) {
        console.warn(`Menu opener not found: ${opener}`);
        return null;
      }
      return element as HTMLElement;
    }

    // Handle component with element property
    if (typeof opener === "object" && opener !== null && "element" in opener) {
      return opener.element;
    }

    // Handle direct HTML element
    return opener as HTMLElement;
  };

  /**
   * Creates a DOM element for a menu item
   */
  const createMenuItem = (item: MenuItem, index: number): HTMLElement => {
    const itemElement = document.createElement("li");
    const itemClass = `${component.getClass("menu__item")}`;

    itemElement.className = itemClass;
    if (listbox) {
      itemElement.setAttribute("role", "option");
      itemElement.id = `${optionIdPrefix}-option-${index}`;
    } else {
      itemElement.setAttribute("role", "menuitem");
      itemElement.setAttribute("tabindex", "-1"); // Set to -1 by default, will update when needed
    }
    itemElement.setAttribute("data-id", item.id);
    itemElement.setAttribute("data-index", index.toString());

    if (item.disabled) {
      itemElement.classList.add(`${itemClass}--disabled`);
      itemElement.setAttribute("aria-disabled", "true");
    } else {
      itemElement.setAttribute("aria-disabled", "false");
    }

    if (state.selectedItemId && item.id === state.selectedItemId) {
      itemElement.classList.add(`${itemClass}--selected`);
      itemElement.setAttribute("aria-selected", "true");
    } else {
      itemElement.setAttribute("aria-selected", "false");
    }

    if (item.hasSubmenu) {
      itemElement.classList.add(`${itemClass}--submenu`);
      itemElement.setAttribute("aria-haspopup", "true");
      itemElement.setAttribute("aria-expanded", "false");
    }

    // Create content container for flexible layout
    const contentContainer = document.createElement("span");
    contentContainer.className = `${component.getClass("menu__item-content")}`;

    // Add icon if provided
    if (item.icon) {
      const iconElement = document.createElement("span");
      iconElement.className = `${component.getClass("menu__item-icon")}`;
      setHTML(iconElement, item.icon);
      contentContainer.appendChild(iconElement);
    }

    // Add text
    const textElement = document.createElement("span");
    textElement.className = `${component.getClass("menu__item-text")}`;
    textElement.textContent = item.text;

    if (item.supportingText) {
      // A label and a line under it: the two stack, so they go in their own
      // box rather than beside the icon and the trailing text
      const labelElement = document.createElement("span");
      labelElement.className = `${component.getClass("menu__item-label")}`;
      const supportingElement = document.createElement("span");
      supportingElement.className = `${component.getClass(
        "menu__item-supporting",
      )}`;
      supportingElement.textContent = item.supportingText;
      labelElement.appendChild(textElement);
      labelElement.appendChild(supportingElement);
      contentContainer.appendChild(labelElement);
    } else {
      contentContainer.appendChild(textElement);
    }

    // Add shortcut if provided
    if (item.shortcut) {
      const shortcutElement = document.createElement("span");
      shortcutElement.className = `${component.getClass("menu__item-shortcut")}`;
      shortcutElement.textContent = item.shortcut;
      contentContainer.appendChild(shortcutElement);
    }

    itemElement.appendChild(contentContainer);

    // Add event listeners
    if (!item.disabled) {
      // Mouse events
      itemElement.addEventListener("click", (e) =>
        handleItemClick(e, item, index),
      );

      // Additional keyboard event handler for accessibility
      itemElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleItemClick(e, item, index);
        }
      });

      // Focus handling
      itemElement.addEventListener("focus", () => {
        state.activeItemIndex = index;
      });

      if (item.hasSubmenu && config.openSubmenuOnHover) {
        // Use submenu feature for hover handling
        itemElement.addEventListener("mouseenter", () => {
          if (component.submenu) {
            component.submenu.handleSubmenuHover(item, index, itemElement);
          }
        });

        // handleSubmenuLeave takes no parameters -- the event was being
        // passed and silently discarded.
        itemElement.addEventListener("mouseleave", () => {
          if (component.submenu) {
            component.submenu.handleSubmenuLeave();
          }
        });
      }
    }

    return itemElement;
  };

  /**
   * Creates a DOM element for a menu divider
   */
  const createDivider = (divider: MenuDivider, index: number): HTMLElement => {
    const dividerElement = document.createElement("li");
    dividerElement.className = `${component.getClass("menu__divider")}`;
    dividerElement.setAttribute("role", "separator");
    dividerElement.setAttribute("data-index", index.toString());

    if (divider.id) {
      dividerElement.setAttribute("id", divider.id);
    }

    return dividerElement;
  };

  /**
   * Renders the menu items
   */
  const renderMenuItems = (): void => {
    const menuList = document.createElement("ul");
    menuList.className = `${component.getClass("menu__list")}`;
    menuList.setAttribute("role", listbox ? "listbox" : "menu");
    if (listbox) menuList.id = `${optionIdPrefix}-listbox`;

    // A gap separates groups rather than drawing a line across one surface, so
    // the items on either side of it go into their own list. Everything else
    // stays a flat list, which is what the standard menu has always been.
    // Groups are presentational: the items inside keep their menuitem role and
    // their index into state.items, so focus order and item lookup are
    // untouched by the nesting.
    let target: HTMLElement = menuList;

    const startGroup = (): void => {
      const group = document.createElement("li");
      group.className = `${component.getClass("menu__group")}`;
      group.setAttribute("role", "none");

      const list = document.createElement("ul");
      list.setAttribute("role", "none");
      group.appendChild(list);
      menuList.appendChild(group);
      target = list;
    };

    const hasGaps = state.items.some(
      (item) => "type" in item && item.type === "gap",
    );
    if (hasGaps) startGroup();

    state.items.forEach((item, index) => {
      if ("type" in item && item.type === "gap") {
        // The space between groups is the group's own margin, so the gap
        // itself needs no element
        startGroup();
      } else if ("type" in item && item.type === "divider") {
        target.appendChild(createDivider(item, index));
      } else {
        target.appendChild(createMenuItem(item as MenuItem, index));
      }
    });

    // Clear and append
    component.element.replaceChildren();
    component.element.appendChild(menuList);
  };

  /**
   * Find a menu item by its ID in the items array
   */
  const findItemById = (id: string): MenuItem | null => {
    // Search in top-level items
    for (const item of state.items) {
      if ("id" in item && item.id === id) {
        return item as MenuItem;
      }

      // Search in submenu items
      if ("submenu" in item && Array.isArray((item as MenuItem).submenu)) {
        for (const subItem of (item as MenuItem).submenu ?? []) {
          if ("id" in subItem && subItem.id === id) {
            return subItem as MenuItem;
          }
        }
      }
    }

    return null;
  };

  /**
   * Handles click on a menu item
   */
  const handleItemClick = (
    e: MouseEvent | KeyboardEvent,
    item: MenuItem,
    index: number,
  ): void => {
    e.preventDefault();
    e.stopPropagation();

    // Don't process if disabled
    if (item.disabled) return;

    if (item.hasSubmenu && component.submenu) {
      // Delegate to submenu feature
      component.submenu.handleSubmenuClick(
        item,
        index,
        e.currentTarget as HTMLElement,
      );
      return;
    }

    // Trigger select event
    const selectEvent = eventHelpers.triggerEvent(
      "select",
      {
        item,
        itemId: item.id,
        itemData: item.data,
      },
      e,
    );
    // No cast to MenuSelectEvent: that type declares `menu: MenuComponent`,
    // and part-way through the pipe this component is not one yet. The cast
    // was asserting past that. Only defaultPrevented is read here, and the
    // inferred type has it.

    // Close menu if needed
    if (config.closeOnSelect && !selectEvent.defaultPrevented) {
      closeMenu(e, true);
    }
  };

  /**
   * Updates the selected state of menu items
   * @param itemId - The ID of the item to mark as selected, or null to clear selection
   */
  const updateSelectedState = (itemId: string | null): void => {
    if (!component.element) return;

    // Get all menu items
    const menuItems = component.element.querySelectorAll(
      `.${component.getClass("menu__item")}`,
    ) as NodeListOf<HTMLElement>;

    // Update selected state for each item
    menuItems.forEach((item) => {
      const currentItemId = item.getAttribute("data-id");

      if (currentItemId === itemId) {
        item.classList.add(`${component.getClass("menu__item--selected")}`);
        item.setAttribute("aria-selected", "true");
      } else {
        item.classList.remove(`${component.getClass("menu__item--selected")}`);
        item.setAttribute("aria-selected", "false");
      }
    });

    // Also update state
    state.selectedItemId = itemId;
  };

  // What the registry closes when another menu opens. Focus is not restored to
  // this opener: the pointer or the key has already moved to the new one.
  const registryEntry = {
    close: (event?: Event) => closeMenu(event, false),
  };

  /**
   * Opens the menu
   * @param {Event} [event] - Optional event that triggered the open
   * @param {'mouse'|'keyboard'} [interactionType='mouse'] - Type of interaction that triggered the open
   */
  const openMenu = (
    event?: Event,
    interactionType?: "mouse" | "keyboard",
  ): void => {
    if (tasks.destroyed || state.visible) return;

    // Work out how the menu was opened when the caller does not say. It
    // decides where focus lands, and `toggle` already read the event this
    // way, so opening with a key through `open` behaved like a mouse.
    if (!interactionType) {
      if (event instanceof KeyboardEvent) interactionType = "keyboard";
      else interactionType = "mouse";
    }

    // A menu button's menu is dismissed when interaction moves outside it, so
    // only one is open at a time. This closes whichever was open, whether it
    // was opened by pointer, by key or by code.
    menuOpened(registryEntry, event);

    // Update state
    state.visible = true;

    // First, remove any existing document click listener
    document.removeEventListener("click", handleDocumentClick);

    // Step 1: Add the menu to the DOM if it's not already there with initial hidden state
    if (!component.element.parentNode) {
      // Apply explicit initial styling to ensure it doesn't flash
      component.element.classList.remove(
        `${component.getClass("menu--visible")}`,
      );
      component.element.setAttribute("aria-hidden", "true");
      component.element.style.transform = "scaleY(0)";
      component.element.style.opacity = "0";

      // Add to DOM - use container if provided, otherwise use document.body
      const container = config.container || document.body;
      container.appendChild(component.element);
    }

    // Step 2: Use a small delay to ensure DOM operations are complete
    tasks.setTimeout(() => {
      // Position the menu now that it's in the DOM
      const openerElement = getOpenerElement();
      if (openerElement && component.position) {
        component.position.positionMenu(openerElement);
      }

      // Set attributes for accessibility
      component.element.setAttribute("aria-hidden", "false");

      // Remove the inline styles we added
      component.element.style.transform = "";
      component.element.style.opacity = "";

      // Force a reflow before adding the visible class
      void component.element.getBoundingClientRect();

      // Add visible class to start the CSS transition
      component.element.classList.add(`${component.getClass("menu--visible")}`);

      // Step 4: Set up initial focus based on interaction type. A listbox
      // leaves focus on its combobox.
      if (!listbox) tasks.setTimeout(() => {
        if (component.keyboard && component.keyboard.handleInitialFocus) {
          component.keyboard.handleInitialFocus(
            component.element,
            interactionType,
          );
        } else {
          // Fallback when the keyboard feature is not composed in: the first
          // item is the way in for the Tab order; a menu opened with a key
          // focuses it, one opened with a pointer focuses the menu itself so
          // the first arrow press lands on the first item
          const items = Array.from(
            component.element.querySelectorAll(
              `.${component.getClass("menu__item")}`,
            ),
          ) as HTMLElement[];

          items.forEach((item) => {
            item.tabIndex = -1;
          });
          if (items.length > 0) items[0].tabIndex = 0;

          if (interactionType === "keyboard" && items.length > 0) {
            items[0].focus();
          } else {
            component.element.tabIndex = -1;
            component.element.focus();
          }
        }
      }, 100);

      // Add the document click handler on the next event loop
      // after the current click is fully processed
      tasks.setTimeout(() => {
        if (config.closeOnClickOutside && state.visible) {
          document.addEventListener("click", handleDocumentClick);
        }

        // Add other document events normally. A listbox's combobox handles
        // every key, Escape included.
        if (config.closeOnEscape && !listbox) {
          document.addEventListener("keydown", handleDocumentKeydown);
        }
        window.addEventListener("resize", handleWindowResize, {
          passive: true,
        });
        window.addEventListener("scroll", handleWindowScroll, {
          passive: true,
        });
      }, 0);
    }, 20); // Short delay for browser to process

    // Trigger event
    eventHelpers.triggerEvent("open", {}, event);
  };

  /**
   * Closes the menu
   * @param {Event} [event] - Optional event that triggered the close
   * @param {boolean} [restoreFocus=true] - Whether to restore focus to the opener element
   */
  const closeMenu = (event?: Event, restoreFocus: boolean = true): void => {
    if (!state.visible) return;

    menuClosed(registryEntry);

    // Emit pre-close event for other features to react
    component.emit("menu-closing", { event, restoreFocus });

    // Close any open submenu first using the submenu feature
    if (component.submenu) {
      component.submenu.closeAllSubmenus();
    }

    tasks.setTimeout(() => {
      // Update state
      state.visible = false;

      // Set attributes
      component.element.setAttribute("aria-hidden", "true");
      component.element.classList.remove(
        `${component.getClass("menu--visible")}`,
      );

      // Remove document events
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("scroll", handleWindowScroll);

      // Trigger event
      eventHelpers.triggerEvent(
        "close",
        {
          restoreFocus: restoreFocus,
        },
        event,
      );

      // Remove from DOM after animation completes
      tasks.setTimeout(() => {
        if (component.element.parentNode && !state.visible) {
          component.element.parentNode.removeChild(component.element);
        }
      }, 300); // Match the animation duration in CSS
    }, 50);
  };

  /**
   * Toggles the menu
   */
  const toggleMenu = (
    event?: Event,
    interactionType?: "mouse" | "keyboard",
  ): void => {
    if (state.visible) {
      closeMenu(event);
    } else {
      // Determine interaction type from event
      if (event) {
        if (event instanceof KeyboardEvent) {
          interactionType = "keyboard";
        } else if (event instanceof MouseEvent) {
          interactionType = "mouse";
        }
      }
      openMenu(event, interactionType);
    }
  };

  /**
   * Handles document click
   */
  const handleDocumentClick = (e: MouseEvent): void => {
    // Don't close if clicked inside menu
    if (component.element.contains(e.target as Node)) {
      return;
    }

    // Check if clicked on opener element
    const opener = getOpenerElement();
    if (opener && opener.contains(e.target as Node)) {
      return;
    }

    // Don't close if clicked inside a submenu
    if (component.submenu && component.submenu.hasOpenSubmenu()) {
      const activeSubmenus = component.submenu.getActiveSubmenus();
      for (const submenu of activeSubmenus) {
        if (submenu.element.contains(e.target as Node)) {
          return;
        }
      }
    }

    // Close menu
    closeMenu(e, false);
  };

  /**
   * Handles document keydown
   */
  const handleDocumentKeydown = (e: KeyboardEvent): void => {
    // Check if the event target is already inside the menu or submenu
    const isTargetInsideMenu = component.element.contains(e.target as Node);
    const isTargetInsideSubmenu =
      component.submenu &&
      component.submenu.hasOpenSubmenu() &&
      component.submenu
        .getActiveSubmenus()
        .some((s) => s.element.contains(e.target as Node));

    // If the event target is inside the menu/submenu, the dedicated menu keydown handler
    // will already process it, so we only need to handle Escape here
    if (state.visible) {
      if (isTargetInsideMenu) {
        // The menu has its own keydown handler, so only Escape is left here
        if (e.key === "Escape") {
          e.preventDefault();
          closeMenu(e, true);
        }
      } else if (isTargetInsideSubmenu) {
        // A submenu has no handler of its own: its keys arrive here, and the
        // handler works out which menu they belong to from the event target.
        // This branch used to stop at Escape, so an arrow inside a submenu
        // fell through to the main menu and moved focus there.
        if (component.keyboard && component.keyboard.handleMenuKeydown) {
          component.keyboard.handleMenuKeydown(e, state, {
            closeMenu,
            closeSubmenu: component.submenu?.closeSubmenu,
            findItemById,
            handleSubmenuClick: component.submenu?.handleSubmenuClick,
            handleNestedSubmenuClick: component.submenu?.handleNestedSubmenuClick,
          });
        } else if (e.key === "Escape") {
          e.preventDefault();
          closeMenu(e, true);
        }
      } else {
        // If target is outside menu, but menu is open, handle all keyboard navigation
        if (component.keyboard && component.keyboard.handleMenuKeydown) {
          component.keyboard.handleMenuKeydown(e, state, {
            closeMenu,
            closeSubmenu: component.submenu?.closeSubmenu,
            findItemById,
            handleSubmenuClick: component.submenu?.handleSubmenuClick,
            handleNestedSubmenuClick: component.submenu?.handleNestedSubmenuClick,
          });
        }
      }
    }
  };

  /**
   * Handles window resize
   */
  const handleWindowResize = (): void => {
    if (state.visible) {
      if (config.closeOnResize) {
        // Close menu on resize (better UX for select components)
        closeMenu(undefined, true);
      } else {
        // Reposition menu on resize (default behavior)
        const openerElement = getOpenerElement();
        if (openerElement && component.position) {
          component.position.positionMenu(openerElement);
        }
      }
    }
  };

  /**
   * Handles window scroll
   */
  const handleWindowScroll = (): void => {
    if (state.visible) {
      // Use requestAnimationFrame to optimize scroll performance
      tasks.requestAnimationFrame(() => {
        // Reposition the main menu to stay attached to opener when scrolling
        const openerElement = getOpenerElement();
        if (openerElement && component.position) {
          component.position.positionMenu(openerElement);
        }
      });
    }
  };

  /**
   * Sets up the menu
   */
  const initMenu = () => {
    // Set up menu structure
    renderMenuItems();

    // Set up keyboard navigation if available. A listbox's options never take
    // focus, so they get no tab stops and no handlers: the combobox owns the keys.
    if (!listbox && component.keyboard && component.keyboard.setupKeyboardHandlers) {
      component.keyboard.setupKeyboardHandlers(component.element, state, {
        closeMenu,
        closeSubmenu: component.submenu?.closeSubmenu,
        findItemById,
        handleSubmenuClick: component.submenu?.handleSubmenuClick,
        handleNestedSubmenuClick: component.submenu?.handleNestedSubmenuClick,
      });
    }

    // Position if visible
    if (state.visible) {
      const openerElement = getOpenerElement();
      if (openerElement && component.position) {
        component.position.positionMenu(openerElement);
      }

      // Show immediately
      component.element.classList.add(`${component.getClass("menu--visible")}`);

      // Set up document events
      if (config.closeOnClickOutside) {
        document.addEventListener("click", handleDocumentClick);
      }
      if (config.closeOnEscape && !listbox) {
        document.addEventListener("keydown", handleDocumentKeydown);
      }
      window.addEventListener("resize", handleWindowResize);
      window.addEventListener("scroll", handleWindowScroll);
    }
  };

  // Handle create-menu-items events for submenu feature
  component.on(
    "create-menu-items",
    // The payload submenu.ts emits: a submenu's items, where to put them, and
    // a callback taking just the created element.
    (event: {
      items: MenuContent[];
      container: HTMLElement;
      level?: number;
      onItemCreated?: (element: HTMLElement) => void;
    }) => {
    const { items, container, onItemCreated } = event;

    items.forEach((item, index) => {
      let element;
      if ("type" in item && item.type === "gap") {
        // Submenus are a single surface; a gap there is spacing
        element = document.createElement("li");
        element.className = `${component.getClass("menu__gap")}`;
        element.setAttribute("role", "none");
      } else if ("type" in item && item.type === "divider") {
        element = createDivider(item, index);
      } else {
        element = createMenuItem(item as MenuItem, index);
      }
      container.appendChild(element);
      if (onItemCreated) {
        onItemCreated(element);
      }
    });
  });

  // Initialize after DOM is ready
  tasks.setTimeout(initMenu, 0);

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      if (tasks.destroyed) return;
      tasks.destroy();
      state.visible = false;
      // A menu destroyed while open must not stay the registered one
      menuClosed(registryEntry);

      // Clean up document events
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("scroll", handleWindowScroll);

      originalDestroy.call(component.lifecycle);
    };
  }

  // Return enhanced component
  return {
    ...component,
    menu: {
      open: (event?: Event, interactionType?: "mouse" | "keyboard") => {
        // Left undefined so openMenu can read the event; defaulting here fed
        // it "mouse" whatever opened the menu
        openMenu(event, interactionType);
        return component;
      },

      close: (event?: Event, restoreFocus = true) => {
        closeMenu(event, restoreFocus);
        return component;
      },

      toggle: (event?: Event, interactionType?: "mouse" | "keyboard") => {
        toggleMenu(event, interactionType);
        return component;
      },

      isOpen: () => state.visible,

      setItems: (items: MenuContent[]) => {
        state.items = items;
        renderMenuItems();
        return component;
      },

      getItems: () => state.items,

      setPosition: (position: MenuPosition) => {
        state.position = position;
        if (state.visible) {
          const openerElement = getOpenerElement();
          if (openerElement && component.position) {
            component.position.positionMenu(openerElement);
          }
        }
        return component;
      },

      getPosition: () => state.position,

      setSelected: (itemId: string | null) => {
        updateSelectedState(itemId);
        return component;
      },

      getSelected: () => state.selectedItemId,
    },
  };
};

export default withController;
