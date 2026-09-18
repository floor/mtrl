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
  withCheckable,
  InputComponent
} from '../../core/compose/features';
import { TextLabelConfig } from '../../core/compose/features/textlabel';
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
 * @param {BaseComponent & InputComponent} component - The component to enhance
 * @param {CheckboxConfig} config - Configuration options
 * @returns {BaseComponent} The enhanced component
 * @category Components
 * @internal
 */
const enhanceWithCheckable = (component: BaseComponent & InputComponent, config: CheckboxConfig): BaseComponent => {
  const enhanced = withCheckable(config)(component);

  // The class is derived from the input, never set on its own. The input is the
  // only thing a browser keeps current: a user click clears `indeterminate`
  // natively, and setting the property from config does not touch the class.
  // Toggling the class separately let the two drift in both directions.
  const syncIndeterminate = () => {
    enhanced.element.classList.toggle(
      `${config.prefix}-checkbox--indeterminate`,
      enhanced.input.indeterminate,
    );
  };

  // Set initial indeterminate state if specified in config
  if (config.indeterminate) {
    enhanced.input.indeterminate = true;
  }
  syncIndeterminate();

  // A click has already cleared the property by the time change is emitted.
  enhanced.on?.('change', syncIndeterminate);

  // Add method to control indeterminate state
  enhanced.setIndeterminate = (state: boolean) => {
    enhanced.input.indeterminate = state;
    syncIndeterminate();
    return enhanced;
  };

  // Programmatic check/uncheck/toggle (and setValue, which uses them) must
  // clear mixed state the way a click does. A caller who wants mixed sets it
  // afterwards with setIndeterminate(true).
  const clearIndeterminate = () => {
    if (enhanced.input.indeterminate) {
      enhanced.input.indeterminate = false;
      syncIndeterminate();
    }
  };

  const { checkable } = enhanced;
  if (checkable) {
    const { check, uncheck, toggle } = checkable;
    checkable.check = () => {
      clearIndeterminate();
      return check.call(checkable);
    };
    checkable.uncheck = () => {
      clearIndeterminate();
      return uncheck.call(checkable);
    };
    checkable.toggle = () => {
      clearIndeterminate();
      return toggle.call(checkable);
    };
  }

  return enhanced as unknown as BaseComponent;
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
 * const checkbox = createCheckbox({
 *   label: 'Accept terms and conditions',
 *   name: 'accept-terms'
 * });
 * 
 * document.querySelector('.form').appendChild(checkbox.element);
 * 
 * @example
 * // Create a pre-checked checkbox with custom styling
 * const checkbox = createCheckbox({
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
 * const selectAll = createCheckbox({
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
const createCheckbox = (config: CheckboxConfig = {}): CheckboxComponent => {
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
      withTextLabel(baseConfig as TextLabelConfig),          // Text label
      withLabelPosition(baseConfig),                         // Label positioning
      component => enhanceWithCheckable(component as BaseComponent & InputComponent, baseConfig), // Checkable state
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

export default createCheckbox;