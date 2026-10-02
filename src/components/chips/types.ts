// src/components/chips/types.ts
import type { EventCallback } from "../../core/state/emitter";
import type { ForwardedEventPayload } from "../../core/dom";

export type ChipType = "assist" | "filter" | "input" | "suggestion";

/** Shared chip options. Containers default to filter chips. */
export interface ChipConfig {
  type?: ChipType;
  label?: string;
  value?: string;
  disabled?: boolean;
  /** In a single-select set, selecting this chip replaces the previous selection; the last selected config wins. */
  selected?: boolean;
  /** Elevated styling is supported by assist, filter and suggestion chips. */
  elevated?: boolean;
  /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  leadingIcon?: string;
  /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Same sink as `leadingIcon`. */
  icon?: string;
  /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  trailingIcon?: string;
  /** Decorative avatar for an input chip; takes precedence over leadingIcon. Markup (HTML), not a person's name or an image URL. Not sanitized by default: see Markup and sanitizing. */
  avatar?: string;
  /**
   * Called when an input chip is removed, from its remove button or with Backspace or
   * Delete. Input chips are always removable (m3.material.io chips): on its own the
   * chip then leaves the page; in a set, the set removes it and emits `remove`. It
   * used to be a request the owner had to act on, and without it there was no
   * remove button. FLO-257. It and every `remove` listener run first, with the chip
   * still in the set and on the page; the removal follows.
   */
  onRemove?: ChipEvents["remove"];
  removeLabel?: string;
  /**
   * Filter chips: gives the trailing icon its own button, which calls this (the
   * m3.material.io chips' trailing icon that "can be used to open a menu or remove
   * the chip"). The chip's own action is unaffected. FLO-259.
   */
  onTrailingClick?: ChipEvents["trailing"];
  /** The trailing button's accessible name; "{label} options" for a menu, "Remove {label}" otherwise. */
  trailingLabel?: string;
  /** The trailing button opens a menu: aria-haspopup="menu", and a drop-down arrow unless trailingIcon is set. */
  trailingMenu?: boolean;
  /**
   * Same payload as a `click` listener. It runs before the chip toggles, alone or
   * in a set: `isSelected()` here is the state before the click. Read the new
   * state in `onChange`, which follows when the selection changed.
   */
  onClick?: ChipEvents["click"];
  /**
   * Same payload as a `change` listener: `{ selected, chip, value }`.
   * On its own, a click emits `change` before `click`. In a set, the set
   * toggles the chip during `click`, and the chip then emits `change` once.
   * That click runs, in order: the item's `onClick`, the set's `onChange`,
   * a set `change` listener added after `createChips`, the item's `onSelect`,
   * a chip `click` listener added after the chip was created, the item's
   * `onChange`, and a chip `change` listener added after the chip was created.
   * `setSelected` does not emit `change`, and neither does the set's
   * `selectByValue`.
   */
  onChange?: ChipEvents["change"];
  /**
   * Called with the chip when the user toggles a selectable chip, not when a
   * `selectionRequired` set refuses the click. No matching event: this is not
   * an `on(event)` listener.
   */
  onSelect?: (chip: ChipComponent) => void;
  class?: string;
  prefix?: string;
  componentName?: string;
  ripple?: boolean;
}

/**
 * @internal What the chip set passes a chip on top of its config; not part of
 * ChipConfig, so apps cannot set it (FLO-381).
 */
export interface ChipOptions extends ChipConfig {
  /** Selection belongs to the chips container. */
  managedSelection?: boolean;
  /** Notify the owning set when a chip becomes selected. */
  onSelected?: (chip: ChipComponent) => void;
  /** The owning set removes the chip, once its `remove` listeners have run. */
  onRemoved?: (chip: ChipComponent) => void;
  /**
   * The chip is a cell of a chip set's grid (FLO-261): the root is a
   * `gridcell`, and a one-action chip's cell is its focus target.
   */
  cell?: boolean;
}

type NamedChipConfig = Omit<ChipConfig, "type" | "text" | "selected" | "avatar" | "onRemove" | "removeLabel" | "onChange" | "onSelect" | "onTrailingClick" | "trailingLabel" | "trailingMenu"> & { label: string };
export type AssistChipConfig = NamedChipConfig;
export type SuggestionChipConfig = Omit<NamedChipConfig, "trailingIcon">;
export type FilterChipConfig = NamedChipConfig & Pick<ChipConfig, "selected" | "onChange" | "onSelect" | "onTrailingClick" | "trailingLabel" | "trailingMenu">;
// An input chip's trailing button is its remove button, so it takes no trailing action.
export type InputChipConfig = Omit<FilterChipConfig, "elevated" | "onTrailingClick" | "trailingLabel" | "trailingMenu"> & Pick<ChipConfig, "avatar" | "onRemove" | "removeLabel">;

export interface ChipChangePayload {
  selected: boolean;
  chip: ChipComponent;
  /** The chip's value, as `getValue()` returns it; every model event carries it (FLO-380) */
  value: string | null;
}
export interface ChipEvents {
  click: (payload: ForwardedEventPayload<MouseEvent, HTMLElement>) => void;
  keydown: (payload: ForwardedEventPayload<KeyboardEvent, HTMLElement>) => void;
  focus: (payload: ForwardedEventPayload<FocusEvent, HTMLElement>) => void;
  blur: (payload: ForwardedEventPayload<FocusEvent, HTMLElement>) => void;
  change: (payload: ChipChangePayload) => void;
  remove: (chip: ChipComponent) => void;
  /** A filter chip's trailing button was activated (FLO-259). */
  trailing: (chip: ChipComponent) => void;
}

/** Shared API. Selection setters are inert on assist and suggestion chips. */
export interface ChipComponent {
  element: HTMLElement;
  /** Native primary action. Removal is a sibling button, never nested inside it. */
  action: HTMLButtonElement;
  /**
   * A filter chip's trailing button, when it has one (`onTrailingClick`): anchor a
   * menu to it and keep its aria-expanded in step. FLO-259.
   */
  trailingAction?: HTMLButtonElement;
  getType: () => ChipType;
  getValue: () => string | null;
  setValue: (value: string) => ChipComponent;
  enable: () => ChipComponent;
  disable: () => ChipComponent;
  isDisabled: () => boolean;
  setLabel: (label: string) => ChipComponent;
  getLabel: () => string;
  /** Alias of setLabel for chips-container consumers. */
  setText: (text: string) => ChipComponent;
  getText: () => string;
  setIcon: (icon: string) => ChipComponent;
  getIcon: () => string;
  setLeadingIcon: (icon: string) => ChipComponent;
  setTrailingIcon: (icon: string) => ChipComponent;
  isSelected: () => boolean;
  /** Selects or deselects this chip silently. In a single-select set, selecting it deselects the previous chip. */
  setSelected: (selected: boolean) => ChipComponent;
  toggleSelected: () => ChipComponent;
  focus: () => ChipComponent;
  destroy: () => void;
  on: <K extends keyof ChipEvents>(event: K, handler: ChipEvents[K]) => ChipComponent;
  off: <K extends keyof ChipEvents>(event: K, handler: ChipEvents[K]) => ChipComponent;
  addClass: (...classes: string[]) => ChipComponent;
}

/**
 * Configuration interface for the Chips component
 * @category Components
 */
export interface ChipsConfig {
  /**
   * Array of chip configurations to initialize
   * @default []
   */
  chips?: ChipConfig[];

  /**
   * Whether the chip set is horizontally scrollable
   * @default false
   */
  scrollable?: boolean;

  /**
   * Whether the chip set is vertically stacked
   * @default false
   */
  vertical?: boolean;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * CSS selector for filtering behavior
   */
  selector?: string | null;

  /**
   * Whether several chips can be selected at once. Multi-select is the default, as
   * Material's chip groups are (single-select is opt-in). FLO-257.
   * @default true
   */
  multiSelect?: boolean;

  /**
   * Whether the set keeps at least one chip selected: deselecting the last selected
   * chip is refused, and a refused click emits no `change`, on the chip or on the set.
   * Off by default, as in Material; single-select sets used to
   * enforce it without a way to opt out. FLO-257.
   * @default false
   */
  selectionRequired?: boolean;

  /**
   * Same payload as an `on("change")` listener. Registered before the `on`
   * map and before a listener added after `createChips`.
   * `selectByValue(values, true)` reaches it, with `changed: null`.
   * `selectByValue(values)` and `clearSelection()` stay silent.
   */
  onChange?: ChipsEvents["change"];

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Label text for the chips container
   */
  label?: string;

  /**
   * Position of the label (start or end)
   * @default 'start'
   */
  labelPosition?: "start" | "end";

  /**
   * Schema definition for the component structure
   * @internal
   */
  schema?: unknown;

  /**
   * Event handlers for component events
   */
  on?: Partial<ChipsEvents>;
}

/**
 * Chips component interface
 * @category Components
 */
/**
 * What a chips feature needs from the component it is handed.
 *
 * The chips pipe is createBase, withEvents, withElement, withContainer,
 * withChipItems, withDom, then the controller -- so the element and the
 * emitter are installed before it runs, and `chipContainer` and
 * `chipInstances` come from the two features just above it.
 *
 * @category Components
 * @internal
 */
export interface ChipsFeatureComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit?: (event: string, data: unknown) => unknown;
  /** withDom builds this; the controller appends chips to it */
  chipContainer?: HTMLElement;
  /**
   * withChipItems keeps the live chips here. Required, because it runs before
   * the controller in the only pipe that builds one, and the controller reads
   * it on every path.
   */
  chipInstances: ChipComponent[];
  /** withContainer installs this whole, so the members are not optional in it */
  layout?: { isVertical: () => boolean; isScrollable: () => boolean };
  resources?: import("../../core/compose/cleanup").CleanupScope;
  lifecycle?: { destroy: () => void };
}

/**
 * The handlers the chips controller keeps per event name.
 *
 * @category Components
 * @internal
 */
export type ChipsEventListeners = Record<string, EventCallback[]>;

/**
 * The payload of the chips set's `change`.
 *
 * Read `value` for the set's current value, `selected` for selected chip
 * values, and `changed` for the chip toggled by the user.
 */
export interface ChipsChangeEvent {
  /** The selection in the `value` property's shape: a string or null for a single-select set, an array for a multi-select one. */
  value: string | string[] | null;
  /** The values of the selected chips, in chip order (a chip without a value gives null) */
  selected: (string | null)[];
  /** The value of the chip the user toggled; null for a change made by a method */
  changed: string | null;
}

/** A chip joined the set; `value` is the selection after insertion. */
export interface ChipsAddEvent {
  value: string | string[] | null;
  chip: ChipComponent;
}

/** A chip left the set; `value` is the remaining selection. */
export interface ChipsRemoveEvent extends ChipsAddEvent {
  /** The selection after removal, in the same shape as the set's `getValue()`. */
  value: string | string[] | null;
  /** The removed chip's value, captured before destruction. */
  chipValue: string | null;
}

/** Events emitted by the chips container's controller. */
export interface ChipsEvents {
  /**
   * The selection after the change. Read `event.value`, the same field the
   * `<m-chips>` element's `change` carries.
   */
  change: (event: ChipsChangeEvent) => void;
  /** The newly created chip and the selection after insertion. */
  add: (event: ChipsAddEvent) => void;
  /** The removed chip and the selection after removal. */
  remove: (event: ChipsRemoveEvent) => void;
}

export interface ChipsComponent {
  /** The chips container's DOM element */
  element: HTMLElement;

  /**
   * Adds a new chip to the chips container. In a single-select set, a selected
   * chip replaces the previous selection before `add` fires; `add.value`
   * reads the new selection. Programmatic additions do not emit `change`.
   * @param chipConfig - Configuration for the chip
   * @returns The chips instance for chaining
   */
  addChip: (chipConfig: ChipConfig) => ChipsComponent;

  /**
   * Removes a chip from the chips container
   * @param chipOrIndex - Chip instance or index to remove
   * @returns The chips instance for chaining
   */
  removeChip: (chipOrIndex: ChipComponent | number) => ChipsComponent;

  /**
   * Gets all chip instances in the set
   * @returns Array of chip instances
   */
  getChips: () => ChipComponent[];

  /**
   * Gets currently selected chips
   * @returns Array of selected chip instances
   */
  getSelectedChips: () => ChipComponent[];

  /**
   * Gets the values of selected chips
   * @returns Array of selected chip values
   */
  getSelectedValues: () => (string | null)[];

  /**
   * Gets the current value - form field compatibility
   * @returns The first selected value (or null) in single-select mode, the selected values in multi-select mode
   */
  getValue: () => string | string[] | null;

  /**
   * Sets the value by selecting chips by value, without a change event - form field compatibility
   * @param values - Value or array of values to select; null, undefined or empty clears the selection
   * @returns The chips instance for chaining
   */
  setValue: (values: string | string[] | null | undefined) => ChipsComponent;

  /**
   * Selects chips by their values
   * @param values - Value or array of values to select
   * @param triggerEvent - Emits `change` when true; silent by default (FLO-328)
   * @returns The chips instance for chaining
   */
  selectByValue: (
    values: string | string[],
    triggerEvent?: boolean,
  ) => ChipsComponent;

  /**
   * Clears all selections. Silent: only the user's change emits `change`
   * @returns The chips instance for chaining
   */
  clearSelection: () => ChipsComponent;

  /**
   * Sets the scrollable state of the chips container
   * @param isScrollable - Whether the chips container should be scrollable
   * @returns The chips instance for chaining
   */
  setScrollable: (isScrollable: boolean) => ChipsComponent;

  /**
   * Sets the vertical layout state
   * @param isVertical - Whether the chips container should be vertically stacked
   * @returns The chips instance for chaining
   */
  setVertical: (isVertical: boolean) => ChipsComponent;

  /**
   * Sets the label text
   * @param text - Label text
   * @returns The chips instance for chaining
   */
  setLabel: (text: string) => ChipsComponent;

  /**
   * Gets the label text
   * @returns Label text
   */
  getLabel: () => string;

  /**
   * Sets the label position
   * @param position - Label position ('start' or 'end')
   * @returns The chips instance for chaining
   */
  setLabelPosition: (position: "start" | "end") => ChipsComponent;

  /**
   * Gets the label position
   * @returns Label position
   */
  getLabelPosition: () => string;

  /**
   * Scrolls to a specific chip. A scrollable set scrolls smoothly, from its
   * stylesheet, and at once under reduced motion.
   * @param chipOrIndex - Chip instance or index to scroll to
   * @returns The chips instance for chaining
   */
  scrollToChip: (chipOrIndex: ChipComponent | number) => ChipsComponent;

  /**
   * Enables keyboard navigation between chips in the set
   * @returns The chips instance for chaining
   */
  enableKeyboardNavigation: () => ChipsComponent;

  /**
   * Turns keyboard navigation between the chips on and off: while disabled,
   * the arrows, Home and End no longer move focus in the set (FLO-352)
   */
  keyboard: {
    /** Moves focus with the arrows, Home and End again */
    enable: () => void;
    /** Stops moving focus with the arrows, Home and End */
    disable: () => void;
  };

  /**
   * Destroys the chips container and all contained chips
   */
  destroy: () => void;

  /**
   * Adds an event listener to the chips container
   * @param event - Event name ('change', etc.)
   * @param handler - Event handler function
   * @returns The chips instance for chaining
   */
  on: <K extends keyof ChipsEvents>(event: K, handler: ChipsEvents[K]) => ChipsComponent;

  /**
   * Removes an event listener from the chips container
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The chips instance for chaining
   */
  off: <K extends keyof ChipsEvents>(event: K, handler: ChipsEvents[K]) => ChipsComponent;
}


/**
 * Registers ChipConfig with the global defaults map, so
 * `setComponentDefaults("chip", ...)` is typed without core
 * importing anything from this component. FLO-115.
 */
declare module "../../core/config/global" {
  interface ComponentConfigMap {
    chip?: Partial<ChipConfig>;
  }
}
