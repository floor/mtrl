// test/types/on-options.fixture.ts
//
// A config on* option is the listener type of its event. The old argument
// shapes below are errors. Chips are a separate change and are not here.
import createTimePicker from "../../src/components/timepicker";
import type { TimePickerConfig, TimePickerEvents } from "../../src/components/timepicker/types";
import createSearch from "../../src/components/search";
import type { SearchConfig, SearchEvents, SearchSuggestion } from "../../src/components/search/types";
import type { NavigationRailConfig, NavigationRailEvents } from "../../src/components/navigation-rail/types";
import type { NavigationBarConfig, NavigationBarEvents } from "../../src/components/navigation-bar/types";
import type { DrawerConfig, DrawerEvents } from "../../src/components/drawer/types";
import type { TextFieldConfig, TextFieldEvents } from "../../src/components/textfield/types";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Fn<T> = NonNullable<T>;

export const timeConfirm: Equals<Fn<TimePickerConfig["onConfirm"]>, TimePickerEvents["confirm"]> = true;
export const timeChange: Equals<Fn<TimePickerConfig["onChange"]>, TimePickerEvents["change"]> = true;
export const timeInput: Equals<Fn<TimePickerConfig["onInput"]>, TimePickerEvents["input"]> = true;
export const timeOpen: Equals<Fn<TimePickerConfig["onOpen"]>, TimePickerEvents["open"]> = true;
export const timeClose: Equals<Fn<TimePickerConfig["onClose"]>, TimePickerEvents["close"]> = true;
export const timeCancel: Equals<Fn<TimePickerConfig["onCancel"]>, TimePickerEvents["cancel"]> = true;

export const searchInput: Equals<Fn<SearchConfig["onInput"]>, SearchEvents["input"]> = true;
export const searchSubmit: Equals<Fn<SearchConfig["onSubmit"]>, SearchEvents["submit"]> = true;
export const searchClear: Equals<Fn<SearchConfig["onClear"]>, SearchEvents["clear"]> = true;
export const searchExpand: Equals<Fn<SearchConfig["onExpand"]>, SearchEvents["expand"]> = true;
export const searchCollapse: Equals<Fn<SearchConfig["onCollapse"]>, SearchEvents["collapse"]> = true;
export const searchOnMap: Equals<Fn<SearchConfig["on"]>, Partial<SearchEvents>> = true;
export const searchSuggestion: Equals<Fn<SearchConfig["onSuggestionSelect"]>, SearchEvents["suggestionSelect"]> = true;

export const railSelect: Equals<Fn<NavigationRailConfig["onSelect"]>, (event: NavigationRailEvents["select"]) => void> = true;
export const railExpand: Equals<Fn<NavigationRailConfig["onExpand"]>, (event: NavigationRailEvents["expand"]) => void> = true;
export const railCollapse: Equals<Fn<NavigationRailConfig["onCollapse"]>, (event: NavigationRailEvents["collapse"]) => void> = true;

export const barSelect: Equals<Fn<NavigationBarConfig["onSelect"]>, (event: NavigationBarEvents["select"]) => void> = true;

export const drawerSelect: Equals<Fn<DrawerConfig["onSelect"]>, DrawerEvents["select"]> = true;
export const drawerOpen: Equals<Fn<DrawerConfig["onOpen"]>, DrawerEvents["open"]> = true;
export const drawerClose: Equals<Fn<DrawerConfig["onClose"]>, DrawerEvents["close"]> = true;

export const trailing: Equals<Fn<TextFieldConfig["onTrailingClick"]>, TextFieldEvents["trailing"]> = true;

createTimePicker({
  // @ts-expect-error onConfirm receives { value }, the confirm listener's argument, not a string
  onConfirm: (time: string) => {
    time.toUpperCase();
  },
});

createSearch({
  // @ts-expect-error onInput receives the SearchEvent, not the query string
  onInput: (value: string) => {
    value.toUpperCase();
  },
  // @ts-expect-error onSubmit receives the SearchEvent, not the query string
  onSubmit: (query: string) => {
    query.toUpperCase();
  },
  // @ts-expect-error onSuggestionSelect receives the SearchEvent, not the suggestion
  onSuggestionSelect: (suggestion: SearchSuggestion) => {
    suggestion.text.toUpperCase();
  },
});
