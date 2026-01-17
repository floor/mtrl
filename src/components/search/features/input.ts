// src/components/search/features/input.ts

import { SearchConfig, SearchSuggestion } from "../types";
import { SEARCH_CLASSES, SEARCH_EVENTS } from "../constants";

/**
 * Normalizes suggestions to SearchSuggestion[] format
 */
const normalizeSuggestions = (
  suggestions: SearchSuggestion[] | string[] | undefined
): SearchSuggestion[] => {
  if (!suggestions) {
    return [];
  }

  return suggestions.map((item) => {
    if (typeof item === "string") {
      return { text: item, value: item };
    }
    return { ...item, value: item.value ?? item.text };
  });
};

/**
 * Adds input handling features to the search component
 * Manages value, placeholder, and input events
 *
 * @param config Search configuration
 * @returns Component enhancer with input features
 */
export const withInput = (config: SearchConfig) => (component) => {
  // Initialize state
  let currentValue = config.value || "";
  let currentPlaceholder = config.placeholder || "Search";
  let suggestions: SearchSuggestion[] = normalizeSuggestions(config.suggestions);

  // Helper to get prefixed class names
  const getClass = (className: string): string => {
    return component.getClass ? component.getClass(className) : className;
  };

  /**
   * Creates an event data object
   */
  const createEventData = (
    eventType: string,
    originalEvent: Event | null = null,
    extra: Record<string, unknown> = {}
  ) => {
    const eventData = {
      component,
      value: currentValue,
      originalEvent,
      preventDefault: () => {
        eventData.defaultPrevented = true;
      },
      defaultPrevented: false,
      ...extra,
    };
    return eventData;
  };

  /**
   * Emits an event and calls the corresponding config handler
   */
  const emitEvent = (
    eventType: string,
    originalEvent: Event | null = null,
    extra: Record<string, unknown> = {}
  ) => {
    const eventData = createEventData(eventType, originalEvent, extra);

    // Emit via component's event system
    if (component.emit) {
      component.emit(eventType, eventData);
    }

    // Call config handler if provided
    const handlerName = `on${eventType.charAt(0).toUpperCase()}${eventType.slice(1)}`;
    const handler = config[handlerName as keyof SearchConfig];
    if (typeof handler === "function") {
      if (eventType === "suggestionSelect" && extra.suggestion) {
        (handler as (suggestion: SearchSuggestion) => void)(
          extra.suggestion as SearchSuggestion
        );
      } else {
        (handler as (value: string) => void)(currentValue);
      }
    }

    return eventData;
  };

  /**
   * Updates the clear button visibility
   */
  const updateClearButton = (hasValue: boolean): void => {
    const clearButton = component.structure?.clearButton;
    if (!clearButton) return;

    if (hasValue) {
      clearButton.classList.remove(getClass(SEARCH_CLASSES.CLEAR_BUTTON_HIDDEN));
      if (!component.disabled?.isDisabled()) {
        clearButton.tabIndex = 0;
      }
    } else {
      clearButton.classList.add(getClass(SEARCH_CLASSES.CLEAR_BUTTON_HIDDEN));
      clearButton.tabIndex = -1;
    }
  };

  /**
   * Sets the input value
   */
  const setValue = (value: string, triggerEvent = true): void => {
    const previousValue = currentValue;
    currentValue = value;

    // Update DOM
    const input = component.structure?.input;
    if (input && input.value !== value) {
      input.value = value;
    }

    // Update clear button visibility
    updateClearButton(!!value);

    // Update populated state
    if (component.states?.updatePopulatedState) {
      component.states.updatePopulatedState(!!value);
    }

    // Emit input event if value changed and triggering is enabled
    if (triggerEvent && value !== previousValue) {
      emitEvent(SEARCH_EVENTS.INPUT);
    }
  };

  /**
   * Gets the current value
   */
  const getValue = (): string => {
    return currentValue;
  };

  /**
   * Sets the placeholder text
   */
  const setPlaceholder = (text: string): void => {
    currentPlaceholder = text;

    const input = component.structure?.input;
    if (input) {
      input.placeholder = text;
      input.setAttribute("aria-label", text);
    }
  };

  /**
   * Gets the current placeholder
   */
  const getPlaceholder = (): string => {
    return currentPlaceholder;
  };

  /**
   * Clears the input value
   */
  const clear = (triggerEvent = true): void => {
    setValue("", false);

    // Focus input after clearing
    const input = component.structure?.input;
    if (input && !component.disabled?.isDisabled()) {
      input.focus();
    }

    if (triggerEvent) {
      emitEvent(SEARCH_EVENTS.CLEAR);
    }
  };

  /**
   * Submits the current search value
   */
  const submit = (): void => {
    if (currentValue) {
      emitEvent(SEARCH_EVENTS.SUBMIT);
    }
  };

  /**
   * Focuses the input element
   */
  const focus = (): void => {
    const input = component.structure?.input;
    if (input && !component.disabled?.isDisabled()) {
      input.focus();
    }
  };

  /**
   * Blurs the input element
   */
  const blur = (): void => {
    const input = component.structure?.input;
    if (input) {
      input.blur();
    }
  };

  /**
   * Sets the suggestions
   */
  const setSuggestions = (
    newSuggestions: SearchSuggestion[] | string[]
  ): void => {
    suggestions = normalizeSuggestions(newSuggestions);
  };

  /**
   * Gets the current suggestions
   */
  const getSuggestions = (): SearchSuggestion[] => {
    return [...suggestions];
  };

  /**
   * Clears all suggestions
   */
  const clearSuggestions = (): void => {
    suggestions = [];
  };

  /**
   * Selects a suggestion
   */
  const selectSuggestion = (suggestion: SearchSuggestion): void => {
    setValue(suggestion.value ?? suggestion.text, false);
    emitEvent(SEARCH_EVENTS.SUGGESTION_SELECT, null, { suggestion });
  };

  /**
   * Sets up input event listeners
   */
  const setupEventListeners = (): void => {
    const input = component.structure?.input;
    const clearButton = component.structure?.clearButton;
    const leadingIcon = component.structure?.leadingIcon;

    if (!input) return;

    // Input event - value changes
    input.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      setValue(target.value, true);
    });

    // Focus event
    input.addEventListener("focus", (e: FocusEvent) => {
      if (component.states?.updateFocusedState) {
        component.states.updateFocusedState(true);
      }
      emitEvent(SEARCH_EVENTS.FOCUS, e);

      // Auto-expand on focus if configured
      if (config.expandOnFocus !== false && component.states?.expand) {
        component.states.expand();
      }
    });

    // Blur event
    input.addEventListener("blur", (e: FocusEvent) => {
      if (component.states?.updateFocusedState) {
        component.states.updateFocusedState(false);
      }
      emitEvent(SEARCH_EVENTS.BLUR, e);

      // Auto-collapse on blur if configured (with delay for click handling)
      if (config.collapseOnBlur !== false && component.states?.collapse) {
        const delay = config.collapseDelay ?? 150;
        setTimeout(() => {
          // Only collapse if still blurred (not re-focused)
          if (document.activeElement !== input) {
            component.states.collapse();
          }
        }, delay);
      }
    });

    // Keydown event - Enter to submit, Escape to clear/collapse
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          submit();
          break;

        case "Escape":
          e.preventDefault();
          if (currentValue) {
            clear();
          } else if (component.states?.isExpanded?.()) {
            component.states.collapse();
          }
          break;

        case "ArrowDown":
          // Handled by suggestions feature
          break;

        case "ArrowUp":
          // Handled by suggestions feature
          break;
      }
    });

    // Clear button click
    if (clearButton) {
      clearButton.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        clear();
      });

      // Keyboard support for clear button
      clearButton.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          clear();
        }
      });
    }

    // Leading icon click - expand or collapse
    if (leadingIcon) {
      leadingIcon.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();

        if (component.states?.isExpanded?.()) {
          component.states.collapse();
        } else {
          component.states?.expand();
        }
      });

      // Keyboard support for leading icon
      leadingIcon.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();

          if (component.states?.isExpanded?.()) {
            component.states.collapse();
          } else {
            component.states?.expand();
          }
        }
      });
    }
  };

  // Initialize event listeners after structure is ready
  setTimeout(() => {
    setupEventListeners();
  }, 0);

  // Return enhanced component with input features
  return {
    ...component,

    input: {
      /**
       * Sets the input value
       */
      setValue,

      /**
       * Gets the current value
       */
      getValue,

      /**
       * Sets the placeholder text
       */
      setPlaceholder,

      /**
       * Gets the current placeholder
       */
      getPlaceholder,

      /**
       * Clears the input
       */
      clear,

      /**
       * Submits the search
       */
      submit,

      /**
       * Focuses the input
       */
      focus,

      /**
       * Blurs the input
       */
      blur,

      /**
       * Sets suggestions
       */
      setSuggestions,

      /**
       * Gets suggestions
       */
      getSuggestions,

      /**
       * Clears suggestions
       */
      clearSuggestions,

      /**
       * Selects a suggestion
       */
      selectSuggestion,

      /**
       * Emits an event (for use by other features)
       */
      emitEvent,
    },
  };
};
