// src/components/checkbox/checkbox.ts
/**
 * Checkbox Component Implementation
 * 
 * This module implements a Material Design 3 checkbox component
 * with support for different visual variants, indeterminate state,
 * and configurable label positioning.
 * 
 * @module components/checkbox
 * @category Components
 */

import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withTextLabel,
  withDisabled,
  withLifecycle,
  withInput,
  withCheckable
} from '../../core/compose/features';
import { withAPI } from './api';
import { CheckboxConfig, CheckboxComponent, BaseComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig, 
  withCheckIcon,
  withLabelPosition,
  getApiConfig
} from './config';

/**
 * Enhances a component with checkable features and indeterminate state support
 * 
 * The indeterminate state is a third visual state for checkboxes that represents
 * a mixed or partial selection (neither fully checked nor unchecked).
 * 
 * @param {BaseComponent} component - The component to enhance
 * @param {CheckboxConfig} config - Configuration options
 * @returns {BaseComponent} The enhanced component
 * @category Components
 * @internal
 */
const enhanceWithCheckable = (component: BaseComponent, config: CheckboxConfig): BaseComponent => {
  const enhanced = withCheckable(config)(component);

  // Set initial indeterminate state if specified in config
  if (config.indeterminate) {
    enhanced.input.indeterminate = true;
  }

  // Add method to control indeterminate state
  enhanced.setIndeterminate = (state: boolean) => {
    enhanced.input.indeterminate = state;
    enhanced.element.classList.toggle(`${config.prefix}-checkbox--indeterminate`, state);
    return enhanced;
  };

  return enhanced;
};

/**
 * Creates a new Checkbox component with the specified configuration.
 * 
 * Checkboxes allow users to select one or more items from a set,
 * or to toggle a single option on or off. This implementation follows
 * Material Design 3 guidelines for accessible, customizable checkboxes.
 * 
 * @param {CheckboxConfig} config - Configuration options for the checkbox
 * @returns {CheckboxComponent} A fully configured checkbox component instance
 * @throws {Error} Throws an error if checkbox creation fails
 * 
 * @category Components
 * 
 * @example
 * // Create a basic checkbox
 * const checkbox = fCheckbox({
 *   label: 'Accept terms and conditions',
 *   name: 'accept-terms'
 * });
 * 
 * document.querySelector('.form').appendChild(checkbox.element);
 * 
 * @example
 * // Create a pre-checked checkbox with custom styling
 * const checkbox = fCheckbox({
 *   label: 'Remember me',
 *   checked: true,
 *   variant: 'outlined',
 *   labelPosition: 'start'
 * });
 * 
 * // Add event listener
 * checkbox.on('change', (e) => {
 *   console.log('Checkbox changed:', e.target.checked);
 * });
 * 
 * @example
 * // Create an indeterminate checkbox for "select all" functionality
 * const selectAll = fCheckbox({
 *   label: 'Select All',
 *   indeterminate: true
 * });
 * 
 * // Later, based on selections:
 * if (allSelected) {
 *   selectAll.check();
 * } else if (noneSelected) {
 *   selectAll.uncheck();
 * } else {
 *   selectAll.setIndeterminate(true);
 * }
 */
const fCheckbox = (config: CheckboxConfig = {}): CheckboxComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create the checkbox through functional composition
    // Each function in the pipe adds specific features to the component
    const checkbox = pipe(
      createBase,                                            // Base component
      withEvents(),                                          // Event handling
      withElement(getElementConfig(baseConfig)),             // DOM element
      withInput(baseConfig),                                 // Input element
      withCheckIcon(baseConfig),                             // Checkbox icon
      withTextLabel(baseConfig),                             // Text label
      withLabelPosition(baseConfig),                         // Label positioning
      component => enhanceWithCheckable(component, baseConfig), // Checkable state
      withDisabled(baseConfig),                              // Disabled state
      withLifecycle(),                                       // Lifecycle management
      comp => withAPI(getApiConfig(comp))(comp)              // Public API
    )(baseConfig);

    return checkbox as CheckboxComponent;
  } catch (error) {
    console.error('Checkbox creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create checkbox: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default fCheckbox;