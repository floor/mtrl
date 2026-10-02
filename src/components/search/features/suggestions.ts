// src/components/search/features/suggestions.ts

import { SearchStructure, SearchSuggestion } from "../types";
import { SEARCH_CLASSES, SEARCH_KEYS, SEARCH_ICONS } from "../constants";
import { createElement } from "../../../core/dom/create";
import type { EventCallback } from "../../../core/state/emitter";

/**
 * Adds suggestion list features to the search component
 * Handles rendering suggestions and keyboard navigation per MD3 specifications
 *
 * @returns Component enhancer with suggestions features
 */
/** What this feature reads off the component it is handed. */
interface SuggestionsHost {
  getClass: (name: string) => string;
  // The input *feature's* API, not the element. Typed from what
  // search/features/input returns, so the two cannot drift.
  input?: {
    getValue: () => string;
    getSuggestions: () => SearchSuggestion[];
    // `SearchSuggestion`, not `SearchSuggestion | string`. The producer in
    // features/input.ts takes only the object, and the one call site below
    // passes an element of `getSuggestions()`, which is `SearchSuggestion[]`.
    // A host declaring the wider union promises to hand the producer a plain
    // string, which it cannot take -- contravariant and unsound, and the
    // second of the two roots behind search's cascade. FLO-114.
    selectSuggestion: (suggestion: SearchSuggestion) => void;
  };
  // SearchStructure, not a loose record: the record said
  // `HTMLElement | undefined` where the real thing has `HTMLElement | null`.
  structure?: SearchStructure;
  // The subset of search/features/states this file drives.
  states?: {
    collapse: () => void;
    isExpanded: () => boolean;
  };
  on?: (event: string, handler: EventCallback) => unknown;
}

export const withSuggestions =
  () =>
  // Generic, so the accumulated pipeline type survives to the features after
  // this one. A concrete parameter type would erase it — the defect fixed in
  // textfield's withDensity (#109).
  <C extends SuggestionsHost>(component: C) => {
  // State
  let highlightedIndex = -1;
  const currentSuggestions: SearchSuggestion[] = [];

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
  const highlightMatch = (text: string, query: string): Node[] => {
    if (!query) return [document.createTextNode(text)];

    const matchIndex = text.toLowerCase().indexOf(query.toLowerCase());
    if (matchIndex === -1) return [document.createTextNode(text)];

    const strong = document.createElement("strong");
    strong.textContent = text.slice(matchIndex, matchIndex + query.length);

    return [
      document.createTextNode(text.slice(0, matchIndex)),
      strong,
      document.createTextNode(text.slice(matchIndex + query.length)),
    ];
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

    const listId = component.structure?.suggestionsList?.id;
    const item = createElement({
      tag: "li",
      className: itemClasses.join(" "),
      attributes: {
        ...(listId && { id: `${listId}-${index}` }),
        role: "option",
        "aria-selected": isHighlighted ? "true" : "false",
        "data-index": String(index),
        "data-value": suggestion.value ?? suggestion.text,
        tabindex: "-1",
      },
    });

    // Add icon if present
    if (suggestion.icon) {
      createElement({
        tag: "span",
        className: getClass(SEARCH_CLASSES.SUGGESTION_ICON),
        container: item,
        html: suggestion.icon,
      });
    } else {
      // Default history icon for suggestions
      createElement({
        tag: "span",
        className: getClass(SEARCH_CLASSES.SUGGESTION_ICON),
        container: item,
        html: SEARCH_ICONS.HISTORY,
      });
    }

    // Add text with highlighted match
    // Nodes, not markup: the query and the suggestion label are both untrusted, and
    // this fed them through `html` into innerHTML.
    const label = createElement({
      tag: "span",
      className: getClass(SEARCH_CLASSES.SUGGESTION_TEXT),
      container: item,
    });
    label.append(...highlightMatch(suggestion.text, query));

    // A second line: M3's two-line list item (FLO-291). Text, not markup.
    if (suggestion.supportingText) {
      item.classList.add(getClass(`${SEARCH_CLASSES.SUGGESTION_ITEM}--two-line`));
      const supporting = createElement({ tag: "span", className: getClass(SEARCH_CLASSES.SUGGESTION_SUPPORTING), container: label });
      supporting.textContent = suggestion.supportingText;
    }

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
    suggestionsList.replaceChildren();
    // The list is drawn anew with nothing highlighted.
    highlightedIndex = -1;
    component.structure?.input.removeAttribute("aria-activedescendant");
    // The count is announced as it changes, while the list shows (FLO-286).
    const status = component.structure?.status;
    const count = suggestions.length;
    if (status) status.textContent = count && component.states?.isExpanded() ? `${count} suggestion${count === 1 ? "" : "s"}` : "";

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

      // Hover is only a look (:hover). It set the keyboard highlight, which Tab
      // and Enter act on, so a list opening under a still pointer had a
      // suggestion chosen by the next Tab. FLO-285.

      suggestionsList.appendChild(item);
    });

  };

  /**
   * Clears the rendered suggestions
   */
  const clearRenderedSuggestions = (): void => {
    const suggestionsList = component.structure?.suggestionsList;
    if (suggestionsList) {
      suggestionsList.replaceChildren();
    }
    highlightedIndex = -1;
    component.structure?.input.removeAttribute("aria-activedescendant");
    if (component.structure?.status) component.structure.status.textContent = "";
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

    // The combobox points at the highlighted option, or at none.
    const input = component.structure?.input;
    const newItem = highlightedIndex >= 0 ? suggestionsList.querySelector(`[data-index="${highlightedIndex}"]`) : null;
    if (newItem?.id) input?.setAttribute("aria-activedescendant", newItem.id);
    else input?.removeAttribute("aria-activedescendant");

    // Add new highlight
    if (highlightedIndex >= 0) {
      if (newItem) {
        newItem.classList.add(
          getClass(SEARCH_CLASSES.SUGGESTION_ITEM_SELECTED)
        );
        newItem.setAttribute("aria-selected", "true");

        // Scroll into view if needed. No `behavior`: the list's stylesheet
        // scrolls it smoothly, and the reduced-motion reset turns that off
        // (FLO-553).
        (newItem as HTMLElement).scrollIntoView({ block: "nearest" });
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

  // Initialize keyboard navigation after structure is ready. Suggestions given
  // in config were stored and never drawn -- rendering only happened inside the
  // public setSuggestions() -- so draw them here too, and again whenever the
  // view opens, so the open list always shows the current suggestions.
  setTimeout(() => {
    setupKeyboardNavigation();
    if (getSuggestions().length > 0) renderSuggestions();
  }, 0);
  component.on?.("expand", () => renderSuggestions());

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
