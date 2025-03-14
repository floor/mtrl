// src/components/datepicker/constants.ts

/**
 * DatePicker variant types
 */
export const DATEPICKER_VARIANTS = {
  /** Displays inline with a text field above the calendar */
  DOCKED: 'docked',
  
  /** Displays as a modal dialog */
  MODAL: 'modal',
  
  /** Displays as a modal dialog with text input */
  MODAL_INPUT: 'modal-input'
};

/**
 * DatePicker view types
 */
export const DATEPICKER_VIEWS = {
  /** Calendar day selection view */
  DAY: 'day',
  
  /** Month selection view */
  MONTH: 'month',
  
  /** Year selection view */
  YEAR: 'year'
};

/**
 * DatePicker selection modes
 */
export const DATEPICKER_SELECTION_MODES = {
  /** Single date selection */
  SINGLE: 'single',
  
  /** Date range selection */
  RANGE: 'range'
};

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
 * CSS class name for today's date
 */
export const TODAY_CLASS = 'today';

/**
 * CSS class name for selected date
 */
export const SELECTED_CLASS = 'selected';

/**
 * CSS class name for dates outside the current month
 */
export const OUTSIDE_MONTH_CLASS = 'outside-month';

/**
 * CSS class for the first date in a range
 */
export const RANGE_START_CLASS = 'range-start';

/**
 * CSS class for the last date in a range
 */
export const RANGE_END_CLASS = 'range-end';

/**
 * CSS class for dates between start and end in a range
 */
export const RANGE_MIDDLE_CLASS = 'range-middle';