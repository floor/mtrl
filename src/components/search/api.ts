// src/components/search/api.ts

import {
  SearchComponent,
  SearchEvent,
  SearchEventType,
  SearchState,
  SearchViewMode,
  SearchSuggestion,
  SearchTrailingItem,
} from "./types";
import { SEARCH_EVENTS } from "./constants";

/**
 * API options interface - structured by feature area
 */
interface ApiOptions {
  value: {
    setValue: (value: string, triggerEvent?: boolean) => void;
    getValue: () => string;
    setPlaceholder: (text: string) => void;
    getPlaceholder: () => string;
    clear: () => void;
    submit: () => void;
    focus: () => void;
    blur: () => void;
  };
  state: {
    expand: () => void;
    collapse: () => void;
    getState: () => SearchState;
    isExpanded: () => boolean;
    setViewMode: (mode: SearchViewMode) => void;
    getViewMode: () => SearchViewMode;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  suggestions: {
    set: (suggestions: SearchSuggestion[] | string[]) => void;
    get: () => SearchSuggestion[];
    clear: () => void;
    render: () => void;
  };
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Enhances a search component with a streamlined public API
 * Aligned with Material Design 3 specifications
 *
 * @param options API configuration options
 * @returns Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Search component
 */
export const withAPI =
  (options: ApiOptions) =>
  (component: { element: HTMLElement }): SearchComponent => {
    const searchComponent: SearchComponent = {
      // === Element Access ===
      element: component.element,

      // === Value Management ===

      setValue(value: string, triggerEvent = true) {
        options.value.setValue(value, triggerEvent);
        return this;
      },

      getValue() {
        return options.value.getValue();
      },

      setPlaceholder(text: string) {
        options.value.setPlaceholder(text);
        return this;
      },

      getPlaceholder() {
        return options.value.getPlaceholder();
      },

      // === State Management ===

      expand() {
        options.state.expand();
        return this;
      },

      collapse() {
        options.state.collapse();
        return this;
      },

      getState() {
        return options.state.getState();
      },

      isExpanded() {
        return options.state.isExpanded();
      },

      setViewMode(mode: SearchViewMode) {
        options.state.setViewMode(mode);
        return this;
      },

      getViewMode() {
        return options.state.getViewMode();
      },

      // === Input Controls ===

      focus() {
        options.value.focus();
        return this;
      },

      blur() {
        options.value.blur();
        return this;
      },

      clear() {
        options.value.clear();
        return this;
      },

      submit() {
        options.value.submit();
        return this;
      },

      // === Content Management ===

      setLeadingIcon(iconHtml: string) {
        // TODO: Implement in a separate icons feature if needed
        console.warn("setLeadingIcon: Not yet implemented");
        return this;
      },

      addTrailingItem(item: SearchTrailingItem) {
        // TODO: Implement trailing items management
        console.warn("addTrailingItem: Not yet implemented");
        return this;
      },

      removeTrailingItem(id: string) {
        // TODO: Implement trailing items management
        console.warn("removeTrailingItem: Not yet implemented");
        return this;
      },

      setTrailingItems(items: SearchTrailingItem[]) {
        // TODO: Implement trailing items management
        console.warn("setTrailingItems: Not yet implemented");
        return this;
      },

      // === Suggestions ===

      setSuggestions(suggestions: SearchSuggestion[] | string[]) {
        options.suggestions.set(suggestions);
        options.suggestions.render();
        return this;
      },

      getSuggestions() {
        return options.suggestions.get();
      },

      clearSuggestions() {
        options.suggestions.clear();
        options.suggestions.render();
        return this;
      },

      // === Disabled State ===

      enable() {
        options.disabled.enable();
        return this;
      },

      disable() {
        options.disabled.disable();
        return this;
      },

      isDisabled() {
        return options.disabled.isDisabled();
      },

      // === Events ===

      on(event: SearchEventType, handler: (event: SearchEvent) => void) {
        options.events.on(event, handler);
        return this;
      },

      off(event: SearchEventType, handler: (event: SearchEvent) => void) {
        options.events.off(event, handler);
        return this;
      },

      // === Lifecycle ===

      destroy() {
        if (options.lifecycle?.destroy) {
          options.lifecycle.destroy();
        }
      },
    };

    return searchComponent;
  };
