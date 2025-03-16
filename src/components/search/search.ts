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
 * @param {SearchConfig} config - Search configuration object
 * @returns {SearchComponent} Search component instance
 */
const createSearch = (config: SearchConfig = {}): SearchComponent => {
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

export default createSearch;