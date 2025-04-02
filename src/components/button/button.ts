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
 * The Button component implements the Material Design 3 Button component guidelines
 * with support for different variants, states, and features. It follows accessibility
 * best practices and provides a rich API for state management.
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
 * @category Components
 * 
 * @example
 * // Create a simple text button
 * const textButton = createButton({ text: 'Click me' });
 * document.body.appendChild(textButton.element);
 * 
 * @example
 * // Create a filled button with an icon
 * const primaryButton = createButton({ 
 *   text: 'Submit',
 *   variant: 'filled',
 *   icon: '<svg>...</svg>'
 * });
 * 
 * // Add a click event handler
 * primaryButton.on('click', () => {
 *   console.log('Button clicked');
 * });
 * 
 * @example
 * // Create an outlined button with event handling
 * const submitButton = createButton({
 *   text: 'Save',
 *   variant: 'outlined'
 * });
 * 
 * submitButton.on('click', async () => {
 *   submitButton.disable(); // Disable during async operation
 *   await saveData();
 *   submitButton.enable();  // Re-enable when done
 * });
 * 
 * @example
 * // Create an icon-only button (circular)
 * const iconButton = createButton({
 *   icon: '<svg>...</svg>',
 *   ariaLabel: 'Add to favorites', // Important for accessibility
 *   variant: 'filled'
 * });
 * 
 * @example
 * // Create a disabled button
 * const disabledButton = createButton({
 *   text: 'Not available',
 *   disabled: true
 * });
 * 
 * // Later, enable the button when available
 * disabledButton.enable();
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