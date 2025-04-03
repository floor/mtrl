// src/index.ts
/**
 * Main MTRL library exports with both "f*" and "create*" function naming conventions
 * 
 * This file provides:
 * 1. New "f*" prefixed functions for refactored components (recommended for new code)
 * 2. Legacy "create*" prefixed functions for backward compatibility
 * 3. Original functions for components that haven't been refactored yet
 * 
 * Currently refactored components:
 * - Badge
 * - Button
 * - Card
 * - Checkbox
 * - Chip
 * - DatePicker
 * - Dialog
 * - Divider
 * - Fab
 * - Extended-Fab
 */

// Export new "f*" named factory functions for refactored components
export { default as fBadge } from './components/badge';
export { default as fButton } from './components/button';
export { default as fCard } from './components/card';
export { 
  fCardContent,
  fCardHeader, 
  fCardActions, 
  fCardMedia 
} from './components/card/content';
export { default as fCheckbox } from './components/checkbox';
export { default as fChip } from './components/chip';
export { default as fDatePicker } from './components/datepicker';
export { default as fDialog } from './components/dialog';
export { fDivider } from './components/divider';
export { default as fFab } from './components/fab';
export { default as fExtendedFab } from './components/extended-fab';

// Export legacy functions for non-refactored components directly
export { createElement } from './core/dom/create';
export { default as createLayout } from './core/layout';
export { default as createSegmentedButton } from './components/segmented-button';
export { default as createBottomAppBar } from './components/bottom-app-bar';
export { default as createCarousel } from './components/carousel';
export { default as createChipSet } from './components/chip';
export { default as createMenu } from './components/menu';
export { default as createNavigation, createNavigationSystem } from './components/navigation';
export { default as createProgress } from './components/progress';
export { default as createRadios } from './components/radios';
export { default as createSearch } from './components/search';
export { default as createSegment } from './components/segmented-button';
export { default as createSheet } from './components/sheet';
export { default as createSlider } from './components/slider';
export { default as createSnackbar } from './components/snackbar';
export { default as createSwitch } from './components/switch';
export { default as createTabs } from './components/tabs';
export { default as createTextfield } from './components/textfield';
export { default as createTimePicker } from './components/timepicker';
export { default as createTopAppBar } from './components/top-app-bar';
export { default as createTooltip } from './components/tooltip';
export { default as createList } from './components/list';

// Export legacy "create*" functions for backward compatibility for refactored components
export * from './compatibility';