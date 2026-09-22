// src/components/list/types.ts

/**
 * Configuration for the List component
 * @interface ListConfig
 */
export interface ListConfig<T = unknown> {
  /**
   * Static array of items to display
   * @required
   */
  items: T[];

  /**
   * Function to render an item
   * @param {T} item - Item to render
   * @param {number} index - Item index in the list
   * @returns {HTMLElement} Rendered DOM element
   */
  renderItem?: (item: T, index: number) => HTMLElement;

  /**
   * Whether to track item selection
   * When true, clicked items will receive a selected class
   * @default true
   */
  trackSelection?: boolean;

  /**
   * Whether to allow multiple item selection
   * @default false
   */
  multiSelect?: boolean;

  /**
   * Initial selection state (array of item IDs)
   */
  initialSelection?: (string | number)[];

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * Default animation behavior for scroll operations
   * When true, scroll operations will be animated by default
   * @default false
   */
  animate?: boolean;

  /**
   * @deprecated The prefix is fixed at build time (FLO-118); this option is ignored.
   */
  prefix?: string;

  /**
   * Component name used in CSS class generation
   * @default 'list'
   */
  componentName?: string;
}

/**
 * What the list reads off an item.
 *
 * `ListConfig` is generic in its item type and consumers keep that, but the
 * renderer and the selection feature both reach into an item for the same few
 * optional fields -- an id to target it by, and one of four names for its
 * label. This is that shape, written down once so the two features agree.
 *
 * @category Components
 */
/** Slot HTML uses the shared safe HTML sink; HTMLElement content is moved, not cloned.
 * Use text for metadata and control/custom for independently interactive content.
 */
export interface ListSlot {
  type: "icon" | "avatar" | "image" | "video" | "text" | "control" | "custom";
  content: string | HTMLElement;
}

export interface ListItem {
  /** Structural entries are rendered but never selectable. */
  kind?: "item" | "divider" | "subheader";
  /** Insets a divider to the text column (72px from the leading edge). */
  inset?: boolean;
  /** One headline line plus optional overline/supporting lines. Inferred when omitted. */
  lines?: 1 | 2 | 3;
  overline?: string;
  supportingText?: string;
  leading?: ListSlot;
  trailing?: ListSlot;
  /** Blocks user activation; programmatic selection is still allowed. */
  disabled?: boolean;
  id?: string | number;
  text?: string;
  title?: string;
  headline?: string;
  name?: string;
  /** Selected at creation, which withSelection seeds its set from */
  selected?: boolean;
}

/**
 * What withRenderer installs at `component.list`.
 *
 * This static list renders all entries. Legacy paging methods remain no-ops
 * for compatibility; there is no virtual-list dependency.
 *
 * @category Components
 * @internal
 */
export interface ListRenderer<T = ListItem> {
  /** @internal Owned row references avoid selector interpolation and nested-list matches. */
  getRows: () => ListRow<T>[];
  onRender: (handler: () => void) => () => void;
  getItems: () => T[];
  getAllItems: () => T[];
  getVisibleItems: () => T[];
  refresh: () => void;
  scrollToItem: (
    itemId: string | number,
    position?: ScrollPosition,
    animate?: boolean
  ) => void;
  scrollToIndex: (
    index: number,
    position?: ScrollPosition,
    animate?: boolean
  ) => void;
  loadNext: () => Promise<{ hasNext: boolean; items: T[] }>;
  loadPage: () => Promise<{ hasNext: boolean; items: T[] }>;
  loadPrevious: () => Promise<{ hasPrev: boolean; items: T[] }>;
  scrollNext: () => Promise<{ hasNext: boolean; items: T[] }>;
  scrollPrevious: () => Promise<{ hasPrev: boolean; items: T[] }>;
  scrollToItemById: (
    itemId: string | number,
    position?: ScrollPosition,
    animate?: boolean
  ) => Promise<void>;
  onCollectionChange: () => () => void;
  onPageChange: () => () => void;
  getCurrentPage: () => number;
  getPageSize: () => number;
  getCollection: () => null;
  isApiMode: () => boolean;
  isLoading: () => boolean;
  hasNextPage: () => boolean;
}

/** @internal A rendered data row and its independent native primary action. */
export interface ListRow<T = ListItem> {
  item: T;
  id: string;
  index: number;
  element: HTMLElement;
  action?: HTMLButtonElement;
}

/** Where a scrolled-to item lands in the viewport */
export type ScrollPosition = "start" | "center" | "end";

/**
 * What withSelection installs. Present whether or not selection is tracked --
 * with `trackSelection` off the feature returns no-op versions rather than
 * nothing, so a caller never has to check before calling.
 *
 * @category Components
 * @internal
 */
export interface ListSelection<T = ListItem> {
  getSelectedItems: () => T[];
  getSelectedItemIds: () => string[];
  isItemSelected: (itemId: string | number) => boolean;
  selectItem(itemId: string | number): this;
  deselectItem(itemId: string | number): this;
  clearSelection(): this;
  setSelection(itemIds: (string | number)[]): this;
}

/**
 * What a list feature needs from the component it is handed.
 *
 * The list pipe is createBase, withEvents, withElement, then these -- so the
 * element is there before any feature runs. `list` is optional because
 * withSelection reads it and withRenderer is what puts it there.
 *
 * @category Components
 * @internal
 */
export interface ListFeatureHost {
  element: HTMLElement;
  getClass: (name: string) => string;
  resources?: import("../../core/compose/cleanup").CleanupScope;
  eventTarget?: { current: unknown };
  emit?: (event: string, data: unknown) => unknown;
  lifecycle?: { destroy: () => void };
  list?: ListRenderer;
}

/**
 * Selection event data
 * @interface SelectEvent
 */
export interface SelectEvent<T = unknown> {
  /**
   * Selected item data
   */
  item: T;

  /**
   * DOM element for the selected item
   */
  element: HTMLElement;

  /**
   * Original DOM event
   */
  originalEvent: Event;

  /**
   * Component instance
   */
  component: ListComponent<T>;

  /**
   * Prevent default behavior
   */
  preventDefault: () => void;

  /**
   * Whether default was prevented
   */
  defaultPrevented: boolean;
}

/**
 * Load event data
 * @interface LoadEvent
 */
export interface LoadEvent<T = unknown> {
  /**
   * Loaded items
   */
  items: T[];

  /**
   * Whether the list is currently loading
   */
  loading: boolean;

  /**
   * Whether there are more items to load
   */
  hasNext: boolean;

  /**
   * Whether there are previous items
   */
  hasPrev: boolean;

  /**
   * Component instance
   */
  component: ListComponent<T>;

  /**
   * Prevent default behavior
   */
  preventDefault?: () => void;

  /**
   * Whether default was prevented
   */
  defaultPrevented?: boolean;
}

/**
 * List component interface
 * @interface ListComponent
 */
export interface ListComponent<T = unknown> {
  /**
   * Component's root DOM element
   */
  element: HTMLElement;

  /**
   * Refreshes the list display
   * @returns {Promise<ListComponent<T>>} Promise that resolves with component
   */
  refresh: () => Promise<ListComponent<T>>;

  /**
   * Gets all items in the list
   * @returns {T[]} All items
   */
  getAllItems: () => T[];

  /**
   * Gets all visible items (same as getAllItems for rendered lists)
   * @returns {T[]} Visible items
   */
  getVisibleItems: () => T[];

  /**
   * Scrolls to a specific item by ID
   * @param {string | number} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {ListComponent} Component instance for chaining
   */
  scrollToItem: (
    itemId: string | number,
    position?: "start" | "center" | "end",
    animate?: boolean
  ) => ListComponent<T>;

  /**
   * Scroll to a specific index in the list
   * @param {number} index - Index to scroll to (0-based)
   * @param {string} position - Position ('start', 'center', 'end')
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {Promise<ListComponent<T>>} Promise that resolves when scroll is complete
   */
  scrollToIndex: (
    index: number,
    position?: "start" | "center" | "end",
    animate?: boolean
  ) => Promise<ListComponent<T>>;

  /**
   * Checks if the list is currently loading (always false for rendered lists)
   * @returns {boolean} Always false
   */
  isLoading: () => boolean;

  /**
   * Checks if the list has more items to load (always false for rendered lists)
   * @returns {boolean} Always false
   */
  hasNextPage: () => boolean;

  /**
   * Gets the currently selected items
   * @returns {T[]} Selected items
   */
  getSelectedItems: () => T[];

  /**
   * Gets the IDs of currently selected items
   * @returns {string[]} Selected item IDs
   */
  getSelectedItemIds: () => string[];

  /**
   * Checks if an item is selected
   * @param {string | number} itemId - Item ID to check
   * @returns {boolean} True if item is selected
   */
  isItemSelected: (itemId: string | number) => boolean;

  /**
   * Selects an item
   * @param {string | number} itemId - Item ID to select
   * @returns {ListComponent} Component instance for chaining
   */
  selectItem: (itemId: string | number) => ListComponent<T>;

  /**
   * Deselects an item
   * @param {string | number} itemId - Item ID to deselect
   * @returns {ListComponent} Component instance for chaining
   */
  deselectItem: (itemId: string | number) => ListComponent<T>;

  /**
   * Clears all selections
   * @returns {ListComponent} Component instance for chaining
   */
  clearSelection: () => ListComponent<T>;

  /**
   * Sets the selection to the specified item IDs
   * @param {(string | number)[]} itemIds - Item IDs to select
   * @returns {ListComponent} Component instance for chaining
   */
  setSelection: (itemIds: (string | number)[]) => ListComponent<T>;

  /**
   * Adds an event listener to the list
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {ListComponent} Component instance for chaining
   */
  on: <K extends keyof ListEvents<T>>(
    event: K,
    handler: ListEvents<T>[K]
  ) => ListComponent<T>;

  /**
   * Removes an event listener from the list
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {ListComponent} Component instance for chaining
   */
  off: <K extends keyof ListEvents<T>>(
    event: K,
    handler: ListEvents<T>[K]
  ) => ListComponent<T>;

  /**
   * Destroys the component and cleans up resources
   */
  destroy: () => void;
}

/**
 * Event handlers for List
 * @interface ListEvents
 */
export interface ListEvents<T = unknown> {
  select: (event: SelectEvent<T>) => void;
  load: (event: LoadEvent<T>) => void;
  scroll: (event: {
    originalEvent: Event;
    component: ListComponent<T>;
  }) => void;
}