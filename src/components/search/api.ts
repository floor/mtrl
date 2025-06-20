// src/components/search/api.ts
import { SearchComponent, SearchEvent } from "./types";
import { SEARCH_EVENTS } from "./constants";

/**
 * API options interface - structured by feature area
 */
interface ApiOptions {
  search: {
    setValue: (value: string, triggerEvent?: boolean) => void;
    getValue: () => string;
    setPlaceholder: (text: string) => void;
    getPlaceholder: () => string;
    focus: () => void;
    blur: () => void;
    expand: () => void;
    collapse: () => void;
    clear: () => void;
    submit: () => void;
    setSuggestions: (
      suggestions:
        | string[]
        | Array<{ text: string; value?: string; icon?: string }>
    ) => void;
    showSuggestions: (show: boolean) => void;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  appearance: {
    setColor: (color: string) => void;
    getColor: () => string;
    setSize: (size: string) => void;
    getSize: () => string;
  };
  icons: {
    setLeadingIcon: (iconHtml: string) => void;
    setTrailingIcon: (iconHtml: string) => void;
    setTrailingIcon2: (iconHtml: string) => void;
    setAvatar: (avatarHtml: string) => void;
    showClearButton: (show: boolean) => void;
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
 * Enhances a search component with a streamlined API
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Search component
 */
export const withAPI =
  (options: ApiOptions) =>
  (component: { element: HTMLElement }): SearchComponent => {
    const searchComponent: SearchComponent = {
      // Element access
      element: component.element,

      // Value management
      setValue(value: string, triggerEvent: boolean = true) {
        options.search.setValue(value, triggerEvent);
        return this;
      },

      getValue() {
        return options.search.getValue();
      },

      // Placeholder management
      setPlaceholder(text: string) {
        options.search.setPlaceholder(text);
        return this;
      },

      getPlaceholder() {
        return options.search.getPlaceholder();
      },

      // Icon management
      setLeadingIcon(iconHtml: string) {
        options.icons.setLeadingIcon(iconHtml);
        return this;
      },

      setTrailingIcon(iconHtml: string) {
        options.icons.setTrailingIcon(iconHtml);
        return this;
      },

      setTrailingIcon2(iconHtml: string) {
        options.icons.setTrailingIcon2(iconHtml);
        return this;
      },

      setAvatar(avatarHtml: string) {
        options.icons.setAvatar(avatarHtml);
        return this;
      },

      // Controls
      showClearButton(show: boolean) {
        options.icons.showClearButton(show);
        return this;
      },

      setSuggestions(
        suggestions:
          | string[]
          | Array<{ text: string; value?: string; icon?: string }>
      ) {
        options.search.setSuggestions(suggestions);
        return this;
      },

      showSuggestions(show: boolean) {
        options.search.showSuggestions(show);
        return this;
      },

      focus() {
        options.search.focus();
        return this;
      },

      blur() {
        options.search.blur();
        return this;
      },

      expand() {
        options.search.expand();
        return this;
      },

      collapse() {
        options.search.collapse();
        return this;
      },

      clear() {
        options.search.clear();
        return this;
      },

      submit() {
        options.search.submit();
        return this;
      },

      // State management
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

      // Event management
      on(
        event:
          | keyof typeof SEARCH_EVENTS
          | (typeof SEARCH_EVENTS)[keyof typeof SEARCH_EVENTS],
        handler: (event: SearchEvent) => void
      ) {
        options.events.on(event, handler);
        return this;
      },

      off(
        event:
          | keyof typeof SEARCH_EVENTS
          | (typeof SEARCH_EVENTS)[keyof typeof SEARCH_EVENTS],
        handler: (event: SearchEvent) => void
      ) {
        options.events.off(event, handler);
        return this;
      },

      // Lifecycle management
      destroy() {
        if (options.lifecycle?.destroy) {
          options.lifecycle.destroy();
        }
      },
    };

    return searchComponent;
  };
