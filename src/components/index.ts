// src/components/index.ts
/**
 * Component library exports
 *
 * This file exports all component creators and their types.
 * Constants are NOT re-exported here to enable proper tree-shaking.
 * Import constants directly from component paths if needed.
 *
 * @packageDocumentation
 */

// ============================================================================
// Component Creators
// ============================================================================

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
export { createDivider } from "./divider";
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

// Card content components
export {
  createCardContent,
  createCardHeader,
  createCardActions,
  createCardMedia,
} from "./card/content";

// ============================================================================
// Type Exports (these are erased at compile time, zero bundle impact)
// ============================================================================

// Badge
export type { BadgeConfig, BadgeComponent } from "./badge/types";

// Bottom App Bar
export type { BottomAppBarConfig, BottomAppBar } from "./bottom-app-bar/types";

// Button
export type {
  ButtonConfig,
  ButtonComponent,
  ButtonVariant,
} from "./button/types";

// Button Group
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

// Card
export type { CardSchema } from "./card/types";

// Carousel
export type { CarouselConfig, CarouselComponent } from "./carousel/types";

// Checkbox
export type { CheckboxConfig, CheckboxComponent } from "./checkbox/types";

// Chips
export type {
  ChipConfig,
  ChipComponent,
  ChipVariant,
  ChipsConfig,
  ChipsComponent,
} from "./chips/types";

// Datepicker
export type { DatePickerConfig, DatePickerComponent } from "./datepicker/types";

// Dialog
export type { DialogConfig, DialogComponent } from "./dialog/types";

// Divider
export type { DividerConfig } from "./divider/config";
export type { DividerComponent } from "./divider/types";

// FAB
export type { FabConfig, FabComponent } from "./fab/types";

// Extended FAB
export type {
  ExtendedFabConfig,
  ExtendedFabComponent,
} from "./extended-fab/types";

// Icon Button
export type {
  IconButtonConfig,
  IconButtonComponent,
} from "./icon-button/types";

// List
export type {
  ListConfig,
  ListComponent,
  SelectEvent as ListSelectEvent,
  LoadEvent,
} from "./list/types";

// Menu
export type { MenuConfig, MenuComponent, MenuItem } from "./menu/types";

// Navigation
export type {
  NavigationConfig,
  NavigationComponent,
  NavItemConfig,
} from "./navigation/types";

// Progress
export type {
  ProgressConfig,
  ProgressComponent,
  ProgressShape,
} from "./progress/types";

// Radios
export type {
  RadiosConfig,
  RadiosComponent,
  RadioOptionConfig,
} from "./radios/types";

// Search
export type { SearchConfig, SearchComponent } from "./search/types";

// Select
export type {
  SelectConfig,
  SelectComponent,
  SelectOption,
  SelectEvent,
  SelectChangeEvent,
} from "./select/types";

// Segmented Button
export type {
  SegmentedButtonConfig,
  SegmentedButtonComponent,
} from "./segmented-button/types";

// Sheet
export type { SheetConfig, SheetComponent } from "./sheet/types";

// Slider
export type {
  SliderConfig,
  SliderComponent,
  SliderEvent,
} from "./slider/types";

// Snackbar
export type { SnackbarConfig, SnackbarComponent } from "./snackbar/types";

// Switch
export type { SwitchConfig, SwitchComponent } from "./switch/types";

// Tabs
export type {
  TabsConfig,
  TabsComponent,
  TabConfig,
  TabComponent,
} from "./tabs/types";

// Textfield
export type { TextfieldConfig, TextfieldComponent } from "./textfield/types";

// Timepicker
export type { TimePickerConfig, TimePickerComponent } from "./timepicker/types";

// Top App Bar
export type { TopAppBarConfig, TopAppBar } from "./top-app-bar/types";

// Tooltip
export type { TooltipConfig, TooltipComponent } from "./tooltip/types";
