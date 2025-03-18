// src/components/datepicker/types.ts

/**
 * DatePicker variant types
 * @category Components
 */
export type DatePickerVariant = 'docked' | 'modal' | 'modal-input';

/**
 * DatePicker view types
 * @category Components
 */
export type DatePickerView = 'day' | 'month' | 'year';

/**
 * DatePicker selection mode types
 * @category Components
 */
export type DatePickerSelectionMode = 'single' | 'range';

/**
 * Day names for the calendar
 * @internal
 */
export const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month names for the calendar
 * @internal
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

/**
 * Month names abbreviated
 * @internal
 */
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Default format for displaying dates
 * @internal
 */
export const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY';

/**
 * CSS class name for today's date
 * @internal
 */
export const TODAY_CLASS = 'today';

/**
 * CSS class name for selected date
 * @internal
 */
export const SELECTED_CLASS = 'selected';

/**
 * CSS class name for dates outside the current month
 * @internal
 */
export const OUTSIDE_MONTH_CLASS = 'outside-month';

/**
 * CSS class for the first date in a range
 * @internal
 */
export const RANGE_START_CLASS = 'range-start';

/**
 * CSS class for the last date in a range
 * @internal
 */
export const RANGE_END_CLASS = 'range-end';

/**
 * CSS class for dates between start and end in a range
 * @internal
 */
export const RANGE_MIDDLE_CLASS = 'range-middle';

/**
 * Configuration interface for the DatePicker component
 * @category Components
 */
export interface DatePickerConfig {
  /** 
   * DatePicker variant that determines display style
   * @default 'docked'
   */
  variant?: DatePickerVariant | string;
  
  /** 
   * Whether the datepicker is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Initial view to display (day, month, year)
   * @default 'day'
   */
  initialView?: DatePickerView | string;
  
  /** 
   * Selection mode for the datepicker (single or range)
   * @default 'single'
   */
  selectionMode?: DatePickerSelectionMode | string;
  
  /** 
   * Initial selected date(s)
   * Accepts a Date object, Date string, or two dates for range selection
   */
  value?: Date | string | [Date | string, Date | string];
  
  /** 
   * Minimum selectable date
   */
  minDate?: Date | string;
  
  /** 
   * Maximum selectable date
   */
  maxDate?: Date | string;
  
  /** 
   * Format for displaying dates
   * @default 'MM/DD/YYYY'
   */
  dateFormat?: string;
  
  /** 
   * Label text for the datepicker
   * @example 'Select Date'
   */
  label?: string;
  
  /** 
   * Placeholder text for the input field
   * @example 'MM/DD/YYYY'
   */
  placeholder?: string;
  
  /** 
   * Additional CSS classes to add to the datepicker
   * @example 'form-field event-date'
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
   * Whether to enable animation effects
   * @default true
   */
  animate?: boolean;

  /**
   * Whether to close the picker when a date is selected
   * @default true for modal variants, false for docked
   */
  closeOnSelect?: boolean;

  /**
   * Array of dates to highlight or disable
   */
  specialDates?: Array<{
    date: Date | string;
    highlight?: boolean;
    disabled?: boolean;
    tooltip?: string;
  }>;
}

/**
 * Date object with additional properties for rendering
 * @internal
 */
export interface CalendarDate {
  /** JavaScript Date object */
  date: Date;
  
  /** Day of the month (1-31) */
  day: number;
  
  /** Whether the date is in the current month being displayed */
  isCurrentMonth: boolean;
  
  /** Whether the date is today */
  isToday: boolean;
  
  /** Whether the date is selected */
  isSelected: boolean;
  
  /** Whether the date is disabled */
  isDisabled: boolean;
  
  /** Whether the date is the first date in a range */
  isRangeStart?: boolean;
  
  /** Whether the date is the last date in a range */
  isRangeEnd?: boolean;
  
  /** Whether the date is between start and end in a range */
  isRangeMiddle?: boolean;
}

/**
 * Calendar API interface for managing calendar navigation
 * @category Components
 */
export interface CalendarAPI {
  /** Updates the calendar view to display a specific month/year */
  goToDate: (date: Date) => void;
  
  /** Moves to the next month */
  nextMonth: () => void;
  
  /** Moves to the previous month */
  prevMonth: () => void;
  
  /** Moves to the next year */
  nextYear: () => void;
  
  /** Moves to the previous year */
  prevYear: () => void;
  
  /** Switches to day selection view */
  showDayView: () => void;
  
  /** Switches to month selection view */
  showMonthView: () => void;
  
  /** Switches to year selection view */
  showYearView: () => void;
  
  /** Gets the current calendar view */
  getCurrentView: () => string;
}

/**
 * DatePicker component interface
 * @category Components
 */
export interface DatePickerComponent {
  /** The datepicker's main DOM element */
  element: HTMLElement;
  
  /** The input field DOM element */
  input: HTMLInputElement;
  
  /** API for managing calendar and selected dates */
  calendar: CalendarAPI;
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the datepicker */
    enable: () => void;
    /** Disables the datepicker */
    disable: () => void;
    /** Checks if the datepicker is disabled */
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
   * Opens the datepicker dropdown/modal
   * @returns The datepicker component for chaining
   */
  open: () => DatePickerComponent;
  
  /**
   * Closes the datepicker dropdown/modal
   * @returns The datepicker component for chaining
   */
  close: () => DatePickerComponent;
  
  /**
   * Gets the selected date(s)
   * @returns Date object, array of two Date objects for range, or null if none selected
   */
  getValue: () => Date | [Date, Date] | null;
  
  /**
   * Sets the selected date(s)
   * @param value - Date, string, or array of dates for range selection
   * @returns The datepicker component for chaining
   */
  setValue: (value: Date | string | [Date | string, Date | string]) => DatePickerComponent;
  
  /**
   * Gets the formatted date string based on the selected date(s)
   * @returns Formatted date string or empty string if none selected
   */
  getFormattedValue: () => string;
  
  /**
   * Clears the selected date(s)
   * @returns The datepicker component for chaining
   */
  clear: () => DatePickerComponent;
  
  /**
   * Enables the datepicker
   * @returns The datepicker component for chaining
   */
  enable: () => DatePickerComponent;
  
  /**
   * Disables the datepicker
   * @returns The datepicker component for chaining
   */
  disable: () => DatePickerComponent;
  
  /**
   * Sets the minimum selectable date
   * @param date - Date object or string
   * @returns The datepicker component for chaining
   */
  setMinDate: (date: Date | string) => DatePickerComponent;
  
  /**
   * Sets the maximum selectable date
   * @param date - Date object or string
   * @returns The datepicker component for chaining
   */
  setMaxDate: (date: Date | string) => DatePickerComponent;
  
  /**
   * Destroys the datepicker component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the datepicker
   * @param event - Event name ('change', 'open', 'close', etc.)
   * @param handler - Event handler function
   * @returns The datepicker component for chaining
   */
  on: (event: string, handler: Function) => DatePickerComponent;
  
  /**
   * Removes an event listener from the datepicker
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The datepicker component for chaining
   */
  off: (event: string, handler: Function) => DatePickerComponent;
}

/**
 * API options interface for withAPI function
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
  events: {
    on: (event: string, handler: Function) => any;
    off: (event: string, handler: Function) => any;
    emit: (event: string, data: any) => any;
  };
}