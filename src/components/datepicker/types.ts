// src/components/datepicker/types.ts
import type { ForwardedEventPayload } from "../../core/dom";
import type { NormalizedEvent } from "../../core/utils/mobile";

/** Value returned by the API, including complete ranges and empty selections. */
export type DatePickerValue = Date | [Date, Date] | null;

/**
 * The value as the selection mode shapes it (FLO-295): a range is a pair, a
 * single date a date; an unknown mode, either.
 */
export type DatePickerValueOf<M> = M extends "range" ? [Date, Date] | null : M extends "single" ? Date | null : DatePickerValue;

/** What setValue and `value` take: a date, a range as a pair, or as { start, end } (FLO-289). */
export type DatePickerInput = Date | string | [Date | string, Date | string] | { start: Date | string; end: Date | string };

/**
 * One shape whatever committed the value (FLO-295): a range's `value` is the
 * pair, and `rangeEndDate` its end, kept for compatibility (null otherwise).
 * The docked calendar sent the start as the value and the end apart.
 */
export interface DatePickerChangePayload<V = DatePickerValue> {
  value: V;
  rangeEndDate: Date | null;
  formattedValue: string;
  /**
   * The value as ISO 8601 text, the `value` of the `<m-datepicker>` element's
   * `change`: a date (`2026-09-10`), a `start/end` interval, or "" (FLO-320)
   */
  iso: string;
}

/** Visibility events carry the committed value, including complete ranges. */
export interface DatePickerVisibilityPayload<V = DatePickerValue> {
  value: V;
}

/** Normalized touch-end event emitted by the interactive root. */
export type DatePickerTapPayload = NormalizedEvent;

/** Horizontal swipe emitted by the interactive root. */
export interface DatePickerSwipePayload {
  direction: "left" | "right";
  deltaX: number;
  deltaY: number;
}

/** Events emitted by the picker API, calendar selections and interactive root. */
export interface DatePickerEvents<V = DatePickerValue> {
  change: (payload: DatePickerChangePayload<V>) => void;
  open: (payload: DatePickerVisibilityPayload<V>) => void;
  close: (payload: DatePickerVisibilityPayload<V>) => void;
  click: (payload: ForwardedEventPayload<MouseEvent, HTMLElement>) => void;
  keydown: (payload: ForwardedEventPayload<KeyboardEvent, HTMLElement>) => void;
  tap: (payload: DatePickerTapPayload) => void;
  swipe: (payload: DatePickerSwipePayload) => void;
}

/**
 * DatePicker variant types
 * @category Components
 */
export type DatePickerVariant = 'docked' | 'modal' | 'modal-input' | 'fullscreen';

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
export const TODAY_CLASS = 'datepicker__day--today';

/**
 * CSS class name for selected date
 * @internal
 */
export const SELECTED_CLASS = 'datepicker__day--selected';

/**
 * CSS class name for dates outside the current month
 * @internal
 */
export const OUTSIDE_MONTH_CLASS = 'datepicker__day--outside';

/**
 * CSS class for the first date in a range
 * @internal
 */
export const RANGE_START_CLASS = 'datepicker__cell--range-start';

/**
 * CSS class for the last date in a range
 * @internal
 */
export const RANGE_END_CLASS = 'datepicker__cell--range-end';

/**
 * CSS class for dates between start and end in a range
 * @internal
 */
export const RANGE_MIDDLE_CLASS = 'datepicker__cell--range';

/**
 * Configuration interface for the DatePicker component
 * @category Components
 */
export interface DatePickerConfig {
  /** Name of the committed form input. */
  name?: string;
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
  value?: DatePickerInput;

  /** The value shows and cannot change: no typing, no calendar (FLO-289). */
  readOnly?: boolean;

  /** A date is required: on the input for forms, and checkValidity() (FLO-289). */
  required?: boolean;

  /** The supporting text under the field. Default: the date format (FLO-289). */
  supportingText?: string;
  
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
   * @default false (modal selections are drafts until OK; true commits on selection)
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
export interface DatePickerComponent<V = DatePickerValue> {
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
   * A limit on 0.10.x, fixed in 1.0: a docked picker opened with `open()` from
   * a click outside it is closed again by that same click. Call `open()` once
   * the click has finished (for example from a `setTimeout`).
   * @returns The datepicker component for chaining
   */
  open: () => DatePickerComponent<V>;
  
  /**
   * Closes the datepicker dropdown/modal
   * @returns The datepicker component for chaining
   */
  close: () => DatePickerComponent<V>;
  
  /**
   * Gets the selected date(s)
   * @returns Date object, array of two Date objects for range, or null if none selected
   */
  getValue: () => V;
  
  /**
   * Sets the selected date(s). Silent: only the user's choice emits `change`
   * @param value - Date, string, or array of dates for range selection
   * @returns The datepicker component for chaining
   */
  setValue: (value: DatePickerInput) => DatePickerComponent<V>;

  /** Read-only: the value shows and cannot change (FLO-289) */
  setReadOnly: (readOnly: boolean) => DatePickerComponent<V>;

  /** Whether the picker is read-only */
  isReadOnly: () => boolean;

  /** Whether a date is required (FLO-289) */
  setRequired: (required: boolean) => DatePickerComponent<V>;

  /**
   * False when a date is required and missing. A dialog variant's input is
   * read-only, which forms do not validate.
   */
  checkValidity: () => boolean;

  /** As checkValidity(), and shows the error on the field when false */
  reportValidity: () => boolean;

  /** The supporting text; empty or null shows the date format (FLO-289) */
  setSupportingText: (text: string | null) => DatePickerComponent<V>;
  
  /**
   * Gets the formatted date string based on the selected date(s)
   * @returns Formatted date string or empty string if none selected
   */
  getFormattedValue: () => string;
  
  /**
   * Clears the selected date(s). Silent
   * @returns The datepicker component for chaining
   */
  clear: () => DatePickerComponent<V>;
  
  /**
   * Enables the datepicker
   * @returns The datepicker component for chaining
   */
  enable: () => DatePickerComponent<V>;
  
  /**
   * Disables the datepicker
   * @returns The datepicker component for chaining
   */
  disable: () => DatePickerComponent<V>;
  
  /**
   * Sets the minimum selectable date
   * @param date - Date object or string
   * @returns The datepicker component for chaining
   */
  setMinDate: (date: Date | string) => DatePickerComponent<V>;
  
  /**
   * Sets the maximum selectable date
   * @param date - Date object or string
   * @returns The datepicker component for chaining
   */
  setMaxDate: (date: Date | string) => DatePickerComponent<V>;
  
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
  on: <K extends keyof DatePickerEvents<V>>(event: K, handler: DatePickerEvents<V>[K]) => DatePickerComponent<V>;
  
  /**
   * Removes an event listener from the datepicker
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The datepicker component for chaining
   */
  off: <K extends keyof DatePickerEvents<V>>(event: K, handler: DatePickerEvents<V>[K]) => DatePickerComponent<V>;
}

/** Internal calendar view model. Dates are local civil dates, without a time. */
export interface DatePickerState {
  selectedDate: Date | null;
  rangeEndDate: Date | null;
  currentView: DatePickerView;
  currentMonth: number;
  currentYear: number;
  focusedDate: Date;
  minDate: Date | null;
  maxDate: Date | null;
  dateFormat: string;
  variant: DatePickerVariant;
  selectionMode: DatePickerSelectionMode;
  inputMode: boolean;
  prefix: string;
  id: string;
  label: string;
  specialDates: NonNullable<DatePickerConfig["specialDates"]>;
  isAllowed(date: Date): boolean;
  /** Full screen: the first month of the rendered list, and how many follow. FLO-276. */
  listStart?: Date;
  listLength?: number;
}
