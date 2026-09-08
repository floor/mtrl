// src/components/split-button/types.ts
import type { MenuContent, MenuComponent } from "../menu/types";

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
}

/**
 * Configuration for the split button
 * @interface SplitButtonConfig
 */
export interface SplitButtonConfig {
  /** Label of the leading button */
  text?: string;

  /** Icon of the leading button, as an HTML string */
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

  /** The menu, when the component was given items */
  menu?: MenuComponent;

  /** Sets the leading button's label */
  setText: (text: string) => SplitButtonComponent;

  /** The leading button's label */
  getText: () => string;

  /** Sets the leading button's icon */
  setIcon: (icon: string) => SplitButtonComponent;

  /** Opens whatever the trailing button opens */
  expand: () => SplitButtonComponent;

  /** Closes it */
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

/** The component as it passes through the enhancers */
export interface BaseComponent {
  element: HTMLElement;
  emit?: (event: string, data?: unknown) => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => unknown;
  off?: (event: string, handler: (...args: unknown[]) => void) => unknown;
  getClass?: (name: string) => string;
  lifecycle?: { destroy?: () => void };
  [key: string]: unknown;
}
