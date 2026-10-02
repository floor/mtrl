// src/components/toolbar/types.ts

import type { ElementComponent } from "../../core/compose";
import type { BaseComponentConfig } from "../../core/config/component";
import type { ButtonConfig } from "../button/types";
import type { IconButtonConfig } from "../icon-button/types";
import type {
  ToolbarVariant,
  ToolbarColor,
  ToolbarOrientation,
  ToolbarPlacement,
  ToolbarArrangement,
  ToolbarScrollBehavior,
  ToolbarFabPosition,
} from "./constants";

/** Anything the toolbar can hold that already exists: an element, or a component carrying one. */
export type ToolbarElementItem = HTMLElement | { element: HTMLElement };

/** A button the toolbar creates from its config: a label is what makes it a button. */
export type ToolbarButtonItem = ButtonConfig & { text: string };

/**
 * An item of the toolbar:
 * - an icon button config (`icon`, `ariaLabel`, and `toggle`, `selected`,
 *   `variant`, `width` as on createIconButton), created by the toolbar;
 * - a button config with `text`, created by the toolbar;
 * - an element or a component, such as a text field or a divider, added as it is.
 */
export type ToolbarItem = ToolbarElementItem | ToolbarButtonItem | IconButtonConfig;

/**
 * Configuration of a toolbar
 * @category Components
 * @see https://m3.material.io/components/toolbars/overview
 */
export interface ToolbarConfig extends BaseComponentConfig {
  /**
   * Docked (full width, global actions) or floating (a pill, contextual actions)
   * @default 'docked'
   */
  variant?: ToolbarVariant | string;

  /**
   * Standard (surface container) or vibrant (primary container)
   * @default 'standard'
   */
  color?: ToolbarColor | string;

  /**
   * Layout of a floating toolbar. A docked toolbar is always horizontal.
   * @default 'horizontal'
   */
  orientation?: ToolbarOrientation | string;

  /**
   * Where the toolbar sits in its positioned container: `'none'` leaves it in
   * the flow. A horizontal toolbar takes `'bottom'` or `'top'` (docked: bottom
   * only), a vertical one `'start'` or `'end'`.
   * @default 'none'
   */
  placement?: ToolbarPlacement | string;

  /**
   * How a docked toolbar lays out its items: spread across the width, or centred 32dp apart
   * @default 'spread'
   */
  arrangement?: ToolbarArrangement | string;

  /**
   * Whether a floating toolbar casts a shadow (elevation level 1). Remove it
   * when the content beneath is visually distinct. A docked toolbar has none.
   * @default true for floating
   */
  elevated?: boolean;

  /** The items, in order */
  items?: ToolbarItem[];

  /**
   * A FAB paired with a floating toolbar, outside its tab stop. Create it with
   * createFab; a vibrant toolbar pairs with a `tertiary-container` FAB.
   */
  fab?: ToolbarElementItem;

  /**
   * Which end of the toolbar the FAB sits at, along its layout
   * @default 'end'
   */
  fabPosition?: ToolbarFabPosition | string;

  /**
   * Adds a trailing "more" icon button and calls this with it, to build the
   * overflow menu the button opens: `(opener) => createMenu({ opener, items })`.
   * The toolbar itself does not import the menu.
   */
  overflow?: (opener: HTMLElement) => unknown;

  /**
   * Icon of the overflow button
   * @default a "more vertical" icon
   */
  overflowIcon?: string;

  /**
   * Accessible name of the overflow button
   * @default 'More options'
   */
  overflowLabel?: string;

  /**
   * `'exit'` hides the toolbar while the content scrolls forward and shows it
   * when it scrolls back
   * @default 'none'
   */
  scrollBehavior?: ToolbarScrollBehavior | string;

  /**
   * What scrolls, for `scrollBehavior: 'exit'`
   * @default window
   */
  scrollTarget?: HTMLElement | Window;

  /**
   * The scroll distance, in px, that hides or shows the toolbar
   * @default 40
   */
  scrollThreshold?: number;

  /**
   * Accessible name of the toolbar
   * @default 'Toolbar'
   */
  ariaLabel?: string;

  /** Additional CSS classes */
  class?: string;
}

/** Events of a toolbar */
export interface ToolbarEvents {
  /** The toolbar came back on screen */
  show: () => void;
  /** The toolbar left the screen */
  hide: () => void;
}

/**
 * A toolbar
 * @category Components
 */
export interface ToolbarComponent extends ElementComponent {
  /** The element with the `toolbar` role, which holds the items */
  bar: HTMLElement;

  /** The overflow button, when `overflow` is set */
  overflowButton: HTMLElement | null;

  /** Synchronises the roving tabindex after items change */
  sync(): void;

  /**
   * Adds an item at the end, before the overflow button
   * @returns The item's element
   */
  add(item: ToolbarItem): HTMLElement;

  /** Removes an item; one the toolbar created is destroyed */
  remove(item: ToolbarElementItem): this;

  /** The item elements, in order, without the overflow button */
  getItems(): HTMLElement[];

  /** Brings the toolbar back on screen */
  show(): this;

  /** Moves the toolbar off screen and out of the focus order */
  hide(): this;

  /** Whether the toolbar is on screen */
  isVisible(): boolean;

  /** Changes the colour */
  setColor(color: ToolbarColor | string): this;

  /** The current colour */
  getColor(): ToolbarColor;

  on<K extends keyof ToolbarEvents>(event: K, handler: ToolbarEvents[K]): this;
  off<K extends keyof ToolbarEvents>(event: K, handler: ToolbarEvents[K]): this;

  /** Removes the toolbar, its listeners and the items it created */
  destroy(): void;
}
