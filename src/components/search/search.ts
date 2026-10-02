// src/components/search/search.ts

import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import {
  withStructure,
  withStates,
  withInput,
  withSuggestions,
} from "./features";
import { withAPI } from "./api";
import { SearchConfig, SearchComponent, SearchEvents } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new Search component following Material Design 3 specifications
 *
 * The Search component provides:
 * - Search Bar: Collapsed state with pill shape (56dp height)
 * - Search View: Expanded state with suggestions (docked or fullscreen)
 *
 * @example
 * ```ts
 * // Basic search bar
 * const search = createSearch({
 *   placeholder: 'Search products...',
 *   onSubmit: (event) => console.log('Search:', event.value)
 * });
 *
 * // Search with suggestions
 * const search = createSearch({
 *   placeholder: 'Search...',
 *   suggestions: ['Apple', 'Banana', 'Cherry'],
 *   onSuggestionSelect: (event) => console.log('Selected:', event.suggestion)
 * });
 *
 * // Fullscreen search view (mobile)
 * const search = createSearch({
 *   viewMode: 'fullscreen',
 *   expandOnFocus: true
 * });
 * ```
 *
 * @param config Search configuration object
 * @returns Search component instance
 */
const createSearch = (config: SearchConfig = {}): SearchComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Getters defer callback targets until the public API exists.
    // Build the component using functional composition
    // Order matters: structure -> states -> input -> suggestions
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withStructure(baseConfig),
      withStates(baseConfig, (): SearchComponent => search),
      withInput(baseConfig, (): SearchComponent => search),
      withSuggestions(),
      withLifecycle(),
    )(baseConfig);

    // Generate the API configuration from component features
    const apiOptions = getApiConfig(component);

    // Apply the public API layer
    const search: SearchComponent = withAPI(apiOptions)(component);

    // A config on* option is the listener registered at creation, ahead of
    // the on map and of any listener the caller adds afterwards.
    if (baseConfig.onInput) search.on("input", baseConfig.onInput);
    if (baseConfig.onSubmit) search.on("submit", baseConfig.onSubmit);
    if (baseConfig.onClear) search.on("clear", baseConfig.onClear);
    if (baseConfig.onSuggestionSelect) search.on("suggestionSelect", baseConfig.onSuggestionSelect);
    if (baseConfig.onExpand) search.on("expand", baseConfig.onExpand);
    if (baseConfig.onCollapse) search.on("collapse", baseConfig.onCollapse);

    // Register event handlers from config
    if (baseConfig.on && typeof search.on === "function") {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === "function") {
          search.on(event as keyof SearchEvents, handler);
        }
      });
    }

    return search;
  } catch (error) {
    console.error("Search creation error:", error);
    throw new Error(`Failed to create search: ${(error as Error).message}`);
  }
};

export default createSearch;
