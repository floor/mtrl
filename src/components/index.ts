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
export { default as createBottomSheet } from "./bottom-sheet";
export { default as createSideSheet } from "./side-sheet";
export { default as createButton } from "./button";
export { default as createButtonGroup } from "./button-group";
export { default as createCard } from "./card";
export { default as createCarousel } from "./carousel";
export { default as createCheckbox } from "./checkbox";
export { createAssistChip, createFilterChip, createInputChip, createSuggestionChip, createChips } from "./chips";
export { default as createDatePicker } from "./datepicker";
export { default as createDialog } from "./dialog";
export { createDivider } from "./divider";
export { default as createDrawer } from "./drawer";
export { default as createFab } from "./fab";
export { default as createFabMenu } from "./fab-menu";
export { default as createExtendedFab } from "./extended-fab";
export { default as createIconButton } from "./icon-button";
export { default as createList } from "./list";
export { default as createMenu } from "./menu";
export { default as createNavigationBar } from "./navigation-bar";
export type { NavigationBarConfig, NavigationBarComponent, NavigationBarItemConfig, NavigationBarItemLayout, NavigationBarSelectEvent, NavigationBarEvents } from "./navigation-bar/types";
export { default as createNavigationRail } from "./navigation-rail";
export type { NavigationRailConfig, NavigationRailComponent, NavigationRailItemConfig, NavigationRailSelectEvent, NavigationRailEvents } from "./navigation-rail/types";

export { default as createProgress } from "./progress";
export { default as createLoadingIndicator } from "./loading-indicator";
export { default as createSplitButton } from "./split-button";
export { default as createRadios } from "./radios";
export { default as createSearch } from "./search";
export { default as createSelect } from "./select";
export { default as createSlider } from "./slider";
export { default as createSnackbar } from "./snackbar";
export { clearSnackbars } from "./snackbar";
export { default as createSwitch } from "./switch";
export { default as createTabs } from "./tabs";
export { createTab } from "./tabs/tab";
export { default as createTextField } from "./textfield";
export { default as createTimePicker } from "./timepicker";
export { default as createToolbar } from "./toolbar";
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
export type { BadgeConfig, BadgeComponent, BadgeVariant } from "./badge/types";

// Bottom App Bar
export type {
  BottomAppBarConfig,
  BottomAppBarComponent,
} from "./bottom-app-bar/types";
export type {
  BottomSheetConfig,
  BottomSheetComponent,
  BottomSheetVariant,
  BottomSheetState,
  BottomSheetStateEvent,
  BottomSheetEventHandlers,
} from "./bottom-sheet/types";
export type {
  SideSheetConfig,
  SideSheetComponent,
  SideSheetVariant,
  SideSheetPosition,
  SideSheetEventHandlers,
} from "./side-sheet/types";

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
export type {
  CardConfig,
  CardVariant,
} from "./card/types";

// Carousel
export type { CarouselConfig, CarouselComponent, CarouselVariant } from "./carousel/types";

// Checkbox
export type { CheckboxConfig, CheckboxComponent } from "./checkbox/types";

// Chips
export type {
  ChipConfig,
  ChipComponent,
  ChipType,
  ChipEvents,
  ChipChangePayload,
  AssistChipConfig,
  FilterChipConfig,
  InputChipConfig,
  SuggestionChipConfig,
  ChipsConfig,
  ChipsComponent,
} from "./chips/types";

// Datepicker
export type { DatePickerConfig, DatePickerComponent, DatePickerVariant } from "./datepicker/types";

// Dialog
export type { DialogConfig, DialogComponent } from "./dialog/types";

// Drawer
export type {
  DrawerConfig,
  DrawerComponent,
  DrawerVariant,
  DrawerPosition,
  DrawerItemConfig,
  DrawerSelectEvent,
} from "./drawer/types";

// Divider
export type { DividerConfig } from "./divider/config";
export type { DividerComponent } from "./divider/types";

// FAB
export type { FabConfig, FabComponent, FabVariant } from "./fab/types";

// Extended FAB
export type {
  ExtendedFabConfig,
  ExtendedFabComponent,
  ExtendedFabVariant,
} from "./extended-fab/types";

// Icon Button
export type {
  IconButtonConfig,
  IconButtonComponent,
} from "./icon-button/types";
export type { IconButtonVariant } from "./icon-button/constants";

// List
export type {
  ListConfig,
  ListItem,
  ListSlot,
  ListComponent,
  SelectEvent as ListSelectEvent,
  LoadEvent,
} from "./list/types";

// Menu
export type { MenuConfig, MenuVariant, MenuComponent, MenuItem } from "./menu/types";

// Split button
export type {
  SplitButtonConfig,
  SplitButtonComponent,
  SplitButtonVariant,
} from "./split-button/types";

// Loading indicator
export type {
  LoadingIndicatorConfig,
  LoadingIndicatorComponent,
} from "./loading-indicator/types";

// Progress
export type {
  ProgressConfig,
  ProgressVariant,
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
export type { SearchConfig, SearchComponent, SearchVariant } from "./search/types";

// Select
export type {
  SelectConfig,
  SelectVariant,
  SelectComponent,
  SelectOption,
  SelectEvent,
  SelectChangeEvent,
} from "./select/types";


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
  TabsVariant,
  TabsComponent,
  TabConfig,
  TabComponent,
} from "./tabs/types";

// TextField
export type {
  TextFieldConfig,
  TextFieldVariant,
  TextFieldComponent,
} from "./textfield/types";

// Timepicker
export type { TimePickerConfig, TimePickerComponent } from "./timepicker/types";

// FAB menu
export type { FabMenuConfig, FabMenuComponent, FabMenuEvents, FabMenuItem } from "./fab-menu/types";

// Toolbar
export type {
  ToolbarConfig,
  ToolbarComponent,
  ToolbarEvents,
  ToolbarItem,
} from "./toolbar/types";
export type { ToolbarVariant } from "./toolbar/constants";

// Top App Bar
export type {
  TopAppBarConfig,
  TopAppBarComponent,
} from "./top-app-bar/types";

// Tooltip
export type { TooltipConfig, TooltipVariant, TooltipComponent } from "./tooltip/types";
