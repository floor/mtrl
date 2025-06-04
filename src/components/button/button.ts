// src/components/button/button.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withSize,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withProgress } from './features/progress';
import { withAPI } from './api';
import { ButtonConfig } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Button component with the specified configuration.
 * 
 * The Button component implements support for different variants, states, and features.
 * It follows accessibility best practices and provides a rich API for state management.
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
 * ```ts
 * // Create a button with integrated progress
 * const submitButton = createButton({
 *   text: 'Submit',
 *   variant: 'filled',
 *   progress: {
 *     variant: 'circular',
 *     size: 18,
 *     indeterminate: true
 *   }
 * });
 * 
 * // Create a square button with different sizes
 * const squareButton = createButton({
 *   text: 'Square Button',
 *   variant: 'tonal',
 *   shape: 'square',
 *   size: 'm'  // Square buttons have size-specific corner radius
 * });
 * 
 * // Synchronous usage (common for UI interactions)
 * submitButton.on('click', () => {
 *   submitButton.setLoadingSync(true, 'Submitting...');
 *   
 *   // Simulate async work
 *   setTimeout(() => {
 *     submitButton.setLoadingSync(false, 'Submit');
 *   }, 2000);
 * });
 * 
 * // Asynchronous usage (when you need to ensure progress is loaded)
 * submitButton.on('click', async () => {
 *   await submitButton.setLoading(true, 'Processing...');
 *   await submitButton.setProgress(50);
 *   // ... more async operations
 *   await submitButton.setLoading(false, 'Done');
 * });
 * ```
 * 
 * @category Components
 */
const createButton = (config: ButtonConfig = {}) => {
  const baseConfig = createBaseConfig(config);
  try {
    const button = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withSize(baseConfig),
      withText(baseConfig),
      withIcon(baseConfig),
      withDisabled(baseConfig),
      withProgress(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      (component) => {
        if (baseConfig.shape && component.element) {
          const className = `${baseConfig.prefix}-${baseConfig.componentName}--${baseConfig.shape}`;
          component.element.classList.add(className);
        }
        return component;
      },
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);
    return button;
  } catch (error) {
    console.error('Button creation error:', error);
    throw new Error(`Failed to create button: ${(error as Error).message}`);
  }
};

export default createButton;