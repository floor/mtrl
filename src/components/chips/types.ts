// src/components/chips/types.ts
import type { EventCallback } from "../../core/state/emitter";
import type { ForwardedEventPayload } from "../../core/dom";

export type ChipType = "assist" | "filter" | "input" | "suggestion";

/** Shared chip options. Containers default to filter chips. */
export interface ChipConfig {
  type?: ChipType;
  label?: string;
  /** @deprecated Use label. Kept for existing chips-container item configs. */
  text?: string;
  value?: string;
  disabled?: boolean;
  selected?: boolean;
  /** Elevated styling is supported by assist, filter and suggestion chips. */
  elevated?: boolean;
  leadingIcon?: string;
  icon?: string;
  trailingIcon?: string;
  /** Decorative avatar HTML for an input chip; takes precedence over leadingIcon. */
  avatar?: string;
  /** Input-chip removal request. The owner decides when to remove the chip. */
  onRemove?: (chip: ChipComponent) => void;
  removeLabel?: string;
  onClick?: (chip: ChipComponent) => void;
  onChange?: (selected: boolean, chip: ChipComponent) => void;
  onSelect?: (chip: ChipComponent) => void;
  class?: string;
  prefix?: string;
  componentName?: string;
  ripple?: boolean;
  /** @internal Selection belongs to the chips container. */
  managedSelection?: boolean;
}

type NamedChipConfig = Omit<ChipConfig, "type" | "text" | "selected" | "avatar" | "onRemove" | "removeLabel" | "managedSelection" | "onChange" | "onSelect"> & { label: string };
export type AssistChipConfig = NamedChipConfig;
export type SuggestionChipConfig = Omit<NamedChipConfig, "trailingIcon">;
export type FilterChipConfig = NamedChipConfig & Pick<ChipConfig, "selected" | "onChange" | "onSelect">;
export type InputChipConfig = Omit<FilterChipConfig, "elevated"> & Pick<ChipConfig, "avatar" | "onRemove" | "removeLabel">;

export interface ChipChangePayload { selected: boolean; chip: ChipComponent; }
export interface ChipEvents {
  click: (payload: ForwardedEventPayload<MouseEvent, HTMLElement>) => void;
  keydown: (payload: ForwardedEventPayload<KeyboardEvent, HTMLElement>) => void;
  focus: (payload: ForwardedEventPayload<FocusEvent, HTMLElement>) => void;
  blur: (payload: ForwardedEventPayload<FocusEvent, HTMLElement>) => void;
  change: (payload: ChipChangePayload) => void;
  remove: (chip: ChipComponent) => void;
}

/** Shared API. Selection setters are inert on assist and suggestion chips. */
export interface ChipComponent {
  element: HTMLElement;
  /** Native primary action. Removal is a sibling button, never nested inside it. */
  action: HTMLButtonElement;
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
   * Whether multiple chips can be selected simultaneously
   * @default false
   */
  multiSelect?: boolean;

  /**
   * Callback function when chip selection changes
   */
  onChange?: (
    selectedValues: (string | null)[],
    changedValue: string | null,
  ) => void;

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

/** Events emitted by the chips container's controller. */
export interface ChipsEvents {
  /** Selection values and the changed chip value (null for programmatic changes). */
  change: (selectedValues: (string | null)[], changedValue: string | null) => void;
  /** The newly created chip, after it is inserted into the container. */
  add: (chip: ChipComponent) => void;
  /** The chip being removed, before it is destroyed. */
  remove: (chip: ChipComponent) => void;
}

export interface ChipsComponent {
  /** The chips container's DOM element */
  element: HTMLElement;

  /**
   * Adds a new chip to the chips container
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
   * @param triggerEvent - Whether to trigger change event (default: true)
   * @returns The chips instance for chaining
   */
  selectByValue: (
    values: string | string[],
    triggerEvent?: boolean,
  ) => ChipsComponent;

  /**
   * Clears all selections
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
   * Scrolls to a specific chip
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
