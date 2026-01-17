// src/components/index.ts
/**
 * Component library exports
 *
 * This file re-exports all components and their associated types, constants,
 * and utilities from the mtrl library. Both named exports and default exports
 * are handled to provide a consistent public API while maintaining tree-shaking
 * compatibility.
 *
 * @packageDocumentation
 */

// Export list types with explicit naming for the ambiguous SelectEvent
export {
  LIST_DEFAULTS,
  LIST_TYPES,
  LIST_SELECTION_MODES,
  LIST_EVENTS,
  LIST_SCROLL_POSITIONS,
  LIST_CLASSES,
} from "./list/constants";

export type {
  ListConfig,
  ListComponent,
  SelectEvent as ListSelectEvent, // Rename to avoid collision
  LoadEvent,
} from "./list/types";

// Export button group types and constants
export {
  BUTTON_GROUP_VARIANTS,
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_GROUP_DENSITY,
  BUTTON_GROUP_EVENTS,
  BUTTON_GROUP_DEFAULTS,
  BUTTON_GROUP_CLASSES,
  BUTTON_GROUP_HEIGHTS,
  BUTTON_GROUP_RADII,
} from "./button-group/constants";

export type {
  ButtonGroupConfig,
  ButtonGroupComponent,
  ButtonGroupItemConfig,
  ButtonGroupEvent,
  ButtonGroupEventType,
  ButtonGroupVariant,
  ButtonGroupOrientation,
  ButtonGroupDensity,
} from "./button-group/types";

// Export select types with explicit naming
export {
  SELECT_VARIANTS,
  SELECT_PLACEMENT,
  SELECT_INTERACTION,
  SELECT_EVENTS,
  SELECT_ICONS,
  SELECT_DEFAULTS,
  SELECT_CLASSES,
} from "./select/constants";

export type {
  SelectConfig,
  SelectComponent,
  SelectOption,
  SelectEvent, // Keep the original name since select is more commonly used
  SelectChangeEvent,
} from "./select/types";

// Re-export all named exports from components
export * from "./badge";
export * from "./bottom-app-bar";
export * from "./button";
export * from "./button-group";
export * from "./card";
export * from "./carousel";
export * from "./checkbox";
export * from "./chips";
export * from "./datepicker";
export * from "./dialog";
export * from "./fab";
export * from "./extended-fab";
export * from "./icon-button";
export * from "./menu";
export * from "./navigation";

// Progress - explicit exports to avoid bundler issues with re-exports
export {
  PROGRESS_VARIANTS,
  PROGRESS_SHAPES,
  PROGRESS_EVENTS,
  PROGRESS_DEFAULTS,
  PROGRESS_CLASSES,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS,
} from "./progress/constants";
export type {
  ProgressConfig,
  ProgressComponent,
  ProgressShape,
} from "./progress/types";

export * from "./radios";
export * from "./search";
export * from "./segmented-button";
export * from "./sheet";
export * from "./slider";
export * from "./snackbar";
export * from "./switch";
export * from "./tabs";
export * from "./textfield";
export * from "./timepicker";
export * from "./top-app-bar";
export * from "./tooltip";

// Explicitly re-export divider items to avoid naming collisions
export { createDivider } from "./divider";
export type { DividerConfig } from "./divider/config";
export type { DividerComponent } from "./divider/types";

// Re-export card content components
export {
  createCardContent,
  createCardHeader,
  createCardActions,
  createCardMedia,
} from "./card/content";

// Explicitly re-export default exports from components
export { default as createBadge } from "./badge";
export { default as createBottomAppBar } from "./bottom-app-bar";
export { default as createButton } from "./button";
export { default as createButtonGroup } from "./button-group";
export { default as createCard } from "./card";
export { default as createCarousel } from "./carousel";
export { default as createCheckbox } from "./checkbox";
export { createChip, createChips } from "./chips";
export { default as createDatePicker } from "./datepicker";
export { default as createDialog } from "./dialog";
export { default as createFab } from "./fab";
export { default as createExtendedFab } from "./extended-fab";
export { default as createIconButton } from "./icon-button";
export { default as createList } from "./list";
export { default as createMenu } from "./menu";
export { default as createNavigation } from "./navigation";
export { default as createNavigationSystem } from "./navigation/system";
export { default as createProgress } from "./progress";
export { default as createRadios } from "./radios";
export { default as createSearch } from "./search";
export { default as createSelect } from "./select";
export { default as createSegmentedButton } from "./segmented-button";
export { createSegment } from "./segmented-button/segment";
export { default as createSheet } from "./sheet";
export { default as createSlider } from "./slider";
export { default as createSnackbar } from "./snackbar";
export { default as createSwitch } from "./switch";
export { default as createTabs } from "./tabs";
export { createTab } from "./tabs/tab";
export { default as createTextfield } from "./textfield";
export { default as createTimePicker } from "./timepicker";
export { default as createTopAppBar } from "./top-app-bar";
export { default as createTooltip } from "./tooltip";
