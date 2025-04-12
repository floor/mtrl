// src/index.ts
/**
 * Main mtrl library exports
 * 
 * @packageDocumentation
 */

// Direct component imports
import { createElement, addClass, removeClass, hasClass, toggleClass } from './core/dom';
import createLayout from './core/layout';
import createBadge from './components/badge';
import createBottomAppBar from './components/bottom-app-bar';
import createButton from './components/button';
import createCard from './components/card';
import { 
  createCardContent, 
  createCardHeader, 
  createCardActions, 
  createCardMedia 
} from './components/card/content';
import createCarousel from './components/carousel';
import createCheckbox from './components/checkbox';
import { createChip, createChips } from './components/chips';
import createDatePicker from './components/datepicker';
import createDialog from './components/dialog';
import { createDivider } from './components/divider';
import createFab from './components/fab';
import createExtendedFab from './components/extended-fab';
import createList, { createListItem } from './components/list';
import createMenu from './components/menu';
import createNavigation, { createNavigationSystem } from './components/navigation';
import createProgress from './components/progress';
import createRadios from './components/radios';
import createSearch from './components/search';
import createSegmentedButton, { createSegment } from './components/segmented-button';
import createSheet from './components/sheet';
import createSlider from './components/slider';
import createSnackbar from './components/snackbar';
import createSelect from './components/select';
import createSwitch from './components/switch';
import createTabs, { createTab } from './components/tabs';
import createTextfield from './components/textfield';
import createTimePicker from './components/timepicker';
import createTopAppBar from './components/top-app-bar';
import createTooltip from './components/tooltip';

// Export all "create*" functions
export {
  addClass, removeClass, hasClass, toggleClass,
  createElement,
  createLayout,
  createBadge,
  createBottomAppBar,
  createButton,
  createCard,
  createCardContent, 
  createCardHeader, 
  createCardActions, 
  createCardMedia,
  createCarousel,
  createCheckbox,
  createChip,
  createChipSet,
  createDatePicker,
  createDialog,
  createDivider,
  createFab,
  createExtendedFab,
  createList,
  createListItem,
  createMenu,
  createNavigation,
  createNavigationSystem,
  createProgress,
  createRadios,
  createSearch,
  createSelect,
  createSegmentedButton,
  createSegment,
  createSheet,
  createSlider,
  createSnackbar,
  createSwitch,
  createTabs,
  createTab,
  createTextfield,
  createTimePicker,
  createTopAppBar,
  createTooltip
};

// Export all "f*" aliases
export {
  createElement as fElement,
  createLayout as fLayout,
  createBadge as fBadge,
  createBottomAppBar as fBottomAppBar,
  createButton as fButton,
  createCard as fCard,
  createCardContent as fCardContent, 
  createCardHeader as fCardHeader, 
  createCardActions as fCardActions, 
  createCardMedia as fCardMedia,
  createCarousel as fCarousel,
  createCheckbox as fCheckbox,
  createChip as fChip,
  createChips as fChips,
  createDatePicker as fDatePicker,
  createDialog as fDialog,
  createDivider as fDivider,
  createFab as fFab,
  createExtendedFab as fExtendedFab,
  createList as fList,
  createListItem as fListItem,
  createMenu as fMenu,
  createNavigation as fNavigation,
  createNavigationSystem as fNavigationSystem,
  createProgress as fProgress,
  createRadios as fRadios,
  createSearch as fSearch,
  createSelect as fSelect,
  createSegmentedButton as fSegmentedButton,
  createSegment as fSegment,
  createSheet as fSheet,
  createSlider as fSlider,
  createSnackbar as fSnackbar,
  createSwitch as fSwitch,
  createTabs as fTabs,
  createTab as fTab,
  createTextfield as fTextfield,
  createTimePicker as fTimePicker,
  createTopAppBar as fTopAppBar,
  createTooltip as fTooltip
};