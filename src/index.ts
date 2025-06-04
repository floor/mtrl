// src/index.ts
/**
 * Main mtrl library exports
 * 
 * @packageDocumentation
 */

export * from './components';
export * from './core';

// Import from core
import { 
  addClass, removeClass, hasClass, toggleClass,
  throttle, debounce, once, 
  PREFIX,
  setComponentDefaults,
  getComponentDefaults,
  setGlobalDefaults,
  clearGlobalDefaults
} from './core';

import { createLayout } from './core/layout';

// Export all "create*" functions
export {
  addClass, removeClass, hasClass, toggleClass,
  throttle, debounce, once,
  createLayout,
  PREFIX,
  // Global configuration functions
  setComponentDefaults,
  getComponentDefaults,
  setGlobalDefaults,
  clearGlobalDefaults
};

import { createJsxLayout, h, Fragment } from './core/layout/jsx';

// Export constants individually to avoid naming conflicts
export { 
  // Badge related constants
  BADGE_VARIANTS,
  BADGE_COLORS,
  BADGE_POSITIONS,
  BADGE_MAX_CHARACTERS,

  // Button related constants
  BUTTON_VARIANTS,
  BUTTON_TYPES,
  BUTTON_CLASSES,
  DEFAULT_RIPPLE_CONFIG,
  
  // Card related constants
  CARD_VARIANTS,
  CARD_ELEVATIONS,
  CARD_WIDTHS,
  CARD_ASPECT_RATIOS,
  
  // Checkbox related constants
  CHECKBOX_VARIANTS,
  CHECKBOX_LABEL_POSITION,
  
  // Chip related constants
  CHIP_VARIANTS,
  CHIP_EVENTS,
  CHIPS_EVENTS,
  
  // Datepicker related constants
  DATEPICKER_VARIANTS,
  DATEPICKER_VIEWS,
  DATEPICKER_SELECTION_MODES,
  DAY_NAMES,
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  DEFAULT_DATE_FORMAT,
  
  // Dialog related constants
  DIALOG_SIZES,
  DIALOG_ANIMATIONS,
  DIALOG_FOOTER_ALIGNMENTS,
  DIALOG_BUTTON_VARIANTS,
  DEFAULT_CONFIRM_BUTTON_TEXT,
  DEFAULT_CANCEL_BUTTON_TEXT,
  
  // FAB related constants
  FAB_VARIANTS,
  FAB_SIZES,
  FAB_POSITIONS,
  
  // Sheet related constants
  SHEET_VARIANTS,
  SHEET_POSITIONS,
  
  // Tab related constants 
  TAB_VARIANTS,
  TAB_STATES,
  TABS_EVENTS,
  
  // Textfield related constants
  TEXTFIELD_VARIANTS,
  TEXTFIELD_SIZES
} from './constants';

export const jsx = h;
export const jsxs = h;
export const jsxDEV = h;


