// src/components/timePicker/types.ts

/**
 * Time picker display type
 * @enum {string}
 */
export enum TIME_PICKER_TYPE {
  /** Clock dial-based time picker */
  DIAL = 'dial',
  /** Text input-based time picker */
  INPUT = 'input'
}

/**
 * Time picker orientation
 * @enum {string}
 */
export enum TIME_PICKER_ORIENTATION {
  /** Vertical layout (default on mobile) */
  VERTICAL = 'vertical',
  /** Horizontal layout */
  HORIZONTAL = 'horizontal'
}

/**
 * Time format (12-hour or 24-hour)
 * @enum {string}
 */
export enum TIME_FORMAT {
  /** 12-hour format with AM/PM */
  AMPM = '12h',
  /** 24-hour format */
  MILITARY = '24h'
}

/**
 * Period of day for 12-hour format
 * @enum {string}
 */
export enum TIME_PERIOD {
  /** Morning */
  AM = 'AM',
  /** Afternoon/Evening */
  PM = 'PM'
}

/**
 * Configuration interface for the TimePicker component
 * @category Components
 */
export interface TimePickerConfig {
  /**
   * Initial time value in 24-hour format (HH:MM)
   * @example '14:30'
   */
  value?: string;

  /**
   * Type of time picker to display
   * @default TIME_PICKER_TYPE.DIAL
   */
  type?: TIME_PICKER_TYPE;

  /**
   * Time format to use (12h or 24h)
   * @default TIME_FORMAT.AMPM
   */
  format?: TIME_FORMAT;

  /**
   * Layout orientation for the time picker
   * @default TIME_PICKER_ORIENTATION.VERTICAL
   */
  orientation?: TIME_PICKER_ORIENTATION;

  /**
   * Title text for the time picker
   * @example 'Select departure time'
   */
  title?: string;

  /**
   * Whether to show seconds selector
   * @default false
   */
  showSeconds?: boolean;

  /**
   * Additional CSS classes to add to the time picker
   * @example 'custom-picker dark-theme'
   */
  class?: string;

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
   * Whether to close the picker when time is selected
   * @default true
   */
  closeOnSelect?: boolean;

  /**
   * Minimum selectable time in 24-hour format (HH:MM)
   * @example '09:00'
   */
  minTime?: string;

  /**
   * Maximum selectable time in 24-hour format (HH:MM)
   * @example '18:00'
   */
  maxTime?: string;

  /**
   * Step interval for minute selection in minutes
   * @default 1
   */
  minuteStep?: number;

  /**
   * Step interval for second selection in seconds
   * @default 1
   */
  secondStep?: number;

  /**
   * Custom text for cancel button
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Custom text for confirm button
   * @default 'OK'
   */
  confirmText?: string;

  /**
   * Whether the time picker is initially visible (for inline mode)
   * @default false
   */
  isOpen?: boolean;

  /**
   * CSS selector or HTMLElement to append the time picker to
   * @default document.body
   */
  container?: string | HTMLElement;

  /**
   * Custom icon for the clock button
   */
  clockIcon?: string;

  /**
   * Custom icon for the keyboard button
   */
  keyboardIcon?: string;

  /**
   * Callback when time is changed
   */
  onChange?: (time: string) => void;

  /**
   * Callback when time picker is opened
   */
  onOpen?: () => void;

  /**
   * Callback when time picker is closed
   */
  onClose?: () => void;

  /**
   * Callback when time is confirmed
   */
  onConfirm?: (time: string) => void;

  /**
   * Callback when time picker is canceled
   */
  onCancel?: () => void;
}

/**
 * Time value object
 * @category Components
 */
export interface TimeValue {
  /** Hours (0-23) */
  hours: number;
  /** Minutes (0-59) */
  minutes: number;
  /** Seconds (0-59), optional */
  seconds?: number;
  /** AM/PM for 12-hour format */
  period?: TIME_PERIOD;
}

/**
 * TimePicker component interface
 * @category Components
 */
export interface TimePickerComponent {
  /** The time picker's container DOM element */
  element: HTMLElement;

  /** Modal container element */
  modalElement: HTMLElement;

  /** Dialog container element */
  dialogElement: HTMLElement;

  /** Whether the time picker is currently open */
  isOpen: boolean;

  /**
   * Opens the time picker
   * @returns The time picker component for chaining
   */
  open: () => TimePickerComponent;

  /**
   * Closes the time picker
   * @returns The time picker component for chaining
   */
  close: () => TimePickerComponent;

  /**
   * Toggles the time picker open/closed state
   * @returns The time picker component for chaining
   */
  toggle: () => TimePickerComponent;

  /**
   * Gets the current time value
   * @returns Current time string in 24-hour format (HH:MM or HH:MM:SS)
   */
  getValue: () => string;

  /**
   * Gets the current time as a TimeValue object
   * @returns Current time object with hours, minutes, seconds, and period
   */
  getTimeObject: () => TimeValue;

  /**
   * Sets the time value
   * @param time - Time string in 24-hour format (HH:MM or HH:MM:SS)
   * @returns The time picker component for chaining
   */
  setValue: (time: string) => TimePickerComponent;

  /**
   * Sets the time picker type (dial or input)
   * @param type - Time picker type
   * @returns The time picker component for chaining
   */
  setType: (type: TIME_PICKER_TYPE) => TimePickerComponent;

  /**
   * Gets the current time picker type
   * @returns Current time picker type
   */
  getType: () => TIME_PICKER_TYPE;

  /**
   * Sets the time format (12h or 24h)
   * @param format - Time format
   * @returns The time picker component for chaining
   */
  setFormat: (format: TIME_FORMAT) => TimePickerComponent;

  /**
   * Gets the current time format
   * @returns Current time format
   */
  getFormat: () => TIME_FORMAT;

  /**
   * Sets the time picker orientation
   * @param orientation - Time picker orientation
   * @returns The time picker component for chaining
   */
  setOrientation: (orientation: TIME_PICKER_ORIENTATION) => TimePickerComponent;

  /**
   * Gets the current time picker orientation
   * @returns Current time picker orientation
   */
  getOrientation: () => TIME_PICKER_ORIENTATION;

  /**
   * Sets the time picker title
   * @param title - Title text
   * @returns The time picker component for chaining
   */
  setTitle: (title: string) => TimePickerComponent;

  /**
   * Gets the current time picker title
   * @returns Current title text
   */
  getTitle: () => string;

  /**
   * Destroys the time picker component and cleans up resources
   */
  destroy: () => void;

  /**
   * Adds an event listener to the time picker
   * @param event - Event name ('change', 'open', 'close', etc.)
   * @param handler - Event handler function
   * @returns The time picker component for chaining
   */
  on: (event: string, handler: Function) => TimePickerComponent;

  /**
   * Removes an event listener from the time picker
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The time picker component for chaining
   */
  off: (event: string, handler: Function) => TimePickerComponent;
}