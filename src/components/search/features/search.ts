// src/components/search/features/search.ts
import { SearchConfig } from "../types";

/**
 * Add main search functionality to component
 * @param config Search configuration
 * @returns Component enhancer with search functionality
 */
export const withSearch = (config: SearchConfig) => (component) => {
  // Ensure component has events capability
  if (!component.emit) {
    console.warn("Search component requires event emission capability");
  }

  // Ensure component structure exists
  if (!component.structure) {
    console.error("Search component missing structure");
    return component;
  }

  // Get elements from structure
  const {
    input,
    leadingIcon,
    clearButton,
    trailingIcon,
    trailingIcon2,
    avatar,
    divider,
    suggestionsContainer,
  } = component.structure;

  // Create state object
  const state = {
    value: config.value || "",
    placeholder: config.placeholder || "Search",
    suggestions: config.suggestions || [],
    isFocused: false,
    isExpanded: config.variant === "view",
    component,
  };

  // Create event helpers
  const eventHelpers = {
    triggerEvent(eventName, originalEvent = null) {
      const eventData = {
        search: state.component,
        value: state.value,
        originalEvent,
        preventDefault: () => {
          eventData.defaultPrevented = true;
        },
        defaultPrevented: false,
      };

      if (component.emit) {
        component.emit(eventName, eventData);
      }

      // Call onEvent handlers from config if they exist
      const handlerName = `on${
        eventName.charAt(0).toUpperCase() + eventName.slice(1)
      }`;
      if (config[handlerName] && typeof config[handlerName] === "function") {
        config[handlerName](state.value);
      }

      return eventData;
    },
  };

  /**
   * Updates the value and UI
   */
  const updateValue = (newValue, triggerEvent = true) => {
    // Update internal state
    state.value = newValue;

    // Update input value
    if (input) {
      input.value = newValue;
    }

    // Show/hide clear button
    if (clearButton) {
      if (newValue) {
        clearButton.classList.remove(
          `${component.getClass("search-clear-button")}--hidden`
        );
        if (!component.disabled?.isDisabled()) {
          clearButton.tabIndex = 0;
        }
      } else {
        clearButton.classList.add(
          `${component.getClass("search-clear-button")}--hidden`
        );
        clearButton.tabIndex = -1;
      }
    }

    // Trigger input event
    if (triggerEvent) {
      eventHelpers.triggerEvent("input");
    }
  };

  /**
   * Submits the current search value
   */
  const submitSearch = () => {
    if (state.value) {
      eventHelpers.triggerEvent("submit");

      // Hide suggestions if in bar mode
      if (!state.isExpanded) {
        hideSuggestions();
      }
    }
  };

  /**
   * Clears the search input
   */
  const clearSearch = (triggerEvent = true) => {
    updateValue("", triggerEvent);

    if (input) {
      input.focus();
    }

    if (triggerEvent) {
      eventHelpers.triggerEvent("clear");
    }
  };

  /**
   * Shows suggestions
   */
  const showSuggestions = () => {
    if (suggestionsContainer) {
      renderSuggestions();
    }
  };

  /**
   * Hides suggestions
   */
  const hideSuggestions = () => {
    if (suggestionsContainer) {
      suggestionsContainer.classList.remove(
        `${component.getClass("search-suggestions-container")}--visible`
      );
    }
  };

  /**
   * Expands search bar to view mode
   */
  const expandToView = () => {
    if (state.isExpanded) return;

    state.isExpanded = true;
    component.element.classList.add(
      `${component.getClass("search")}--expanded`
    );

    // Apply view variant class if not already present
    if (
      !component.element.classList.contains(
        `${component.getClass("search")}--view`
      )
    ) {
      component.element.classList.remove(
        `${component.getClass("search")}--bar`
      );
      component.element.classList.add(`${component.getClass("search")}--view`);
    }

    // Show suggestions
    showSuggestions();

    // Focus input
    if (input) {
      setTimeout(() => {
        input.focus();
      }, 50);
    }
  };

  /**
   * Collapses view mode to search bar
   */
  const collapseToBar = () => {
    if (!state.isExpanded) return;

    state.isExpanded = false;
    component.element.classList.remove(
      `${component.getClass("search")}--expanded`
    );

    // Apply bar variant class if not already present
    if (
      !component.element.classList.contains(
        `${component.getClass("search")}--bar`
      )
    ) {
      component.element.classList.remove(
        `${component.getClass("search")}--view`
      );
      component.element.classList.add(`${component.getClass("search")}--bar`);
    }

    // Hide suggestions
    hideSuggestions();

    // Blur input
    if (input) {
      input.blur();
    }
  };

  /**
   * Renders suggestions in the suggestions container
   */
  const renderSuggestions = () => {
    if (
      !suggestionsContainer ||
      !state.suggestions ||
      !state.suggestions.length
    ) {
      return;
    }

    // Clear previous suggestions
    suggestionsContainer.innerHTML = "";

    // Create a list for suggestions
    const list = document.createElement("ul");
    list.className = component.getClass("search-suggestions-list");
    list.setAttribute("role", "listbox");

    // Add suggestions
    state.suggestions.forEach((suggestion) => {
      const item = document.createElement("li");
      item.className = component.getClass("search-suggestion-item");
      item.setAttribute("role", "option");
      item.tabIndex = 0;

      // Determine if suggestion is a string or object
      if (typeof suggestion === "string") {
        item.textContent = suggestion;
        // Highlight matched text if current input is a substring
        if (
          state.value &&
          suggestion.toLowerCase().includes(state.value.toLowerCase())
        ) {
          const matchedIndex = suggestion
            .toLowerCase()
            .indexOf(state.value.toLowerCase());
          const beforeMatch = suggestion.slice(0, matchedIndex);
          const match = suggestion.slice(
            matchedIndex,
            matchedIndex + state.value.length
          );
          const afterMatch = suggestion.slice(
            matchedIndex + state.value.length
          );

          item.innerHTML = `${beforeMatch}<strong>${match}</strong>${afterMatch}`;
        }
      } else {
        // Object with text, value, and optional icon
        if (suggestion.icon) {
          const iconElement = document.createElement("span");
          iconElement.className = component.getClass("search-suggestion-icon");
          iconElement.innerHTML = suggestion.icon;
          item.appendChild(iconElement);
        }

        const textElement = document.createElement("span");
        textElement.className = component.getClass("search-suggestion-text");
        textElement.textContent = suggestion.text;

        // Highlight matched text if current input is a substring
        if (
          state.value &&
          suggestion.text.toLowerCase().includes(state.value.toLowerCase())
        ) {
          const matchedIndex = suggestion.text
            .toLowerCase()
            .indexOf(state.value.toLowerCase());
          const beforeMatch = suggestion.text.slice(0, matchedIndex);
          const match = suggestion.text.slice(
            matchedIndex,
            matchedIndex + state.value.length
          );
          const afterMatch = suggestion.text.slice(
            matchedIndex + state.value.length
          );

          textElement.innerHTML = `${beforeMatch}<strong>${match}</strong>${afterMatch}`;
        }

        item.appendChild(textElement);

        // Store value as data attribute
        if (suggestion.value) {
          item.dataset.value = suggestion.value;
        }
      }

      // Add click handler
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selectedValue =
          item.dataset.value ||
          (typeof suggestion === "string" ? suggestion : suggestion.text);
        updateValue(selectedValue);
        submitSearch();
      });

      list.appendChild(item);
    });

    // Add divider if configured and not already present
    if (
      config.showDividers &&
      divider &&
      divider.parentElement !== suggestionsContainer
    ) {
      const dividerClone = divider.cloneNode(true);
      suggestionsContainer.appendChild(dividerClone);
    }

    suggestionsContainer.appendChild(list);

    // Show suggestions container
    suggestionsContainer.classList.add(
      `${component.getClass("search-suggestions-container")}--visible`
    );
  };

  /**
   * Sets up all event listeners
   */
  const setupEventListeners = () => {
    // Input events
    if (input) {
      // Input value change
      input.addEventListener("input", (e) => {
        updateValue(e.target.value);

        // Show suggestions if expanded
        if (state.isExpanded) {
          showSuggestions();
        }
      });

      // Focus event
      input.addEventListener("focus", (e) => {
        state.isFocused = true;
        component.element.classList.add(
          `${component.getClass("search")}--focused`
        );

        // Expand search bar to view if in bar mode
        if (!state.isExpanded && config.variant === "bar") {
          expandToView();
        }

        eventHelpers.triggerEvent("focus", e);
      });

      // Blur event
      input.addEventListener("blur", (e) => {
        // Don't blur if clicking inside the search component
        if (component.element.contains(e.relatedTarget)) {
          return;
        }

        state.isFocused = false;
        component.element.classList.remove(
          `${component.getClass("search")}--focused`
        );

        // Hide suggestions with slight delay to allow for clicks
        setTimeout(() => {
          if (!state.isFocused) {
            hideSuggestions();

            // Collapse to bar mode if in expanded state and originally a bar
            if (state.isExpanded && config.variant === "bar") {
              collapseToBar();
            }
          }
        }, 200);

        eventHelpers.triggerEvent("blur", e);
      });

      // Enter key for submit
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitSearch();
        } else if (e.key === "Escape") {
          e.preventDefault();

          // Clear if there's a value, otherwise collapse
          if (state.value) {
            clearSearch();
          } else if (state.isExpanded && config.variant === "bar") {
            collapseToBar();
          }
        }
      });
    }

    // Leading icon click
    if (leadingIcon) {
      leadingIcon.addEventListener("click", (e) => {
        e.preventDefault();

        // If disabled, do nothing
        if (component.disabled?.isDisabled()) return;

        // Toggle between expanded and collapsed
        if (state.isExpanded) {
          collapseToBar();
        } else {
          expandToView();
        }

        eventHelpers.triggerEvent("iconClick", e);
      });

      // Keyboard access
      leadingIcon.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          leadingIcon.click();
        }
      });
    }

    // Clear button click
    if (clearButton) {
      clearButton.addEventListener("click", (e) => {
        e.preventDefault();

        // If disabled, do nothing
        if (component.disabled?.isDisabled()) return;

        clearSearch();
      });

      // Keyboard access
      clearButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          clearButton.click();
        }
      });
    }

    // Trailing icon click
    if (trailingIcon) {
      trailingIcon.addEventListener("click", (e) => {
        e.preventDefault();

        // If disabled, do nothing
        if (component.disabled?.isDisabled()) return;

        eventHelpers.triggerEvent("iconClick", e);
      });

      // Keyboard access
      trailingIcon.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trailingIcon.click();
        }
      });
    }

    // Second trailing icon click
    if (trailingIcon2) {
      trailingIcon2.addEventListener("click", (e) => {
        e.preventDefault();

        // If disabled, do nothing
        if (component.disabled?.isDisabled()) return;

        eventHelpers.triggerEvent("iconClick", e);
      });

      // Keyboard access
      trailingIcon2.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trailingIcon2.click();
        }
      });
    }

    // Handle clicks outside to close suggestions
    document.addEventListener("click", (e) => {
      if (!component.element.contains(e.target) && state.isExpanded) {
        hideSuggestions();

        // Collapse to bar mode if in expanded state and originally a bar
        if (state.isExpanded && config.variant === "bar") {
          collapseToBar();
        }
      }
    });
  };

  /**
   * Clean up all event listeners
   */
  const cleanupEventListeners = () => {
    // Nothing to do if component is already destroyed
    if (!component.element) return;

    // Document click listener cleanup
    document.removeEventListener("click", (e) => {
      if (!component.element.contains(e.target) && state.isExpanded) {
        hideSuggestions();

        // Collapse to bar mode if in expanded state and originally a bar
        if (state.isExpanded && config.variant === "bar") {
          collapseToBar();
        }
      }
    });
  };

  // Initialize search component
  const initSearch = () => {
    // Set initial value if provided
    if (config.value && input) {
      input.value = config.value;

      // Show clear button if value exists
      if (clearButton && config.showClearButton !== false) {
        clearButton.classList.remove(
          `${component.getClass("search-clear-button")}--hidden`
        );
      }
    }

    // Set ARIA attributes
    if (input) {
      input.setAttribute("role", "searchbox");
      input.setAttribute("aria-label", state.placeholder || "Search");
    }

    // Setup event listeners
    setupEventListeners();

    // If in view mode, show suggestions
    if (
      state.isExpanded &&
      config.suggestions &&
      config.suggestions.length > 0
    ) {
      showSuggestions();
    }
  };

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      cleanupEventListeners();
      originalDestroy();
    };
  }

  // Initialize search
  initSearch();

  // Return enhanced component
  return {
    ...component,
    search: {
      /**
       * Sets search value
       * @param value New value
       * @param triggerEvent Whether to trigger change event
       * @returns Search controller for chaining
       */
      setValue(value, triggerEvent = true) {
        updateValue(value, triggerEvent);
        return this;
      },

      /**
       * Gets search value
       * @returns Current value
       */
      getValue() {
        return state.value;
      },

      /**
       * Sets placeholder text
       * @param text New placeholder text
       * @returns Search controller for chaining
       */
      setPlaceholder(text) {
        state.placeholder = text;
        if (input) {
          input.placeholder = text;
          input.setAttribute("aria-label", text);
        }
        return this;
      },

      /**
       * Gets placeholder text
       * @returns Current placeholder
       */
      getPlaceholder() {
        return state.placeholder;
      },

      /**
       * Focuses the search input
       * @returns Search controller for chaining
       */
      focus() {
        if (input && !component.disabled?.isDisabled()) {
          input.focus();
        }
        return this;
      },

      /**
       * Blurs the search input
       * @returns Search controller for chaining
       */
      blur() {
        if (input) {
          input.blur();
        }
        return this;
      },

      /**
       * Expands the search bar into view mode
       * @returns Search controller for chaining
       */
      expand() {
        expandToView();
        return this;
      },

      /**
       * Collapses the search view back to bar mode
       * @returns Search controller for chaining
       */
      collapse() {
        collapseToBar();
        return this;
      },

      /**
       * Clears the search input
       * @returns Search controller for chaining
       */
      clear() {
        clearSearch();
        return this;
      },

      /**
       * Submits the search
       * @returns Search controller for chaining
       */
      submit() {
        submitSearch();
        return this;
      },

      /**
       * Sets suggestions
       * @param suggestions Array of suggestions
       * @returns Search controller for chaining
       */
      setSuggestions(suggestions) {
        state.suggestions = suggestions;
        if (state.isExpanded) {
          renderSuggestions();
        }
        return this;
      },

      /**
       * Shows or hides suggestions
       * @param show Whether to show suggestions
       * @returns Search controller for chaining
       */
      showSuggestions(show) {
        if (show) {
          showSuggestions();
        } else {
          hideSuggestions();
        }
        return this;
      },
    },

    // Icon management - separate from appearance to make API cleaner
    icons: {
      /**
       * Sets leading icon
       * @param iconHtml HTML content for icon
       * @returns Icon manager for chaining
       */
      setLeadingIcon(iconHtml) {
        if (leadingIcon) {
          leadingIcon.innerHTML = iconHtml || "";
        }
        return this;
      },

      /**
       * Sets trailing icon
       * @param iconHtml HTML content for icon
       * @returns Icon manager for chaining
       */
      setTrailingIcon(iconHtml) {
        if (trailingIcon) {
          trailingIcon.innerHTML = iconHtml || "";
        }
        return this;
      },

      /**
       * Sets second trailing icon
       * @param iconHtml HTML content for icon
       * @returns Icon manager for chaining
       */
      setTrailingIcon2(iconHtml) {
        if (trailingIcon2) {
          trailingIcon2.innerHTML = iconHtml || "";
        }
        return this;
      },

      /**
       * Sets avatar
       * @param avatarHtml HTML content for avatar
       * @returns Icon manager for chaining
       */
      setAvatar(avatarHtml) {
        if (avatar) {
          avatar.innerHTML = avatarHtml || "";
        }
        return this;
      },

      /**
       * Shows or hides clear button
       * @param show Whether to show clear button
       * @returns Icon manager for chaining
       */
      showClearButton(show) {
        if (clearButton) {
          if (show) {
            clearButton.classList.remove(
              `${component.getClass("search-clear-button")}--hidden`
            );
          } else {
            clearButton.classList.add(
              `${component.getClass("search-clear-button")}--hidden`
            );
          }
        }
        return this;
      },
    },
  };
};
