// src/components/radios/radios.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withDisabled, withLifecycle } from '../../core/compose/features';
import { withRadio } from './radio';
import { withAPI } from './api';
import { RadiosConfig, RadiosComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Radios component
 * @param {RadiosConfig} config - Radios configuration object
 * @returns {RadiosComponent} Radios component instance
 */
const createRadios = (config: RadiosConfig): RadiosComponent => {
  // Ensure name is provided
  if (!config.name) {
    config.name = `radios-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  const baseConfig = createBaseConfig(config);

  try {
    // First add events support before radio functionality
    const radios = pipe(
      createBase,
      withEvents(), // Make sure this runs first to provide events
      withElement(getElementConfig(baseConfig)),
      withRadio(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return radios as RadiosComponent;
  } catch (error) {
    console.error('Radios creation error:', error);
    throw new Error(`Failed to create radios component: ${(error as Error).message}`);
  }
};

export default createRadios;