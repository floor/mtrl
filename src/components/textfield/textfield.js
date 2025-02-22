// src/components/textfield/textfield.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withSize,
  withTextInput,
  withTextLabel
} from '../../core/compose/features'
import { withAPI } from './api'
import { TEXTFIELD_VARIANTS } from './constants'

/**
 * Creates a new Textfield component
 * @param {Object} config - Textfield configuration
 * @param {string} [config.type] - Input type (text, password, email, etc.)
 * @param {string} [config.variant] - Visual variant (filled, outlined)
 * @param {string} [config.size] - Size variant (small, medium, large)
 * @param {string} [config.name] - Input name attribute
 * @param {string} [config.label] - Label text
 * @param {string} [config.placeholder] - Placeholder text
 * @param {string} [config.value] - Initial value
 * @param {boolean} [config.required] - Whether the input is required
 * @param {boolean} [config.disabled] - Whether the input is disabled
 * @param {number} [config.maxLength] - Maximum input length
 * @param {string} [config.pattern] - Input pattern for validation
 * @param {string} [config.autocomplete] - Autocomplete attribute
 * @param {string} [config.class] - Additional CSS classes
 * @returns {Object} Textfield component instance
 */
const createTextfield = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'textfield',
    prefix: PREFIX,
    variant: config.variant || TEXTFIELD_VARIANTS.FILLED
  }

  try {
    return pipe(
      createBase,
      withEvents(),
      withElement({
        tag: 'div',
        componentName: 'textfield',
        className: config.class
      }),
      withVariant(baseConfig),
      withSize(baseConfig),
      withTextInput(baseConfig),
      withTextLabel(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI({
        disabled: comp.disabled,
        lifecycle: comp.lifecycle
      })(comp)
    )(baseConfig)
  } catch (error) {
    throw new Error(`Failed to create textfield: ${error.message}`)
  }
}

export default createTextfield
