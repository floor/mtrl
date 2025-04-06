// src/components/chips/chips.ts
import { pipe } from '../../core/compose/pipe';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withLayout, withIcon, withLabel, withDom  } from '../../core/composition/features';
import { 
  withContainer,
  withChipItems,
  withController,
  withLabel
} from './features';
import { withAPI } from './api';
import { ChipsConfig, ChipsComponent } from './types';
import { createBaseConfig, getApiConfig } from './config';

/**
 * Creates a chips container for grouping related chips
 * 
 * Chips follows a clear architectural pattern:
 * 1. Structure definition - Describes the DOM structure declaratively
 * 2. Feature enhancement - Adds specific capabilities (container, items, etc.)
 * 3. DOM creation - Turns the structure into actual DOM elements
 * 4. Controller - Manages behavior, events, and UI rendering
 * 5. Lifecycle - Handles component lifecycle events
 * 6. Public API - Exposes a clean, consistent API
 *
 * @param {ChipsConfig} config - Chips configuration object
 * @returns {ChipsComponent} Chips component instance
 */
const createChips = (config: ChipsConfig = {}): ChipsComponent => {
  // Process configuration with defaults
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component by composing features in a specific order
    const component = pipe(
      // Base component with event system
      createBase,
      withEvents(),
      withLayout(baseConfig),
      withContainer(baseConfig),
      withLabel(baseConfig),
      withChipItems(baseConfig),
      
      // Now create the actual DOM elements from the complete structure
      withDom(),
      
      // Add state management and behavior
      withController(baseConfig),
      withLifecycle()
    )(baseConfig);
    
    // Generate the API configuration based on the enhanced component
    const apiOptions = getApiConfig(component);
    
    // Apply the public API layer
    const chips = withAPI(apiOptions)(component);

    // Register event handlers from config for convenience
    if (baseConfig.on && typeof chips.on === 'function') {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === 'function') {
          chips.on(event, handler);
        }
      });
    }

    return chips;
  } catch (error) {
    console.error('Chips creation error:', error);
    throw new Error(`Failed to create chip: ${(error as Error).message}`);
  }
};

export default createChips;