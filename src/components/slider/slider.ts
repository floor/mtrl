// src/components/slider/slider.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { 
  withStructure, 
  withDisabled,
  withAppearance,
  withSlider
} from './features';
import { withAPI } from './api';
import { SliderConfig, SliderComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Slider component
 * @param {SliderConfig} config - Slider configuration object
 * @returns {SliderComponent} Slider component instance
 */
const createSlider = (config: SliderConfig = {}): SliderComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const slider = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withStructure(baseConfig),
      withDisabled(baseConfig),
      withAppearance(baseConfig),
      withSlider(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Register event handlers from config
    if (baseConfig.on) {
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