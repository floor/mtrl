// src/components/search/features/suggestions.ts

import { SearchConfig, SearchSuggestion } from "../types";
import { SEARCH_CLASSES, SEARCH_KEYS, SEARCH_ICONS } from "../constants";
import { createElement } from "../../../core/dom/create";

/**
 * Adds suggestion list features to the search component
 * Handles rendering suggestions and keyboard navigation per MD3 specifications
 *
 * @param config Search configuration
 * @returns Component enhancer with suggestions features
 */
export const withSuggestions = (config: SearchConfig) => (component) => {
  // State
  let highlightedIndex = -1;
  let currentSuggestions: SearchSuggestion[] = [];

  // Helper to get prefixed class names
  const getClass = (className: string): string => {
    return component.getClass ? component.getClass(className) : className;
  };

  /**
   * Gets the suggestions from the input feature
   */
  const getSuggestions = (): SearchSuggestion[] => {
    if (component.input?.getSuggestions) {
      return component.input.getSuggestions();
    }
    return currentSuggestions;
  };

  /**
   * Highlights text that matches the current search query
   */
  const highlightMatch = (text: string, query: string): string => {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) return text;

    const beforeMatch = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + query.length);
    const afterMatch = text.slice(matchIndex + query.length);

    return `${beforeMatch}<strong>${match}</strong>${afterMatch}`;
  };

  /**
   * Creates a suggestion item element
   */
  const createSuggestionItem = (
    suggestion: SearchSuggestion,
    index: number,
    query: string
  ): HTMLElement => {
    const isHighlighted = index === highlightedIndex;

    const itemClasses = [getClass(SEARCH_CLASSES.SUGGESTION_ITEM)];
    if (isHighlighted) {
      itemClasses.push(getClass(SEARCH_CLASSES.SUGGESTION_ITEM_SELECTED));
    }

    const item = createElement({
      tag: "li",
      className: itemClasses.join(" "),
      attributes: {
        role: "option",
        "aria-selected": isHighlighted ? "true" : "false",
        "data-index": String(index),
        "data-value": suggestion.value ?? suggestion.text,
        tabindex: "-1",
      },
    });

    // Add icon if present
    if (suggestion.icon) {
      const iconElement = createElement({
        tag: "span",
        className: getClass(SEARCH_CLASSES.SUGGESTION_ICON),
        container: item,
        html: suggestion.icon,
      });
    } else {
      // Default history icon for suggestions
      const iconElement = createElement({
        tag: "span",
        className: getClass(SEARCH_CLASSES.SUGGESTION_ICON),
        container: item,
        html: SEARCH_ICONS.HISTORY,
      });
    }

    // Add text with highlighted match
    const textElement = createElement({
      tag: "span",
      className: getClass(SEARCH_CLASSES.SUGGESTION_TEXT),
      container: item,
      html: highlightMatch(suggestion.text, query),
    });

    return item;
  };

  /**
   * Creates a divider element between suggestion groups
   */
  const createDivider = (): HTMLElement => {
    return createElement({
      tag: "li",
      className: getClass(SEARCH_CLASSES.SUGGESTION_DIVIDER),
      attributes: {
        role: "separator",
        "aria-hidden": "true",
      },
    });
  };

  /**
   * Renders all suggestions to the suggestions list
   */
  const renderSuggestions = (): void => {
    const suggestionsList = component.structure?.suggestionsList;
    if (!suggestionsList) return;

    const suggestions = getSuggestions();
    const query = component.input?.getValue?.() || "";

    // Clear existing content
    suggestionsList.innerHTML = "";

    if (suggestions.length === 0) {
      return;
    }

    let currentGroup: string | undefined;

    suggestions.forEach((suggestion, index) => {
      // Add divider between groups
      if (suggestion.group && suggestion.group !== currentGroup) {
        if (currentGroup !== undefined) {
          suggestionsList.appendChild(createDivider());
        }
        currentGroup = suggestion.group;
      }

      const item = createSuggestionItem(suggestion, index, query);

      // Click handler for suggestion selection
      item.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        selectSuggestion(index);
      });

      // Mouse enter to highlight
      item.addEventListener("mouseenter", () => {
        setHighlightedIndex(index);
      });

      suggestionsList.appendChild(item);
    });

    // Update ARIA attributes
    const visibleCount = suggestions.length;
    suggestionsList.setAttribute(
      "aria-label",
      `${visibleCount} suggestion${visibleCount !== 1 ? "s" : ""} available`
    );
  };

  /**
   * Clears the rendered suggestions
   */
  const clearRenderedSuggestions = (): void => {
    const suggestionsList = component.structure?.suggestionsList;
    if (suggestionsList) {
      suggestionsList.innerHTML = "";
    }
    highlightedIndex = -1;
  };

  /**
   * Sets the highlighted suggestion index
   */
  const setHighlightedIndex = (index: number): void => {
    const suggestionsList = component.structure?.suggestionsList;
    if (!suggestionsList) return;

    const suggestions = getSuggestions();

    // Clamp index to valid range
    if (index < -1) index = suggestions.length - 1;
    if (index >= suggestions.length) index = -1;

    // Remove previous highlight
    if (highlightedIndex >= 0) {
      const previousItem = suggestionsList.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (previousItem) {
        previousItem.classList.remove(
          getClass(SEARCH_CLASSES.SUGGESTION_ITEM_SELECTED)
        );
        previousItem.setAttribute("aria-selected", "false");
      }
    }

    highlightedIndex = index;

    // Add new highlight
    if (highlightedIndex >= 0) {
      const newItem = suggestionsList.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (newItem) {
        newItem.classList.add(
          getClass(SEARCH_CLASSES.SUGGESTION_ITEM_SELECTED)
        );
        newItem.setAttribute("aria-selected", "true");

        // Scroll into view if needed
        (newItem as HTMLElement).scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  };

  /**
   * Moves highlight to the next suggestion
   */
  const highlightNext = (): void => {
    setHighlightedIndex(highlightedIndex + 1);
  };

  /**
   * Moves highlight to the previous suggestion
   */
  const highlightPrevious = (): void => {
    setHighlightedIndex(highlightedIndex - 1);
  };

  /**
   * Selects the suggestion at the given index
   */
  const selectSuggestion = (index: number): void => {
    const suggestions = getSuggestions();

    if (index < 0 || index >= suggestions.length) return;

    const suggestion = suggestions[index];

    // Use input feature to handle selection
    if (component.input?.selectSuggestion) {
      component.input.selectSuggestion(suggestion);
    }

    // Collapse after selection (optional, based on config)
    if (component.states?.collapse) {
      component.states.collapse();
    }
  };

  /**
   * Selects the currently highlighted suggestion
   */
  const selectHighlighted = (): boolean => {
    if (highlightedIndex >= 0) {
      selectSuggestion(highlightedIndex);
      return true;
    }
    return false;
  };

  /**
   * Sets up keyboard navigation for suggestions
   */
  const setupKeyboardNavigation = (): void => {
    const input = component.structure?.input;
    if (!input) return;

    input.addEventListener("keydown", (e: KeyboardEvent) => {
      const suggestions = getSuggestions();
      const isExpanded = component.states?.isExpanded?.() || false;

      // Only handle if expanded and has suggestions
      if (!isExpanded || suggestions.length === 0) return;

      switch (e.key) {
        case SEARCH_KEYS.ARROW_DOWN:
          e.preventDefault();
          highlightNext();
          break;

        case SEARCH_KEYS.ARROW_UP:
          e.preventDefault();
          highlightPrevious();
          break;

        case SEARCH_KEYS.ENTER:
          // If a suggestion is highlighted, select it instead of submitting
          if (highlightedIndex >= 0) {
            e.preventDefault();
            selectHighlighted();
          }
          // Otherwise, let the input feature handle the submit
          break;

        case SEARCH_KEYS.TAB:
          // Select highlighted on tab if present
          if (highlightedIndex >= 0) {
            selectHighlighted();
          }
          break;

        case SEARCH_KEYS.ESCAPE:
          // Reset highlight, let input feature handle the rest
          highlightedIndex = -1;
          break;
      }
    });
  };

  // Initialize keyboard navigation after structure is ready
  setTimeout(() => {
    setupKeyboardNavigation();
  }, 0);

  // Return enhanced component with suggestions features
  return {
    ...component,

    suggestions: {
      /**
       * Renders the suggestions list
       */
      render: renderSuggestions,

      /**
       * Clears rendered suggestions
       */
      clear: clearRenderedSuggestions,

      /**
       * Sets the highlighted index
       */
      setHighlightedIndex,

      /**
       * Gets the current highlighted index
       */
      getHighlightedIndex: (): number => highlightedIndex,

      /**
       * Highlights the next suggestion
       */
      highlightNext,

      /**
       * Highlights the previous suggestion
       */
      highlightPrevious,

      /**
       * Selects a suggestion by index
       */
      select: selectSuggestion,

      /**
       * Selects the currently highlighted suggestion
       */
      selectHighlighted,
    },
  };
};
