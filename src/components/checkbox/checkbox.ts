// src/components/checkbox/checkbox.ts
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
 * Enhances a component with checkable features and indeterminate state
 * @param {BaseComponent} component - The component to enhance
 * @param {CheckboxConfig} config - Configuration options
 * @returns {BaseComponent} The enhanced component
 */
const enhanceWithCheckable = (component: BaseComponent, config: CheckboxConfig): BaseComponent => {
  const enhanced = withCheckable(config)(component);

  // Add indeterminate state handling
  if (config.indeterminate) {
    enhanced.input.indeterminate = true;
  }

  enhanced.setIndeterminate = (state: boolean) => {
    enhanced.input.indeterminate = state;
    enhanced.element.classList.toggle(`${config.prefix}-checkbox--indeterminate`, state);
    return enhanced;
  };

  return enhanced;
};

/**
 * Creates a new Checkbox component
 * @param {CheckboxConfig} config - Checkbox configuration
 * @returns {CheckboxComponent} Checkbox component instance
 */
const createCheckbox = (config: CheckboxConfig = {}): CheckboxComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const checkbox = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withInput(baseConfig),
      withCheckIcon(baseConfig),
      withTextLabel(baseConfig),
      withLabelPosition(baseConfig),
      component => enhanceWithCheckable(component, baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return checkbox as CheckboxComponent;
  } catch (error) {
    console.error('Checkbox creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create checkbox: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createCheckbox;