// src/components/slider/slider.ts
import { pipe } from '../../core/compose/pipe';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle, withTextLabel, withIcon } from '../../core/compose/features';
import { withStructure, withSlider } from './features';
import { withStates } from './features/states';
import { withAPI } from './api';
import { SliderConfig, SliderComponent } from './types';
import { createBaseConfig, getApiConfig } from './config';

/**
 * Creates a new Slider component
 * @param {SliderConfig} config - Slider configuration object
 * @returns {SliderComponent} Slider component instance
 */
const createSlider = (config: SliderConfig = {}): SliderComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component with all required features
    // Note: No more withElement as withStructure handles element creation
    const component = pipe(
      createBase,
      withEvents(),
      withStructure(baseConfig),  // Creates the element and internal structure
      withIcon(baseConfig),
      withTextLabel(baseConfig),
      withStates(baseConfig),
      withSlider(baseConfig),
      withLifecycle()
    )(baseConfig);
    
    // Generate the API configuration
    const apiOptions = getApiConfig(component);
    
    // Apply the API layer
    const slider = withAPI(apiOptions)(component);

    // Register event handlers from config
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

export default createSlider;