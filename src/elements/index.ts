// src/elements/index.ts
/**
 * The web component layer: each component as a custom element.
 *
 * Importing registers nothing and touches no DOM, so this module is safe on a
 * server. In the browser, import the CSS (`mtrl/elements/css` or one
 * component's `mtrl/elements/css/<name>`), then call a `define*` function or
 * `defineAll()`.
 *
 * @module elements
 */

import type { DefineOptions } from "./define";
import { buttonElement, defineButton } from "./button";
import { switchElement, defineSwitch } from "./switch";
import { tabsElement, tabDeclaration, defineTabs } from "./tabs";
import { progressElement, defineProgress } from "./progress";
import { loadingIndicatorElement, defineLoadingIndicator } from "./loading-indicator";
import { badgeElement, defineBadge } from "./badge";
import { dividerElement, defineDivider } from "./divider";
import { iconButtonElement, defineIconButton } from "./icon-button";
import { fabElement, defineFab } from "./fab";
import { extendedFabElement, defineExtendedFab } from "./extended-fab";
import { checkboxElement, defineCheckbox } from "./checkbox";
import { sliderElement, defineSlider } from "./slider";
import { textfieldElement, defineTextfield } from "./textfield";
import { radiosElement, radioDeclaration, defineRadios } from "./radios";
import { navigationRailElement, navigationRailItemDeclaration, defineNavigationRail } from "./navigation-rail";
import { drawerElement, drawerItemDeclaration, defineDrawer } from "./drawer";
import { topAppBarElement, defineTopAppBar } from "./top-app-bar";
import { bottomAppBarElement, defineBottomAppBar } from "./bottom-app-bar";
import { buttonGroupElement, buttonGroupItemDeclaration, defineButtonGroup } from "./button-group";
import { chipsElement, chipDeclaration, defineChips } from "./chips";
import { listElement, listItemDeclaration, defineList } from "./list";
import { cardElement, defineCard } from "./card";
import { carouselElement, carouselItemDeclaration, defineCarousel } from "./carousel";
import { menuElement, menuItemDeclaration, defineMenu } from "./menu";
import { fabMenuElement, fabMenuItemDeclaration, defineFabMenu } from "./fab-menu";
import { selectElement, selectOptionDeclaration, defineSelect } from "./select";
import { splitButtonElement, defineSplitButton } from "./split-button";
import { tooltipElement, defineTooltip } from "./tooltip";
import { toolbarElement, defineToolbar } from "./toolbar";
import { snackbarElement, defineSnackbar } from "./snackbar";
import { dialogElement, defineDialog } from "./dialog";
import { bottomSheetElement, defineBottomSheet } from "./bottom-sheet";
import { sideSheetElement, defineSideSheet } from "./side-sheet";
import { datepickerElement, defineDatepicker } from "./datepicker";
import { timepickerElement, defineTimepicker } from "./timepicker";
import { searchElement, searchSuggestionDeclaration, defineSearch } from "./search";

export { defineElement, DEFAULT_PREFIX, SHADOW_BASE_STYLES } from "./define";
export type {
  DefineOptions, ElementSpec, ElementDefinition, ElementComponent, ElementHost, ElementInstance,
  ElementAttributes, ElementProperties, ElementSlotText, ElementSlots, ElementSlotProp, ElementMarkup, ElementEvents, ElementMethods, ElementProps,
  AttributeSpec, AttributeType, PropertySpec, EventSpec, SlotSpec, FormSpec,
} from "./define";
export { registerStyles, hasStyles } from "./styles";
export {
  describe, describeDeclaration, camel, pascal, toAttribute, getPrefix, configure, isBrowser,
} from "./adapter";
export type {
  ComponentSpec, DeclarationSpec, DefaultProps, FormProps, ModelOf, Pascal, AttributeProp, Described,
} from "./adapter";
export { buttonElement, defineButton } from "./button";
export type { ButtonSpec, ButtonElement } from "./button";
export { switchElement, defineSwitch } from "./switch";
export type { SwitchSpec, SwitchElement } from "./switch";
export { tabsElement, tabDeclaration, defineTabs } from "./tabs";
export type { TabsSpec, TabsElement, TabAttributes } from "./tabs";
export { progressElement, defineProgress } from "./progress";
export type { ProgressSpec, ProgressElement } from "./progress";
export { loadingIndicatorElement, defineLoadingIndicator } from "./loading-indicator";
export type { LoadingIndicatorSpec, LoadingIndicatorElement } from "./loading-indicator";
export { badgeElement, defineBadge } from "./badge";
export type { BadgeSpec, BadgeElement } from "./badge";
export { dividerElement, defineDivider } from "./divider";
export type { DividerSpec, DividerElement } from "./divider";
export { iconButtonElement, defineIconButton } from "./icon-button";
export type { IconButtonSpec, IconButtonElement } from "./icon-button";
export { fabElement, defineFab } from "./fab";
export type { FabSpec, FabElement } from "./fab";
export { extendedFabElement, defineExtendedFab } from "./extended-fab";
export type { ExtendedFabSpec, ExtendedFabElement } from "./extended-fab";
export { checkboxElement, defineCheckbox } from "./checkbox";
export type { CheckboxSpec, CheckboxElement } from "./checkbox";
export { sliderElement, defineSlider } from "./slider";
export type { SliderSpec, SliderElement } from "./slider";
export { textfieldElement as textFieldElement, defineTextfield as defineTextField } from "./textfield";
export {
  /** @deprecated Use textFieldElement: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  textfieldElement,
  /** @deprecated Use defineTextField: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  defineTextfield,
} from "./textfield";
export type {
  TextfieldSpec as TextFieldSpec,
  TextfieldElement as TextFieldElement,
  TextfieldElementComponent as TextFieldElementComponent,
  /** @deprecated Use TextFieldSpec: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldSpec,
  /** @deprecated Use TextFieldElement: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldElement,
  /** @deprecated Use TextFieldElementComponent: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldElementComponent,
} from "./textfield";
export { radiosElement, radioDeclaration, defineRadios } from "./radios";
export type { RadiosSpec, RadiosElement, RadioAttributes } from "./radios";
export { navigationRailElement, navigationRailItemDeclaration, defineNavigationRail } from "./navigation-rail";
export type { NavigationRailSpec, NavigationRailElement, NavigationRailItemAttributes } from "./navigation-rail";
export { drawerElement, drawerItemDeclaration, defineDrawer } from "./drawer";
export type { DrawerSpec, DrawerElement, DrawerItemAttributes } from "./drawer";
export { topAppBarElement, defineTopAppBar } from "./top-app-bar";
export type { TopAppBarSpec, TopAppBarElement } from "./top-app-bar";
export { bottomAppBarElement, defineBottomAppBar } from "./bottom-app-bar";
export type { BottomAppBarSpec, BottomAppBarElement } from "./bottom-app-bar";
export { buttonGroupElement, buttonGroupItemDeclaration, defineButtonGroup } from "./button-group";
export type { ButtonGroupSpec, ButtonGroupElement, ButtonGroupItemAttributes, ButtonGroupValue } from "./button-group";
export { chipsElement, chipDeclaration, defineChips } from "./chips";
export type { ChipsSpec, ChipsElement, ChipAttributes, ChipsValue } from "./chips";
export { listElement, listItemDeclaration, defineList } from "./list";
export type { ListSpec, ListElement, ListItemAttributes } from "./list";
export { cardElement, defineCard } from "./card";
export type { CardSpec, CardElement } from "./card";
export { carouselElement, carouselItemDeclaration, defineCarousel } from "./carousel";
export type { CarouselSpec, CarouselElement, CarouselItemAttributes } from "./carousel";
export { menuElement, menuItemDeclaration, defineMenu } from "./menu";
export type { MenuSpec, MenuElement, MenuItemAttributes, MenuAnchor, MenuElementComponent } from "./menu";
export { fabMenuElement, fabMenuItemDeclaration, defineFabMenu } from "./fab-menu";
export type { FabMenuSpec, FabMenuElement, FabMenuItemAttributes, FabMenuElementComponent } from "./fab-menu";
export { selectElement, selectOptionDeclaration, defineSelect } from "./select";
export type { SelectSpec, SelectElement, SelectOptionAttributes } from "./select";
export { splitButtonElement, defineSplitButton } from "./split-button";
export type { SplitButtonSpec, SplitButtonElement } from "./split-button";
export { tooltipElement, defineTooltip } from "./tooltip";
export type { TooltipSpec, TooltipElement } from "./tooltip";
export { toolbarElement, defineToolbar } from "./toolbar";
export type { ToolbarSpec, ToolbarElement } from "./toolbar";
export { snackbarElement, defineSnackbar } from "./snackbar";
export type { SnackbarSpec, SnackbarElement } from "./snackbar";
export { dialogElement, defineDialog } from "./dialog";
export type { DialogSpec, DialogElement, DialogElementComponent } from "./dialog";
export { bottomSheetElement, defineBottomSheet } from "./bottom-sheet";
export type { BottomSheetSpec, BottomSheetElement, BottomSheetElementComponent } from "./bottom-sheet";
export { sideSheetElement, defineSideSheet } from "./side-sheet";
export type { SideSheetSpec, SideSheetElement, SideSheetElementComponent } from "./side-sheet";
export { datepickerElement, defineDatepicker } from "./datepicker";
export type { DatepickerSpec, DatepickerElement, DatepickerElementComponent } from "./datepicker";
export { timepickerElement, defineTimepicker } from "./timepicker";
export type { TimepickerSpec, TimepickerElement, TimepickerElementComponent } from "./timepicker";
export { searchElement, searchSuggestionDeclaration, defineSearch } from "./search";
export type { SearchSpec, SearchElement, SearchSuggestionAttributes, SearchElementComponent } from "./search";

/**
 * Every element, by name. Framework adapters are generated from this list and
 * name `<key>Element` and `define<Key>` after each key, so keys are camelCase.
 */
export const elements = {
  button: buttonElement,
  switch: switchElement,
  tabs: tabsElement,
  progress: progressElement,
  loadingIndicator: loadingIndicatorElement,
  badge: badgeElement,
  divider: dividerElement,
  iconButton: iconButtonElement,
  fab: fabElement,
  extendedFab: extendedFabElement,
  checkbox: checkboxElement,
  slider: sliderElement,
  textfield: textfieldElement,
  radios: radiosElement,
  navigationRail: navigationRailElement,
  drawer: drawerElement,
  topAppBar: topAppBarElement,
  bottomAppBar: bottomAppBarElement,
  buttonGroup: buttonGroupElement,
  chips: chipsElement,
  list: listElement,
  card: cardElement,
  carousel: carouselElement,
  menu: menuElement,
  fabMenu: fabMenuElement,
  select: selectElement,
  splitButton: splitButtonElement,
  tooltip: tooltipElement,
  toolbar: toolbarElement,
  snackbar: snackbarElement,
  dialog: dialogElement,
  bottomSheet: bottomSheetElement,
  sideSheet: sideSheetElement,
  datepicker: datepickerElement,
  timepicker: timepickerElement,
  search: searchElement,
} as const;

/** Declaration children, which render nothing and are read by their parent. */
export const declarations = {
  tab: tabDeclaration,
  radio: radioDeclaration,
  navigationRailItem: navigationRailItemDeclaration,
  drawerItem: drawerItemDeclaration,
  buttonGroupItem: buttonGroupItemDeclaration,
  chip: chipDeclaration,
  listItem: listItemDeclaration,
  carouselItem: carouselItemDeclaration,
  menuItem: menuItemDeclaration,
  fabMenuItem: fabMenuItemDeclaration,
  selectOption: selectOptionDeclaration,
  searchSuggestion: searchSuggestionDeclaration,
} as const;

/** Registers every element. */
export const defineAll = (options?: DefineOptions): void => {
  defineButton(options);
  defineSwitch(options);
  defineTabs(options);
  defineProgress(options);
  defineLoadingIndicator(options);
  defineBadge(options);
  defineDivider(options);
  defineIconButton(options);
  defineFab(options);
  defineExtendedFab(options);
  defineCheckbox(options);
  defineSlider(options);
  defineTextfield(options);
  defineRadios(options);
  defineNavigationRail(options);
  defineDrawer(options);
  defineTopAppBar(options);
  defineBottomAppBar(options);
  defineButtonGroup(options);
  defineChips(options);
  defineList(options);
  defineCard(options);
  defineCarousel(options);
  defineMenu(options);
  defineFabMenu(options);
  defineSelect(options);
  defineSplitButton(options);
  defineTooltip(options);
  defineToolbar(options);
  defineSnackbar(options);
  defineDialog(options);
  defineBottomSheet(options);
  defineSideSheet(options);
  defineDatepicker(options);
  defineTimepicker(options);
  defineSearch(options);
};
