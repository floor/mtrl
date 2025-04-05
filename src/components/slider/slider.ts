// src/components/slider/slider.ts
import { pipe } from '../../core/compose/pipe';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withLayout, withIcon, withLabel, withDom  } from '../../core/composition/features';
import { 
  withRange,
  withStates,
  withController
} from './features';
import { withAPI } from './api';
import { SliderConfig, SliderComponent } from './types';
import { createBaseConfig, getApiConfig } from './config';

/**
 * Creates a new Slider component
 * 
 * A Slider component provides an input control for selecting values from a range.
 * It can be configured with various options including range selection, tick marks,
 * custom icons, minimum and maximum values, and step size.
 * 
 * Slider follows a clear architectural pattern:
 * 1. Structure definition - Describes the DOM structure declaratively
 * 2. Feature enhancement - Adds specific capabilities (range, icons, labels)
 * 3. DOM creation - Turns the structure into actual DOM elements
 * 4. State management - Handles visual states and appearance
 * 5. Controller - Manages behavior, events, and UI rendering
 * 6. Lifecycle - Handles component lifecycle events
 * 7. Public API - Exposes a clean, consistent API
 *
 * @param {SliderConfig} config - Slider configuration object
 * @returns {SliderComponent} Slider component instance
 * 
 * @example
 * ```typescript
 * // Create a basic slider
 * const volumeSlider = fSlider({
 *   min: 0,
 *   max: 100,
 *   value: 50,
 *   label: 'Volume'
 * });
 * 
 * // Create a range slider with custom configuration
 * const priceRange = fSlider({
 *   min: 0,
 *   max: 1000,
 *   step: 10,
 *   range: true,
 *   value: [200, 500],
 *   showTickMarks: true,
 *   tickInterval: 100,
 *   label: 'Price Range',
 *   valueDisplay: (val) => `$${val}`
 * });
 * 
 * // Listen for value changes
 * volumeSlider.on('change', (event) => {
 *   console.log('New volume:', event.value);
 * });
 * ```
 */
const fSlider = (config: SliderConfig = {}): SliderComponent => {
  // Process configuration with defaults
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component by composing features in a specific order
    const component = pipe(
      // Base component with event system
      createBase,
      withEvents(),
      withLayout(baseConfig),
      withIcon(baseConfig),
      withLabel(baseConfig),
      withRange(baseConfig),
      
      // Now create the actual DOM elements from the complete structure
      withDom(),
      
      // Add state management and behavior
      withStates(baseConfig),
      withController(baseConfig),
      withLifecycle()
    )(baseConfig);
    
    // Generate the API configuration based on the enhanced component
    const apiOptions = getApiConfig(component);
    
    // Apply the public API layer
    const slider = withAPI(apiOptions)(component);

    // Register event handlers from config for convenience
    if (baseConfig.on && typeof slider.on === 'function') {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === 'function') {
          slider.on(event, handler);
        }
      });
    }

    return slider;
  } catch (error) {
    console.error('Slider creation error:', error);
    throw new Error(`Failed to create slider: ${(error as Error).message}`);
  }
};

export default fSlider;