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
  withSupportingText,
  withPrefixText,
  withSuffixText
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
 * Textfields allow users to enter text into a UI. They typically appear in forms and dialogs.
 * This implementation follows Material Design 3 guidelines for accessible, customizable textfields.
 * 
 * @param {TextfieldConfig} config - Textfield configuration options
 * @returns {TextfieldComponent} A fully configured textfield component instance
 * @throws {Error} Throws an error if textfield creation fails
 * 
 * @example
 * // Create a basic text field
 * const textfield = createTextfield({
 *   label: 'Username',
 *   name: 'username'
 * });
 * 
 * document.querySelector('.form').appendChild(textfield.element);
 * 
 * @example
 * // Create a text field with prefix and suffix
 * const currencyField = createTextfield({
 *   label: 'Amount',
 *   type: 'number',
 *   prefixText: '$',
 *   suffixText: 'USD'
 * });
 * 
 * // Add event listener
 * currencyField.on('input', (e) => {
 *   console.log('Amount entered:', e.target.value);
 * });
 */
const createTextfield = (config: TextfieldConfig = {}): TextfieldComponent => {
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
      withPrefixText(baseConfig),
      withSuffixText(baseConfig),
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

export default createTextfield;