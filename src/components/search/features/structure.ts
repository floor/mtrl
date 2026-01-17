// src/components/search/features/structure.ts

import { SearchConfig, SearchStructure } from "../types";
import { SEARCH_CLASSES, SEARCH_ICONS, SEARCH_STATES } from "../constants";
import { createElement } from "../../../core/dom/create";

/**
 * Creates the search component DOM structure following MD3 specifications
 *
 * Structure:
 * - search (root)
 *   - search__container (header/bar area)
 *     - search__leading-icon
 *     - search__input-wrapper
 *       - search__input
 *     - search__clear-button (conditional)
 *     - search__trailing-icon(s) (conditional)
 *     - search__avatar (conditional)
 *   - search__divider (view mode only)
 *   - search__content (view mode only)
 *     - search__suggestions
 *
 * @param config Search configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SearchConfig) => (component) => {
  const isDisabled = config.disabled === true;
  const initialState = config.initialState || SEARCH_STATES.BAR;
  const isViewState = initialState === SEARCH_STATES.VIEW;
  const placeholder = config.placeholder || "Search";
  const value = config.value || "";

  // Helper to get prefixed class names
  const getClass = (className: string): string => {
    return component.getClass ? component.getClass(className) : className;
  };

  // Build root element classes
  const rootClasses = [
    getClass(SEARCH_CLASSES.ROOT),
    getClass(
      initialState === SEARCH_STATES.BAR
        ? SEARCH_CLASSES.STATE_BAR
        : SEARCH_CLASSES.STATE_VIEW,
    ),
    getClass(
      config.viewMode === "fullscreen"
        ? SEARCH_CLASSES.VIEW_FULLSCREEN
        : SEARCH_CLASSES.VIEW_DOCKED,
    ),
  ];

  if (config.fullWidth) {
    rootClasses.push(getClass(SEARCH_CLASSES.FULL_WIDTH));
  }

  if (isDisabled) {
    rootClasses.push(getClass(SEARCH_CLASSES.DISABLED));
  }

  if (value) {
    rootClasses.push(getClass(SEARCH_CLASSES.POPULATED));
  }

  // Apply classes to root element
  component.element.className = rootClasses.filter(Boolean).join(" ");
  component.element.setAttribute("role", "search");
  component.element.setAttribute(
    "aria-disabled",
    isDisabled ? "true" : "false",
  );

  // Create container (header in view mode, bar in bar mode)
  const container = createElement({
    tag: "div",
    className: getClass(SEARCH_CLASSES.CONTAINER),
    container: component.element,
  });

  // Create leading icon (search icon in bar, back arrow in view)
  const leadingIconHtml = isViewState
    ? SEARCH_ICONS.BACK
    : config.leadingIcon || SEARCH_ICONS.SEARCH;

  const leadingIcon = createElement({
    tag: "button",
    className: getClass(SEARCH_CLASSES.LEADING_ICON),
    container,
    html: leadingIconHtml,
    attributes: {
      type: "button",
      tabindex: isDisabled ? "-1" : "0",
      "aria-label": isViewState ? "Go back" : "Search",
    },
  });

  // Create input wrapper
  const inputWrapper = createElement({
    tag: "div",
    className: getClass(SEARCH_CLASSES.INPUT_WRAPPER),
    container,
  });

  // Create input element
  const inputAttributes: Record<string, string> = {
    type: "text",
    placeholder,
    "aria-label": placeholder,
  };

  if (value) {
    inputAttributes.value = value;
  }

  if (isDisabled) {
    inputAttributes.disabled = "disabled";
  }

  const input = createElement({
    tag: "input",
    className: getClass(SEARCH_CLASSES.INPUT),
    container: inputWrapper,
    attributes: inputAttributes,
  }) as HTMLInputElement;

  // Set value programmatically (more reliable than attribute)
  if (value) {
    input.value = value;
  }

  // Create clear button (hidden when no value)
  let clearButton: HTMLElement | null = null;

  if (config.showClearButton !== false) {
    const clearButtonClasses = [getClass(SEARCH_CLASSES.CLEAR_BUTTON)];

    if (!value) {
      clearButtonClasses.push(getClass(SEARCH_CLASSES.CLEAR_BUTTON_HIDDEN));
    }

    clearButton = createElement({
      tag: "button",
      className: clearButtonClasses.join(" "),
      container,
      html: SEARCH_ICONS.CLEAR,
      attributes: {
        type: "button",
        tabindex: isDisabled || !value ? "-1" : "0",
        "aria-label": "Clear search",
      },
    });
  }

  // Create trailing items container (for icons and avatar)
  let trailingContainer: HTMLElement | null = null;

  if (config.trailingItems && config.trailingItems.length > 0) {
    trailingContainer = createElement({
      tag: "div",
      className: getClass("search__trailing"),
      container,
    });

    // Render each trailing item
    config.trailingItems.forEach((item) => {
      const itemClass =
        item.type === "avatar"
          ? getClass(SEARCH_CLASSES.AVATAR)
          : getClass(SEARCH_CLASSES.TRAILING_ICON);

      createElement({
        tag: item.type === "avatar" ? "div" : "button",
        className: itemClass,
        container: trailingContainer!,
        html: item.content,
        attributes: {
          ...(item.type !== "avatar" && { type: "button" }),
          tabindex: isDisabled ? "-1" : "0",
          "aria-label": item.ariaLabel || "",
          "data-trailing-id": item.id,
        },
      });
    });
  }

  // Create divider and content area (for view state or when suggestions are provided)
  let divider: HTMLElement | null = null;
  let contentArea: HTMLElement | null = null;
  let suggestionsContainer: HTMLElement | null = null;
  let suggestionsList: HTMLElement | null = null;

  // Always create the content structure for potential expansion
  // but only show it in view state
  divider = createElement({
    tag: "div",
    className: getClass(SEARCH_CLASSES.DIVIDER),
  });

  contentArea = createElement({
    tag: "div",
    className: getClass(SEARCH_CLASSES.CONTENT),
  });

  suggestionsContainer = createElement({
    tag: "div",
    className: getClass(SEARCH_CLASSES.SUGGESTIONS),
    container: contentArea,
  });

  suggestionsList = createElement({
    tag: "ul",
    className: getClass(SEARCH_CLASSES.SUGGESTION_LIST),
    container: suggestionsContainer,
    attributes: {
      role: "listbox",
      "aria-label": "Search suggestions",
    },
  });

  // Only append to DOM if in view state initially
  if (isViewState) {
    component.element.appendChild(divider);
    component.element.appendChild(contentArea);
  }

  // Build structure object
  const structure: SearchStructure = {
    container,
    input,
    inputWrapper,
    leadingIcon,
    clearButton,
    trailingContainer,
    divider,
    suggestionsContainer,
    suggestionsList,
  };

  // Return enhanced component with structure
  return {
    ...component,
    structure,
  };
};
