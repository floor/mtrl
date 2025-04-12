// src/components/select/select.ts

import { pipe } from '../../core/compose';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withTextfield, withMenu } from './features';
import { withAPI } from './api';
import { SelectConfig, SelectComponent } from './types';
import { createBaseConfig, getApiConfig } from './config';

/**
 * Creates a new Select component with the specified configuration.
 * 
 * The Select component implements a Material Design dropdown select control,
 * combining a textfield and menu to provide a user-friendly selection interface.
 * 
 * @param {SelectConfig} config - Configuration options for the select
 *  This must include an array of selection options. See {@link SelectConfig} for all available options.
 * 
 * @returns {SelectComponent} A fully configured select component
 * 
 * @throws {Error} Throws an error if select creation fails
 * 
 * @example
 * // Create a simple country select
 * const countrySelect = createSelect({
 *   label: 'Country',
 *   options: [
 *     { id: 'us', text: 'United States' },
 *     { id: 'ca', text: 'Canada' },
 *     { id: 'mx', text: 'Mexico' }
 *   ],
 *   value: 'us' // Pre-select United States
 * });
 * 
 * // Add to the DOM
 * document.body.appendChild(countrySelect.element);
 * 
 * // Listen for changes
 * countrySelect.on('change', (event) => {
 *   console.log(`Selected: ${event.value} (${event.text})`);
 * });
 */
const createSelect = (config: SelectConfig): SelectComponent => {
  try {
    // Validate and create the base configuration
    const baseConfig = createBaseConfig(config);
    
    // Create the component through functional composition
    const select = pipe(
      createBase,
      withEvents(),
      withTextfield(baseConfig),
      withMenu(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);
    
    // Set up initial event handlers if provided
    if (config.on) {
      if (config.on.change) select.on('change', config.on.change);
      if (config.on.open) select.on('open', config.on.open);
      if (config.on.close) select.on('close', config.on.close);
    }
    
    return select;
  } catch (error) {
    console.error('Select creation error:', error);
    throw new Error(`Failed to create select: ${(error as Error).message}`);
  }
};

export default createSelect;