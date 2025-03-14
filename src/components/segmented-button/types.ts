// src/components/segmented-button/types.ts

/**
 * Segmented button selection mode
 * @category Components
 */
export enum SelectionMode {
  /** Only one segment can be selected at a time */
  SINGLE = 'single',
  /** Multiple segments can be selected */
  MULTI = 'multi'
}

/**
 * Configuration for a single segment within a segmented button
 * @category Components
 */
export interface SegmentConfig {
  /**
   * Text content for the segment
   * @example 'Day'
   */
  text?: string;

  /**
   * Icon HTML content
   * @example '<svg>...</svg>'
   */
  icon?: string;

  /**
   * Whether this segment is initially selected
   * @default false
   */
  selected?: boolean;

  /**
   * Value associated with this segment
   */
  value?: string;

  /**
   * Whether this segment is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS class names for this segment
   */
  class?: string;
}

/**
 * Configuration interface for the Segmented Button component
 * @category Components
 */
export interface SegmentedButtonConfig {
  /**
   * Selection mode for the segmented button group
   * @default SelectionMode.SINGLE
   */
  mode?: SelectionMode;

  /**
   * Array of segment configurations
   */
  segments?: SegmentConfig[];

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name used in class generation
   */
  componentName?: string;

  /**
   * Whether the entire segmented button is initially disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS class for the segmented button container
   */
  class?: string;

  /**
   * Whether to enable ripple effect
   * @default true
   */
  ripple?: boolean;

  /**
   * Ripple effect configuration
   */
  rippleConfig?: {
    /** Duration of the ripple animation in milliseconds */
    duration?: number;
    /** Timing function for the ripple animation */
    timing?: string;
    /** Opacity values for ripple start and end [start, end] */
    opacity?: [string, string];
  };
}

/**
 * Interface for a segment within a segmented button
 * @category Components
 */
export interface Segment {
  /** The segment's DOM element */
  element: HTMLElement;

  /** The segment's value */
  value: string;

  /**
   * Gets whether the segment is selected
   */
  isSelected: () => boolean;

  /**
   * Sets the segment's selected state
   * @param selected - Whether the segment should be selected
   */
  setSelected: (selected: boolean) => void;

  /**
   * Gets whether the segment is disabled
   */
  isDisabled: () => boolean;

  /**
   * Sets the segment's disabled state
   * @param disabled - Whether the segment should be disabled
   */
  setDisabled: (disabled: boolean) => void;

  /**
   * Destroys the segment and cleans up resources
   */
  destroy: () => void;
}

/**
 * Segmented Button component interface
 * @category Components
 */
export interface SegmentedButtonComponent {
  /** The component's container DOM element */
  element: HTMLElement;

  /** Array of segment objects */
  segments: Segment[];

  /**
   * Gets the selected segment(s)
   * @returns An array of selected segments
   */
  getSelected: () => Segment[];

  /**
   * Gets the values of selected segment(s)
   * @returns An array of selected segment values
   */
  getValue: () => string[];

  /**
   * Selects a segment by its value
   * @param value - The value of the segment to select
   * @returns The SegmentedButtonComponent for chaining
   */
  select: (value: string) => SegmentedButtonComponent;

  /**
   * Deselects a segment by its value
   * @param value - The value of the segment to deselect
   * @returns The SegmentedButtonComponent for chaining
   */
  deselect: (value: string) => SegmentedButtonComponent;

  /**
   * Enables the segmented button
   * @returns The SegmentedButtonComponent for chaining
   */
  enable: () => SegmentedButtonComponent;

  /**
   * Disables the segmented button
   * @returns The SegmentedButtonComponent for chaining
   */
  disable: () => SegmentedButtonComponent;

  /**
   * Adds an event listener to the segmented button
   * @param event - Event name ('change', etc.)
   * @param handler - Event handler function
   * @returns The SegmentedButtonComponent for chaining
   */
  on: (event: string, handler: Function) => SegmentedButtonComponent;

  /**
   * Removes an event listener from the segmented button
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The SegmentedButtonComponent for chaining
   */
  off: (event: string, handler: Function) => SegmentedButtonComponent;

  /**
   * Destroys the component and cleans up resources
   */
  destroy: () => void;
}