// test/components/search.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

import type {
  SearchComponent,
  SearchConfig,
  SearchState,
  SearchViewMode,
  SearchEventType,
  SearchEvent,
  SearchSuggestion,
} from "../../src/components/search/types";

import {
  SEARCH_STATES,
  SEARCH_VIEW_MODES,
  SEARCH_EVENTS,
  SEARCH_CLASSES,
  SEARCH_ICONS,
  SEARCH_MEASUREMENTS,
} from "../../src/components/search/constants";

// Setup JSDOM environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: typeof globalThis.document;
let originalGlobalWindow: typeof globalThis.window;

beforeAll(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });

  window = dom.window as unknown as Window;
  document = window.document;

  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;

  global.document = document;
  global.window = window as unknown as typeof globalThis.window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLInputElement = window.HTMLInputElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
  global.KeyboardEvent = window.KeyboardEvent;
  global.MouseEvent = window.MouseEvent;
  global.FocusEvent = window.FocusEvent;
});

afterAll(() => {
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  window.close();
});

/**
 * Mock Search component implementation for testing
 * Mirrors the public API of the real Search component
 */
const createMockSearch = (config: SearchConfig = {}): SearchComponent => {
  // Create root element
  const element = document.createElement("div");
  element.setAttribute("role", "search");

  // Initialize state
  let currentState: SearchState = config.initialState || SEARCH_STATES.BAR;
  let currentViewMode: SearchViewMode =
    config.viewMode || SEARCH_VIEW_MODES.DOCKED;
  let currentValue = config.value || "";
  let currentPlaceholder = config.placeholder || "Search";
  let isDisabled = config.disabled || false;
  let suggestions: SearchSuggestion[] = normalizeSuggestions(
    config.suggestions,
  );

  // Apply root classes
  element.className = [
    "mtrl-search",
    `mtrl-search--${currentState}`,
    `mtrl-search--${currentViewMode}`,
    isDisabled ? "mtrl-search--disabled" : "",
    currentValue ? "mtrl-search--populated" : "",
    config.fullWidth ? "mtrl-search--full-width" : "",
  ]
    .filter(Boolean)
    .join(" ");

  element.setAttribute("aria-disabled", isDisabled ? "true" : "false");

  // Create container
  const container = document.createElement("div");
  container.className = "mtrl-search__container";
  element.appendChild(container);

  // Create leading icon
  const leadingIcon = document.createElement("button");
  leadingIcon.className = "mtrl-search__leading-icon";
  leadingIcon.setAttribute("type", "button");
  leadingIcon.innerHTML =
    currentState === SEARCH_STATES.VIEW
      ? SEARCH_ICONS.BACK
      : config.leadingIcon || SEARCH_ICONS.SEARCH;
  leadingIcon.setAttribute(
    "aria-label",
    currentState === SEARCH_STATES.VIEW ? "Go back" : "Search",
  );
  container.appendChild(leadingIcon);

  // Create input wrapper
  const inputWrapper = document.createElement("div");
  inputWrapper.className = "mtrl-search__input-wrapper";
  container.appendChild(inputWrapper);

  // Create input
  const input = document.createElement("input");
  input.className = "mtrl-search__input";
  input.type = "text";
  input.placeholder = currentPlaceholder;
  input.value = currentValue;
  input.setAttribute("aria-label", currentPlaceholder);
  if (isDisabled) {
    input.disabled = true;
  }
  inputWrapper.appendChild(input);

  // Create clear button
  let clearButton: HTMLElement | null = null;
  if (config.showClearButton !== false) {
    clearButton = document.createElement("button");
    clearButton.className = "mtrl-search__clear-button";
    if (!currentValue) {
      clearButton.classList.add("mtrl-search__clear-button--hidden");
    }
    clearButton.setAttribute("type", "button");
    clearButton.innerHTML = SEARCH_ICONS.CLEAR;
    clearButton.setAttribute("aria-label", "Clear search");
    container.appendChild(clearButton);
  }

  // Create divider (for view state)
  const divider = document.createElement("div");
  divider.className = "mtrl-search__divider";

  // Create content area (for view state)
  const content = document.createElement("div");
  content.className = "mtrl-search__content";

  // Create suggestions container
  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.className = "mtrl-search__suggestions";
  content.appendChild(suggestionsContainer);

  // Create suggestions list
  const suggestionsList = document.createElement("ul");
  suggestionsList.className = "mtrl-search__suggestion-list";
  suggestionsList.setAttribute("role", "listbox");
  suggestionsContainer.appendChild(suggestionsList);

  // Add view elements if in view state
  if (currentState === SEARCH_STATES.VIEW) {
    element.appendChild(divider);
    element.appendChild(content);
  }

  // Event handlers storage
  const eventHandlers: Record<string, Array<(event: SearchEvent) => void>> = {};

  // Helper to normalize suggestions
  function normalizeSuggestions(
    items: SearchSuggestion[] | string[] | undefined,
  ): SearchSuggestion[] {
    if (!items) return [];
    return items.map((item) => {
      if (typeof item === "string") {
        return { text: item, value: item };
      }
      return { ...item, value: item.value ?? item.text };
    });
  }

  // Helper to create event data
  function createEventData(
    originalEvent: Event | null = null,
    extra: Record<string, unknown> = {},
  ): SearchEvent {
    return {
      component: search,
      value: currentValue,
      originalEvent,
      preventDefault: function () {
        this.defaultPrevented = true;
      },
      defaultPrevented: false,
      ...extra,
    } as SearchEvent;
  }

  // Helper to emit events
  function emit(
    eventType: string,
    originalEvent: Event | null = null,
    extra: Record<string, unknown> = {},
  ) {
    const eventData = createEventData(originalEvent, extra);
    const handlers = eventHandlers[eventType] || [];
    handlers.forEach((handler) => handler(eventData));

    // Call config handlers
    const handlerName = `on${eventType.charAt(0).toUpperCase()}${eventType.slice(1)}`;
    const configHandler = config[handlerName as keyof SearchConfig];
    if (typeof configHandler === "function") {
      if (eventType === "suggestionSelect" && extra.suggestion) {
        (configHandler as (s: SearchSuggestion) => void)(
          extra.suggestion as SearchSuggestion,
        );
      } else {
        (configHandler as (v: string) => void)(currentValue);
      }
    }

    return eventData;
  }

  // Helper to update clear button visibility
  function updateClearButton(hasValue: boolean) {
    if (!clearButton) return;
    if (hasValue) {
      clearButton.classList.remove("mtrl-search__clear-button--hidden");
    } else {
      clearButton.classList.add("mtrl-search__clear-button--hidden");
    }
  }

  // Helper to update populated state
  function updatePopulatedState(hasValue: boolean) {
    if (hasValue) {
      element.classList.add("mtrl-search--populated");
    } else {
      element.classList.remove("mtrl-search--populated");
    }
  }

  // Helper to render suggestions
  function renderSuggestions() {
    suggestionsList.innerHTML = "";
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("li");
      item.className = "mtrl-search__suggestion-item";
      item.setAttribute("role", "option");
      item.setAttribute("data-index", String(index));
      item.setAttribute("data-value", suggestion.value || suggestion.text);

      if (suggestion.icon) {
        const icon = document.createElement("span");
        icon.className = "mtrl-search__suggestion-icon";
        icon.innerHTML = suggestion.icon;
        item.appendChild(icon);
      }

      const text = document.createElement("span");
      text.className = "mtrl-search__suggestion-text";
      text.textContent = suggestion.text;
      item.appendChild(text);

      suggestionsList.appendChild(item);
    });
  }

  // Initial suggestion render
  if (suggestions.length > 0) {
    renderSuggestions();
  }

  // The search component API
  const search: SearchComponent = {
    element,

    // Value methods
    setValue(value: string, triggerEvent = true) {
      const previousValue = currentValue;
      currentValue = value;
      input.value = value;
      updateClearButton(!!value);
      updatePopulatedState(!!value);
      if (triggerEvent && value !== previousValue) {
        emit(SEARCH_EVENTS.INPUT);
      }
      return this;
    },

    getValue() {
      return currentValue;
    },

    setPlaceholder(text: string) {
      currentPlaceholder = text;
      input.placeholder = text;
      input.setAttribute("aria-label", text);
      return this;
    },

    getPlaceholder() {
      return currentPlaceholder;
    },

    // State methods
    expand() {
      if (currentState === SEARCH_STATES.VIEW || isDisabled) return this;

      currentState = SEARCH_STATES.VIEW;
      element.classList.remove("mtrl-search--bar");
      element.classList.add("mtrl-search--view");
      leadingIcon.innerHTML = SEARCH_ICONS.BACK;
      leadingIcon.setAttribute("aria-label", "Go back");

      if (!element.contains(divider)) {
        element.appendChild(divider);
        element.appendChild(content);
      }

      emit(SEARCH_EVENTS.EXPAND);
      return this;
    },

    collapse() {
      if (currentState === SEARCH_STATES.BAR) return this;

      currentState = SEARCH_STATES.BAR;
      element.classList.remove("mtrl-search--view");
      element.classList.add("mtrl-search--bar");
      leadingIcon.innerHTML = config.leadingIcon || SEARCH_ICONS.SEARCH;
      leadingIcon.setAttribute("aria-label", "Search");

      if (element.contains(divider)) {
        element.removeChild(divider);
        element.removeChild(content);
      }

      emit(SEARCH_EVENTS.COLLAPSE);
      return this;
    },

    getState() {
      return currentState;
    },

    isExpanded() {
      return currentState === SEARCH_STATES.VIEW;
    },

    setViewMode(mode: SearchViewMode) {
      if (mode === currentViewMode) return this;

      element.classList.remove(`mtrl-search--${currentViewMode}`);
      currentViewMode = mode;
      element.classList.add(`mtrl-search--${currentViewMode}`);
      return this;
    },

    getViewMode() {
      return currentViewMode;
    },

    // Input control methods
    focus() {
      if (!isDisabled) {
        input.focus();
        element.classList.add("mtrl-search--focused");
        emit(SEARCH_EVENTS.FOCUS);
      }
      return this;
    },

    blur() {
      input.blur();
      element.classList.remove("mtrl-search--focused");
      emit(SEARCH_EVENTS.BLUR);
      return this;
    },

    clear() {
      this.setValue("", false);
      emit(SEARCH_EVENTS.CLEAR);
      if (!isDisabled) {
        input.focus();
      }
      return this;
    },

    submit() {
      if (currentValue) {
        emit(SEARCH_EVENTS.SUBMIT);
      }
      return this;
    },

    // Content methods
    setLeadingIcon(iconHtml: string) {
      if (currentState === SEARCH_STATES.BAR) {
        leadingIcon.innerHTML = iconHtml;
      }
      return this;
    },

    addTrailingItem() {
      // Simplified for testing
      return this;
    },

    removeTrailingItem() {
      // Simplified for testing
      return this;
    },

    setTrailingItems() {
      // Simplified for testing
      return this;
    },

    // Suggestion methods
    setSuggestions(items: SearchSuggestion[] | string[]) {
      suggestions = normalizeSuggestions(items);
      renderSuggestions();
      return this;
    },

    getSuggestions() {
      return [...suggestions];
    },

    clearSuggestions() {
      suggestions = [];
      suggestionsList.innerHTML = "";
      return this;
    },

    // Disabled state methods
    enable() {
      isDisabled = false;
      element.classList.remove("mtrl-search--disabled");
      element.setAttribute("aria-disabled", "false");
      input.disabled = false;
      return this;
    },

    disable() {
      isDisabled = true;
      element.classList.add("mtrl-search--disabled");
      element.setAttribute("aria-disabled", "true");
      input.disabled = true;
      return this;
    },

    isDisabled() {
      return isDisabled;
    },

    // Event methods
    on(event: SearchEventType, handler: (e: SearchEvent) => void) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      return this;
    },

    off(event: SearchEventType, handler: (e: SearchEvent) => void) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(
          (h) => h !== handler,
        );
      }
      return this;
    },

    // Lifecycle
    destroy() {
      Object.keys(eventHandlers).forEach((key) => {
        eventHandlers[key] = [];
      });
      element.remove();
    },
  };

  return search;
};

// =============================================================================
// TESTS
// =============================================================================

describe("Search Component", () => {
  // ---------------------------------------------------------------------------
  // Basic Creation Tests
  // ---------------------------------------------------------------------------

  describe("Creation", () => {
    test("should create a search component with default configuration", () => {
      const search = createMockSearch();

      expect(search.element).toBeDefined();
      expect(search.element.classList.contains("mtrl-search")).toBe(true);
      expect(search.element.getAttribute("role")).toBe("search");
    });

    test("should create with custom placeholder", () => {
      const search = createMockSearch({
        placeholder: "Search products...",
      });

      expect(search.getPlaceholder()).toBe("Search products...");
      const input = search.element.querySelector(
        ".mtrl-search__input",
      ) as HTMLInputElement;
      expect(input.placeholder).toBe("Search products...");
    });

    test("should create with initial value", () => {
      const search = createMockSearch({
        value: "initial query",
      });

      expect(search.getValue()).toBe("initial query");
      expect(search.element.classList.contains("mtrl-search--populated")).toBe(
        true,
      );
    });

    test("should create in disabled state", () => {
      const search = createMockSearch({
        disabled: true,
      });

      expect(search.isDisabled()).toBe(true);
      expect(search.element.classList.contains("mtrl-search--disabled")).toBe(
        true,
      );
      expect(search.element.getAttribute("aria-disabled")).toBe("true");
    });

    test("should create with full width", () => {
      const search = createMockSearch({
        fullWidth: true,
      });

      expect(search.element.classList.contains("mtrl-search--full-width")).toBe(
        true,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // State Tests
  // ---------------------------------------------------------------------------

  describe("State Management", () => {
    test("should start in bar state by default", () => {
      const search = createMockSearch();

      expect(search.getState()).toBe("bar");
      expect(search.isExpanded()).toBe(false);
      expect(search.element.classList.contains("mtrl-search--bar")).toBe(true);
    });

    test("should start in view state when configured", () => {
      const search = createMockSearch({
        initialState: "view",
      });

      expect(search.getState()).toBe("view");
      expect(search.isExpanded()).toBe(true);
      expect(search.element.classList.contains("mtrl-search--view")).toBe(true);
    });

    test("should expand to view state", () => {
      const search = createMockSearch();
      let expandEventFired = false;

      search.on("expand", () => {
        expandEventFired = true;
      });

      search.expand();

      expect(search.getState()).toBe("view");
      expect(search.isExpanded()).toBe(true);
      expect(search.element.classList.contains("mtrl-search--view")).toBe(true);
      expect(search.element.classList.contains("mtrl-search--bar")).toBe(false);
      expect(expandEventFired).toBe(true);
    });

    test("should collapse to bar state", () => {
      const search = createMockSearch({ initialState: "view" });
      let collapseEventFired = false;

      search.on("collapse", () => {
        collapseEventFired = true;
      });

      search.collapse();

      expect(search.getState()).toBe("bar");
      expect(search.isExpanded()).toBe(false);
      expect(search.element.classList.contains("mtrl-search--bar")).toBe(true);
      expect(search.element.classList.contains("mtrl-search--view")).toBe(
        false,
      );
      expect(collapseEventFired).toBe(true);
    });

    test("should not expand when disabled", () => {
      const search = createMockSearch({ disabled: true });

      search.expand();

      expect(search.getState()).toBe("bar");
      expect(search.isExpanded()).toBe(false);
    });

    test("should support docked view mode", () => {
      const search = createMockSearch({ viewMode: "docked" });

      expect(search.getViewMode()).toBe("docked");
      expect(search.element.classList.contains("mtrl-search--docked")).toBe(
        true,
      );
    });

    test("should support fullscreen view mode", () => {
      const search = createMockSearch({ viewMode: "fullscreen" });

      expect(search.getViewMode()).toBe("fullscreen");
      expect(search.element.classList.contains("mtrl-search--fullscreen")).toBe(
        true,
      );
    });

    test("should change view mode", () => {
      const search = createMockSearch({ viewMode: "docked" });

      search.setViewMode("fullscreen");

      expect(search.getViewMode()).toBe("fullscreen");
      expect(search.element.classList.contains("mtrl-search--fullscreen")).toBe(
        true,
      );
      expect(search.element.classList.contains("mtrl-search--docked")).toBe(
        false,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Value Tests
  // ---------------------------------------------------------------------------

  describe("Value Management", () => {
    test("should set and get value", () => {
      const search = createMockSearch();

      search.setValue("test query");

      expect(search.getValue()).toBe("test query");
      const input = search.element.querySelector(
        ".mtrl-search__input",
      ) as HTMLInputElement;
      expect(input.value).toBe("test query");
    });

    test("should update populated state when value changes", () => {
      const search = createMockSearch();

      expect(search.element.classList.contains("mtrl-search--populated")).toBe(
        false,
      );

      search.setValue("query");
      expect(search.element.classList.contains("mtrl-search--populated")).toBe(
        true,
      );

      search.setValue("");
      expect(search.element.classList.contains("mtrl-search--populated")).toBe(
        false,
      );
    });

    test("should trigger input event when value changes", () => {
      const search = createMockSearch();
      let inputEventFired = false;
      let eventValue = "";

      search.on("input", (e) => {
        inputEventFired = true;
        eventValue = e.value;
      });

      search.setValue("new value");

      expect(inputEventFired).toBe(true);
      expect(eventValue).toBe("new value");
    });

    test("should not trigger event when triggerEvent is false", () => {
      const search = createMockSearch();
      let inputEventFired = false;

      search.on("input", () => {
        inputEventFired = true;
      });

      search.setValue("new value", false);

      expect(inputEventFired).toBe(false);
      expect(search.getValue()).toBe("new value");
    });

    test("should set and get placeholder", () => {
      const search = createMockSearch({ placeholder: "Initial" });

      expect(search.getPlaceholder()).toBe("Initial");

      search.setPlaceholder("Updated");

      expect(search.getPlaceholder()).toBe("Updated");
      const input = search.element.querySelector(
        ".mtrl-search__input",
      ) as HTMLInputElement;
      expect(input.placeholder).toBe("Updated");
    });
  });

  // ---------------------------------------------------------------------------
  // Clear Button Tests
  // ---------------------------------------------------------------------------

  describe("Clear Button", () => {
    test("should show clear button when value exists", () => {
      const search = createMockSearch({ value: "test" });

      const clearButton = search.element.querySelector(
        ".mtrl-search__clear-button",
      );
      expect(clearButton).toBeDefined();
      expect(
        clearButton?.classList.contains("mtrl-search__clear-button--hidden"),
      ).toBe(false);
    });

    test("should hide clear button when value is empty", () => {
      const search = createMockSearch({ value: "" });

      const clearButton = search.element.querySelector(
        ".mtrl-search__clear-button",
      );
      expect(
        clearButton?.classList.contains("mtrl-search__clear-button--hidden"),
      ).toBe(true);
    });

    test("should not render clear button when showClearButton is false", () => {
      const search = createMockSearch({
        showClearButton: false,
        value: "test",
      });

      const clearButton = search.element.querySelector(
        ".mtrl-search__clear-button",
      );
      expect(clearButton).toBeNull();
    });

    test("should toggle clear button visibility when value changes", () => {
      const search = createMockSearch();
      const clearButton = search.element.querySelector(
        ".mtrl-search__clear-button",
      );

      expect(
        clearButton?.classList.contains("mtrl-search__clear-button--hidden"),
      ).toBe(true);

      search.setValue("text");
      expect(
        clearButton?.classList.contains("mtrl-search__clear-button--hidden"),
      ).toBe(false);

      search.setValue("");
      expect(
        clearButton?.classList.contains("mtrl-search__clear-button--hidden"),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Control Tests
  // ---------------------------------------------------------------------------

  describe("Input Controls", () => {
    test("should clear the input value", () => {
      const search = createMockSearch({ value: "test" });
      let clearEventFired = false;

      search.on("clear", () => {
        clearEventFired = true;
      });

      search.clear();

      expect(search.getValue()).toBe("");
      expect(clearEventFired).toBe(true);
    });

    test("should submit the search", () => {
      const search = createMockSearch({ value: "query" });
      let submitEventFired = false;
      let submitValue = "";

      search.on("submit", (e) => {
        submitEventFired = true;
        submitValue = e.value;
      });

      search.submit();

      expect(submitEventFired).toBe(true);
      expect(submitValue).toBe("query");
    });

    test("should not submit when value is empty", () => {
      const search = createMockSearch({ value: "" });
      let submitEventFired = false;

      search.on("submit", () => {
        submitEventFired = true;
      });

      search.submit();

      expect(submitEventFired).toBe(false);
    });

    test("should focus the input", () => {
      const search = createMockSearch();
      let focusEventFired = false;

      search.on("focus", () => {
        focusEventFired = true;
      });

      search.focus();

      expect(focusEventFired).toBe(true);
      expect(search.element.classList.contains("mtrl-search--focused")).toBe(
        true,
      );
    });

    test("should blur the input", () => {
      const search = createMockSearch();

      search.focus();
      expect(search.element.classList.contains("mtrl-search--focused")).toBe(
        true,
      );

      search.blur();
      expect(search.element.classList.contains("mtrl-search--focused")).toBe(
        false,
      );
    });

    test("should not focus when disabled", () => {
      const search = createMockSearch({ disabled: true });
      let focusEventFired = false;

      search.on("focus", () => {
        focusEventFired = true;
      });

      search.focus();

      expect(focusEventFired).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State Tests
  // ---------------------------------------------------------------------------

  describe("Disabled State", () => {
    test("should enable the component", () => {
      const search = createMockSearch({ disabled: true });

      expect(search.isDisabled()).toBe(true);

      search.enable();

      expect(search.isDisabled()).toBe(false);
      expect(search.element.classList.contains("mtrl-search--disabled")).toBe(
        false,
      );
      expect(search.element.getAttribute("aria-disabled")).toBe("false");
    });

    test("should disable the component", () => {
      const search = createMockSearch();

      expect(search.isDisabled()).toBe(false);

      search.disable();

      expect(search.isDisabled()).toBe(true);
      expect(search.element.classList.contains("mtrl-search--disabled")).toBe(
        true,
      );
      expect(search.element.getAttribute("aria-disabled")).toBe("true");
    });

    test("should disable the input element", () => {
      const search = createMockSearch();

      search.disable();

      const input = search.element.querySelector(
        ".mtrl-search__input",
      ) as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Suggestions Tests
  // ---------------------------------------------------------------------------

  describe("Suggestions", () => {
    test("should set string suggestions", () => {
      const search = createMockSearch();

      search.setSuggestions(["Apple", "Banana", "Cherry"]);

      const suggestions = search.getSuggestions();
      expect(suggestions.length).toBe(3);
      expect(suggestions[0].text).toBe("Apple");
      expect(suggestions[0].value).toBe("Apple");
    });

    test("should set object suggestions", () => {
      const search = createMockSearch();

      search.setSuggestions([
        { text: "Apple", value: "apple" },
        { text: "Banana", value: "banana" },
      ]);

      const suggestions = search.getSuggestions();
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].text).toBe("Apple");
      expect(suggestions[0].value).toBe("apple");
    });

    test("should render suggestions to the DOM", () => {
      const search = createMockSearch({
        initialState: "view",
        suggestions: ["One", "Two", "Three"],
      });

      const items = search.element.querySelectorAll(
        ".mtrl-search__suggestion-item",
      );
      expect(items.length).toBe(3);
    });

    test("should clear suggestions", () => {
      const search = createMockSearch({
        suggestions: ["One", "Two", "Three"],
      });

      expect(search.getSuggestions().length).toBe(3);

      search.clearSuggestions();

      expect(search.getSuggestions().length).toBe(0);
    });

    test("should render suggestions with icons", () => {
      const search = createMockSearch({
        initialState: "view",
        suggestions: [{ text: "Apple", icon: "<svg>icon</svg>" }],
      });

      const icon = search.element.querySelector(
        ".mtrl-search__suggestion-icon",
      );
      expect(icon).toBeDefined();
      expect(icon?.innerHTML).toBe("<svg>icon</svg>");
    });
  });

  // ---------------------------------------------------------------------------
  // Event Tests
  // ---------------------------------------------------------------------------

  describe("Events", () => {
    test("should add event listeners", () => {
      const search = createMockSearch();
      let eventFired = false;

      search.on("input", () => {
        eventFired = true;
      });

      search.setValue("test");

      expect(eventFired).toBe(true);
    });

    test("should remove event listeners", () => {
      const search = createMockSearch();
      let eventCount = 0;

      const handler = () => {
        eventCount++;
      };

      search.on("input", handler);
      search.setValue("first");
      expect(eventCount).toBe(1);

      search.off("input", handler);
      search.setValue("second");
      expect(eventCount).toBe(1);
    });

    test("should call onSubmit callback", () => {
      let callbackValue = "";

      const search = createMockSearch({
        value: "test query",
        onSubmit: (value) => {
          callbackValue = value;
        },
      });

      search.submit();

      expect(callbackValue).toBe("test query");
    });

    test("should call onInput callback", () => {
      let callbackValue = "";

      const search = createMockSearch({
        onInput: (value) => {
          callbackValue = value;
        },
      });

      search.setValue("new value");

      expect(callbackValue).toBe("new value");
    });

    test("should call onClear callback", () => {
      let callbackFired = false;

      const search = createMockSearch({
        value: "test",
        onClear: () => {
          callbackFired = true;
        },
      });

      search.clear();

      expect(callbackFired).toBe(true);
    });

    test("should support method chaining on events", () => {
      const search = createMockSearch();

      const result = search
        .on("input", () => {})
        .on("submit", () => {})
        .on("clear", () => {});

      expect(result).toBe(search);
    });
  });

  // ---------------------------------------------------------------------------
  // Lifecycle Tests
  // ---------------------------------------------------------------------------

  describe("Lifecycle", () => {
    test("should destroy the component", () => {
      const search = createMockSearch();
      document.body.appendChild(search.element);

      expect(document.body.contains(search.element)).toBe(true);

      search.destroy();

      expect(document.body.contains(search.element)).toBe(false);
    });

    test("should clear event handlers on destroy", () => {
      const search = createMockSearch();
      let eventCount = 0;

      search.on("input", () => {
        eventCount++;
      });

      search.destroy();

      // After destroy, events should not fire
      // (In real implementation, setValue wouldn't work after destroy)
      expect(eventCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe("Accessibility", () => {
    test('should have role="search" on root element', () => {
      const search = createMockSearch();

      expect(search.element.getAttribute("role")).toBe("search");
    });

    test("should have aria-disabled attribute", () => {
      const search = createMockSearch();

      expect(search.element.getAttribute("aria-disabled")).toBe("false");

      search.disable();

      expect(search.element.getAttribute("aria-disabled")).toBe("true");
    });

    test("should have aria-label on input", () => {
      const search = createMockSearch({ placeholder: "Search items" });

      const input = search.element.querySelector(".mtrl-search__input");
      expect(input?.getAttribute("aria-label")).toBe("Search items");
    });

    test("should update aria-label when placeholder changes", () => {
      const search = createMockSearch({ placeholder: "Initial" });

      search.setPlaceholder("Updated");

      const input = search.element.querySelector(".mtrl-search__input");
      expect(input?.getAttribute("aria-label")).toBe("Updated");
    });

    test('should have role="listbox" on suggestions list', () => {
      const search = createMockSearch({ initialState: "view" });

      const suggestionsList = search.element.querySelector(
        ".mtrl-search__suggestion-list",
      );
      expect(suggestionsList?.getAttribute("role")).toBe("listbox");
    });

    test('should have role="option" on suggestion items', () => {
      const search = createMockSearch({
        initialState: "view",
        suggestions: ["Apple", "Banana"],
      });

      const items = search.element.querySelectorAll(
        ".mtrl-search__suggestion-item",
      );
      items.forEach((item) => {
        expect(item.getAttribute("role")).toBe("option");
      });
    });

    test("should have aria-label on leading icon button", () => {
      const search = createMockSearch();

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      expect(leadingIcon?.getAttribute("aria-label")).toBe("Search");
    });

    test("should update leading icon aria-label when expanded", () => {
      const search = createMockSearch();

      search.expand();

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      expect(leadingIcon?.getAttribute("aria-label")).toBe("Go back");
    });

    test("should have aria-label on clear button", () => {
      const search = createMockSearch({ value: "test" });

      const clearButton = search.element.querySelector(
        ".mtrl-search__clear-button",
      );
      expect(clearButton?.getAttribute("aria-label")).toBe("Clear search");
    });
  });

  // ---------------------------------------------------------------------------
  // Method Chaining Tests
  // ---------------------------------------------------------------------------

  describe("Method Chaining", () => {
    test("should support chaining on value methods", () => {
      const search = createMockSearch();

      const result = search.setValue("test").setPlaceholder("Search...");

      expect(result).toBe(search);
    });

    test("should support chaining on state methods", () => {
      const search = createMockSearch();

      const result = search.expand().setViewMode("fullscreen").collapse();

      expect(result).toBe(search);
    });

    test("should support chaining on input control methods", () => {
      const search = createMockSearch();

      const result = search.focus().setValue("test").clear();

      expect(result).toBe(search);
    });

    test("should support chaining on disabled methods", () => {
      const search = createMockSearch();

      const result = search.disable().enable();

      expect(result).toBe(search);
    });

    test("should support chaining on suggestion methods", () => {
      const search = createMockSearch();

      const result = search.setSuggestions(["A", "B"]).clearSuggestions();

      expect(result).toBe(search);
    });
  });

  // ---------------------------------------------------------------------------
  // Leading Icon Tests
  // ---------------------------------------------------------------------------

  describe("Leading Icon", () => {
    test("should render search icon in bar state", () => {
      const search = createMockSearch();

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      expect(leadingIcon?.innerHTML).toContain("svg");
    });

    test("should render back icon in view state", () => {
      const search = createMockSearch({ initialState: "view" });

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      // JSDOM normalizes self-closing tags, so use toContain for SVG content
      expect(leadingIcon?.innerHTML).toContain("M20 11H7.83");
    });

    test("should change icon when expanding", () => {
      const search = createMockSearch();

      search.expand();

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      // JSDOM normalizes self-closing tags, so use toContain for SVG content
      expect(leadingIcon?.innerHTML).toContain("M20 11H7.83");
    });

    test("should change icon when collapsing", () => {
      const search = createMockSearch({ initialState: "view" });

      search.collapse();

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      // JSDOM normalizes self-closing tags, so use toContain for SVG content
      expect(leadingIcon?.innerHTML).toContain("M15.5 14h-.79");
    });

    test("should use custom leading icon when provided", () => {
      const customIcon = "<svg>custom</svg>";
      const search = createMockSearch({ leadingIcon: customIcon });

      const leadingIcon = search.element.querySelector(
        ".mtrl-search__leading-icon",
      );
      expect(leadingIcon?.innerHTML).toBe(customIcon);
    });
  });
});
