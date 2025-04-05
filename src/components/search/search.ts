// src/components/search/search.ts
import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withStructure, withSearch, withStates } from './features';
import { withAPI } from './api';
import { SearchConfig, SearchComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Search component
 * 
 * A Search component provides a user interface for search input with features 
 * such as clear button, input validation, results display, and various states
 * including focus, hover, and disabled.
 * 
 * @param {SearchConfig} config - Search configuration object
 * @returns {SearchComponent} Search component instance
 * 
 * @example
 * ```typescript
 * // Create a basic search component
 * const search = fSearch({
 *   placeholder: 'Search products...',
 *   clearable: true
 * });
 * 
 * // Create a search with event handlers
 * const advancedSearch = fSearch({
 *   placeholder: 'Enter keywords',
 *   icon: 'search',
 *   on: {
 *     input: (event) => console.log('Input:', event.value),
 *     submit: (event) => performSearch(event.value),
 *     clear: () => resetResults()
 *   }
 * });
 * 
 * // Listen for search events
 * search.on('submit', (event) => {
 *   fetchResults(event.value);
 * });
 * ```
 */
const fSearch = (config: SearchConfig = {}): SearchComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component with all required features
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withStructure(baseConfig),
      withStates(baseConfig),
      withSearch(baseConfig),
      withLifecycle()
    )(baseConfig);
    
    // Generate the API configuration
    const apiOptions = getApiConfig(component);
    
    // Apply the API layer
    const search = withAPI(apiOptions)(component);

    // Register event handlers from config
    if (baseConfig.on && typeof search.on === 'function') {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === 'function') {
          search.on(event, handler);
        }
      });
    }

    return search;
  } catch (error) {
    console.error('Search creation error:', error);
    throw new Error(`Failed to create search: ${(error as Error).message}`);
  }
};

export default fSearch;