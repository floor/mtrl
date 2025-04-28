// src/index.ts
/**
 * Main mtrl library exports
 * 
 * @packageDocumentation
 */

// Direct component imports
import { createElement, addClass, removeClass, hasClass, toggleClass } from './core/dom';
import { throttle, debounce, once } from './core/utils';

import { createGestureManager } from './core';
import createLayout from './core/layout';
import { createJsxLayout, h, Fragment } from './core/layout/jsx';
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
  throttle, debounce, once,
  createGestureManager,
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
  createChips,
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

export * from './constants';

export const jsx = h;
export const jsxs = h;
export const jsxDEV = h;


