// src/components/search/api.ts

import {
  SearchComponent,
  SearchEvents,
  SearchState,
  SearchViewMode,
  SearchVariant,
  SearchSuggestion,
  SearchTrailingItem,
} from "./types";
import type { EventCallback } from "../../core/state/emitter";

/**
 * API options interface - structured by feature area
 */
interface ApiOptions {
  value: {
    setValue: (value: string, triggerEvent?: boolean) => void;
    getValue: () => string;
    setPlaceholder: (text: string) => void;
    getPlaceholder: () => string;
    clear: (triggerEvent?: boolean) => void;
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
    setVariant: (variant: SearchVariant) => void;
    getVariant: () => SearchVariant;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  content: {
    setLeadingIcon: (html: string) => void;
    setTrailingItems: (items: SearchTrailingItem[]) => void;
    addTrailingItem: (item: SearchTrailingItem) => void;
    removeTrailingItem: (id: string) => void;
  };
  suggestions: {
    set: (suggestions: SearchSuggestion[] | string[]) => void;
    get: () => SearchSuggestion[];
    clear: () => void;
    render: () => void;
  };
  events: {
    // `EventCallback`, not `Function`: getApiConfig in config.ts now supplies
    // the narrowed forwarder, and a parameter declared `Function` cannot
    // accept it. The whole chain -- InternalComponent, the forwarder it
    // builds, and this -- is internal to the component. FLO-114.
    on: (event: string, handler: EventCallback) => void;
    off: (event: string, handler: EventCallback) => void;
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

      setValue(value: string, triggerEvent = false) {
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

      setVariant(variant: SearchVariant) {
        options.state.setVariant(variant);
        return this;
      },

      getVariant() {
        return options.state.getVariant();
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
        options.value.clear(false);
        return this;
      },

      submit() {
        options.value.submit();
        return this;
      },

      // === Content Management ===

      // These only warned (FLO-291).
      setLeadingIcon(iconHtml: string) {
        options.content.setLeadingIcon(iconHtml);
        return this;
      },

      addTrailingItem(item: SearchTrailingItem) {
        options.content.addTrailingItem(item);
        return this;
      },

      removeTrailingItem(id: string) {
        options.content.removeTrailingItem(id);
        return this;
      },

      setTrailingItems(items: SearchTrailingItem[]) {
        options.content.setTrailingItems(items);
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

      on<K extends keyof SearchEvents>(event: K, handler: SearchEvents[K]) {
        options.events.on(event, handler as EventCallback);
        return this;
      },

      off<K extends keyof SearchEvents>(event: K, handler: SearchEvents[K]) {
        options.events.off(event, handler as EventCallback);
        return this;
      },

      // === Lifecycle ===

      destroy() {
        // An open view leaves the top layer and drops its window listeners.
        options.state.collapse();
        if (options.lifecycle?.destroy) {
          options.lifecycle.destroy();
        }
      },
    };

    return searchComponent;
  };
