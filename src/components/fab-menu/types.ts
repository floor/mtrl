// src/components/fab-menu/types.ts

import type { ElementComponent } from "../../core/compose";
import type { BaseComponentConfig } from "../../core/config/component";
import type {
  FabMenuColor,
  FabMenuSize,
  FabMenuPresentation,
  FabMenuPlacement,
} from "./constants";

/** An action of the menu */
export interface FabMenuItem {
  /** Identifies the item in `select` */
  id: string;
  /** The label: always shown (m3.material.io FAB menu guidelines) */
  text: string;
  /** Icon HTML, 24dp. Markup (HTML). Not sanitized by default: see Markup and sanitizing. The menu opts out of server rendering, so the server leaves this escaped until the component upgrades. */
  icon?: string;
}

/**
 * What the menu presentation needs from a menu: the baseline menu
 * (createMenu), or one the app brings.
 */
export interface FabMenuMenu {
  open(event?: Event, interactionType?: "mouse" | "keyboard"): unknown;
  close(event?: Event, restoreFocus?: boolean): unknown;
  isOpen(): boolean;
  on(event: "close" | "select", handler: (event: { itemId?: string }) => void): unknown;
  destroy(): void;
  element: HTMLElement;
}

/**
 * Configuration of a FAB menu
 * @category Components
 * @see https://m3.material.io/components/fab-menu/overview
 */
export interface FabMenuConfig extends BaseComponentConfig {
  /** The FAB's icon HTML. Markup (HTML). Not sanitized by default: see Markup and sanitizing. The menu opts out of server rendering, so the server leaves this escaped until the component upgrades. */
  icon: string;

  /** The FAB's accessible name: it describes the menu the FAB opens */
  ariaLabel: string;

  /**
   * The actions, 2 to 6 (m3.material.io FAB menu guidelines). Top to bottom:
   * the last one is nearest the FAB.
   */
  items: FabMenuItem[];

  /**
   * Colour set: the FAB is the role's container, the close button the role,
   * the items the container
   * @default 'primary'
   */
  color?: FabMenuColor | string;

  /**
   * The size of the FAB the menu opens from
   * @default 'default'
   */
  size?: FabMenuSize | string;

  /**
   * The expressive list (compact windows), the baseline menu (the site's rule
   * on the web), or either by the window's width
   * @default 'auto'
   */
  presentation?: FabMenuPresentation | string;

  /**
   * Where the FAB sits in its positioned container: 16dp from the window
   * edges, 24dp in large windows. `'none'` leaves it in the flow.
   * @default 'none'
   */
  placement?: FabMenuPlacement | string;

  /** The icon of the close button, 20dp. Default: a close icon. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  closeIcon?: string;

  /**
   * A menu of the app's own for the menu presentation, in place of the
   * baseline menu the FAB menu loads when it needs one. Built with the FAB as
   * its opener; the FAB menu opens and closes it.
   */
  menu?: (opener: HTMLElement, items: FabMenuItem[]) => FabMenuMenu;

  /** Additional CSS classes */
  class?: string;
}

/** Events of a FAB menu */
export interface FabMenuEvents {
  /** The menu opened */
  open: () => void;
  /** The menu closed */
  close: () => void;
  /**
   * An item was chosen; the menu closes. `value` is the item's id again, as
   * the `value` of `<m-fab-menu>`'s `select` (the FLO-320 payload rule)
   */
  select: (event: { id: string; value: string }) => void;
}

/**
 * A FAB menu
 * @category Components
 */
export interface FabMenuComponent extends ElementComponent {
  /** The FAB, which becomes the close button of the list */
  fab: HTMLElement;

  /** The list of the list presentation: `role="menu"` */
  list: HTMLElement;

  /**
   * Opens the menu. When it returns, `isOpen()` is true, the FAB has
   * `aria-expanded="true"` and `open` has been emitted. In the `menu`
   * presentation the surface is a module loaded on demand: it may be painted
   * after `open()` returns, and not at all when `close()` comes first. On an
   * open menu it does nothing and emits nothing.
   *
   * While that module loads for the first time: Escape and a click outside
   * do not close the menu yet (they are the surface's own, once it is
   * shown), and a second click on the FAB does; opened again, the surface
   * opens as the last call asked; and if the module fails to load the menu
   * closes again, with `close`. On `<m-fab-menu>` opened by its `open`
   * attribute, which dispatches no `open`, that `close` is dispatched alone.
   */
  open(event?: Event): this;

  /**
   * Closes the menu. When it returns, `isOpen()` is false and `close` has
   * been emitted. On a closed menu it does nothing and emits nothing.
   */
  close(): this;

  /** Opens or closes the menu */
  toggle(event?: Event): this;

  /** Whether the menu is open */
  isOpen(): boolean;

  /** The presentation in use: 'list' or 'menu' */
  getPresentation(): "list" | "menu";

  on<K extends keyof FabMenuEvents>(event: K, handler: FabMenuEvents[K]): this;
  off<K extends keyof FabMenuEvents>(event: K, handler: FabMenuEvents[K]): this;

  /** Removes the FAB menu, its listeners and its menu */
  destroy(): void;
}
