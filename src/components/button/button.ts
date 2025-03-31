// src/components/button/button.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { ButtonConfig } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Button component with the specified configuration.
 * 
 * The Button component is created using a functional composition pattern,
 * applying various features through the pipe function. This approach allows
 * for flexible and modular component construction.
 * 
 * @param {ButtonConfig} config - Configuration options for the button
 *  This can include text content, icon options, variant styling, disabled state, 
 *  and other button properties. See {@link ButtonConfig} for available options.
 * 
 * @returns {ButtonComponent} A fully configured button component instance with
 *  all requested features applied. The returned component has methods for
 *  manipulation, event handling, and lifecycle management.
 * 
 * @throws {Error} Throws an error if button creation fails for any reason
 * 
 * @example
 * // Create a simple text button
 * const textButton = createButton({ text: 'Click me' });
 * 
 * @example
 * // Create a primary button with an icon
 * const primaryButton = createButton({ 
 *   text: 'Submit',
 *   variant: 'primary',
 *   icon: 'send'
 * });
 * 
 * @example
 * // Create a disabled button
 * const disabledButton = createButton({
 *   text: 'Not available',
 *   disabled: true
 * });
 */
const createButton = (config: ButtonConfig = {}) => {
  const baseConfig = createBaseConfig(config);
  try {
    const button = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withText(baseConfig),
      withIcon(baseConfig),
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);
    return button;
  } catch (error) {
    console.error('Button creation error:', error);
    throw new Error(`Failed to create button: ${(error as Error).message}`);
  }
};

export default createButton;