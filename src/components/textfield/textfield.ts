// src/components/textfield/textfield.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withTextInput,
  withTextLabel,
} from "../../core/compose/features";
import { withAPI } from "./api";
import {
  withLeadingIcon,
  withTrailingIcon,
  withSupportingText,
  withPrefixText,
  withSuffixText,
  withPlacement,
  withDensity,
} from "./features";
import { TextfieldConfig, TextfieldComponent } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

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
    // Build textfield through functional composition
    // Each function in the pipe adds specific capabilities
    const textfield = pipe(
      createBase, // Base component structure
      withEvents(), // Event handling system
      withElement(getElementConfig(baseConfig)), // Create DOM element
      withVariant(baseConfig), // Apply variant styling (filled/outlined)
      withDensity(baseConfig), // Apply density level
      withTextInput(baseConfig), // Add input element
      withTextLabel(baseConfig), // Add text label
      withLeadingIcon(baseConfig), // Add leading icon (if specified)
      withTrailingIcon(baseConfig), // Add trailing icon (if specified)
      withPrefixText(baseConfig), // Add prefix text (if specified)
      withSuffixText(baseConfig), // Add suffix text (if specified)
      withSupportingText(baseConfig), // Add supporting/helper text (if specified)
      withDisabled(baseConfig), // Add disabled state management
      withLifecycle(), // Add lifecycle management
      withPlacement(), // Add dynamic positioning for elements
      (comp) => withAPI(getApiConfig(comp))(comp) // Add public API
    )(baseConfig);

    return textfield as TextfieldComponent;
  } catch (error) {
    console.error(
      "Textfield creation error:",
      error instanceof Error ? error.message : String(error)
    );
    throw new Error(
      `Failed to create textfield: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export default createTextfield;
