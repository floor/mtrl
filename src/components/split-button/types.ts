// src/components/split-button/types.ts
import type { MenuContent } from "../menu/types";
import type { MenuOwner } from "../menu/inner";
import type { ButtonComponent } from "../button/types";

/** Visual style, the same set the button offers */
export type SplitButtonVariant = "filled" | "tonal" | "outlined" | "elevated";

/** Size, matching the button and icon button scale */
export type SplitButtonSize = "xs" | "s" | "m" | "l" | "xl";

/** Events the component emits */
export type SplitButtonEventType = "click" | "expand" | "collapse" | "change" | "select";

/** What an event handler receives */
export interface SplitButtonEvent {
  /** The component that emitted it */
  splitButton: SplitButtonComponent;
  /** Whether the trailing button is showing its menu */
  expanded: boolean;
  /** The DOM event behind it, when there was one */
  originalEvent: Event | null;
  /** The chosen item, on a `select` event */
  item?: MenuContent;
  /** The chosen item's `id`, on a `select` event: the `value` of the `<m-split-button>` element's `select` */
  value?: string | null;
}

/**
 * Configuration for the split button
 * @interface SplitButtonConfig
 */
export interface SplitButtonConfig {
  /** Label of the leading button */
  text?: string;

  /**
   * `"top"` renders the menu next to the trailing button, in its tree (a
   * shadow root included), and shows it in the browser's top layer. See the
   * menu's `layer`.
   */
  layer?: "top";

  /** Icon of the leading button. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  icon?: string;

  /** Visual style, shared by both buttons */
  variant?: SplitButtonVariant;

  /** Size of both buttons */
  size?: SplitButtonSize;

  /** Whether both buttons are disabled */
  disabled?: boolean;

  /**
   * Accessible name of the trailing button. It should say that more choices
   * are available and how they relate to the leading action, such as
   * "More watch options" beside a "Watch later" button (M3 split button
   * accessibility).
   * @default 'More options'
   */
  trailingLabel?: string;

  /** Accessible name of the leading button, when its label is not enough */
  ariaLabel?: string;

  /** Accessible name of the whole group */
  groupLabel?: string;

  /** What the leading button does */
  onClick?: (event: SplitButtonEvent) => void;

  /**
   * Menu items for the trailing button to open. Without them the component
   * only reports that the trailing button was activated, and the caller
   * shows whatever it likes.
   */
  items?: MenuContent[];

  /** Called with the chosen item when the component owns the menu */
  onSelect?: (event: SplitButtonEvent) => void;

  /** Additional CSS classes */
  class?: string;

  /** Component prefix for CSS class names */
  prefix?: string;

  /** Component name for CSS class names */
  componentName?: string;

  /** Event handlers */
  on?: {
    [key in SplitButtonEventType]?: (event: SplitButtonEvent) => void;
  };
}

/**
 * The split button's public API
 * @interface SplitButtonComponent
 */
export interface SplitButtonComponent {
  /** The element holding both buttons */
  element: HTMLElement;

  /** The leading button's element */
  leadingElement: HTMLButtonElement;

  /** The trailing button's element */
  trailingElement: HTMLButtonElement;

  /** Sets the leading button's label */
  setText: (text: string) => SplitButtonComponent;

  /** The leading button's label */
  getText: () => string;

  /** Sets the leading button's icon */
  setIcon: (icon: string) => SplitButtonComponent;

  /**
   * Replaces the menu's items. A split button created without `items` has no
   * menu: the first non-empty list creates it, and opens it if the split
   * button is expanded. An empty list empties the menu and keeps it.
   */
  setItems: (items: MenuContent[]) => SplitButtonComponent;

  /** The menu's items; empty while the split button has no menu */
  getItems: () => MenuContent[];

  /**
   * Opens whatever the trailing button opens. When it returns, `isExpanded()`
   * is true and `expand` and `change` have been emitted; the surface may be
   * painted after `expand()` returns.
   */
  expand: () => SplitButtonComponent;

  /**
   * Closes it. When it returns, `isExpanded()` is false and `collapse` and
   * `change` have been emitted. The same holds when the user dismisses the
   * menu (Escape, a click outside, an item chosen): both are emitted in that
   * event, with the menu's `close`. `collapse()` then `expand()` at once
   * ends expanded.
   */
  collapse: () => SplitButtonComponent;

  /** Whether it is open */
  isExpanded: () => boolean;

  /** Disables both buttons */
  disable: () => SplitButtonComponent;

  /** Enables both buttons */
  enable: () => SplitButtonComponent;

  /** Whether both buttons are disabled */
  isDisabled: () => boolean;

  /** Adds an event listener */
  on: (event: SplitButtonEventType, handler: (event: SplitButtonEvent) => void) => SplitButtonComponent;

  /** Removes an event listener */
  off: (event: SplitButtonEventType, handler: (event: SplitButtonEvent) => void) => SplitButtonComponent;

  /** Takes the component off the page and releases what it holds */
  destroy: () => void;
}

/** What withButtons adds */
export interface ButtonsFeature {
  leading: ButtonComponent;
  trailing: ButtonComponent;
  leadingElement: HTMLElement;
  trailingElement: HTMLElement;
}

/** What withMenu adds: the menu, when the component was given items */
export type MenuFeature = MenuOwner;

/** The component as it passes through the enhancers */
export interface BaseComponent extends ButtonsFeature, MenuFeature {
  element: HTMLElement;
  emit?: (event: string, data?: unknown) => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => unknown;
  off?: (event: string, handler: (...args: unknown[]) => void) => unknown;
  getClass?: (name: string) => string;
  lifecycle?: { destroy?: () => void };
}
