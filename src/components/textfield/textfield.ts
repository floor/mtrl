// src/components/textfield/textfield.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withTextInput,
  withTextLabel
} from '../../core/compose/features';
import { withAPI } from './api';
import { 
  withLeadingIcon, 
  withTrailingIcon, 
  withSupportingText 
} from './features';
import { TextfieldConfig, TextfieldComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig,
  getApiConfig
} from './config';

/**
 * Creates a new Textfield component
 * 
 * A Textfield component provides an input field for users to enter and edit text,
 * following Material Design 3 guidelines. It supports various input types, visual
 * variants, and features like icons, labels, and supporting text.
 * 
 * @param {TextfieldConfig} config - Textfield configuration options
 * @returns {TextfieldComponent} Textfield component instance with methods for state management
 * 
 * @example
 * ```typescript
 * // Create a simple outlined text field
 * const emailField = fTextfield({
 *   label: 'Email Address',
 *   type: 'email',
 *   variant: 'outlined',
 *   required: true
 * });
 * 
 * // Create a password field with error state
 * const passwordField = fTextfield({
 *   label: 'Password',
 *   type: 'password',
 *   supportingText: 'Password must be at least 8 characters',
 *   error: true,
 *   trailingIcon: '<svg>...</svg>'
 * });
 * 
 * // Add event listeners
 * emailField.on('input', (event) => {
 *   console.log('Input value:', event.target.value);
 *   validateEmail(emailField.getValue());
 * });
 * 
 * // Programmatically set values and attributes
 * emailField.setValue('user@example.com');
 * emailField.setAttribute('autocomplete', 'email');
 * 
 * // Access the DOM elements
 * document.body.appendChild(emailField.element);
 * ```
 * 
 * @category Components
 */
const fTextfield = (config: TextfieldConfig = {}): TextfieldComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const textfield = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withTextInput(baseConfig),
      withTextLabel(baseConfig),
      withLeadingIcon(baseConfig),
      withTrailingIcon(baseConfig),
      withSupportingText(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return textfield as TextfieldComponent;
  } catch (error) {
    console.error('Textfield creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create textfield: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default fTextfield;