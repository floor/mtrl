// src/compatibility.ts
/**
 * Compatibility layer for legacy "create*" function names
 * 
 * This file provides backward compatibility by mapping the new "f*" functions 
 * to their original "create*" names. This is done through a simple re-export approach.
 * 
 * Currently only includes components that have been refactored:
 * - Badge
 * - Button
 * - Card
 * - Checkbox
 * - Chip & ChipSet
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

// Re-export with legacy names (only for refactored components)
export { default as createBadge } from './components/badge';
export { default as createBottomAppBar } from './components/bottom-app-bar';
export { default as createButton } from './components/button';
export { default as createCard } from './components/card';
export { default as createCheckbox } from './components/checkbox';
export { default as createChip, fChipSet as createChipSet } from './components/chip';
export { default as createDatePicker } from './components/datepicker';

// Import new card content functions and re-export with legacy names
import { 
  fCardContent, 
  fCardHeader, 
  fCardActions, 
  fCardMedia 
} from './components/card/content';

export { 
  fCardContent as createCardContent, 
  fCardHeader as createCardHeader, 
  fCardActions as createCardActions, 
  fCardMedia as createCardMedia 
};

export { default as createDialog } from './components/dialog';
export { fDivider as createDivider } from './components/divider/divider';
export { default as createFab } from './components/fab';
export { default as createExtendedFab } from './components/extended-fab';

// Import list components and re-export with legacy names
import { fList, fListItem } from './components/list';
export { fList as createList, fListItem as createListItem };

// Import menu component and re-export with legacy name
import { fMenu } from './components/menu';
export { fMenu as createMenu };

// Import switch component and re-export with legacy name
import { fSwitch } from './components/switch';
export { fSwitch as createSwitch };

// Import textfield component and re-export with legacy name
import { fTextfield } from './components/textfield';
export { fTextfield as createTextfield };

// Import timepicker component and re-export with legacy name
import { fTimePicker } from './components/timepicker';
export { fTimePicker as createTimePicker };

// Import top app bar component and re-export with legacy name
import { fTopAppBar } from './components/top-app-bar';
export { fTopAppBar as fTopAppBar };

// Import tooltip component and re-export with legacy name
import { fTooltip } from './components/tooltip';
export { fTooltip as createTooltip };

// Import progress component and re-export with legacy name
import { fProgress } from './components/progress';
export { fProgress as createProgress };

// Import radios component and re-export with legacy name
import { fRadios } from './components/radios';
export { fRadios as createRadios };

// Import search component and re-export with legacy name
import { fSearch } from './components/search';
export { fSearch as createSearch };

// Import segmented button components and re-export with legacy names
import { fSegmentedButton, fSegment } from './components/segmented-button';
export { fSegmentedButton as createSegmentedButton, fSegment as createSegment };

// Import sheet component and re-export with legacy name
import { fSheet } from './components/sheet';
export { fSheet as createSheet };

// Import slider component and re-export with legacy name
import { fSlider } from './components/slider';
export { fSlider as createSlider };

// Import snackbar component and re-export with legacy name
import { fSnackbar } from './components/snackbar';
export { fSnackbar as createSnackbar };

// Import tabs components and re-export with legacy names
import { fTabs, fTab } from './components/tabs';
export { fTabs as createTabs, fTab as createTab };