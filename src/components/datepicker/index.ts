// src/components/datepicker/index.ts
/**
 * DatePicker Component Module
 * 
 * A Material Design 3 date picker implementation that provides
 * a visual calendar for selecting dates, with support for various
 * selection modes, date ranges, and formatting options.
 * 
 * @module components/datepicker
 * @category Components
 */

// Export with both new and legacy function names
export { default, default as fDatePicker, default as createDatePicker } from './datepicker'

// Export types
export type { 
  DatePickerConfig, 
  DatePickerComponent,
  DatePickerVariant,
  DatePickerView,
  DatePickerSelectionMode
} from './types'

// Export constants
export { 
  DEFAULT_DATE_FORMAT 
} from './types'