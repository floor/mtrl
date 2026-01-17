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
import { SearchConfig, SearchComponent } from "./types";
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
 *   onSubmit: (value) => console.log('Search:', value)
 * });
 *
 * // Search with suggestions
 * const search = createSearch({
 *   placeholder: 'Search...',
 *   suggestions: ['Apple', 'Banana', 'Cherry'],
 *   onSuggestionSelect: (suggestion) => console.log('Selected:', suggestion)
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
    // Build the component using functional composition
    // Order matters: structure -> states -> input -> suggestions
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withStructure(baseConfig),
      withStates(baseConfig),
      withInput(baseConfig),
      withSuggestions(baseConfig),
      withLifecycle(),
    )(baseConfig);

    // Generate the API configuration from component features
    const apiOptions = getApiConfig(component);

    // Apply the public API layer
    const search = withAPI(apiOptions)(component);

    // Register event handlers from config
    if (baseConfig.on && typeof search.on === "function") {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === "function") {
          search.on(event as Parameters<typeof search.on>[0], handler);
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
