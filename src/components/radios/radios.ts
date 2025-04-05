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
 * 
 * A Radios component provides a group of radio buttons that allows users to select
 * one option from a set. It supports vertical or horizontal layouts, disabled states,
 * and can be dynamically updated with new options.
 * 
 * @param {RadiosConfig} config - Radios configuration object
 * @returns {RadiosComponent} Radios component instance
 * 
 * @example
 * ```typescript
 * // Create a basic radio group
 * const genderOptions = fRadios({
 *   name: 'gender',
 *   options: [
 *     { value: 'male', label: 'Male' },
 *     { value: 'female', label: 'Female' },
 *     { value: 'other', label: 'Other' }
 *   ],
 *   value: 'female'
 * });
 * 
 * // Create a horizontal radio group with disabled options
 * const planSelection = fRadios({
 *   name: 'plan',
 *   direction: 'horizontal',
 *   options: [
 *     { value: 'basic', label: 'Basic' },
 *     { value: 'premium', label: 'Premium' },
 *     { value: 'enterprise', label: 'Enterprise', disabled: true }
 *   ]
 * });
 * 
 * // Listen for selection changes
 * planSelection.on('change', (event) => {
 *   console.log('Selected plan:', event.value);
 * });
 * ```
 */
const fRadios = (config: RadiosConfig): RadiosComponent => {
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

export default fRadios;