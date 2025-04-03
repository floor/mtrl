// index.ts
/**
 * Main MTRL library exports
 * 
 * Includes both legacy "create*" functions and new "f*" functions for refactored components.
 * The transition to "f*" naming is being done incrementally.
 * 
 * @see src/FUNCTION_NAMING.md for details on the naming convention change
 */

// Import all functions - both legacy and new
import {
  // Legacy functions (all components)
  createLayout,
  createElement,
  createBadge,
  createBottomAppBar,
  createButton,
  createDatePicker,
  createFab,
  createExtendedFab,
  createSegmentedButton,
  createCard,
  createCarousel,
  createCheckbox,
  createChip,
  createChipSet,
  createDialog,
  createDivider,
  createList,
  createMenu,
  createNavigation,
  createNavigationSystem,
  createProgress,
  createRadios,
  createSearch,
  createSheet,
  createSlider,
  createSnackbar,
  createTabs,
  createTextfield,
  createTimePicker,
  createTooltip,
  createTopAppBar,
  createSwitch,
  
  // New functions (refactored components only)
  fBadge,
  fButton,
  fCard,
  fCardContent,
  fCardHeader,
  fCardActions,
  fCardMedia,
  fDialog,
  fDivider,
  fFab,
  fExtendedFab
} from './src/index.js';

// Export all functions - both legacy and new
export {
  // Legacy functions (all components)
  createLayout,
  createElement,
  createBadge,
  createBottomAppBar,
  createButton,
  createDatePicker,
  createFab,
  createExtendedFab,
  createSegmentedButton,
  createCard,
  createCarousel,
  createCheckbox,
  createChip,
  createChipSet,
  createDialog,
  createDivider,
  createList,
  createMenu,
  createNavigation,
  createNavigationSystem,
  createProgress,
  createRadios,
  createSearch,
  createSheet,
  createSlider,
  createSnackbar,
  createTabs,
  createTextfield,
  createTimePicker,
  createTooltip,
  createTopAppBar,
  createSwitch,
  
  // New functions (refactored components only)
  fBadge,
  fButton,
  fCard,
  fCardContent,
  fCardHeader,
  fCardActions,
  fCardMedia,
  fDialog,
  fDivider,
  fFab,
  fExtendedFab
};
