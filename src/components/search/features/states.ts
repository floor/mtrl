// src/components/search/features/states.ts

import { SearchConfig, SearchState, SearchViewMode } from "../types";
import {
  SEARCH_STATES,
  SEARCH_VIEW_MODES,
  SEARCH_CLASSES,
  SEARCH_ICONS,
} from "../constants";

/**
 * Adds state management features to the search component
 * Handles bar ↔ view transitions per MD3 specifications
 *
 * @param config Search configuration
 * @returns Component enhancer with state management features
 */
export const withStates = (config: SearchConfig) => (component) => {
  // Initialize state
  let currentState: SearchState = config.initialState || SEARCH_STATES.BAR;
  let currentViewMode: SearchViewMode =
    config.viewMode || SEARCH_VIEW_MODES.DOCKED;
  let isDisabled = config.disabled === true;

  // Helper to get prefixed class names
  const getClass = (className: string): string => {
    return component.getClass ? component.getClass(className) : className;
  };

  /**
   * Transitions from bar state to view state
   */
  const expandToView = (): void => {
    if (currentState === SEARCH_STATES.VIEW || isDisabled) {
      return;
    }

    const element = component.element;
    const structure = component.structure;

    // Update state
    currentState = SEARCH_STATES.VIEW;

    // Update classes
    element.classList.remove(getClass(SEARCH_CLASSES.STATE_BAR));
    element.classList.add(getClass(SEARCH_CLASSES.STATE_VIEW));

    // Update leading icon to back arrow
    if (structure?.leadingIcon) {
      structure.leadingIcon.innerHTML = SEARCH_ICONS.BACK;
      structure.leadingIcon.setAttribute("aria-label", "Go back");
    }

    // Append divider and content area if not already present
    if (structure?.divider && !element.contains(structure.divider)) {
      element.appendChild(structure.divider);
    }

    if (
      structure?.suggestionsContainer?.parentElement &&
      !element.contains(structure.suggestionsContainer.parentElement)
    ) {
      element.appendChild(structure.suggestionsContainer.parentElement);
    }

    // Focus input after transition
    if (structure?.input) {
      requestAnimationFrame(() => {
        structure.input.focus();
      });
    }

    // Emit expand event
    if (component.emit) {
      component.emit("expand", {
        component,
        state: currentState,
        viewMode: currentViewMode,
      });
    }
  };

  /**
   * Transitions from view state to bar state
   */
  const collapseToBar = (): void => {
    if (currentState === SEARCH_STATES.BAR) {
      return;
    }

    const element = component.element;
    const structure = component.structure;

    // Update state
    currentState = SEARCH_STATES.BAR;

    // Update classes
    element.classList.remove(getClass(SEARCH_CLASSES.STATE_VIEW));
    element.classList.add(getClass(SEARCH_CLASSES.STATE_BAR));

    // Update leading icon to search icon
    if (structure?.leadingIcon) {
      structure.leadingIcon.innerHTML =
        config.leadingIcon || SEARCH_ICONS.SEARCH;
      structure.leadingIcon.setAttribute("aria-label", "Search");
    }

    // Remove divider and content area from DOM (keep references)
    if (structure?.divider && element.contains(structure.divider)) {
      element.removeChild(structure.divider);
    }

    if (
      structure?.suggestionsContainer?.parentElement &&
      element.contains(structure.suggestionsContainer.parentElement)
    ) {
      element.removeChild(structure.suggestionsContainer.parentElement);
    }

    // Emit collapse event
    if (component.emit) {
      component.emit("collapse", {
        component,
        state: currentState,
        viewMode: currentViewMode,
      });
    }
  };

  /**
   * Sets the view mode (docked or fullscreen)
   */
  const setViewMode = (mode: SearchViewMode): void => {
    if (mode === currentViewMode) {
      return;
    }

    const element = component.element;

    // Remove current view mode class
    element.classList.remove(
      getClass(
        currentViewMode === SEARCH_VIEW_MODES.DOCKED
          ? SEARCH_CLASSES.VIEW_DOCKED
          : SEARCH_CLASSES.VIEW_FULLSCREEN,
      ),
    );

    // Update state
    currentViewMode = mode;

    // Add new view mode class
    element.classList.add(
      getClass(
        mode === SEARCH_VIEW_MODES.DOCKED
          ? SEARCH_CLASSES.VIEW_DOCKED
          : SEARCH_CLASSES.VIEW_FULLSCREEN,
      ),
    );
  };

  /**
   * Disables the component
   */
  const disableComponent = (): void => {
    isDisabled = true;

    const element = component.element;
    const structure = component.structure;

    element.classList.add(getClass(SEARCH_CLASSES.DISABLED));
    element.setAttribute("aria-disabled", "true");

    // Disable input
    if (structure?.input) {
      structure.input.disabled = true;
    }

    // Disable interactive elements
    const interactiveElements = [
      structure?.leadingIcon,
      structure?.clearButton,
    ].filter(Boolean);

    // Add trailing items if they exist
    if (structure?.trailingContainer) {
      const trailingButtons =
        structure.trailingContainer.querySelectorAll("button");
      trailingButtons.forEach((btn) => interactiveElements.push(btn));
    }

    interactiveElements.forEach((el) => {
      if (el) {
        (el as HTMLElement).tabIndex = -1;
        el.setAttribute("aria-disabled", "true");
      }
    });
  };

  /**
   * Enables the component
   */
  const enableComponent = (): void => {
    isDisabled = false;

    const element = component.element;
    const structure = component.structure;

    element.classList.remove(getClass(SEARCH_CLASSES.DISABLED));
    element.setAttribute("aria-disabled", "false");

    // Enable input
    if (structure?.input) {
      structure.input.disabled = false;
    }

    // Enable interactive elements
    const interactiveElements = [
      structure?.leadingIcon,
      structure?.clearButton,
    ].filter(Boolean);

    // Add trailing items if they exist
    if (structure?.trailingContainer) {
      const trailingButtons =
        structure.trailingContainer.querySelectorAll("button");
      trailingButtons.forEach((btn) => interactiveElements.push(btn));
    }

    interactiveElements.forEach((el) => {
      if (el) {
        (el as HTMLElement).tabIndex = 0;
        el.setAttribute("aria-disabled", "false");
      }
    });

    // Clear button special case - only enable if there's text
    if (structure?.clearButton && structure.input && !structure.input.value) {
      structure.clearButton.tabIndex = -1;
    }
  };

  /**
   * Updates the populated state class based on input value
   */
  const updatePopulatedState = (hasValue: boolean): void => {
    const element = component.element;

    if (hasValue) {
      element.classList.add(getClass(SEARCH_CLASSES.POPULATED));
    } else {
      element.classList.remove(getClass(SEARCH_CLASSES.POPULATED));
    }
  };

  /**
   * Updates the focused state class
   */
  const updateFocusedState = (isFocused: boolean): void => {
    const element = component.element;

    if (isFocused) {
      element.classList.add(getClass(SEARCH_CLASSES.FOCUSED));
    } else {
      element.classList.remove(getClass(SEARCH_CLASSES.FOCUSED));
    }
  };

  // Apply initial disabled state if needed
  if (isDisabled) {
    // Use setTimeout to ensure structure is ready
    setTimeout(() => {
      disableComponent();
    }, 0);
  }

  // Return enhanced component with state management
  return {
    ...component,

    // State management API
    states: {
      /**
       * Expands to search view
       */
      expand: expandToView,

      /**
       * Collapses to search bar
       */
      collapse: collapseToBar,

      /**
       * Gets the current state
       */
      getState: (): SearchState => currentState,

      /**
       * Checks if currently expanded (in view state)
       */
      isExpanded: (): boolean => currentState === SEARCH_STATES.VIEW,

      /**
       * Sets the view mode
       */
      setViewMode,

      /**
       * Gets the current view mode
       */
      getViewMode: (): SearchViewMode => currentViewMode,

      /**
       * Updates populated state
       */
      updatePopulatedState,

      /**
       * Updates focused state
       */
      updateFocusedState,
    },

    // Disabled state management (for backward compatibility)
    disabled: {
      /**
       * Enables the component
       */
      enable(): typeof this {
        enableComponent();
        return this;
      },

      /**
       * Disables the component
       */
      disable(): typeof this {
        disableComponent();
        return this;
      },

      /**
       * Checks if component is disabled
       */
      isDisabled: (): boolean => isDisabled,
    },
  };
};
