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
  INPUT: 'datepicker__input',
  /** Class for the calendar container */
  CALENDAR: 'datepicker__calendar',
  /** Class for the header section */
  HEADER: 'datepicker__header',
  /** Class for the month/year navigation */
  NAVIGATION: 'datepicker__navigation',
  /** Class for the day names row */
  WEEKDAYS: 'datepicker__weekdays',
  /** Class for the days grid */
  DAYS: 'datepicker__days',
  /** Class for individual day cells */
  DAY: 'datepicker__day',
  /** Class for today's date */
  TODAY: 'datepicker__day--today',
  /** Class for selected date */
  SELECTED: 'datepicker__day--selected',
  /** Class for disabled dates */
  DISABLED: 'datepicker__day--disabled',
  /** Class for dates outside the current month */
  OUTSIDE_MONTH: 'datepicker__day--outside',
  /** Class for first date in a range */
  RANGE_START: 'datepicker__cell--range-start',
  /** Class for last date in a range */
  RANGE_END: 'datepicker__cell--range-end',
  /** Class for dates between start and end in a range */
  RANGE_MIDDLE: 'datepicker__cell--range'
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

/** Internal SVG assets; accessible names are on their buttons. */
export const DATEPICKER_ICONS = {
  calendar: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM5 10h14v10H5V10Zm0-4h14v2H5V6Zm2 6h4v4H7v-4Z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="m3 17.25 11.06-11.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04l-1.83 1.83-3.75-3.75 1.83-1.83a1 1 0 0 1 1.41 0l2.34 2.34a1 1 0 0 1 0 1.41Z"/></svg>',
  previous: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="m15.4 7.4-1.4-1.4-6 6 6 6 1.4-1.4-4.6-4.6Z"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="m8.6 7.4 1.4-1.4 6 6-6 6-1.4-1.4 4.6-4.6Z"/></svg>',
} as const;
