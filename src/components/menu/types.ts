// src/components/menu/types.ts
import type { EventCallback } from "../../core/state/emitter";

/**
 * Menu position options
 * Controls where the menu will appear relative to its opener element
 *
 * @category Components
 */
export const MENU_POSITION = {
  /** Places menu below the opener, aligned to left edge */
  BOTTOM_START: "bottom-start",
  /** Places menu below the opener, centered */
  BOTTOM: "bottom",
  /** Places menu below the opener, aligned to right edge */
  BOTTOM_END: "bottom-end",
  /** Places menu above the opener, aligned to left edge */
  TOP_START: "top-start",
  /** Places menu above the opener, centered */
  TOP: "top",
  /** Places menu above the opener, aligned to right edge */
  TOP_END: "top-end",
  /** Places menu to the right of the opener, aligned to top edge */
  RIGHT_START: "right-start",
  /** Places menu to the right of the opener, centered */
  RIGHT: "right",
  /** Places menu to the right of the opener, aligned to bottom edge */
  RIGHT_END: "right-end",
  /** Places menu to the left of the opener, aligned to top edge */
  LEFT_START: "left-start",
  /** Places menu to the left of the opener, centered */
  LEFT: "left",
  /** Places menu to the left of the opener, aligned to bottom edge */
  LEFT_END: "left-end",
} as const;

/**
 * Position options for the menu
 *
 * @category Components
 */
export type MenuPosition = (typeof MENU_POSITION)[keyof typeof MENU_POSITION];

/**
 * Configuration interface for a menu item
 *
 * @category Components
 */
export interface MenuItem<TData = unknown> {
  /**
   * Unique ID for the menu item
   * Required for accessibility and event handling
   */
  id: string;

  /**
   * Display text for the menu item
   */
  text: string;

  /**
   * Optional icon to display before the text
   * Accepts HTML string (typically SVG)
   */
  icon?: string;

  /**
   * Optional keyboard shortcut hint to display
   * Shown at the end of the menu item
   */
  shortcut?: string;

  /**
   * A second line under the label, for a short explanation of the item
   * (vertical menus only)
   */
  supportingText?: string;

  /**
   * Whether the menu item is disabled
   * Disabled items cannot be clicked but remain visible
   */
  disabled?: boolean;

  /**
   * Whether this item has a submenu
   * If true, the item will show an indicator and can open a nested menu
   */
  hasSubmenu?: boolean;

  /**
   * Optional array of submenu items
   * Only used when hasSubmenu is true
   */
  submenu?: MenuItem<TData>[];

  /**
   * Additional data to associate with the menu item
   * This can be used for custom behavior in click handlers
   */
  data?: TData;
}

/**
 * Menu item type for dividers
 *
 * @category Components
 */
export interface MenuDivider {
  /**
   * Type must be 'divider' to differentiate from regular menu items
   */
  type: "divider";

  /**
   * Optional ID for the divider (for accessibility)
   */
  id?: string;
}

/**
 * Menu item type for a gap between groups.
 *
 * The M3 expressive vertical menu separates groups two ways: a divider line,
 * or a gap. A gap splits the menu into separate surfaces, each with its own
 * rounded container, rather than drawing a line across one surface
 * (m3.material.io/components/menus, vertical menus).
 *
 * A standard menu is a single surface, so a gap there is simply space.
 *
 * @category Components
 */
export interface MenuGap {
  /**
   * Type must be 'gap' to differentiate from regular menu items
   */
  type: "gap";

  /**
   * Optional ID for the gap (for accessibility)
   */
  id?: string;
}

/**
 * Combined type for menu content items (regular items, dividers or gaps)
 *
 * @category Components
 */
export type MenuContent<TData = unknown> = MenuItem<TData> | MenuDivider | MenuGap;

/**
 * Configuration interface for the Menu component
 *
 * @category Components
 */
/** Menu variants */
export type MenuVariant = "baseline" | "vertical";

/** Colour mappings for the vertical menu */
export type MenuColor = "standard" | "vibrant";

export interface MenuConfig {
  /**
   * Element to which the menu will be openered
   * Can be an HTML element, a CSS selector string, or a component with an element property
   */
  opener: HTMLElement | string | { element: HTMLElement };

  /**
   * Array of menu items and dividers to display
   */
  items: MenuContent[];

  /**
   * Menu variant. `'vertical'` is the M3 expressive menu: a rounded
   * container holding items that sit apart and change shape as they are
   * hovered, focused, pressed or selected.
   * @default 'baseline'
   */
  variant?: MenuVariant;

  /**
   * Colour mapping for the vertical variant. `'vibrant'` is tertiary-based
   * and more prominent, so it should be used sparingly.
   */
  color?: MenuColor;

  /**
   * Position of the menu relative to the opener
   * @default 'bottom-start'
   */
  position?: MenuPosition;

  /**
   * Whether the menu should close when an item is clicked
   * @default true
   */
  closeOnSelect?: boolean;

  /**
   * Whether the menu should close when the user clicks outside
   * @default true
   */
  closeOnClickOutside?: boolean;

  /**
   * Whether the menu should close when the escape key is pressed
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Whether the menu should close when the window is resized
   * @default false
   */
  closeOnResize?: boolean;

  /**
   * Whether submenus should open on hover
   * @default true
   */
  openSubmenuOnHover?: boolean;

  /**
   * Optional width for the menu (in CSS units)
   * If not provided, menu will size to its content
   */
  width?: string;

  /**
   * Optional maximum height for the menu (in CSS units)
   * If content exceeds this height, the menu will scroll
   */
  maxHeight?: string;

  /**
   * Optional offset from the opener (in pixels)
   * @default 0
   */
  offset?: number;

  /**
   * Whether the menu should automatically flip position to stay in viewport
   * @default true
   */
  autoFlip?: boolean;

  /**
   * Whether the menu is initially visible
   * @default false
   */
  visible?: boolean;

  /**
   * Container element to append the menu to
   * If not provided, menu will be appended to document.body
   * Use this when the menu needs to stay within a specific container (e.g., inside a dialog)
   */
  container?: HTMLElement | null;

  /**
   * When true, the opener is used only for positioning.
   * No click, blur, or keyboard handlers are attached to the opener element.
   * The consumer is responsible for calling open() / close() manually.
   * @default false
   */
  manualOpen?: boolean;

  /**
   * Renders the menu as the listbox popup of a combobox (WAI-ARIA select-only
   * combobox): the list is `role="listbox"` and each item `role="option"` with
   * its own id, focus stays with the combobox, which owns the keyboard and
   * points at the active option with `aria-activedescendant`, and the opener
   * gets no ARIA from the menu. Pair it with `manualOpen`.
   * @default false
   */
  listbox?: boolean;

  /**
   * When true, renders a compact menu with smaller items and tighter spacing.
   * Useful in dense UIs like toolbars and action bars where the standard
   * 48px item height is too large.
   * @default false
   */
  dense?: boolean;

  /**
   * Additional CSS classes to add to the menu
   */
  class?: string;

  /**
   * Component prefix for CSS class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name used in CSS class generation
   * @default 'menu'
   */
  componentName?: string;

  /**
   * Event handlers for the menu
   */
  on?: {
    /**
     * Called when the menu is opened
     */
    open?: (event: MenuEvent) => void;

    /**
     * Called when the menu is closed
     */
    close?: (event: MenuEvent) => void;

    /**
     * Called when a menu item is selected
     */
    select?: (event: MenuSelectEvent) => void;
  };
}

/**
 * Menu event interface
 *
 * @category Components
 */
export interface MenuEvent {
  /** The menu component that triggered the event */
  menu: MenuComponent;

  /** Original DOM event if available */
  originalEvent?: Event;

  /** Function to prevent default behavior */
  preventDefault: () => void;

  /** Whether default behavior was prevented */
  defaultPrevented: boolean;
}

/**
 * Menu selection event interface
 *
 * @category Components
 */
export interface MenuSelectEvent<TData = unknown> extends MenuEvent {
  /** The selected menu item */
  item: MenuItem<TData>;

  /** ID of the selected menu item */
  itemId: string;

  /** Data associated with the menu item (if any) */
  itemData?: TData;
}

/**
 * Menu component interface
 *
 * @category Components
 */
export interface MenuComponent {
  /** The menu's root DOM element */
  element: HTMLElement;

  /**
   * Opens the menu
   * @param event - Optional event that triggered the open
   * @param interactionType - The type of interaction that triggered the open ('mouse' or 'keyboard')
   * @returns The menu component for chaining
   */
  open: (
    event?: Event,
    interactionType?: "mouse" | "keyboard",
  ) => MenuComponent;

  /**
   * Closes the menu
   * @param event - Optional event that triggered the close
   * @param restoreFocus - Whether focus returns to the opener (default true)
   * @param skipAnimation - Whether to close without the exit animation
   * @returns The menu component for chaining
   */
  close: (event?: Event, restoreFocus?: boolean, skipAnimation?: boolean) => MenuComponent;

  /**
   * Toggles the menu's open state
   * @param event - Optional event that triggered the toggle
   * @returns The menu component for chaining
   */
  toggle: (event?: Event) => MenuComponent;

  /**
   * Checks if the menu is currently open
   * @returns True if the menu is open
   */
  isOpen: () => boolean;

  /**
   * Updates the menu items
   * @param items - New array of menu items and dividers
   * @returns The menu component for chaining
   */
  setItems: (items: MenuContent[]) => MenuComponent;

  /**
   * Gets the current menu items
   * @returns Array of current menu items and dividers
   */
  getItems: () => MenuContent[];

  /**
   * Updates the menu's opener element
   * @param opener - New opener element or selector
   * @returns The menu component for chaining
   */
  setOpener: (opener: HTMLElement | string) => MenuComponent;

  /**
   * Gets the current opener element
   * @returns Current opener element
   */
  getOpener: () => HTMLElement;

  /**
   * Updates the menu's position
   * @param position - New position value
   * @returns The menu component for chaining
   */
  setPosition: (position: MenuPosition) => MenuComponent;

  /**
   * Gets the current menu position
   * @returns Current position
   */
  getPosition: () => MenuPosition;

  /**
   * Sets the selected menu item
   * @param itemId - ID of the menu item to mark as selected
   * @returns The menu component for chaining
   */
  setSelected: (itemId: string | null) => MenuComponent;

  /**
   * Gets the currently selected menu item's ID
   * @returns ID of the selected menu item or null if none is selected
   */
  getSelected: () => string | null;

  /**
   * Adds an event listener to the menu
   * @param event - Event name ('open', 'close', 'select')
   * @param handler - Event handler function
   * @returns The menu component for chaining
   */
  on<T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]): MenuComponent;

  /**
   * Adds an event listener for any event the menu emits, such as
   * 'submenu-opened', 'submenu-closed', 'all-submenus-closed' or 'menu-closing'
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The menu component for chaining
   */
  on(event: string, handler: EventCallback): MenuComponent;

  /**
   * Removes an event listener from the menu
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The menu component for chaining
   */
  off<T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]): MenuComponent;

  /**
   * Removes an event listener for any event the menu emits
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The menu component for chaining
   */
  off(event: string, handler: EventCallback): MenuComponent;

  /**
   * Destroys the menu component and cleans up resources
   */
  destroy: () => void;
}

/**
 * Menu events interface for type-checking
 *
 * @category Components
 * @internal
 */
export interface MenuEvents {
  open: (event: MenuEvent) => void;
  close: (event: MenuEvent) => void;
  select: (event: MenuSelectEvent) => void;
}

/**
 * The menu as its own features see it, part-way through the pipe.
 *
 * One shared shape rather than five near-identical ones, because the features
 * enhance the same object in sequence. `element`, `getClass` and `lifecycle`
 * are required: withElement and withLifecycle run before any of them. The
 * rest are optional because they are installed by siblings, and which have
 * run depends on where in the pipe you are.
 *
 * @category Components
 * @internal
 */
/**
 * What withController installs at `component.menu`.
 *
 * The commands return the component they were handed, which is the
 * pre-controller one; nothing reads it and the API layer discards it. Declared
 * void for the same reason as MenuOpenerApi -- so the feature's generic does
 * not appear in its own return type, which is what stopped the pipe binding C
 * at that stage.
 *
 * @category Components
 * @internal
 */
/**
 * Menu state the keyboard handlers read.
 *
 * Declared here rather than in features/keyboard.ts so the host below can
 * name it: a host that types its manager methods needs their parameter types
 * in scope. FLO-114.
 */
export interface KeyboardMenuState {
  items: MenuContent[];
}

/** Menu actions the keyboard handlers call. */
export interface KeyboardActions {
  closeMenu: (event: Event, restoreFocus?: boolean) => void;
  findItemById: (id: string) => MenuItem | null;
  // Optional, and called through `?.`: the controller supplies these from
  // `component.submenu`, which the host declares optional because features
  // earlier in the pipe run before withSubmenu installs it.
  closeSubmenu?: (level: number) => void;
  handleSubmenuClick?: (
    item: MenuItem,
    index: number,
    itemElement: HTMLElement
  ) => void;
  handleNestedSubmenuClick?: (
    item: MenuItem,
    index: number,
    itemElement: HTMLElement
  ) => void;
}

export interface MenuControllerApi {
  open: (event?: Event, interactionType?: "mouse" | "keyboard") => void;
  close: (
    event?: Event,
    restoreFocus?: boolean,
    skipAnimation?: boolean
  ) => void;
  toggle: (event?: Event, interactionType?: "mouse" | "keyboard") => void;
  isOpen: () => boolean;
  getItems: () => MenuContent[];
  setItems: (items: MenuContent[]) => void;
  getSelected: () => string | null;
  setSelected: (value: string | null) => void;
  getPosition: () => MenuPosition;
  setPosition: (position: MenuPosition) => void;
}

/**
 * A component that can act as a menu's opener: anything that exposes an
 * element through `element`, `getElement()` or `input`, and follows the menu's
 * open state when it can.
 *
 * @category Components
 * @internal
 */
export interface OpenerComponent {
  element?: HTMLElement;
  getElement?: () => HTMLElement;
  input?: HTMLElement;
  setActive?: (active: boolean) => void;
  selected?: boolean;
  focus?: () => void;
  blur?: () => void;
}

/**
 * What a menu opener can be given as: a selector, an element or a component
 *
 * @category Components
 * @internal
 */
export type OpenerTarget = string | HTMLElement | OpenerComponent;

/**
 * What withOpener installs at `component.opener`.
 *
 * The three setters return the component they were handed, which is the
 * pre-opener one and so not useful for chaining; nothing reads it, and the API
 * layer discards it. Declared `void` so the value is not promised, and so the
 * feature's generic does not appear in its own return type -- which is what
 * stopped the pipe binding C at that stage.
 *
 * @category Components
 * @internal
 */
export interface MenuOpenerApi {
  setOpener: (opener: OpenerTarget) => void;
  getOpener: () => HTMLElement | null;
  getOpenerComponent: () => OpenerComponent | null;
  setActive: (active: boolean) => void;
  focus: () => void;
}

export interface MenuFeatureHost {
  element: HTMLElement;
  getClass: (name: string) => string;
  lifecycle: { destroy: () => void };
  // Required: withEvents() is the first step of the menu pipe, before
  // withElement, so both are installed by the time any feature runs.
  emit: (event: string, data?: unknown) => unknown;
  on: (event: string, handler: (...args: never[]) => void) => unknown;
  // Paired with `on`: withEvents installs both, and getApiConfig forwards both.
  off: (event: string, handler: (...args: never[]) => void) => unknown;
  menu?: MenuControllerApi;
  opener?: MenuOpenerApi;
  // These twelve were `(...args: unknown[]) => unknown`. That is wider than
  // any of the producers, and under strictFunctionTypes a host promising to
  // call a method with anything cannot accept one that takes typed
  // parameters -- which is what made the pipe in menu.ts fail to resolve and
  // typed every stage after it `unknown`. The signatures below are taken
  // from the implementations in features/, not invented. FLO-114.
  position?: {
    positionMenu: (openerElement: HTMLElement) => void;
    positionSubmenu: (
      submenuElement: HTMLElement,
      parentItemElement: HTMLElement,
      level?: number
    ) => void;
  };
  keyboard?: {
    setupKeyboardHandlers: (
      menuElement: HTMLElement,
      state: KeyboardMenuState,
      actions: KeyboardActions
    ) => void;
    removeKeyboardHandlers: (element: HTMLElement) => void;
    handleMenuKeydown: (
      e: KeyboardEvent,
      state: KeyboardMenuState,
      actions: KeyboardActions
    ) => void;
    handleInitialFocus: (
      menuElement: HTMLElement,
      interactionType: "keyboard" | "mouse"
    ) => void;
  };
  submenu?: {
    handleSubmenuClick: (
      item: MenuItem,
      index: number,
      itemElement: HTMLElement
    ) => void;
    handleSubmenuHover: (
      item: MenuItem,
      index: number,
      itemElement: HTMLElement
    ) => void;
    handleSubmenuLeave: () => void;
    handleNestedSubmenuClick: (
      item: MenuItem,
      index: number,
      itemElement: HTMLElement
    ) => void;
    closeSubmenu: (level: number) => void;
    closeAllSubmenus: () => void;
    hasOpenSubmenu: () => boolean;
    getActiveSubmenus: () => Array<{ element: HTMLElement }>;
  };
}
