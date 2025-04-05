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
 * - List
 * - Menu
 * - Progress
 * - Radios
 * - Search
 * - Segmented Button
 * - Sheet
 * - Slider
 * - Snackbar
 * - Switch
 * - Tabs
 * - Textfield
 * - TimePicker
 * - TopAppBar
 * - Tooltip
 */

// Export new "f*" named factory functions for refactored components
export { default as fBadge } from './components/badge';
export { default as fButton } from './components/button';
export { default as fBottomAppBar } from './components/bottom-app-bar';
export { default as fCard } from './components/card';
export { fCardContent,fCardHeader, fCardActions, fCardMedia } from './components/card/content';
export { default as fCheckbox } from './components/checkbox';
export { default as fChip, fChipSet } from './components/chip';
export { default as fDatePicker } from './components/datepicker';
export { default as fDialog } from './components/dialog';
export { fDivider } from './components/divider';
export { default as fFab } from './components/fab';
export { default as fExtendedFab } from './components/extended-fab';
export { default as fList, fListItem } from './components/list';
export { default as fMenu } from './components/menu';
export { default as fSwitch } from './components/switch';
export { default as fTextfield } from './components/textfield';
export { default as fTimePicker } from './components/timepicker';
export { default as fTopAppBar } from './components/top-app-bar';
export { default as fTooltip } from './components/tooltip';
export { default as fProgress } from './components/progress';
export { default as fRadios } from './components/radios';
export { default as fSearch } from './components/search';
export { default as fSegmentedButton, fSegment } from './components/segmented-button';
export { default as fSheet } from './components/sheet';
export { default as fSlider } from './components/slider';
export { default as fSnackbar } from './components/snackbar';
export { default as fTabs, fTab } from './components/tabs';

// Export legacy functions for non-refactored components directly
export { createElement } from './core/dom/create';
export { default as createLayout } from './core/layout';
export { default as fLayout } from './core/layout';
export { default as fCarousel } from './components/carousel';
export { default as createNavigation, createNavigationSystem } from './components/navigation';

// Export legacy "create*" functions for backward compatibility for refactored components
export * from './compatibility';
