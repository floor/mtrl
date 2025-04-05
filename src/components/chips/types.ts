// src/components/chips/types.ts

/**
 * Chip variant types
 * @category Components
 */
export type ChipVariant = 'filled' | 'outlined' | 'elevated' | 'assist' | 'filter' | 'input' | 'suggestion';

/**
 * Configuration interface for the Chip component
 * @category Components
 */
export interface ChipConfig {
  /** 
   * Chip variant that determines visual styling
   * @default 'filled'
   */
  variant?: ChipVariant | string;
  
  /** 
   * Whether the chip is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Whether the chip is initially selected
   * @default false
   */
  selected?: boolean;
  
  /** 
   * Initial chip text content
   * @example 'Category'
   */
  text?: string;
  
  /** 
   * Initial chip icon HTML content (alias for leadingIcon)
   * @example '<svg>...</svg>'
   */
  icon?: string;
  
  /** 
   * Leading icon HTML content
   * @example '<svg>...</svg>'
   */
  leadingIcon?: string;
  
  /** 
   * Trailing icon HTML content
   * @example '<svg>...</svg>'
   */
  trailingIcon?: string;
  
  /** 
   * Additional CSS classes to add to the chip
   * @example 'filter-tag category-item'
   */
  class?: string;
  
  /** 
   * Chip value attribute for identification
   */
  value?: string;
  
  /** 
   * Whether to enable ripple effect
   * @default true
   */
  ripple?: boolean;

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
  
  /**
   * Flag to make any chip variant selectable
   * @default false
   */
  selectable?: boolean;
  
  /**
   * Function called when the trailing icon is clicked
   */
  onTrailingIconClick?: (chip: ChipComponent) => void;
  
  /**
   * Function called when the chip is selected
   */
  onSelect?: (chip: ChipComponent) => void;
  
  /**
   * Function called when the chip selection changes
   */
  onChange?: (chip: ChipComponent) => void;
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
  chips?: any[];
  
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
  onChange?: (selectedValues: (string | null)[], changedValue: string | null) => void;
}

/**
 * Icon API interface for managing chip icons
 * @category Components
 */
export interface IconAPI {
  /**
   * Sets the icon HTML content
   * @param html - HTML string for the icon
   * @returns The icon API for chaining
   */
  setIcon: (html: string) => IconAPI;
  
  /**
   * Gets the current icon HTML content
   * @returns HTML string for the icon
   */
  getIcon: () => string;
  
  /**
   * Gets the icon DOM element
   * @returns The icon element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Text API interface for managing chip text
 * @category Components
 */
export interface TextAPI {
  /**
   * Sets the text content
   * @param content - Text content
   * @returns The text API for chaining
   */
  setText: (content: string) => TextAPI;
  
  /**
   * Gets the current text content
   * @returns Chip text content
   */
  getText: () => string;
  
  /**
   * Gets the text DOM element
   * @returns The text element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Chip component interface
 * @category Components
 */
export interface ChipComponent {
  /** The chip's DOM element */
  element: HTMLElement;
  
  /** API for managing chip text */
  text: TextAPI;
  
  /** API for managing chip icons */
  icon: IconAPI;
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the chip */
    enable: () => void;
    /** Disables the chip */
    disable: () => void;
    /** Checks if the chip is disabled */
    isDisabled: () => boolean;
  };
  
  /** API for managing component lifecycle */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
  
  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;
  
  /**
   * Gets the chip's value attribute
   * @returns Chip value
   */
  getValue: () => string | null;
  
  /**
   * Sets the chip's value attribute
   * @param value - New value
   * @returns The chip component for chaining
   */
  setValue: (value: string) => ChipComponent;
  
  /**
   * Enables the chip (removes disabled attribute)
   * @returns The chip component for chaining
   */
  enable: () => ChipComponent;
  
  /**
   * Disables the chip (adds disabled attribute)
   * @returns The chip component for chaining
   */
  disable: () => ChipComponent;
  
  /**
   * Checks if the chip is disabled
   * @returns True if the chip is disabled
   */
  isDisabled: () => boolean;
  
  /**
   * Sets the chip's text content
   * @param content - Text content
   * @returns The chip component for chaining
   */
  setText: (content: string) => ChipComponent;
  
  /**
   * Gets the chip's text content
   * @returns Chip text content
   */
  getText: () => string;
  
  /**
   * Sets the chip's icon (alias for setLeadingIcon)
   * @param icon - Icon HTML content
   * @returns The chip component for chaining
   */
  setIcon: (icon: string) => ChipComponent;
  
  /**
   * Gets the chip's icon HTML content
   * @returns Icon HTML
   */
  getIcon: () => string;
  
  /**
   * Sets the chip's leading icon
   * @param icon - Icon HTML content
   * @returns The chip component for chaining
   */
  setLeadingIcon: (icon: string) => ChipComponent;
  
  /**
   * Sets the chip's trailing icon
   * @param icon - Icon HTML content
   * @param onClick - Optional click handler for the trailing icon
   * @returns The chip component for chaining
   */
  setTrailingIcon: (icon: string, onClick?: (chip: ChipComponent) => void) => ChipComponent;
  
  /**
   * Checks if the chip is selected
   * @returns True if the chip is selected
   */
  isSelected: () => boolean;
  
  /**
   * Sets the chip's selected state
   * @param selected - Whether the chip should be selected
   * @returns The chip component for chaining
   */
  setSelected: (selected: boolean) => ChipComponent;
  
  /**
   * Toggles the chip's selected state
   * @returns The chip component for chaining
   */
  toggleSelected: () => ChipComponent;
  
  /**
   * Destroys the chip component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the chip
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The chip component for chaining
   */
  on: (event: string, handler: Function) => ChipComponent;
  
  /**
   * Removes an event listener from the chip
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The chip component for chaining
   */
  off: (event: string, handler: Function) => ChipComponent;
  
  /**
   * Adds CSS classes to the chip element
   * @param classes - One or more class names to add
   * @returns The chip component for chaining
   */
  addClass: (...classes: string[]) => ChipComponent;
}

/**
 * Chips component interface
 * @category Components
 */
export interface ChipsComponent {
  /** The chips container's DOM element */
  element: HTMLElement;
  
  /**
   * Adds a new chip to the chips container
   * @param chipConfig - Configuration for the chip
   * @returns The chips instance for chaining
   */
  addChip: (chipConfig: any) => ChipsComponent;
  
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
   * Selects chips by their values
   * @param values - Value or array of values to select
   * @returns The chips instance for chaining
   */
  selectByValue: (values: string | string[]) => ChipsComponent;
  
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
  on: (event: string, handler: Function) => ChipsComponent;
  
  /**
   * Removes an event listener from the chips container
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The chips instance for chaining
   */
  off: (event: string, handler: Function) => ChipsComponent;
}

/**
 * API options interface
 * @internal
 */
export interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Base component interface
 * @internal
 */
export interface BaseComponent {
  element: HTMLElement;
  getClass: (name?: string) => string;
  config: any;
  text?: TextAPI;
  icon?: IconAPI;
  disabled?: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}