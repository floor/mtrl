// src/components/datepicker/constants.ts

/**
 * DatePicker variants
 */
export const DATEPICKER_VARIANTS = {
  /** Docked datepicker appears inline on the page */
  DOCKED: 'docked',
  /** Modal datepicker appears in a dialog overlay */
  MODAL: 'modal',
  /** Modal with input field for entering dates */
  MODAL_INPUT: 'modal-input'
} as const;

/**
 * DatePicker views
 */
export const DATEPICKER_VIEWS = {
  /** Daily calendar grid view */
  DAY: 'day',
  /** Month selection view */
  MONTH: 'month',
  /** Year selection view */
  YEAR: 'year'
} as const;

/**
 * DatePicker selection modes
 */
export const DATEPICKER_SELECTION_MODES = {
  /** Select a single date */
  SINGLE: 'single',
  /** Select a date range */
  RANGE: 'range'
} as const;

/**
 * Day names for the calendar
 */
export const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month names for the calendar
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

/**
 * Month names abbreviated
 */
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Default format for displaying dates
 */
export const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY';

/**
 * DatePicker CSS class names
 */
export const DATEPICKER_CLASSES = {
  /** Root container class */
  ROOT: 'datepicker',
  /** Class for the input field */
  INPUT: 'datepicker-input',
  /** Class for the calendar container */
  CALENDAR: 'datepicker-calendar',
  /** Class for the header section */
  HEADER: 'datepicker-header',
  /** Class for the month/year navigation */
  NAVIGATION: 'datepicker-navigation',
  /** Class for the day names row */
  WEEKDAYS: 'datepicker-weekdays',
  /** Class for the days grid */
  DAYS: 'datepicker-days',
  /** Class for individual day cells */
  DAY: 'datepicker-day',
  /** Class for today's date */
  TODAY: 'today',
  /** Class for selected date */
  SELECTED: 'selected',
  /** Class for disabled dates */
  DISABLED: 'disabled',
  /** Class for dates outside the current month */
  OUTSIDE_MONTH: 'outside-month',
  /** Class for first date in a range */
  RANGE_START: 'range-start',
  /** Class for last date in a range */
  RANGE_END: 'range-end',
  /** Class for dates between start and end in a range */
  RANGE_MIDDLE: 'range-middle'
} as const;

/**
 * DatePicker events
 */
export const DATEPICKER_EVENTS = {
  /** Fired when the selected date changes */
  CHANGE: 'change',
  /** Fired when the datepicker opens */
  OPEN: 'open',
  /** Fired when the datepicker closes */
  CLOSE: 'close',
  /** Fired when a day is clicked/focused */
  SELECT: 'select',
  /** Fired when the view changes (day/month/year) */
  VIEW_CHANGE: 'viewChange'
} as const;